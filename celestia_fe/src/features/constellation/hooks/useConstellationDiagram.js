import { useEffect } from 'react'
import { loadData } from '../utils/starData'
import { meanDir, norm3, cross3, projectRaw } from '../utils/projection'

function drawBackground(ctx, size) {
  const bg = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  bg.addColorStop(0, '#0d1528')
  bg.addColorStop(1, '#060a12')
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, 20)
  ctx.fill()
}

function drawLines(ctx, linePairs, hipToPx) {
  linePairs.forEach(([h1, h2]) => {
    const [x1, y1] = hipToPx[h1], [x2, y2] = hipToPx[h2]
    ctx.strokeStyle = 'rgba(70, 150, 255, 0.15)'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  })
  linePairs.forEach(([h1, h2]) => {
    const [x1, y1] = hipToPx[h1], [x2, y2] = hipToPx[h2]
    ctx.strokeStyle = 'rgba(120, 190, 255, 0.55)'
    ctx.lineWidth = 1.3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  })
}

function drawStars(ctx, displayStars, hipToPx) {
  displayStars.forEach((s) => {
    const px = hipToPx[s.hip]
    if (!px) return
    const [x, y] = px
    const brightness = Math.max(0, Math.min(1, (6.5 - (s.mag ?? 5)) / 7))
    const coreR = Math.max(1.5, 1.5 + brightness * 4)
    const glowR = coreR * 4.5

    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR)
    glow.addColorStop(0, `rgba(210, 230, 255, ${brightness * 0.4})`)
    glow.addColorStop(1, 'rgba(200, 220, 255, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, glowR, 0, Math.PI * 2)
    ctx.fill()

    const core = ctx.createRadialGradient(x, y, 0, x, y, coreR)
    core.addColorStop(0, `rgba(255, 255, 255, ${0.75 + brightness * 0.25})`)
    core.addColorStop(0.5, `rgba(230, 240, 255, ${0.5 + brightness * 0.3})`)
    core.addColorStop(1, 'rgba(200, 220, 255, 0)')
    ctx.fillStyle = core
    ctx.beginPath()
    ctx.arc(x, y, coreR, 0, Math.PI * 2)
    ctx.fill()
  })
}

export function useConstellationDiagram(canvasRef, name, size) {
  useEffect(() => {
    if (!name) return
    let cancelled = false

    loadData().then(([allStars, constData]) => {
      if (cancelled) return

      const entry = Object.entries(constData).find(
        ([, c]) => c.name.toLowerCase() === name.toLowerCase()
      )
      if (!entry) return
      const [, con] = entry

      const byHip = {}
      allStars.forEach((s) => { if (s.hip != null) byHip[s.hip] = s })

      const lineHipSet = new Set(con.lines.flat())
      const lineStars = [...lineHipSet].map((h) => byHip[h]).filter(Boolean)
      if (lineStars.length === 0) return

      const center = meanDir(lineStars)
      const up = Math.abs(center[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
      const xAx = norm3(cross3(center, up))
      const yAx = cross3(center, xAx)

      const rawMap = {}
      lineStars.forEach((s) => {
        const r = projectRaw(s.ra, s.dec, center, xAx, yAx)
        if (r) rawMap[s.hip] = r
      })
      if (Object.keys(rawMap).length === 0) return

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      Object.values(rawMap).forEach(([x, y]) => {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      })

      const MARGIN = 0.12
      const usable = size * (1 - 2 * MARGIN)
      const scale = Math.min(usable / (maxX - minX || 0.001), usable / (maxY - minY || 0.001))
      const ox = size / 2 - ((minX + maxX) / 2) * scale
      const oy = size / 2 - ((minY + maxY) / 2) * scale

      const hipToPx = {}
      lineStars.forEach((s) => {
        if (!rawMap[s.hip]) return
        const [rx, ry] = rawMap[s.hip]
        hipToPx[s.hip] = [rx * scale + ox, ry * scale + oy]
      })

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, size, size)

      drawBackground(ctx, size)

      const drawn = new Set()
      const linePairs = con.lines.filter(([h1, h2]) => {
        const key = Math.min(h1, h2) + '_' + Math.max(h1, h2)
        if (drawn.has(key)) return false
        drawn.add(key)
        return hipToPx[h1] && hipToPx[h2]
      })

      drawLines(ctx, linePairs, hipToPx)
      drawStars(ctx, lineStars, hipToPx)
    })

    return () => { cancelled = true }
  }, [name, size])
}
