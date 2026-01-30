const statPointUnits = [1, 10, 100, 1000];
let statPointUnit = 1;
const statAutoAssignOptions = [
  { id: "power", label: "ちから" },
  { id: "vitality", label: "たいりょく" },
  { id: "agility", label: "すばやさ" },
];
// =====================
// Save Data Import / Export
// =====================

/**
 * localStorage からゲームのセーブデータ一式をスナップショットします。
 * 同一ドメイン上にゲーム以外の localStorage がほぼ無い前提で、全キーを対象にします。
 */
function buildSaveDataSnapshot() {
  const now = new Date();
  const storage = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      storage[k] = localStorage.getItem(k);
    }
  } catch (e) {
    // 取得に失敗した場合でも、最低限メタだけ返す
  }

  return {
    schema: "one-more-floor-rpg-save-v1",
    gameVersion: typeof GAME_VERSION === "string" ? GAME_VERSION : null,
    exportedAt: now.toISOString(),
    storage,
  };
}

function downloadTextFile(filename, text, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // iOS Safari でも落ちにくいよう、少し遅らせて解放
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportSaveData() {
  try {
    const snapshot = buildSaveDataSnapshot();
    const safeVersion = snapshot.gameVersion || "unknown";
    const dateLabel = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `OneMoreFloorRPG_save_${safeVersion}_${dateLabel}.json`;
    downloadTextFile(filename, JSON.stringify(snapshot, null, 2));
    if (typeof log === "function") {
      log("💾 セーブデータを書き出しました（ファイルに保存）");
    }
  } catch (e) {
    if (typeof log === "function") {
      log("⚠️ エクスポートに失敗しました");
    }
  }
}

function openImportSaveDialog() {
  const input = document.getElementById("saveDataFileInput");
  if (!input) {
    if (typeof log === "function") log("⚠️ インポート用入力が見つかりません");
    return;
  }
  // 同じファイルを連続で選ぶ場合に備えてリセット
  input.value = "";
  input.click();
}

function applySaveSnapshotToLocalStorage(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("invalid snapshot");
  }

  const storage = snapshot.storage;
  if (!storage || typeof storage !== "object") {
    throw new Error("missing storage");
  }

  // いったん全消し → インポートデータを反映
  // （キーが残ると整合性が崩れやすいため）
  localStorage.clear();
  for (const [k, v] of Object.entries(storage)) {
    if (typeof k !== "string") continue;
    localStorage.setItem(k, v == null ? "" : String(v));
  }
}

function stopAutoSaveForImport() {
  // インポート直後に「古いメモリ上の状態」がオートセーブで上書きされるのを防ぐ
  try {
    if (typeof pendingAutoSaveTimer !== "undefined" && pendingAutoSaveTimer) {
      clearTimeout(pendingAutoSaveTimer);
      pendingAutoSaveTimer = null;
    }
  } catch (e) {}
  try {
    if (
      typeof pendingInventorySaveTimer !== "undefined" &&
      pendingInventorySaveTimer
    ) {
      clearTimeout(pendingInventorySaveTimer);
      pendingInventorySaveTimer = null;
    }
  } catch (e) {}
  try {
    if (typeof isLoadingSave !== "undefined") {
      isLoadingSave = true;
    }
  } catch (e) {}
  try {
    if (typeof inventoryDirty !== "undefined") {
      inventoryDirty = false;
    }
  } catch (e) {}
}

function handleSaveDataImport(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const ok = window.confirm(
    "この端末の現在のセーブデータを上書きします。よろしいですか？",
  );
  if (!ok) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const parsed = JSON.parse(text);

      if (parsed?.schema !== "one-more-floor-rpg-save-v1") {
        const proceed = window.confirm(
          "このファイルは想定形式と異なる可能性があります。続行しますか？",
        );
        if (!proceed) return;
      }

      // ★直接上書きせず「保留インポート」として保存
      localStorage.setItem("omf_pending_import_v1", JSON.stringify(parsed));

      if (typeof log === "function") {
        log("📥 セーブデータを読み込みました。再起動して反映します…");
      }
      window.location.reload();
    } catch (e) {
      if (typeof log === "function") {
        log("⚠️ インポートに失敗しました（ファイル形式を確認してください）");
      }
    }
  };
  reader.onerror = () => {
    if (typeof log === "function") {
      log("⚠️ ファイル読み込みに失敗しました");
    }
  };
  reader.readAsText(file);
}

function openStatus() {
  if (gameState !== "EXPLORE") return;

  gameState = "STATUS";
  exploreButtons.style.display = "none";
  statusScreenEl.style.display = "block";
  document.body.classList.add("screen-scrollable");
  if (statusVersionEl) {
    statusVersionEl.textContent = `v${GAME_VERSION}`;
  }
  renderStatus();
}

function closeStatus() {
  gameState = "EXPLORE";
  statusScreenEl.style.display = "none";
  exploreButtons.style.display = "block";
  document.body.classList.remove("screen-scrollable");
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
  <hr>
<div class="status-save">
  <div class="status-save-label">セーブデータ</div>
  <div class="status-save-actions">
    <button class="status-save-button" type="button" onclick="openImportSaveDialog()">インポート</button>
    <button class="status-save-button" type="button" onclick="exportSaveData()">エクスポート</button>
  </div>
  <input
    id="saveDataFileInput"
    type="file"
    accept="application/json"
    style="display:none"
    onchange="handleSaveDataImport(event)"
  >
  <div class="status-save-note">※インポートは現在のデータを上書きします</div>
</div>
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
