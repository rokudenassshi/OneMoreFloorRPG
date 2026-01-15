function startBattle() {
  gameState = "BATTLE";
  clearLog();

  // ★ floor 以上で出現する敵だけ抽選
  const base = EnemyGen.createEnemyForFloor(floor);

  // レアエネミー
  const specialEffects = getEquipmentSpecialEffects();
  const baseRareRate = 0.03;
  const bonusRareRate = (specialEffects.rareEncounterBoost || 0) / 100;
  const isRare = Math.random() < Math.min(0.5, baseRareRate + bonusRareRate);
  const rate = isRare ? 3 : 1;

  enemy = {
    id: base.id,
    name: isRare ? `＊レア ${base.name}` : base.name,
    isRare,
    tier: base.tier,
    titleMul: base.titleMul,
    // 上位ほど強い：baseがtierで強い + floor補正を少し
    maxHp: Math.floor((base.hp + floor * 2) * rate),
    hp: Math.floor((base.hp + floor * 2) * rate),
    atk: Math.floor((base.atk + Math.floor(floor / 3)) * rate),
    exp: Math.floor((base.exp + Math.floor(floor / 2)) * rate),

    // ★ ドロップ候補を保持
    drops: base.drops,
  };

  exploreButtons.style.display = "none";
  battleButtons.style.display = "block";

  log(`⚔ ${enemy.name} があらわれた！`);
  if (isRare) {
    showRareEnemyPopup(base.name);
  }
  updateUI();
}

function attack() {
  if (gameState !== "BATTLE") return;

  const atk = calcAttack();
  const hits = calcAttackCount();
  const specialEffects = getEquipmentSpecialEffects();
  const comboBoostRate = (specialEffects.comboBoost || 0) / 100;

  let total = 0;
  const bonusAtk = calcPowerBonusDamage(enemy.maxHp ?? enemy.hp);
  const enemyHpBefore = enemy.hp;

  const hitDamages = [];
  const hitComboBonusDamages = [];
  for (let i = 0; i < hits; i++) {
    const decayMultiplier = Math.pow(0.5, i);
    const baseHitAtk = Math.max(1, Math.floor(atk * decayMultiplier));
    const hitAtk = Math.max(
      1,
      Math.floor(baseHitAtk * (1 + comboBoostRate * i))
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

  enemy.hp -= bonusAtk;
  total += bonusAtk;
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
  if (bonusAtk > 0) {
    log(`追加ダメージ ${bonusAtk}`);
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
    endBattle();
    refresh();
    return;
  }

  const rate = Math.min(30 + Math.floor(player.status.agility / 2), 90);

  if (Math.random() * 100 < rate) {
    log("💨 逃走成功！");
    floor = Math.max(0, floor - 1);
    endBattle();
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
  if (result?.evaded) return;

  const specialEffects = getEquipmentSpecialEffects();
  const reflectRate = (specialEffects.reflect || 0) / 100;
  if (reflectRate > 0 && enemy) {
    const reflectDamage = Math.floor((result?.damage || 0) * reflectRate);
    if (reflectDamage > 0) {
      enemy.hp -= reflectDamage;
      log(`🛡️ ${enemy.name} に${reflectDamage}ダメージ反射`);
      if (enemy.hp <= 0) {
        handleEnemyDefeat();
      }
    }
  }
}

function rollDamageWithRoll(base, variance, roll) {
  const min = Math.floor(base * (1 - variance));
  const max = Math.ceil(base * (1 + variance));
  return Math.max(1, Math.floor(roll * (max - min + 1)) + min);
}

function rollDamage(base, variance = 0.3) {
  return rollDamageWithRoll(base, variance, Math.random());
}

function endBattle() {
  const hasBattle = !!enemy;
  gameState = "EXPLORE";
  enemy = null;

  if (hasBattle) {
    player.hp = calcMaxHp();
    log("✨ 戦闘終了でHPが全回復した");
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
  endBattle();
}

function applyVictoryRecovery() {
  const specialEffects = getEquipmentSpecialEffects();
  const recoverRate = (specialEffects.victoryRecover || 0) / 100;
  if (recoverRate <= 0) return;

  const maxHp = calcMaxHp();
  const recoverAmount = Math.floor(maxHp * recoverRate);
  if (recoverAmount <= 0) return;

  player.hp = Math.min(maxHp, player.hp + recoverAmount);
  log(`✨ 勝利時リカバーでHPを${recoverAmount}回復`);
}

function gameOver() {
  log("☠ 力尽きた。下層へと叩き落とされた。");
  endBattle();
  floor = Math.max(0, Math.floor(floor / 50) * 50);
  player.hp = calcMaxHp();
  setHerbCount(10, false);
  refresh();
  autoSave({ saveHp: true });
}
