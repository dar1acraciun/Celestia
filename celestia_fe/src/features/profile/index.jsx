import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useHistory } from './hooks/useHistory'

function Profile() {
  const { user, entries, chatSessions, loading, handleLogout, initials, memberSince } = useHistory()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-32">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a3a6b, #0d2857)',
              border: '1px solid rgba(79,142,247,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, color: '#ffffff',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                {user?.username || user?.email}
              </p>
              {user?.username && (
                <p style={{ color: '#9999b3', fontSize: '0.85rem', margin: 0 }}>
                  {user.email}
                </p>
              )}
              {memberSince && (
                <p style={{ color: '#9999b3', fontSize: '0.8rem', margin: 0 }}>
                  Member since {memberSince}
                </p>
              )}
            </div>
          </div>

          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', padding: '8px 18px',
            color: '#9999b3', fontSize: '0.9rem', cursor: 'pointer',
          }}>
            Log out
          </button>
        </div>

        {}
        <p style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
          Identification History
          {entries.length > 0 && (
            <span style={{ color: '#9999b3', fontWeight: 400, fontSize: '0.85rem', marginLeft: '0.75rem' }}>
              {entries.length} {entries.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </p>

        {loading ? (
          <p style={{ color: '#9999b3' }}>Loading...</p>
        ) : entries.length === 0 ? (
          <p style={{ color: '#9999b3' }}>No identifications yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/history/${entry.id}`, { state: entry })}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1rem', padding: '1.25rem 1.5rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '1rem', flexWrap: 'wrap',
                  cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(79,142,247,0.35)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
              >
                <div>
                  <p style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '1rem', margin: '0 0 0.25rem' }}>
                    {entry.gnn?.constellation}
                  </p>
                  <p style={{ color: '#9999b3', fontSize: '0.85rem', margin: 0 }}>
                    Confidence: {((entry.gnn?.confidence || 0) * 100).toFixed(1)}%
                    {entry.astrometry?.constellation && (
                      <span style={{ marginLeft: '0.75rem', color: '#6a9fd8' }}>
                        · Astrometry: {entry.astrometry.constellation}
                      </span>
                    )}
                  </p>
                </div>
                <p style={{ color: '#9999b3', fontSize: '0.8rem', margin: 0, textAlign: 'right', flexShrink: 0 }}>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {}
        <p style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.25rem', marginTop: '3rem' }}>
          Chat History
          {chatSessions.length > 0 && (
            <span style={{ color: '#9999b3', fontWeight: 400, fontSize: '0.85rem', marginLeft: '0.75rem' }}>
              {chatSessions.length} {chatSessions.length === 1 ? 'session' : 'sessions'}
            </span>
          )}
        </p>

        {loading ? null : chatSessions.length === 0 ? (
          <p style={{ color: '#9999b3' }}>No saved chats yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chatSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/constellation/${encodeURIComponent(session.constellationName)}`)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1rem', padding: '1.25rem 1.5rem',
                  cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(74,144,217,0.35)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <MessageCircle size={16} style={{ color: '#4a90d9', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '1rem', margin: '0 0 0.25rem' }}>
                        {session.constellationName}
                      </p>
                      <p style={{ color: '#9999b3', fontSize: '0.85rem', margin: 0 }}>
                        {session.messages?.filter(m => m.role === 'user').length} {session.messages?.filter(m => m.role === 'user').length === 1 ? 'message' : 'messages'}
                        {session.messages?.find(m => m.role === 'user') && (
                          <span style={{ marginLeft: '0.5rem', color: '#6a6a8a' }}>
                            · "{session.messages.find(m => m.role === 'user').content.slice(0, 50)}{session.messages.find(m => m.role === 'user').content.length > 50 ? '...' : ''}"
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: '#9999b3', fontSize: '0.8rem', margin: 0, flexShrink: 0 }}>
                    {new Date(session.createdAt).toLocaleDateString('en-US', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Profile
