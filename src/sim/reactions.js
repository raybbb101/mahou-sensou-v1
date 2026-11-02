// 元素反応とコンボ。すべての魔法で起きるわけではなく、REACTIVE に入っている魔法だけが敵に元素を残し、反応を起こす。
// 反応は「敵に残った元素」と「別の元素の反応魔法」が出会うと起きる。組み合わせはゲーム内で説明せず、起きて初めて名前が分かる。
export const REACTIVE = new Set([
  "fireball", "flame-pillar", "meteor", "fire-ring",
  "ice-lance", "frost-nova", "ice-shatter", "ice-spikes",
  "splash", "water-orb", "water-jet", "bubbles",
  "lightning-strike", "plasma-ball", "chain-lightning", "thunderclap", "lightning-call",
  "earth-spike", "vine-whip", "acid-splash", "poison-cloud",
  "smite", "holy-pillar",
  "dark-explosion", "hex-sigil", "void-orb",
  "star-fall", "arcane-orb", "implosion",
]);
export const AURA_TIME = 5;      // 元素が残る秒数
export const REACT_ICD = .8;     // 連続で起きすぎないための間隔

const key = (a, b) => [a, b].sort().join("+");
const R = (a, b, name, mult, fx, effect) => [key(a, b), { name, mult, fx, effect }];
// effect は battle.js の applyReaction が解釈する
export const REACTIONS = Object.fromEntries([
  R("water", "thunder", "感電", 1.8, "lightning/zap-hit", "shock"),
  R("fire", "ice", "溶解", 2.5, "ice/ice-shatter", null),
  R("fire", "water", "蒸発", 2.2, "water/splash", "weaken"),
  R("ice", "thunder", "超電導", 1.4, "lightning/zap-hit", "sunder"),
  R("fire", "thunder", "過負荷", 1.6, "explosions/plasma-explosion", "stagger"),
  R("ice", "water", "凍結", 1.2, "ice/freeze", "freeze"),
  R("fire", "nature", "燃焼", 1.3, "fire/flame-pillar", "burn"),
  R("water", "nature", "開花", 1.3, "nature/healing-bloom", "bloom"),
  R("thunder", "nature", "激化", 1.5, "lightning/zap-hit", "quicken"),
  R("ice", "nature", "霜枯れ", 1.4, "ice/ice-shatter", "wither"),
  R("holy", "shadow", "天蝕", 3, "shadow/dark-explosion", "backlash"),
  R("arcane", "shadow", "虚無崩壊", 2, "explosions/implosion", "refund"),
  R("arcane", "holy", "神託", 1.4, "holy/smite", "oracle"),
]);
export const reactionOf = (a, b) => REACTIONS[key(a, b)];

// 魔法同士のコンボ: first が当たってから 5 秒以内に second を当てると、second の威力が跳ね上がる
const C = (first, second, name, mult) => ({ first, second, name, mult });
export const COMBOS = [
  C("curse", "dark-explosion", "呪爆", 2.5),
  C("root-snare", "meteor", "縫い止めの隕石", 2),
  C("freeze", "ice-shatter", "砕氷", 2.5),
  C("hex-sigil", "smite", "破邪", 2.5),
  C("toxic-puddle", "flame-pillar", "毒爆", 2.5),
  C("poison-cloud", "fireball", "引火", 2.5),
  C("bubbles", "thunderclap", "泡雷", 2.5),
  C("grasping-hands", "star-fall", "磔の星", 2.2),
  C("arcane-orb", "arcane-beam", "共振光", 2.2),
  C("blizzard-vortex", "ice-lance", "氷嵐の槍", 2.2),
  C("vine-whip", "fire-ring", "火縄", 2.2),
  C("storm-cloud", "lightning-call", "落雷誘導", 2),
  C("soul-drain", "necro-skulls", "魂喰い", 2),
  C("sunburst", "holy-pillar", "陽光の柱", 2),
];
export const COMBO_ICD = 6;
