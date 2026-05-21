import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getHistoryById } from '../api'

function HistoryDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [entry, setEntry] = useState(state || null)
  const [loading, setLoading] = useState(!state)

  useEffect(() => {
    if (state) return
    getHistoryById(id)
      .then(setEntry)
      .catch(() => navigate('/profile'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#9999b3' }}>Loading...</p>
      </div>
    )
  }

  if (!entry) return null

  return (
    <div className="min-h-screen px-6 py-32">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'transparent', border: 'none',
            color: '#9999b3', fontSize: '0.9rem',
            cursor: 'pointer', marginBottom: '2rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0,
          }}
        >
          ← Back to profile
        </button>

        {/* Image */}
        {entry.imageName && (
          <img
            src={entry.imageName}
            alt="constellation"
            style={{
              width: '100%', borderRadius: '1.25rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.08)',
              objectFit: 'cover', maxHeight: '360px',
            }}
          />
        )}

        {/* Date */}
        <p style={{ color: '#9999b3', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {new Date(entry.createdAt).toLocaleDateString('en-US', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>

        {/* GNN */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
            GNN Model
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#e8e8f0', marginBottom: '0.5rem' }}>
            {entry.gnn?.constellation}
          </h2>
          <p style={{ color: '#9999b3', marginBottom: '1rem' }}>
            Confidence: {((entry.gnn?.confidence || 0) * 100).toFixed(1)}%
          </p>
          {entry.gnn?.top5?.length > 0 && (
            <>
              <p style={{ color: '#c4c4d8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Top 5:</p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {entry.gnn.top5.map((item) => (
                  <li key={item.name} style={{ color: '#9999b3', fontSize: '0.9rem' }}>
                    {item.name} — {((item.confidence || 0) * 100).toFixed(1)}%
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Astrometry */}
        {entry.astrometry && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem', padding: '1.5rem',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Astrometry.net
            </p>
            {entry.astrometry.constellation ? (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#e8e8f0', marginBottom: '0.5rem' }}>
                  {entry.astrometry.constellation}
                </h2>
                {entry.astrometry.objects_in_field?.length > 0 && (
                  <>
                    <p style={{ color: '#c4c4d8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Objects in field:</p>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {entry.astrometry.objects_in_field.map((obj) => (
                        <li key={obj} style={{ color: '#9999b3', fontSize: '0.9rem' }}>{obj}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p style={{ color: '#f87171' }}>Astrometry.net job failed</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default HistoryDetail
