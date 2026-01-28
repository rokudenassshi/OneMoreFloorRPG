// js/data/special-options.js
(() => {
  const ACCESSORY_TYPES = ["指輪", "護符", "首飾り", "耳飾り", "腕輪"];
  const SPECIAL_OPTION_POOL = [
    {
      id: "exp_boost",
      sortKey: 1,
      name: "経験値up",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 50,
      describe: (value) => `獲得経験値${value}%アップ`,
    },
    {
      id: "rare_encounter",
      sortKey: 2,
      name: "レアモンスター遭遇率UP",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 10,
      describe: (value) => `レアモンスター遭遇率+${value}%`,
    },
    {
      id: "life_steal",
      sortKey: 3,
      name: "吸血",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 30,
      describe: (value) => `攻撃時に与えたダメージの${value}%をHP回復`,
    },
    {
      id: "damage_reflect",
      sortKey: 4,
      name: "ダメージ反射",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 20,
      describe: (value) => `被ダメージの${value}%を相手に反射`,
    },
    {
      id: "combo_boost",
      sortKey: 5,
      name: "連撃強化",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 40,
      describe: (value) => `連続攻撃でダメージが${value}%ずつ増加`,
    },
    {
      id: "evade_boost",
      sortKey: 6,
      name: "回避率up",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 40,
      describe: (value) => `回避率+${value}%`,
    },
    {
      id: "min_hits",
      sortKey: 7,
      name: "連続攻撃",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 2,
      describe: (value) => `ヒット数を+${value}`,
    },
    {
      id: "self_damage_boost",
      sortKey: 8,
      name: "自傷強化",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 50,
      describe: (value) =>
        `攻撃時HPを40%消費し、ダメージ+${value}%※HP1の時はHPを消費しない`,
    },
    {
      id: "power_rate",
      sortKey: 9,
      name: "ちから強化",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 30,
      describe: (value) => `ちから+${value}%`,
    },
    {
      id: "vitality_rate",
      sortKey: 10,
      name: "たいりょく強化",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 30,
      describe: (value) => `たいりょく+${value}%`,
    },
    {
      id: "agility_rate",
      sortKey: 11,
      name: "すばやさ強化",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 30,
      describe: (value) => `すばやさ+${value}%`,
    },
  ];

  // id → sortKey のMapを公開
  window.SpecialOptionSortKeyMap = Object.fromEntries(
    SPECIAL_OPTION_POOL.map((o) => [o.id, o.sortKey]),
  );

  window.SpecialOptionPool = SPECIAL_OPTION_POOL;
})();
