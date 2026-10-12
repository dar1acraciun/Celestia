import { useSkyMap } from './hooks/useSkyMap'
import StarTooltip from './components/StarTooltip'
import SkyChat from './components/SkyChat'

export default function SkyMap() {
  const { mountRef, status, tooltip, conNamesRef, coords, focusConstellation, clearHighlight } = useSkyMap()
  const lat = coords?.lat ?? 44.4
  const lon = coords?.lon ?? 26.1

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

      <SkyChat lat={lat} lon={lon} onShow={focusConstellation} onPanelClose={clearHighlight} />
    </div>
  )
}
