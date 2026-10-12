import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as tr from 'three'
import { getLST, eqVec } from '../utils/astronomy'
import { makeSkyMaterial } from '../utils/shaders'
import { buildGround, buildStars, buildConstellations, buildHorizonLabels } from './useSceneBuilder'
import { setupEventHandlers, startAnimLoop } from './useSceneEvents'

export function useSkyMap() {
  const mountRef    = useRef(null)
  const cameraRef   = useRef(null)
  const starDataRef = useRef([])
  const starMatRef  = useRef(null)
  const hoverRef    = useRef(null)
  const labelsRef   = useRef([])
  const meteorsRef  = useRef([])
  const conNamesRef = useRef({})
  const horizonLabelsRef = useRef([])
  const navigate    = useNavigate()

  // Phase 2 ("Show me"): the scene/view/loaded data live inside the one-shot
  // init closure below, so lift stable references out here. The focus +
  // highlight handles read these refs (never closure locals) so their identity
  // stays stable as props threaded down to the chat panel.
  const sceneRef     = useRef(null)              // THREE.Scene
  const viewRef      = useRef(null)              // shared mutable { az, alt }
  const skyDataRef   = useRef(null)              // { byHip, constellations }
  const highlightRef = useRef(null)              // { objects: [...] } current overlay
  const focusAnimRef = useRef({ id: null, cancel: false }) // active slide tween

  const [status,  setStatus]  = useState('Se obține locația GPS...')
  const [tooltip, setTooltip] = useState(null)
  const [coords,  setCoords]  = useState({ lat: 44.4, lon: 26.1 })

  useEffect(() => {
    const mount = mountRef.current

    const renderer = new tr.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.toneMapping = tr.NoToneMapping
    renderer.outputColorSpace = tr.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const scene  = new tr.Scene()
    sceneRef.current = scene
    const camera = new tr.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 2000)
    camera.position.set(0, 0, 0)
    cameraRef.current = camera

    scene.add(new tr.Mesh(new tr.SphereGeometry(900, 32, 32), makeSkyMaterial()))

    const initScene = (LAT, LON) => {
      setStatus(null)

      const lst0   = getLST(new Date(), LON)
      const zenith = eqVec(lst0, LAT, 1).normalize()
      const view   = { az: 180, alt: 30 }
      viewRef.current = view

      const groundMesh = buildGround(scene, zenith)
      horizonLabelsRef.current = buildHorizonLabels(scene, lst0, LAT)

      Promise.all([
        fetch('/data/data/stars_full.json').then(r => r.json()),
        fetch('/data/data/constellations.json').then(r => r.json()),
      ]).then(([stars, constellations]) => {
        const byHip = {}
        stars.forEach(s => { byHip[s.hip] = s })

        const { hoverSprite, starMat } = buildStars(scene, stars, starDataRef)
        hoverRef.current  = hoverSprite
        starMatRef.current = starMat

        buildConstellations(scene, constellations, byHip, labelsRef, conNamesRef)
        skyDataRef.current = { byHip, constellations }
      })

      const cleanupEvents = setupEventHandlers(mount, camera, view, {
        starDataRef, hoverRef, meteorsRef, conNamesRef, setTooltip, navigate, LON, LAT, focusAnimRef,
      })

      const cleanupAnim = startAnimLoop(renderer, scene, camera, {
        view, groundMesh, starMatRef, meteorsRef, horizonLabelsRef, LON, LAT,
      })

      mount._cleanup = () => {
        cleanupEvents()
        cleanupAnim()
      }
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        initScene(pos.coords.latitude, pos.coords.longitude)
      },
      ()  => {
        setStatus('GPS unavailable — Bucharest')
        setCoords({ lat: 44.4, lon: 26.1 })
        initScene(44.4, 26.1)
      }
    )

    return () => {
      if (mount._cleanup) mount._cleanup()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  // --- Phase 2: highlight overlay --------------------------------------------
  // Remove and fully dispose any current highlight overlay (geometry+material).
  // Only one constellation is ever highlighted at a time, so this is called
  // before building a new overlay and when the chat panel closes (no leaks).
  const clearHighlight = useCallback(() => {
    const scene = sceneRef.current
    const h = highlightRef.current
    if (!h) return
    h.objects.forEach(obj => {
      if (scene) scene.remove(obj)
      obj.geometry?.dispose()
      obj.material?.dispose()
    })
    highlightRef.current = null
  }, [])

  // Build a separate bright overlay for the target constellation's lines using
  // the SAME projection + radius (851) as buildConstellations, so it overlays
  // the dim base lines exactly. Matched by IAU abbreviation (fallback: name).
  const highlightConstellation = useCallback((facts) => {
    const scene = sceneRef.current
    const data  = skyDataRef.current
    if (!scene || !data || !facts) return

    clearHighlight()

    const { byHip, constellations } = data
    let con = facts.abbreviation ? constellations[facts.abbreviation] : null
    if (!con && facts.constellation) {
      con = Object.values(constellations).find(c => c.name === facts.constellation)
    }
    if (!con) return

    const linePos = []
    const nodeDots = []
    const nodeSet = new Set()
    con.lines.forEach(([h1, h2]) => {
      const s1 = byHip[h1], s2 = byHip[h2]
      if (!s1 || !s2) return // skip missing HIPs, same guard as buildConstellations
      const v1 = eqVec(s1.ra, s1.dec, 851)
      const v2 = eqVec(s2.ra, s2.dec, 851)
      linePos.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
      if (!nodeSet.has(h1)) { nodeSet.add(h1); nodeDots.push(v1.x, v1.y, v1.z) }
      if (!nodeSet.has(h2)) { nodeSet.add(h2); nodeDots.push(v2.x, v2.y, v2.z) }
    })
    if (linePos.length === 0) return

    const lineGeo = new tr.BufferGeometry()
    lineGeo.setAttribute('position', new tr.Float32BufferAttribute(linePos, 3))
    const lineObj = new tr.LineSegments(lineGeo, new tr.LineBasicMaterial({
      color: 0x9fd0ff, transparent: true, opacity: 0.9,
      blending: tr.AdditiveBlending, depthWrite: false,
    }))
    scene.add(lineObj)

    const dotGeo = new tr.BufferGeometry()
    dotGeo.setAttribute('position', new tr.Float32BufferAttribute(nodeDots, 3))
    const dotObj = new tr.Points(dotGeo, new tr.PointsMaterial({
      color: 0xffffff, size: 4, transparent: true, opacity: 0.95,
      sizeAttenuation: false, depthWrite: false, blending: tr.AdditiveBlending,
    }))
    scene.add(dotObj)

    highlightRef.current = { objects: [lineObj, dotObj] }
  }, [clearHighlight])

  // --- Phase 2: slide the sky to a constellation -----------------------------
  // Animate the shared view { az, alt } to the constellation's az/alt over ~1s
  // (ease-in-out). The anim loop's updateCamera() reads view every frame, so
  // the camera follows automatically. Azimuth tweens along the shortest angular
  // path; altitude is clamped to the same [-10, 88] range the drag handler uses.
  // Drag-vs-slide: a user drag cancels the tween (onDown/onTouchStart set
  // focusAnimRef.current.cancel = true, checked each frame here). This is the
  // simpler, robust option — the user instantly regains control and there is no
  // lock state that could get stuck if a tween is interrupted.
  const focusConstellation = useCallback((facts) => {
    if (!facts) return
    if (facts.state !== 'VISIBLE' && facts.state !== 'AT_HORIZON') return
    const view = viewRef.current
    if (!view || typeof facts.azimuthDeg !== 'number' || typeof facts.altitudeDeg !== 'number') return

    highlightConstellation(facts)

    const startAz  = view.az
    const startAlt = view.alt
    const targetAz = ((facts.azimuthDeg % 360) + 360) % 360
    const targetAlt = Math.max(-10, Math.min(88, facts.altitudeDeg))
    // shortest-path azimuth delta in (-180, 180]
    const delta = ((targetAz - startAz + 540) % 360) - 180

    // cancel any in-flight tween before starting a new one
    if (focusAnimRef.current.id != null) cancelAnimationFrame(focusAnimRef.current.id)
    focusAnimRef.current.cancel = false

    const DURATION = 1000
    const t0 = performance.now()
    const ease = t => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2)

    const step = () => {
      if (focusAnimRef.current.cancel) { focusAnimRef.current.id = null; return }
      const t = Math.min((performance.now() - t0) / DURATION, 1)
      const e = ease(t)
      view.az  = ((startAz + delta * e) % 360 + 360) % 360
      view.alt = startAlt + (targetAlt - startAlt) * e
      if (t < 1) {
        focusAnimRef.current.id = requestAnimationFrame(step)
      } else {
        focusAnimRef.current.id = null
      }
    }
    focusAnimRef.current.id = requestAnimationFrame(step)
  }, [highlightConstellation])

  return { mountRef, status, tooltip, conNamesRef, coords, focusConstellation, clearHighlight }
}
