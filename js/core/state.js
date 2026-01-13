let gameState = "EXPLORE";
let floor = 0;
let enemy = null;
let battleCount = 0;
const autosaveKey = "roguelike_autosave";

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
      baseStatus: {
        power: player.baseStatus.power,
        vitality: player.baseStatus.vitality,
        agility: player.baseStatus.agility,
      },
      unassignedPoints: player.unassignedPoints,
      weaponIndex,
    },
    battleCount,
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
  const savedBaseStatus = savedPlayer.baseStatus || {};

  floor = Math.max(0, Number(data.floor) || 0);
  gameState = "EXPLORE";
  enemy = null;
  battleCount = Math.max(0, Number(data.battleCount) || 0);

  player.level = Math.max(1, Number(savedPlayer.level) || 1);
  player.exp = Math.max(0, Number(savedPlayer.exp) || 0);
  player.baseHp = Math.max(1, Number(savedPlayer.baseHp) || player.baseHp);
  player.maxReachedFloor = Math.max(
    0,
    Number(savedPlayer.maxReachedFloor) || 0
  );
  player.status.power = Number(savedStatus.power) || 0;
  player.status.vitality = Number(savedStatus.vitality) || 0;
  player.status.agility = Number(savedStatus.agility) || 0;
  player.baseStatus.power =
    Number(savedBaseStatus.power) || player.status.power;
  player.baseStatus.vitality =
    Number(savedBaseStatus.vitality) || player.status.vitality;
  player.baseStatus.agility =
    Number(savedBaseStatus.agility) || player.status.agility;
  player.unassignedPoints = Math.max(
    0,
    Number(savedPlayer.unassignedPoints) || 0
  );

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

  const loadedHp = Number(savedPlayer.hp);
  const maxHp = calcMaxHp();
  const hpToApply = Number.isFinite(loadedHp) ? loadedHp : player.hp;
  player.hp = Math.min(Math.max(0, hpToApply), maxHp);

  return true;
}
