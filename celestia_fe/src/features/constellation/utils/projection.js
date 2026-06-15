const DEG = Math.PI / 180

export function toXYZ(ra, dec) {
  const r = ra * DEG, d = dec * DEG
  return [Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)]
}

export function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

export function norm3(v) {
  const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
  return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : v
}

export function meanDir(stars) {
  const s = [0, 0, 0]
  stars.forEach((st) => {
    const v = toXYZ(st.ra, st.dec)
    s[0] += v[0]; s[1] += v[1]; s[2] += v[2]
  })
  return norm3(s)
}

export function projectRaw(ra, dec, center, xAx, yAx) {
  const p = toXYZ(ra, dec)
  const d = dot3(p, center)
  if (d <= 0.02) return null
  const vec = [p[0] / d - center[0], p[1] / d - center[1], p[2] / d - center[2]]
  return [dot3(vec, xAx), -dot3(vec, yAx)]
}
