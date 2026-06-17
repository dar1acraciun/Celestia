import * as tr from 'three'
import { eqVec } from '../utils/astronomy'
import { ciToColor, makeStarTexture, makeLabel, makeRingTexture } from '../utils/texture'
import { makeGroundMaterial, makeStarMaterial } from '../utils/shaders'

export const buildGround = (scene, zenith) => {
  const groundMesh = new tr.Mesh(
    new tr.PlaneGeometry(1800, 1800, 120, 120),
    makeGroundMaterial()
  )
  groundMesh.lookAt(zenith)
  groundMesh.position.copy(zenith.clone().negate().multiplyScalar(8))
  scene.add(groundMesh)
  return groundMesh
}

export const buildStars = (scene, stars, starDataRef) => {
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

  const geo = new tr.BufferGeometry()
  geo.setAttribute('position', new tr.Float32BufferAttribute(positions, 3))
  geo.setAttribute('aSize',    new tr.Float32BufferAttribute(sizes, 1))
  geo.setAttribute('aColor',   new tr.Float32BufferAttribute(colors, 3))

  const mat = makeStarMaterial(starTex)
  scene.add(new tr.Points(geo, mat))

  return { hoverSprite, starMat: mat }
}

export const buildConstellations = (scene, constellations, byHip, labelsRef, conNamesRef) => {
  const linePos = [], nodeDots = []
  const nodeSet = new Set()

  Object.entries(constellations).forEach(([abr, con]) => {
    conNamesRef.current[abr.toLowerCase()] = con.name
  })

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
    const totalW  = members.reduce((a, s) => a + Math.max(0.1, 6 - s.mag), 0)
    const sinSum  = members.reduce((a, s) => a + Math.sin(s.ra * Math.PI/180) * Math.max(0.1, 6 - s.mag), 0)
    const cosSum  = members.reduce((a, s) => a + Math.cos(s.ra * Math.PI/180) * Math.max(0.1, 6 - s.mag), 0)
    const avgRa   = (Math.atan2(sinSum, cosSum) * 180/Math.PI + 360) % 360
    const avgDec  = members.reduce((a, s) => a + s.dec * Math.max(0.1, 6 - s.mag), 0) / totalW
    const label   = makeLabel(con.name)
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
}
