// スキルのアイコン/カード絵は、実際のエフェクトの一番派手な瞬間をその場でレンダリングして作る。
import { createFrame, clearFrame, createFx, composite } from "../../vendor/pixelfx/src/core/index.js";
import { FX } from "../render/fx-registry.js";
import { FX_HIT, SKILLS } from "../sim/skills.js";
import { heroActor } from "../render/hero.js";

const cache = new Map();
const actor = heroActor("#3f8cff");
const LOOP_T = { "water/water-orb": 1 };

export const iconUrl = (id) => fxIconUrl(SKILLS[id].fx);
export function fxIconUrl(fxId) {
  let u = cache.get(fxId);
  if (u) return u;
  const s = { fx: fxId }, mod = FX[fxId];
  const f = createFrame(360, 300, -180, -220);
  const fx = createFx(mod, { x: 0, y: 0, seed: 7, ...(mod.meta.actor ? { actor } : {}) });
  const T = mod.meta.loop ? mod.meta.duration * .4 : (FX_HIT[s.fx] ?? mod.meta.duration * .3) + .06;
  for (let t = 0; t < T; t += 1 / 30) fx.update(1 / 30);
  clearFrame(f);
  fx.draw(f);
  const rgba = new Uint8ClampedArray(360 * 300 * 4);
  composite(f, rgba, null);
  // 描かれた範囲を切り抜く
  let x0 = 360, y0 = 300, x1 = 0, y1 = 0;
  for (let y = 0; y < 300; y++) for (let x = 0; x < 360; x++) if (rgba[(y * 360 + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) { x0 = 150; x1 = 210; y0 = 180; y1 = 240; }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const src = document.createElement("canvas"); src.width = w; src.height = h;
  const img = new ImageData(w, h);
  for (let y = 0; y < h; y++) img.data.set(rgba.subarray(((y + y0) * 360 + x0) * 4, ((y + y0) * 360 + x0 + w) * 4), y * w * 4);
  src.getContext("2d").putImageData(img, 0, 0);
  // 正方形の余白に入れる
  const side = Math.max(w, h, 36);
  const c = document.createElement("canvas"); c.width = side; c.height = side;
  c.getContext("2d").drawImage(src, (side - w) >> 1, (side - h) >> 1);
  u = c.toDataURL();
  cache.set(fxId, u);
  return u;
}

/** カードにホバーしたとき本物のエフェクトを再生する。 */
export function playPreview(canvas, fxId) {
  const mod = FX[fxId];
  const W = Math.min(300, Math.max(mod.meta.size[0], 120)), H = Math.min(240, Math.max(mod.meta.size[1], 90));
  const [ox, oy] = mod.meta.origin;
  const f = createFrame(W, H, -Math.round(W / 2 + (W >= mod.meta.size[0] ? ox - mod.meta.size[0] / 2 : 0)), -Math.min(H - 4, oy));
  const img = new ImageData(W, H);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  let fx = createFx(mod, { x: 0, y: 0, seed: 3, ...(mod.meta.actor ? { actor } : {}) });
  let last = performance.now(), run = true;
  const tick = (now) => {
    if (!run) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    fx.update(dt);
    clearFrame(f);
    fx.draw(f);
    composite(f, img.data, null);
    ctx.putImageData(img, 0, 0);
    if (fx.done() || fx.t > 3.5) fx = createFx(mod, { x: 0, y: 0, seed: 3, ...(mod.meta.actor ? { actor } : {}) });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => { run = false; ctx.clearRect(0, 0, W, H); };
}
