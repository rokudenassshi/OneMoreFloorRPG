function startBattle() {
  gameState = "BATTLE";

  // ★ floor 以上で出現する敵だけ抽選
  const base = EnemyGen.createEnemyForFloor(floor);

  // レアエネミー
  const isRare = Math.random() < 0.01;
  const rate = isRare ? 5 : 1;

  enemy = {
    id: base.id,
    name: isRare ? `＊レア ${base.name}` : base.name,
    isRare,

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
  updateUI();
}

function attack() {
  if (gameState !== "BATTLE") return;

  const atk = calcAttack();
  const hits = calcAttackCount();

  let total = 0;
  const bonusAtk = calcPowerBonusDamage(enemy.maxHp ?? enemy.hp);

  const hitDecayRate = 0.9;
  const lateHitDecayRate = 0.95;
  const hitDamages = [];
  for (let i = 0; i < hits; i++) {
    const earlyHits = Math.min(i, 4);
    const lateHits = Math.max(0, i - 4);
    const hitAtk = Math.max(
      1,
      Math.floor(
        atk *
          Math.pow(hitDecayRate, earlyHits) *
          Math.pow(lateHitDecayRate, lateHits)
      )
    );
    const damage = rollDamage(hitAtk);
    enemy.hp -= damage;
    total += damage;
    hitDamages.push(damage);
  }

  enemy.hp -= bonusAtk;
  total += bonusAtk;
  if (hits > 1) {
    log(`▶ ${hits}回の連続攻撃。`);
    hitDamages.forEach((damage, index) => {
      log(`${index + 1}回目 ${damage}ダメージ`);
    });
    if (bonusAtk > 0) {
      log(`追加ダメージ ${bonusAtk}`);
    }
  } else {
    log(`▶ 攻撃！ ${hits}回ヒット（${total}ダメージ）`);
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
    log(` ${enemy.name} を倒した！`);
    gainExp(enemy.exp);
    dropItem();
    endBattle();
  } else {
    enemyAttack();
  }
}

function enemyAttack() {
  if (gameState !== "BATTLE") return;
  const damage = rollDamage(enemy.atk);
  log(`◀ ${enemy.name} の攻撃！ ${damage}ダメージ`);
  damagePlayer(damage);
}

function rollDamage(base, variance = 0.3) {
  const min = Math.floor(base * (1 - variance));
  const max = Math.ceil(base * (1 + variance));
  return Math.max(1, Math.floor(Math.random() * (max - min + 1)) + min);
}

function endBattle() {
  const hasBattle = !!enemy;
  gameState = "EXPLORE";
  enemy = null;

  if (hasBattle) {
    battleCount += 1;
    if (battleCount % 10 === 0) {
      grantHerbs(1);
    }
  }

  battleButtons.style.display = "none";
  exploreButtons.style.display = "block";
  refresh();
  autoSave({ saveHp: true });
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
