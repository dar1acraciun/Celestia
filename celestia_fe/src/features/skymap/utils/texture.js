import * as tr from "three";

export const ciToColor = (ci) => {
  if (ci === null || ci === undefined) return new tr.Color(1, 1, 1);
  if (ci < -0.3) return new tr.Color(0.67, 0.75, 1.0);
  if (ci < 0.0) return new tr.Color(0.79, 0.84, 1.0);
  if (ci < 0.3) return new tr.Color(1.0, 1.0, 1.0);
  if (ci < 0.6) return new tr.Color(1.0, 0.96, 0.92);
  if (ci < 1.0) return new tr.Color(1.0, 0.82, 0.63);
  return new tr.Color(1.0, 0.67, 0.44);
};

export const makeStarTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(255,255,255,0.8)");
  g.addColorStop(0.5, "rgba(255,255,255,0.3)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new tr.CanvasTexture(c);
};

export const makeLabel = (text) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 80;
  const ctx = c.getContext("2d");
  ctx.font = "400 44px sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(100,170,255,1)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text.toUpperCase(), 256, 54);
  const sprite = new tr.Sprite(
    new tr.SpriteMaterial({
      map: new tr.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(200, 32, 1);
  return sprite;
};

export const makeHorizonLabel = (text) => {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.font = "500 64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(90,20,20,0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#8b2020";
  ctx.fillText(text.toUpperCase(), 64, 68);
  const sprite = new tr.Sprite(
    new tr.SpriteMaterial({
      map: new tr.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(60, 60, 1);
  return sprite;
};

export const makeRingTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  ctx.strokeStyle = "rgba(180, 220, 255, 0.9)";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "rgba(120,180,255,0.8)";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(32, 32, 26, 0, Math.PI * 2);
  ctx.stroke();
  return new tr.CanvasTexture(c);
};

export const spectralType = (ci) => {
  if (ci === null || ci === undefined) return "";
  if (ci < -0.3) return "O/B · albastru";
  if (ci < 0.0) return "A · alb-albăstrui";
  if (ci < 0.3) return "F · alb";
  if (ci < 0.6) return "G · galben";
  if (ci < 1.0) return "K · portocaliu";
  return "M · roșu";
};
