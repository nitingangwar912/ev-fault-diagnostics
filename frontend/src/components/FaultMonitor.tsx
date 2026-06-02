const FAULT_LOG = [
  { id: 'FL-2024-089', time: '2024-07-15 14:32', unit: 'CP-002', code: 'E001', desc: 'OCPP Communication Error', severity: 'high', resolved: false },
  { id: 'FL-2024-088', time: '2024-07-15 09:10', unit: 'CP-004', code: 'E004', desc: 'Temperature Sensor Fault', severity: 'high', resolved: true },
  { id: 'FL-2024-087', time: '2024-07-14 22:47', unit: 'CP-005', code: 'E007', desc: 'DC Power Module Failure', severity: 'critical', resolved: false },
  { id: 'FL-2024-086', time: '2024-07-14 18:03', unit: 'CP-001', code: 'E008', desc: 'RFID Authentication Failure', severity: 'medium', resolved: true },
  { id: 'FL-2024-085', time: '2024-07-14 11:25', unit: 'CP-003', code: 'E005', desc: 'Connector Lock Failure', severity: 'medium', resolved: true },
  { id: 'FL-2024-084', time: '2024-07-13 16:50', unit: 'CP-006', code: 'E003', desc: 'Overcurrent Protection Trip', severity: 'high', resolved: true },
  { id: 'FL-2024-083', time: '2024-07-13 08:19', unit: 'CP-002', code: 'E002', desc: 'Ground Fault Detection (GFCI)', severity: 'critical', resolved: true },
];

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981'
};

export function FaultMonitor() {
  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
          Fault Monitor
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          Historical fault events — click the AI assistant to diagnose any fault code
        </p>
      </div>

      {/* Active faults banner */}
      <div style={{
        background: '#1c0a0a',
        border: '1px solid #7f1d1d',
        borderRadius: 10,
        padding: '12px 18px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        color: '#fca5a5'
      }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <strong>2 active unresolved faults</strong> — CP-002 (E001) and CP-005 (E007) require attention
      </div>

      {/* Fault log table */}
      <div style={{ background: '#12151f', border: '1px solid #1e2436', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 140px 80px 60px 1fr 80px 90px',
          padding: '10px 20px',
          borderBottom: '1px solid #1e2436',
          fontSize: 11,
          fontWeight: 600,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          <span>Event ID</span>
          <span>Timestamp</span>
          <span>Unit</span>
          <span>Code</span>
          <span>Description</span>
          <span>Severity</span>
          <span>Status</span>
        </div>
        {FAULT_LOG.map((f, i) => (
          <div key={f.id} style={{
            display: 'grid',
            gridTemplateColumns: '120px 140px 80px 60px 1fr 80px 90px',
            padding: '13px 20px',
            borderBottom: i < FAULT_LOG.length - 1 ? '1px solid #1a1d2e' : 'none',
            fontSize: 13,
            alignItems: 'center',
            background: !f.resolved ? 'rgba(239,68,68,0.04)' : 'transparent'
          }}>
            <span style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{f.id}</span>
            <span style={{ color: '#64748b', fontSize: 12 }}>{f.time}</span>
            <span style={{ color: '#7dd3fc', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{f.unit}</span>
            <span style={{ color: SEV_COLORS[f.severity], fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>{f.code}</span>
            <span style={{ color: '#cbd5e1' }}>{f.desc}</span>
            <span style={{
              color: SEV_COLORS[f.severity],
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'capitalize'
            }}>{f.severity}</span>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: f.resolved ? '#10b981' : '#ef4444'
            }}>
              {f.resolved ? '✓ Resolved' : '● Active'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
