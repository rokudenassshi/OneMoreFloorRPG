const statPointUnits = [1, 100, 1000, 10000];
let statPointUnit = 1;
const statAutoAssignOptions = [
  { id: "power", label: "ちから" },
  { id: "vitality", label: "たいりょく" },
  { id: "agility", label: "すばやさ" },
];
let serialCodePending = false;
const SAVE_EXPORT_SCHEMA_V1 = "one-more-floor-rpg-save-v1";
const SAVE_EXPORT_SCHEMA_V2 = "one-more-floor-rpg-save-v2";
const SAVE_EXPORT_SECRET = "one-more-floor-rpg-save-secret-v1";
const SAVE_EXPORT_SALT = "omf-save-key-salt-v1";
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
    schema: SAVE_EXPORT_SCHEMA_V1,
    gameVersion: typeof GAME_VERSION === "string" ? GAME_VERSION : null,
    exportedAt: now.toISOString(),
    storage,
  };
}

function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function getSaveExportKey() {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SAVE_EXPORT_SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SAVE_EXPORT_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptSaveSnapshot(snapshot) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getSaveExportKey();
  const encoded = encoder.encode(JSON.stringify(snapshot));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return {
    schema: SAVE_EXPORT_SCHEMA_V2,
    gameVersion: snapshot.gameVersion || null,
    exportedAt: snapshot.exportedAt,
    alg: "AES-GCM",
    kdf: "PBKDF2",
    iv: uint8ToBase64(iv),
    data: uint8ToBase64(new Uint8Array(encrypted)),
  };
}

async function decryptSavePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("invalid payload");
  }
  if (payload.schema !== SAVE_EXPORT_SCHEMA_V2) {
    return payload;
  }
  const iv = base64ToUint8(String(payload.iv || ""));
  const data = base64ToUint8(String(payload.data || ""));
  const key = await getSaveExportKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

function downloadTextFile(filename, text, mime = "application/json") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
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

async function exportSaveData() {
  try {
    const snapshot = buildSaveDataSnapshot();
    const encrypted = await encryptSaveSnapshot(snapshot);
    const safeVersion = snapshot.gameVersion || "unknown";
    const dateLabel = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `OneMoreFloorRPG_save_${safeVersion}_${dateLabel}.json`;
    downloadTextFile(filename, JSON.stringify(encrypted));
    if (typeof log === "function") {
      log("🔐 セーブデータを保存しました");
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

function manualSave() {
  try {
    flushAutoSave();
    if (typeof log === "function") {
      log("💾 手動でセーブしました");
    }
  } catch (e) {
    if (typeof log === "function") {
      log("⚠️ 手動セーブに失敗しました");
    }
  }
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
  reader.onload = async () => {
    try {
      const text = String(reader.result || "");
      const normalized = text.replace(/^\uFEFF/, "").trim();
      const parsed = JSON.parse(normalized);
      const decrypted = await decryptSavePayload(parsed);

      const isKnownEncrypted = parsed?.schema === SAVE_EXPORT_SCHEMA_V2;
      if (!isKnownEncrypted && decrypted?.schema !== SAVE_EXPORT_SCHEMA_V1) {
        const proceed = window.confirm(
          "このファイルは想定形式と異なる可能性があります。続行しますか？",
        );
        if (!proceed) return;
      }

      // ★直接上書きせず「保留インポート」として保存
      localStorage.setItem("omf_pending_import_v1", JSON.stringify(decrypted));

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
  reader.readAsText(file, "utf-8");
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
  const serialActions =
    serialCodeActions && typeof serialCodeActions === "object"
      ? Object.values(serialCodeActions)
      : [];
  const unlockedSerialCount = serialActions.filter(
    (action) => typeof action?.isUnlocked === "function" && action.isUnlocked(),
  ).length;
  const totalSerialCodes = serialActions.length;
  const remainingSerialCodes = totalSerialCodes - unlockedSerialCount;
  const isSerialInputDisabled =
    totalSerialCodes > 0 && remainingSerialCodes <= 0;
  const statPointLabel = isStatPointUnlocked
    ? `ステータスポイント：${player.statPoints}`
    : "";
  const statPointNote = isStatPointUnlocked
    ? ""
    : `<div class="status-note"></div>`;
  const powerBase = player.status.power;
  const vitalityBase = player.status.vitality;
  const agilityBase = player.status.agility;
  const assignedStatPoints = ["power", "vitality", "agility"].reduce(
    (sum, stat) =>
      sum + Math.max(0, Math.floor((player.status[stat] - 10) / 5)),
    0,
  );
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
  const isGlowingAccessory =
    player.accessory &&
    Array.isArray(player.accessory.specialOptions) &&
    player.accessory.specialOptions.length >= 2;
  const accessoryName = player.accessory
    ? isGlowingAccessory
      ? `<span class="glowing-accessory">${player.accessory.name}</span>`
      : `${player.accessory.name}`
    : "なし";
  statusContentEl.innerHTML = `
    <div>記録：${player.maxReachedFloor}階</div>
    <div>最大ダメージ：${player.maxDamage || 0}</div>
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
            <div class="status-point-buttons">
              <button class="skill-reset-button" onclick="resetAllStats()" ${
                assignedStatPoints > 0 ? "" : "disabled"
              }>一括リセット</button>
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
    <button class="status-save-button" type="button" onclick="manualSave()">手動セーブ</button>
    <button class="status-save-button" type="button" onclick="openImportSaveDialog()">インポート</button>
    <button class="status-save-button" type="button" onclick="exportSaveData()">エクスポート</button>
  </div>
  <input
    id="saveDataFileInput"
    type="file"
    accept=".json,.omfsave,application/json"
    style="display:none"
    onchange="handleSaveDataImport(event)"
  >
  <div class="status-save-note">※インポートは現在のデータを上書きします</div>
  <div class="status-serial">
  <div class="status-serial-label">シリアルコード</div>
    <div class="status-serial-actions">
      <input
        id="serialCodeInput"
        class="status-serial-input"
        type="text"
        autocomplete="off"
        placeholder="シリアルコードを入力"
        onkeydown="handleSerialCodeKeydown(event)"
        ${isSerialInputDisabled || serialCodePending ? "disabled" : ""}
      >
      <button
        type="button"
        class="status-serial-button"
        onclick="handleSerialCodeSubmit()"
        ${isSerialInputDisabled || serialCodePending ? "disabled" : ""}
      >
        確認
      </button>
    </div>
</div>
`;
}

function handleSerialCodeKeydown(event) {
  if (event?.key !== "Enter") return;
  handleSerialCodeSubmit();
}

async function handleSerialCodeSubmit() {
  if (serialCodePending) return;
  const inputEl = document.getElementById("serialCodeInput");
  const value = String(inputEl?.value || "").trim();
  if (!value) return;
  const serialActions =
    serialCodeActions && typeof serialCodeActions === "object"
      ? serialCodeActions
      : {};
  const functionsInstance = window.firebaseFunctions;
  const httpsCallableFactory = window.firebaseHttpsCallable;
  if (!functionsInstance || typeof httpsCallableFactory !== "function") {
    if (typeof log === "function") {
      log("⚠️ シリアルコードの確認に失敗しました。");
    }
    return;
  }
  serialCodePending = true;
  renderStatus();
  try {
    const verifySerialCode = httpsCallableFactory(
      functionsInstance,
      "verifySerialCode",
    );
    const response = await verifySerialCode({ code: value });
    const payload = response?.data || {};
    const unlockKey = String(payload.unlock || "");
    const matchedAction = serialActions[unlockKey];
    if (!payload.ok || !matchedAction || matchedAction.isUnlocked()) {
      if (typeof log === "function") {
        log("⚠️ シリアルコードが無効です。");
      }
      return;
    }
    matchedAction.unlock();
    if (inputEl) inputEl.value = "";
    if (typeof log === "function") {
      log(matchedAction.logMessage || "✨ シリアルコードを確認しました。");
    }
    autoSave();
  } catch (error) {
    if (typeof log === "function") {
      log("⚠️ シリアルコードの確認に失敗しました。");
    }
  } finally {
    serialCodePending = false;
    renderStatus();
  }
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
function resetAllStats() {
  if (player.maxReachedFloor < UNLOCK_FLOOR) return;
  const assignedPoints = ["power", "vitality", "agility"].reduce(
    (sum, stat) =>
      sum + Math.max(0, Math.floor((player.status[stat] - 10) / 5)),
    0,
  );
  if (assignedPoints <= 0) return;
  const shouldReset = confirm(
    "割り振ったステータスポイントをすべてリセットします。よろしいですか？",
  );
  if (!shouldReset) return;

  player.status.power = 10;
  player.status.vitality = 10;
  player.status.agility = 10;
  player.statPoints += assignedPoints;

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
