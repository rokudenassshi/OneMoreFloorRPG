let gameState = "EXPLORE";
let floor = 0;
let enemy = null;

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
  const weaponIndex = player && player.weapon ? inventory.indexOf(player.weapon) : -1;
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
    inventory: inventory.map(item => ({ ...item })),
  };

  localStorage.setItem(autosaveKey, JSON.stringify(data));
}