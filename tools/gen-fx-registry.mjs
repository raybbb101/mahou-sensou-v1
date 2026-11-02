// src/sim の中で使うエフェクト ID を集めて、静的 import の一覧を生成する(バンドルできるように)。
import { readFileSync, writeFileSync, existsSync } from "fs";
const src = ["src/sim/skills.js", "src/sim/bosses.js", "src/sim/battle.js", "src/render/view.js", "src/sim/ults.js"].filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
const ids = [...new Set([...src.matchAll(/"((?:fire|explosions|water|ice|lightning|scifi|projectiles|spawn|arcane|holy|shadow|status|nature|weather)\/[a-z-]+)"/g)].map((m) => m[1]))].sort();
const missing = ids.filter((id) => !existsSync(`vendor/pixelfx/src/fx/${id}.js`));
if (missing.length) { console.error("見つからないエフェクト:", missing); process.exit(1); }
const v = (id) => "fx_" + id.replace(/[\/-]/g, "_");
writeFileSync("src/render/fx-registry.js", `// tools/gen-fx-registry.mjs が生成。手で編集しない。\n${ids.map((id) => `import * as ${v(id)} from "../../vendor/pixelfx/src/fx/${id}.js";`).join("\n")}\n\nexport const FX = {\n${ids.map((id) => `  "${id}": ${v(id)},`).join("\n")}\n};\n`);
console.log(ids.length, "effects");
