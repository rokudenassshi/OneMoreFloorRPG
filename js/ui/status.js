const STAT_STEP_SMALL = 5;
const STAT_STEP_LARGE = 100;
let statStep = STAT_STEP_SMALL;
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
    ? `ステータスポイント：${player.statPoints}`
    : "";
  const statPointNote = isStatPointUnlocked
    ? ""
    : `<div class="status-note"></div>`;
  const statStepCost = statStep / STAT_STEP_SMALL;
  const powerBase = player.status.power;
  const vitalityBase = player.status.vitality;
  const agilityBase = player.status.agility;
  const powerBonusText = bonus.power ? `（+${bonus.power}）` : "";
  const vitalityBonusText = bonus.vitality ? `（+${bonus.vitality}）` : "";
  const agilityBonusText = bonus.agility ? `（+${bonus.agility}）` : "";
  const powerDecreaseDisabled =
    !isStatPointUnlocked || powerBase - statStep < 10;
  const vitalityDecreaseDisabled =
    !isStatPointUnlocked || vitalityBase - statStep < 10;
  const agilityDecreaseDisabled =
    !isStatPointUnlocked || agilityBase - statStep < 10;
  const addDisabled = !isStatPointUnlocked || player.statPoints < statStepCost;
  const nextExp = calcNextExp() - player.exp;
  const weaponName = player.weapon ? `${player.weapon.name}` : "なし";
  const accessoryName = player.accessory ? `${player.accessory.name}` : "なし";
  statusContentEl.innerHTML = `
    <div>記録：${player.maxReachedFloor}階</div>
    <div>Lv：${player.level}</div>    
    <div>スキルポイント：${player.unassignedPoints}</div>
    <div>${statPointLabel}</div>
    ${statPointNote}
    <div>EXP：${player.exp} / ${calcNextExp()}</div>
    <div>次のLvまで：${nextExp}</div>

        
    <div class="status-actions">
      <button class="status-action-button" onclick="openSkillAllocation()">スキル割り振りへ</button>
    </div>
    <hr>
  ${
    isStatPointUnlocked
      ? `<div class="status-actions">
            <button class="status-action-button" onclick="toggleStatStep()">
              増減単位：${statStep}
            </button>
          </div>`
      : ""
  }
<div class="status-row">
      ちから　　：${powerBase}${powerBonusText}
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
      たいりょく：${vitalityBase}${vitalityBonusText}
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
      すばやさ　：${agilityBase}${agilityBonusText}
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
  `;
}

function addStat(stat) {
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;

  const cost = statStep / STAT_STEP_SMALL;
  if (player.statPoints < cost) return;

  player.status[stat] += statStep * 5;
  player.statPoints -= cost;

  refresh();
  renderStatus();
}
function subStat(stat) {
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;

  if (player.status[stat] - statStep < 10) return;
  const refund = statStep / STAT_STEP_SMALL;
  player.status[stat] -= statStep * 5;
  player.statPoints += refund;
  refresh();
  renderStatus();
}

function toggleStatStep() {
  statStep = statStep === STAT_STEP_SMALL ? STAT_STEP_LARGE : STAT_STEP_SMALL;
  renderStatus();
}
