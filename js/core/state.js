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
