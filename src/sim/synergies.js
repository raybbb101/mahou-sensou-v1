// 隠し効果。ゲーム内で条件は説明しない。戦闘開始時に条件を満たしていると初めて名前が明かされる。
// c = { ids, skills, n, elems(属性ごとの数), kinds, atk(攻撃魔法の数), sup(補助の数), floor, stats, spentStats, party, prevTaken, ult }
// 効果: atk hp def crit critDmg speed haste regen dmg(全ダメ倍率) elem:{属性:倍率} dodge(回避時間) dashCd ult(必殺の溜まりやすさ)
const ALL = ["fire", "ice", "water", "thunder", "arcane", "holy", "shadow", "nature"];
const NAMES = { fire: "灼熱", ice: "凍界", water: "深海", thunder: "雷帝", arcane: "秘奥", holy: "聖域", shadow: "深淵", nature: "森羅" };
const has = (c, ...x) => x.every((id) => c.ids.includes(id));
const S = (id, name, desc, check, fx) => ({ id, name, desc, check, fx });

const pure = ALL.flatMap((el) => [
  S(`pure4-${el}`, `${NAMES[el]}の血統`, `${NAMES[el]}の力が濃くなる(属性ダメージ+50%)`, (c) => c.n >= 4 && c.n < 8 && c.elems[el] === c.n, { elem: { [el]: .5 } }),
  S(`pure8-${el}`, `${NAMES[el]}の化身`, `${NAMES[el]}そのものになる(属性ダメージ+120%・再使用-15%)`, (c) => c.n >= 8 && c.elems[el] === c.n, { elem: { [el]: 1.2 }, haste: 15 }),
]);

export const SYNERGIES = [
  ...pure,
  S("rainbow", "八元の調和", "全属性が揃った(全ダメージ+40%・再使用-15%)", (c) => ALL.every((e) => c.elems[e] >= 1), { dmg: .4, haste: 15 }),
  S("lone-pair", "孤高の双璧", "二つの魔法だけで十層を越えた(全ダメージ+150%)", (c) => c.n === 2 && c.floor >= 10 && c.floor < 15, { dmg: 1.5 }),
  S("lone-pair2", "極点の双璧", "二つの魔法だけで十五層を越えた(全ダメージ+300%・HP+50%)", (c) => c.n === 2 && c.floor >= 15, { dmg: 3, hp: .5 }),
  S("one-thought", "一念", "ただ一つの魔法を信じた(全ダメージ+200%・再使用-40%)", (c) => c.n === 1 && c.floor >= 5, { dmg: 2, haste: 60 }),
  S("trinity", "三位一体", "三つの魔法、三つの属性(全ダメージ+30%)", (c) => c.n === 3 && Object.values(c.elems).filter(Boolean).length === 3, { dmg: .3 }),
  S("seven", "七星", "七つの魔法を携えた(会心率+17%)", (c) => c.n === 7, { crit: 17 }),
  S("master", "極めし者", "ランク10の魔法を持った(会心ダメージ+40%)", (c) => c.skills.some((s) => s.rank >= 10), { critDmg: 40 }),
  S("grandmaster", "三賢の極致", "ランク10の魔法を三つ持った(全ダメージ+50%)", (c) => c.skills.filter((s) => s.rank >= 10).length >= 3, { dmg: .5 }),
  S("veteran", "百戦錬磨", "十の魔法すべてがランク5以上(全ダメージ+35%・HP+25%)", (c) => c.n === 10 && c.skills.every((s) => s.rank >= 5), { dmg: .35, hp: .25 }),
  S("balance", "均衡", "すべての魔法が同じランク(再使用-20%)", (c) => c.n >= 4 && c.skills.every((s) => s.rank === c.skills[0].rank) && c.skills[0].rank >= 2, { haste: 25 }),
  S("all-offense", "背水の陣", "攻撃魔法しか持たない(攻撃力+30%・HP-15%)", (c) => c.n >= 6 && c.sup === 0, { atk: .3, hp: -.15 }),
  S("guardian", "守護者の誓い", "攻撃魔法は一つだけ(HP+60%・防御+50%・その攻撃+80%)", (c) => c.n >= 4 && c.atk === 1, { hp: .6, def: .5, dmg: .8 }),
  S("focus-atk", "一点突破", "ステータスを攻撃力だけに注いだ(攻撃力+40%)", (c) => c.stats.atk >= 15 && c.spentStats === c.stats.atk, { atk: .4 }),
  S("focus-hp", "不動の山", "ステータスを最大HPだけに注いだ(毎秒HP+1.5%相当の再生)", (c) => c.stats.hp >= 15 && c.spentStats === c.stats.hp, { regenPct: .015 }),
  S("focus-speed", "疾風", "移動速度を鍛え抜いた(回避の無敵+0.15秒・再使用-40%)", (c) => c.stats.speed >= 12, { dodge: .15, dashCd: .4 }),
  S("glass", "硝子の刃", "会心ダメージを鍛え抜いた(会心率+25%)", (c) => c.stats.critDmg >= 15, { crit: 25 }),
  S("pure-magic", "魔道一筋", "ステータスに一度も振らなかった(全ダメージ+60%)", (c) => c.floor >= 5 && c.spentStats === 0, { dmg: .6 }),
  S("light-dark", "光と闇の均衡", "聖と闇を同じ数だけ持つ(全ダメージ+35%)", (c) => c.elems.holy >= 2 && c.elems.holy === c.elems.shadow, { dmg: .35 }),
  S("ice-fire", "対消滅", "火と氷を同じ数だけ持つ(火と氷のダメージ+50%)", (c) => c.elems.fire >= 2 && c.elems.fire === c.elems.ice, { elem: { fire: .5, ice: .5 } }),
  S("circuit", "感電回路", "水と雷を二つずつ以上(雷のダメージ+70%)", (c) => c.elems.water >= 2 && c.elems.thunder >= 2, { elem: { thunder: .7 } }),
  S("wildfire", "山火事", "火と樹を二つずつ以上(火のダメージ+60%)", (c) => c.elems.fire >= 2 && c.elems.nature >= 2, { elem: { fire: .6 } }),
  S("meteor-lord", "天墜の王", "メテオとメテオコールを同時に持つ(火のダメージ+80%)", (c) => has(c, "meteor", "meteor-call"), { elem: { fire: .8 } }),
  S("trident", "三叉の雷", "三つの雷撃魔法を揃えた(雷のダメージ+70%)", (c) => has(c, "lightning-call", "lightning-strike", "chain-lightning"), { elem: { thunder: .7 } }),
  S("arcanist", "秘奥の継承", "アーケインの名を持つ魔法をすべて揃えた(秘のダメージ+90%)", (c) => has(c, "arcane-orb", "arcane-beam", "arcane-missiles"), { elem: { arcane: .9 } }),
  S("necromancer", "死霊術師", "髑髏と魂と命を奪う魔法を揃えた(闇のダメージ+80%)", (c) => has(c, "necro-skulls", "soul-drain", "life-steal"), { elem: { shadow: .8 } }),
  S("frost-lord", "氷獄の主", "ブリザードとフリーズとアイスシャッターを揃えた(氷のダメージ+90%)", (c) => has(c, "blizzard-vortex", "freeze", "ice-shatter"), { elem: { ice: .9 } }),
  S("healer", "癒し手の極み", "回復の魔法を三つ揃えた(HP+40%・再生)", (c) => ["heal", "heal-aoe", "healing-bloom", "holy-pillar", "feather-burst"].filter((i) => c.ids.includes(i)).length >= 3, { hp: .4, regenPct: .01 }),
  // 相性が悪い組み合わせ。水と火が打ち消し合うなど
  S("clash-fw", "水火の相克", "水と火が打ち消し合っている(水と火のダメージ-25%)", (c) => c.elems.fire >= 2 && c.elems.water >= 2, { elem: { fire: -.25, water: -.25 }, bad: 1 }),
  S("clash-hs", "聖闇の相克", "聖と闇がせめぎ合っている(聖と闇のダメージ-20%)", (c) => c.elems.holy >= 2 && c.elems.shadow >= 2 && c.elems.holy !== c.elems.shadow, { elem: { holy: -.2, shadow: -.2 }, bad: 1 }),
  S("clash-in", "氷雷の不和", "氷と雷を三つずつ以上持つ(再使用+15%)", (c) => c.elems.ice >= 3 && c.elems.thunder >= 3, { haste: -13, bad: 1 }),
  S("spotless", "無傷の誉れ", "前の階を無傷で越えた(攻撃力+50%)", (c) => c.floor > 1 && c.prevTaken === 0, { atk: .5 }),
  S("ult-pure", "必殺の極意", "同じ属性の魔法を三つ以上持つ(必殺技が1.5倍速く溜まる)", (c) => Object.values(c.elems).some((v) => v >= 3) && c.n <= 5, { ult: .5 }),
  S("resonance", "共鳴", "仲間と同じ魔法を持っている(全ダメージ+25%)", (c) => c.party.length > 1 && c.party.some((q) => q !== c.me && q.skills.some((s) => c.ids.includes(s.id))), { dmg: .25 }),
  S("full-party", "四人の誓い", "四人で塔を登っている(HP+20%・全ダメージ+20%)", (c) => c.party.length === 4, { hp: .2, dmg: .2 }),
];
export const SYN = Object.fromEntries(SYNERGIES.map((s) => [s.id, s]));
