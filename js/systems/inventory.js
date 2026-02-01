// js/systems/inventory.js

/* =====================
   インベントリ（所持品）
===================== */
const inventory = [];
const inventoryMutationMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];
inventoryMutationMethods.forEach((method) => {
  const original = inventory[method];
  if (typeof original !== "function") return;
  inventory[method] = function (...args) {
    if (typeof markInventoryDirty === "function") {
      markInventoryDirty();
    }
    return original.apply(this, args);
  };
});
const HERB_ITEM_TEMPLATE = {
  id: "consumable_herb",
  name: "やくそう",
  kind: "consumable",
  effect: "heal",
  healRatio: 0.5,
  description: "最大HPの50%回復",
};

const HERB_BASE_MAX = 10;

const discardThresholdsKey = "roguelike_discard_thresholds";
const discardThresholdDefaults = {
  value: 0,
  accessoryShinyOnly: false,
  accessoryNone: false,
};
let discardThresholds = { ...discardThresholdDefaults };
let currentInventoryTab = "equipment";
let inventorySortEnabled = false;

// ユニーク武器
const WEATHERED_KILL_THRESHOLD = 100;
const CURSED_KILL_STEP = 10;

function isWeatheredItem(item) {
  return Boolean(item?.isWeathered);
}

function isCursedItem(item) {
  return Boolean(item?.isCursed);
}
function isUniqueWeapon(item) {
  return Boolean(item?.isUniqueWeapon);
}
function isDualWieldRestrictedItem(item) {
  return isUniqueWeapon(item) || isWeatheredItem(item) || isCursedItem(item);
}

function enforceRestrictedSingleWeapon() {
  const weaponRestricted = isDualWieldRestrictedItem(player.weapon);
  const weapon2Restricted = isDualWieldRestrictedItem(player.weapon2);
  if (!weaponRestricted && !weapon2Restricted) return;
  if (weaponRestricted && player.weapon2) {
    player.weapon2 = null;
    log("⚠️ ユニーク武器は二刀流と併用できない。");
    return;
  }
  if (weapon2Restricted && player.weapon) {
    player.weapon = null;
    log("⚠️ ユニーク武器は二刀流と併用できない。");
  }
}

function getCursedStatLabel(stat) {
  switch (stat) {
    case "power":
      return "ちから";
    case "vitality":
      return "たいりょく";
    case "agility":
      return "すばやさ";
    default:
      return "";
  }
}

function transformToCursedItem(item) {
  const originalName = item.name;
  item.isWeathered = false;
  item.isCursed = true;
  item.name = item.cursedName;
  showEventPopup(
    `${originalName}が${item.cursedName}に禍々しく変化した。\n\n` +
      `モット血ヲヨコセ。\n` +
      `ツヨイ血ヲモットダ。\n` +
      `オマエガ倒シタ数ダケ、\n` +
      `我ハチカラヲ得ル。`,
  );
}

function incrementCursedItemStat(item) {
  const stats = ["power", "vitality", "agility"];
  const targetStat =
    item.cursedStat === "random"
      ? stats[Math.floor(Math.random() * stats.length)]
      : item.cursedStat;
  if (!stats.includes(targetStat)) return;
  item.baseBonus = {
    power: Number(item.baseBonus?.power) || 0,
    vitality: Number(item.baseBonus?.vitality) || 0,
    agility: Number(item.baseBonus?.agility) || 0,
  };
  item.baseBonus[targetStat] += 1;
  log(`🔮 ${item.name}の${getCursedStatLabel(targetStat)}が1上がった。`);
}

function handleWeatheredWeaponProgress({ defeatedRareEnemy = false } = {}) {
  const equippedItems = [player.weapon, player.weapon2];
  let didUpdate = false;
  const progressIncrement = defeatedRareEnemy ? 2 : 1;
  equippedItems.forEach((item) => {
    if (!item) return;
    if (isWeatheredItem(item)) {
      item.killCount = (item.killCount || 0) + progressIncrement;
      didUpdate = true;
      if (item.killCount >= WEATHERED_KILL_THRESHOLD) {
        transformToCursedItem(item);
        didUpdate = true;
      }
      return;
    }
    if (isCursedItem(item) && floor >= UNLOCK_FLOOR) {
      const previousCount = item.cursedKillCount || 0;
      item.cursedKillCount = previousCount + 1;
      didUpdate = true;
      if (
        Math.floor(previousCount / CURSED_KILL_STEP) <
        Math.floor(item.cursedKillCount / CURSED_KILL_STEP)
      ) {
        incrementCursedItemStat(item);
        didUpdate = true;
      }
    }
  });
  if (didUpdate && typeof markInventoryDirty === "function") {
    markInventoryDirty();
  }
}
function handleCursedAccessoryProgress({ defeatedRareEnemy = false } = {}) {
  if (!defeatedRareEnemy) return;
  const equippedItems = [player.weapon, player.weapon2];
  let didUpdate = false;
  equippedItems.forEach((item) => {
    if (!item) return;
    if (!isCursedItem(item)) return;
    incrementCursedItemStat(item);
    didUpdate = true;
  });
  if (didUpdate && typeof markInventoryDirty === "function") {
    markInventoryDirty();
  }
}
function toggleInventorySort() {
  inventorySortEnabled = !inventorySortEnabled;
  log(inventorySortEnabled ? "📊 能力値でソート" : "📊 入手順でソート");
  renderInventory();
}
function grantHerbs(count, shouldLog = true) {
  const maxHerbCount = getHerbMaxCount();
  const currentCount = getHerbCount();
  const canAdd = Math.max(0, maxHerbCount - currentCount);
  const actualCount = Math.min(count, canAdd);
  for (let i = 0; i < actualCount; i++) {
    const herb = { ...HERB_ITEM_TEMPLATE };
    inventory.push(herb);
  }
}

function setHerbCount(count, shouldLog = true) {
  const cappedCount = Math.min(count, getHerbMaxCount());
  const herbCount = inventory.filter(
    (item) => item && item.id === HERB_ITEM_TEMPLATE.id,
  ).length;
  const needed = cappedCount - herbCount;
  if (needed > 0) {
    grantHerbs(needed, shouldLog);
    return;
  }
  if (needed < 0) {
    let toRemove = Math.abs(needed);
    for (let i = inventory.length - 1; i >= 0 && toRemove > 0; i -= 1) {
      if (inventory[i] && inventory[i].id === HERB_ITEM_TEMPLATE.id) {
        inventory.splice(i, 1);
        toRemove -= 1;
      }
    }
  }
}
function getHerbCount() {
  return inventory.filter((item) => item && item.id === HERB_ITEM_TEMPLATE.id)
    .length;
}

function getHerbMaxCount() {
  const skillEffects = getSkillEffects();
  const capacityBoost = Math.max(0, skillEffects.herbCapacityBoost || 0);
  return HERB_BASE_MAX + Math.floor(capacityBoost);
}
/* =====================
   インベントリ画面
===================== */
function openInventory() {
  if (gameState !== "EXPLORE" && gameState !== "BATTLE") return;
  inventoryReturnState = gameState;
  gameState = "INVENTORY";
  inventoryEl.style.display = "block";
  discardWeakScreenEl.style.display = "none";
  exploreButtons.style.display = "none";
  battleButtons.style.display = "none";
  document.body.classList.add("screen-scrollable");

  updateInventoryTabs();
  renderInventory();
}

function closeInventory() {
  gameState = inventoryReturnState;
  inventoryEl.style.display = "none";
  discardWeakScreenEl.style.display = "none";
  exploreButtons.style.display = gameState === "EXPLORE" ? "block" : "none";
  battleButtons.style.display = gameState === "BATTLE" ? "block" : "none";
  document.body.classList.remove("screen-scrollable");

  //ページ上部へスクロール
  window.scroll({
    top: 0,
  });
  refresh();
}

function openDiscardWeakScreen() {
  if (gameState !== "INVENTORY") return;
  loadDiscardThresholds();
  syncDiscardThresholdInputs();
  inventoryEl.style.display = "none";
  discardWeakScreenEl.style.display = "block";
}

function closeDiscardWeakScreen() {
  storeDiscardThresholdInputs();
  discardWeakScreenEl.style.display = "none";
  inventoryEl.style.display = "block";
  renderInventory();
}
function setInventoryTab(tab) {
  currentInventoryTab = tab;
  updateInventoryTabs();
  renderInventory();
}
function updateInventoryTabs() {
  inventoryTabButtons.forEach((button) => {
    const isActive = button.dataset.tab === currentInventoryTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}
/* =====================
   インベントリ描画（装備中は[E]を表示）
   - 攻撃は表示しない
   - 固有(baseBonus) と ランダム(optionBonus) を分けて表示
===================== */
function renderInventory() {
  itemListEl.innerHTML = "";

  if (inventory.length === 0) {
    itemListEl.textContent = "アイテムなし";
    return;
  }

  if (currentInventoryTab === "accessory") {
    renderAccessoryItems();
    return;
  }

  renderEquipmentItems();
}
function collectConsumableGroups() {
  const consumableGroups = [];
  const consumableMap = new Map();

  inventory.forEach((item, index) => {
    if (item.kind !== "consumable") return;
    const key = item.id || `${item.name}:${item.effect || ""}`;
    if (!consumableMap.has(key)) {
      const group = {
        item,
        indices: [index],
      };
      consumableMap.set(key, group);
      consumableGroups.push(group);
      return;
    }
    consumableMap.get(key).indices.push(index);
  });

  return consumableGroups;
}

function appendConsumableGroups(consumableGroups) {
  consumableGroups.forEach((group) => {
    const { item, indices } = group;
    const div = document.createElement("div");
    const description = item.description || "";
    const countLabel = indices.length > 1 ? ` ×${indices.length}` : "";
    div.innerHTML = `
      <div>${item.name}${countLabel}</div>
      ${
        description
          ? `<div style="margin-top:4px; font-size:12px; opacity:0.9;">${description}</div>`
          : ""
      }
      <hr>
    `;
    itemListEl.appendChild(div);
  });
}

function renderEquipmentItems() {
  const consumableGroups = collectConsumableGroups();
  const herbGroups = consumableGroups.filter(
    (group) => group.item?.id === HERB_ITEM_TEMPLATE.id,
  );
  const otherConsumableGroups = consumableGroups.filter(
    (group) => group.item?.id !== HERB_ITEM_TEMPLATE.id,
  );
  const equipmentItems = [];
  inventory.forEach((item, index) => {
    if (item.kind === "consumable") {
      return;
    }
    const isAccessory = item.kind === "accessory";
    if (isAccessory) {
      return;
    }
    const isEquipped =
      player.weapon === item ||
      player.weapon2 === item ||
      player.accessory === item;
    equipmentItems.push({ item, index, isAccessory, isEquipped });
  });

  if (equipmentItems.length === 0 && consumableGroups.length === 0) {
    itemListEl.textContent = "アイテムなし";
    return;
  }
  const sortEquipment = (a, b) => {
    if (inventorySortEnabled) {
      const scoreDiff = getItemScore(b.item) - getItemScore(a.item);
      if (scoreDiff !== 0) return scoreDiff;
    }
    return a.index - b.index;
  };
  equipmentItems.sort(sortEquipment);
  const hasDualWieldSkill =
    typeof getSkillLevel === "function" && getSkillLevel("dual_wield") > 0;
  const canUseDualWield =
    hasDualWieldSkill && !isDualWieldRestrictedItem(player.weapon);
  const renderEquipmentEntries = (entries) => {
    entries.forEach(({ item, index, isAccessory, isEquipped }) => {
      const isLocked = !!item.isLocked;
      const lockMark = isLocked ? "🔒" : "";
      const specialOptions = Array.isArray(item.specialOptions)
        ? item.specialOptions
        : [];
      const specialLines = specialOptions
        .map((option) => option.description || option.name)
        .filter(Boolean);

      const totalBonus = getItemTotalBonus(item);
      const totalParts = [];
      if (totalBonus.power) totalParts.push(`ちから+${totalBonus.power}`);
      if (totalBonus.vitality)
        totalParts.push(`たいりょく+${totalBonus.vitality}`);
      if (totalBonus.agility) totalParts.push(`すばやさ+${totalBonus.agility}`);
      if (isAccessory && specialLines.length) {
        totalParts.push(...specialLines);
      }

      const equippedLabel =
        player.weapon2 === item
          ? "🟢[E2] "
          : player.weapon === item
            ? "🟢[E1] "
            : player.accessory === item
              ? "🟢[E] "
              : "";
      const div = document.createElement("div");

      const equipButtons = isEquipped
        ? ""
        : canUseDualWield && !isDualWieldRestrictedItem(item)
          ? `<button onclick="equip(${index}, 'primary')">装備1</button>
           <button onclick="equip(${index}, 'secondary')">装備2</button>`
          : `<button onclick="equip(${index})">装備</button>`;
      div.innerHTML = `
      <div>
        ${equippedLabel}
        ${lockMark}${item.name}
      </div>

      <div style="margin-top:4px;">
        <div style="font-size:12px; opacity:0.9;">能力値</div>
        <div>${totalParts.length ? totalParts.join(" / ") : "なし"}</div>
      </div>
      <div style="margin-top:6px; display:flex; gap:10px; flex-wrap:wrap;">     
            ${
              isEquipped || isUniqueWeapon(item)
                ? ""
                : `<button onclick="toggleItemLock(${index})">${
                    isLocked ? "解除" : "ロック"
                  }</button>`
            }
${equipButtons}
                    ${
                      isEquipped || isUniqueWeapon(item)
                        ? ""
                        : isLocked
                          ? `<button disabled title="ロック中は捨てられません">捨てる</button>`
                          : `<button onclick="discardEquipment(${index})">捨てる</button>`
                    }
      </div>
      <hr>
    `;

      itemListEl.appendChild(div);
    });
  };

  if (herbGroups.length > 0) {
    appendConsumableGroups(herbGroups);
  }
  renderEquipmentEntries(equipmentItems.filter((entry) => entry.isEquipped));
  if (otherConsumableGroups.length > 0) {
    appendConsumableGroups(otherConsumableGroups);
  }

  renderEquipmentEntries(equipmentItems.filter((entry) => !entry.isEquipped));
}

function renderAccessoryItems() {
  const accessoryItems = [];

  inventory.forEach((item, index) => {
    if (item.kind !== "accessory") {
      return;
    }
    const isEquipped =
      player.weapon === item ||
      player.weapon2 === item ||
      player.accessory === item;
    accessoryItems.push({ item, index, isAccessory: true, isEquipped });
  });

  if (accessoryItems.length === 0) {
    itemListEl.textContent = "アイテムなし";
    return;
  }
  function getAccessoryPrimaryOption(item) {
    // 基本：先頭の特殊効果を基準にする（今の設計に合う）
    return item?.specialOptions?.[0] || null;
  }

  function getAccessorySortKey(item) {
    const opt = getAccessoryPrimaryOption(item);
    const id = opt?.id;
    const map = window.SpecialOptionSortKeyMap || {};
    return Number(map[id]) || 9999; // 未登録は最後へ
  }

  function getAccessoryAbilityValue(item) {
    const opt = getAccessoryPrimaryOption(item);
    // ここが「能力」：specialOption.value を優先
    // value が無い形式でも壊れないように保険を掛ける
    if (Number.isFinite(Number(opt?.value))) return Number(opt.value);
    if (Number.isFinite(Number(opt?.fixed))) return Number(opt.fixed);
    // それでも無ければ 0
    return 0;
  }

  function isDoubleEffectAccessory(item) {
    return (
      Array.isArray(item?.specialOptions) && item.specialOptions.length >= 2
    );
  }
  accessoryItems.sort((a, b) => {
    if (a.isEquipped !== b.isEquipped) {
      return a.isEquipped ? -1 : 1;
    }
    if (inventorySortEnabled) {
      // 0) 効果が二つのアクセサリーを最優先
      const doubleA = isDoubleEffectAccessory(a.item);
      const doubleB = isDoubleEffectAccessory(b.item);
      if (doubleA !== doubleB) return doubleA ? -1 : 1;

      // 1) sortKey 昇順
      const skA = getAccessorySortKey(a.item);
      const skB = getAccessorySortKey(b.item);
      if (skA !== skB) return skA - skB;

      // 2) 能力（value）降順
      const vA = getAccessoryAbilityValue(a.item);
      const vB = getAccessoryAbilityValue(b.item);
      if (vA !== vB) return vB - vA;
    }
    // 3) 最後に安定化（元の並び）
    return a.index - b.index;
  });

  accessoryItems.forEach(({ item, index, isAccessory, isEquipped }) => {
    const isLocked = !!item.isLocked;
    const lockMark = isLocked ? "🔒" : "";
    const isGlowingAccessory =
      Array.isArray(item.specialOptions) && item.specialOptions.length >= 2;
    const specialOptions = Array.isArray(item.specialOptions)
      ? item.specialOptions
      : [];
    const specialLines = specialOptions
      .map((option) => option.description || option.name)
      .filter(Boolean);

    const totalBonus = getItemTotalBonus(item);
    const totalParts = [];
    if (totalBonus.power) totalParts.push(`ちから+${totalBonus.power}`);
    if (totalBonus.vitality)
      totalParts.push(`たいりょく+${totalBonus.vitality}`);
    if (totalBonus.agility) totalParts.push(`すばやさ+${totalBonus.agility}`);
    if (isAccessory && specialLines.length) {
      totalParts.push(...specialLines);
    }
    const div = document.createElement("div");

    div.innerHTML = `
      <div>
        ${isEquipped ? "🟢[E] " : ""}
        ${lockMark}<span class="${
          isGlowingAccessory ? "glowing-accessory" : ""
        }">${item.name}</span>
      </div>

      <div style="margin-top:4px;">
        <div style="font-size:12px; opacity:0.9;">能力値</div>
        <div>${totalParts.length ? totalParts.join(" / ") : "なし"}</div>
      </div>
      <div style="margin-top:6px; display:flex; gap:10px; flex-wrap:wrap;">
        ${
          isEquipped || isUniqueWeapon(item)
            ? ""
            : `<button onclick="toggleItemLock(${index})">${
                isLocked ? "解除" : "ロック"
              }</button>`
        }
${isEquipped ? "" : `<button onclick="equip(${index})">装備</button>`}
                    ${
                      isEquipped
                        ? ""
                        : isLocked
                          ? `<button disabled title="ロック中は捨てられません">捨てる</button>`
                          : `<button onclick="discardEquipment(${index})">捨てる</button>`
                    }
      </div>
      <hr>
    `;

    itemListEl.appendChild(div);
  });
}
// アイテムのトータル加算値を計算
function getItemTotalBonus(item) {
  const normalizeBonus = (bonus) => ({
    power: Number(bonus?.power) || 0,
    vitality: Number(bonus?.vitality) || 0,
    agility: Number(bonus?.agility) || 0,
  });

  if (!item) {
    return { power: 0, vitality: 0, agility: 0 };
  }

  if (item.bonus) {
    return normalizeBonus(item.bonus);
  }

  const baseBonus = normalizeBonus(item.baseBonus);
  const optionBonus = normalizeBonus(item.optionBonus);

  return {
    power: baseBonus.power + optionBonus.power,
    vitality: baseBonus.vitality + optionBonus.vitality,
    agility: baseBonus.agility + optionBonus.agility,
  };
}
/* =====================
   ソート用ユーティリティ
===================== */

// 装備：能力値合計
function getItemScore(item) {
  const b = getItemTotalBonus(item);
  return (b.power || 0) + (b.vitality || 0) + (b.agility || 0);
}

// 装飾品：specialOption.id
function getAccessorySortKey(item) {
  const opt = item.specialOptions?.[0];
  return opt?.id || "zzzz";
}
function getAccessoryOptionValueByKey(item, key) {
  const opt = item.specialOptions?.find((o) => o?.id === key);
  // value がなければ 0（念のため fixed/min/max も見るならここで）
  return Number(opt?.value) || 0;
}
function normalizeDiscardThreshold(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function loadDiscardThresholds() {
  const raw = localStorage.getItem(discardThresholdsKey);
  if (!raw) {
    discardThresholds = { ...discardThresholdDefaults };
    return discardThresholds;
  }

  try {
    const data = JSON.parse(raw);
    if (typeof data === "number") {
      discardThresholds = {
        value: normalizeDiscardThreshold(data),
        accessoryShinyOnly: false,
        accessoryNone: false,
      };
    } else if (typeof data?.value !== "undefined") {
      discardThresholds = {
        value: normalizeDiscardThreshold(data.value),
        accessoryShinyOnly: Boolean(data?.accessoryShinyOnly),
        accessoryNone: Boolean(data?.accessoryNone),
      };
    } else {
      const legacyValues = [
        normalizeDiscardThreshold(data?.power),
        normalizeDiscardThreshold(data?.vitality),
        normalizeDiscardThreshold(data?.agility),
      ];
      discardThresholds = {
        value: Math.max(...legacyValues),
        accessoryShinyOnly: false,
        accessoryNone: false,
      };
    }
  } catch (error) {
    discardThresholds = { ...discardThresholdDefaults };
  }

  return discardThresholds;
}

function saveDiscardThresholds() {
  localStorage.setItem(discardThresholdsKey, JSON.stringify(discardThresholds));
}
function syncDiscardThresholdInputs() {
  discardCommonInputEl.value = discardThresholds.value;
  if (discardAccessoryShinyOnlyEl) {
    discardAccessoryShinyOnlyEl.checked = discardThresholds.accessoryShinyOnly;
  }
  if (discardAccessoryNoneEl) {
    discardAccessoryNoneEl.checked = discardThresholds.accessoryNone;
  }
}

function storeDiscardThresholdInputs() {
  discardThresholds = {
    value: normalizeDiscardThreshold(discardCommonInputEl.value),
    accessoryShinyOnly: Boolean(discardAccessoryShinyOnlyEl?.checked),
    accessoryNone: Boolean(discardAccessoryNoneEl?.checked),
  };
  syncDiscardThresholdInputs();
  saveDiscardThresholds();
  return discardThresholds;
}
/* =====================
   装備を捨てる
===================== */
function discardEquipment(index) {
  const item = inventory[index];
  if (!item || item.kind === "consumable") return;
  if (isUniqueWeapon(item)) {
    log("⚠️ ユニーク武器は捨てられない。");
    return;
  }
  const wasWeaponEquipped = player.weapon === item;
  const wasAccessoryEquipped = player.accessory === item;
  const prevMaxHp = wasWeaponEquipped ? calcMaxHp() : null;
  inventory.splice(index, 1);

  if (wasWeaponEquipped) {
    player.weapon = null;
    const nextMaxHp = calcMaxHp();
    adjustHpForMaxChange(prevMaxHp, nextMaxHp);
  }
  if (wasAccessoryEquipped) {
    player.accessory = null;
  }

  log(`🗑 ${item.name}を捨てた`);
  renderInventory();
  refresh();
}

function discardUnprotectedItems() {
  const shouldDiscard = confirm(
    "装備中/ロック以外のアイテム,装飾品をすべて捨てます。よろしいですか？",
  );
  if (!shouldDiscard) {
    log("🧹 一括破棄をキャンセルした");
    return;
  }

  for (let i = inventory.length - 1; i >= 0; i -= 1) {
    const item = inventory[i];
    if (!item) continue;
    const isEquipped =
      player.weapon === item ||
      player.weapon2 === item ||
      player.accessory === item;
    const isLocked = !!item.isLocked;
    const isHerb = item.id === HERB_ITEM_TEMPLATE.id;
    if (isEquipped || isLocked || isHerb || isUniqueWeapon(item)) continue;

    inventory.splice(i, 1);
  }
  renderInventory();
  refresh();
}
function toggleItemLock(index) {
  const item = inventory[index];
  if (!item || item.kind === "consumable") return;

  item.isLocked = !item.isLocked;
  log(
    `${item.isLocked ? "🔒" : "🔓"} ${item.name} を${
      item.isLocked ? "ロック" : "解除"
    }した`,
  );
  renderInventory();
}
/* =====================
   アイテムフィルターの設定を保存
===================== */
function discardWeakerEquipment() {
  const thresholds = storeDiscardThresholdInputs();
  log(`📌 アイテムフィルターの設定を保存`);
  closeDiscardWeakScreen();
}

window.discardWeakerEquipment = discardWeakerEquipment;
window.openDiscardWeakScreen = openDiscardWeakScreen;
window.closeDiscardWeakScreen = closeDiscardWeakScreen;
window.handleWeatheredWeaponProgress = handleWeatheredWeaponProgress;
/* =====================
   装備
   ★重要：player.statusを直接増減しない！
   装備補正は計算時に getEquipmentBonus() で足す方式にする
===================== */
function equip(index, slot = "primary") {
  const item = inventory[index];
  if (!item) return;

  if (item.kind === "accessory") {
    player.accessory = item;
    log(`💍 ${item.name}を装備した`);
    renderInventory();
    refresh();
    return;
  }
  const hasDualWieldSkill =
    typeof getSkillLevel === "function" && getSkillLevel("dual_wield") > 0;
  if (
    slot === "secondary" &&
    (isDualWieldRestrictedItem(item) ||
      isDualWieldRestrictedItem(player.weapon))
  ) {
    log("⚠️ ユニーク武器は二刀流と併用できない。");
    return;
  }
  const prevMaxHp = calcMaxHp();
  if (isDualWieldRestrictedItem(item) && hasDualWieldSkill && player.weapon2) {
    player.weapon2 = null;
    log("⚠️ ユニーク武器は二刀流と併用できない。");
  }
  if (slot === "secondary") {
    player.weapon2 = item;
  } else {
    player.weapon = item;
  }
  enforceRestrictedSingleWeapon();

  // 最大HPが変わる可能性があるので安全に丸める
  const nextMaxHp = calcMaxHp();
  adjustHpForMaxChange(prevMaxHp, nextMaxHp);

  const slotLabel = slot === "secondary" ? "装備2" : "装備1";
  log(`🗡 ${item.name}を${slotLabel}に装備した`);
  renderInventory();
  refresh();
}

function adjustHpForMaxChange(prevMaxHp, nextMaxHp) {
  if (player.hp <= 0) return;
  if (!prevMaxHp || prevMaxHp <= 0) {
    player.hp = Math.min(player.hp, nextMaxHp);
    return;
  }

  const ratio = player.hp / prevMaxHp;
  const scaledHp = Math.round(nextMaxHp * ratio);
  player.hp = Math.min(nextMaxHp, Math.max(1, scaledHp));
}

/* =====================
   アイテム使用
===================== */
function useItem(index) {
  const item = inventory[index];
  if (!item || item.kind !== "consumable") return false;

  if (item.effect === "heal") {
    const maxHp = calcMaxHp();
    if (player.hp >= maxHp) {
      log("💤 HPは満タンだ");
      return false;
    }

    const skillEffects = getSkillEffects();
    const herbHealBoost = Math.max(0, skillEffects.herbHealBoost || 0);
    const healAmount = Math.max(
      1,
      Math.floor(maxHp * (item.healRatio + herbHealBoost)),
    );
    player.hp = Math.min(maxHp, player.hp + healAmount);
    log(`🌿 ${item.name} を使用してHPを回復した`);
  }

  inventory.splice(index, 1);
  renderInventory();
  refresh();
  return true;
}

function useHerbInBattle() {
  if (gameState !== "BATTLE") return;

  const herbIndex = inventory.findIndex(
    (item) => item && item.id === HERB_ITEM_TEMPLATE.id,
  );
  if (herbIndex === -1) {
    log("💤 やくそうがない");
    return;
  }
  const used = useItem(herbIndex);
  if (used) return;
}
function calcGodItemMinValueByFloor(floor) {
  const rate = 1.8; // 調整用
  return Math.max(0, Math.floor(floor * rate));
}
function scaleItemBonuses(item, multiplier) {
  // ★神アイテムのみ階層依存の下限を適用
  const isGodItem = item?.name?.startsWith("★六神★");
  const minFloor = isGodItem ? calcGodItemMinValueByFloor(floor) : 0;

  const scaleValue = (value) => {
    if (value <= 0) return 0;
    const scaled = Math.max(1, Math.floor(value * multiplier));
    return Math.max(scaled, minFloor);
  };

  if (item.baseBonus) {
    item.baseBonus = {
      power: scaleValue(item.baseBonus.power || 0),
      vitality: scaleValue(item.baseBonus.vitality || 0),
      agility: scaleValue(item.baseBonus.agility || 0),
    };
  }

  if (item.optionBonus) {
    item.optionBonus = {
      power: scaleValue(item.optionBonus.power || 0),
      vitality: scaleValue(item.optionBonus.vitality || 0),
      agility: scaleValue(item.optionBonus.agility || 0),
    };
  }

  if (item.bonus) {
    item.bonus = {
      power: (item.baseBonus?.power || 0) + (item.optionBonus?.power || 0),
      vitality:
        (item.baseBonus?.vitality || 0) + (item.optionBonus?.vitality || 0),
      agility:
        (item.baseBonus?.agility || 0) + (item.optionBonus?.agility || 0),
    };
  }
}

function applyBrokenItemStat(item) {
  const total =
    (item.bonus?.power || 0) +
    (item.bonus?.vitality || 0) +
    (item.bonus?.agility || 0);
  const stats = ["power", "vitality", "agility"];
  const chosenStat = stats[Math.floor(Math.random() * stats.length)];
  const singleBonus = {
    power: 0,
    vitality: 0,
    agility: 0,
    [chosenStat]: total,
  };
  item.baseBonus = { ...singleBonus };
  item.optionBonus = { power: 0, vitality: 0, agility: 0 };
  item.bonus = { ...singleBonus };
}
// アイテムフィルター
function shouldPickupItem(item) {
  const thresholds = loadDiscardThresholds();
  const itemBonus = getItemTotalBonus(item);

  return !(
    itemBonus.power <= thresholds.value &&
    itemBonus.vitality <= thresholds.value &&
    itemBonus.agility <= thresholds.value
  );
}
function isAccessoryOptionShiny(option, ratio = 0.8) {
  const maxValue = Number(option?.max);
  const value = Number(option?.value);
  if (!Number.isFinite(maxValue) || !Number.isFinite(value)) return false;
  return value >= Math.ceil(maxValue * ratio);
}

function shouldPickupAccessory(item) {
  const thresholds = loadDiscardThresholds();
  const optionList = Array.isArray(item?.specialOptions)
    ? item.specialOptions
    : [];
  if (optionList.length >= 2) return true;
  if (thresholds.accessoryNone) return false;
  if (!thresholds.accessoryShinyOnly) return true;
  if (optionList.length === 0) return false;
  return isAccessoryOptionShiny(optionList[0]);
}
/* =====================
   ドロップ（敵ごとの drops から抽選）
   
===================== */
function dropItem() {
  if (!enemy) return;
  const finalBossFloor = window.getFinalBossFloor?.();

  const skillEffects =
    typeof getSkillEffects === "function" ? getSkillEffects() : {};
  const dropItemValueBoost = Math.max(0, skillEffects.dropItemValueBoost || 0);
  const dropItemMultiplier = 1 + dropItemValueBoost / 100;
  const applyDropItemValueBoost = (item) => {
    if (!item || dropItemMultiplier <= 1) return;
    scaleItemBonuses(item, dropItemMultiplier);
  };
  if (finalBossFloor && enemy.minFloor === finalBossFloor) {
    const proof = window.ItemGen?.PROOF_OF_SLAYING;
    if (!proof) return;

    inventory.push({ ...proof });
    log("🏆 最終ボスを討伐した！");
    log(`🎁 ${proof.name}を手に入れた`);
    return;
  }
  const roll = Math.random();
  if (enemy.isBroken) {
    if (roll < 0.1) {
      // 壊れた 10%
      const item = window.ItemGen.createLootItemForDrop(
        enemy.tier,
        floor,
        false,
        enemy.titleMul,
        3,
      );
      item.name = `★壊れた${item.name}`;
      applyBrokenItemStat(item);
      applyDropItemValueBoost(item);
      if (!shouldPickupItem(item)) {
        log(`⏭ ${item.name} は拾わなかった`);
        return;
      }
      inventory.push(item);
      log(`🎁 ${item.name}を手に入れた`);
      return;
    } else if (roll < 0.11) {
      // 神の 1%（0.10～0.11）
      const item = window.ItemGen.createLootItemForDrop(
        enemy.tier,
        floor,
        false,
        enemy.titleMul,
        3,
      );
      item.name = `★六神★${item.name}`;
      scaleItemBonuses(item, 1.5);
      applyDropItemValueBoost(item);
      if (!shouldPickupItem(item)) {
        log(`⏭ ${item.name} は拾わなかった`);
        return;
      }
      inventory.push(item);
      log(`🎁 ${item.name}を手に入れた`);
      return;
    }
    return;
  }

  if (enemy.isRare) {
    const rareAccessoryDropRate = floor >= WEATHERED_EVENT_FLOOR ? 0.5 : 1;
    if (Math.random() >= rareAccessoryDropRate) {
      return;
    }
    const doubleEffectChance = floor >= WEATHERED_EVENT_FLOOR ? 0.0001 : 0;
    const optionCount = Math.random() < doubleEffectChance ? 2 : 1;
    const item = window.ItemGen.createAccessoryForDrop(floor, { optionCount });
    item.isRareDrop = true;
    if (!shouldPickupAccessory(item)) {
      log(`⏭ ${item.name} は拾わなかった`);
      return;
    }
    inventory.push(item);
    if (optionCount === 2) {
      log(`🎁✨光り輝く装飾品 ${item.name}を手に入れた！`);
    } else {
      log(`🎁 ${item.name}を手に入れた`);
    }
    if (typeof showRareEnemyPopup === "function") {
      if (typeof item.name === "string" && item.name.startsWith("神々しい")) {
        showRareEnemyPopup(item.name, "神々しい装飾品を手に入れた！", {
          autoClose: false,
          allowOverlayClose: false,
          showCloseButton: true,
          hintText: "閉じるボタンで閉じる",
        });
      } else if (optionCount === 2) {
        showRareEnemyPopup(item.name, "光り輝く装飾品を手に入れた！", {
          autoClose: false,
          allowOverlayClose: false,
          showCloseButton: true,
          hintText: "閉じるボタンで閉じる",
        });
      }
    }
    return;
  }
  // 敵tierに合わせてアイテムtierを決める（±1くらい揺らす）
  const t = enemy.tier || 1;
  const tier = Math.max(
    1,
    Math.min(
      10,
      t + (Math.random() < 0.2 ? 1 : 0) - (Math.random() < 0.1 ? 1 : 0),
    ),
  );

  // ドロップ率（好みで）
  if (roll >= 0.5) return;

  const desiredBaseStatCount = 3;
  const item = window.ItemGen.createLootItemForDrop(
    tier,
    floor,
    !!enemy.isRare,
    enemy.titleMul,
    desiredBaseStatCount,
  );
  applyDropItemValueBoost(item);
  if (!shouldPickupItem(item)) {
    log(`⏭ ${item.name} は拾わなかった`);
    return;
  }
  inventory.push(item);
  log(`🎁 ${item.name}を手に入れた`);
}

function countNonZeroBaseStats(baseBonus) {
  if (!baseBonus) return 0;
  return ["power", "vitality", "agility"].reduce(
    (count, key) => count + (baseBonus[key] ? 1 : 0),
    0,
  );
}
