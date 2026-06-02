import { Router, Request, Response } from 'express';
import { RAGService } from '../services/ragService';
import { sessionRateLimiter } from '../middleware/rateLimiter';
import { winstonLogger } from '../middleware/logger';

const router = Router();

// Single shared RAGService instance — initializes the vector store once at startup.
// Keeping it module-level avoids re-loading the knowledge base on every request.
const ragService = new RAGService();

interface ChatRequest {
  query: string;
  sessionId?: string;
}

/**
 * POST /api/chat/stream
 *
 * Server-Sent Events (SSE) streaming endpoint.
 * Why SSE instead of WebSockets?
 *   - SSE is HTTP/1.1 compatible, works through standard load balancers/proxies
 *   - One-directional (server → client) is sufficient for streaming LLM tokens
 *   - No handshake overhead or connection state management
 *
 * Event format:
 *   data: {"type":"start"}                   ← signals stream began
 *   data: {"type":"token","token":"word"}    ← each streamed token
 *   data: {"type":"done"}                    ← stream completed cleanly
 *   data: {"type":"error","message":"..."}   ← error occurred mid-stream
 */
router.post('/stream', sessionRateLimiter, async (req: Request, res: Response) => {
  const { query, sessionId } = req.body as ChatRequest;

  // Input validation — reject before any expensive operations
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ error: 'query is required and must be a non-empty string' });
    return;
  }

  if (query.length > 1000) {
    res.status(400).json({ error: 'query exceeds maximum length of 1000 characters' });
    return;
  }

  // SSE headers — must be set before res.flushHeaders()
  // X-Accel-Buffering: no — disables Nginx proxy buffering so tokens arrive immediately
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Helper to write a well-formed SSE event line
  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    winstonLogger.info('Chat stream started', { sessionId, queryLength: query.length });

    sendEvent({ type: 'start' });

    // RAGService.streamResponse() is an AsyncGenerator — we iterate it here
    // and forward each token to the client as an SSE event.
    for await (const token of ragService.streamResponse(query)) {
      sendEvent({ type: 'token', token });
    }

    sendEvent({ type: 'done' });
    winstonLogger.info('Chat stream completed', { sessionId });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    winstonLogger.error('Chat stream error', { error: message, sessionId });
    // Send error as SSE event (not HTTP error status) because headers are already flushed
    sendEvent({ type: 'error', message });
  } finally {
    res.end();
  }
});

// GET /api/chat/health — used by frontend to confirm backend is reachable before first message
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'production',
    timestamp: new Date().toISOString()
  });
});

export { router as chatRouter };
