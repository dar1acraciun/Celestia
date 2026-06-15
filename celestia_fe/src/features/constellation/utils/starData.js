let cachedStars = null
let cachedConst = null

export async function loadData() {
  if (!cachedStars || !cachedConst) {
    const [stars, consts] = await Promise.all([
      fetch('/data/data/stars_full.json').then((r) => r.json()),
      fetch('/data/data/constellations.json').then((r) => r.json()),
    ])
    cachedStars = stars
    cachedConst = consts
  }
  return [cachedStars, cachedConst]
}
