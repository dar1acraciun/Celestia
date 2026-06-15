import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getConstellation } from './api'
import ConstellationDiagram from './components/ConstellationDiagram'
import ConstellationChat from './components/ConstellationChat'
import { MessageCircle } from 'lucide-react'
import ConstellationImageToggle from './components/ConstellationImageToggle'
import InfoBadge from './components/InfoBadge'
import Section from './components/Section'


function ConstellationDetail() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [constellation, setConstellation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    getConstellation(name)
      .then(setConstellation)
      .catch(() => setError('Constellation not found'))
      .finally(() => setLoading(false))
  }, [name])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: '#9999b3' }}>Loading...</p>
      </div>
    )
  }

  if (error || !constellation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p style={{ color: '#f87171' }}>{error || 'Not found'}</p>
        <button onClick={() => navigate(-1)} style={{ color: '#9999b3', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          ← Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-28">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent', border: 'none',
            color: '#9999b3', fontSize: '0.9rem',
            cursor: 'pointer', marginBottom: '2rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0,
          }}
        >
          ← Back
        </button>

        {}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 700,
              color: '#e8e8f0',
              margin: 0,
            }}>
              {constellation.name}
            </h1>
            {constellation.abbreviation && (
              <span style={{
                fontSize: '1rem', color: '#9999b3',
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.06)',
                padding: '0.2rem 0.6rem',
                borderRadius: '0.4rem',
              }}>
                {constellation.abbreviation}
              </span>
            )}
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {}
          <div className="lg:sticky" style={{ top: '6rem' }}>
            <ConstellationDiagram name={constellation.name} size={520} />

            {}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              <InfoBadge label="Hemisphere" value={constellation.hemisphere} />
              <InfoBadge label="Best visibility" value={constellation.bestVisibilityMonth} />
              <InfoBadge label="Area" value={constellation.area ? `${constellation.area} deg²` : null} />
            </div>

            <ConstellationImageToggle
              imageUrl={constellation.imageUrl}
              imageUrlNoLines={constellation.imageUrlNoLines}
              name={constellation.name}
            />

          </div>

          {}
          <div>
            {constellation.description && (
              <Section label="About">
                <p style={{ color: '#c4c4d8', lineHeight: 1.75, fontSize: '0.95rem' }}>
                  {constellation.description}
                </p>
              </Section>
            )}

            {constellation.mythology && (
              <Section label="Mythology">
                <p style={{ color: '#c4c4d8', lineHeight: 1.75, fontSize: '0.95rem' }}>
                  {constellation.mythology}
                </p>
              </Section>
            )}

            {}
            {(constellation.brightestStar || constellation.visibleLatitudes || constellation.quadrant) && (
              <Section label="Astronomical Data">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {constellation.brightestStar && (
                    <div>
                      <p style={{ fontSize: '0.65rem', color: '#9999b3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Brightest Star</p>
                      <p style={{ color: '#e8e8f0', fontSize: '0.9rem' }}>{constellation.brightestStar}</p>
                    </div>
                  )}
                  {constellation.visibleLatitudes && (
                    <div>
                      <p style={{ fontSize: '0.65rem', color: '#9999b3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Visible Latitudes</p>
                      <p style={{ color: '#e8e8f0', fontSize: '0.9rem' }}>{constellation.visibleLatitudes}</p>
                    </div>
                  )}
                  {constellation.quadrant && (
                    <div>
                      <p style={{ fontSize: '0.65rem', color: '#9999b3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Quadrant</p>
                      <p style={{ color: '#e8e8f0', fontSize: '0.9rem' }}>{constellation.quadrant}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {constellation.notableObjects?.length > 0 && (
              <Section label="Notable Deep-Sky Objects">
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {constellation.notableObjects.map((obj, i) => (
                    <li key={i} style={{ color: '#c4c4d8', fontSize: '0.9rem', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#4a90d9', flexShrink: 0 }}>✦</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {constellation.nearestConstellations?.length > 0 && (
              <Section label="Bordering Constellations">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {constellation.nearestConstellations.map((c) => (
                    <span
                      key={c}
                      onClick={() => navigate(`/constellation/${encodeURIComponent(c)}`)}
                      style={{
                        background: 'rgba(74, 144, 217, 0.1)',
                        border: '1px solid rgba(74, 144, 217, 0.3)',
                        borderRadius: '2rem',
                        padding: '0.3rem 0.85rem',
                        color: '#7ab3e8',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {constellation.meteorShowers?.length > 0 && (
              <Section label="Associated Meteor Showers">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {constellation.meteorShowers.map((s) => (
                    <span key={s} style={{
                      background: 'rgba(255,200,100,0.08)',
                      border: '1px solid rgba(255,200,100,0.2)',
                      borderRadius: '2rem',
                      padding: '0.3rem 0.85rem',
                      color: '#f0c060',
                      fontSize: '0.85rem',
                    }}>
                      ☄ {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {constellation.mainStars?.length > 0 && (
              <Section label="Main Stars">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {constellation.mainStars.map((star) => (
                    <span key={star} style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '2rem',
                      padding: '0.3rem 0.85rem',
                      color: '#e8e8f0',
                      fontSize: '0.85rem',
                    }}>
                      {star}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>

        </div>
      </div>

      {}
      <button
        onClick={() => setChatOpen(true)}
        style={{
          position: 'fixed', bottom: '1.25rem', right: '1.25rem',
          background: 'linear-gradient(135deg, #1a3a6b, #4a90d9)',
          border: 'none', borderRadius: '3rem',
          padding: '0.75rem 1.25rem',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.9rem', fontWeight: 600,
          boxShadow: '0 8px 24px rgba(74,144,217,0.35)',
          zIndex: 50,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageCircle size={18} />
        Ask AI
      </button>

      {chatOpen && (
        <ConstellationChat
          constellationName={constellation.name}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}

export default ConstellationDetail
