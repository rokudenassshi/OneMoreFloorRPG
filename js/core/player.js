const player = {
  level: 1,
  exp: 0,

  baseHp: 50,
  hp: 50,

  maxReachedFloor: 0,
  
  status: {
    power: 5,
    vitality: 5,
    agility: 5
  },
  baseStatus: {
    power: 5,
    vitality: 5,
    agility: 5
  },
  unassignedPoints: 0,
  weapon: null
};

function resetPlayer() {
  player.level = 1;
  player.exp = 0;
  player.unassignedPoints = 0;

  player.status.power = 5;
  player.status.vitality = 5;
  player.status.agility = 5;
  loseUnequippedItems();
}

function calcMaxHp() {
  return player.baseHp + player.status.vitality * 10;
}

function calcAttack() {
  const weaponAtk = player.weapon ? player.weapon.atk : 0;
  return player.status.power * 2 + weaponAtk;
}

function calcAttackCount() {
  const maxHits = Math.max(1, Math.floor(player.status.agility / 10) + 1);
  return Math.floor(Math.random() * maxHits) + 1;
}

function calcNextExp() {
  return Math.floor(20 * Math.pow(1.3, player.level - 1));
}

function gainExp(exp) {
  player.exp += exp;
  log(`✨ 経験値 ${exp} 獲得`);

  while (player.exp >= calcNextExp()) {
    player.exp -= calcNextExp();
    levelUp();
  }
}

function levelUp() {
  player.level++;
  player.unassignedPoints += 1; 
  player.hp = calcMaxHp();
  log(`🎉 レベルアップ！ Lv.${player.level}`);
  refresh();
}
function damagePlayer(amount) {
  player.hp -= amount;
  if (player.hp < 0) player.hp = 0;
  refresh();

  if (player.hp === 0) {
    gameOver();
    return;
  }
}
function getBaseStatus() {
  return {
    power: player.status.power,
    vitality: player.status.vitality,
    agility: player.status.agility
  };
}

function getEquipmentBonus() {
  if (!player.weapon) {
    return { power: 0, vitality: 0, agility: 0 };
  }
  return player.weapon.bonus;
}

