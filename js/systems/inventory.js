// js/systems/inventory.js

/* =====================
   インベントリ（所持品）
===================== */
const inventory = [];
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
const discardThresholdDefaults = { value: 0 };
let discardThresholds = { ...discardThresholdDefaults };
let currentInventoryTab = "equipment";
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

  updateInventoryTabs();
  renderInventory();
}

function closeInventory() {
  gameState = inventoryReturnState;
  inventoryEl.style.display = "none";
  discardWeakScreenEl.style.display = "none";
  exploreButtons.style.display = gameState === "EXPLORE" ? "block" : "none";
  battleButtons.style.display = gameState === "BATTLE" ? "block" : "none";

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
function renderConsumableItems() {
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
  return consumableGroups.length;
}

function renderEquipmentItems() {
  let hasContent = false;

  if (renderConsumableItems() > 0) {
    hasContent = true;
  }

  const equipmentItems = [];
  inventory.forEach((item, index) => {
    if (item.kind === "consumable") {
      return;
    }
    const isAccessory = item.kind === "accessory";
    if (isAccessory) {
      return;
    }
    equipmentItems.push({ item, index, isAccessory });
  });

  if (equipmentItems.length === 0 && !hasContent) {
    itemListEl.textContent = "アイテムなし";
    return;
  }

  if (equipmentItems.length > 0) {
    hasContent = true;
  }

  equipmentItems.forEach(({ item, index, isAccessory }) => {
    const isEquipped = player.weapon === item || player.accessory === item;
    const isLocked = !!item.isLocked;
    // const rareDropMark = item.isRareDrop ? "★" : "";
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
    const div = document.createElement("div");

    div.innerHTML = `
      <div>
        ${isEquipped ? "🟢[E] " : ""}
        ${lockMark}${item.name}
      </div>

      <div style="margin-top:4px;">
        <div style="font-size:12px; opacity:0.9;">能力値</div>
        <div>${totalParts.length ? totalParts.join(" / ") : "なし"}</div>
      </div>
      <div style="margin-top:6px; display:flex; gap:10px; flex-wrap:wrap;">     
            ${
              isEquipped
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

function renderAccessoryItems() {
  const accessoryItems = [];

  inventory.forEach((item, index) => {
    if (item.kind !== "accessory") {
      return;
    }
    accessoryItems.push({ item, index, isAccessory: true });
  });

  if (accessoryItems.length === 0) {
    itemListEl.textContent = "アイテムなし";
    return;
  }

  accessoryItems.forEach(({ item, index, isAccessory }) => {
    const isEquipped = player.weapon === item || player.accessory === item;
    const isLocked = !!item.isLocked;
    // const rareDropMark = item.isRareDrop ? "★" : "";
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
    const div = document.createElement("div");

    div.innerHTML = `
      <div>
        ${isEquipped ? "🟢[E] " : ""}
        ${lockMark}${item.name}
      </div>

      <div style="margin-top:4px;">
        <div style="font-size:12px; opacity:0.9;">能力値</div>
        <div>${totalParts.length ? totalParts.join(" / ") : "なし"}</div>
      </div>
      <div style="margin-top:6px; display:flex; gap:10px; flex-wrap:wrap;">
        ${
          isEquipped
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
      };
    } else if (typeof data?.value !== "undefined") {
      discardThresholds = {
        value: normalizeDiscardThreshold(data.value),
      };
    } else {
      const legacyValues = [
        normalizeDiscardThreshold(data?.power),
        normalizeDiscardThreshold(data?.vitality),
        normalizeDiscardThreshold(data?.agility),
      ];
      discardThresholds = {
        value: Math.max(...legacyValues),
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
}

function storeDiscardThresholdInputs() {
  discardThresholds = {
    value: normalizeDiscardThreshold(discardCommonInputEl.value),
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
/* =====================
   装備
   ★重要：player.statusを直接増減しない！
   装備補正は計算時に getEquipmentBonus() で足す方式にする
===================== */
function equip(index) {
  const item = inventory[index];
  if (!item) return;

  if (item.kind === "accessory") {
    player.accessory = item;
    log(`💍 ${item.name}を装備した`);
    renderInventory();
    refresh();
    return;
  }
  const prevMaxHp = calcMaxHp();
  player.weapon = item;

  // 最大HPが変わる可能性があるので安全に丸める
  const nextMaxHp = calcMaxHp();
  adjustHpForMaxChange(prevMaxHp, nextMaxHp);

  log(`🗡 ${item.name}を装備した`);
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
/* =====================
   ドロップ（敵ごとの drops から抽選）
   
===================== */
function dropItem() {
  if (!enemy) return;
  const finalBossFloor = window.getFinalBossFloor?.();

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
    const item = window.ItemGen.createAccessoryForDrop(floor);
    item.isRareDrop = true;
    inventory.push(item);
    log(`🎁 ${item.name}を手に入れた`);
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

  item.isRareDrop = !!enemy.isRare;
  const rareDropMark = item.isRareDrop ? "★" : "";
  if (!shouldPickupItem(item)) {
    log(`⏭ ${rareDropMark}${item.name} は拾わなかった`);
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
