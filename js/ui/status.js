function openStatus() {
  if (gameState !== "EXPLORE") return;

  gameState = "STATUS";
  exploreButtons.style.display = "none";
  statusScreenEl.style.display = "block";
  renderStatus();
}

function closeStatus() {
  gameState = "EXPLORE";
  statusScreenEl.style.display = "none";
  exploreButtons.style.display = "block";
}

function renderStatus() {
  const base = getBaseStatus();
  const bonus = getEquipmentBonus();

  const nextExp = calcNextExp() - player.exp;
  const weaponName = player.weapon ? player.weapon.name : "なし";

  statusContentEl.innerHTML = `
    <div>Lv：${player.level}</div>
    <div>未割り振りポイント：${player.unassignedPoints}</div>
    <div>EXP：${player.exp} / ${calcNextExp()}</div>
    <div>次のLvまで：${nextExp}</div>
    <hr>

    <div class="status-row">
      ちから　　：${base.power}（+${bonus.power}）
      <button class="state-btn" onclick="addStat('power')">＋</button>
      <button class="state-btn" onclick="subStat('power')">−</button>
    </div>

    <div class="status-row">
      たいりょく：${base.vitality}（+${bonus.vitality}）
      <button class="state-btn" onclick="addStat('vitality')">＋</button>
      <button class="state-btn" onclick="subStat('vitality')">−</button>
    </div>

    <div class="status-row">
      すばやさ　：${base.agility}（+${bonus.agility}）
      <button class="state-btn" onclick="addStat('agility')">＋</button>
      <button class="state-btn" onclick="subStat('agility')">−</button>
    </div>

    <hr>
    <div>装備：${weaponName}</div>
  `;
}

function addStat(stat) {
  if (player.unassignedPoints <= 0) return;

  player.status[stat]++;
  player.unassignedPoints--;

  refresh();
  renderStatus();
}
function subStat(stat) {
  if (player.status[stat] <= player.baseStatus[stat]) return;

  player.status[stat]--;
  player.unassignedPoints++;

  refresh();
  renderStatus();
}



