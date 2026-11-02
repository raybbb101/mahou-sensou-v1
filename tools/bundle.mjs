// ソロ専用の 1 ファイル版を作る(サーバーなしで開ける)。 node tools/bundle.mjs <esbuild のパス> <出力.html>
import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
const [esbPath, out] = process.argv.slice(2);
const { buildSync } = createRequire(esbPath + "/")("esbuild");
const r = buildSync({ entryPoints: ["src/main.js"], bundle: true, format: "iife", minify: true, write: false, target: "es2020", charset: "utf8" });
const js = r.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const css = readFileSync("style.css", "utf8");
const body = readFileSync("index.html", "utf8").match(/<div id="stage">[\s\S]*?<\/div>\s*(?=<script)/)[0];
// 公開先が <html> の骨組みを足すので、中身だけを書き出す
const html = `<title>魔法戦争</title>
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">
<style>:root { color-scheme: dark; } ${css}</style>
${body}
<script>window.__MW_NO_NET=true;</script>
<script>${js}</script>`;
writeFileSync(out, html);
console.log(out, (html.length / 1024 | 0) + " KB");
