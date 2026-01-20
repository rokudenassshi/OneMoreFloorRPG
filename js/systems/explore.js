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
function getAvailableBossFloors() {
  const maxFloor = player.maxReachedFloor - 1;
  return BOSS_FLOORS.filter((bossFloor) => bossFloor <= maxFloor);
}

function openTeleportModal() {
  if (gameState !== "EXPLORE") return;
  const availableBossFloors = getAvailableBossFloors();
  if (availableBossFloors.length === 0) {
    log("まだ転移できるボス階層がありません。");
    return;
  }

  const selectEl = document.getElementById("teleportFloorSelect");
  if (!selectEl) return;
  selectEl.innerHTML = "";
  availableBossFloors.forEach((bossFloor) => {
    const option = document.createElement("option");
    option.value = String(bossFloor);
    option.textContent = `${bossFloor}階`;
    selectEl.appendChild(option);
  });
  selectEl.value = String(availableBossFloors[availableBossFloors.length - 1]);

  const modal = document.getElementById("teleportModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeTeleportModal() {
  const modal = document.getElementById("teleportModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}
function teleportToFloor() {
  const selectEl = document.getElementById("teleportFloorSelect");
  if (!selectEl) return;
  const target = Number(selectEl.value);
  if (!Number.isInteger(target)) {
    log("転移するボス階層を選択してください。");
    return;
  }
  const availableBossFloors = getAvailableBossFloors();
  if (!availableBossFloors.includes(target)) {
    log("転移できるのは到達済みのボス階層のみです。");
    return;
  }
  floor = target;
  log(`✨ ${target}階層へ転移した。`);
  refresh();
  closeTeleportModal();
}

function handleFloorArrival() {}
