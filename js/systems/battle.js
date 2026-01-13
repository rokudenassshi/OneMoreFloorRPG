function startBattle() {
  gameState = "BATTLE";

  // ★ floor 以上で出現する敵だけ抽選
  const base = EnemyGen.createEnemyForFloor(floor);

  // レアエネミー
  const isRare = Math.random() < 0.1;
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
  for (let i = 0; i < hits; i++) {
    enemy.hp -= atk;
    total += atk;
  }

  log(`▶ 攻撃！ ${hits}回ヒット（${total}ダメージ）`);
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
  log(`◀ ${enemy.name} の攻撃！ ${enemy.atk}ダメージ`);
  damagePlayer(enemy.atk);
}


function endBattle() {
  gameState = "EXPLORE";
  enemy = null;

  battleButtons.style.display = "none";
  exploreButtons.style.display = "block";
  refresh();
}

function gameOver() {
  log("☠ ゲームオーバー");
  endBattle();
  resetPlayer();
  goToBase();
}

