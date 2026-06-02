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
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/faults" element={<FaultMonitor />} />
      </Routes>

      {/* ChatWidget is rendered via React Portal — persists across all routes */}
      <ChatWidget />
    </BrowserRouter>
  );
}
