// オリジナルのピクセルアートをコードで描く小さな道具箱。pixelfx と同じ 32bit 色(ABGR)で描き、
// 一方向からの光・固定ディザ・自動アウトラインで手打ち風の陰影を作る。ブラウザでも Node でも動く。
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const hexc = (h) => {
  if (typeof h === "number") return h;
  let s = h.replace("#", "");
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s.slice(0, 6), 16);
  return ((255 << 24) | ((v & 255) << 16) | (v & 0xff00) | ((v >> 16) & 255)) >>> 0;
};
const LX = -.55, LY = -.62, LZ = .56;

export class Art {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.px = new Uint32Array(w * h);
    this.em = new Uint32Array(w * h);
  }
  set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c; }
  dot(x, y, h) { this.set(x, y, hexc(h)); }
  rect(x, y, w, h, c) { c = hexc(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  _pick(R, l, x, y, dth = .55) {
    const n = R.length, v = l * (n - 1) + (B4[(y & 3) * 4 + (x & 3)] / 16 - .5) * dth;
    return R[Math.max(0, Math.min(n - 1, Math.round(v)))];
  }
  /** 球状に陰影をつけた楕円。R は暗→明の色配列(hexc 済みでなくてよい)。 */
  ball(cx, cy, rx, ry, R, o = {}) {
    R = this.ramp(R);
    const a = o.rot || 0, cs = Math.cos(a), sn = Math.sin(a), ext = Math.max(rx, ry);
    for (let y = Math.floor(cy - ext - 1); y <= cy + ext + 1; y++) for (let x = Math.floor(cx - ext - 1); x <= cx + ext + 1; x++) {
      const dx = x + .5 - cx, dy = y + .5 - cy, u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry, d = u * u + v * v;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d), L = Math.max(0, u * LX + v * LY + nz * LZ);
      this.set(x, y, this._pick(R, Math.min(1, L * (o.k ?? 1.15) + (o.amb ?? .08)), x, y, o.dth));
    }
    return this;
  }
  /** 太さの変わる円柱(手足・胴・触手など)。 */
  limb(x0, y0, x1, y1, r0, r1, R, o = {}) {
    R = this.ramp(R);
    const vx = x1 - x0, vy = y1 - y0, L2 = vx * vx + vy * vy || 1, ext = Math.max(r0, r1) + 1;
    for (let y = Math.floor(Math.min(y0, y1) - ext); y <= Math.max(y0, y1) + ext; y++) for (let x = Math.floor(Math.min(x0, x1) - ext); x <= Math.max(x0, x1) + ext; x++) {
      const px = x + .5 - x0, py = y + .5 - y0, t = Math.max(0, Math.min(1, (px * vx + py * vy) / L2));
      const dx = px - vx * t, dy = py - vy * t, r = r0 + (r1 - r0) * t, d2 = dx * dx + dy * dy;
      if (d2 > r * r) continue;
      const nx = dx / r, ny = dy / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      this.set(x, y, this._pick(R, Math.min(1, Math.max(0, nx * LX + ny * LY + nz * LZ) * (o.k ?? 1.15) + (o.amb ?? .08)), x, y, o.dth));
    }
    return this;
  }
  /** 多角形。光の方向へ単純なグラデーションを掛ける。 */
  poly(pts, R, o = {}) {
    R = this.ramp(R);
    let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9;
    for (const [x, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    const W = Math.max(1, x1 - x0), H = Math.max(1, y1 - y0);
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) {
        const l = o.flat !== undefined ? o.flat : 1 - (.55 * (x - x0) / W + .45 * (y - y0) / H);
        this.set(x, y, this._pick(R, Math.max(0, Math.min(1, l)), x, y, o.dth));
      }
    }
    return this;
  }
  line(x0, y0, x1, y1, c, th = 1) {
    c = hexc(c);
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      for (let j = 0; j < th; j++) for (let k = 0; k < th; k++) this.set(x + j - (th >> 1), y + k - (th >> 1), c);
    }
    return this;
  }
  /** 既に塗られた部分にだけ模様を散らす。 */
  speck(cx, cy, rx, ry, c, density, seed = 1) {
    c = hexc(c);
    let s = seed * 9301 + 49297;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const u = (x - cx) / rx, v = (y - cy) / ry, on = u * u + v * v <= 1;
      const r = rnd();
      if (on && r < density && x >= 0 && y >= 0 && x < this.w && y < this.h && this.px[y * this.w + x]) this.px[y * this.w + x] = c;
    }
    return this;
  }
  /** 発光点: 色と加算光の両方に書く。 */
  glow(x, y, c, r = 0, power = .6) {
    const C = hexc(c);
    const lr = C & 255, lg = (C >>> 8) & 255, lb = (C >>> 16) & 255;
    for (let j = -r - 2; j <= r + 2; j++) for (let i = -r - 2; i <= r + 2; i++) {
      const d = Math.hypot(i, j), X = (x + i) | 0, Y = (y + j) | 0;
      if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) continue;
      if (d <= r + .3) this.px[Y * this.w + X] = C;
      const k = Math.max(0, 1 - d / (r + 2.5)) * power;
      if (k > 0) this.em[Y * this.w + X] = ((k * lb) << 16) | ((k * lg) << 8) | (k * lr);
    }
    return this;
  }
  ramp(R) { return R.__c || (R.__c = R.map(hexc)); }
  /** 透明なピクセルに接する縁を濃い色で囲む。 */
  outline(c = "#120e18") {
    c = hexc(c);
    const { w, h, px } = this, out = px.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (px[y * w + x]) continue;
      if ((x > 0 && px[y * w + x - 1]) || (x < w - 1 && px[y * w + x + 1]) || (y > 0 && px[(y - 1) * w + x]) || (y < h - 1 && px[(y + 1) * w + x])) out[y * w + x] = c;
    }
    this.px = out;
    return this;
  }
}
