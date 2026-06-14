import { useEffect, useRef } from "react";

const DEG = Math.PI / 180;

function toXYZ(ra, dec) {
  const r = ra * DEG,
    d = dec * DEG;
  return [Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)];
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function norm3(v) {
  const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
  return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : v;
}
function meanDir(stars) {
  const s = [0, 0, 0];
  stars.forEach((st) => {
    const v = toXYZ(st.ra, st.dec);
    s[0] += v[0];
    s[1] += v[1];
    s[2] += v[2];
  });
  return norm3(s);
}

// Returns raw projection coords (before scale/offset)
function projectRaw(ra, dec, center, xAx, yAx) {
  const p = toXYZ(ra, dec);
  const d = dot3(p, center);
  if (d <= 0.02) return null;
  const vec = [
    p[0] / d - center[0],
    p[1] / d - center[1],
    p[2] / d - center[2],
  ];
  return [dot3(vec, xAx), -dot3(vec, yAx)];
}

let cachedStars = null;
let cachedConst = null;

async function loadData() {
  if (!cachedStars || !cachedConst) {
    const [stars, consts] = await Promise.all([
      fetch("/data/data/stars_full.json").then((r) => r.json()),
      fetch("/data/data/constellations.json").then((r) => r.json()),
    ]);
    cachedStars = stars;
    cachedConst = consts;
  }
  return [cachedStars, cachedConst];
}

function drawBackground(ctx, size) {
  const bg = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  bg.addColorStop(0, "#0d1528");
  bg.addColorStop(1, "#060a12");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 20);
  ctx.fill();
}

export default function ConstellationDiagram({ name, size = 440 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;

    loadData().then(([allStars, constData]) => {
      if (cancelled) return;

      const entry = Object.entries(constData).find(
        ([, c]) => c.name.toLowerCase() === name.toLowerCase(),
      );
      if (!entry) return;
      const [abr, con] = entry;

      const byHip = {};
      allStars.forEach((s) => {
        if (s.hip != null) byHip[s.hip] = s;
      });

      // Only the stars referenced in official line pairs
      const lineHipSet = new Set(con.lines.flat());
      const lineStars = [...lineHipSet].map((h) => byHip[h]).filter(Boolean);

      const displayStars = lineStars;
      if (displayStars.length === 0) return;

      // Projection axes — center on line stars (or all if no line stars)
      const center = meanDir(lineStars.length > 0 ? lineStars : displayStars);
      const up = Math.abs(center[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
      const xAx = norm3(cross3(center, up));
      const yAx = cross3(center, xAx);

      // Pass 1: project everything with unit scale to find bounding box
      const rawMap = {};
      displayStars.forEach((s) => {
        const r = projectRaw(s.ra, s.dec, center, xAx, yAx);
        if (r) rawMap[s.hip] = r;
      });

      if (Object.keys(rawMap).length === 0) return;

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      Object.values(rawMap).forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });

      // Pass 2: scale + center bounding box with margin
      const MARGIN = 0.12;
      const usable = size * (1 - 2 * MARGIN);
      const rangeX = maxX - minX || 0.001;
      const rangeY = maxY - minY || 0.001;
      const scale = Math.min(usable / rangeX, usable / rangeY);
      const ox = size / 2 - ((minX + maxX) / 2) * scale;
      const oy = size / 2 - ((minY + maxY) / 2) * scale;

      const hipToPx = {};
      displayStars.forEach((s) => {
        if (!rawMap[s.hip]) return;
        const [rx, ry] = rawMap[s.hip];
        hipToPx[s.hip] = [rx * scale + ox, ry * scale + oy];
      });

      // Draw
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, size, size);

      drawBackground(ctx, size);

      // Lines — glow pass then crisp pass
      const drawn = new Set();
      const linePairs = con.lines.filter(([h1, h2]) => {
        const key = Math.min(h1, h2) + "_" + Math.max(h1, h2);
        if (drawn.has(key)) return false;
        drawn.add(key);
        return hipToPx[h1] && hipToPx[h2];
      });

      linePairs.forEach(([h1, h2]) => {
        const [x1, y1] = hipToPx[h1],
          [x2, y2] = hipToPx[h2];
        ctx.strokeStyle = "rgba(70, 150, 255, 0.15)";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      linePairs.forEach(([h1, h2]) => {
        const [x1, y1] = hipToPx[h1],
          [x2, y2] = hipToPx[h2];
        ctx.strokeStyle = "rgba(120, 190, 255, 0.55)";
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Stars
      displayStars.forEach((s) => {
        const px = hipToPx[s.hip];
        if (!px) return;
        const [x, y] = px;
        const brightness = Math.max(0, Math.min(1, (6.5 - (s.mag ?? 5)) / 7));
        const coreR = Math.max(1.5, 1.5 + brightness * 4);
        const glowR = coreR * 4.5;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        glow.addColorStop(0, `rgba(210, 230, 255, ${brightness * 0.4})`);
        glow.addColorStop(1, "rgba(200, 220, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(x, y, 0, x, y, coreR);
        core.addColorStop(
          0,
          `rgba(255, 255, 255, ${0.75 + brightness * 0.25})`,
        );
        core.addColorStop(
          0.5,
          `rgba(230, 240, 255, ${0.5 + brightness * 0.3})`,
        );
        core.addColorStop(1, "rgba(200, 220, 255, 0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(x, y, coreR, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    return () => {
      cancelled = true;
    };
  }, [name, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        display: "block",
        width: "100%",
        maxWidth: size,
        borderRadius: "1.25rem",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    />
  );
}
