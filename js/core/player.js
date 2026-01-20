const player = {
  level: 1,
  exp: 0,

  baseHp: 50,
  hp: 50,

  maxReachedFloor: 0,

  status: {
    power: 10,
    vitality: 10,
    agility: 10,
  },
  unassignedPoints: 0,
  statPoints: 0,
  statPointUnlockGranted: false,
  skills: {},
  weapon: null,
  accessory: null,
};

function calcMaxHp() {
  const bonus = getEquipmentBonus();
  const totalVitality = player.status.vitality + bonus.vitality;
  return player.baseHp + totalVitality * 10;
}

function calcAttack() {
  const bonus = getEquipmentBonus();
  const basePower = player.status.power + bonus.power;
  const totalAgility = player.status.agility + bonus.agility;
  const totalVitality = player.status.vitality + bonus.vitality;
  const skillEffects = getSkillEffects();
  let attackSource = basePower;

  const agiRate = Number(skillEffects.agilityAttackRate) || 0;
  const vitRate = Number(skillEffects.vitalityAttackRate) || 0;
  if (agiRate > 0) {
    attackSource = Math.floor(totalAgility * agiRate);
  }

  if (vitRate > 0) {
    attackSource = Math.floor(totalVitality * vitRate);
  }

  return attackSource;
}

function calcAttackCount() {
  const bonus = getEquipmentBonus();
  const totalAgility = Number(player.status.agility) + bonus.agility;
  const equipmentEffects = getEquipmentSpecialEffects();
  const skillEffects =
    typeof getSkillEffects === "function" ? getSkillEffects() : {};
  const minHitBonus = Math.max(
    0,
    Math.floor((equipmentEffects.minHits || 0) + (skillEffects.minHits || 0)),
  );
  // 1hitは常に保証、2hit以降の要求値を「段階的に増加」させる
  const base = 50; // 最初の増分（2hitに必要な追加量）
  const stepInc = 200; // 段階が1上がるごとに増分

  let maxHits = 1;
  let required = 0;
  let delta = base;

  // 5ヒットまで（段階式）
  while (maxHits < 5 && totalAgility >= required + delta) {
    required += delta;
    maxHits++;
    delta += stepInc;
  }

  // ★ 6ヒット以降の要求値（変数化）
  const OVER_HIT_BASE_AGI = 1000;
  if (totalAgility >= OVER_HIT_BASE_AGI) {
    const extraHits =
      Math.floor((totalAgility - OVER_HIT_BASE_AGI) / OVER_HIT_BASE_AGI) + 1;
    maxHits = Math.max(maxHits, 5 + extraHits);
  }

  maxHits += minHitBonus;
  const minHits = 1 + minHitBonus;
  const adjustedMaxHits = Math.max(maxHits, minHits);

  return Math.floor(Math.random() * (adjustedMaxHits - minHits + 1)) + minHits;
}

// すばやさ：回避（上限20%）
function rollEvade() {
  const baseRate = 0.05; // 固定5%
  const specialEffects = getSpecialEffects();
  const extraRate = (specialEffects.evadeBoost || 0) / 100;

  const evadeRate = baseRate + extraRate;
  return Math.random() < evadeRate;
}

function calcNextExp() {
  const lv = player.level;

  // 序盤〜中盤：指数（緩め）
  if (lv <= 30) {
    return Math.floor(20 * Math.pow(1.25, lv - 1));
  }

  // 中盤以降：線形 + 少しだけ指数
  const base = Math.floor(20 * Math.pow(1.25, 29)); // Lv30基準
  const extra = lv - 30;

  return Math.floor(
    base +
      extra * 120 + // 線形成長
      Math.pow(extra, 1.4) * 40, // 緩やかな曲線
  );
}

function gainExp(exp) {
  const specialEffects = getSpecialEffects();
  const boostRate = (specialEffects.expBoost || 0) / 100;
  const boostedExp = Math.floor(exp * (1 + boostRate));
  player.exp += boostedExp;
  log(`✨ 経験値 ${boostedExp} 獲得`);

  while (player.exp >= calcNextExp()) {
    player.exp -= calcNextExp();
    levelUp();
  }
}

function levelUp() {
  player.level++;
  if (player.maxReachedFloor >= UNLOCK_FLOOR) {
    player.statPoints += 1;
    log("✨ ステータスポイント +1");
  }
  player.unassignedPoints += 1;
  log(`🎉 レベルアップ！ Lv.${player.level}`);
  refresh();
}

function awardStatPointUnlock() {
  if (player.statPointUnlockGranted) return;
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;

  player.statPoints += player.level;
  player.statPointUnlockGranted = true;
  log(`✨ ステータスポイント +${player.level}`);

  showStatUnlockModal(player.level);
  refresh();
}
function damagePlayer(amount) {
  // 回避
  if (rollEvade()) {
    log("💨 攻撃をかわした！");
    refresh();
    return { evaded: true, damage: 0 };
  }

  player.hp -= amount;
  if (player.hp < 0) player.hp = 0;

  refresh();

  if (player.hp === 0) {
    gameOver();
  }
  return { evaded: false, damage: amount };
}
function getBaseStatus() {
  return {
    power: player.status.power,
    vitality: player.status.vitality,
    agility: player.status.agility,
  };
}

function getEquipmentBonus() {
  if (!player.weapon) {
    return { power: 0, vitality: 0, agility: 0 };
  }

  const normalizeBonus = (bonus) => ({
    power: Number(bonus?.power) || 0,
    vitality: Number(bonus?.vitality) || 0,
    agility: Number(bonus?.agility) || 0,
  });

  if (player.weapon.bonus) {
    return normalizeBonus(player.weapon.bonus);
  }

  const baseBonus = normalizeBonus(player.weapon.baseBonus);
  const optionBonus = normalizeBonus(player.weapon.optionBonus);

  return {
    power: baseBonus.power + optionBonus.power,
    vitality: baseBonus.vitality + optionBonus.vitality,
    agility: baseBonus.agility + optionBonus.agility,
  };
}
function getEquipmentSpecialOptions() {
  const options = [];
  if (player.weapon && Array.isArray(player.weapon.specialOptions)) {
    options.push(...player.weapon.specialOptions);
  }
  if (player.accessory && Array.isArray(player.accessory.specialOptions)) {
    options.push(...player.accessory.specialOptions);
  }
  return options;
}

function getEquipmentSpecialEffects() {
  const effects = {
    lifeSteal: 0,
    reflect: 0,
    comboBoost: 0,
    victoryRecover: 0,
    evadeBoost: 0,
    expBoost: 0,
    rareEncounterBoost: 0,
    minHits: 0,
  };

  getEquipmentSpecialOptions().forEach((option) => {
    const value = Number(option?.value) || 0;
    switch (option?.id) {
      case "life_steal":
        effects.lifeSteal += value;
        break;
      case "damage_reflect":
        effects.reflect += value;
        break;
      case "combo_boost":
        effects.comboBoost += value;
        break;
      case "evade_boost":
        effects.evadeBoost += value;
        break;
      case "exp_boost":
        effects.expBoost += value;
        break;
      case "rare_encounter":
        effects.rareEncounterBoost += value;
        break;
      case "min_hits":
        effects.minHits += value;
        break;
      default:
        break;
    }
  });

  return effects;
}
function getSpecialEffects() {
  const equipmentEffects = getEquipmentSpecialEffects();
  const skillEffects =
    typeof getSkillEffects === "function" ? getSkillEffects() : {};
  const reflectBoost = skillEffects.reflectBoost || 0;

  return {
    ...equipmentEffects,
    lifeSteal: equipmentEffects.lifeSteal + (skillEffects.lifeSteal || 0),
    reflect:
      equipmentEffects.reflect + (skillEffects.reflect || 0) + reflectBoost,
    evadeBoost: equipmentEffects.evadeBoost + (skillEffects.evadeBoost || 0),
    evadeCounter: skillEffects.evadeCounter || 0,
    minHits: equipmentEffects.minHits + (skillEffects.minHits || 0),
    expBoost: equipmentEffects.expBoost + (skillEffects.expBoost || 0),
    agilityAttackRate: skillEffects.agilityAttackRate || 0,
    vitalityAttackRate: skillEffects.vitalityAttackRate || 0,
  };
}
