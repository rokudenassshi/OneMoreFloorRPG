const MAX_LOG_LINES = 200;
// DOMがまだの時でも落ちないように、遅延取得＆キャッシュする
let logContainer = null;

function getLogContainer() {
  if (logContainer) return logContainer;

  // game.html: <div class="log" id="log"></div>
  const el = document.getElementById("log");
  if (!el) return null;

  logContainer = el;
  return logContainer;
}

function flushLog() {
  const el = getLogContainer();
  if (!el) return;

  // ログ上限
  while (el.children.length > MAX_LOG_LINES) {
    el.removeChild(el.firstChild);
  }

  // 末尾へスクロール
  el.scrollTop = el.scrollHeight;
}

function log(text, { silent = false } = {}) {
  const el = getLogContainer();
  if (!el) return; // DOM未生成なら何もしない（落ちない）

  const div = document.createElement("div");
  div.textContent = text;
  el.appendChild(div);

  if (!silent) flushLog();
}

function logBulk(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return;

  const el = getLogContainer();
  if (!el) return;

  const frag = document.createDocumentFragment();
  for (const text of lines) {
    const div = document.createElement("div");
    div.textContent = text;
    frag.appendChild(div);
  }
  el.appendChild(frag);

  flushLog();
}
function clearLog() {
  const el = getLogContainer();
  if (!el) return;
  el.textContent = "";
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

function showEventPopup(message, titleText = "イベント発生") {
  showRareEnemyPopup(message, titleText);
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
window.showEventPopup = showEventPopup;
function updateUI() {
  floorEl.textContent = floor;
  playerHpEl.textContent = `${player.hp}/${calcMaxHp()}`;
  playerLevelEl.textContent = player.level;
  // ★ 経験値バー更新（数値表示なし）
  if (expBarFillEl) {
    const rate = Math.min(1, player.exp / calcNextExp());
    expBarFillEl.style.width = `${rate * 100}%`;
  }
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
