const player = {
  level: 1,
  exp: 0,

  baseHp: 50,
  hp: 50,

  maxReachedFloor: 0,

  status: {
    power: 5,
    vitality: 5,
    agility: 5,
  },
  baseStatus: {
    power: 5,
    vitality: 5,
    agility: 5,
  },
  unassignedPoints: 0,
  weapon: null,
};

// function resetPlayer() {
//   player.level = 1;
//   player.exp = 0;
//   player.unassignedPoints = 0;
//   battleCount = 0;

//   player.status.power = 5;
//   player.status.vitality = 5;
//   player.status.agility = 5;
//   loseUnequippedItems();
//   grantHerbs(5);
// }

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

  // 1hitは常に保証、2hit以降の要求値を「段階的に増加」させる
  const base = 50; // 最初の増分（2hitに必要な追加量）
  const stepInc = 20; // 段階が1上がるごとに増分を+20

  let maxHits = 1;
  let required = 0;
  let delta = base;

  while (totalAgility >= required + delta) {
    required += delta;
    maxHits += 1;
    delta += stepInc; // 次の段階はさらに重くする
  }

  return Math.floor(Math.random() * maxHits) + 1;
}

// ちから：敵最大HP割合の追加ダメ（上限3%）
function calcPowerBonusDamage(enemyMaxHp) {
  const power = Number(player.status.power) || 0;
  const rate = Math.min(0.03, power * 0.0006); // power1あたり0.06%
  const bonus = Math.floor(enemyMaxHp * rate);
  return Math.max(1, bonus); // 体感のため最低1保証
}

// たいりょく：被ダメ割合軽減（上限25%）
function applyVitalityReduction(rawDamage) {
  const vit = Number(player.status.vitality) || 0;
  const reduceRate = Math.min(0.25, vit * 0.003); // vit1あたり0.3%
  return Math.max(1, Math.floor(rawDamage * (1 - reduceRate)));
}

// すばやさ：回避（上限20%）
function rollEvade() {
  const agi = Number(player.status.agility) || 0;
  const evadeRate = Math.min(0.2, agi * 0.0025); // agi1あたり0.25%
  return Math.random() < evadeRate;
}

function calcNextExp() {
  const lv = player.level;

  // 序盤〜中盤：指数（緩め）
  if (lv <= 30) {
    return Math.floor(20 * Math.pow(1.25, lv - 1));
  }

  // 中盤以降：線形 + 少しだけ指数
  const base = Math.floor(20 * Math.pow(1.25, 29)); // Lv30基準
  const extra = lv - 30;

  return Math.floor(
    base +
      extra * 120 + // 線形成長
      Math.pow(extra, 1.4) * 40 // 緩やかな曲線
  );
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
  // 回避
  if (rollEvade()) {
    log("💨 攻撃をかわした！");
    refresh();
    return;
  }

  // たいりょく軽減（装備参照なし）
  const reduced = applyVitalityReduction(amount);

  player.hp -= reduced;
  if (player.hp < 0) player.hp = 0;

  log(`ダメージ ${reduced}（軽減前 ${amount}）`);

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
    agility: player.status.agility,
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
