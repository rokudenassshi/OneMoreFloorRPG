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

  setFloor(floor + dir);

  if (floor === 0) {
    goToBase();
    return;
  }

  startBattle();
}

