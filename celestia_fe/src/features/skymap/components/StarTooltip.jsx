import { spectralType } from '../utils/texture'

export default function StarTooltip({ tooltip, conNamesRef }) {
  if (!tooltip) return null

  const { x, y, star } = tooltip

  return (
    <div style={{
      position: 'fixed', left: x, top: y,
      background: 'rgba(4,10,24,0.92)',
      border: '1px solid rgba(100,160,255,0.35)',
      borderRadius: 8, padding: '8px 14px',
      color: '#e0ecff', fontSize: 13, pointerEvents: 'none',
      backdropFilter: 'blur(6px)',
      boxShadow: '0 0 20px rgba(60,120,255,0.15)',
      lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2 }}>
        {star.proper || star.con}
      </div>
      {star.proper && (
        <div style={{ color: '#8ab4ff', fontSize: 11, marginBottom: 4 }}>
          {star.con}
        </div>
      )}
      <div style={{ color: '#aac4ee', fontSize: 12 }}>
        Mag: {star.mag.toFixed(2)}
      </div>
      {spectralType(star.ci) && (
        <div style={{ color: '#7a9ccc', fontSize: 11 }}>
          {spectralType(star.ci)}
        </div>
      )}
      {conNamesRef.current[star.con?.toLowerCase()] && (
        <div style={{ color: '#4a90d9', fontSize: 11, marginTop: 4 }}>
          click to view constellation
        </div>
      )}
    </div>
  )
}
