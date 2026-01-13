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

  /* ========= 二つ名（tier別・倍率付き） ========= */
  const TITLE_BY_TIER = {
    1: [
      { t: "弱々しい", mul: 0.85 },
      { t: "うろつく", mul: 0.9 },
      { t: "荒っぽい", mul: 1.0 },
      { t: "噛みつく", mul: 1.1 },
    ],
    2: [
      { t: "凶暴な", mul: 1.12 },
      { t: "鋭い", mul: 1.16 },
      { t: "猛毒の", mul: 1.24 },
      { t: "暴食の", mul: 1.28 },
      { t: "裂傷の", mul: 1.32 },
      { t: "闇潜みの", mul: 1.36 },
      { t: "跳躍の", mul: 1.4 },
      { t: "疾駆の", mul: 1.44 },
      { t: "牙砕きの", mul: 1.48 },
    ],
    3: [
      { t: "冷酷な", mul: 1.32 },
      { t: "狂乱の", mul: 1.36 },
      { t: "呪われた", mul: 1.4 },
      { t: "雷撃の", mul: 1.44 },
      { t: "血走る", mul: 1.48 },
      { t: "怨嗟の", mul: 1.52 },
      { t: "咆哮の", mul: 1.56 },
      { t: "災影の", mul: 1.6 },
      { t: "猛襲の", mul: 1.64 },
      { t: "断裂の", mul: 1.68 },
    ],
    4: [
      { t: "灼熱の", mul: 1.55 },
      { t: "霜刃の", mul: 1.6 },
      { t: "鋼鉄の", mul: 1.65 },
      { t: "血塗られた", mul: 1.7 },
      { t: "毒沼の", mul: 1.75 },
      { t: "轟雷の", mul: 1.8 },
      { t: "嵐裂きの", mul: 1.85 },
      { t: "紅刃の", mul: 1.9 },
      { t: "魔鋼の", mul: 1.95 },
      { t: "殺意の", mul: 2.05 },
    ],
    5: [
      { t: "深淵の", mul: 1.8 },
      { t: "奈落の", mul: 1.85 },
      { t: "幻影の", mul: 1.9 },
      { t: "魔性の", mul: 1.95 },
      { t: "断罪の", mul: 2.0 },
      { t: "焦土の", mul: 2.05 },
      { t: "吸魂の", mul: 2.1 },
      { t: "崩壊の", mul: 2.15 },
      { t: "冥灯の", mul: 2.2 },
      { t: "崇拝の", mul: 2.3 },
    ],
    6: [
      { t: "冥府の", mul: 2.1 },
      { t: "邪眼の", mul: 2.16 },
      { t: "死喰いの", mul: 2.22 },
      { t: "断罪の", mul: 2.28 },
      { t: "灰燼の", mul: 2.34 },
      { t: "呪壊の", mul: 2.4 },
      { t: "覇道の", mul: 2.46 },
      { t: "魂刈りの", mul: 2.52 },
      { t: "滅撃の", mul: 2.58 },
      { t: "冥契の", mul: 2.65 },
    ],
    7: [
      { t: "魔王の", mul: 2.6 },
      { t: "黒炎の", mul: 2.68 },
      { t: "蒼氷の", mul: 2.76 },
      { t: "雷帝の", mul: 2.84 },
      { t: "戦禍の", mul: 2.92 },
      { t: "裂界の", mul: 3.0 },
      { t: "滅却の", mul: 3.1 },
      { t: "魔刻の", mul: 3.2 },
      { t: "深層の", mul: 3.3 },
      { t: "王獣の", mul: 3.45 },
    ],
    8: [
      { t: "星喰いの", mul: 3.3 },
      { t: "虚無の", mul: 3.4 },
      { t: "終焉の", mul: 3.5 },
      { t: "絶望の", mul: 3.6 },
      { t: "漆黒の", mul: 3.7 },
      { t: "崩界の", mul: 3.8 },
      { t: "滅星の", mul: 3.95 },
      { t: "深寂の", mul: 4.1 },
      { t: "断界の", mul: 4.25 },
      { t: "滅界の", mul: 4.4 },
    ],
    9: [
      { t: "災厄の", mul: 4.3 },
      { t: "世界を裂く", mul: 4.5 },
      { t: "冥界王の", mul: 4.7 },
      { t: "深淵皇の", mul: 4.9 },
      { t: "天命破りの", mul: 5.1 },
      { t: "常闇の", mul: 5.3 },
      { t: "崩天の", mul: 5.5 },
      { t: "滅獄の", mul: 5.7 },
      { t: "星界喰らいの", mul: 5.9 },
      { t: "終界の", mul: 6.1 },
    ],
    10: [
      { t: "神滅の", mul: 5.8 },
      { t: "終末王の", mul: 6.1 },
      { t: "虚無王の", mul: 6.4 },
      { t: "創世を喰らう", mul: 6.7 },
      { t: "万象破りの", mul: 7.0 },
      { t: "絶望王の", mul: 7.3 },
      { t: "界尽きの", mul: 7.6 },
      { t: "冥王の", mul: 7.85 },
      { t: "終焉を告ぐ", mul: 8.1 },
      { t: "神域喰らいの", mul: 8.4 },
    ],
  };

  function pickTitle(rng, tier) {
    const safeRng = normalizeRng(rng);
    const list = TITLE_BY_TIER[tier] || TITLE_BY_TIER[1];
    return list[rInt(safeRng, 0, list.length - 1)];
  }

  /* ========= 出現階層（任せる条件なので、自然に伸びるカーブに設定） ========= */
  function tierToMinFloor(tier) {
    const table = {
      1: 1,
      2: 10,
      3: 50,
      4: 100,
      5: 200,
      6: 500,
      7: 800,
      8: 1000,
      9: 1500,
      10: 2500,
    };
    return table[tier] ?? 1;
  }

  /* ========= tier基礎倍率（高tierほど強い） ========= */
  function tierMul(tier) {
    // 調整しやすいようにテーブル化
    const table = {
      1: 1.0,
      2: 1.6,
      3: 2.4,
      4: 3.6,
      5: 5.2,
      6: 7.5,
      7: 10.5,
      8: 14.5,
      9: 19.5,
      10: 26.0,
    };
    return table[tier] ?? 1.0;
  }

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
    if (tier < 10 && safeRng() < 0.25) {
      const id = `item_${rInt(safeRng, end + 1, Math.min(100, end + 10))}`;
      if (!drops.includes(id)) drops.push(id);
    }

    return drops;
  }

  /* ========= tierに割り当て（各tierで登場数を増やす） ========= */
  const TIER_COUNTS = {
    1: 14,
    2: 12,
    3: 12,
    4: 10,
    5: 10,
    6: 10,
    7: 9,
    8: 8,
    9: 8,
    10: 7,
  };

  // 合計が100になるように安全に補正
  (function fixCounts() {
    const sum = Object.values(TIER_COUNTS).reduce((a, b) => a + b, 0);
    if (sum === 100) return;
    TIER_COUNTS[1] += 100 - sum;
  })();

  function buildTierPool(floor) {
    const pool = [];
    const tiers = Object.keys(TIER_COUNTS)
      .map(Number)
      .sort((a, b) => a - b);
    let currentTier = 1;
    tiers.forEach((tier) => {
      if (floor >= tierToMinFloor(tier)) {
        currentTier = tier;
      }
    });

    const allowedTiers = new Set([currentTier]);
    if (currentTier > 1) {
      allowedTiers.add(currentTier - 1);
    }
    tiers.forEach((tier) => {
      if (!allowedTiers.has(tier)) return;
      for (let i = 0; i < TIER_COUNTS[tier]; i++) pool.push(tier);
    });
    return pool.length > 0 ? pool : [1];
  }

  /* ========= 敵生成（戦闘ごとにhp/atk/expが固定化される） ========= */
  function createEnemyForFloor(floor) {
    const seed = hashSeed(`ENEMY|F${floor}|${Date.now()}|${Math.random()}`);
    const rng = normalizeRng(mulberry32(seed));
    const tier = pick(rng, buildTierPool(Math.max(1, floor)));
    const minFloor = tierToMinFloor(tier);

    const baseName = pick(rng, BASE_BY_TIER[tier]);
    const title = pickTitle(rng, tier); // {t, mul}

    // 表示名にtierを含める（不要なら外してOK）
    // const name = `[T${tier}] ${title.t}${baseName}`;
    const name = `${title.t}${baseName}`;

    // tier倍率 × 二つ名倍率（高tier二つ名ほど強くなる）
    const mul = tierMul(tier) * title.mul;

    // 基礎値（tierで少し上げつつ、mulで一気に差が出る）
    const hpBase = rInt(rng, 40, 60) + tier * 2;
    const atkBase = rInt(rng, 10, 20) + Math.floor(tier / 2);
    const expBase = rInt(rng, 7, 14) + tier * 2;

    const hp = Math.floor(hpBase * mul);
    const atk = Math.floor(atkBase * mul);
    const exp = Math.floor(expBase * mul);

    return {
      id: `enemy_${seed}`,
      name,

      tier,
      minFloor,

      // 二つ名情報（図鑑やデバッグ用）
      title: title.t,
      titleMul: title.mul,

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
