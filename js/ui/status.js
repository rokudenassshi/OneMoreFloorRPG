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
  const unlockFloor = UNLOCK_FLOOR;
  const isStatPointUnlocked = player.maxReachedFloor >= unlockFloor;
  const statPointLabel = isStatPointUnlocked
    ? `未使用ステータスポイント：${player.statPoints}`
    : "";
  const statPointNote = isStatPointUnlocked
    ? ""
    : `<div class="status-note"></div>`;
  const powerBase = player.status.power;
  const vitalityBase = player.status.vitality;
  const agilityBase = player.status.agility;
  const powerBonusText = bonus.power ? `（+${bonus.power}）` : "";
  const vitalityBonusText = bonus.vitality ? `（+${bonus.vitality}）` : "";
  const agilityBonusText = bonus.agility ? `（+${bonus.agility}）` : "";
  const powerDecreaseDisabled = !isStatPointUnlocked;
  const vitalityDecreaseDisabled = !isStatPointUnlocked;
  const agilityDecreaseDisabled = !isStatPointUnlocked;
  const addDisabled = !isStatPointUnlocked || player.statPoints <= 0;
  const nextExp = calcNextExp() - player.exp;
  const weaponName = player.weapon ? `${player.weapon.name}` : "なし";
  const accessoryName = player.accessory ? `${player.accessory.name}` : "なし";
  statusContentEl.innerHTML = `
    <div>記録：${player.maxReachedFloor}階</div>
    <div>Lv：${player.level}</div>    
    <div>未使用スキルポイント：${player.unassignedPoints}</div>
    <div>${statPointLabel}</div>
    ${statPointNote}
    <div>EXP：${player.exp} / ${calcNextExp()}</div>
    <div>次のLvまで：${nextExp}</div>
    <hr>

<div class="status-row">
      ちから　　：${powerBase}${powerBonusText}
      ${
        isStatPointUnlocked
          ? `<span class="status-controls">
              <button onclick="addStat('power')" ${
                addDisabled ? "disabled" : ""
              }>+</button>
              <button onclick="subStat('power')" ${
                powerDecreaseDisabled ? "disabled" : ""
              }>-</button>
            </span>`
          : ""
      }
    </div>

    <div class="status-row">
      たいりょく：${vitalityBase}${vitalityBonusText}
      ${
        isStatPointUnlocked
          ? `<span class="status-controls">
              <button onclick="addStat('vitality')" ${
                addDisabled ? "disabled" : ""
              }>+</button>
              <button onclick="subStat('vitality')" ${
                vitalityDecreaseDisabled ? "disabled" : ""
              }>-</button>
            </span>`
          : ""
      }
    </div>

    <div class="status-row">
      すばやさ　：${agilityBase}${agilityBonusText}
      ${
        isStatPointUnlocked
          ? `<span class="status-controls">
              <button onclick="addStat('agility')" ${
                addDisabled ? "disabled" : ""
              }>+</button>
              <button onclick="subStat('agility')" ${
                agilityDecreaseDisabled ? "disabled" : ""
              }>-</button>
            </span>`
          : ""
      }
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
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;
  if (player.statPoints <= 0) return;

  player.status[stat] += 5;
  player.statPoints--;

  refresh();
  renderStatus();
}
function subStat(stat) {
  if (player.status[stat] <= 10) return;
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;
  player.status[stat] -= 5;
  player.statPoints++;

  refresh();
  renderStatus();
}
