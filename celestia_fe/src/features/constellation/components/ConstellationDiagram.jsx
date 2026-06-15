import { useRef } from 'react'
import { useConstellationDiagram } from '../hooks/useConstellationDiagram'

export default function ConstellationDiagram({ name, size = 440 }) {
  const canvasRef = useRef(null)
  useConstellationDiagram(canvasRef, name, size)

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: size,
        borderRadius: '1.25rem',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    />
  )
}
