function log(text) {
  logEl.innerHTML += text + "<br>";
  logEl.scrollTop = logEl.scrollHeight;
}

function updateUI() {
  floorEl.textContent = floor;
  playerHpEl.textContent = `${player.hp}/${calcMaxHp()}`;
  playerLevelEl.textContent = player.level;

  if (enemy && gameState === "BATTLE") {
    enemyInfoEl.textContent =
      `${enemy.name} HP：${enemy.hp}/${enemy.maxHp}`;
  } else {
    enemyInfoEl.textContent = "---";
  }
}

function refresh() {
  updateUI();
}