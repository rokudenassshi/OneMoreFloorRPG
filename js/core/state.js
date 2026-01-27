let gameState = "EXPLORE";
let floor = 0;
let enemy = null;
const autosaveKey = "release3";
const inventorySaveKey = `${autosaveKey}_inventory`;
let battleGutsUsed = false;
let isGameReady = false;
const AUTO_SAVE_INTERVAL_MS = 1200;
const INVENTORY_SAVE_INTERVAL_MS = 8000;
let lastAutoSaveAt = 0;
let lastInventorySaveAt = 0;
let pendingAutoSaveTimer = null;
let pendingAutoSaveOptions = {};
let inventoryDirty = false;
let isLoadingSave = false;

function isBossFloor(currentFloor) {
  return BOSS_FLOORS.includes(currentFloor);
}

function setFloor(value) {
  floor = Math.max(0, Math.min(MAX_FLOOR, value));
  refresh();
}

function setGameState(state) {
  gameState = state;
  refresh();
}

function clearEnemy() {
  enemy = null;
  refresh();
}

function autoSave(options = {}) {
  if (!isGameReady) return;
  pendingAutoSaveOptions = { ...pendingAutoSaveOptions, ...options };
  const now = Date.now();
  const elapsed = now - lastAutoSaveAt;
  if (elapsed >= AUTO_SAVE_INTERVAL_MS && !pendingAutoSaveTimer) {
    performAutoSave(pendingAutoSaveOptions);
    pendingAutoSaveOptions = {};
    return;
  }
  if (pendingAutoSaveTimer) return;
  const delay = Math.max(0, AUTO_SAVE_INTERVAL_MS - elapsed);
  pendingAutoSaveTimer = setTimeout(() => {
    pendingAutoSaveTimer = null;
    performAutoSave(pendingAutoSaveOptions);
    pendingAutoSaveOptions = {};
  }, delay);
}

function performAutoSave(options = {}) {
  if (!isGameReady) return;
  const now = Date.now();
  lastAutoSaveAt = now;
  const hasInventorySnapshot = Boolean(localStorage.getItem(inventorySaveKey));
  const shouldPersistInventory =
    options.saveInventory ||
    !hasInventorySnapshot ||
    (inventoryDirty && now - lastInventorySaveAt >= INVENTORY_SAVE_INTERVAL_MS);
  const weaponIndex =
    player && player.weapon ? inventory.indexOf(player.weapon) : -1;
  const weapon2Index =
    player && player.weapon2 ? inventory.indexOf(player.weapon2) : -1;
  const accessoryIndex =
    player && player.accessory ? inventory.indexOf(player.accessory) : -1;
  const data = {
    version: 1,
    savedAt: now,
    floor,
    gameState,
    player: {
      level: player.level,
      exp: player.exp,
      baseHp: player.baseHp,
      hp: player.hp,
      maxReachedFloor: player.maxReachedFloor,
      lastTeleportedFloor: player.lastTeleportedFloor,
      status: {
        power: player.status.power,
        vitality: player.status.vitality,
        agility: player.status.agility,
      },
      statPoints: player.statPoints,
      statPointUnlockGranted: player.statPointUnlockGranted,
      unassignedPoints: player.unassignedPoints,
      skills: { ...player.skills },
      autoAssignExpSkillPoints: player.autoAssignExpSkillPoints,
      weaponIndex,
      weapon2Index,
      accessoryIndex,
    },
    inventorySavedAt: lastInventorySaveAt,
  };

  localStorage.setItem(autosaveKey, JSON.stringify(data));
  if (shouldPersistInventory) {
    data.inventory = inventory.map((item) => ({ ...item }));
    localStorage.setItem(autosaveKey, JSON.stringify(data));
    saveInventorySnapshot(now);
  }
}

function setGameReady(value) {
  isGameReady = Boolean(value);
}
function flushAutoSave() {
  if (!isGameReady) return;
  performAutoSave({ saveInventory: true });
}
function markInventoryDirty() {
  if (isLoadingSave) return;
  inventoryDirty = true;
}
function saveInventorySnapshot(timestamp = Date.now()) {
  if (!isGameReady) return;
  const snapshot = {
    savedAt: timestamp,
    items: inventory.map((item) => ({ ...item })),
  };
  localStorage.setItem(inventorySaveKey, JSON.stringify(snapshot));
  lastInventorySaveAt = timestamp;
  inventoryDirty = false;
}
function loadAutoSave() {
  const raw = localStorage.getItem(autosaveKey);
  if (!raw) return false;

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return false;
  }

  if (!data || data.version !== 1) return false;
  const savedPlayer = data.player || {};
  const savedStatus = savedPlayer.status || {};

  floor = Math.max(0, Math.min(MAX_FLOOR, Number(data.floor) || 0));
  gameState = "EXPLORE";
  enemy = null;

  player.level = Math.max(1, Number(savedPlayer.level) || 1);
  player.exp = Math.max(0, Number(savedPlayer.exp) || 0);
  player.baseHp = Math.max(1, Number(savedPlayer.baseHp) || player.baseHp);
  player.maxReachedFloor = Math.max(
    0,
    Math.min(MAX_FLOOR, Number(savedPlayer.maxReachedFloor) || 0),
  );
  const savedLastTeleportedFloor = Number(savedPlayer.lastTeleportedFloor);
  player.lastTeleportedFloor = Number.isFinite(savedLastTeleportedFloor)
    ? Math.max(0, Math.min(MAX_FLOOR, savedLastTeleportedFloor))
    : null;
  player.status.power = Number(savedStatus.power) || 0;
  player.status.vitality = Number(savedStatus.vitality) || 0;
  player.status.agility = Number(savedStatus.agility) || 0;
  player.statPoints = Math.max(0, Number(savedPlayer.statPoints) || 0);
  player.statPointUnlockGranted = Boolean(savedPlayer.statPointUnlockGranted);
  player.unassignedPoints = Math.max(
    0,
    Number(savedPlayer.unassignedPoints) || 0,
  );
  player.autoAssignExpSkillPoints = Boolean(
    savedPlayer.autoAssignExpSkillPoints,
  );

  player.skills =
    savedPlayer.skills && typeof savedPlayer.skills === "object"
      ? { ...savedPlayer.skills }
      : {};

  inventory.length = 0;
  isLoadingSave = true;
  if (Array.isArray(data.inventory)) {
    data.inventory.forEach((item) => {
      if (item) inventory.push({ ...item });
    });
    const legacyInventorySavedAt = Number(data.inventorySavedAt);
    lastInventorySaveAt = Number.isFinite(legacyInventorySavedAt)
      ? legacyInventorySavedAt
      : Date.now();
  } else {
    const inventoryRaw = localStorage.getItem(inventorySaveKey);
    if (inventoryRaw) {
      try {
        const inventoryData = JSON.parse(inventoryRaw);
        if (Array.isArray(inventoryData?.items)) {
          inventoryData.items.forEach((item) => {
            if (item) inventory.push({ ...item });
          });
        }
        const savedAt = Number(inventoryData?.savedAt);
        lastInventorySaveAt = Number.isFinite(savedAt) ? savedAt : Date.now();
      } catch (error) {
        // ignore invalid inventory cache
      }
    }
  }
  inventoryDirty = false;
  isLoadingSave = false;
  if (!lastInventorySaveAt) {
    lastInventorySaveAt = Date.now();
  }

  const weaponIndex = Number(savedPlayer.weaponIndex);
  player.weapon =
    Number.isInteger(weaponIndex) && inventory[weaponIndex]
      ? inventory[weaponIndex]
      : null;
  const weapon2Index = Number(savedPlayer.weapon2Index);
  player.weapon2 =
    Number.isInteger(weapon2Index) && inventory[weapon2Index]
      ? inventory[weapon2Index]
      : null;
  const accessoryIndex = Number(savedPlayer.accessoryIndex);
  player.accessory =
    Number.isInteger(accessoryIndex) && inventory[accessoryIndex]
      ? inventory[accessoryIndex]
      : null;

  const loadedHp = Number(savedPlayer.hp);
  const maxHp = calcMaxHp();
  const hpToApply = Number.isFinite(loadedHp) ? loadedHp : player.hp;
  player.hp = Math.min(Math.max(0, hpToApply), maxHp);
  return true;
}

window.addEventListener("beforeunload", () => {
  flushAutoSave();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    flushAutoSave();
  }
});
