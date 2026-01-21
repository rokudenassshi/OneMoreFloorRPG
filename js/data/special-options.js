// js/data/special-options.js
(() => {
  const ACCESSORY_TYPES = ["指輪", "護符", "首飾り", "耳飾り", "腕輪"];
  const SPECIAL_OPTION_POOL = [
    // {
    //   id: "life_steal",
    //   name: "吸血",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 30,
    //   describe: (value) => `攻撃時に与えたダメージの${value}%をHP回復`,
    // },
    // {
    //   id: "damage_reflect",
    //   name: "ダメージ反射",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 20,
    //   describe: (value) => `被ダメージの${value}%を相手に反射`,
    // },
    // {
    //   id: "combo_boost",
    //   name: "連撃強化",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 40,
    //   describe: (value) => `連続攻撃でダメージが${value}%ずつ増加`,
    // },
    // {
    //   id: "evade_boost",
    //   name: "回避率up",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 40,
    //   describe: (value) => `回避率+${value}%`,
    // },
    // {
    //   id: "exp_boost",
    //   name: "経験値up",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 50,
    //   describe: (value) => `獲得経験値${value}%アップ`,
    // },
    // {
    //   id: "rare_encounter",
    //   name: "レアモンスター遭遇率UP",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 10,
    //   describe: (value) => `レアモンスター遭遇率+${value}%`,
    // },
    {
      id: "min_hits",
      name: "連続攻撃",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 2,
      describe: (value) => `ヒット数を+${value}`,
    },
    // {
    //   id: "self_damage_boost",
    //   name: "自傷強化",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 50,
    //   describe: (value) => `攻撃時HPを40%消費し、ダメージ+${value}%`,
    // },
    // {
    //   id: "power_rate",
    //   name: "ちから強化",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 30,
    //   describe: (value) => `ちから+${value}%`,
    // },
    // {
    //   id: "vitality_rate",
    //   name: "たいりょく強化",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 30,
    //   describe: (value) => `たいりょく+${value}%`,
    // },
    // {
    //   id: "agility_rate",
    //   name: "すばやさ強化",
    //   accessoryTypes: ACCESSORY_TYPES,
    //   min: 1,
    //   max: 30,
    //   describe: (value) => `すばやさ+${value}%`,
    // },
  ];

  window.SpecialOptionPool = SPECIAL_OPTION_POOL;
})();
