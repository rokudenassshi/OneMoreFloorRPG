const player = {
  level: 1,
  exp: 0,

  baseHp: 50,
  hp: 50,

  maxReachedFloor: 0,
  lastTeleportedFloor: null,

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
  weapon2: null,
  accessory: null,
  autoAssignExpSkillPoints: false,
  autoAssignStatTarget: null,
  weatheredWeaponUnlocked: false,
  weatheredWeaponReceived: false,
  weatheredWeaponHintShown: false,
};

function calcMaxHp() {
  const totalVitality = getTotalStatus().vitality;
  const skillEffects =
    typeof getSkillEffects === "function" ? getSkillEffects() : {};
  if ((skillEffects.maxHpOverride || 0) > 0) {
    return 1;
  }
  return player.baseHp + totalVitality * 10;
}

function calcAttack() {
  const totalStatus = getTotalStatus();
  const basePower = totalStatus.power;
  const totalAgility = totalStatus.agility;
  const totalVitality = totalStatus.vitality;
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
  const totalAgility = getTotalStatus().agility;
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

  const minRandomHits =
    adjustedMaxHits >= 5 ? Math.max(minHits, adjustedMaxHits - 3) : minHits;

  return (
    Math.floor(Math.random() * (adjustedMaxHits - minRandomHits + 1)) +
    minRandomHits
  );
}

// すばやさ：回避
function rollEvade() {
  // ★ ろく氏の攻撃は回避率1%固定
  if (typeof enemy !== "undefined" && enemy?.id === "boss_rokushi") {
    return Math.random() < 0.01;
  }
  const baseRate = 0.05; // 固定5%
  const specialEffects = getSpecialEffects();
  const extraRate = (specialEffects.evadeBoost || 0) / 100;
  const lastStandEvadeRate =
    player.hp === 1 && (specialEffects.lastStandEvadeBoost || 0) > 0
      ? (specialEffects.lastStandEvadeBoost || 0) / 100
      : 0;
  const evadeRate = baseRate + extraRate + lastStandEvadeRate;
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

  const finalMultiplier = specialEffects.expFinalMultiplier || 1;
  const finalExp = Math.floor(boostedExp * finalMultiplier);
  player.exp += finalExp;
  log(`✨ 経験値 ${finalExp} 獲得`);

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
  // 自動割り振り
  if (typeof autoAssignStatPoints === "function") {
    autoAssignStatPoints();
  }
  if (
    player.autoAssignExpSkillPoints &&
    typeof autoAssignExpSkillPoints === "function"
  ) {
    autoAssignExpSkillPoints();
  }
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

  const skillEffects =
    typeof getSkillEffects === "function" ? getSkillEffects() : {};
  const damageReductionRate = (skillEffects.damageReduction || 0) / 100;
  const reducedDamage =
    damageReductionRate > 0
      ? Math.max(0, Math.floor(amount * (1 - damageReductionRate)))
      : amount;
  const nextHp = player.hp - reducedDamage;
  if (
    gameState === "BATTLE" &&
    nextHp <= 0 &&
    !battleGutsUsed &&
    (skillEffects.guts || 0) > 0
  ) {
    player.hp = 1;
    battleGutsUsed = true;
    log("🧡 ガッツでHP1で耐えた！");
    refresh();
    return { evaded: false, damage: reducedDamage, rawDamage: amount };
  }

  player.hp = Math.max(0, nextHp);

  refresh();

  if (player.hp === 0) {
    const hasHerbRevive = (skillEffects.herbRevive || 0) > 0;
    if (
      hasHerbRevive &&
      typeof getHerbCount === "function" &&
      typeof setHerbCount === "function" &&
      getHerbCount() > 0
    ) {
      setHerbCount(getHerbCount() - 1);
      player.hp = calcMaxHp();
      log("🌿 草の守護が発動し、やくそうで全回復した！");
      refresh();
      return { evaded: false, damage: reducedDamage, rawDamage: amount };
    }
    gameOver();
  }
  return { evaded: false, damage: reducedDamage, rawDamage: amount };
}
function getSkillStatusRates() {
  const skillEffects =
    typeof getSkillEffects === "function" ? getSkillEffects() : {};
  return {
    power: Number(skillEffects.powerRate) || 0,
    vitality: Number(skillEffects.vitalityRate) || 0,
    agility: Number(skillEffects.agilityRate) || 0,
  };
}

function getTotalStatus() {
  const bonus = getEquipmentBonus();
  const rates = getSkillStatusRates();
  const equipmentRates = getEquipmentSpecialEffects();
  const power = Math.floor(
    (player.status.power + bonus.power) *
      (1 + rates.power + (equipmentRates.powerRate || 0)),
  );
  const vitality = Math.floor(
    (player.status.vitality + bonus.vitality) *
      (1 + rates.vitality + (equipmentRates.vitalityRate || 0)),
  );
  const agility = Math.floor(
    (player.status.agility + bonus.agility) *
      (1 + rates.agility + (equipmentRates.agilityRate || 0)),
  );

  return {
    power: power,
    vitality: vitality,
    agility: agility,
  };
}
function getBaseStatus() {
  return {
    power: player.status.power,
    vitality: player.status.vitality,
    agility: player.status.agility,
  };
}

function getEquipmentBonus() {
  const isDualWieldRestrictedItem = (item) => Boolean(item?.isWeathered);
  const canUseDualWield =
    typeof getSkillLevel === "function" &&
    getSkillLevel("dual_wield") > 0 &&
    !isDualWieldRestrictedItem(player.weapon);

  const normalizeBonus = (bonus) => ({
    power: Number(bonus?.power) || 0,
    vitality: Number(bonus?.vitality) || 0,
    agility: Number(bonus?.agility) || 0,
  });

  const getWeaponBonus = (weapon) => {
    if (!weapon) {
      return { power: 0, vitality: 0, agility: 0 };
    }

    if (weapon.bonus) {
      return normalizeBonus(weapon.bonus);
    }
    const baseBonus = normalizeBonus(weapon.baseBonus);
    const optionBonus = normalizeBonus(weapon.optionBonus);

    return {
      power: baseBonus.power + optionBonus.power,
      vitality: baseBonus.vitality + optionBonus.vitality,
      agility: baseBonus.agility + optionBonus.agility,
    };
  };

  const primaryBonus = getWeaponBonus(player.weapon);
  const secondaryBonus = canUseDualWield
    ? getWeaponBonus(player.weapon2)
    : { power: 0, vitality: 0, agility: 0 };

  return {
    power: primaryBonus.power + secondaryBonus.power,
    vitality: primaryBonus.vitality + secondaryBonus.vitality,
    agility: primaryBonus.agility + secondaryBonus.agility,
  };
}
function getEquipmentSpecialOptions() {
  const isDualWieldRestrictedItem = (item) => Boolean(item?.isWeathered);
  const options = [];
  const canUseDualWield =
    typeof getSkillLevel === "function" &&
    getSkillLevel("dual_wield") > 0 &&
    !isDualWieldRestrictedItem(player.weapon);
  if (player.weapon && Array.isArray(player.weapon.specialOptions)) {
    options.push(...player.weapon.specialOptions);
  }
  if (
    canUseDualWield &&
    player.weapon2 &&
    Array.isArray(player.weapon2.specialOptions)
  ) {
    options.push(...player.weapon2.specialOptions);
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
    expFinalMultiplier: 1,
    rareEncounterBoost: 0,
    minHits: 0,
    powerRate: 0,
    vitalityRate: 0,
    agilityRate: 0,
    selfDamageBoost: 0,
    attackAgainChance: 0,
  };

  getEquipmentSpecialOptions().forEach((option) => {
    const value = Number(option?.value) || 0;
    switch (option?.id) {
      case "life_steal":
      case "life_steal_plus":
        effects.lifeSteal += value;
        break;
      case "damage_reflect":
      case "damage_reflect_plus":
        effects.reflect += value;
        break;
      case "combo_boost":
      case "combo_boost_plus":
        effects.comboBoost += value;
        break;
      case "evade_boost":
      case "evade_boost_plus":
        effects.evadeBoost += value;
        break;
      case "exp_boost":
        effects.expBoost += value;
        break;
      case "exp_boost_plus":
        effects.expFinalMultiplier *= value || 1;
        break;
      case "exp_final_ex":
        effects.expFinalMultiplier *= value || 1;
        break;
      case "rare_encounter":
      case "rare_encounter_plus":
        effects.rareEncounterBoost += value;
        break;
      case "min_hits":
      case "min_hits_plus":
        effects.minHits += value;
        break;
      case "power_rate":
      case "power_rate_plus":
        effects.powerRate += value / 100;
        break;
      case "vitality_rate":
      case "vitality_rate_plus":
        effects.vitalityRate += value / 100;
        break;
      case "agility_rate":
      case "agility_rate_plus":
        effects.agilityRate += value / 100;
        break;
      case "self_damage_boost":
      case "self_damage_boost_plus":
        effects.selfDamageBoost += value;
        break;
      case "attack_again":
        effects.attackAgainChance += value;
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
    expFinalMultiplier: equipmentEffects.expFinalMultiplier || 1,
    lifeSteal: equipmentEffects.lifeSteal + (skillEffects.lifeSteal || 0),
    lifeStealDamage: skillEffects.lifeStealDamage || 0,
    lifeStealOverHealRate: skillEffects.lifeStealOverHealRate || 0,
    reflect:
      equipmentEffects.reflect + (skillEffects.reflect || 0) + reflectBoost,
    evadeBoost: equipmentEffects.evadeBoost + (skillEffects.evadeBoost || 0),
    evadeCounter: skillEffects.evadeCounter || 0,
    minHits: equipmentEffects.minHits + (skillEffects.minHits || 0),
    expBoost: equipmentEffects.expBoost + (skillEffects.expBoost || 0),
    rareEncounterBoost:
      equipmentEffects.rareEncounterBoost +
      (skillEffects.rareEncounterBoost || 0),
    rareEncounterBlock: skillEffects.rareEncounterBlock || 0,
    brokenEncounterBlock: skillEffects.brokenEncounterBlock || 0,
    rareEncounterPopupCut: skillEffects.rareEncounterPopupCut || 0,
    brokenEncounterPopupCut: skillEffects.brokenEncounterPopupCut || 0,
    agilityAttackRate: skillEffects.agilityAttackRate || 0,
    vitalityAttackRate: skillEffects.vitalityAttackRate || 0,
    singleHitBoost: skillEffects.singleHitBoost || 0,
    lastStandAttackBoost: skillEffects.lastStandAttackBoost || 0,
    lastStandEvadeBoost: skillEffects.lastStandEvadeBoost || 0,
  };
}
