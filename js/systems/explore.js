function goToBase() {
  floor = 0;
  player.hp = calcMaxHp();
  enemy = null;
  gameState = "EXPLORE";

  player.hp = calcMaxHp();
  battleButtons.style.display = "none";
  exploreButtons.style.display = "block";
  inventoryEl.style.display = "none";

  log("🏠 拠点に戻った");
  log("✨ HPが全回復した");
  refresh();
}

function move(dir) {
  if (gameState !== "EXPLORE") return;

  const prev = floor;
  floor = Math.max(0, floor + dir);
  player.maxReachedFloor = Math.max(player.maxReachedFloor, floor);

  // 拠点（0階層）
  // if (floor === 0 && prev !== 0) {
  if (floor === 0) {
    goToBase();
    autoSave();
    return;
  }
  // ===== ここからイベント抽選 =====

  // 10階層までは必ず戦闘（= floor <= 10）
  if (floor <= 10) {
    startBattle();
    autoSave();
    return;
  }

  // 11階層以降：70%戦闘 / 20%何もなし / 10%泉
  const roll = Math.random(); // 0.0〜0.999...

  if (roll < 0.70) {
    // 70% 戦闘
    startBattle();
    autoSave();
    return;
  }

  if (roll < 0.90) {
    // 20% 何も起こらない
    log("…何も起こらなかった。");
    autoSave();
    return;
  }

  // 10% 泉（HP全回復）
  log("✨ 泉を発見した。");
  player.hp = calcMaxHp();
  log("💧 HPが回復した。");
  autoSave();
  refresh();
}


