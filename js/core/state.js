let gameState = "EXPLORE";
let floor = 0;
let enemy = null;
const autosaveKey = "roguelike_autosave";
let battleGutsUsed = false;

function isBossFloor(currentFloor) {
  return BOSS_FLOORS.includes(currentFloor);
}

function setFloor(value) {
  floor = Math.max(0, value);
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

function autoSave() {
  const weaponIndex =
    player && player.weapon ? inventory.indexOf(player.weapon) : -1;
  const accessoryIndex =
    player && player.accessory ? inventory.indexOf(player.accessory) : -1;
  const data = {
    version: 1,
    savedAt: Date.now(),
    floor,
    gameState,
    player: {
      level: player.level,
      exp: player.exp,
      baseHp: player.baseHp,
      hp: player.hp,
      maxReachedFloor: player.maxReachedFloor,
      status: {
        power: player.status.power,
        vitality: player.status.vitality,
        agility: player.status.agility,
      },
      statPoints: player.statPoints,
      statPointUnlockGranted: player.statPointUnlockGranted,
      unassignedPoints: player.unassignedPoints,
      skills: { ...player.skills },
      weaponIndex,
      accessoryIndex,
    },
    inventory: inventory.map((item) => ({ ...item })),
  };

  localStorage.setItem(autosaveKey, JSON.stringify(data));
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

  floor = Math.max(0, Number(data.floor) || 0);
  gameState = "EXPLORE";
  enemy = null;

  player.level = Math.max(1, Number(savedPlayer.level) || 1);
  player.exp = Math.max(0, Number(savedPlayer.exp) || 0);
  player.baseHp = Math.max(1, Number(savedPlayer.baseHp) || player.baseHp);
  player.maxReachedFloor = Math.max(
    0,
    Number(savedPlayer.maxReachedFloor) || 0,
  );
  player.status.power = Number(savedStatus.power) || 0;
  player.status.vitality = Number(savedStatus.vitality) || 0;
  player.status.agility = Number(savedStatus.agility) || 0;
  player.statPoints = Math.max(0, Number(savedPlayer.statPoints) || 0);
  player.statPointUnlockGranted = Boolean(savedPlayer.statPointUnlockGranted);
  player.unassignedPoints = Math.max(
    0,
    Number(savedPlayer.unassignedPoints) || 0,
  );

  player.skills =
    savedPlayer.skills && typeof savedPlayer.skills === "object"
      ? { ...savedPlayer.skills }
      : {};

  inventory.length = 0;
  if (Array.isArray(data.inventory)) {
    data.inventory.forEach((item) => {
      if (item) inventory.push({ ...item });
    });
  }

  const weaponIndex = Number(savedPlayer.weaponIndex);
  player.weapon =
    Number.isInteger(weaponIndex) && inventory[weaponIndex]
      ? inventory[weaponIndex]
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
