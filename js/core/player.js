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
  grantHerbs(5);
}

function calcMaxHp() {
  const bonus = getEquipmentBonus();
  const totalVitality = player.status.vitality + bonus.vitality;
  return player.baseHp + totalVitality * 10;
}

function calcAttack() {
  const weaponAtk = player.weapon ? player.weapon.atk : 0;
  const bonus = getEquipmentBonus();
  return (player.status.power + bonus.power) * 2 + weaponAtk;
}

function calcAttackCount() {
  const bonus = getEquipmentBonus();
  const totalAgility = Number(player.status.agility) + bonus.agility;
  // 10以下:1回, 20以下:2回, 30以下:3回...
  const maxHits = Math.max(1, Math.ceil(totalAgility / 10));

  // 1〜maxHits のランダム
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

  const normalizeBonus = (bonus) => ({
    power: Number(bonus?.power) || 0,
    vitality: Number(bonus?.vitality) || 0,
    agility: Number(bonus?.agility) || 0,
  });

  if (player.weapon.bonus) {
    return normalizeBonus(player.weapon.bonus);
  }

  const baseBonus = normalizeBonus(player.weapon.baseBonus);
  const optionBonus = normalizeBonus(player.weapon.optionBonus);

  return {
    power: baseBonus.power + optionBonus.power,
    vitality: baseBonus.vitality + optionBonus.vitality,
    agility: baseBonus.agility + optionBonus.agility,
  };
}


