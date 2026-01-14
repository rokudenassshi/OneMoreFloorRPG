// js/items.js
(() => {
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
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
      { t: "古びた", mul: 0.9 },
      { t: "粗末な", mul: 0.95 },
      { t: "普通の", mul: 1.0 },
      { t: "軽い", mul: 1.05 },
    ],
    2: [
      { t: "良質な", mul: 1.1 },
      { t: "鋭い", mul: 1.12 },
      { t: "丈夫な", mul: 1.14 },
      { t: "素早い", mul: 1.16 },
      { t: "光沢の", mul: 1.18 },
      { t: "精巧な", mul: 1.2 },
      { t: "重厚な", mul: 1.22 },
      { t: "俊敏な", mul: 1.24 },
      { t: "熟練の", mul: 1.26 },
      { t: "鍛錬の", mul: 1.28 },
    ],
    3: [
      { t: "名工の", mul: 1.3 },
      { t: "妖しい", mul: 1.32 },
      { t: "雷鳴の", mul: 1.34 },
      { t: "灼熱の", mul: 1.36 },
      { t: "氷結の", mul: 1.38 },
      { t: "疾風の", mul: 1.4 },
      { t: "剛力の", mul: 1.42 },
      { t: "守護の", mul: 1.45 },
      { t: "月影の", mul: 1.48 },
      { t: "神秘の", mul: 1.52 },
    ],
    4: [
      { t: "蒼天の", mul: 1.55 },
      { t: "紅蓮の", mul: 1.6 },
      { t: "黒曜の", mul: 1.65 },
      { t: "霜刃の", mul: 1.7 },
      { t: "雷神の", mul: 1.75 },
      { t: "烈風の", mul: 1.8 },
      { t: "聖域の", mul: 1.85 },
      { t: "深緑の", mul: 1.88 },
      { t: "流星の", mul: 1.92 },
      { t: "白銀の", mul: 1.95 },
    ],
    5: [
      { t: "魔性の", mul: 2.0 },
      { t: "深淵の", mul: 2.1 },
      { t: "奈落の", mul: 2.2 },
      { t: "断罪の", mul: 2.3 },
      { t: "冥護の", mul: 2.35 },
      { t: "蒼魔の", mul: 2.4 },
      { t: "妖煌の", mul: 2.45 },
      { t: "破滅の", mul: 2.5 },
      { t: "虚裂の", mul: 2.55 },
      { t: "滅火の", mul: 2.6 },
    ],
    6: [
      { t: "冥府の", mul: 2.65 },
      { t: "虚無の", mul: 2.75 },
      { t: "終焉の", mul: 2.85 },
      { t: "星喰いの", mul: 2.95 },
      { t: "無窮の", mul: 3.05 },
      { t: "滅星の", mul: 3.15 },
      { t: "深黒の", mul: 3.25 },
      { t: "幽界の", mul: 3.35 },
      { t: "絶対の", mul: 3.45 },
      { t: "神罰の", mul: 3.5 },
    ],
    7: [
      { t: "災厄の", mul: 3.6 },
      { t: "世界を裂く", mul: 3.8 },
      { t: "魔王の", mul: 4.0 },
      { t: "神滅の", mul: 4.2 },
      { t: "覇王の", mul: 4.35 },
      { t: "獄炎の", mul: 4.5 },
      { t: "滅界の", mul: 4.65 },
      { t: "天哭の", mul: 4.8 },
      { t: "虚空の", mul: 4.95 },
      { t: "覇滅の", mul: 5.05 },
    ],
    8: [
      { t: "創世の", mul: 5.2 },
      { t: "永劫の", mul: 5.4 },
      { t: "黄昏の", mul: 5.6 },
      { t: "絶望の", mul: 5.8 },
      { t: "神代の", mul: 6.0 },
      { t: "天啓の", mul: 6.2 },
      { t: "聖刻の", mul: 6.4 },
      { t: "無限の", mul: 6.6 },
      { t: "時空の", mul: 6.9 },
      { t: "虚星の", mul: 7.2 },
    ],
    9: [
      { t: "虚無王の", mul: 7.5 },
      { t: "終末王の", mul: 8.0 },
      { t: "深淵皇の", mul: 8.5 },
      { t: "滅界の", mul: 9.0 },
      { t: "星霊王の", mul: 9.5 },
      { t: "黒天王の", mul: 10.0 },
      { t: "冥界王の", mul: 10.4 },
      { t: "断界王の", mul: 10.7 },
      { t: "無限皇の", mul: 10.9 },
      { t: "破界王の", mul: 11.0 },
    ],
    10: [
      { t: "神代の", mul: 11.5 },
      { t: "禁忌の", mul: 12.5 },
      { t: "審判の", mul: 13.5 },
      { t: "世界喰いの", mul: 14.5 },
      { t: "万象の", mul: 15.5 },
      { t: "超越の", mul: 16.0 },
      { t: "原初の", mul: 16.5 },
      { t: "絶対神の", mul: 17.0 },
      { t: "創神の", mul: 17.5 },
      { t: "終末神の", mul: 18.0 },
    ],
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
    { type: "mace", jp: "メイス" },
    { type: "hammer", jp: "ハンマー" },
    { type: "greatsword", jp: "大剣" },
    { type: "halberd", jp: "斧槍" },
    { type: "staff", jp: "杖" }, // すばやさ寄り
    { type: "boots", jp: "靴" }, // すばやさ寄り
    { type: "dagger", jp: "短剣" }, // すばやさ寄り
    { type: "bow", jp: "弓" }, // すばやさ寄り
    { type: "whip", jp: "鞭" }, // すばやさ寄り
    { type: "chakram", jp: "チャクラム" }, // すばやさ寄り
    { type: "armor", jp: "鎧" }, // たいりょく寄り
    { type: "helm", jp: "兜" }, // たいりょく寄り
    { type: "shield", jp: "盾" }, // たいりょく寄り
    { type: "gauntlet", jp: "籠手" }, // たいりょく寄り
    { type: "ring", jp: "指輪" }, // たいりょく寄り
    { type: "amulet", jp: "首飾り" }, // たいりょく寄り
  ];

  const MATERIAL_BY_TIER = {
    1: ["木", "布", "骨", "革", "錆び鉄"],
    2: ["鉄", "鋼", "青銅", "硬革", "黒鉄", "黄銅", "鉛", "錫", "白鉄", "鍛鋼"],
    3: [
      "銀",
      "霊銀",
      "ミスリル",
      "黒曜",
      "竜骨",
      "月銀",
      "霊木",
      "深鉄",
      "赤銅",
      "翠鉄",
    ],
    4: [
      "星鉄",
      "紅玉",
      "蒼玉",
      "雷晶",
      "氷晶",
      "金剛石",
      "黒鋼",
      "白鋼",
      "烈石",
      "風晶",
    ],
    5: [
      "深淵石",
      "奈落鋼",
      "虚無鉱",
      "冥府骨",
      "終焉石",
      "冥鉄",
      "魔晶",
      "幽鉄",
      "冥晶",
      "滅界石",
    ],
    6: [
      "世界樹",
      "星屑",
      "黄昏晶",
      "禁忌鋼",
      "神代金",
      "虚空木",
      "天輪石",
      "神骨",
      "宵闇鉱",
      "幽星鋼",
    ],
    7: [
      "災厄晶",
      "滅界鋼",
      "深淵核",
      "虚空骨",
      "魔王鋼",
      "冥王石",
      "崩界晶",
      "神罰鉱",
      "虚炎石",
      "終王鋼",
    ],
    8: [
      "創世核",
      "永劫鋼",
      "神晶",
      "審判鋼",
      "絶望核",
      "光輪石",
      "始原鉱",
      "天星核",
      "幻界鋼",
      "虚時石",
    ],
    9: [
      "虚無核",
      "終末核",
      "深淵皇核",
      "滅界核",
      "神滅核",
      "冥皇石",
      "天衝核",
      "星界核",
      "無限核",
      "断界核",
    ],
    10: [
      "世界喰い核",
      "神代核",
      "禁忌核",
      "審判核",
      "終焉核",
      "原初核",
      "絶対核",
      "創神核",
      "全界核",
      "無限神核",
    ],
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
  function buildFixedBaseBonus(tier, floor, type, title) {
    const seed = hashSeed(`T${tier}|F${floor}|${type}|${title.t}|BASE`);
    const rng = mulberry32(seed);
    const floorMul = Math.max(0, Math.floor(floor || 0));
    const roll = () => {
      const variance = 0.5 + rng() * 1.0;
      return Math.max(1, Math.floor(rng() * floorMul * title.mul * variance));
    };
    const rollWithMultiplier = (multiplier) =>
      Math.floor(roll() * Math.max(0, multiplier));
    // 固有は「ちから/たいりょく/すばやさ」だけ
    // TYPEで傾向を変える：剣系→power、杖靴短剣→agility、防具→vitality
    const baseBonus = { power: 1, vitality: 1, agility: 1 };
    if (
      [
        "sword",
        "katana",
        "axe",
        "spear",
        "mace",
        "hammer",
        "greatsword",
        "halberd",
      ].includes(type)
    ) {
      baseBonus.power = rollWithMultiplier(1.35);
      baseBonus.vitality = rollWithMultiplier(0.85);
      baseBonus.agility = rollWithMultiplier(0.6);
    } else if (
      ["staff", "boots", "dagger", "bow", "whip", "chakram"].includes(type)
    ) {
      baseBonus.agility = rollWithMultiplier(1.35);
      baseBonus.power = rollWithMultiplier(0.85);
      baseBonus.vitality = rollWithMultiplier(0.6);
    } else {
      baseBonus.vitality = rollWithMultiplier(1.35);
      baseBonus.power = rollWithMultiplier(0.85);
      baseBonus.agility = rollWithMultiplier(0.6);
    }

    return baseBonus;
  }

  function createBaseItemForDrop(tier, floor) {
    // 見た目要素は毎回変わってOK（素材など）
    // 固有値だけ「二つ名×TYPE（＋tier）」で固定にする
    const visSeed = hashSeed(`VIS|T${tier}|${Date.now()}|${Math.random()}`);
    const rngVis = mulberry32(visSeed);

    const typeDef = getType(rngVis);
    const title = getTierTitle(rngVis, tier);
    const material = getTierMaterial(rngVis, tier);

    const baseBonus = buildFixedBaseBonus(tier, floor, typeDef.type, title);
    return {
      id: `gen_${tier}_${typeDef.type}_${title.t}`, // 一意でなくてもOK（必要なら素材も入れる）
      tier,
      type: typeDef.type,
      // name: `[T${tier}] ${title.t}${material}${typeDef.jp}`,
      name: `${title.t}${material}${typeDef.jp}`,
      baseBonus,
    };
  }

  window.ItemGen = {
    TITLE_BY_TIER,
    ITEM_TYPES,
    createBaseItemForDrop,
  };
})();
