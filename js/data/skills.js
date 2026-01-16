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
  {
    id: "herb_battle_reward",
    name: "戦闘終了時にやくそう増加",
    maxLevel: 1,
    requiredPoints: 20,
    description: "戦闘終了時にやくそうを1つ手に入れる※所持上限より増えない",
    effects: { herbBattleReward: 1 },
  },
];
