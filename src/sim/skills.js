// 魔法戦争 — 全スキル定義。描画に依存しない純データ。fx は vendor/pixelfx/src/fx のエフェクト ID。

export const ELEMENTS = {
  fire:    { name: "火", color: "#ff7a2a" },
  ice:     { name: "氷", color: "#7cd4ff" },
  water:   { name: "水", color: "#3a9df0" },
  thunder: { name: "雷", color: "#ffe14a" },
  arcane:  { name: "秘", color: "#c684ff" },
  holy:    { name: "聖", color: "#fff09a" },
  shadow:  { name: "闇", color: "#8a5ad0" },
  nature:  { name: "樹", color: "#7cc048" },
};

// 各エフェクトの「着弾の瞬間」(秒)。実測した明るさのピーク。これに当たり判定を合わせる。
export const FX_HIT = {
  "fire/flame-pillar": .5, "fire/meteor": .6, "fire/fire-ring": .3, "explosions/implosion": 1,
  "explosions/plasma-explosion": .8, "explosions/smoke-bomb": .95, "water/splash": .15, "ice/freeze": .62,
  "ice/frost-nova": .4, "ice/ice-shatter": .65, "ice/ice-spikes": 1.35, "lightning/chain-lightning": .14,
  "lightning/charge-up": 1.6, "lightning/lightning-strike": .45, "lightning/zap-hit": .05,
  "lightning/thunderclap": .1, "scifi/emp-blast": .4, "projectiles/magic-missile": .8, "spawn/summon-rise": 1.05,
  "spawn/spawn-portal": 1, "arcane/arcane-missiles": .8, "arcane/magic-circle-cast": 1.5, "arcane/blink-out": .3,
  "arcane/blink-in": .45, "arcane/time-stop": 2.4, "arcane/star-fall": 1, "arcane/mana-burst": .2,
  "holy/feather-burst": .1, "holy/heal": .7, "holy/heal-aoe": .25, "holy/holy-pillar": .62, "holy/smite": .5,
  "shadow/curse": .5, "shadow/hex-sigil": 2.6, "shadow/dark-explosion": 1.8, "shadow/grasping-hands": .55,
  "shadow/life-steal": .4, "shadow/shadow-tendrils": .4, "nature/acid-splash": .25, "nature/earth-spike": .3,
  "nature/healing-bloom": .9, "nature/root-snare": .6, "nature/vine-whip": .55, "water/water-jet": .1,
};

// 持続時間(秒) — 再生速度を決めるのに使う
const S = (id, name, elem, kind, pow, cd, fx, extra = {}) => ({ id, name, elem, kind, pow, cd, fx, ...extra });

const LIST = [
  // ── 火 ────────────────────────────────
  S("fireball", "ファイアボール", "fire", "bolt", 38, 2.6, "fire/fireball", { dir: 1, speed: 300, r: 10, splash: 34, hitFx: "explosions/plasma-explosion", hitPal: "fire", status: ["burning", 3, .3], desc: "火球を放つ。着弾で小爆発し、炎上を与えることがある。" }),
  S("fire-breath", "ファイアブレス", "fire", "cone", 11, 6, "fire/fire-breath", { len: 150, wid: .5, dur: 1.5, ticks: 6, status: ["burning", 3, .25], desc: "前方に炎を吐き続ける。詠唱中は移動が遅くなる。" }),
  S("flamethrower", "フレイム", "fire", "cone", 6.5, 7, "fire/flamethrower", { len: 170, wid: .28, dur: 2.2, ticks: 11, status: ["burning", 2, .15], desc: "細く長い火炎を噴射する。" }),
  S("fire-tornado", "ファイアトルネード", "fire", "zone", 9, 9, "fire/fire-tornado", { r: 42, dur: 5, tick: .5, range: 260, drift: 42, status: ["burning", 2, .25], desc: "炎の竜巻を呼ぶ。竜巻は敵へゆっくり進む。" }),
  S("flame-pillar", "フレイムピラー", "fire", "ground", 85, 7, "fire/flame-pillar", { r: 38, range: 300, status: ["burning", 4, .5], desc: "敵の足元から火柱を噴き上げる。" }),
  S("meteor", "メテオ", "fire", "ground", 150, 13, "fire/meteor", { r: 70, range: 340, status: ["burning", 4, .6], shake: 8, desc: "燃える岩を落とす。範囲は広いが再使用は長い。" }),
  S("meteor-call", "メテオコール", "fire", "ground", 340, 28, "fire/meteor", { r: 96, range: 360, cast: 1.3, castFx: "arcane/magic-circle-cast", castRate: 1.2, scaleLight: 1.3, status: ["burning", 6, 1], shake: 14, desc: "長い詠唱ののち大隕石を呼ぶ最大火力の魔法。詠唱中は動けない。" }),
  S("fire-ring", "ファイアリング", "fire", "nova", 70, 8, "fire/fire-ring", { r: 105, status: ["burning", 3, .4], desc: "足元から炎の輪を広げる。" }),
  // ── 爆発 ──────────────────────────────
  S("implosion", "インプロージョン", "arcane", "ground", 92, 9, "explosions/implosion", { r: 72, range: 300, rate: 1.4, status: ["slowed", 3, 1], desc: "空間を一点に潰して炸裂させる。敵の動きを鈍らせる。" }),
  S("plasma-explosion", "プラズマエクスプロージョン", "thunder", "ground", 96, 8, "explosions/plasma-explosion", { r: 76, range: 300, rate: 1.6, desc: "プラズマの塊を炸裂させる。発動が速い。" }),
  S("smoke-bomb", "スモークボム", "shadow", "zone", 5, 15, "explosions/smoke-bomb", { r: 95, dur: 4.5, tick: .5, follow: 1, rate: 1.6, ally: { dr: .4 }, desc: "煙幕をまとう。中にいる味方の被ダメージを40%軽減する。" }),
  // ── 水 ────────────────────────────────
  S("bubbles", "バブルズ", "water", "zone", 8, 11, "water/bubbles", { r: 62, dur: 5, tick: .5, range: 280, wet: 1, status: ["slowed", 2, 1], desc: "泡で敵を包み、濡らして鈍らせる。濡れた敵には雷が通りやすい。" }),
  S("splash", "スプラッシュ", "water", "ground", 58, 4.5, "water/splash", { r: 60, range: 300, wet: 1, desc: "水を叩きつけて濡らす。" }),
  S("water-jet", "ウォータージェット", "water", "line", 9, 7, "water/water-jet", { len: 188, wid: 20, dur: 1.6, ticks: 8, wet: 1, desc: "高圧の水流を放ち続ける。" }),
  S("water-orb", "ウォーターオーブ", "water", "bolt", 72, 6, "water/water-orb", { speed: 170, r: 18, hover: 1, wet: 1, hitFx: "water/splash", desc: "大きく遅い水球を放つ。" }),
  // ── 氷 ────────────────────────────────
  S("ice-lance", "アイスランス", "ice", "bolt", 52, 3.4, "ice/ice-lance", { dir: 1, speed: 430, r: 8, hitFx: "ice/ice-shatter", hitRate: 2, status: ["slowed", 2.5, .6], desc: "氷の槍を高速で投げる。" }),
  S("blizzard-vortex", "ブリザード", "ice", "zone", 9, 12, "ice/blizzard-vortex", { r: 68, dur: 6, tick: .5, range: 280, status: ["slowed", 2, 1], desc: "吹雪の渦を置く。" }),
  S("freeze", "フリーズ", "ice", "target", 42, 16, "ice/freeze", { range: 340, onBoss: 1, rate: 1.4, status: ["frozen", 1.6, 1], desc: "対象を凍結させる。ボスは凍結に抵抗を持つ。" }),
  S("frost-breath", "フロストブレス", "ice", "cone", 12, 6, "ice/frost-breath", { len: 160, wid: .45, dur: 1.2, ticks: 5, status: ["slowed", 2, .5], desc: "凍てつく息を吐く。" }),
  S("frost-nova", "フロストノヴァ", "ice", "nova", 75, 10, "ice/frost-nova", { r: 125, status: ["slowed", 3, 1], desc: "足元から氷の環を走らせる。" }),
  S("ice-shatter", "アイスシャッター", "ice", "target", 72, 7, "ice/ice-shatter", { range: 320, onBoss: 1, rate: 1.4, shatter: 2, desc: "氷を砕く。鈍足や凍結の敵には2倍のダメージ。" }),
  S("ice-spikes", "アイススパイク", "ice", "linez", 80, 7, "ice/ice-spikes", { len: 240, wid: 34, rate: 1.8, status: ["slowed", 2, .4], desc: "地を這う氷の棘を一直線に走らせる。" }),
  // ── 雷 ────────────────────────────────
  S("lightning-call", "ライトニングコール", "thunder", "ground", 125, 10, "lightning/lightning-strike", { r: 52, range: 340, cast: .45, castFx: "arcane/spell-charge", repeat: 2, repeatGap: .28, desc: "腕を掲げ、敵へ雷を連続で呼ぶ(2連撃)。" }),
  S("ball-lightning", "ボールライトニング", "thunder", "bolt", 14, 8, "lightning/ball-lightning", { speed: 95, r: 26, hover: 1, pierce: 1, life: 3.2, tickHit: .3, desc: "ゆっくり進み、触れた敵に放電し続ける雷球。" }),
  S("plasma-ball", "プラズマボール", "thunder", "bolt", 62, 5, "lightning/plasma-ball", { speed: 210, r: 14, hover: 1, hitFx: "lightning/zap-hit", status: ["stunned", .8, .15], desc: "プラズマの玉を飛ばす。" }),
  S("chain-lightning", "チェインライトニング", "thunder", "line", 26, 4.6, "lightning/chain-lightning", { len: 210, wid: 34, instant: 1, multi: 3, desc: "稲妻が連鎖し3回ヒットする。射程は短め。" }),
  S("charge-up", "チャージアップ", "thunder", "self", 0, 15, "lightning/charge-up", { rate: 2, buff: ["charged", 8, 2], desc: "雷を溜める。次に放つ魔法の威力が2倍になる。", dmgless: 1 }),
  S("storm-cloud", "ストームクラウド", "thunder", "zone", 22, 11, "lightning/storm-cloud", { r: 58, dur: 6, tick: .8, range: 300, hoverFx: 1, desc: "雷雲を呼び、下の敵を打ち続ける。" }),
  S("lightning-strike", "ライトニングストライク", "thunder", "ground", 72, 4.8, "lightning/lightning-strike", { r: 36, range: 340, desc: "狭い範囲に落雷させる。" }),
  S("zap-hit", "ザップヒット", "thunder", "target", 18, 1.2, "lightning/zap-hit", { range: 260, onBoss: 1, desc: "即座に放つ小さな電撃。短い間隔で撃てる。" }),
  S("thunderclap", "サンダークラップ", "thunder", "nova", 56, 9, "lightning/thunderclap", { r: 112, status: ["stunned", 1, .5], desc: "雷鳴を轟かせ周囲を痺れさせる。" }),
  // ── 秘術 ──────────────────────────────
  S("emp-blast", "EMPブラスト", "arcane", "nova", 60, 14, "scifi/emp-blast", { r: 110, strip: 1, desc: "魔力の衝撃波。命中した敵のバフを1つ剥がす。" }),
  S("force-field", "フォースフィールド", "arcane", "self", 0, 14, "scifi/force-field", { buff: ["barrier", 5, .3], attach: 1, desc: "最大HPの30%を吸収する障壁を張る。", dmgless: 1 }),
  S("magic-missile", "マジックミサイル", "arcane", "line", 30, 1.8, "projectiles/magic-missile", { len: 300, wid: 40, reach: 1, instant: 1, desc: "必中に近い魔弾を弧を描いて飛ばす。" }),
  S("plasma-shot", "プラズマショット", "arcane", "bolt", 15, .8, "projectiles/plasma-shot", { dir: 1, speed: 470, r: 7, hitFx: "lightning/zap-hit", desc: "連射できる小さな光弾。" }),
  S("summon-rise", "サモンライズ", "shadow", "summon", 13, 20, "spawn/summon-rise", { dur: 12, shotEvery: 1, shot: "plasma-shot", range: 220, rate: 1.6, desc: "使い魔を召喚する。12秒間、敵を撃ち続ける。" }),
  S("spawn-portal", "スポーンポータル", "arcane", "summon", 22, 16, "spawn/spawn-portal", { dur: 10, shotEvery: 1.3, shot: "magic-missile", range: 260, rate: 1.4, desc: "魔弾を吐き出す門を開く。" }),
  S("arcane-orb", "アーケインオーブ", "arcane", "bolt", 52, 6, "arcane/arcane-orb", { speed: 150, r: 22, hover: 1, pierce: 1, tickHit: .7, life: 3.4, desc: "敵を貫いて進む魔力の球。" }),
  S("portal", "ポータル", "arcane", "port", 0, 16, "arcane/portal", { range: 400, r: 100, dmgless: 1, desc: "自分と近くの味方を、ボスから離れた場所へ転移させる。" }),
  S("arcane-beam", "アーケインビーム", "arcane", "line", 20, 8, "arcane/arcane-beam", { len: 250, wid: 18, dur: 1.2, ticks: 6, desc: "直線上を貫くビームを放ち続ける。" }),
  S("arcane-missiles", "アーケインミサイル", "arcane", "line", 15, 5, "arcane/arcane-missiles", { len: 215, wid: 46, instant: 1, multi: 5, desc: "5連の魔弾を撃つ。" }),
  S("magic-circle-cast", "マジックサークル", "arcane", "zone", 0, 16, "arcane/magic-circle-cast", { r: 70, dur: 5, tick: .5, follow: 1, ally: { atk: .35 }, rate: 1.5, dmgless: 1, desc: "魔法陣を身にまとう。中の味方の攻撃力+35%。" }),
  S("blink-out", "ブリンク", "arcane", "blink", 0, 6, "arcane/blink-out", { range: 190, r: 0, rate: 2, dmgless: 1, desc: "移動している方向へ瞬間移動する。移動中は無敵。" }),
  S("rune-circle", "ルーンサークル", "arcane", "zone", 11, 15, "arcane/rune-circle", { r: 72, dur: 7, tick: .5, follow: 1, ally: { dr: .25 }, desc: "ルーンの陣。中の味方の被ダメージ-25%、敵には継続ダメージ。" }),
  S("spell-charge", "スペルチャージ", "arcane", "self", 0, 18, "arcane/spell-charge", { rate: 1, cdCut: 4, attach: 1, dmgless: 1, desc: "魔力を巡らせ、他の全スキルの再使用を4秒短縮する。" }),
  S("time-stop", "タイムストップ", "arcane", "global", 0, 32, "arcane/time-stop", { rate: 1.6, stop: 2.4, dmgless: 1, desc: "時を止める。ボスは2.4秒間動けない。" }),
  S("star-fall", "スターフォール", "arcane", "ground", 118, 9, "arcane/star-fall", { r: 82, range: 330, rate: 1.3, desc: "空から星を降らせる。" }),
  S("mana-burst", "マナバースト", "arcane", "nova", 66, 8, "arcane/mana-burst", { r: 95, cdCut: 1, desc: "魔力を解放する。他の全スキルの再使用を1秒短縮。" }),
  // ── 聖 ────────────────────────────────
  S("blessing", "ブレッシング", "holy", "aura", 0, 18, "holy/blessing", { r: 150, buff: ["blessed", 8, .25], attach: 1, dmgless: 1, desc: "味方全員の攻撃力を8秒間+25%。" }),
  S("divine-shield", "ディバインシールド", "holy", "self", 0, 22, "holy/divine-shield", { buff: ["invuln", 1.6, 1], attach: 1, dmgless: 1, desc: "1.6秒間あらゆる攻撃を無効化する。" }),
  S("feather-burst", "フェザーバースト", "holy", "nova", 42, 7, "holy/feather-burst", { r: 90, heal: .05, desc: "羽を舞わせ周囲を攻撃し、味方を少し癒す。" }),
  S("halo", "ハロー", "holy", "self", 0, 16, "holy/halo", { buff: ["halo", 8, .2], attach: 1, dmgless: 1, desc: "8秒間、会心率+20%、毎秒HP1.5%回復。" }),
  S("heal", "ヒール", "holy", "aura", 0, 12, "holy/heal", { r: 60, heal: .25, attach: 1, dmgless: 1, desc: "自分とHPが最も低い味方を25%回復。" }),
  S("sunburst", "サンバースト", "holy", "zone", 12, 12, "holy/sunburst", { r: 82, dur: 4, tick: .5, range: 300, allyAll: .02, hoverFx: 1, desc: "小さな太陽が敵を焼き、その間 味方全員を癒す。" }),
  S("heal-aoe", "ヒーリングリング", "holy", "aura", 0, 16, "holy/heal-aoe", { r: 135, heal: .2, dmgless: 1, desc: "味方全員を20%回復。" }),
  S("holy-pillar", "ホーリーピラー", "holy", "ground", 100, 9, "holy/holy-pillar", { r: 46, range: 320, heal: .08, desc: "光の柱を降ろす。中の味方は回復する。" }),
  S("smite", "スマイト", "holy", "target", 82, 6, "holy/smite", { range: 360, onBoss: 1, desc: "天罰を直接下す。" }),
  // ── 闇 ────────────────────────────────
  S("black-hole", "ブラックホール", "shadow", "zone", 22, 20, "shadow/black-hole", { r: 92, dur: 4, tick: .5, range: 300, debuff: ["sundered", 5, .3], desc: "重力の穴。範囲内の敵の防御を30%下げる。" }),
  S("curse", "カース", "shadow", "target", 20, 14, "shadow/curse", { range: 340, onBoss: 1, debuff: ["sundered", 8, .3], desc: "敵を呪い、8秒間防御を30%下げる。" }),
  S("hex-sigil", "ヘクスシジル", "shadow", "ground", 72, 10, "shadow/hex-sigil", { r: 72, range: 320, rate: 3, debuff: ["weakened", 6, .2], desc: "呪印を刻む。敵の攻撃力を6秒間20%下げる。" }),
  S("necro-skulls", "ネクロスカルズ", "shadow", "zone", 9, 11, "shadow/necro-skulls", { r: 75, dur: 5, tick: .5, follow: 1, desc: "髑髏を周囲に侍らせ、近づく敵を噛ませる。" }),
  S("dark-explosion", "ダークエクスプロージョン", "shadow", "ground", 172, 14, "shadow/dark-explosion", { r: 92, range: 320, rate: 1.6, shake: 10, desc: "闇を凝縮して爆発させる。" }),
  S("eclipse", "エクリプス", "shadow", "global", 0, 24, "shadow/eclipse", { buff: ["eclipse", 8, .3], hoverFx: 1, dmgless: 1, desc: "全味方の会心率+30%、闇属性ダメージ+50%を8秒間。" }),
  S("grasping-hands", "グラスピングハンズ", "shadow", "ground", 38, 9, "shadow/grasping-hands", { r: 62, range: 300, rate: 1.3, status: ["slowed", 3, 1], desc: "無数の手で掴み、敵を鈍らせる。" }),
  S("life-steal", "ライフスティール", "shadow", "line", 52, 7, "shadow/life-steal", { len: 200, wid: 40, instant: 1, lifesteal: .4, desc: "与えたダメージの40%を吸収する。" }),
  S("void-orb", "ボイドオーブ", "shadow", "bolt", 21, 9, "shadow/void-orb", { speed: 80, r: 28, hover: 1, pierce: 1, tickHit: .4, life: 4, desc: "ゆっくり進む虚無の球。" }),
  S("shadow-flames", "シャドウフレイムズ", "shadow", "zone", 10, 9, "shadow/shadow-flames", { r: 46, dur: 6, tick: .4, range: 300, desc: "黒い炎を立ち上らせる。" }),
  S("shadow-tendrils", "シャドウテンドリルズ", "shadow", "nova", 65, 8, "shadow/shadow-tendrils", { r: 105, status: ["slowed", 2, .6], desc: "影の触手で周囲を薙ぐ。" }),
  S("soul-drain", "ソウルドレイン", "shadow", "line", 9, 12, "shadow/soul-drain", { len: 200, wid: 40, dur: 3, ticks: 12, lifesteal: .25, slowSelf: .6, desc: "魂を吸い続け、与ダメージの25%を回復。" }),
  // ── 自然 ──────────────────────────────
  S("acid-splash", "アシッドスプラッシュ", "nature", "ground", 46, 6, "nature/acid-splash", { r: 62, range: 300, status: ["poisoned", 5, 1], debuff: ["sundered", 5, .15], desc: "酸で溶かす。毒と防御低下を与える。" }),
  S("leaf-storm", "リーフストーム", "nature", "zone", 9, 10, "nature/leaf-storm", { r: 72, dur: 5, tick: .4, follow: 1, desc: "木の葉の嵐を身にまとう。" }),
  S("earth-spike", "アーススパイク", "nature", "ground", 90, 6, "nature/earth-spike", { r: 58, range: 300, status: ["stunned", .8, .25], desc: "岩の棘を地面から突き上げる。" }),
  S("healing-bloom", "ヒーリングブルーム", "nature", "zone", 0, 14, "nature/healing-bloom", { r: 56, dur: 3.3, tick: .5, follow: 1, ally: { regen: .05 }, dmgless: 1, desc: "癒しの花を身にまとう。中の味方は毎秒HP5%回復。" }),
  S("root-snare", "ルートスネア", "nature", "target", 22, 10, "nature/root-snare", { range: 320, onBoss: 1, status: ["slowed", 4, 1], desc: "根で絡め取り、動きを大きく鈍らせる。" }),
  S("poison-cloud", "ポイズンクラウド", "nature", "zone", 16, 12, "nature/poison-cloud", { r: 105, dur: 7, tick: 1, range: 300, status: ["poisoned", 4, 1], desc: "広範囲の毒霧を撒く。" }),
  S("tornado", "トルネード", "nature", "zone", 9, 11, "nature/tornado", { r: 46, dur: 5, tick: .4, range: 260, drift: 62, desc: "竜巻を起こす。竜巻は敵を追う。" }),
  S("toxic-puddle", "トキシックパドル", "nature", "zone", 10, 10, "nature/toxic-puddle", { r: 66, dur: 8, tick: .8, range: 300, status: ["poisoned", 3, 1], desc: "毒の沼を作る。" }),
  S("vine-whip", "バインウィップ", "nature", "line", 46, 3, "nature/vine-whip", { len: 165, wid: 30, instant: 1, status: ["bleeding", 3, .3], desc: "棘の蔓で薙ぎ払う。射程は短い。" }),
  // ── ステータス魔法 ─────────────────────
  S("haste", "ヘイスト", "arcane", "self", 0, 16, "status/haste", { buff: ["haste", 6, .4], attach: 1, statusFx: 1, dmgless: 1, desc: "6秒間、移動速度と再使用回復速度+40%。" }),
  S("rage", "レイジ", "fire", "self", 0, 20, "status/rage", { buff: ["rage", 8, .5], attach: 1, statusFx: 1, dmgless: 1, desc: "8秒間、攻撃力+50%、ただし防御-30%。" }),
];

export const SKILLS = Object.fromEntries(LIST.map((s) => [s.id, s]));
export const SKILL_IDS = LIST.map((s) => s.id);
export const MAX_RANK = 10;
export const MAX_SKILLS = 10;
export const isAttack = (id) => !SKILLS[id].dmgless && SKILLS[id].pow > 0;

// ランク到達時の強化(種類ごと)。低ランクは控えめで、上げるほど回数・範囲が増え、ランク10で覚醒する。
const strongerStatus = (s) => { if (s.status) s.status = [s.status[0], s.status[1] * 1.4, Math.min(1, s.status[2] + .3)]; if (s.debuff) s.debuff = [s.debuff[0], s.debuff[1] * 1.4, s.debuff[2] * 1.2]; };
const addEcho = (s, k) => { s.echoes = [...(s.echoes || []), k]; };
const UP = {
  bolt: {
    3: ["弾が大きくなり、追尾が鋭くなる", (s) => { s.r *= 1.25; s.turn = 10; }],
    5: ["発射数+1", (s) => { s.count = (s.count || 1) + 1; }],
    7: ["付与効果・爆発を強化", (s) => { strongerStatus(s); if (s.splash) s.splash *= 1.3; }],
    9: ["発射数+1", (s) => { s.count = (s.count || 1) + 1; }],
    10: ["貫通する", (s) => { s.pierce = 1; s.tickHit = s.tickHit || .5; }],
  },
  ground: {
    3: ["範囲+20%", (s) => { s.r *= 1.2; }],
    5: ["追撃がもう1回(60%の威力)", (s) => addEcho(s, .6)],
    7: ["範囲+20%・発動が速くなる", (s) => { s.r *= 1.2; s.rate = (s.rate || 1) * 1.25; }],
    9: ["追撃がもう1回(80%の威力)", (s) => addEcho(s, .8)],
    10: ["追撃がさらに1回(100%の威力)", (s) => addEcho(s, 1)],
  },
  linez: {
    3: ["幅+25%", (s) => { s.wid *= 1.25; }],
    5: ["追撃がもう1回(60%の威力)", (s) => addEcho(s, .6)],
    7: ["発動が速くなる・付与強化", (s) => { s.rate = (s.rate || 1) * 1.25; strongerStatus(s); }],
    9: ["追撃がもう1回(80%の威力)", (s) => addEcho(s, .8)],
    10: ["追撃がさらに1回(100%の威力)", (s) => addEcho(s, 1)],
  },
  zone: {
    3: ["範囲+20%", (s) => { s.r *= 1.2; }],
    5: ["持続+30%", (s) => { s.dur *= 1.3; }],
    7: ["効果の発生が20%速くなる", (s) => { s.tick *= .8; if (s.ally) s.ally = Object.fromEntries(Object.entries(s.ally).map(([k, v]) => [k, v * 1.25])); }],
    9: ["同時に2つ出る", (s) => { s.twin = 1; }],
    10: ["範囲+30%", (s) => { s.r *= 1.3; }],
  },
  cone: {
    3: ["射程+20%", (s) => { s.len *= 1.2; }],
    5: ["ヒット数+2", (s) => { s.ticks += 2; }],
    7: ["幅+30%・付与強化", (s) => { s.wid *= 1.3; strongerStatus(s); }],
    9: ["ヒット数+3", (s) => { s.ticks += 3; }],
    10: ["詠唱中も足が遅くならない", (s) => { s.slowSelf = 1; }],
  },
  line: {
    3: ["射程+20%", (s) => { s.len *= 1.2; }],
    5: ["ヒット数が増える", (s) => { if (s.ticks) s.ticks += 2; else s.multi = (s.multi || 1) + 1; }],
    7: ["幅+30%・付与強化", (s) => { s.wid *= 1.3; strongerStatus(s); }],
    9: ["ヒット数がさらに増える", (s) => { if (s.ticks) s.ticks += 3; else s.multi = (s.multi || 1) + 2; }],
    10: ["威力+30%", (s) => { s.pow *= 1.3; }],
  },
  target: {
    3: ["射程+25%", (s) => { s.range *= 1.25; }],
    5: ["追撃がもう1回(60%の威力)", (s) => addEcho(s, .6)],
    7: ["発動が速くなる・付与強化", (s) => { s.rate = (s.rate || 1) * 1.25; strongerStatus(s); }],
    9: ["追撃がもう1回(80%の威力)", (s) => addEcho(s, .8)],
    10: ["追撃がさらに1回(100%の威力)", (s) => addEcho(s, 1)],
  },
  nova: {
    3: ["範囲+20%", (s) => { s.r *= 1.2; }],
    5: ["波がもう1回(60%の威力)", (s) => addEcho(s, .6)],
    7: ["発動中0.5秒無敵・付与強化", (s) => { s.iframes = .5; strongerStatus(s); }],
    9: ["範囲+20%・波がもう1回(80%の威力)", (s) => { s.r *= 1.2; addEcho(s, .8); }],
    10: ["波がさらに1回(100%の威力)", (s) => addEcho(s, 1)],
  },
  summon: {
    3: ["持続+25%", (s) => { s.dur *= 1.25; }],
    5: ["攻撃間隔-20%", (s) => { s.shotEvery *= .8; }],
    7: ["射程+30%", (s) => { s.range *= 1.3; }],
    9: ["同時に2体", (s) => { s.twin = 1; }],
    10: ["攻撃間隔-30%", (s) => { s.shotEvery *= .7; }],
  },
  support: {
    3: ["効果時間・回復量+20%", (s) => { if (s.buff) s.buff = [s.buff[0], s.buff[1] * 1.2, s.buff[2]]; if (s.heal) s.heal *= 1.2; if (s.cdCut) s.cdCut *= 1.2; if (s.stop) s.stop *= 1.2; }],
    5: ["効力+20%", (s) => { if (s.buff) s.buff = [s.buff[0], s.buff[1], s.buff[2] * 1.2]; if (s.heal) s.heal *= 1.2; if (s.cdCut) s.cdCut *= 1.2; if (s.stop) s.stop *= 1.1; if (s.r) s.r *= 1.2; if (s.range) s.range *= 1.2; if (s.ally) s.ally = Object.fromEntries(Object.entries(s.ally).map(([k, v]) => [k, v * 1.2])); }],
    7: ["再使用-15%", (s) => { s.cd *= .85; }],
    9: ["効果時間・効力+25%", (s) => { if (s.buff) s.buff = [s.buff[0], s.buff[1] * 1.25, s.buff[2] * 1.25]; if (s.heal) s.heal *= 1.25; if (s.stop) s.stop *= 1.25; }],
    10: ["全味方にも効果・再使用-15%", (s) => { s.cd *= .85; s.party = 1; }],
  },
};
// ランク10の属性覚醒: 攻撃魔法が命中するたびに起きる特殊効果
export const AWAKEN = {
  fire: "業火: 必ず炎上させ、炎上中の敵へのダメージ+25%",
  ice: "零度: 命中時20%で敵を一瞬凍らせる",
  water: "潤い: 必ず濡らし、命中するたび味方全員を少し回復",
  thunder: "連雷: 命中時35%で追撃の雷が落ちる",
  arcane: "魔力循環: 命中するたび他の魔法の再使用を短縮",
  holy: "聖光: 命中するたび味方全員を回復",
  shadow: "蝕み: 命中した敵の防御を下げ続ける",
  nature: "猛毒: 猛毒を与え、与ダメージの10%を吸収",
};
// 魔法ごとの特別な覚醒
const SPECIAL10 = {
  meteor: ["隕石が3連続で落ちる", (s) => { s.repeat = 3; s.repeatGap = .45; }],
  "meteor-call": ["大隕石が2個落ちる", (s) => { s.repeat = 2; s.repeatGap = .7; }],
  "lightning-call": ["雷が5連撃になる", (s) => { s.repeat = 5; s.repeatGap = .2; }],
  fireball: ["全方位に火球を放つ", (s) => { s.count = 8; s.spread = .78; }],
  "ice-lance": ["氷の槍が5本になる", (s) => { s.count = 5; }],
  "plasma-shot": ["7連射になる", (s) => { s.count = 7; }],
  heal: ["状態異常も消す", (s) => { s.cleanse = 1; }],
  "heal-aoe": ["状態異常も消す", (s) => { s.cleanse = 1; }],
  "divine-shield": ["無敵の間、攻撃力2倍", (s) => { s.shieldAtk = 1; }],
  "time-stop": ["止めている間に受けるダメージ+50%", (s) => { s.stopVuln = 1; }],
  "star-fall": ["星が5連続で降る", (s) => { s.repeat = 5; s.repeatGap = .25; }],
  "dark-explosion": ["爆発が3連続になる", (s) => { s.repeat = 3; s.repeatGap = .5; }],
  "chain-lightning": ["連鎖が10回になる", (s) => { s.multi = 10; }],
  "arcane-missiles": ["魔弾が15連になる", (s) => { s.multi = 15; }],
  "magic-missile": ["魔弾が5連になる", (s) => { s.multi = 5; }],
  "zap-hit": ["3連撃になる", (s) => { s.echoes = [1, 1]; }],
  smite: ["天罰が3連撃になる", (s) => { s.echoes = [1, 1]; }],
  "summon-rise": ["使い魔が4体になる", (s) => { s.summons = 4; }],
};
const SUPPORT_KINDS = new Set(["self", "aura", "global", "blink", "port"]);
const upOf = (b) => (b.dmgless || SUPPORT_KINDS.has(b.kind) ? UP.support : UP[b.kind] || UP.support);

/** ランクを反映したスキル仕様。最初は控えめ(基礎の80%)で、1 ランクごと +17%、再使用 -2.5%。 */
const CACHE = new Map();
export function specOf(id, rank = 1) {
  const key = id + "@" + rank;
  let s = CACHE.get(key);
  if (s) return s;
  const b = SKILLS[id];
  s = { ...b, rank, pow: b.pow * .8 * (1 + .17 * (rank - 1)), cd: b.cd * (1 - .025 * (rank - 1)) };
  const up = upOf(b);
  for (const k of [3, 5, 7, 9, 10]) if (rank >= k && up[k]) up[k][1](s);
  if (rank >= 10) {
    if (SPECIAL10[id]) SPECIAL10[id][1](s);
    if (!b.dmgless) s.awaken = 1;
  }
  CACHE.set(key, s);
  return s;
}
export function rankMilestones(id) {
  const b = SKILLS[id];
  return Object.entries(upOf(b)).map(([k, v]) => {
    if (+k !== 10) return [+k, v[0]];
    const txt = SPECIAL10[id] ? SPECIAL10[id][0] : v[0];
    return [10, "覚醒! " + txt + (b.dmgless ? "" : " / " + AWAKEN[b.elem])];
  });
}

// ── プレイヤーのステータス。上限なし。1SP あたりの増加量。──
export const STATS = {
  hp:      { name: "最大HP",     base: 120, per: 18,  unit: "" },
  atk:     { name: "攻撃力",     base: 20,  per: 2,   unit: "" },
  def:     { name: "防御力",     base: 10,  per: 3,   unit: "" },
  crit:    { name: "会心率",     base: 5,   per: 1.5, unit: "%" },
  critDmg: { name: "会心ダメージ", base: 150, per: 6,  unit: "%" },
  speed:   { name: "移動速度",   base: 100, per: 2.5, unit: "" },
  haste:   { name: "詠唱加速",   base: 0,   per: 2.5, unit: "" },
  regen:   { name: "HP自然回復", base: 0,   per: .35, unit: "/秒" },
};
export const STAT_KEYS = Object.keys(STATS);
export const statValue = (k, pts = 0) => STATS[k].base + STATS[k].per * pts;

export const STATUS_INFO = {
  burning:   { name: "炎上", fx: "status/burning", bad: 1 },
  poisoned:  { name: "毒", fx: "status/poisoned", bad: 1 },
  bleeding:  { name: "出血", fx: "status/bleeding", bad: 1 },
  frozen:    { name: "凍結", fx: "status/frozen", bad: 1 },
  stunned:   { name: "気絶", fx: "status/stunned", bad: 1 },
  sleep:     { name: "睡眠", fx: "status/sleep", bad: 1 },
  petrified: { name: "石化", fx: "status/petrified", bad: 1 },
  slowed:    { name: "鈍足", fx: "status/slowed", bad: 1 },
  cursed:    { name: "呪い", fx: "status/cursed", bad: 1 },
  confused:  { name: "混乱", fx: "status/confused", bad: 1 },
  charmed:   { name: "魅了", fx: "status/charmed", bad: 1 },
  haste:     { name: "加速", fx: "status/haste" },
  rage:      { name: "激昂", fx: "status/rage" },
};
export const HARD_CC = new Set(["frozen", "stunned", "sleep", "petrified"]);
