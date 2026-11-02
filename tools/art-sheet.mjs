// ボスとキャラの一覧画像を出力して確認する。 node tools/art-sheet.mjs out.png
import { bakeBoss, BOSS_ART } from "../src/render/bosses-art.js";
import { paintHero, paintImp } from "../src/render/hero.js";
import { encodePNG } from "./png.mjs";
import { writeFileSync } from "fs";
const ids = Object.keys(BOSS_ART), cols = 5, CW = 180, CH = 160;
const rows = Math.ceil(ids.length / cols) + 1, W = cols * CW, H = rows * CH, K = 2;
const buf = new Uint8Array(W * K * H * K * 4);
const put = (x, y, c) => { for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const o = ((y * K + j) * W * K + x * K + i) * 4; buf[o] = c & 255; buf[o + 1] = (c >>> 8) & 255; buf[o + 2] = (c >>> 16) & 255; buf[o + 3] = 255; } };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, ((Math.floor(x / CW) + Math.floor(y / CH)) % 2) ? 0xff2a2438 : 0xff322c44);
const blit = (a, ox, oy) => { for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) { const c = a.px[y * a.w + x]; if (c) put(ox + x, oy + y, c); } };
ids.forEach((id, i) => { const b = bakeBoss(id); const f = process.argv[3] === "cast" ? b.cast[0] : b.idle[2]; blit(f, (i % cols) * CW + (CW - f.w >> 1), Math.floor(i / cols) * CH + (CH - f.h - 6)); });
const ry = (rows - 1) * CH + 20; let x = 10;
for (const col of ["#d8486a", "#3f8cff", "#45b86a", "#e8a218"]) for (const [d, s, c] of [[0, 0, 0], [0, 1, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0], [0, 0, 1]]) { if (x > W - 30) continue; blit(paintHero(col, d, s, c), x, ry); x += 30; }
blit(paintHero("#3f8cff", 0, 0, 0, 1), 10, ry + 60); blit(paintImp(0), 50, ry + 70);
writeFileSync(process.argv[2] || "sheet.png", encodePNG(W * K, H * K, buf));
