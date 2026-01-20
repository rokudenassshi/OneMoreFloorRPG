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
function showRareEnemyPopup(enemyName, titleText = "レアモンスター出現！") {
  if (!rareEnemyPopupEl || !rareEnemyPopupNameEl) return;
  if (rareEnemyPopupTitleEl) {
    rareEnemyPopupTitleEl.textContent = titleText;
  }
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
    (gameState === "INVENTORY" && inventoryReturnState === "BATTLE") ||
    (gameState === "SKILL" && skillReturnState === "BATTLE");

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
function showStatUnlockModal(points) {
  document.getElementById("unlockPointAmount").textContent = points;
  document.getElementById("statUnlockModal").classList.remove("hidden");
}

function closeStatUnlockModal() {
  document.getElementById("statUnlockModal").classList.add("hidden");
}
