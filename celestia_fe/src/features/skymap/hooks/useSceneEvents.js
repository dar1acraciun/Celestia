import * as tr from 'three'
import { getLST, eqVec, altAzLookTarget } from '../utils/astronomy'
import { findNearestStar } from '../utils/starHitTest'

const spawnMeteor = (scene, meteorsRef) => {
  const phi   = Math.random() * Math.PI * 0.5
  const theta = Math.random() * Math.PI * 2
  const r = 848
  const start = new tr.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.abs(Math.cos(phi)) * 0.6 + 300,
    r * Math.sin(phi) * Math.sin(theta)
  )
  const dir = new tr.Vector3(
    (Math.random() - 0.5),
    -0.4 - Math.random() * 0.4,
    (Math.random() - 0.5)
  ).normalize().multiplyScalar(180)

  const pts  = [start.clone(), start.clone()]
  const geo  = new tr.BufferGeometry().setFromPoints(pts)
  const mat  = new tr.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
  const line = new tr.Line(geo, mat)
  scene.add(line)
  meteorsRef.current.push({ line, geo, start, dir, t: 0, dur: 1.2 + Math.random() * 0.8 })
}

export const setupEventHandlers = (mount, camera, view, {
  starDataRef, hoverRef, meteorsRef, conNamesRef, setTooltip, navigate, LON, LAT,
}) => {
  let dragging = false, lastX = 0, lastY = 0, didDrag = false

  const onDown  = e => { dragging = true; didDrag = false; lastX = e.clientX; lastY = e.clientY }
  const onUp    = () => { dragging = false }
  const onLeave = () => {
    if (hoverRef.current) hoverRef.current.visible = false
    setTooltip(null)
  }

  const onMove = e => {
    if (dragging) {
      didDrag = true
      view.az  = (view.az  + (e.clientX - lastX) * 0.3 + 360) % 360
      view.alt = Math.max(-10, Math.min(88, view.alt - (e.clientY - lastY) * 0.3))
      lastX = e.clientX; lastY = e.clientY
      return
    }
    const rect = mount.getBoundingClientRect()
    const W = rect.width, H = rect.height
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const bestStar = findNearestStar(starDataRef.current, camera, mx, my, W, H)
    if (bestStar) {
      if (hoverRef.current) {
        hoverRef.current.position.copy(bestStar.pos.clone().multiplyScalar(849 / 850))
        hoverRef.current.visible = true
      }
      setTooltip({ x: e.clientX + 14, y: e.clientY - 10, star: bestStar })
    } else {
      if (hoverRef.current) hoverRef.current.visible = false
      setTooltip(null)
    }
  }

  const onClick = e => {
    if (didDrag) { didDrag = false; return }
    const rect = mount.getBoundingClientRect()
    const W = rect.width, H = rect.height
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const bestStar = findNearestStar(starDataRef.current, camera, mx, my, W, H)
    if (bestStar) {
      const fullName = conNamesRef.current[bestStar.con?.toLowerCase()]
      if (fullName) navigate(`/constellation/${encodeURIComponent(fullName)}`)
    }
  }

  const onWheel = e => {
    camera.fov = Math.max(20, Math.min(90, camera.fov + e.deltaY * 0.05))
    camera.updateProjectionMatrix()
  }

  let pinchDist = 0
  const touchDist = t => {
    const dx = t[0].clientX - t[1].clientX
    const dy = t[0].clientY - t[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const onTouchStart = e => {
    if (e.touches.length === 1) {
      dragging = true; didDrag = false
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
    } else if (e.touches.length === 2) {
      dragging = false
      pinchDist = touchDist(e.touches)
    }
  }

  const onTouchMove = e => {
    if (e.touches.length === 1 && dragging) {
      didDrag = true
      const t = e.touches[0]
      view.az  = (view.az  + (t.clientX - lastX) * 0.3 + 360) % 360
      view.alt = Math.max(-10, Math.min(88, view.alt - (t.clientY - lastY) * 0.3))
      lastX = t.clientX; lastY = t.clientY
    } else if (e.touches.length === 2) {
      const newDist = touchDist(e.touches)
      if (pinchDist > 0) {
        camera.fov = Math.max(20, Math.min(90, camera.fov - (newDist - pinchDist) * 0.15))
        camera.updateProjectionMatrix()
      }
      pinchDist = newDist
    }
  }

  const onTouchEnd = e => {
    if (e.touches.length === 0) {
      dragging = false
      pinchDist = 0
      if (!didDrag && e.changedTouches.length === 1) {
        const t = e.changedTouches[0]
        const rect = mount.getBoundingClientRect()
        const W = rect.width, H = rect.height
        const mx = t.clientX - rect.left, my = t.clientY - rect.top
        const bestStar = findNearestStar(starDataRef.current, camera, mx, my, W, H, 14)
        if (bestStar) {
          const fullName = conNamesRef.current[bestStar.con?.toLowerCase()]
          if (fullName) navigate(`/constellation/${encodeURIComponent(fullName)}`)
        }
      }
    } else if (e.touches.length === 1) {
      pinchDist = 0
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
    }
  }

  const onTouchMovePrevent = e => {
    if (e.touches.length >= 1) e.preventDefault()
    onTouchMove(e)
  }

  mount.addEventListener('mousedown',  onDown)
  mount.addEventListener('mouseleave', onLeave)
  mount.addEventListener('click',      onClick)
  mount.addEventListener('wheel',      onWheel, { passive: true })
  mount.addEventListener('touchstart', onTouchStart, { passive: true })
  mount.addEventListener('touchmove',  onTouchMovePrevent, { passive: false })
  mount.addEventListener('touchend',   onTouchEnd)
  window.addEventListener('mouseup',   onUp)
  window.addEventListener('mousemove', onMove)

  return () => {
    mount.removeEventListener('mousedown',  onDown)
    mount.removeEventListener('mouseleave', onLeave)
    mount.removeEventListener('click',      onClick)
    mount.removeEventListener('wheel',      onWheel)
    mount.removeEventListener('touchstart', onTouchStart)
    mount.removeEventListener('touchmove',  onTouchMovePrevent)
    mount.removeEventListener('touchend',   onTouchEnd)
    window.removeEventListener('mouseup',   onUp)
    window.removeEventListener('mousemove', onMove)
  }
}

export const startAnimLoop = (renderer, scene, camera, {
  view, groundMesh, starMatRef, meteorsRef, horizonLabelsRef, LON, LAT,
}) => {
  const getVirtualDate = () => new Date(Date.now())

  const updateCamera = () => {
    const lst = getLST(getVirtualDate(), LON)
    camera.up.copy(eqVec(lst, LAT, 1).normalize())
    camera.lookAt(altAzLookTarget(view.alt, view.az, lst, LAT))
  }

  let animId, prevTime = performance.now(), elapsed = 0
  let nextMeteor = 8 + Math.random() * 12

  const animate = () => {
    animId = requestAnimationFrame(animate)
    const now = performance.now()
    const dt  = Math.min((now - prevTime) / 1000, 0.1)
    prevTime  = now
    elapsed  += dt
    updateCamera()

    if (starMatRef.current) starMatRef.current.uniforms.uTime.value = elapsed

    const lstNow    = getLST(getVirtualDate(), LON)
    const curZenith = eqVec(lstNow, LAT, 1).normalize()
    if (groundMesh) {
      groundMesh.lookAt(curZenith)
      groundMesh.position.copy(curZenith.clone().negate().multiplyScalar(8))
    }

    if (horizonLabelsRef?.current) {
      horizonLabelsRef.current.forEach(l => {
        l.sprite.position.copy(altAzLookTarget(-2, l.az, lstNow, LAT))
      })
    }

    for (let i = meteorsRef.current.length - 1; i >= 0; i--) {
      const m = meteorsRef.current[i]
      m.t += dt / m.dur
      if (m.t >= 1) {
        scene.remove(m.line)
        m.geo.dispose()
        meteorsRef.current.splice(i, 1)
        continue
      }
      const alpha = Math.sin(m.t * Math.PI)
      m.line.material.opacity = alpha * 0.9
      const head = m.start.clone().add(m.dir.clone().multiplyScalar(m.t * 2.5))
      const tail = head.clone().sub(m.dir.clone().multiplyScalar(0.35))
      const pos  = m.geo.attributes.position
      pos.setXYZ(0, tail.x, tail.y, tail.z)
      pos.setXYZ(1, head.x, head.y, head.z)
      pos.needsUpdate = true
    }

    nextMeteor -= dt
    if (nextMeteor <= 0) {
      spawnMeteor(scene, meteorsRef)
      nextMeteor = 8 + Math.random() * 15
    }

    renderer.render(scene, camera)
  }

  animate()
  return () => cancelAnimationFrame(animId)
}
