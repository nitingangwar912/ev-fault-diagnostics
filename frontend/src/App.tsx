import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { FaultMonitor } from './components/FaultMonitor';
import { ChatWidget } from './components/ChatWidget';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">⚡</div>
          EV Fleet Diagnostics
        </div>
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/faults" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Fault Monitor
        </NavLink>
        <span className="nav-badge">Demo Mode</span>
        <a
          href="https://github.com/nitingangwar912/ev-fault-diagnostics"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-author"
        >
          Built by Nitin Gangwar
        </a>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/faults" element={<FaultMonitor />} />
      </Routes>

      <footer style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid #1e2436',
        fontSize: '12px',
        color: '#475569',
        marginTop: '20px'
      }}>
        Designed &amp; built by{' '}
        <a
          href="https://github.com/nitingangwar912"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
        >
          Nitin Gangwar
        </a>
        {' '}·{' '}
        <a
          href="https://github.com/nitingangwar912/ev-fault-diagnostics"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'none' }}
        >
          View Source
        </a>
        {' '}·{' '}
        <a
          href="https://linkedin.com/in/nitingangwar912"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'none' }}
        >
          LinkedIn
        </a>
      </footer>

      {/* ChatWidget is rendered via React Portal — persists across all routes */}
      <ChatWidget />
    </BrowserRouter>
  );
}
