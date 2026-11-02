// PeerJS(WebRTC)でブラウザ同士を直接つなぐ。サーバーを置かなくても GitHub Pages だけで部屋を作れる。
// 部屋を作った人のブラウザが戦闘を計算し、仲間には結果を送る。
const PREFIX = "mahou-sensou-v1-";
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // 見間違えやすい文字は除く
const TIMEOUT_MS = 15000;

const errText = (err) => {
  const t = err && err.type;
  if (t === "peer-unavailable") return "その部屋が見つかりません。コードを確認してください。";
  if (t === "network" || t === "server-error" || t === "socket-error") return "接続サーバーに届きません。インターネット接続を確認してください。";
  if (t === "browser-incompatible") return "このブラウザはオンライン協力に対応していません。";
  return "接続できませんでした(" + (t || err) + ")";
};

/** 部屋を作る側。handlers: { ready(code), conn(conn), message(conn, msg), leave(conn), error(text) } */
export class P2PHost {
  constructor(H) { this.H = H; this.conns = new Set(); this.open(); }
  open() {
    let code = "";
    for (let i = 0; i < 5; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
    this.peer = new window.Peer(PREFIX + code, { debug: 0 });
    this.peer.on("open", () => { this.code = code; this.H.ready(code); });
    this.peer.on("error", (err) => {
      if (err.type === "unavailable-id") { this.peer.destroy(); this.open(); }
      else if (!this.code) this.H.error(errText(err));
    });
    this.peer.on("disconnected", () => { try { this.peer.reconnect(); } catch {} });
    this.peer.on("connection", (conn) => {
      conn.on("open", () => this.conns.add(conn));
      conn.on("data", (m) => { if (m && m.t) this.H.message(conn, m); });
      const gone = () => { if (this.conns.delete(conn)) this.H.leave(conn); };
      conn.on("close", gone);
      conn.on("error", gone);
    });
  }
  send(conn, m) { if (conn.open) conn.send(m); }
  broadcast(m) { for (const c of this.conns) if (c.open) c.send(m); }
  close() { try { this.peer.destroy(); } catch {} }
}

/** 部屋に入る側。handlers: { open(), message(msg), close(), error(text) } */
export class P2PClient {
  constructor(code, H) {
    this.H = H;
    let settled = false;
    const fail = (t) => { if (!settled) { settled = true; H.error(t); this.close(); } };
    this.peer = new window.Peer({ debug: 0 });
    this.peer.on("error", (err) => fail(errText(err)));
    this.peer.on("open", () => {
      const conn = this.peer.connect(PREFIX + code.trim().toUpperCase(), { reliable: true, serialization: "json" });
      this.conn = conn;
      conn.on("open", () => { settled = true; H.open(); });
      conn.on("data", (m) => { if (m && m.t) H.message(m); });
      conn.on("close", () => { if (settled) H.close(); });
      conn.on("error", () => {});
    });
    setTimeout(() => fail("接続がタイムアウトしました。コードを確認するか、もう一度試してください。"), TIMEOUT_MS);
  }
  send(m) { if (this.conn?.open) this.conn.send(m); }
  close() { try { this.peer.destroy(); } catch {} }
}
