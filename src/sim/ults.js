// 必殺技 20 種。第 1 層で 1 つだけ選び、死ぬまで変えられない。レベルアップもなし。
// charge.type: dodge 完全回避 / damage 与ダメ / cast 発動回数 / taken 被ダメ / heal 回復量 / crit 会心 / status 状態異常付与
//              weak 弱点ヒット / distance 移動距離 / time 生存秒 / lowhp 瀕死秒 / nohit 連続無傷秒 / close 接近秒
// sky: 発動した本人の画面にだけ重なる全画面エフェクト(weather)。
export const CHARGE_LABEL = {
  dodge: (n) => `完全回避 ${n}回`, damage: (n) => `与ダメージ ${n}`, cast: (n) => `魔法の発動 ${n}回`, taken: (n) => `被ダメージ ${n}`,
  heal: (n) => `回復量 ${n}`, crit: (n) => `会心 ${n}回`, status: (n) => `状態異常の付与 ${n}回`, weak: (n) => `弱点ヒット ${n}回`,
  distance: (n) => `移動距離 ${n}`, time: (n) => `戦闘 ${n}秒`, lowhp: (n) => `HP40%以下で ${n}秒`, nohit: (n) => `無傷のまま ${n}秒`, close: (n) => `ボスの近くで ${n}秒`,
};
const U = (id, name, color, charge, need, sky, icon, desc, extra = {}) => ({ id, name, color, charge: { type: charge, need }, sky, icon, desc, ...extra });

const LIST = [
  U("meteor-rain", "天墜・流星審判", "#ff8a30", "dodge", 20, "weather/shooting-stars", "fire/meteor", "空を埋める隕石がボスへ降り注ぐ。最大HPの22%を削る。"),
  U("inferno", "獄炎天蓋", "#ff5a20", "damage", 10000, "weather/god-rays", "fire/fire-tornado", "炎の柱で敵を囲む。最大HPの18%を削り、15秒間焼き続ける。", { skyPal: "fire" }),
  U("zero", "絶対零度", "#9bdcff", "dodge", 15, "weather/blizzard", "ice/frost-nova", "ボスを6秒間完全に凍らせ、8秒間受けるダメージを+50%する。"),
  U("thunder-god", "神鳴", "#ffe14a", "cast", 100, "weather/storm", "lightning/lightning-strike", "天雷を10連続で落とす。最大HPの20%を削り、3秒間痺れさせる。"),
  U("miracle", "聖母の奇跡", "#fff09a", "taken", 1500, "weather/god-rays", "holy/heal-aoe", "全味方を全回復して状態異常を消し、倒れた仲間も蘇らせる。5秒間無敵。"),
  U("time-prison", "時の牢獄", "#c684ff", "cast", 60, "weather/fog", "arcane/time-stop", "ボスの時を8秒間止め、全魔法の再使用をなくす。"),
  U("overdrive", "魔力暴走", "#ec6cff", "cast", 80, "weather/aurora", "arcane/mana-burst", "12秒間、魔法の再使用が4倍の速さで回復する。"),
  U("void-devour", "虚無喰らい", "#8a5ad0", "damage", 8000, "weather/fog", "shadow/black-hole", "ボスの最大HPの12%を喰らい、自分を全回復する。"),
  U("doom", "破滅の呪詛", "#b03080", "crit", 30, "weather/rain", "shadow/curse", "15秒間、ボスの防御を0にし、味方全員のダメージを2倍にする。"),
  U("yggdrasil", "世界樹の加護", "#7cc048", "heal", 2000, "weather/falling-leaves", "nature/healing-bloom", "15秒間、味方全員が毎秒HP8%回復し、受けるダメージが3分の1になる。"),
  U("storm-avatar", "嵐の化身", "#7cc8ff", "distance", 6000, "weather/storm", "nature/tornado", "12秒間、移動速度2倍。回避の再使用がなくなり、周囲を雷で打ち続ける。"),
  U("phoenix", "不死鳥の羽", "#ffa040", "time", 180, "weather/cherry-blossoms", "fire/fire-ring", "30秒間、攻撃力2倍。その間に倒れても1度だけ全回復で蘇る。", { skyPal: "fire" }),
  U("blood-pact", "血の盟約", "#e0304a", "close", 60, "weather/rain", "status/rage", "今のHPの半分を捧げ、10秒間ダメージを4倍にする。", { skyPal: "blood" }),
  U("sanctuary", "絶対聖域", "#fff6c4", "nohit", 45, "weather/god-rays", "holy/divine-shield", "10秒間、味方全員が完全に無敵になる。"),
  U("all-out", "全魔法斉射", "#ffd84a", "cast", 120, "weather/shooting-stars", "arcane/star-fall", "全魔法の再使用をなくし、攻撃魔法をすべて2回ずつ放つ。"),
  U("insight", "弱点看破", "#a8ffe0", "weak", 50, "weather/fireflies", "arcane/rune-circle", "20秒間、すべての攻撃が弱点扱いで必ず会心。吸収も耐性も無視する。"),
  U("phantoms", "千の幻影", "#d0a0ff", "damage", 15000, "weather/snow", "spawn/summon-rise", "15秒間、6体の幻影が自分の代わりに魔弾を撃ち続ける。"),
  U("scales", "審判の天秤", "#f0e6c8", "status", 40, "weather/clouds", "holy/smite", "ボスのバフと障壁をすべて砕き、5秒間怯ませて最大HPの8%を削る。"),
  U("last-stand", "起死回生", "#ff9a8a", "lowhp", 40, "weather/cherry-blossoms", "holy/sunburst", "全回復し、ボスがすでに失ったHPの30%をさらに削る。"),
  U("ragnarok", "終末の日", "#ff4040", "damage", 30000, "weather/storm", "shadow/dark-explosion", "すべてを焼き払う。最大HPの35%を削る。発動に最も時間がかかる。", { skyPal: "blood" }),
];
export const ULTS = Object.fromEntries(LIST.map((u) => [u.id, u]));
export const ULT_IDS = LIST.map((u) => u.id);
export const chargeLabel = (u) => CHARGE_LABEL[u.charge.type](u.charge.need);
