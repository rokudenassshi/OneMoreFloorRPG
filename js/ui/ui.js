function log(text) {
  logEl.innerHTML += text + "<br>";
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.innerHTML = "";
}

function updateUI() {
  floorEl.textContent = floor;
  playerHpEl.textContent = `${player.hp}/${calcMaxHp()}`;
  playerLevelEl.textContent = player.level;

  const isBattleView =
    gameState === "BATTLE" ||
    (gameState === "INVENTORY" && inventoryReturnState === "BATTLE");

  if (enemy && isBattleView) {
    enemyNameEl.textContent = enemy.name;
    enemyHpEl.textContent = `HP：${enemy.hp}/${enemy.maxHp}`;
  } else {
    enemyNameEl.textContent = "";
    enemyHpEl.textContent = "";
  }
}

function refresh() {
  updateUI();
}
