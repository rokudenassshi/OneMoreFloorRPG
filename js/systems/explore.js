let pendingBossRestLog = false;
function goToBase() {
  floor = 0;
  enemy = null;
  gameState = "EXPLORE";

  battleButtons.style.display = "none";
  exploreButtons.style.display = "block";
  inventoryEl.style.display = "none";

  log("🏠 拠点に戻った");
  refresh();
}

function move(dir) {
  if (gameState !== "EXPLORE") return;
  floor = Math.max(0, floor + dir);
  player.maxReachedFloor = Math.max(player.maxReachedFloor, floor);
  awardStatPointUnlock();
  // 拠点（0階層）
  if (floor === 0) {
    goToBase();
    autoSave();
    return;
  }
  // 50階層ごとの節目：必ずHP全回復（ボス階層は勝利時に表示）
  if (floor % 50 === 0 && !isBossFloor(floor)) {
    log("🔥静かに炎が燈っている。ここでは休めそうだ。");
    autoSave();
    refresh();
    return;
  }
  // ボス階層：戦闘を強制
  if (isBossFloor(floor)) {
    startBattle();
    autoSave();
    refresh();
    return;
  }
  // ===== ここからイベント抽選 =====

  // 5階層までは必ず戦闘
  if (floor <= 5) {
    startBattle();
    autoSave();
    return;
  }

  // 11階層以降：70%戦闘 / 20%何もなし / 10%泉
  const roll = Math.random(); // 0.0〜0.999...

  if (roll < 0.9) {
    // 70% 戦闘
    startBattle();
    autoSave();
    return;
  }

  // 10% 何も起こらない
  log("…何も起こらなかった。");
  refresh();
  autoSave();
}

function teleportToFloor() {
  if (gameState !== "EXPLORE") return;
  const maxFloor = player.maxReachedFloor;
  const input = prompt(`転移する階層を入力してください (0〜${maxFloor})`);
  if (input === null) return;

  const target = Number(input);
  if (!Number.isInteger(target)) {
    log("転移する階層は整数で入力してください。");
    return;
  }
  if (target < 0 || target > maxFloor) {
    log(`転移できるのは0〜${maxFloor}階です。`);
    return;
  }

  floor = target;
  log(`✨ ${target}階層へ転移した。`);
}

function handleFloorArrival() {}
