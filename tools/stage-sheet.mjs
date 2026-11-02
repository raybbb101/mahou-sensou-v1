import { buildStage, VW, VH, PAD } from "../src/render/stage.js";
import { BOSSES } from "../src/sim/bosses.js";
import { encodePNG } from "./png.mjs";
import { writeFileSync } from "fs";
const list = (process.argv[3] || "0,4,9,12,17,19").split(",").map(Number), C = 2;
const W = VW * C, H = VH * Math.ceil(list.length / C), buf = new Uint8Array(W * H * 4);
list.forEach((f, i) => {
  const s = buildStage(BOSSES[f].stage, f + 1), ox = (i % C) * VW, oy = Math.floor(i / C) * VH;
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
    const j = (y + PAD) * s.W + x + PAD; const c = s.fore[j] || s.floor[j] || s.wall[j]; const o = ((oy + y) * W + ox + x) * 4;
    buf[o] = c & 255; buf[o + 1] = (c >>> 8) & 255; buf[o + 2] = (c >>> 16) & 255; buf[o + 3] = 255;
  }
});
writeFileSync(process.argv[2], encodePNG(W, H, buf));
