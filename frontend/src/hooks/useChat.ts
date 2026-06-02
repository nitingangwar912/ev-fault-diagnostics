import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatState } from '../types/chat';

const SESSION_KEY = 'ev_diag_session_id';

// Generate or retrieve a stable session ID from sessionStorage.
// This persists for the browser tab lifetime — enables per-session rate limiting
// and structured logging on the backend without requiring user auth.
function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function makeId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * useChat — manages all conversation state and SSE streaming logic.
 *
 * Key design decisions:
 * - Uses the Fetch API (not EventSource) for streaming because EventSource
 *   only supports GET requests; our endpoint needs POST to carry the query body.
 * - Reads the SSE stream via ReadableStream + TextDecoder — works in all modern
 *   browsers without additional libraries.
 * - Optimistic UI: the assistant message is inserted immediately with isStreaming=true
 *   and updated in-place as tokens arrive, rather than appending after completion.
 */
export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  });

  const sessionId = useRef(getOrCreateSessionId());

  // AbortController ref lets us cancel an in-flight stream (e.g. user navigates away)
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || state.isLoading) return;

    // Build both messages upfront so we can insert them in a single state update,
    // preventing a render between "user message appears" and "AI bubble appears".
    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date()
    };

    const assistantMsgId = makeId();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',        // empty — will fill as tokens stream in
      timestamp: new Date(),
      isStreaming: true
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg, assistantMsg],
      isLoading: true,
      error: null
    }));

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId.current   // forwarded to backend for rate limiting + logging
        },
        body: JSON.stringify({ query: query.trim(), sessionId: sessionId.current }),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      // Partial-line buffer: a single `read()` chunk may contain multiple SSE events
      // or split an event across two chunks — we buffer until we see a complete line.
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'token' && event.token) {
              // Append token to the assistant message — React batches these
              // updates efficiently because we only change one message's content.
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + event.token }
                    : m
                )
              }));
            }
          } catch {
            // Malformed SSE line — skip silently
          }
        }
      }

      // Mark streaming complete — removes the blinking cursor in ChatMessage
      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: prev.messages.map(m =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      }));

    } catch (err) {
      // AbortError is expected when the user closes the widget mid-stream
      if ((err as Error).name === 'AbortError') return;

      const errorText = err instanceof Error ? err.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: prev.messages.map(m =>
          m.id === assistantMsgId
            ? { ...m, isStreaming: false, isError: true, content: `Error: ${errorText}` }
            : m
        ),
        error: errorText
      }));
    }
  }, [state.isLoading]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setState({ messages: [], isLoading: false, error: null });
  }, []);

  return { ...state, sendMessage, clearChat };
}
