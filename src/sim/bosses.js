// 魔法戦争 — 20 階層のボス定義。moves は battle.js が解釈する。pal はボス専用の色(render/palettes.js)。
// ギミックはプレイヤーが何度も挑んで見つけるもの。hint はある階にしか無い。

// 技の省略記法
const spots = (name, fx, pow, n, r, tele, x = {}) => ({ k: "spots", name, fx, pow, n, r, tele, ...x });
const nova = (name, fx, pow, r, tele, x = {}) => ({ k: "nova", name, fx, pow, r, tele, ...x });
const donut = (name, fx, pow, r, r2, tele, x = {}) => ({ k: "donut", name, fx, pow, r, r2, tele, ...x });
const cone = (name, fx, pow, len, wid, tele, x = {}) => ({ k: "cone", name, fx, pow, len, wid, tele, ...x });
const line = (name, fx, pow, len, wid, tele, x = {}) => ({ k: "line", name, fx, pow, len, wid, tele, ...x });
const fan = (name, fx, pow, n, spread, speed, x = {}) => ({ k: "fan", name, fx, pow, n, spread, speed, tele: .55, ...x });
const spiral = (name, fx, pow, n, rounds, speed, x = {}) => ({ k: "spiral", name, fx, pow, n, rounds, speed, tele: .7, ...x });
const zone = (name, fx, pow, n, r, dur, x = {}) => ({ k: "zone", name, fx, pow, n, r, dur, tele: .8, ...x });
const dash = (name, pow, wid, tele, x = {}) => ({ k: "dash", name, pow, wid, tele, ...x });
const buff = (name, fx, buffName, val, dur, x = {}) => ({ k: "buff", name, fx, buff: buffName, val, dur, tele: .6, ...x });
const hex = (name, fx, status, dur, tele, x = {}) => ({ k: "hex", name, fx, status, dur, tele, r: 34, pow: .2, ...x });
const pull = (name, fx, force, dur, x = {}) => ({ k: "pull", name, fx, force, dur, tele: .6, ...x });
const blink = (name = "転移", x = {}) => ({ k: "blink", name, tele: .3, ...x });
const combo = (name, list, x = {}) => ({ k: "combo", name, list, ...x });

const E_SPIKE = "nature/earth-spike", ROOT = "nature/root-snare", VINE = "nature/vine-whip";

export const BOSSES = [
  { id: "golem", name: "苔石の門番 グロムス", pal: "moss", stage: "moss", hitR: 40, speed: 22, weak: ["fire"], resist: ["nature"],
    hint: "最初の試練。足元に赤い印が出たら離れよう。",
    moves: [
      spots("岩突き", E_SPIKE, .9, 2, 52, 1.5, { target: "players" }),
      nova("地鳴らし", E_SPIKE, 1.1, 110, 1.7),
      fan("礫投げ", "water/water-orb", .7, 3, .5, 150, { r: 12, hover: 1, palFx: "stone" }),
    ] },
  { id: "slime", name: "泡沫王 スラムール", pal: "water", stage: "flood", hitR: 42, speed: 30, weak: ["thunder"], absorb: ["water"], resist: ["ice"],
    hint: "水は王の糧になるという…",
    moves: [
      spots("水柱", "water/splash", .9, 3, 48, 1.3, { target: "players", spread: 40 }),
      fan("泡吐き", "water/water-orb", .75, 5, .9, 135, { r: 14, hover: 1 }),
      zone("水溜まり", "water/bubbles", .35, 2, 58, 7, { status: ["slowed", 2] }),
      dash("のしかかり", 1.15, 70, 1.3),
    ] },
  { id: "salamander", name: "炎尾 サラマンドラ", pal: "fire", stage: "ember", hitR: 40, speed: 42, weak: ["water", "ice"], absorb: ["fire"],
    hint: null,
    gimmick: { kind: "overheat", every: 16, dur: 5, by: ["water", "ice"], stagger: 4, punish: "rage" },
    moves: [
      cone("火炎放射", "fire/fire-breath", .5, 190, .55, 1, { ticks: 4, dur: 1, status: ["burning", 3] }),
      fan("火球", "fire/fireball", .85, 3, .4, 230, { r: 10, dir: 1, status: ["burning", 2.5], chance: .5 }),
      spots("火柱", "fire/flame-pillar", 1, 3, 44, 1.2, { target: "players", spread: 50, status: ["burning", 3] }),
      nova("炎の環", "fire/fire-ring", 1.1, 130, 1.4, { status: ["burning", 3] }),
    ] },
  { id: "mycon", name: "菌糸の魔女 マイコーネ", pal: "poison", stage: "spore", hitR: 34, speed: 26, weak: ["fire"], resist: ["nature", "shadow"],
    hint: "紫の霧の中で、魔女は笑っている。",
    gimmick: { kind: "mire", every: 14, r: 95, heal: .012, burnBy: ["fire", "holy"] },
    moves: [
      zone("毒霧", "nature/poison-cloud", .3, 2, 90, 7, { status: ["poisoned", 4] }),
      spots("酸の雫", "nature/acid-splash", .9, 4, 46, 1.2, { target: "rand", status: ["poisoned", 4] }),
      hex("胞子の眠り", "nature/poison-cloud", "sleep", 2.2, 1.6, { r: 44, tint: "poison" }),
      zone("毒沼", "nature/toxic-puddle", .35, 3, 58, 8, { status: ["poisoned", 3] }),
      blink("胞子渡り"),
    ] },
  { id: "iceknight", name: "氷棺の騎士 ニヴェリス", pal: "ice", stage: "ice", hitR: 36, speed: 46, weak: ["fire"], absorb: ["ice"], resist: ["water"],
    hint: "厚い氷は、炎でしか溶けない。",
    gimmick: { kind: "ward", every: 22, dur: 9, dr: .9, by: ["fire"], hits: 3, stagger: 4, punish: nova("氷棺解放", "ice/frost-nova", 2, 999, .8, { status: ["frozen", 2.5] }) },
    moves: [
      fan("氷槍", "ice/ice-lance", .9, 3, .22, 340, { r: 8, dir: 1, status: ["slowed", 2] }),
      spots("氷棘", "ice/ice-spikes", 1, 1, 0, 1.15, { k: "line", len: 260, wid: 36, status: ["slowed", 2.5] }),
      nova("凍てつく環", "ice/frost-nova", 1.1, 140, 1.25, { status: ["slowed", 3] }),
      dash("氷騎突撃", 1.3, 56, 1, { fx: "ice/ice-shatter", status: ["frozen", 1.2] }),
    ] },
  { id: "raven", name: "雷雲鴉 ヴォルトレイヴン", pal: "volt", stage: "storm", hitR: 34, speed: 80, weak: ["water"], absorb: ["thunder"], resist: ["nature"],
    hint: "空にいる間は、地上の魔法が届かない。",
    gimmick: { kind: "air", every: 13, dur: 6 },
    moves: [
      spots("落雷", "lightning/lightning-strike", 1, 4, 40, 1.05, { target: "players", spread: 70, status: ["stunned", .7], chance: .35 }),
      line("チェイン", "lightning/chain-lightning", 1.1, 300, 34, .9, { status: ["stunned", .7], chance: .4 }),
      zone("雷雲", "lightning/storm-cloud", .55, 2, 58, 6, { hoverFx: 1, tick: .8 }),
      spiral("羽撃ち", "projectiles/plasma-shot", .55, 10, 2, 210, { r: 7, dir: 1 }),
      nova("雷鳴", "lightning/thunderclap", 1.1, 135, 1.05, { status: ["stunned", .9] }),
    ] },
  { id: "doll", name: "呪い人形 エリザベート", pal: "neon", stage: "doll", hitR: 30, speed: 34, weak: ["holy"], resist: ["shadow"],
    hint: null,
    gimmick: { kind: "reflect", every: 15, dur: 4.5, ratio: .75 },
    moves: [
      hex("呪いの糸", "shadow/curse", "cursed", 6, 1.1),
      hex("魅了の眼差し", "status/charmed", "charmed", 2.6, 1.5, { r: 42 }),
      fan("針の雨", "projectiles/magic-missile", .75, 7, 1.5, 175, { r: 8, fxBolt: "projectiles/plasma-shot", dir: 1 }),
      spots("呪印", "shadow/hex-sigil", 1.1, 3, 54, 1.25, { target: "players", spread: 44, status: ["confused", 2.4], chance: .6 }),
      blink("すり抜け"),
    ] },
  { id: "librarian", name: "時綴りの司書 クロノス", pal: "arcane", stage: "library", hitR: 34, speed: 30, weak: ["shadow"], resist: ["arcane"],
    hint: "止まった時の中でも、陣の中だけは安全だ。",
    gimmick: { kind: "safeRune", every: 24, warn: 4.5, lethal: 3.6, runes: 2, r: 46, fx: "arcane/time-stop" },
    moves: [
      fan("魔弾", "arcane/arcane-orb", .75, 5, .85, 150, { r: 14, hover: 1 }),
      line("光線", "arcane/arcane-beam", 1.2, 300, 20, 1, { sweep: .5, dur: 1, ticks: 3 }),
      spots("星落とし", "arcane/star-fall", 1, 4, 50, 1, { target: "rand", spread: 60 }),
      spiral("頁の嵐", "projectiles/plasma-shot", .55, 12, 3, 190, { r: 7, dir: 1 }),
      blink("頁渡り"),
    ] },
  { id: "necro", name: "骸の司祭 モルドレイ", pal: "bone", stage: "crypt", hitR: 36, speed: 28, weak: ["holy", "fire"], resist: ["shadow"], absorb: [],
    hint: "死を越える者には、聖なる光でとどめを。",
    gimmick: { kind: "revive", by: ["holy"], times: 2, at: .2 },
    moves: [
      zone("髑髏の輪", "shadow/necro-skulls", .5, 2, 70, 6, { tick: .5 }),
      spots("闇の手", "shadow/grasping-hands", .95, 3, 50, 1.05, { target: "players", spread: 40, status: ["slowed", 2.5] }),
      line("魂吸い", "shadow/soul-drain", .35, 280, 36, .8, { dur: 2.4, ticks: 6, lifesteal: .012 }),
      nova("死の波動", "shadow/shadow-tendrils", 1.05, 140, 1, { status: ["cursed", 5] }),
      buff("骨の鎧", "shadow/curse", "armor", .4, 12),
    ] },
  { id: "drake", name: "溶岩巨竜 イグニドレイク", pal: "lava", stage: "lava", hitR: 54, speed: 36, weak: ["ice", "water"], absorb: ["fire"],
    hint: "十階の主。怒りが頂点に達するのを止められるか。",
    gimmick: { kind: "overheat", every: 18, dur: 5, by: ["ice", "water"], stagger: 5, punish: "rage" },
    phases: [.5],
    moves: [
      cone("獄炎の息", "fire/flamethrower", .4, 230, .4, .85, { ticks: 7, dur: 1.5, status: ["burning", 4], sweep: .7 }),
      spots("隕石", "fire/meteor", 1.25, 3, 72, 1.1, { target: "players", spread: 80, status: ["burning", 4], shake: 8 }),
      zone("火炎竜巻", "fire/fire-tornado", .45, 2, 42, 6, { drift: 50, status: ["burning", 2] }),
      dash("竜の突進", 1.4, 80, .95),
      nova("溶岩噴出", "fire/flame-pillar", 1.2, 160, 1.1, { phase: 1 }),
      combo("流星群", [spots("", "fire/meteor", 1.1, 6, 56, .9, { target: "rand", stagger: .22, shake: 6 })], { phase: 1 }),
    ] },
  { id: "kraken", name: "深淵の眼 レヴィアタン", pal: "abyss", stage: "abyss", hitR: 50, speed: 24, weak: ["thunder"], absorb: ["water"], resist: ["ice", "fire"],
    hint: null,
    gimmick: { kind: "crystal", every: 26, n: 3, hp: .012, dr: .75, label: "深淵の核" },
    moves: [
      line("水の槍", "water/water-jet", .55, 300, 28, .75, { dur: 1, ticks: 4, sweep: .9 }),
      fan("大渦弾", "water/water-orb", .75, 8, 6.28, 125, { r: 14, hover: 1 }),
      pull("引き潮", "water/bubbles", 62, 3),
      spots("潮の柱", "water/splash", 1, 6, 50, .95, { target: "rand", stagger: .15 }),
      donut("津波", "water/splash", 1.35, 90, 400, 1.3, { fxRing: 6 }),
    ] },
  { id: "treant", name: "千年樹霊 エルダーグリム", pal: "leaf", stage: "forest", hitR: 54, speed: 12, weak: ["fire"], resist: ["water", "nature", "thunder"],
    hint: "癒しの花が咲くたびに、樹は若返る。",
    gimmick: { kind: "bloom", every: 12, n: 3, r: 26, hp: .02, heal: .02, fx: "nature/healing-bloom", label: "命の花" },
    moves: [
      line("茨の鞭", VINE, 1.05, 240, 34, .7, { status: ["bleeding", 4] }),
      spots("根の罠", ROOT, .7, 4, 48, 1, { target: "players", spread: 30, status: ["stunned", 1.1] }),
      zone("葉嵐", "nature/leaf-storm", .4, 3, 62, 6, { drift: 34 }),
      nova("大地の怒り", E_SPIKE, 1.35, 170, 1.15),
      buff("硬い樹皮", "nature/healing-bloom", "armor", .5, 10),
      buff("自己再生", "nature/healing-bloom", "regen", .002, 10),
    ] },
  { id: "mech", name: "機神 プラズマ=オルゴン", pal: "cyber", stage: "machine", hitR: 46, speed: 40, weak: ["water", "thunder"], resist: ["fire", "ice"],
    hint: "障壁は、電磁の乱れに弱い。",
    gimmick: { kind: "ward", every: 18, dur: 10, dr: .92, by: ["emp", "thunder"], hits: 4, stagger: 3, fx: "scifi/force-field", punish: spiral("過負荷", "projectiles/plasma-shot", .55, 16, 5, 260, { r: 7, dir: 1 }) },
    moves: [
      fan("プラズマ連射", "projectiles/plasma-shot", .42, 4, .55, 340, { r: 7, dir: 1, repeat: 3, interval: .22 }),
      nova("EMP", "scifi/emp-blast", .75, 175, 1, { silence: 2.6 }),
      spots("爆撃", "explosions/plasma-explosion", .95, 5, 56, .95, { target: "rand", stagger: .12, rate: 1.6 }),
      fan("プラズマ球", "lightning/plasma-ball", .7, 4, 6.28, 115, { r: 16, hover: 1, repeat: 2, interval: .6, homing: .6 }),
      buff("過給", "status/haste", "haste", .35, 9),
    ] },
  { id: "angel", name: "堕天使 ルシエラ", pal: "fallen", stage: "cathedral", hitR: 36, speed: 60, weak: ["shadow"], absorb: ["holy"],
    hint: null,
    gimmick: { kind: "judge", every: 20, need: 2 },
    moves: [
      spots("天罰", "holy/smite", 1.2, 4, 48, .9, { target: "players", spread: 30 }),
      spots("光の柱", "holy/holy-pillar", 1.1, 6, 42, .95, { target: "rand", stagger: .12 }),
      fan("黒い羽", "projectiles/plasma-shot", .75, 9, 1.8, 250, { r: 7, dir: 1, repeat: 2, interval: .35 }),
      zone("堕ちた太陽", "holy/sunburst", .55, 1, 90, 6, { hoverFx: 1, drift: 30 }),
      nova("羽嵐", "holy/feather-burst", 1.2, 155, 1),
      blink("滑空"),
    ] },
  { id: "umbra", name: "双面の影 ウンブラ", pal: "shadow", stage: "shadow", hitR: 38, speed: 54, weak: ["holy"], absorb: ["shadow"],
    hint: "光は影を暴く。",
    gimmick: { kind: "stealth", every: 17, dur: 7, dr: .85, by: ["holy", "fire"] },
    moves: [
      nova("影の触手", "shadow/shadow-tendrils", 1.2, 150, .95, { status: ["slowed", 3] }),
      zone("影炎", "shadow/shadow-flames", .4, 4, 44, 6, { tick: .4 }),
      spots("掴む手", "shadow/grasping-hands", .85, 5, 52, .9, { target: "players", spread: 60, status: ["stunned", .9], chance: .5 }),
      fan("虚ろ玉", "shadow/void-orb", .9, 4, 2.2, 105, { r: 20, hover: 1, homing: .8 }),
      dash("影渡り", 1.35, 50, .7, { fx: "shadow/dark-explosion", rate: 3 }),
      hex("恐怖", "status/confused", "confused", 3, 1.05),
    ] },
  { id: "queen", name: "凍界の女王 スカーディ", pal: "frost", stage: "frost", hitR: 38, speed: 34, weak: ["fire"], absorb: ["ice"], resist: ["water", "shadow"],
    hint: "凍りついた仲間は、砕かれる前に救え。",
    gimmick: { kind: "shatterCombo", every: 14, status: ["frozen", 2.6], pow: 2 },
    moves: [
      zone("大吹雪", "ice/blizzard-vortex", .45, 3, 68, 7, { drift: 36, status: ["slowed", 2] }),
      fan("氷槍の雨", "ice/ice-lance", .7, 7, 1.3, 330, { r: 8, dir: 1, repeat: 2, interval: .4 }),
      line("凍土の裂け目", "ice/ice-spikes", 1, 300, 40, .85, { rate: 1.8, status: ["slowed", 3], multi: 3 }),
      cone("氷の息", "ice/frost-breath", .5, 220, .6, .8, { ticks: 5, dur: 1.2, status: ["slowed", 3] }),
      buff("氷の王衣", "ice/freeze", "armor", .5, 11),
      nova("零度", "ice/frost-nova", 1.15, 200, 1, { status: ["frozen", 1.4] }),
    ] },
  { id: "titan", name: "嵐の巨神 ガルバゾン", pal: "electric", stage: "sky", hitR: 56, speed: 26, weak: ["nature"], absorb: ["thunder"], resist: ["water", "arcane"],
    hint: null,
    gimmick: { kind: "lightningRod", every: 16, n: 3, pow: 2.2, r: 58 },
    phases: [.6, .3],
    moves: [
      zone("大竜巻", "nature/tornado", .7, 2, 50, 6, { drift: 66, tick: .4 }),
      spots("裁きの雷", "lightning/lightning-strike", 1.2, 7, 42, .85, { target: "rand", stagger: .1, status: ["stunned", .8], chance: .3 }),
      nova("雷鳴撃", "lightning/thunderclap", 1.35, 175, .9, { status: ["stunned", 1] }),
      fan("球電", "lightning/ball-lightning", .9, 5, 6.28, 90, { r: 24, hover: 1, repeat: 2, interval: .5, life: 4 }),
      pull("暴風の吸引", "nature/tornado", 70, 2.6, { phase: 1 }),
      combo("雷雲の王", [zone("", "lightning/storm-cloud", .7, 3, 60, 6, { hoverFx: 1, tick: .7 }), spots("", "lightning/lightning-strike", 1.2, 4, 42, .9, { target: "players" })], { phase: 2 }),
    ] },
  { id: "archmage", name: "魔導王 アルカディウス", pal: "gold", stage: "observatory", hitR: 34, speed: 44, weak: [], resist: [],
    hint: "王は、見た魔法を決して忘れない。",
    gimmick: { kind: "mirror", every: 7, rotate: 18 },
    phases: [.5],
    moves: [
      spots("星の雨", "arcane/star-fall", 1.25, 7, 52, .85, { target: "rand", stagger: .14 }),
      nova("魔力解放", "arcane/mana-burst", 1.45, 165, .85),
      fan("秘術弾", "arcane/arcane-orb", .95, 8, 6.28, 140, { r: 15, hover: 1, repeat: 3, interval: .45 }),
      line("究極光", "arcane/arcane-beam", 1.3, 330, 24, .8, { dur: 1.2, ticks: 4, sweep: 1.3 }),
      blink("瞬間移動"),
      combo("魔導連撃", [spots("", "explosions/implosion", 1.2, 3, 62, .85, { target: "players", rate: 1.4 }), hex("", "arcane/rune-circle", "petrified", 1.8, .9, { pow: .3 })], { phase: 1 }),
    ] },
  { id: "maw", name: "虚無の顎 オメガ・ヴォイド", pal: "void", stage: "void", hitR: 58, speed: 16, weak: ["holy", "arcane"], absorb: ["shadow"], resist: ["fire", "ice"],
    hint: null,
    gimmick: { kind: "gravity", force: 16, grow: 24 },
    phases: [.66, .33],
    moves: [
      zone("ブラックホール", "shadow/black-hole", .6, 1, 92, 6, { tick: .5, pullZone: 90 }),
      spots("崩壊", "explosions/implosion", 1.1, 5, 66, .9, { target: "players", spread: 70, rate: 1.4 }),
      spiral("虚無の渦", "shadow/void-orb", .9, 8, 3, 100, { r: 18, hover: 1, spin: .35 }),
      line("命喰らい", "shadow/life-steal", 1.3, 330, 40, .75, { lifesteal: .01, sweep: .6 }),
      donut("事象の地平", "shadow/dark-explosion", 1.7, 130, 400, 1, { rate: 2, fxRing: 6, phase: 1 }),
      hex("存在希釈", "shadow/curse", "cursed", 8, .85, { phase: 1 }),
      combo("終末の蝕", [spots("", "shadow/dark-explosion", 1.6, 5, 76, .85, { target: "rand", rate: 2, stagger: .2 }), nova("", "shadow/shadow-tendrils", 1.4, 170, 1, { status: ["stunned", 1] })], { phase: 2 }),
    ] },
  { id: "warlord", name: "魔法戦争の王 ノクス=アルカ", pal: "apex", stage: "apex", hitR: 44, speed: 56, weak: [], resist: [],
    hint: "最後の王は、すべての法を纏う。纏う色を読め。",
    gimmick: { kind: "rotate", every: 14, ring: ["fire", "ice", "thunder", "holy", "shadow", "nature"], safeRune: { every: 36, warn: 4, lethal: 4.2, runes: 2, r: 44, fx: "shadow/eclipse" }, mirror: 14 },
    phases: [.75, .5, .25],
    moves: [
      spots("メテオ", "fire/meteor", 1, 4, 70, .85, { target: "players", spread: 60, status: ["burning", 4], shake: 8 }),
      fan("氷槍の陣", "ice/ice-lance", .75, 11, 2.4, 350, { r: 8, dir: 1, repeat: 2, interval: .3, status: ["slowed", 3] }),
      spots("雷帝", "lightning/lightning-strike", .95, 6, 44, .8, { target: "rand", stagger: .08, status: ["stunned", .8], chance: .4 }),
      nova("天罰環", "holy/sunburst", 1.25, 175, .85),
      dash("王の突撃", 1.3, 66, .65, { fx: "explosions/plasma-explosion", rate: 2 }),
      zone("毒の王国", "nature/poison-cloud", .7, 3, 100, 6, { status: ["poisoned", 5], phase: 1 }),
      line("滅光", "arcane/arcane-beam", 1.45, 340, 26, .7, { dur: 1.3, ticks: 4, sweep: 1.6, phase: 1 }),
      pull("虚無引力", "shadow/black-hole", 80, 2.8, { phase: 2 }),
      hex("王の呪詛", "status/petrified", "petrified", 1.8, .85, { phase: 2 }),
      combo("魔法戦争", [spots("", "fire/meteor", 1.4, 8, 66, .8, { target: "rand", stagger: .15, shake: 6 }), spiral("", "shadow/void-orb", 1, 10, 3, 120, { r: 16, hover: 1, spin: .3 }), nova("", "ice/frost-nova", 1.5, 200, .95, { status: ["frozen", 1.2] })], { phase: 3 }),
    ] },
];

// 階層ごとの基礎能力。HP と攻撃力は tests/balance.mjs の自動対戦で調整した値。
export const BOSS_HP =  [550, 1250, 2650, 4350, 6150, 7000, 7700, 11200, 12300, 17500, 18200, 19600, 22400, 26600, 28000, 30100, 33600, 46000, 50000, 80000];
export const BOSS_ATK = [16, 22, 28, 33, 38, 42, 46, 50, 54, 58, 60, 62, 64, 66, 68, 72, 76, 82, 88, 98];
export const BOSS_DEF = [0, 4, 8, 12, 18, 24, 30, 36, 42, 50, 56, 62, 68, 74, 80, 88, 96, 104, 112, 125];
export const bossGap = (f) => Math.max(1, 1.8 - .04 * f);       // 技の間隔
export const teleScale = (f) => Math.max(.88, 1.18 - .016 * f);    // 予告の長さ倍率
export const enrageAt = (f) => 75 + f * 7;                         // この秒数を超えると強化され続ける
export const spReward = (f) => 3 + Math.floor(f / 4) + (f % 5 === 0 ? 2 : 0);
export const FLOORS = BOSSES.length;
