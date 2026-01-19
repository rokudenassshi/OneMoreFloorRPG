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
    ? `未割り振りステータスポイント：${player.statPoints}`
    : "未割り振りステータスポイント：0";
  const statPointNote = isStatPointUnlocked
    ? ""
    : `<div class="status-note">${unlockFloor}階層突破で開放</div>`;
  const powerTotal = player.status.power + bonus.power;
  const vitalityTotal = player.status.vitality + bonus.vitality;
  const agilityTotal = player.status.agility + bonus.agility;
  const powerBonusText = bonus.power ? ` (+${bonus.power})` : "";
  const vitalityBonusText = bonus.vitality ? ` (+${bonus.vitality})` : "";
  const agilityBonusText = bonus.agility ? ` (+${bonus.agility})` : "";
  const powerDecreaseDisabled =
    !isStatPointUnlocked || player.status.power <= player.baseStatus.power;
  const vitalityDecreaseDisabled =
    !isStatPointUnlocked ||
    player.status.vitality <= player.baseStatus.vitality;
  const agilityDecreaseDisabled =
    !isStatPointUnlocked || player.status.agility <= player.baseStatus.agility;
  const addDisabled = !isStatPointUnlocked || player.statPoints <= 0;
  const nextExp = calcNextExp() - player.exp;
  const weaponName = player.weapon ? `${player.weapon.name}` : "なし";
  const accessoryName = player.accessory ? `${player.accessory.name}` : "なし";
  statusContentEl.innerHTML = `
    <div>記録：${player.maxReachedFloor}階</div>
    <div>Lv：${player.level}</div>    
    <div>${statPointLabel}</div>
    ${statPointNote}
    <div>未使用スキルポイント：${player.unassignedPoints}</div>
    <div>EXP：${player.exp} / ${calcNextExp()}</div>
    <div>次のLvまで：${nextExp}</div>
    <hr>

<div class="status-row">
      ちから　　：${powerTotal}${powerBonusText}
      ${
        isStatPointUnlocked
          ? `<span class="status-controls">
              <button onclick="subStat('power')" ${
                powerDecreaseDisabled ? "disabled" : ""
              }>-</button>
              <button onclick="addStat('power')" ${
                addDisabled ? "disabled" : ""
              }>+</button>
            </span>`
          : ""
      }
    </div>

    <div class="status-row">
      たいりょく：${vitalityTotal}${vitalityBonusText}
      ${
        isStatPointUnlocked
          ? `<span class="status-controls">
              <button onclick="subStat('vitality')" ${
                vitalityDecreaseDisabled ? "disabled" : ""
              }>-</button>
              <button onclick="addStat('vitality')" ${
                addDisabled ? "disabled" : ""
              }>+</button>
            </span>`
          : ""
      }
    </div>

    <div class="status-row">
      すばやさ　：${agilityTotal}${agilityBonusText}
      ${
        isStatPointUnlocked
          ? `<span class="status-controls">
              <button onclick="subStat('agility')" ${
                agilityDecreaseDisabled ? "disabled" : ""
              }>-</button>
              <button onclick="addStat('agility')" ${
                addDisabled ? "disabled" : ""
              }>+</button>
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

  player.status[stat]++;
  // player.unassignedPoints--;
  player.statPoints--;

  refresh();
  renderStatus();
}
function subStat(stat) {
  if (player.status[stat] <= player.baseStatus[stat]) return;
  if (player.maxReachedFloor < UNLOCK_FLOO) return;
  player.status[stat]--;
  // player.unassignedPoints++;
  player.statPoints++;

  refresh();
  renderStatus();
}
