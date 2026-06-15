import { useSkyMap } from './hooks/useSkyMap'
import StarTooltip from './components/StarTooltip'

export default function SkyMap() {
  const { mountRef, status, tooltip, conNamesRef } = useSkyMap()

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'none' }} />

      {status && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          color: '#8ab4ff', fontSize: 14, pointerEvents: 'none',
        }}>
          {status}
        </div>
      )}

      <StarTooltip tooltip={tooltip} conNamesRef={conNamesRef} />
    </div>
  )
}
