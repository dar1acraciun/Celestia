import { useNavigate } from 'react-router-dom'

function AstrometryResultCard({ result }) {
  const navigate = useNavigate()

  if (result.error) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: 'clamp(1.25rem, 4vw, 2rem)', color: '#ffffff' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Astrometry.net
        </p>
        <p style={{ color: '#f87171' }}>{result.error}</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: 'clamp(1.25rem, 4vw, 2rem)', color: '#ffffff' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
        Astrometry.net
      </p>
      <h2
        onClick={() => result.data?.constellation && navigate(`/constellation/${encodeURIComponent(result.data.constellation)}`)}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2rem',
          marginBottom: '0.5rem',
          cursor: result.data?.constellation ? 'pointer' : 'default',
          textDecoration: result.data?.constellation ? 'underline' : 'none',
          textDecorationColor: 'rgba(255,255,255,0.3)',
        }}
      >
        {result.data?.constellation || 'Unknown'}
      </h2>
      {result.data?.objects_in_field?.length > 0 && (
        <>
          <h4 style={{ color: '#c4c4d8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Obiecte detectate:
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.data.objects_in_field.map((obj) => (
              <li key={obj} style={{ color: '#9999b3', fontSize: '0.9rem' }}>{obj}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default AstrometryResultCard
