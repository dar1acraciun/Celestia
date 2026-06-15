import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as tr from 'three'
import { getLST, eqVec, altAzLookTarget } from '../utils/astronomy'
import { ciToColor, makeStarTexture, makeLabel, makeRingTexture } from '../utils/texture'
import { makeSkyMaterial, makeGroundMaterial, makeStarMaterial } from '../utils/shaders'
import { findNearestStar } from '../utils/starHitTest'

export function useSkyMap() {
  const mountRef    = useRef(null)
  const cameraRef   = useRef(null)
  const starDataRef = useRef([])
  const starMatRef  = useRef(null)
  const hoverRef    = useRef(null)
  const labelsRef   = useRef([])
  const meteorsRef  = useRef([])
  const conNamesRef = useRef({})
  const navigate    = useNavigate()
  const [status,  setStatus]  = useState('Se obține locația GPS...')
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    const mount = mountRef.current

    const renderer = new tr.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.toneMapping = tr.NoToneMapping
    renderer.outputColorSpace = tr.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const scene  = new tr.Scene()
    const camera = new tr.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 2000)
    camera.position.set(0, 0, 0)
    cameraRef.current = camera

    scene.add(new tr.Mesh(new tr.SphereGeometry(900, 32, 32), makeSkyMaterial()))

    const initScene = (LAT, LON) => {
      setStatus(null)

      const lst0   = getLST(new Date(), LON)
      const zenith = eqVec(lst0, LAT, 1).normalize()

      const loader   = new tr.TextureLoader()
      const grassTex = loader.load('/darkGrass.jpg')
      const grassPat = loader.load('/grassPat.jpg')
      grassTex.wrapS = grassTex.wrapT = tr.RepeatWrapping
      grassPat.wrapS = grassPat.wrapT = tr.RepeatWrapping
      grassTex.repeat.set(12, 12)
      grassPat.repeat.set(60, 60)

      let groundMesh = new tr.Mesh(
        new tr.PlaneGeometry(1800, 1800, 120, 120),
        makeGroundMaterial(grassTex, grassPat)
      )
      groundMesh.lookAt(zenith)
      groundMesh.position.copy(zenith.clone().negate().multiplyScalar(8))
      scene.add(groundMesh)

      Promise.all([
        fetch('/data/data/stars_full.json').then(r => r.json()),
        fetch('/data/data/constellations.json').then(r => r.json()),
      ]).then(([stars, constellations]) => {

        Object.entries(constellations).forEach(([abr, con]) => {
          conNamesRef.current[abr.toLowerCase()] = con.name
        })

        const byHip = {}
        stars.forEach(s => { byHip[s.hip] = s })

        const starTex = makeStarTexture()
        const positions = [], sizes = [], colors = []

        stars.forEach(s => {
          if (s.mag > 8) return
          const v   = eqVec(s.ra, s.dec, 850)
          const col = ciToColor(s.ci)
          const sz  = Math.max(1.2, 9 - s.mag * 1.0)

          positions.push(v.x, v.y, v.z)
          sizes.push(sz)
          colors.push(col.r, col.g, col.b)

          if (s.mag <= 6) starDataRef.current.push({
            pos: v.clone(), proper: s.proper, con: s.con, mag: s.mag, ci: s.ci,
          })
        })

        const hoverSprite = new tr.Sprite(new tr.SpriteMaterial({
          map: makeRingTexture(), transparent: true, depthWrite: false,
        }))
        hoverSprite.scale.set(18, 18, 1)
        hoverSprite.visible = false
        scene.add(hoverSprite)
        hoverRef.current = hoverSprite

        const geo = new tr.BufferGeometry()
        geo.setAttribute('position', new tr.Float32BufferAttribute(positions, 3))
        geo.setAttribute('aSize',    new tr.Float32BufferAttribute(sizes, 1))
        geo.setAttribute('aColor',   new tr.Float32BufferAttribute(colors, 3))

        const mat = makeStarMaterial(starTex)
        starMatRef.current = mat
        scene.add(new tr.Points(geo, mat))

        const linePos = [], nodeDots = []
        const nodeSet = new Set()

        Object.values(constellations).forEach(con => {
          con.lines.forEach(([h1, h2]) => {
            const s1 = byHip[h1], s2 = byHip[h2]
            if (!s1 || !s2) return
            const v1 = eqVec(s1.ra, s1.dec, 851)
            const v2 = eqVec(s2.ra, s2.dec, 851)
            linePos.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
            if (!nodeSet.has(h1)) { nodeSet.add(h1); nodeDots.push(v1.x, v1.y, v1.z) }
            if (!nodeSet.has(h2)) { nodeSet.add(h2); nodeDots.push(v2.x, v2.y, v2.z) }
          })

          const members = [...new Set(con.lines.flat())].map(h => byHip[h]).filter(Boolean)
          if (members.length < 2) return
          const totalW = members.reduce((a, s) => a + Math.max(0.1, 6 - s.mag), 0)
          const sinSum = members.reduce((a, s) => a + Math.sin(s.ra * Math.PI/180) * Math.max(0.1, 6 - s.mag), 0)
          const cosSum = members.reduce((a, s) => a + Math.cos(s.ra * Math.PI/180) * Math.max(0.1, 6 - s.mag), 0)
          const avgRa  = (Math.atan2(sinSum, cosSum) * 180/Math.PI + 360) % 360
          const avgDec = members.reduce((a, s) => a + s.dec * Math.max(0.1, 6 - s.mag), 0) / totalW
          const label    = makeLabel(con.name)
          const labelPos = eqVec(avgRa, avgDec, 820)
          label.position.copy(labelPos)
          label.visible = true
          scene.add(label)
          labelsRef.current.push({ sprite: label, pos3d: labelPos.clone() })
        })

        const lineGeo1 = new tr.BufferGeometry()
        lineGeo1.setAttribute('position', new tr.Float32BufferAttribute(linePos, 3))
        scene.add(new tr.LineSegments(lineGeo1, new tr.LineBasicMaterial({
          color: 0x4488ff, transparent: true, opacity: 0.08,
          blending: tr.AdditiveBlending, depthWrite: false,
        })))

        const lineGeo2 = new tr.BufferGeometry()
        lineGeo2.setAttribute('position', new tr.Float32BufferAttribute(linePos, 3))
        scene.add(new tr.LineSegments(lineGeo2, new tr.LineBasicMaterial({
          color: 0x88bbff, transparent: true, opacity: 0.45,
          blending: tr.AdditiveBlending, depthWrite: false,
        })))

        const dotGeo = new tr.BufferGeometry()
        dotGeo.setAttribute('position', new tr.Float32BufferAttribute(nodeDots, 3))
        scene.add(new tr.Points(dotGeo, new tr.PointsMaterial({
          color: 0xaaccff, size: 2.5, transparent: true, opacity: 0.6,
          sizeAttenuation: false, depthWrite: false, blending: tr.AdditiveBlending,
        })))
      })

      const view = { az: 180, alt: 30 }
      const getVirtualDate = () => new Date(Date.now())

      const updateCamera = () => {
        const lst = getLST(getVirtualDate(), LON)
        camera.up.copy(eqVec(lst, LAT, 1).normalize())
        camera.lookAt(altAzLookTarget(view.alt, view.az, lst, LAT))
      }
      updateCamera()

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
        const bestStar = findNearestStar(starDataRef.current, cameraRef.current, mx, my, W, H)
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
            const bestStar = findNearestStar(starDataRef.current, cameraRef.current, mx, my, W, H, 28)
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

      const spawnMeteor = () => {
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

      mount.addEventListener('mousedown',  onDown)
      mount.addEventListener('mouseleave', onLeave)
      mount.addEventListener('click',      onClick)
      mount.addEventListener('wheel',      onWheel, { passive: true })
      mount.addEventListener('touchstart', onTouchStart, { passive: true })
      mount.addEventListener('touchmove',  onTouchMovePrevent, { passive: false })
      mount.addEventListener('touchend',   onTouchEnd)
      window.addEventListener('mouseup',   onUp)
      window.addEventListener('mousemove', onMove)

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

        const curZenith = eqVec(getLST(getVirtualDate(), LON), LAT, 1).normalize()
        if (groundMesh) {
          groundMesh.lookAt(curZenith)
          groundMesh.position.copy(curZenith.clone().negate().multiplyScalar(8))
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
          spawnMeteor()
          nextMeteor = 8 + Math.random() * 15
        }

        renderer.render(scene, camera)
      }
      animate()

      mount._cleanup = () => {
        cancelAnimationFrame(animId)
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

    navigator.geolocation.getCurrentPosition(
      pos => initScene(pos.coords.latitude, pos.coords.longitude),
      ()  => { setStatus('GPS indisponibil — București'); initScene(44.4, 26.1) }
    )

    return () => {
      if (mount._cleanup) mount._cleanup()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return { mountRef, status, tooltip, conNamesRef }
}
