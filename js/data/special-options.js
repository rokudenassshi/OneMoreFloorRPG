// js/data/special-options.js
(() => {
  const ACCESSORY_TYPES = ["指輪", "護符", "首飾り", "耳飾り", "腕輪"];
  const SPECIAL_OPTION_POOL = [
    {
      id: "life_steal",
      name: "吸血",
      accessoryTypes: ACCESSORY_TYPES,
      min: 10,
      max: 20,
      describe: (value) => `攻撃時に与えたダメージの${value}%をHP回復`,
    },
    {
      id: "damage_reflect",
      name: "ダメージ反射",
      accessoryTypes: ACCESSORY_TYPES,
      min: 10,
      max: 50,
      describe: (value) => `被ダメージの${value}%を相手に反射`,
    },
    {
      id: "combo_boost",
      name: "連撃強化",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 20,
      describe: (value) => `連続攻撃でダメージが${value}%ずつ増加`,
    },
    {
      id: "victory_recover",
      name: "勝利時リカバー",
      accessoryTypes: ACCESSORY_TYPES,
      min: 15,
      max: 30,
      describe: (value) => `戦闘勝利時に最大HPの${value}%を回復`,
    },
    {
      id: "evade_boost",
      name: "回避率上昇",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 30,
      describe: (value) => `すばやさ由来の回避率に+${value}%補正`,
    },
    {
      id: "exp_boost",
      name: "経験値ブースト",
      accessoryTypes: ACCESSORY_TYPES,
      min: 20,
      max: 50,
      describe: (value) => `獲得経験値${value}%アップ`,
    },
    {
      id: "rare_encounter",
      name: "レアモンスター遭遇率UP",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 5,
      describe: (value) => `レアモンスター遭遇率+${value}%`,
    },
    {
      id: "min_hits",
      name: "連続攻撃の安定化",
      accessoryTypes: ACCESSORY_TYPES,
      min: 1,
      max: 2,
      describe: (value) => `最低ヒット数を+${value}`,
    },
  ];

  window.SpecialOptionPool = SPECIAL_OPTION_POOL;
})();
