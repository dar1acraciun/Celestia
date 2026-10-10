import { useEffect, useRef, useState } from 'react'
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
      const view   = { az: 180, alt: 30 }

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
      })

      const cleanupEvents = setupEventHandlers(mount, camera, view, {
        starDataRef, hoverRef, meteorsRef, conNamesRef, setTooltip, navigate, LON, LAT,
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
