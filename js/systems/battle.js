function startBattle() {
  gameState = "BATTLE";
  clearLog();
  battleGutsUsed = false;

  // ★ floor 以上で出現する敵だけ抽選
  const base = EnemyGen.createEnemyForFloor(floor);
  const equipmentSpecialEffects = getEquipmentSpecialEffects();
  const specialEffects = getSpecialEffects();
  bonusRareRate = (specialEffects.rareEncounterBoost || 0) / 100;
  const isRareBlocked = (specialEffects.rareEncounterBlock || 0) > 0;
  const isBrokenBlocked = (specialEffects.brokenEncounterBlock || 0) > 0;
  const isRarePopupCut = (specialEffects.rareEncounterPopupCut || 0) > 0;
  const isBrokenPopupCut = (specialEffects.brokenEncounterPopupCut || 0) > 0;
  // ★壊れたエネミー（1001階層以降）
  const brokenEnemyRate = 0.01;
  const isBroken =
    floor >= UNLOCK_FLOOR &&
    !isBrokenBlocked &&
    Math.random() < brokenEnemyRate + bonusRareRate;
  // レアモンスター
  const baseRareRate = 0.02;
  const isRare =
    !isBroken && !isRareBlocked && Math.random() < baseRareRate + bonusRareRate;
  const rate = isBroken ? 2.5 : isRare ? 1.8 : 1;

  const highFloorStep =
    floor >= UNLOCK_FLOOR ? Math.floor((floor - UNLOCK_FLOOR) / 50) + 1 : 0;
  const highFloorMultiplier = highFloorStep > 0 ? 1 + highFloorStep * 0.2 : 1;
  const reincarnationEnemyMultiplier =
    typeof getReincarnationEnemyMultiplier === "function"
      ? getReincarnationEnemyMultiplier()
      : 1;
  const enemyStatMultiplier =
    rate * highFloorMultiplier * reincarnationEnemyMultiplier;
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
    maxHp: Math.floor((base.hp + floor * 2) * enemyStatMultiplier),
    hp: Math.floor((base.hp + floor * 2) * enemyStatMultiplier),
    atk: Math.floor((base.atk + Math.floor(floor / 3)) * enemyStatMultiplier),
    exp: Math.floor((base.exp + Math.floor(floor / 2)) * rate),

    // ★ ドロップ候補を保持
    drops: base.drops,
  };

  exploreButtons.style.display = "none";
  battleButtons.style.display = "block";

  log(`⚔ ${enemy.name} があらわれた！`);
  if (isBroken && !isBrokenPopupCut) {
    showRareEnemyPopup(base.name, "★壊れたエネミーが出現した。");
  } else if (isRare && !isRarePopupCut) {
    showRareEnemyPopup(base.name);
  }
  updateUI();
}
function adjustDamageForEnemy(rawDamage) {
  if (enemy?.id === "boss_rokushi") {
    return Math.floor(rawDamage * 0.5);
  }
  return rawDamage;
}
async function attack({ isExtraAttack = false } = {}) {
  if (gameState !== "BATTLE") return;

  const atk = calcAttack();
  const hits = calcAttackCount();

  const specialEffects = getSpecialEffects();
  const comboBoostRate = (specialEffects.comboBoost || 0) / 100;
  const selfDamageBoostRate = (specialEffects.selfDamageBoost || 0) / 100;
  const singleHitBoostRate = specialEffects.singleHitBoost || 0;
  const lastStandBoostRate = specialEffects.lastStandAttackBoost || 0;
  const decayBase = specialEffects.agilityAttackRate > 0 ? 0.8 : 0.6;

  const selfDamageMultiplier = 1 + selfDamageBoostRate;
  const isRokushi = enemy?.id === "boss_rokushi";
  const enemyDamageMultiplier = isRokushi ? 0.5 : 1;

  const singleHitMultiplier =
    hits === 1 && singleHitBoostRate > 0 ? 1 + singleHitBoostRate : 1;
  const lastStandMultiplier =
    player.hp === 1 && lastStandBoostRate > 0 ? 1 + lastStandBoostRate : 1;

  const attackMultiplier = singleHitMultiplier * lastStandMultiplier;
  const effectiveAtk = Math.max(1, Math.floor(atk * attackMultiplier));

  const enemyHpBefore = enemy.hp;

  let total = 0;

  // ---- ログは「表示制限」する（ヒット数上限ではない）----
  const logs = [];
  if (hits > 1) logs.push(`▶ ${hits}回の連続攻撃。`);

  const SHOW_HEAD = 12; // 最初に表示する回数
  const SHOW_TAIL = 3; // 最後に表示する回数
  const shouldSummarize = hits > SHOW_HEAD + SHOW_TAIL + 1;

  // Safariのクラッシュ対策：長いループは途中でyield
  const YIELD_EVERY = 300; // 端末が重いなら 300 でもOK

  let decayMultiplier = 1;
  for (let i = 0; i < hits; i++) {
    if (i > 0) decayMultiplier *= decayBase;
    const baseHitAtk = Math.max(1, Math.floor(effectiveAtk * decayMultiplier));

    const hitAtk = Math.max(
      1,
      Math.floor(baseHitAtk * (1 + comboBoostRate * i)),
    );

    const boostedBaseHitAtk = Math.max(
      1,
      Math.floor(baseHitAtk * selfDamageMultiplier),
    );
    const boostedHitAtk = Math.max(
      1,
      Math.floor(hitAtk * (1 + selfDamageBoostRate)),
    );

    const damageRoll = Math.random();
    const rawDamage = rollDamageWithRoll(boostedHitAtk, 0.3, damageRoll);
    const rawBaseDamage = rollDamageWithRoll(
      boostedBaseHitAtk,
      0.3,
      damageRoll,
    );
    const damage =
      enemyDamageMultiplier === 1
        ? rawDamage
        : Math.floor(rawDamage * enemyDamageMultiplier);
    const baseDamage =
      enemyDamageMultiplier === 1
        ? rawBaseDamage
        : Math.floor(rawBaseDamage * enemyDamageMultiplier);
    const comboBonusDamage = Math.max(0, damage - baseDamage);

    enemy.hp -= damage;
    total += damage;

    // ---- ログは必要な部分だけ作る（配列に全ヒット分溜めない）----
    const inHead = i < SHOW_HEAD;
    const inTail = i >= hits - SHOW_TAIL;
    if (!shouldSummarize || inHead || inTail) {
      const comboLog =
        comboBoostRate > 0 && comboBonusDamage > 0
          ? `（連撃強化+${comboBonusDamage}）`
          : "";
      logs.push(`${i + 1}回目 ${damage}ダメージ${comboLog}`);
    } else if (i === SHOW_HEAD) {
      logs.push(`…（中略 ${hits - (SHOW_HEAD + SHOW_TAIL)}回）…`);
    }

    // ---- Safariのために時々yield（フリーズ/内部エラー回避）----
    if (hits >= YIELD_EVERY && i > 0 && i % YIELD_EVERY === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  logs.push(`▶ 合計 ${total}ダメージ`);
  logBulk(logs);

  refresh();

  // 吸血
  const lifeStealRate = (specialEffects.lifeSteal || 0) / 100;
  if (lifeStealRate > 0) {
    const recoverAmount = Math.max(1, Math.floor(total * lifeStealRate));
    if (recoverAmount > 0) {
      const overHealRate = specialEffects.lifeStealOverHealRate || 0;
      if (overHealRate > 0) {
        const overHealAmount = Math.max(
          1,
          Math.floor(recoverAmount * overHealRate),
        );
        player.hp = player.hp + overHealAmount;
        log(`🩸 血装衛でHPを${overHealAmount}回復`);
      } else {
        const maxHp = calcMaxHp();
        player.hp = Math.min(maxHp, player.hp + recoverAmount);
        log(`🩸 吸血でHPを${recoverAmount}回復`);
      }
      const lifeStealDamageRate = specialEffects.lifeStealDamage || 0;
      if (lifeStealDamageRate > 0 && enemy) {
        const extraDamage = adjustDamageForEnemy(
          Math.floor(recoverAmount * lifeStealDamageRate),
        );
        if (extraDamage > 0) {
          enemy.hp -= extraDamage;
          log(`🩸 血装撃${extraDamage}ダメージ `);
        }
      }
    }
  }
  if (enemy.hp <= 0) {
    afterPlayerAction();
    return;
  }

  const attackAgainChance = specialEffects.attackAgainChance || 0;
  if (!isExtraAttack && attackAgainChance > 0) {
    const roll = Math.random() * 100;
    if (roll < attackAgainChance) {
      log("⚔️ 追撃！");
      await attack({ isExtraAttack: true });
      return;
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
    const specialEffects = getSpecialEffects();
    const equipmentEffects = getEquipmentSpecialEffects();
    const selfDamageBoostRate = (specialEffects.selfDamageBoost || 0) / 100;
    const hasSelfDamageBoostAccessory =
      (equipmentEffects.selfDamageBoost || 0) > 0;
    if (selfDamageBoostRate > 0) {
      if (!(hasSelfDamageBoostAccessory && player.hp === 1)) {
        const maxHp = calcMaxHp();
        const selfDamage = Math.max(1, Math.floor(maxHp * 0.4));
        player.hp = Math.max(0, player.hp - selfDamage);
        log(`💥 HPを${selfDamage}消費`);
        if (player.hp === 0) {
          refresh();
          gameOver();
          return;
        }
      }
    }
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
    const reflectSourceDamage = result?.rawDamage ?? result?.damage ?? 0;
    let reflectDamage = Math.floor(reflectSourceDamage * reflectRate);
    // ★ ろく氏は反射ダメージ80%軽減
    if (enemy.id === "boss_rokushi") {
      reflectDamage = Math.floor(reflectDamage * 0.2);
      log("ろく氏「キカヌ」");
    }
    reflectDamage = adjustDamageForEnemy(reflectDamage);
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
  const singleHitBoostRate = specialEffects.singleHitBoost || 0;
  const lastStandBoostRate = specialEffects.lastStandAttackBoost || 0;
  const singleHitMultiplier =
    singleHitBoostRate > 0 ? 1 + singleHitBoostRate : 1;
  const lastStandMultiplier =
    player.hp === 1 && lastStandBoostRate > 0 ? 1 + lastStandBoostRate : 1;
  const attackMultiplier = singleHitMultiplier * lastStandMultiplier;
  const effectiveAtk = Math.max(1, Math.floor(attackPower * attackMultiplier));
  const damage = adjustDamageForEnemy(rollDamage(effectiveAtk, 0.3));
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
        log(`🌿 戦闘終了やくそうを手に入れた`);
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
  if (typeof handleWeatheredWeaponProgress === "function") {
    handleWeatheredWeaponProgress({
      defeatedRareEnemy: enemy?.isRare || enemy?.isBroken,
    });
  }
  const specialEffects = getSpecialEffects();
  if (
    specialEffects.cursedAccessory > 0 &&
    (enemy?.isRare || enemy?.isBroken) &&
    typeof handleCursedAccessoryProgress === "function"
  ) {
    handleCursedAccessoryProgress({
      defeatedRareEnemy: true,
      increment: specialEffects.cursedAccessory,
    });
  }
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
  if (player.stayOnCurrentFloor) {
    log("☠ 力尽きた。だが現在の階層に留まった。");
  } else {
    log("☠ 力尽きた。下層へと叩き落とされた。");
  }
  const wasBossBattle = isBossFloor(floor);
  endBattle();
  if (!player.stayOnCurrentFloor) {
    const penaltyFloor = Math.max(0, floor - 20);
    const checkpointFloor = Math.max(0, Math.floor(floor / 50) * 50);
    floor = wasBossBattle
      ? penaltyFloor // ボス戦は純粋に-20
      : Math.max(penaltyFloor, checkpointFloor);
  }

  player.hp = calcMaxHp();
  setHerbCount(getHerbMaxCount(), false);
  refresh();
  autoSave({ saveHp: true });
}
