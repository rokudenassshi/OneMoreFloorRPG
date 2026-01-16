// js/data/enemies.js
// tier 1〜10 / tierごとにBASE（種族）を分ける / 二つ名（title）にもtierを持たせる
// 二つ名tierが高いほど倍率が高い（title.mul）
// 敵ステータスは「敵生成時に確定」する＝敵ごとに固定
// drops：敵ごとのドロップ候補（item_1..item_100を想定）
(() => {
  /* ========= 乱数（戦闘ごとに生成） ========= */
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rngE = mulberry32(20260109);
  // 外部から参照されても落ちないように共有（GCS配信時の差分対策）
  window.rngE = rngE;
  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function normalizeRng(rng) {
    return typeof rng === "function" ? rng : rngE;
  }
  function rInt(rngOrMin, minOrMax, maybeMax) {
    if (typeof rngOrMin === "function") {
      return Math.floor(rngOrMin() * (maybeMax - minOrMax + 1)) + minOrMax;
    }
    return Math.floor(rngE() * (minOrMax - rngOrMin + 1)) + rngOrMin;
  }
  function pick(rng, arr) {
    const safeRng = normalizeRng(rng);
    return arr[rInt(safeRng, 0, arr.length - 1)];
  }
  /* ========= tierごとの種族（多め） ========= */
  const BASE_BY_TIER = {
    1: [
      "スライム",
      "子ネズミ",
      "コウモリ",
      "小トカゲ",
      "青カビ精",
      "子ゴブリン",
      "小蜘蛛",
      "泥団子",
      "弱り狼",
      "森キノコ",
      "野良骨",
      "ぬめり虫",
      "ふよふよ霊",
      "迷いヒヨコ",
    ],
    2: [
      "ゴブリン",
      "コボルト",
      "野盗",
      "毒蜂",
      "狂犬",
      "オーク見習い",
      "砂ネズミ",
      "腐肉鳥",
      "小さな亡者",
      "洞穴蜘蛛",
      "水棲スライム",
      "鉄牙ウサギ",
      "沼トカゲ",
      "小鬼",
    ],
    3: [
      "オーク",
      "リザードマン",
      "ゾンビ",
      "骸骨兵",
      "影狼",
      "毒蛇",
      "魔蜂兵",
      "山賊",
      "鉱山ゴーレム",
      "怨霊",
      "砂蜥蜴",
      "黒猫怪",
      "呪い人形",
      "毒沼の主",
    ],
    4: [
      "オーガ",
      "スケルトンナイト",
      "屍鬼",
      "ガーゴイル",
      "森の番人",
      "大蜘蛛",
      "猛毒サソリ",
      "夜盗団長",
      "魔導ゴブリン",
      "炎トカゲ",
      "水魔",
      "風切り鷲",
      "霊犬",
      "鉄鎧兵",
    ],
    5: [
      "岩巨人",
      "死霊騎士",
      "呪詛術師",
      "獄卒",
      "氷狼",
      "雷鳥",
      "鉄殻甲虫",
      "深海スライム",
      "黒鎧兵",
      "裂け目の影",
      "砂嵐の精",
      "沼の王",
      "奈落の蜘蛛",
      "凶刃の剣士",
    ],
    6: [
      "ミノタウロス",
      "ワイバーン雛",
      "死神の使い",
      "ゴーレム",
      "冥府兵",
      "火炎オーガ",
      "氷結ガーゴイル",
      "毒霧の亡者",
      "黒牙オーク",
      "影騎士",
      "雷鎧兵",
      "深淵の蟲",
      "紅蓮の猟犬",
      "蒼氷の猟犬",
    ],
    7: [
      "ワイバーン",
      "デーモン兵",
      "死霊将軍",
      "鋼鉄ゴーレム",
      "奈落の猟犬",
      "血盟騎士",
      "紅蓮の魔人",
      "蒼氷の魔人",
      "砂海の竜",
      "黒炎の司祭",
      "雷刃の剣鬼",
      "虚無の影狼",
      "冥府の守人",
      "破戒の術師",
    ],
    8: [
      "デーモン",
      "古代ゴーレム",
      "冥府の騎士",
      "混沌の魔術師",
      "氷嵐の竜",
      "灼熱の竜",
      "雷帝の番兵",
      "深淵の巨獣",
      "黒曜の死霊",
      "奈落の審問官",
      "霊喰い",
      "虚空の門番",
      "終焉の機兵",
      "崩壊の魔獣",
    ],
    9: [
      "深淵竜",
      "堕天使",
      "魔王の近衛",
      "終末の騎士",
      "冥界の裁定者",
      "虚無の巨人",
      "黒星の魔獣",
      "獄炎の覇者",
      "氷獄の覇者",
      "雷獄の覇者",
      "深海王",
      "死界の王",
      "奈落の大蛇",
      "黄昏の神獣",
    ],
    10: [
      "古龍",
      "災厄竜",
      "魔王",
      "虚無王",
      "終焉の審判者",
      "奈落の大公",
      "星喰い",
      "冥府の覇王",
      "世界蛇",
      "終末機兵",
      "深淵の皇",
      "滅界の神獣",
      "絶望の門",
      "永劫の番人",
    ],
  };

  const BOSS_BASE_BY_TIER = {
    2: "ボススライム",
    3: "ボスゴブリン",
    4: "ボスオーク",
    5: "ボスオーガ",
    6: "ボス岩巨人",
    7: "ボスミノタウロス",
    8: "ボスワイバーン",
    9: "ボスデーモン",
    10: "ボス古龍",
  };

  /* ========= 二つ名（tier別・倍率付き） ========= */
  const TITLE_BY_TIER = {
    1: [
      { t: "弱々しい", mul: 0.85 },
      { t: "うろつく", mul: 0.9 },
      { t: "荒っぽい", mul: 1.0 },
      { t: "噛みつく", mul: 1.1 },
    ],
    2: [
      { t: "凶暴な", mul: 1.41 },
      { t: "鋭い", mul: 1.47 },
      { t: "猛毒の", mul: 1.56 },
      { t: "暴食の", mul: 1.62 },
      { t: "裂傷の", mul: 1.67 },
      { t: "闇潜みの", mul: 1.72 },
      { t: "跳躍の", mul: 1.77 },
      { t: "疾駆の", mul: 1.82 },
      { t: "牙砕きの", mul: 1.87 },
    ],
    3: [
      { t: "冷酷な", mul: 1.67 },
      { t: "狂乱の", mul: 1.72 },
      { t: "呪われた", mul: 1.77 },
      { t: "雷撃の", mul: 1.82 },
      { t: "血走る", mul: 1.87 },
      { t: "怨嗟の", mul: 1.92 },
      { t: "咆哮の", mul: 1.98 },
      { t: "災影の", mul: 2.02 },
      { t: "猛襲の", mul: 2.07 },
      { t: "断裂の", mul: 2.13 },
    ],
    4: [
      { t: "灼熱の", mul: 2.96 },
      { t: "霜刃の", mul: 3.03 },
      { t: "鋼鉄の", mul: 3.13 },
      { t: "血塗られた", mul: 3.22 },
      { t: "毒沼の", mul: 3.33 },
      { t: "轟雷の", mul: 3.42 },
      { t: "嵐裂きの", mul: 3.53 },
      { t: "紅刃の", mul: 3.6 },
      { t: "魔鋼の", mul: 3.71 },
      { t: "殺意の", mul: 3.9 },
    ],
    5: [
      { t: "深淵の", mul: 3.45 },
      { t: "奈落の", mul: 3.53 },
      { t: "幻影の", mul: 3.6 },
      { t: "魔性の", mul: 3.71 },
      { t: "断罪の", mul: 3.79 },
      { t: "焦土Zの", mul: 3.9 },
      { t: "吸魂の", mul: 3.99 },
      { t: "崩壊の", mul: 4.09 },
      { t: "冥灯の", mul: 4.17 },
      { t: "崇拝の", mul: 4.37 },
    ],
    6: [
      { t: "冥府の", mul: 3.99 },
      { t: "邪眼の", mul: 4.11 },
      { t: "死喰いの", mul: 4.21 },
      { t: "断罪の", mul: 4.33 },
      { t: "灰燼の", mul: 4.44 },
      { t: "呪壊の", mul: 4.56 },
      { t: "覇道の", mul: 4.68 },
      { t: "魂刈りの", mul: 4.79 },
      { t: "滅撃の", mul: 4.91 },
      { t: "冥契の", mul: 5.04 },
    ],
    7: [
      { t: "魔王の", mul: 4.94 },
      { t: "黒炎の", mul: 5.08 },
      { t: "蒼氷の", mul: 5.25 },
      { t: "雷帝の", mul: 5.38 },
      { t: "戦禍の", mul: 5.54 },
      { t: "裂界の", mul: 5.69 },
      { t: "滅却の", mul: 5.88 },
      { t: "魔刻の", mul: 6.07 },
      { t: "深層の", mul: 6.25 },
      { t: "王獣の", mul: 6.55 },
    ],
    8: [
      { t: "星喰いの", mul: 6.25 },
      { t: "虚無の", mul: 6.45 },
      { t: "終焉の", mul: 6.64 },
      { t: "絶望の", mul: 6.82 },
      { t: "漆黒の", mul: 7.02 },
      { t: "崩界の", mul: 7.21 },
      { t: "滅星の", mul: 7.5 },
      { t: "深寂の", mul: 7.79 },
      { t: "断界の", mul: 8.07 },
      { t: "滅界の", mul: 8.36 },
    ],
    9: [
      { t: "災厄の", mul: 8.16 },
      { t: "世界を裂く", mul: 8.54 },
      { t: "冥界王の", mul: 8.93 },
      { t: "深淵皇の", mul: 9.3 },
      { t: "天命破りの", mul: 9.68 },
      { t: "常闇の", mul: 10.05 },
      { t: "崩天の", mul: 10.44 },
      { t: "滅獄の", mul: 10.81 },
      { t: "星界喰らいの", mul: 11.19 },
      { t: "終界の", mul: 11.58 },
    ],
    10: [
      { t: "神滅の", mul: 11.01 },
      { t: "終末王の", mul: 11.58 },
      { t: "虚無王の", mul: 12.15 },
      { t: "創世を喰らう", mul: 12.72 },
      { t: "万象破りの", mul: 13.27 },
      { t: "絶望王の", mul: 13.85 },
      { t: "界尽きの", mul: 14.41 },
      { t: "冥王の", mul: 14.91 },
      { t: "終焉を告ぐ", mul: 15.38 },
      { t: "神域喰らいの", mul: 15.95 },
    ],
  };

  function pickTitle(rng, tier) {
    const safeRng = normalizeRng(rng);
    const list = TITLE_BY_TIER[tier] || TITLE_BY_TIER[1];
    return list[rInt(safeRng, 0, list.length - 1)];
  }

  /* ========= 出現階層 ========= */
  function tierToMinFloor(tier) {
    const table = {
      1: 1,
      2: 50,
      3: 200,
      4: 500,
      5: 800,
      6: 1000,
      7: 1500,
      8: 3000,
      9: 5000,
      10: 10000,
    };
    return table[tier] ?? 1;
  }

  /* ========= tier基礎倍率（高tierほど強い） ========= */
  // function tierMul(tier) {
  //   // 調整しやすいようにテーブル化
  //   const table = {
  //     1: 1.0,
  //     2: 1.8,
  //     3: 3.1,
  //     4: 5.0,
  //     5: 7.5,
  //     6: 10.0,
  //     7: 13.5,
  //     8: 18.5,
  //     9: 24.5,
  //     10: 32.0,
  //   };
  //   return table[tier] ?? 1.0;
  // }

  /* ========= 敵ごとのドロップ候補（tier帯中心に） ========= */
  function buildDrops(rng, tier) {
    const safeRng = normalizeRng(rng);
    // items.js 側の item_1..item_100 を想定
    const start = (tier - 1) * 10 + 1; // 1,11,...,91
    const end = tier * 10; // 10,20,...,100

    const count = rInt(safeRng, 6, 10); // 候補多め
    const drops = [];
    for (let i = 0; i < count; i++) {
      const id = `item_${rInt(safeRng, start, end)}`;
      if (!drops.includes(id)) drops.push(id);
    }

    // たまに「1つ上のtier」も混ぜる（夢）
    if (tier < 10 && safeRng() < 0.12) {
      const id = `item_${rInt(safeRng, end + 1, Math.min(100, end + 10))}`;
      if (!drops.includes(id)) drops.push(id);
    }

    return drops;
  }

  function resolveTierForFloor(floor) {
    const normalizedFloor = Number(floor);
    if (!Number.isFinite(normalizedFloor)) return 1;
    for (let tier = 10; tier >= 1; tier -= 1) {
      if (normalizedFloor >= tierToMinFloor(tier)) return tier;
    }
    return 1;
  }

  /* ========= 敵生成 ========= */
  function createEnemyForFloor(floor) {
    const seed = hashSeed(`ENEMY|F${floor}|${Date.now()}|${Math.random()}`);
    const rng = normalizeRng(mulberry32(seed));
    const normalizedFloor = Math.max(1, floor);
    const tier = resolveTierForFloor(normalizedFloor);
    const minFloor = tierToMinFloor(tier);
    const isBossFloor = tier > 1 && normalizedFloor === tierToMinFloor(tier);

    const baseName = isBossFloor
      ? BOSS_BASE_BY_TIER[tier] ?? BASE_BY_TIER[tier][0]
      : pick(rng, BASE_BY_TIER[tier]);
    const title = isBossFloor ? null : pickTitle(rng, tier); // {t, mul}

    // 表示名にtierを含める（不要なら外してOK）
    // const name = `[T${tier}] ${title.t}${baseName}`;
    const name = isBossFloor ? `${baseName}` : `${title.t}${baseName}`;

    // tier倍率 × 二つ名倍率（高tier二つ名ほど強くなる）
    // const mul = tierMul(tier) * title.mul;

    // 二つ名だけで強さが決まる
    const mul = isBossFloor ? 1 : title.mul;

    // 基礎値（tierで少し上げつつ、mulで一気に差が出る）
    // const BASE_STATS_BY_TIER = {
    //   1: { hp: [40, 60], atk: [10, 20], exp: [7, 14] },
    //   2: { hp: [85, 120], atk: [22, 30], exp: [16, 28] },
    //   3: { hp: [110, 160], atk: [28, 44], exp: [20, 34] },
    //   4: { hp: [150, 210], atk: [34, 56], exp: [26, 42] },
    //   5: { hp: [200, 280], atk: [42, 70], exp: [32, 50] },
    //   6: { hp: [260, 360], atk: [50, 82], exp: [40, 60] },
    //   7: { hp: [320, 440], atk: [58, 96], exp: [48, 72] },
    //   8: { hp: [390, 540], atk: [66, 112], exp: [56, 82] },
    //   9: { hp: [470, 650], atk: [74, 128], exp: [64, 94] },
    //   10: { hp: [560, 780], atk: [84, 145], exp: [72, 108] },
    // };
    // const baseStats = BASE_STATS_BY_TIER[tier] ?? BASE_STATS_BY_TIER[1];

    const BASE_STATS_BY_TITLE_TIER = {
      1: { hp: [47, 70], atk: [11, 23], exp: [8, 16] },
      2: { hp: [214, 302], atk: [55, 75], exp: [40, 70] },
      3: { hp: [596, 868], atk: [151, 238], exp: [108, 184] },
      4: { hp: [1537, 2152], atk: [348, 574], exp: [266, 430] },
      5: { hp: [3525, 4935], atk: [740, 1233], exp: [564, 881] },
      6: { hp: [6890, 9540], atk: [1325, 2173], exp: [1060, 1590] },
      7: { hp: [12960, 17820], atk: [2349, 3888], exp: [1944, 2916] },
      8: { hp: [24170, 33466], atk: [4090, 6941], exp: [3470, 5081] },
      9: { hp: [43181, 59718], atk: [6798, 11760], exp: [5880, 8636] },
      10: { hp: [75264, 104832], atk: [11289, 19488], exp: [9676, 14515] },
    };
    const baseStats =
      BASE_STATS_BY_TITLE_TIER[tier] ?? BASE_STATS_BY_TITLE_TIER[1];
    const hpBase = rInt(rng, baseStats.hp[0], baseStats.hp[1]);
    const atkBase = rInt(rng, baseStats.atk[0], baseStats.atk[1]);
    const expBase = rInt(rng, baseStats.exp[0], baseStats.exp[1]);

    const hp = Math.floor(hpBase * mul);
    const atk = Math.floor(atkBase * mul);
    const exp = Math.floor(expBase * mul);
    // const statBoostByTier = {
    //   1: 1.18,
    //   2: 1.4,
    //   3: 1.75,
    //   4: 2.05,
    //   5: 2.35,
    //   6: 2.65,
    //   7: 3.0,
    //   8: 3.35,
    //   9: 3.75,
    //   10: 4.2,
    // // };
    // const statBoost = statBoostByTier[tier] ?? 1.18;
    // const hp = Math.floor(hpBase * mul * statBoost);
    // const atk = Math.floor(atkBase * mul * statBoost);
    // const exp = Math.floor(expBase * mul * statBoost);

    return {
      id: `enemy_${seed}`,
      name,

      tier,
      minFloor,

      // 二つ名情報（図鑑やデバッグ用）
      title: title?.t ?? "",
      titleMul: title?.mul ?? 1,

      // ここが固定ステータス
      maxHp: hp,
      hp,
      atk,
      exp,

      drops: buildDrops(rng, tier),
    };
  }

  window.EnemyGen = {
    createEnemyForFloor,
  };
})();
