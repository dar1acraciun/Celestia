import { useNavigate } from 'react-router-dom'

function GnnResultCard({ result }) {
  const navigate = useNavigate()

  if (result.error) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: 'clamp(1.25rem, 4vw, 2rem)', color: '#ffffff' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
          GNN Model
        </p>
        <p style={{ color: '#f87171' }}>{result.error}</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: 'clamp(1.25rem, 4vw, 2rem)', color: '#ffffff' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
        GNN Model
      </p>
      <h2
        onClick={() => navigate(`/constellation/${encodeURIComponent(result.data?.constellation)}`)}
        style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '0.5rem', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' }}
      >
        {result.data?.constellation}
      </h2>
      <p style={{ color: '#9999b3', marginBottom: '1rem' }}>
        Confidence: {(result.data?.confidence * 100).toFixed(1)}%
      </p>
      <h4 style={{ color: '#c4c4d8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Top 5:</h4>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {result.data?.top5?.map((item) => (
          <li
            key={item.name}
            onClick={() => navigate(`/constellation/${encodeURIComponent(item.name)}`)}
            style={{ color: '#9999b3', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {item.name} — {(item.confidence * 100).toFixed(1)}%
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GnnResultCard
