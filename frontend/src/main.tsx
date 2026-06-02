import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Entry point — mounts React app into #root div.
// The #chat-portal div (in index.html) is intentionally separate
// so the ChatWidget portal renders outside the React tree,
// enabling true cross-route persistence without re-mounting.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
