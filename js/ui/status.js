const statPointUnits = [1, 10, 100, 1000];
let statPointUnit = 1;
const statAutoAssignOptions = [
  { id: "power", label: "ちから" },
  { id: "vitality", label: "たいりょく" },
  { id: "agility", label: "すばやさ" },
];
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
  //ページ上部へスクロール
  window.scroll({
    top: 0,
  });
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
  const autoAssignTarget = player.autoAssignStatTarget || null;
  const nextExp = calcNextExp() - player.exp;
  const weaponName = player.weapon ? `${player.weapon.name}` : "なし";
  const weapon2Name = player.weapon2 ? `${player.weapon2.name}` : "なし";
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
    ${statPointNote}
          ${
            isStatPointUnlocked
              ? `<div class="status-point-toggle">
            <span class="status-point-label">自動割り振り：</span>
            <div class="status-point-buttons">
              ${statAutoAssignOptions
                .map(
                  (option) =>
                    `<button onclick="setStatAutoAssign('${option.id}')" ${
                      autoAssignTarget === option.id ? 'class="is-active"' : ""
                    }>${option.label}</button>`,
                )
                .join("")}
            </div>
          </div>`
              : ""
          }
    ${
      isStatPointUnlocked
        ? `<div class="status-point-toggle">
            <span class="status-point-label">割り振り単位：</span>
            <div class="status-point-buttons">
              ${statPointUnits
                .map(
                  (unit) =>
                    `<button onclick="setStatPointUnit(${unit})" ${
                      statPointUnit === unit ? 'class="is-active"' : ""
                    }>${unit}</button>`,
                )
                .join("")}
            </div>
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
    <div>装備1：${weaponName}</div>
    <div>装備2：${weapon2Name}</div>
    <div>装飾品：${accessoryName}</div>
  `;
}

function addStat(stat) {
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;
  if (player.statPoints <= 0) return;

  const pointsToUse = Math.min(statPointUnit, player.statPoints);
  if (pointsToUse <= 0) return;

  player.status[stat] += 5 * pointsToUse;
  player.statPoints -= pointsToUse;

  refresh();
  renderStatus();
}
function subStat(stat) {
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;
  const removablePoints = Math.floor((player.status[stat] - 10) / 5);
  const pointsToReturn = Math.min(statPointUnit, removablePoints);
  if (pointsToReturn <= 0) return;

  player.status[stat] -= 5 * pointsToReturn;
  player.statPoints += pointsToReturn;
  refresh();
  renderStatus();
}

function setStatPointUnit(unit) {
  if (!statPointUnits.includes(unit)) return;
  statPointUnit = unit;
  renderStatus();
}

function setStatAutoAssign(target) {
  const validTargets = statAutoAssignOptions.map((option) => option.id);
  const nextTarget = target === "none" ? "none" : target;
  if (nextTarget !== "none" && !validTargets.includes(nextTarget)) return;

  player.autoAssignStatTarget = nextTarget === "none" ? null : nextTarget;
  if (typeof autoAssignStatPoints === "function") {
    autoAssignStatPoints();
  }
  renderStatus();
}

function setStatAutoAssign(target) {
  const validTargets = statAutoAssignOptions.map((option) => option.id);
  if (!validTargets.includes(target)) return;

  player.autoAssignStatTarget =
    player.autoAssignStatTarget === target ? null : target;
  if (typeof autoAssignStatPoints === "function") {
    autoAssignStatPoints();
  }
  renderStatus();
}

function autoAssignStatPoints() {
  if (player.maxReachedFloor < UNLOCK_FLOOR) return 0;
  if (!player.statPoints || player.statPoints <= 0) return 0;
  const target = player.autoAssignStatTarget;
  if (!target) return 0;
  if (!["power", "vitality", "agility"].includes(target)) return 0;

  const pointsToUse = player.statPoints;
  player.status[target] += 5 * pointsToUse;
  player.statPoints = 0;

  if (typeof log === "function") {
    const label = statAutoAssignOptions.find(
      (option) => option.id === target,
    )?.label;
    log(
      `✨ ステータスポイントを${label || target}へ自動割り振り +${pointsToUse}`,
    );
  }

  refresh();
  return pointsToUse;
}
