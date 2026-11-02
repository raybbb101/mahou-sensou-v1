#!/usr/bin/env node
// 魔法戦争サーバー: ゲームの配信 + マルチプレイの部屋。依存パッケージなし。
//   node server.mjs [ポート]    → http://localhost:8080
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";
import { Session, MAX_PLAYERS } from "./src/sim/session.js";
import { TICK } from "./src/sim/battle.js";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = +(process.argv[2] || process.env.PORT || 8080);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2" };

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path === "/") path = "/index.html";
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT) || !(await stat(file)).isFile()) throw 0;
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404); res.end("not found");
  }
});

// ── WebSocket(RFC 6455 の最小実装)──
function encodeFrame(text) {
  const data = Buffer.from(text), n = data.length;
  const head = n < 126 ? Buffer.from([0x81, n]) : n < 65536 ? Buffer.from([0x81, 126, n >> 8, n & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x81; b[1] = 127; b.writeBigUInt64BE(BigInt(n), 2); return b; })();
  return Buffer.concat([head, data]);
}
class Conn {
  constructor(socket, onMessage, onClose) {
    this.socket = socket; this.buf = Buffer.alloc(0); this.onMessage = onMessage; this.onClose = onClose; this.alive = true;
    socket.on("data", (d) => this.feed(d));
    socket.on("close", () => this.close());
    socket.on("error", () => this.close());
  }
  close() { if (!this.alive) return; this.alive = false; this.socket.destroy(); this.onClose(this); }
  send(obj) { if (this.alive && this.socket.writable) this.socket.write(encodeFrame(JSON.stringify(obj))); }
  feed(d) {
    this.buf = Buffer.concat([this.buf, d]);
    while (this.buf.length >= 2) {
      const op = this.buf[0] & 15, masked = this.buf[1] & 128;
      let len = this.buf[1] & 127, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
      if (len > 1 << 16) return this.close();
      const total = off + (masked ? 4 : 0) + len;
      if (this.buf.length < total) return;
      let payload = this.buf.subarray(off + (masked ? 4 : 0), total);
      if (masked) { const m = this.buf.subarray(off, off + 4); payload = Buffer.from(payload.map((b, i) => b ^ m[i & 3])); }
      this.buf = this.buf.subarray(total);
      if (op === 8) return this.close();
      if (op === 9) { this.socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }
      if (op === 1) { try { this.onMessage(this, JSON.parse(payload.toString())); } catch {} }
    }
  }
}

// ── 部屋 ──
const rooms = new Map();
const newCode = () => { let c; do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (rooms.has(c)); return c; };
class Room {
  constructor(code) {
    this.code = code; this.session = new Session(); this.conns = new Map(); this.tick = 0; this.nextId = 1; this.sent = "";
    this.timer = setInterval(() => this.step(), TICK * 1000);
  }
  broadcast(o) { for (const c of this.conns.keys()) c.send(o); }
  step() {
    const S = this.session;
    const b = S.step();
    if (b) {
      this.tick++;
      // 2 tick ごとに送信(15Hz)。決着の瞬間も必ず送る。
      if (this.tick % 2 === 0 || S.phase !== "battle") this.broadcast({ t: "snap", s: b.snapshot() });
    }
    if (S.dirty) { S.dirty = false; this.broadcast({ t: "state", s: S.publicState(), code: this.code }); }
  }
  add(conn, name) {
    if (this.session.players.length >= MAX_PLAYERS) return conn.send({ t: "error", msg: "この部屋は満員です" });
    if (this.session.phase !== "lobby") return conn.send({ t: "error", msg: "この部屋はすでに冒険を始めています" });
    const id = "p" + this.nextId++;
    this.session.addPlayer(id, String(name || "").slice(0, 10) || undefined);
    this.conns.set(conn, id);
    conn.room = this;
    conn.send({ t: "joined", id, code: this.code });
    this.session.dirty = true;
  }
  remove(conn) {
    const id = this.conns.get(conn);
    this.conns.delete(conn);
    this.session.removePlayer(id);
    if (!this.conns.size) { clearInterval(this.timer); rooms.delete(this.code); }
  }
}
function onMessage(conn, m) {
  if (m.t === "create") { const r = new Room(newCode()); rooms.set(r.code, r); r.add(conn, m.name); return; }
  if (m.t === "join") { const r = rooms.get(String(m.code)); if (!r) return conn.send({ t: "error", msg: "部屋が見つかりません" }); r.add(conn, m.name); return; }
  const r = conn.room; if (!r) return;
  const id = r.conns.get(conn);
  if (m.t === "act") r.session.action(id, m.a);
  if (m.t === "input") r.session.input(id, m.i);
}
server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) return socket.destroy();
  const accept = createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  socket.setNoDelay(true);
  new Conn(socket, onMessage, (c) => c.room?.remove(c));
});
server.listen(PORT, () => {
  console.log(`魔法戦争  http://localhost:${PORT}`);
  for (const list of Object.values(networkInterfaces())) for (const n of list) if (n.family === "IPv4" && !n.internal) console.log(`同じネットワークの仲間は  http://${n.address}:${PORT}`);
});
