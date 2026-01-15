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

  // 拠点（0階層）
  if (floor === 0) {
    goToBase();
    autoSave();
    return;
  }

  // 50階層ごとの節目：必ずHP全回復
  if (floor % 50 === 0) {
    log("🔥静かに炎が燈っている。ここでは休めそうだ。");
    player.hp = calcMaxHp();
    log("HPが最大まで回復した。");
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

  if (roll < 0.7) {
    // 70% 戦闘
    startBattle();
    autoSave();
    return;
  }

  if (roll < 0.9) {
    // 20% 何も起こらない
    log("…何も起こらなかった。");
    refresh();
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
