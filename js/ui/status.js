function openStatus() {
  if (gameState !== "EXPLORE") return;

  gameState = "STATUS";
  exploreButtons.style.display = "none";
  statusScreenEl.style.display = "block";
  if (statusVersionEl) {
    statusVersionEl.textContent = `v${GAME_VERSION}`;
  }
  renderStatus();
}

function closeStatus() {
  gameState = "EXPLORE";
  statusScreenEl.style.display = "none";
  exploreButtons.style.display = "block";
}

function renderStatus() {
  const bonus = getEquipmentBonus();

  const nextExp = calcNextExp() - player.exp;
  const weaponName = player.weapon ? `${player.weapon.name}` : "なし";
  const accessoryName = player.accessory ? `${player.accessory.name}` : "なし";
  statusContentEl.innerHTML = `
    <div>記録：${player.maxReachedFloor}階</div>
    <div>Lv：${player.level}</div>
    <div>未割り振りポイント：${player.unassignedPoints}</div>
    <div>EXP：${player.exp} / ${calcNextExp()}</div>
    <div>次のLvまで：${nextExp}</div>
    <hr>

    <div class="status-row">
      ちから　　：${bonus.power}
    </div>

    <div class="status-row">
      たいりょく：${bonus.vitality}
    </div>

    <div class="status-row">
      すばやさ　：${bonus.agility}
    </div>

    <hr>
    <div>装備：${weaponName}</div>
    <div>装飾品：${accessoryName}</div>
    <div class="status-actions">
      <button class="status-action-button" onclick="openSkillAllocation()">スキル割り振りへ</button>
    </div>
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
