function InfoBadge({ label, value }) {
  if (!value) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '0.75rem',
      padding: '0.85rem 1rem',
    }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
        {label}
      </p>
      <p style={{ color: '#e8e8f0', fontSize: '0.9rem' }}>{value}</p>
    </div>
  )
}

export default InfoBadge