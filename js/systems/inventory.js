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
  healRatio: 0.2,
  description: "最大HPの20%回復",
};

/* =====================
   インベントリ画面
===================== */
function openInventory() {
  if (gameState !== "EXPLORE" && gameState !== "BATTLE") return;
  inventoryReturnState = gameState;
  gameState = "INVENTORY";
  inventoryEl.style.display = "block";
  exploreButtons.style.display = "none";
  battleButtons.style.display = "none";

  renderInventory();
}

function closeInventory() {
  gameState = inventoryReturnState;
  inventoryEl.style.display = "none";
  exploreButtons.style.display = gameState === "EXPLORE" ? "block" : "none";
  battleButtons.style.display = gameState === "BATTLE" ? "block" : "none";

  refresh();
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

  inventory.forEach((item, index) => {
    if (item.kind === "consumable") {
      const div = document.createElement("div");
      const description = item.description || "";
      div.innerHTML = `
        <div>${item.name}</div>
        ${description ? `<div style="margin-top:4px; font-size:12px; opacity:0.9;">${description}</div>` : ""}
        <div style="margin-top:6px;">
          <button onclick="useItem(${index})">使用</button>
        </div>
        <hr>
      `;
      itemListEl.appendChild(div);
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
            <div>${hasSeparated ? (optParts.length ? optParts.join(" / ") : "なし") : "なし"}</div>
        </div>
      <div style="margin-top:6px;">
        ${isEquipped
          ? ""
          : (gameState === "BATTLE"
            ? `<button disabled>戦闘中は装備不可</button>`
            : `<button onclick="equip(${index})">装備</button>`)}
      </div>
      <hr>
    `;

    itemListEl.appendChild(div);
  });
}


/* =====================
   装備
   ★重要：player.statusを直接増減しない！
   装備補正は計算時に getEquipmentBonus() で足す方式にする
===================== */
function equip(index) {
  const item = inventory[index];
  if (!item) return;

  player.weapon = item;

  // 最大HPが変わる可能性があるので安全に丸める
  player.hp = Math.min(player.hp, calcMaxHp());

  log(`🗡 ${item.name}${"★".repeat(item.rarity || 0)} を装備した`);
  closeInventory();
  refresh();
}

/* =====================
   アイテム使用
===================== */
function useItem(index) {
  const item = inventory[index];
  if (!item || item.kind !== "consumable") return;

  if (item.effect === "heal") {
    const maxHp = calcMaxHp();
    if (player.hp >= maxHp) {
      log("💤 HPは満タンだ");
      return;
    }

    const healAmount = Math.max(1, Math.floor(maxHp * item.healRatio));
    player.hp = Math.min(maxHp, player.hp + healAmount);
    log(`🌿 ${item.name} を使用してHPを回復した`);
  }

  inventory.splice(index, 1);
  renderInventory();
  refresh();
}


/* =====================
   ゲームオーバー時：未装備アイテムをロスト
   （装備中のアイテムだけ残す）
===================== */
function loseUnequippedItems() {
  if (!player.weapon) {
    inventory.length = 0;
    return;
  }

  const equipped = player.weapon;

  inventory.length = 0;
  inventory.push(equipped);
}

/* =====================
   ドロップ（敵ごとの drops から抽選）
===================== */
function dropItem() {
  if (!enemy) return;

  // 敵tierに合わせてアイテムtierを決める（±1くらい揺らす）
  const t = enemy.tier || 1;
  const tier = Math.max(1, Math.min(10, t + (Math.random() < 0.2 ? 1 : 0) - (Math.random() < 0.1 ? 1 : 0)));

  // ドロップ率（好みで）
  const roll = Math.random();
  if (roll < 0.1) {
    const herb = { ...HERB_ITEM_TEMPLATE };
    inventory.push(herb);
    log(`🎁 ${herb.name} を手に入れた`);
    return;
  }
  if (roll >= 0.5) return;
  
  // items.js のジェネレータで「その場生成」
  const base = window.ItemGen.createBaseItemForDrop(tier);

  // ★は今まで通り：createLootItemで optionBonus 付与
  const item = createLootItem(base, !!enemy.isRare);

  inventory.push(item);
  log(`🎁 ${item.name}${"★".repeat(item.rarity)} を手に入れた`);
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
  const rarity = isRareEnemy ? 3 : (Math.floor(Math.random() * 2) + 1);

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
  // 付与値は 1..floor（floorが0なら付与なし）
  const cap = Math.max(0, floor);
  const stats = ["power", "vitality", "agility"].sort(() => Math.random() - 0.5);
  const addCount = Math.min(rarity, stats.length);

  for (let i = 0; i < addCount; i++) {
    if (cap <= 0) break;
    const key = stats[i];
    const add = Math.floor(Math.random() * cap) + 1; // 1..floor
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
    baseBonus,     // 固有
    optionBonus,   // ランダムオプション
    bonus,         // 合計（計算用）
  };
}

