import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChatWindow } from './ChatWindow';
import './styles.css';

/**
 * ChatWidget — floating AI assistant button + chat window.
 *
 * ── Why React Portal? ───────────────────────────────────────────────────────
 * Rendering via createPortal into #chat-portal (outside #root) means this
 * component is NOT part of the Router's component tree. It therefore survives
 * route changes without unmounting — conversation state is preserved when the
 * user navigates between Dashboard and Fault Monitor.
 *
 * ── Lazy Initialization ─────────────────────────────────────────────────────
 * ChatWindow is only mounted on the first open (`hasBeenOpened` gate).
 * Before that, the widget is just a single FAB button — zero JS overhead,
 * no fetch calls, no state until the user actually needs diagnostics.
 *
 * ── Bundle Impact ───────────────────────────────────────────────────────────
 * This file is imported once in App.tsx. The ChatWindow subtree and the
 * useChat hook are lazy-evaluated (not mounted) until first interaction,
 * so they don't block the initial Dashboard render.
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // Gate: once true, ChatWindow stays mounted (just hidden/shown via isOpen).
  // This preserves conversation state between open/close cycles.
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  const handleOpen = useCallback(() => {
    setHasBeenOpened(true);  // trigger lazy mount on first click
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Note: we do NOT unmount ChatWindow here — that would lose the conversation.
  }, []);

  // Target the portal container defined in index.html
  const portal = document.getElementById('chat-portal');
  if (!portal) return null;

  return createPortal(
    <>
      {/* Floating Action Button — always visible, changes icon on open/close */}
      <button
        className="chat-fab"
        onClick={isOpen ? handleClose : handleOpen}
        aria-label={isOpen ? 'Close diagnostics chat' : 'Open diagnostics chat'}
      >
        {isOpen ? (
          // X icon when open
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Chat bubble icon when closed
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {/* Notification badge — visible only before first open to draw attention */}
        {!hasBeenOpened && <span className="chat-badge">!</span>}
      </button>

      {/* ChatWindow is only rendered after first open (lazy init).
          display:none equivalent is handled by conditional render —
          but once opened, it stays mounted to preserve messages. */}
      {hasBeenOpened && isOpen && (
        <ChatWindow onClose={handleClose} />
      )}
    </>,
    portal
  );
}
