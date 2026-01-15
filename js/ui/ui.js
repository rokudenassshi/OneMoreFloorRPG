function log(text) {
  logEl.innerHTML += text + "<br>";
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.innerHTML = "";
}
let rareEnemyPopupTimer = null;

function hideRareEnemyPopup() {
  if (!rareEnemyPopupEl) return;
  rareEnemyPopupEl.classList.remove("is-visible");
  rareEnemyPopupEl.setAttribute("aria-hidden", "true");
}

function showRareEnemyPopup(enemyName) {
  if (!rareEnemyPopupEl || !rareEnemyPopupNameEl) return;
  rareEnemyPopupNameEl.textContent = enemyName;
  rareEnemyPopupEl.classList.add("is-visible");
  rareEnemyPopupEl.setAttribute("aria-hidden", "false");

  if (rareEnemyPopupTimer) {
    clearTimeout(rareEnemyPopupTimer);
  }

  rareEnemyPopupTimer = setTimeout(() => {
    hideRareEnemyPopup();
  }, 2200);
}

if (rareEnemyPopupEl) {
  rareEnemyPopupEl.addEventListener("click", () => {
    if (rareEnemyPopupTimer) {
      clearTimeout(rareEnemyPopupTimer);
      rareEnemyPopupTimer = null;
    }
    hideRareEnemyPopup();
  });
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
