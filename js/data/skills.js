const SKILLS = [
  {
    id: "hp_training",
    name: "体力鍛錬",
    maxLevel: 5,
    description: "最大HP +20",
    effects: { maxHp: 20 },
  },
  {
    id: "power_training",
    name: "武力鍛錬",
    maxLevel: 5,
    description: "攻撃力 +2",
    effects: { attack: 2 },
  },
  {
    id: "agility_training",
    name: "俊敏鍛錬",
    maxLevel: 5,
    description: "回避率 +2%",
    effects: { evadeRate: 0.02 },
  },
  {
    id: "learning",
    name: "学習力",
    maxLevel: 3,
    description: "経験値獲得 +5%",
    effects: { expBoost: 0.05 },
  },
];
