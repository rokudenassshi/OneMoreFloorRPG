const SKILLS = [
  {
    id: "herb_mastery",
    name: "やくそう強化",
    maxLevel: 50,
    requiredPoints: 1,
    description: "やくそうの回復量 +1%/Lv",
    effects: { herbHealBoost: 0.01 },
  },
  {
    id: "herb_capacity",
    name: "やくそうの所持数増加",
    maxLevel: 20,
    requiredPoints: 20,
    description: "やくそうの所持上限 +1/Lv",
    effects: { herbCapacityBoost: 1 },
  },
];
