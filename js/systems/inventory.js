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

const discardThresholdsKey = "roguelike_discard_thresholds";
const discardThresholdDefaults = { power: 0, vitality: 0, agility: 0 };
let discardThresholds = { ...discardThresholdDefaults };

function grantHerbs(count, shouldLog = true) {
  for (let i = 0; i < count; i++) {
    const herb = { ...HERB_ITEM_TEMPLATE };
    inventory.push(herb);
  }
  if (shouldLog && count > 0) {
    log(`🎁 やくそう ×${count} を手に入れた`);
  }
}

function setHerbCount(count, shouldLog = true) {
  const herbCount = inventory.filter(
    (item) => item && item.id === HERB_ITEM_TEMPLATE.id
  ).length;
  const needed = count - herbCount;
  if (needed > 0) {
    grantHerbs(needed, shouldLog);
  }
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
      <div style="margin-top:6px;">
        <button onclick="useItem(${indices[0]})">使用</button>
      </div>
      <hr>
    `;
    itemListEl.appendChild(div);
  });

  inventory.forEach((item, index) => {
    if (item.kind === "consumable") {
      return;
    }
    const isEquipped = player.weapon === item;
    const stars = "★".repeat(item.rarity || 0);

    // 固有（無ければ0）
    const base = item.baseBonus || { power: 0, vitality: 0, agility: 0 };
    // ランダムオプション（無ければ0）
    const opt = item.optionBonus || { power: 0, vitality: 0, agility: 0 };

    // 互換：もしbase/optが無い古いデータなら、bonusを固有扱いにして表示
    const hasSeparated = !!item.baseBonus || !!item.optionBonus;
    const fallbackBonus = item.bonus || { power: 0, vitality: 0, agility: 0 };

    const baseParts = [];
    const optParts = [];

    const baseSrc = hasSeparated ? base : fallbackBonus;
    if (baseSrc.power) baseParts.push(`ちから+${baseSrc.power}`);
    if (baseSrc.vitality) baseParts.push(`たいりょく+${baseSrc.vitality}`);
    if (baseSrc.agility) baseParts.push(`すばやさ+${baseSrc.agility}`);

    if (hasSeparated) {
      if (opt.power) optParts.push(`ちから+${opt.power}`);
      if (opt.vitality) optParts.push(`たいりょく+${opt.vitality}`);
      if (opt.agility) optParts.push(`すばやさ+${opt.agility}`);
    }

    const div = document.createElement("div");

    div.innerHTML = `
      <div>
        ${isEquipped ? "🟢[E] " : ""}
        ${item.name}${stars}
      </div>

      <div style="margin-top:4px;">
        <div style="font-size:12px; opacity:0.9;">固有能力</div>
        <div>${baseParts.length ? baseParts.join(" / ") : "なし"}</div>
      </div>

      <div style="margin-top:6px;">
        <div style="font-size:12px; opacity:0.9;">オプション</div>
            <div>${
              hasSeparated
                ? optParts.length
                  ? optParts.join(" / ")
                  : "なし"
                : "なし"
            }</div>
        </div>
      <div style="margin-top:6px; display:flex; gap:10px; flex-wrap:wrap;">
        ${
          isEquipped
            ? ""
            : gameState === "BATTLE"
            ? `<button disabled>戦闘中は装備不可</button>`
            : `<button onclick="equip(${index})">装備</button>`
        }
                    ${
                      isEquipped
                        ? ""
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
    discardThresholds = {
      power: normalizeDiscardThreshold(data?.power),
      vitality: normalizeDiscardThreshold(data?.vitality),
      agility: normalizeDiscardThreshold(data?.agility),
    };
  } catch (error) {
    discardThresholds = { ...discardThresholdDefaults };
  }

  return discardThresholds;
}

function saveDiscardThresholds() {
  localStorage.setItem(discardThresholdsKey, JSON.stringify(discardThresholds));
}
function syncDiscardThresholdInputs() {
  discardPowerInputEl.value = discardThresholds.power;
  discardVitalityInputEl.value = discardThresholds.vitality;
  discardAgilityInputEl.value = discardThresholds.agility;
}

function storeDiscardThresholdInputs() {
  discardThresholds = {
    power: normalizeDiscardThreshold(discardPowerInputEl.value),
    vitality: normalizeDiscardThreshold(discardVitalityInputEl.value),
    agility: normalizeDiscardThreshold(discardAgilityInputEl.value),
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

  const wasEquipped = player.weapon === item;
  const prevMaxHp = wasEquipped ? calcMaxHp() : null;
  inventory.splice(index, 1);

  if (wasEquipped) {
    player.weapon = null;
    const nextMaxHp = calcMaxHp();
    adjustHpForMaxChange(prevMaxHp, nextMaxHp);
  }

  log(`🗑 ${item.name}${"★".repeat(item.rarity || 0)} を捨てた`);
  renderInventory();
  refresh();
}

/* =====================
   設定値以下の装備をまとめて捨てる
===================== */
function discardWeakerEquipment() {
  const thresholds = storeDiscardThresholdInputs();
  let discardedCount = 0;

  for (let i = inventory.length - 1; i >= 0; i -= 1) {
    const item = inventory[i];
    if (!item || item.kind === "consumable") continue;
    if (item === player.weapon) continue;

    const itemBonus = getItemTotalBonus(item);
    if (
      itemBonus.power <= thresholds.power &&
      itemBonus.vitality <= thresholds.vitality &&
      itemBonus.agility <= thresholds.agility
    ) {
      inventory.splice(i, 1);
      discardedCount += 1;
    }
  }

  if (discardedCount === 0) {
    log("捨てる装備がない");
    return;
  }

  log(`🧹 弱い装備を${discardedCount}個捨てた`);
  renderInventory();
  refresh();
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

  const prevMaxHp = calcMaxHp();
  player.weapon = item;

  // 最大HPが変わる可能性があるので安全に丸める
  const nextMaxHp = calcMaxHp();
  adjustHpForMaxChange(prevMaxHp, nextMaxHp);

  log(`🗡 ${item.name}${"★".repeat(item.rarity || 0)} を装備した`);
  closeInventory();
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

    const healAmount = Math.max(1, Math.floor(maxHp * item.healRatio));
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
    (item) => item && item.id === HERB_ITEM_TEMPLATE.id
  );
  if (herbIndex === -1) {
    log("💤 やくそうがない");
    return;
  }
  const used = useItem(herbIndex);
  if (used) return;
}

/* =====================
   ゲームオーバー時：未装備アイテムをロスト
   （装備中のアイテムだけ残す）
===================== */
// function loseUnequippedItems() {
//   if (!player.weapon) {
//     inventory.length = 0;
//     return;
//   }

//   const equipped = player.weapon;

//   inventory.length = 0;
//   inventory.push(equipped);
// }

/* =====================
   ドロップ（敵ごとの drops から抽選）
===================== */
function dropItem() {
  if (!enemy) return;

  // 敵tierに合わせてアイテムtierを決める（±1くらい揺らす）
  const t = enemy.tier || 1;
  const tier = Math.max(
    1,
    Math.min(
      10,
      t + (Math.random() < 0.2 ? 1 : 0) - (Math.random() < 0.1 ? 1 : 0)
    )
  );

  // ドロップ率（好みで）
  const roll = Math.random();
  if (!enemy.isRare && roll >= 0.5) return;

  // items.js のジェネレータで「その場生成」
  const desiredBaseStatCount = pickDesiredBaseStatCount();
  let base = window.ItemGen.createBaseItemForDrop(tier);
  let rerollCount = 0;
  while (
    countNonZeroBaseStats(base.baseBonus) < desiredBaseStatCount &&
    rerollCount < 6
  ) {
    base = window.ItemGen.createBaseItemForDrop(tier);
    rerollCount += 1;
  }
  base = applyBaseStatCount(base, desiredBaseStatCount);

  // ★は今まで通り：createLootItemで optionBonus 付与
  const item = createLootItem(base, !!enemy.isRare);

  inventory.push(item);
  log(`🎁 ${item.name}${"★".repeat(item.rarity)} を手に入れた`);
}

function pickDesiredBaseStatCount() {
  const roll = Math.random();
  if (roll < 0.5) return 1;
  if (roll < 0.8) return 2;
  return 3;
}

function countNonZeroBaseStats(baseBonus) {
  if (!baseBonus) return 0;
  return ["power", "vitality", "agility"].reduce(
    (count, key) => count + (baseBonus[key] ? 1 : 0),
    0
  );
}

function applyBaseStatCount(baseItem, desiredCount) {
  const baseBonus = {
    ...(baseItem.baseBonus || { power: 0, vitality: 0, agility: 0 }),
  };
  const keys = ["power", "vitality", "agility"];
  const nonZero = keys.filter((key) => baseBonus[key] > 0);

  if (nonZero.length <= desiredCount) {
    return { ...baseItem, baseBonus };
  }

  const shuffled = nonZero.sort(() => Math.random() - 0.5);
  for (let i = desiredCount; i < shuffled.length; i += 1) {
    baseBonus[shuffled[i]] = 0;
  }

  return { ...baseItem, baseBonus };
}

/* =====================
   ドロップ品の実体を作る
   - baseItem（TYPE基礎＋二つ名倍率で確定済み）をコピー
   - ★補正を追加で付与
   - ★3はレア敵のみ
   - ★補正の上限は現在階層（floor）
===================== */
function createLootItem(baseItem, isRareEnemy) {
  // ★3はレア敵のみ、それ以外は★1〜★2
  // ★3はレア敵 or 通常敵0.1%、それ以外は★1〜★2
  let rarity;
  let optionMultiplier = 1;
  if (isRareEnemy) {
    rarity = 3;
    optionMultiplier = 2;
  } else if (Math.random() < 0.001) {
    rarity = 3;
    optionMultiplier = 1.5;
  } else {
    rarity = Math.floor(Math.random() * 2) + 1;
  }
  // 固有（items.jsで確定済み）をコピー
  const base = baseItem.baseBonus || { power: 0, vitality: 0, agility: 0 };
  const baseBonus = {
    power: base.power || 0,
    vitality: base.vitality || 0,
    agility: base.agility || 0,
  };

  // ランダムオプション（★で増えた分だけ）
  const optionBonus = { power: 0, vitality: 0, agility: 0 };

  // ★による追加補正：★1=1種、★2=2種、★3=3種
  // 付与値は 1..floor/2（floorが0なら付与なし）
  const cap = Math.max(0, Math.floor(floor / 2));
  const stats = ["power", "vitality", "agility"].sort(
    () => Math.random() - 0.5
  );
  const addCount = Math.min(rarity, stats.length);

  for (let i = 0; i < addCount; i++) {
    if (cap <= 0) break;
    const key = stats[i];
    const add = (Math.floor(Math.random() * cap) + 1) * optionMultiplier;
    optionBonus[key] += add;
  }

  // 合計（計算用）
  const bonus = {
    power: baseBonus.power + optionBonus.power,
    vitality: baseBonus.vitality + optionBonus.vitality,
    agility: baseBonus.agility + optionBonus.agility,
  };

  return {
    id: baseItem.id,
    name: baseItem.name,
    type: baseItem.type,
    tier: baseItem.tier,
    minFloor: baseItem.minFloor,

    atk: baseItem.atk || 0, // UIでは表示しないだけ。計算用に残してOK

    // ★レア度
    rarity,

    // 固有/ランダム/合計を分けて保持
    baseBonus, // 固有
    optionBonus, // ランダムオプション
    bonus, // 合計（計算用）
  };
}
