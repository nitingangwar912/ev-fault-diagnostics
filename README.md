# EV Fault Diagnostics AI Assistant

A production-grade RAG (Retrieval-Augmented Generation) chatbot for EV charger fault diagnostics. Built with React, TypeScript, Node.js, LangChain patterns, and OpenAI — with a full **demo mode** that runs offline without an API key.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │  Dashboard  │   │ FaultMonitor │   │   ChatWidget        │  │
│  │  (Route /)  │   │ (Route /     │   │   (React Portal)    │  │
│  │             │   │  faults)     │   │   ↑ persists across │  │
│  └─────────────┘   └──────────────┘   │     all routes      │  │
│                                       │                     │  │
│                                       │  useChat() hook     │  │
│                                       │  SSE stream reader  │  │
│                                       └─────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │  POST /api/chat/stream (SSE)
                                │  X-Session-Id header
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                  │
│                                                                 │
│  Rate Limiter → Auth Passthrough → Logger                       │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │      RAGService       │                          │
│              │                      │                          │
│              │  1. RETRIEVAL        │                          │
│              │     Query → Embed    │                          │
│              │     Vector Search    │                          │
│              │     (cosine sim /    │                          │
│              │      keyword score)  │                          │
│              │                      │                          │
│              │  2. AUGMENTATION     │                          │
│              │     Inject top-k     │                          │
│              │     docs into prompt │                          │
│              │                      │                          │
│              │  3. GENERATION       │                          │
│              │     Stream tokens    │                          │
│              │     via SSE          │                          │
│              └──────────┬───────────┘                          │
│                         │                                       │
│              ┌──────────┴──────────┐                           │
│              │  EVFaultVectorStore  │  ← 8 fault documents     │
│              │  (In-memory FAISS)   │    loaded at startup     │
│              └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Technical Decisions

### 1. React Portal for cross-route chat persistence
The `ChatWidget` renders into `#chat-portal` (a sibling of `#root` in `index.html`) via `createPortal()`. This places it outside React Router's component tree so it never unmounts during navigation — conversation state survives route changes.

### 2. Server-Sent Events (SSE) over WebSockets
SSE is HTTP/1.1 compatible and works through standard load balancers without special proxy configuration. Since token streaming is one-directional (server → client), SSE is simpler and sufficient — no WebSocket handshake overhead.

### 3. Lazy widget initialization
`ChatWindow` is not mounted until the user first clicks the FAB. Before that, the widget is a single button with no active subscriptions, fetch calls, or state — zero impact on initial bundle render time.

### 4. Demo mode / production mode toggle
A single `DEMO_MODE=true` env flag switches between:
- **Demo**: keyword-based retrieval + pre-built streaming responses (no API key needed)
- **Production**: OpenAI `text-embedding-3-small` embeddings + GPT-4o-mini generation

The same retrieval pipeline, prompt templates, and SSE infrastructure run in both modes.

### 5. Per-session rate limiting
A sliding window token bucket (20 messages/minute per session ID) runs alongside a global IP-level rate limiter. Session IDs are generated client-side and sent via `X-Session-Id` header — no auth required, but provides auditability.

---

## Project Structure

```
ev-fault-diagnostics/
├── backend/
│   └── src/
│       ├── index.ts                  # Express app entry, middleware setup
│       ├── routes/chat.ts            # SSE streaming endpoint
│       ├── services/
│       │   ├── ragService.ts         # RAG pipeline (retrieve → augment → generate)
│       │   ├── vectorStore.ts        # In-memory vector store with cosine similarity
│       │   └── promptTemplates.ts    # System prompt, user prompt, demo response builder
│       ├── middleware/
│       │   ├── logger.ts             # Winston structured logging
│       │   └── rateLimiter.ts        # Global + per-session rate limiting
│       └── data/
│           └── evFaultKnowledge.ts   # 8 EV fault knowledge base documents
└── frontend/
    └── src/
        ├── App.tsx                   # Router, nav, mounts ChatWidget
        ├── hooks/useChat.ts          # SSE stream reader, message state
        ├── types/chat.ts             # ChatMessage, ChatState types
        └── components/
            ├── ChatWidget/
            │   ├── index.tsx         # React Portal + lazy init logic
            │   ├── ChatWindow.tsx    # Message list + suggestions
            │   ├── ChatMessage.tsx   # Markdown rendering + streaming cursor
            │   ├── ChatInput.tsx     # Auto-resize textarea
            │   └── styles.css        # Dark theme widget styles
            ├── Dashboard.tsx         # Charger status overview
            └── FaultMonitor.tsx      # Fault event history log
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/ev-fault-diagnostics.git
cd ev-fault-diagnostics

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# DEMO_MODE=true by default — no API key needed
# To use real OpenAI: set DEMO_MODE=false and add OPENAI_API_KEY
```

### 3. Run (two terminals)

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Knowledge Base

The RAG system is pre-loaded with 8 detailed EV charger fault documents covering:

| Code | Fault | Severity |
|------|-------|----------|
| E001 | OCPP Communication Error | High |
| E002 | Ground Fault Detection (GFCI) | Critical |
| E003 | Overcurrent Protection | High |
| E004 | Temperature Sensor Fault | High |
| E005 | Connector Lock Failure | Medium |
| E006 | Control Pilot Signal Error | High |
| E007 | DC Power Module Failure | Critical |
| E008 | Authentication Failure | Medium |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, React Router v6 |
| AI Chat | SSE streaming, React Portal, useChat hook |
| Backend | Node.js, Express, TypeScript |
| RAG Pipeline | LangChain patterns, custom vector store |
| Embeddings | OpenAI text-embedding-3-small (prod) / keyword (demo) |
| LLM | GPT-4o-mini (prod) / pre-built responses (demo) |
| Logging | Winston structured JSON logs |
| Rate Limiting | express-rate-limit + per-session token bucket |
