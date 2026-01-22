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
  floor = Math.max(0, Math.min(MAX_FLOOR, floor + dir));
  player.maxReachedFloor = Math.max(
    player.maxReachedFloor,
    Math.min(MAX_FLOOR, floor),
  );
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
function getAvailableTeleportFloors() {
  const max = player.maxReachedFloor - 1;
  const floors = [];

  for (let f = 0; f <= max; f += 50) {
    floors.push(f);
  }

  return floors;
}

function openTeleportModal() {
  const isBattleView =
    gameState === "BATTLE" ||
    (gameState === "INVENTORY" && inventoryReturnState === "BATTLE") ||
    (gameState === "SKILL" && skillReturnState === "BATTLE");
  if (isBattleView) {
    log("⚠️ 戦闘中は転移できない。");
    return;
  }
  const availableFloors = getAvailableTeleportFloors();
  if (availableFloors.length === 0) {
    log("まだ転移できる階層がありません。");
    return;
  }

  const selectEl = document.getElementById("teleportFloorSelect");
  if (!selectEl) return;
  selectEl.innerHTML = "";
  availableFloors.forEach((floor) => {
    const option = document.createElement("option");
    option.value = String(floor);
    option.textContent = `${floor}階`;
    selectEl.appendChild(option);
  });
  selectEl.value = String(availableFloors[availableFloors.length - 1]);

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
    log("転移する階層を選択してください。");
    return;
  }
  const availableFloors = getAvailableTeleportFloors();
  if (!availableFloors.includes(target)) {
    log("転移できるのは到達済みの階層のみです。");
    return;
  }
  floor = target;
  log(`✨ ${target}階層へ転移した。`);
  refresh();
  closeTeleportModal();
}

function handleFloorArrival() {}
