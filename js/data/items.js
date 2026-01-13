// js/items.js
(() => {
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 文字列 → seed（決定的）
  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }
  function pick(rng, arr) {
    return arr[rInt(rng, 0, arr.length - 1)];
  }

  // ★あなたの「二つ名の量」は減らさない：ここは今のTITLE_BY_TIERをそのまま貼る
  /* ========= 二つ名（tier別・倍率付き） ========= */
const TITLE_BY_TIER = {
  1: [
    { t: "古びた", mul: 0.90 },
    { t: "粗末な", mul: 0.95 },
    { t: "普通の", mul: 1.00 },
    { t: "軽い", mul: 1.05 },
  ],
  2: [
    { t: "良質な", mul: 1.10 },
    { t: "鋭い", mul: 1.15 },
    { t: "丈夫な", mul: 1.20 },
    { t: "素早い", mul: 1.25 },
  ],
  3: [
    { t: "名工の", mul: 1.30 },
    { t: "妖しい", mul: 1.35 },
    { t: "雷鳴の", mul: 1.40 },
    { t: "灼熱の", mul: 1.45 },
  ],
  4: [
    { t: "蒼天の", mul: 1.55 },
    { t: "紅蓮の", mul: 1.65 },
    { t: "黒曜の", mul: 1.75 },
    { t: "霜刃の", mul: 1.85 },
  ],
  5: [
    { t: "魔性の", mul: 2.00 },
    { t: "深淵の", mul: 2.15 },
    { t: "奈落の", mul: 2.30 },
    { t: "断罪の", mul: 2.45 },
  ],
  // 6: [
  //   { t: "冥府の", mul: 2.65 },
  //   { t: "虚無の", mul: 2.85 },
  //   { t: "終焉の", mul: 3.05 },
  //   { t: "星喰いの", mul: 3.25 },
  // ],
  // 7: [
  //   { t: "災厄の", mul: 3.60 },
  //   { t: "世界を裂く", mul: 3.95 },
  //   { t: "魔王の", mul: 4.30 },
  //   { t: "神滅の", mul: 4.70 },
  // ],
  // 8: [
  //   { t: "創世の", mul: 5.20 },
  //   { t: "永劫の", mul: 5.70 },
  //   { t: "黄昏の", mul: 6.20 },
  //   { t: "絶望の", mul: 6.80 },
  // ],
  // 9: [
  //   { t: "虚無王の", mul: 7.50 },
  //   { t: "終末王の", mul: 8.30 },
  //   { t: "深淵皇の", mul: 9.20 },
  //   { t: "滅界の", mul: 10.2 },
  // ],
  // 10: [
  //   { t: "神代の", mul: 11.5 },
  //   { t: "禁忌の", mul: 13.0 },
  //   { t: "審判の", mul: 14.8 },
  //   { t: "世界喰いの", mul: 17.0 },
  // ],
};

function pickTitle(tier) {
  const list = TITLE_BY_TIER[tier] || TITLE_BY_TIER[1];
  return list[rInt(0, list.length - 1)];
}

  const ITEM_TYPES = [
    { type: "sword", jp: "剣" },
    { type: "katana", jp: "刀" },
    { type: "axe", jp: "斧" },
    { type: "spear", jp: "槍" },
    { type: "staff", jp: "杖" },   // すばやさ寄り
    { type: "boots", jp: "靴" },   // すばやさ寄り
    { type: "dagger", jp: "短剣" },// すばやさ寄り
    { type: "armor", jp: "鎧" },   // たいりょく寄り
    { type: "helm", jp: "兜" },    // たいりょく寄り
  ];

  const MATERIAL_BY_TIER = {
  1: ["木", "布", "骨", "革", "錆び鉄"],
  2: ["鉄", "鋼", "青銅", "硬革", "黒鉄"],
  3: ["銀", "霊銀", "ミスリル", "黒曜", "竜骨"],
  4: ["星鉄", "紅玉", "蒼玉", "雷晶", "氷晶"],
  5: ["深淵石", "奈落鋼", "虚無鉱", "冥府骨", "終焉石"],
  // 6: ["世界樹", "星屑", "黄昏晶", "禁忌鋼", "神代金"],
  // 7: ["災厄晶", "滅界鋼", "深淵核", "虚空骨", "魔王鋼"],
  // 8: ["創世核", "永劫鋼", "神晶", "審判鋼", "絶望核"],
  // 9: ["虚無核", "終末核", "深淵皇核", "滅界核", "神滅核"],
  // 10: ["世界喰い核", "神代核", "禁忌核", "審判核", "終焉核"],
  };

  function getTierTitle(rng, tier) {
    const list = TITLE_BY_TIER[tier] || TITLE_BY_TIER[1];
    return pick(rng, list);
  }
  function getTierMaterial(rng, tier) {
    const list = MATERIAL_BY_TIER[tier] || MATERIAL_BY_TIER[1];
    return pick(rng, list);
  }
  function getType(rng) {
    return pick(rng, ITEM_TYPES);
  }

  // 同じ (tier, type, title) なら固有値が完全一致する生成
  function buildFixedBaseBonus(tier, type, titleText) {
    const seed = hashSeed(`T${tier}|${type}|${titleText}|BASE`);
    const rng = mulberry32(seed);

    // 固有は「ちから/たいりょく/すばやさ」だけ
    // TYPEで傾向を変える：剣系→power、杖靴短剣→agility、防具→vitality
    const baseBonus = { power: 0, vitality: 0, agility: 0 };

    if (["sword","katana","axe","spear"].includes(type)) {
      baseBonus.power = rInt(rng, 1, Math.max(1, tier));
      baseBonus.vitality = rInt(rng, 0, Math.floor(tier / 2));
      baseBonus.agility = rInt(rng, 0, Math.floor(tier / 2));
    } else if (["staff","boots","dagger"].includes(type)) {
      baseBonus.agility = rInt(rng, 1, Math.max(2, tier + 1));
      baseBonus.power = rInt(rng, 0, Math.floor(tier / 2));
      baseBonus.vitality = rInt(rng, 0, Math.floor(tier / 2));
    } else {
      baseBonus.vitality = rInt(rng, 1, Math.max(2, tier + 1));
      baseBonus.power = rInt(rng, 0, Math.floor(tier / 2));
      baseBonus.agility = rInt(rng, 0, Math.floor(tier / 2));
    }

    return baseBonus;
  }

  function createBaseItemForDrop(tier) {
    // 見た目要素は毎回変わってOK（素材など）
    // 固有値だけ「二つ名×TYPE（＋tier）」で固定にする
    const visSeed = hashSeed(`VIS|T${tier}|${Date.now()}|${Math.random()}`);
    const rngVis = mulberry32(visSeed);

    const typeDef = getType(rngVis);
    const title = getTierTitle(rngVis, tier);
    const material = getTierMaterial(rngVis, tier);

    const baseBonusRaw = buildFixedBaseBonus(tier, typeDef.type, title.t);

    // 二つ名倍率は固有値に掛ける（これも固定になる）
    const baseBonus = {
      power: Math.floor((baseBonusRaw.power || 0) * title.mul),
      vitality: Math.floor((baseBonusRaw.vitality || 0) * title.mul),
      agility: Math.floor((baseBonusRaw.agility || 0) * title.mul),
    };

    return {
      id: `gen_${tier}_${typeDef.type}_${title.t}`, // 一意でなくてもOK（必要なら素材も入れる）
      tier,
      type: typeDef.type,
      name: `[T${tier}] ${title.t}${material}${typeDef.jp}`,
      baseBonus,
    };
  }

  window.ItemGen = {
    TITLE_BY_TIER,
    ITEM_TYPES,
    createBaseItemForDrop,
  };
})();
