const BOSS_FLOORS = [50, 200, 500, 800, 1000, 1500, 3000, 5000, 10000, 15000];
const MAX_FLOOR = 15001;
const UNLOCK_FLOOR = 1000;
window.BOSS_FLOORS = BOSS_FLOORS;
window.MAX_FLOOR = MAX_FLOOR;
window.FLOOR = UNLOCK_FLOOR;
function getFinalBossFloor() {
  if (!Array.isArray(BOSS_FLOORS) || BOSS_FLOORS.length === 0) {
    return null;
  }
  return Math.max(...BOSS_FLOORS);
}

window.getFinalBossFloor = getFinalBossFloor;
