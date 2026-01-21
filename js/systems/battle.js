function startBattle() {
  gameState = "BATTLE";
  clearLog();
  battleGutsUsed = false;

  // ★ floor 以上で出現する敵だけ抽選
  const base = EnemyGen.createEnemyForFloor(floor);
  const equipmentSpecialEffects = getEquipmentSpecialEffects();
  const specialEffects = getSpecialEffects();
  let bonusRareRate = (equipmentSpecialEffects.rareEncounterBoost || 0) / 100;
  bonusRareRate += (specialEffects.rareEncounterBoost || 0) / 100;

  // ★壊れたエネミー（1001階層以降）
  const brokenEnemyRate = 3.01;
  const isBroken =
    floor >= UNLOCK_FLOOR && Math.random() < brokenEnemyRate + bonusRareRate;
  // レアモンスター
  const baseRareRate = 0.03;
  const isRare = !isBroken && Math.random() < baseRareRate + bonusRareRate;
  const rate = isBroken ? 2.5 : isRare ? 1.8 : 1;

  const highFloorStep =
    floor >= UNLOCK_FLOOR ? Math.floor((floor - UNLOCK_FLOOR) / 50) + 1 : 0;
  const highFloorMultiplier = highFloorStep > 0 ? 1 + highFloorStep * 0.2 : 1;
  enemy = {
    id: base.id,
    name: isBroken
      ? `★壊れた ${base.name}`
      : isRare
        ? `＊レア ${base.name}`
        : base.name,
    isRare,
    isBroken,
    tier: base.tier,
    titleMul: base.titleMul,
    // 上位ほど強い：baseがtierで強い + floor補正を少し
    maxHp: Math.floor((base.hp + floor * 2) * rate * highFloorMultiplier),
    hp: Math.floor((base.hp + floor * 2) * rate * highFloorMultiplier),
    atk: Math.floor(
      (base.atk + Math.floor(floor / 3)) * rate * highFloorMultiplier,
    ),
    exp: Math.floor((base.exp + Math.floor(floor / 2)) * rate),

    // ★ ドロップ候補を保持
    drops: base.drops,
  };

  exploreButtons.style.display = "none";
  battleButtons.style.display = "block";

  log(`⚔ ${enemy.name} があらわれた！`);
  if (isBroken) {
    showRareEnemyPopup(base.name, "★壊れたエネミーが出現した。");
  } else if (isRare) {
    showRareEnemyPopup(base.name);
  }
  updateUI();
}

function attack() {
  if (gameState !== "BATTLE") return;

  const atk = calcAttack();
  const hits = calcAttackCount();
  const specialEffects = getSpecialEffects();
  const comboBoostRate = (specialEffects.comboBoost || 0) / 100;

  let total = 0;
  const enemyHpBefore = enemy.hp;

  const hitDamages = [];
  const hitComboBonusDamages = [];
  for (let i = 0; i < hits; i++) {
    const decayMultiplier = Math.pow(0.6, i);
    const baseHitAtk = Math.max(1, Math.floor(atk * decayMultiplier));
    const hitAtk = Math.max(
      1,
      Math.floor(baseHitAtk * (1 + comboBoostRate * i)),
    );
    const damageRoll = Math.random();
    const damage = rollDamageWithRoll(hitAtk, 0.3, damageRoll);
    const baseDamage = rollDamageWithRoll(baseHitAtk, 0.3, damageRoll);
    const comboBonusDamage = Math.max(0, damage - baseDamage);
    enemy.hp -= damage;
    total += damage;
    hitDamages.push(damage);
    hitComboBonusDamages.push(comboBonusDamage);
  }

  if (hits > 1) {
    log(`▶ ${hits}回の連続攻撃。`);
    hitDamages.forEach((damage, index) => {
      const comboBonus = hitComboBonusDamages[index] || 0;
      const comboLog =
        comboBoostRate > 0 && comboBonus > 0
          ? `（連撃強化+${comboBonus}）`
          : "";
      log(`${index + 1}回目 ${damage}ダメージ${comboLog}`);
    });
  } else {
    log(`▶ 攻撃！ ${hits}回ヒット（${total}ダメージ）`);
  }

  const lifeStealRate = (specialEffects.lifeSteal || 0) / 100;
  if (lifeStealRate > 0) {
    const actualDamage = Math.min(total, enemyHpBefore);
    const recoverAmount = Math.floor(actualDamage * lifeStealRate);
    if (recoverAmount > 0) {
      const maxHp = calcMaxHp();
      player.hp = Math.min(maxHp, player.hp + recoverAmount);
      log(`🩸 吸血でHPを${recoverAmount}回復`);
    }
  }
  refresh();
  afterPlayerAction();
}

function escape() {
  if (gameState !== "BATTLE") return;

  // レアモンスターとの戦闘は必ず逃走に成功する
  if (enemy && enemy.isRare) {
    log("💨 逃走成功！");
    floor = Math.max(0, floor - 1);
    endBattle({ grantHerbReward: false });
    refresh();
    return;
  }

  const rate = Math.min(30 + Math.floor(getTotalStatus().agility / 2), 90);

  if (Math.random() * 100 < rate) {
    log("💨 逃走成功！");
    floor = Math.max(0, floor - 1);
    endBattle({ grantHerbReward: false });
  } else {
    log("❌ 逃走失敗…");
    enemyAttack();
  }
  refresh();
}

function afterPlayerAction() {
  if (gameState !== "BATTLE") return;
  if (enemy.hp <= 0) {
    handleEnemyDefeat();
  } else {
    enemyAttack();
  }
}

function enemyAttack() {
  if (gameState !== "BATTLE") return;
  const damage = rollDamage(enemy.atk);
  log(`◀ ${enemy.name} の攻撃！ ${damage}ダメージ`);

  const result = damagePlayer(damage);
  if (result?.evaded) {
    if (triggerEvadeCounter()) return;
    return;
  }

  const specialEffects = getSpecialEffects();
  const reflectRate = (specialEffects.reflect || 0) / 100;
  if (reflectRate > 0 && enemy) {
    const reflectDamage = Math.floor((result?.damage || 0) * reflectRate);
    if (reflectDamage > 0) {
      enemy.hp -= reflectDamage;
      log(`🛡️ ${enemy.name} に${reflectDamage}ダメージ反射`);
      if (enemy.hp <= 0) {
        handleEnemyDefeat();
      } else {
        refresh();
      }
    }
  }
}
function triggerEvadeCounter() {
  if (!enemy) return false;
  const specialEffects = getSpecialEffects();
  if ((specialEffects.evadeCounter || 0) <= 0) return false;

  const attackPower = calcAttack();
  const damage = rollDamage(attackPower, 0.3);
  enemy.hp -= damage;
  log(`⚡ 回避反撃！ ${enemy.name} に${damage}ダメージ`);
  if (enemy.hp <= 0) {
    handleEnemyDefeat();
    return true;
  }
  refresh();
  return true;
}
function rollDamageWithRoll(base, variance, roll) {
  const min = Math.floor(base * (1 - variance));
  const max = Math.ceil(base * (1 + variance));
  return Math.max(1, Math.floor(roll * (max - min + 1)) + min);
}

function rollDamage(base, variance = 0.2) {
  return rollDamageWithRoll(base, variance, Math.random());
}

function endBattle({ grantHerbReward = true } = {}) {
  const hasBattle = !!enemy;
  const shouldLogBossRest = pendingBossRestLog && isBossFloor(floor);
  pendingBossRestLog = false;
  gameState = "EXPLORE";
  enemy = null;
  battleGutsUsed = false;

  if (hasBattle) {
    player.hp = calcMaxHp();
  }
  if (grantHerbReward) {
    const skillEffects = getSkillEffects();
    const herbBattleRewardCount = Math.floor(
      skillEffects.herbBattleReward || 0,
    );
    if (herbBattleRewardCount > 0) {
      const herbCountBefore = getHerbCount();
      grantHerbs(herbBattleRewardCount, false);
      const addedHerbCount = getHerbCount() - herbCountBefore;
      if (addedHerbCount > 0) {
        log(`🌿 戦闘終了でやくそうを${addedHerbCount}つ手に入れた`);
      }
    }
  }
  if (shouldLogBossRest) {
    log("🔥静かに炎が燈っている。ここでは休めそうだ。");
  }
  battleButtons.style.display = "none";
  exploreButtons.style.display = "block";
  refresh();
  autoSave({ saveHp: true });
}
function handleEnemyDefeat() {
  log(` ${enemy.name} を倒した！`);
  gainExp(enemy.exp);
  dropItem();
  applyVictoryRecovery();
  if (isBossFloor(floor)) {
    pendingBossRestLog = true;
  }
  endBattle();
}

function applyVictoryRecovery() {
  const specialEffects = getEquipmentSpecialEffects();
  const recoverRate = (specialEffects.victoryRecover || 0) / 100;
  if (recoverRate <= 0) return;
}

function gameOver() {
  log("☠ 力尽きた。下層へと叩き落とされた。");
  const wasBossBattle = isBossFloor(floor);
  endBattle();

  const penaltyFloor = Math.max(0, floor - 20);
  const checkpointFloor = Math.max(0, Math.floor(floor / 50) * 50);

  floor = wasBossBattle
    ? penaltyFloor // ボス戦は純粋に-20
    : Math.max(penaltyFloor, checkpointFloor);

  player.hp = calcMaxHp();
  setHerbCount(getHerbMaxCount(), false);
  refresh();
  autoSave({ saveHp: true });
}
