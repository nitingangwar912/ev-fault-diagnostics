const CHARGERS = [
  { id: 'CP-001', location: 'Site A — Bay 1', status: 'online', power: 22, sessions: 147, lastFault: 'None' },
  { id: 'CP-002', location: 'Site A — Bay 2', status: 'faulted', power: 0, sessions: 89, lastFault: 'E001 — OCPP Comm Error' },
  { id: 'CP-003', location: 'Site B — Level 2', status: 'online', power: 7.4, sessions: 203, lastFault: 'None' },
  { id: 'CP-004', location: 'Site B — DCFC', status: 'charging', power: 150, sessions: 56, lastFault: 'E004 — Temp Sensor (resolved)' },
  { id: 'CP-005', location: 'Site C — Bay 1', status: 'offline', power: 0, sessions: 12, lastFault: 'E007 — Power Module' },
  { id: 'CP-006', location: 'Site C — Bay 2', status: 'online', power: 11, sessions: 178, lastFault: 'None' },
];

const STATUS_COLORS: Record<string, string> = {
  online: '#10b981',
  charging: '#3b82f6',
  faulted: '#ef4444',
  offline: '#6b7280'
};

export function Dashboard() {
  const onlineCount = CHARGERS.filter(c => c.status === 'online' || c.status === 'charging').length;
  const faultedCount = CHARGERS.filter(c => c.status === 'faulted' || c.status === 'offline').length;

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
          Fleet Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          Real-time charger status across all sites — use the AI assistant to diagnose faults
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Chargers', value: CHARGERS.length, color: '#3b82f6' },
          { label: 'Operational', value: onlineCount, color: '#10b981' },
          { label: 'Needs Attention', value: faultedCount, color: '#ef4444' }
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: '#12151f',
            border: '1px solid #1e2436',
            borderRadius: 12,
            padding: '20px 24px'
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charger table */}
      <div style={{
        background: '#12151f',
        border: '1px solid #1e2436',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 100px 80px 120px 1fr',
          padding: '10px 20px',
          borderBottom: '1px solid #1e2436',
          fontSize: 11,
          fontWeight: 600,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          <span>Unit ID</span>
          <span>Location</span>
          <span>Status</span>
          <span>kW</span>
          <span>Sessions</span>
          <span>Last Fault</span>
        </div>
        {CHARGERS.map((c, i) => (
          <div key={c.id} style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 100px 80px 120px 1fr',
            padding: '14px 20px',
            borderBottom: i < CHARGERS.length - 1 ? '1px solid #1a1d2e' : 'none',
            fontSize: 13,
            alignItems: 'center'
          }}>
            <span style={{ color: '#7dd3fc', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{c.id}</span>
            <span style={{ color: '#cbd5e1' }}>{c.location}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: STATUS_COLORS[c.status],
                display: 'inline-block'
              }} />
              <span style={{ color: STATUS_COLORS[c.status], fontSize: 12, fontWeight: 500 }}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </span>
            <span style={{ color: c.power > 0 ? '#10b981' : '#475569', fontWeight: 500 }}>
              {c.power > 0 ? c.power : '—'}
            </span>
            <span style={{ color: '#94a3b8' }}>{c.sessions.toLocaleString()}</span>
            <span style={{ color: c.lastFault === 'None' ? '#475569' : '#f59e0b', fontSize: 12 }}>
              {c.lastFault}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
