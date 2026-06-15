export const findNearestStar = (starData, camera, mx, my, W, H, threshold = 18) => {
  let bestDist = threshold, bestStar = null
  starData.forEach(sd => {
    const v = sd.pos.clone().project(camera)
    const sx = (v.x + 1) / 2 * W
    const sy = (-v.y + 1) / 2 * H
    if (v.z > 1) return
    const d = Math.sqrt((sx - mx) ** 2 + (sy - my) ** 2)
    if (d < bestDist) { bestDist = d; bestStar = sd }
  })
  return bestStar
}
