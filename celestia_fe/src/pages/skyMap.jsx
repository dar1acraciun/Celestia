import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as tr from 'three'
// ── Calcule astronomice ───────────────────────────────────────────────────────
const toJD = (date) => {
  const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1
  const d = date.getUTCDate() + date.getUTCHours()/24 + date.getUTCMinutes()/1440 + date.getUTCSeconds()/86400
  const A = Math.floor(y/100), B = 2 - A + Math.floor(A/4)
  return Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + d + B - 1524.5
}

const getLST = (date, lon) => {
  const jd = toJD(date)
  const T  = (jd - 2451545.0) / 36525.0
  const gmst = (280.46061837 + 360.98564736629*(jd-2451545.0) + 0.000387933*T*T) % 360
  return ((gmst + lon) % 360 + 360) % 360
}

const eqVec = (ra_deg, dec_deg, R = 800) => {
  const ra = ra_deg  * Math.PI / 180
  const dc = dec_deg * Math.PI / 180
  return new tr.Vector3(
    -R * Math.cos(dc) * Math.cos(ra),
     R * Math.sin(dc),
     R * Math.cos(dc) * Math.sin(ra)
  )
}

const altAzLookTarget = (alt_deg, az_deg, lst_deg, lat_deg) => {
  const alt = alt_deg * Math.PI / 180
  const az  = az_deg  * Math.PI / 180
  const lat = lat_deg * Math.PI / 180
  const sinDec = Math.sin(lat)*Math.sin(alt) + Math.cos(lat)*Math.cos(alt)*Math.cos(az)
  const dec    = Math.asin(Math.max(-1, Math.min(1, sinDec)))
  const num    = Math.sin(alt) - Math.sin(lat)*sinDec
  const den    = Math.cos(lat)*Math.cos(dec) + 1e-10
  let ha = Math.acos(Math.max(-1, Math.min(1, num/den))) * 180 / Math.PI
  if (Math.sin(az) > 0) ha = 360 - ha
  const ra = ((lst_deg - ha) % 360 + 360) % 360
  return eqVec(ra, dec * 180 / Math.PI)
}

// ── Culoare stea din B-V color index ─────────────────────────────────────────
const ciToColor = (ci) => {
  if (ci === null || ci === undefined) return new tr.Color(1, 1, 1)
  if (ci < -0.3) return new tr.Color(0.67, 0.75, 1.00)  // albastru
  if (ci <  0.0) return new tr.Color(0.79, 0.84, 1.00)
  if (ci <  0.3) return new tr.Color(1.00, 1.00, 1.00)  // alb
  if (ci <  0.6) return new tr.Color(1.00, 0.96, 0.92)
  if (ci <  1.0) return new tr.Color(1.00, 0.82, 0.63)
  return new tr.Color(1.00, 0.67, 0.44)                  // portocaliu-rosu
}

// ── Textura glow stea ─────────────────────────────────────────────────────────
const makeStarTexture = () => {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0,   'rgba(255,255,255,1)')
  g.addColorStop(0.2, 'rgba(255,255,255,0.8)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.3)')
  g.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new tr.CanvasTexture(c)
}

// ── Label constelatie ─────────────────────────────────────────────────────────
const makeLabel = (text) => {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 80
  const ctx = c.getContext('2d')
  ctx.font = '400 44px sans-serif'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(100,170,255,1)'
  ctx.shadowBlur = 18
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text.toUpperCase(), 256, 54)
  const sprite = new tr.Sprite(new tr.SpriteMaterial({
    map: new tr.CanvasTexture(c), transparent: true, depthWrite: false,
  }))
  sprite.scale.set(200, 32, 1)
  return sprite
}

// ─────────────────────────────────────────────────────────────────────────────

// ── Textura ring highlight ────────────────────────────────────────────────────
const makeRingTexture = () => {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.9)'
  ctx.lineWidth = 2.5
  ctx.shadowColor = 'rgba(120,180,255,0.8)'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(32, 32, 26, 0, Math.PI * 2)
  ctx.stroke()
  return new tr.CanvasTexture(c)
}

// ── Tip spectral din ci ───────────────────────────────────────────────────────
const spectralType = (ci) => {
  if (ci === null || ci === undefined) return ''
  if (ci < -0.3) return 'O/B · albastru'
  if (ci <  0.0) return 'A · alb-albăstrui'
  if (ci <  0.3) return 'F · alb'
  if (ci <  0.6) return 'G · galben'
  if (ci <  1.0) return 'K · portocaliu'
  return 'M · roșu'
}

export default function SkyMap() {
  const mountRef    = useRef(null)
  const cameraRef   = useRef(null)
  const starDataRef = useRef([])
  const starMatRef  = useRef(null)
  const hoverRef    = useRef(null)
  const labelsRef   = useRef([])     // { sprite, pos3d } pentru fiecare constelatie
  const meteorsRef  = useRef([])
  const conNamesRef = useRef({})     // abr → full name
  const navigate    = useNavigate()
  const [status,  setStatus]  = useState('Se obține locația GPS...')
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    const mount = mountRef.current

    // ── Renderer ────────────────────────────────────────────────────────────
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

    // Cer gradient — sfera interioara cu shader
    const skyMat = new tr.ShaderMaterial({
      side: tr.BackSide,
      vertexShader: [
        'varying vec3 vWorldPos;',
        'void main() {',
        '  vWorldPos = normalize((modelMatrix * vec4(position,1.0)).xyz);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vWorldPos;',
        'void main() {',
        '  float h = clamp(vWorldPos.y * 0.5 + 0.5, 0.0, 1.0);',
        '  vec3 zenithCol  = vec3(0.01, 0.02, 0.06);',
        '  vec3 horizonCol = vec3(0.04, 0.08, 0.18);',
        '  gl_FragColor = vec4(mix(horizonCol, zenithCol, h), 1.0);',
        '}'
      ].join('\n'),
    })
    scene.add(new tr.Mesh(new tr.SphereGeometry(900, 32, 32), skyMat))

    // ── GPS → init scene ────────────────────────────────────────────────────
    const initScene = (LAT, LON) => {
      setStatus(null)

      const lst0   = getLST(new Date(), LON)
      const zenith = eqVec(lst0, LAT, 1).normalize()

      // Pamant cu shader noapte
      const loader = new tr.TextureLoader()
      const grassTex  = loader.load('/darkGrass.jpg')
      const grassPat  = loader.load('/grassPat.jpg')
      grassTex.wrapS  = grassTex.wrapT  = tr.RepeatWrapping
      grassPat.wrapS  = grassPat.wrapT  = tr.RepeatWrapping
      grassTex.repeat.set(12, 12)
      grassPat.repeat.set(60, 60)

      const groundMat = new tr.ShaderMaterial({
        uniforms: {
          tBase:   { value: grassTex },
          tDetail: { value: grassPat },
        },
        vertexShader: [
          'varying vec2 vUv;',
          'varying float vDist;',
          'varying float vR;',
          'void main() {',
          '  vUv = uv;',
          '  vR  = length(position.xy);',
          // sageata parabolica — centrul ramane sus, marginile coboara
          '  float curve = vR * vR / 11000.0;',
          '  vec3 pos = vec3(position.xy, position.z - curve);',
          '  vDist = length((modelMatrix * vec4(pos, 1.0)).xyz);',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform sampler2D tBase;',
          'uniform sampler2D tDetail;',
          'varying vec2 vUv;',
          'varying float vDist;',
          'varying float vR;',
          'void main() {',
          '  if (vR > 895.0) discard;',
          '  vec4 base   = texture2D(tBase,   vUv);',
          '  vec4 detail = texture2D(tDetail, vUv * 5.0);',
          '  vec3 grass  = base.rgb * detail.rgb * 2.0;',
          // noaptea: desaturat + nuanta albastra rece
          '  float lum   = dot(grass, vec3(0.299,0.587,0.114));',
          '  vec3 night  = mix(vec3(lum)*vec3(0.12,0.18,0.22), grass*0.08, 0.3);',
          // ceata spre orizont — mai densa la marginea sferica
          '  float fog   = clamp(vR / 700.0, 0.0, 1.0);',
          '  fog = fog * fog * fog;',
          '  vec3 fogCol = vec3(0.02, 0.05, 0.11);',
          '  vec3 final  = mix(night, fogCol, fog);',
          '  gl_FragColor = vec4(final, 1.0);',
          '}'
        ].join('\n'),
        side: tr.FrontSide,
      })

      // PlaneGeometry cu multe subdiviziuni pentru curba neteda
      let groundMesh = new tr.Mesh(new tr.PlaneGeometry(1800, 1800, 120, 120), groundMat)
      groundMesh.lookAt(zenith)
      groundMesh.position.copy(zenith.clone().negate().multiplyScalar(8))
      scene.add(groundMesh)

      // ── Stele colorate cu shader per-vertex ──────────────────────────────
      Promise.all([
        fetch('/data/data/stars_full.json').then(r => r.json()),
        fetch('/data/data/constellations.json').then(r => r.json()),
      ]).then(([stars, constellations]) => {

        Object.entries(constellations).forEach(([abr, con]) => {
          conNamesRef.current[abr.toLowerCase()] = con.name
        })

        const byHip = {}
        stars.forEach(s => { byHip[s.hip] = s })

        // Construim geometry cu atribute: position, size, color
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

        // Hover ring — creat dupa fetch, stocat in ref
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

        const mat = new tr.ShaderMaterial({
          uniforms: { map: { value: starTex }, uTime: { value: 0 } },
          vertexShader: [
            'attribute float aSize;',
            'attribute vec3 aColor;',
            'uniform float uTime;',
            'varying vec3 vColor;',
            'varying float vAlpha;',
            'void main() {',
            '  vColor = aColor;',
            '  float twinkle = 0.85 + 0.15 * sin(uTime * 1.5 + position.x * 0.05 + position.y * 0.07 + position.z * 0.03);',
            '  gl_PointSize = aSize * twinkle;',
            '  vAlpha = twinkle;',
            '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
            '}'
          ].join('\n'),
          fragmentShader: [
            'uniform sampler2D map;',
            'varying vec3 vColor;',
            'varying float vAlpha;',
            'void main() {',
            '  vec4 t = texture2D(map, gl_PointCoord);',
            '  if (t.a < 0.01) discard;',
            '  gl_FragColor = vec4(vColor + t.rgb * 0.4, t.a);',
            '}'
          ].join('\n'),
          transparent: true,
          depthWrite: false,
          blending: tr.AdditiveBlending,
        })
        starMatRef.current = mat

        scene.add(new tr.Points(geo, mat))

        // ── Linii + etichete constelații ──────────────────────────────────
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
          const label  = makeLabel(con.name)
          const labelPos = eqVec(avgRa, avgDec, 820)
          label.position.copy(labelPos)
          label.visible = true
          scene.add(label)
          labelsRef.current.push({ sprite: label, pos3d: labelPos.clone() })
        })

        // Glow layer (wide, faint)
        const lineGeo1 = new tr.BufferGeometry()
        lineGeo1.setAttribute('position', new tr.Float32BufferAttribute(linePos, 3))
        const glowMat = new tr.LineBasicMaterial({
          color: 0x4488ff, transparent: true, opacity: 0.08,
          blending: tr.AdditiveBlending, depthWrite: false,
        })
        scene.add(new tr.LineSegments(lineGeo1, glowMat))

        // Sharp layer (thin, brighter)
        const lineGeo2 = new tr.BufferGeometry()
        lineGeo2.setAttribute('position', new tr.Float32BufferAttribute(linePos, 3))
        const sharpMat = new tr.LineBasicMaterial({
          color: 0x88bbff, transparent: true, opacity: 0.45,
          blending: tr.AdditiveBlending, depthWrite: false,
        })
        scene.add(new tr.LineSegments(lineGeo2, sharpMat))

        // Node dots la fiecare stea din constelatie
        const dotGeo = new tr.BufferGeometry()
        dotGeo.setAttribute('position', new tr.Float32BufferAttribute(nodeDots, 3))
        scene.add(new tr.Points(dotGeo, new tr.PointsMaterial({
          color: 0xaaccff, size: 2.5, transparent: true, opacity: 0.6,
          sizeAttenuation: false, depthWrite: false, blending: tr.AdditiveBlending,
        })))
      })

      // ── Camera + drag ────────────────────────────────────────────────────
      const view = { az: 180, alt: 30 }

      const getVirtualDate = () => new Date(Date.now())  // timp real

      const updateCamera = () => {
        const lst = getLST(getVirtualDate(), LON)
        camera.up.copy(eqVec(lst, LAT, 1).normalize())
        camera.lookAt(altAzLookTarget(view.alt, view.az, lst, LAT))
      }
      updateCamera()

      let dragging = false, lastX = 0, lastY = 0, didDrag = false

      const onDown = e => { dragging = true; didDrag = false; lastX = e.clientX; lastY = e.clientY }
      const onUp   = () => { dragging = false }

      const onMove = e => {
        if (dragging) {
          didDrag = true
          view.az  = (view.az  + (e.clientX - lastX) * 0.3 + 360) % 360
          view.alt = Math.max(-10, Math.min(88, view.alt - (e.clientY - lastY) * 0.3))
          lastX = e.clientX; lastY = e.clientY
          return
        }

        // Hover — proiectam stelele pe ecran si gasim cea mai apropiata
        const rect = mount.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const W  = rect.width, H = rect.height

        let bestDist = 18, bestStar = null
        starDataRef.current.forEach(sd => {
          const v = sd.pos.clone().project(camera)
          const sx = (v.x + 1) / 2 * W
          const sy = (-v.y + 1) / 2 * H
          if (v.z > 1) return  // in spatele camerei
          const d = Math.sqrt((sx - mx) ** 2 + (sy - my) ** 2)
          if (d < bestDist) { bestDist = d; bestStar = sd }
        })

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

      const onLeave = () => {
        if (hoverRef.current) hoverRef.current.visible = false
        setTooltip(null)
      }

      const onClick = e => {
        if (didDrag) { didDrag = false; return }
        const rect = mount.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const W = rect.width, H = rect.height
        let bestDist = 18, bestStar = null
        starDataRef.current.forEach(sd => {
          const v = sd.pos.clone().project(cameraRef.current)
          const sx = (v.x + 1) / 2 * W
          const sy = (-v.y + 1) / 2 * H
          if (v.z > 1) return
          const d = Math.sqrt((sx - mx) ** 2 + (sy - my) ** 2)
          if (d < bestDist) { bestDist = d; bestStar = sd }
        })
        if (bestStar) {
          const fullName = conNamesRef.current[bestStar.con?.toLowerCase()]
          if (fullName) navigate(`/constellation/${encodeURIComponent(fullName)}`)
        }
      }

      // ── Scroll zoom ──────────────────────────────────────────────────────
      const onWheel = e => {
        camera.fov = Math.max(20, Math.min(90, camera.fov + e.deltaY * 0.05))
        camera.updateProjectionMatrix()
      }

      // ── Touch: drag pentru rotire, pinch pentru zoom ─────────────────────
      let pinchDist = 0
      const touchDist = (t) => {
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
            // apropiere degete (pinch in) → zoom in (fov mai mic)
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
          // tap (fără drag) → navighează spre constelație, ca la click
          if (!didDrag && e.changedTouches.length === 1) {
            const t = e.changedTouches[0]
            const rect = mount.getBoundingClientRect()
            const mx = t.clientX - rect.left, my = t.clientY - rect.top
            const W = rect.width, H = rect.height
            let bestDist = 28, bestStar = null
            starDataRef.current.forEach(sd => {
              const v = sd.pos.clone().project(cameraRef.current)
              const sx = (v.x + 1) / 2 * W
              const sy = (-v.y + 1) / 2 * H
              if (v.z > 1) return
              const d = Math.sqrt((sx - mx) ** 2 + (sy - my) ** 2)
              if (d < bestDist) { bestDist = d; bestStar = sd }
            })
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

      // ── Shooting stars ────────────────────────────────────────────────────
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

        const pts = [start.clone(), start.clone()]
        const geo = new tr.BufferGeometry().setFromPoints(pts)
        const mat = new tr.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
        const line = new tr.Line(geo, mat)
        scene.add(line)
        meteorsRef.current.push({ line, geo, start, dir, t: 0, dur: 1.2 + Math.random() * 0.8 })
      }

      const onTouchMovePrevent = e => {
        if (e.touches.length >= 1) e.preventDefault()  // blochează scroll-ul paginii
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

      let animId, prevTime = performance.now(), elapsed = 0
      let nextMeteor = 8 + Math.random() * 12

      const animate = () => {
        animId = requestAnimationFrame(animate)
        const now = performance.now()
        const dt  = Math.min((now - prevTime) / 1000, 0.1)
        prevTime  = now
        elapsed  += dt
        updateCamera()

        // Twinkle
        if (starMatRef.current) starMatRef.current.uniforms.uTime.value = elapsed



        // Ground sync
        const curZenith = eqVec(getLST(getVirtualDate(), LON), LAT, 1).normalize()
        if (groundMesh) {
          groundMesh.lookAt(curZenith)
          groundMesh.position.copy(curZenith.clone().negate().multiplyScalar(8))
        }

        // Shooting stars update
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

        // Spawn meteor
        nextMeteor -= dt
        if (nextMeteor <= 0) {
          spawnMeteor()
          nextMeteor = 8 + Math.random() * 15
        }

        renderer.render(scene, camera)
      }
      animate()

      // cleanup
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

    // ── Cerere GPS ──────────────────────────────────────────────────────────
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

      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y,
          background: 'rgba(4,10,24,0.92)',
          border: '1px solid rgba(100,160,255,0.35)',
          borderRadius: 8, padding: '8px 14px',
          color: '#e0ecff', fontSize: 13, pointerEvents: 'none',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 0 20px rgba(60,120,255,0.15)',
          lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2 }}>
            {tooltip.star.proper || tooltip.star.con}
          </div>
          {tooltip.star.proper && (
            <div style={{ color: '#8ab4ff', fontSize: 11, marginBottom: 4 }}>
              {tooltip.star.con}
            </div>
          )}
          <div style={{ color: '#aac4ee', fontSize: 12 }}>
            Mag: {tooltip.star.mag.toFixed(2)}
          </div>
          {spectralType(tooltip.star.ci) && (
            <div style={{ color: '#7a9ccc', fontSize: 11 }}>
              {spectralType(tooltip.star.ci)}
            </div>
          )}
          {conNamesRef.current[tooltip.star.con?.toLowerCase()] && (
            <div style={{ color: '#4a90d9', fontSize: 11, marginTop: 4 }}>
              click to view constellation
            </div>
          )}
        </div>
      )}
    </div>
  )
}
