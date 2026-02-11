let skillReturnState = "EXPLORE";
let skillPresetDialogIndex = null;

function getSkillLevel(skillId) {
  return Number(player.skills?.[skillId]) || 0;
}
function autoAssignExpSkillPoints() {
  if (!player.autoAssignExpSkillPoints) return 0;
  const expSkill = SKILLS.find((skill) => skill.id === "exp_gain_boost");
  if (!expSkill) return 0;

  const requiredPoints = Number(expSkill.requiredPoints) || 1;
  if (requiredPoints <= 0) return 0;

  const availablePoints = Math.floor(player.unassignedPoints / requiredPoints);
  if (availablePoints <= 0) return 0;

  const currentLevel = getSkillLevel(expSkill.id);
  player.skills[expSkill.id] = currentLevel + availablePoints;
  player.unassignedPoints -= availablePoints * requiredPoints;

  if (typeof log === "function") {
    log(`✨ 経験値upにスキルポイントを自動割り振り +${availablePoints}`);
  }

  if (gameState === "SKILL") {
    renderSkillScreen();
  }

  return availablePoints;
}
function hasRequiredSkills(skill) {
  const requirements = Array.isArray(skill?.requires) ? skill.requires : [];
  return requirements.every(
    (requirement) => getSkillLevel(requirement.id) >= (requirement.level || 1),
  );
}
function hasExclusiveSkillConflict(skill) {
  const exclusives = Array.isArray(skill?.exclusiveWith)
    ? skill.exclusiveWith
    : [];
  return exclusives.some((exclusiveId) => getSkillLevel(exclusiveId) > 0);
}
function getSkillPointsSpent(skills = player.skills) {
  if (!skills || typeof skills !== "object") return 0;
  let total = 0;
  Object.entries(skills).forEach(([skillId, level]) => {
    const skill = SKILLS.find((entry) => entry.id === skillId);
    if (!skill) return;
    const requiredPoints = Number(skill.requiredPoints) || 1;
    total += requiredPoints * Number(level || 0);
  });
  return total;
}
function getSkillEffects() {
  const total = {
    herbHealBoost: 0,
    herbCapacityBoost: 0,
    herbBattleReward: 0,
    herbRevive: 0,
    lifeSteal: 0,
    lifeStealDamage: 0,
    lifeStealOverHealRate: 0,
    reflect: 0,
    reflectBoost: 0,
    evadeBoost: 0,
    evadeCounter: 0,
    minHits: 0,
    agilityAttackRate: 0,
    vitalityAttackRate: 0,
    expBoost: 0,
    rareEncounterBoost: 0,
    rareEncounterBlock: 0,
    brokenEncounterBlock: 0,
    rareEncounterPopupCut: 0,
    brokenEncounterPopupCut: 0,
    powerRate: 0,
    vitalityRate: 0,
    agilityRate: 0,
    guts: 0,
    damageReduction: 0,
    singleHitBoost: 0,
    lastStandAttackBoost: 0,
    lastStandEvadeBoost: 0,
    maxHpOverride: 0,
    dropItemValueBoost: 0,
    cursedWeaponKillCountBoost: 0,
  };

  SKILLS.forEach((skill) => {
    const level = getSkillLevel(skill.id);
    if (level <= 0) return;
    const effects = skill.effects || {};
    Object.keys(total).forEach((key) => {
      if (effects[key]) {
        total[key] += effects[key] * level;
      }
    });
  });

  return total;
}

function openSkillAllocation(forceOpen = false) {
  if (
    !forceOpen &&
    gameState !== "EXPLORE" &&
    gameState !== "BATTLE" &&
    gameState !== "STATUS"
  ) {
    return;
  }

  if (gameState === "SKILL") {
    renderSkillScreen();
    return;
  }

  skillReturnState = gameState;
  gameState = "SKILL";

  exploreButtons.style.display = "none";
  battleButtons.style.display = "none";
  inventoryEl.style.display = "none";
  discardWeakScreenEl.style.display = "none";
  statusScreenEl.style.display = "none";
  document.body.classList.add("screen-scrollable");

  skillScreenEl.style.display = "block";
  renderSkillScreen();
}

function closeSkillAllocation() {
  gameState = skillReturnState || "EXPLORE";
  skillScreenEl.style.display = "none";
  document.body.classList.remove("screen-scrollable");

  if (gameState === "STATUS") {
    statusScreenEl.style.display = "block";
    document.body.classList.add("screen-scrollable");
    renderStatus();
    return;
  }

  exploreButtons.style.display = gameState === "EXPLORE" ? "block" : "none";
  battleButtons.style.display = gameState === "BATTLE" ? "block" : "none";

  refresh();
}

function renderSkillScreen() {
  if (!skillScreenContentEl) return;

  const autoAssignLabel = player.autoAssignExpSkillPoints ? "ON" : "OFF";
  const pointsLabel = `スキルポイント：${player.unassignedPoints}`;
  const hasAssignedSkills =
    player.skills && Object.keys(player.skills).length > 0;
  const presets = Array.isArray(player.skillPresets)
    ? player.skillPresets
    : [null, null, null];
  // （任意）合計効果を上に出す：すでに getSkillEffects() があるので活用
  const total = getSkillEffects();
  const hasSacrificialAttack = getSkillLevel("sacrificial_attack") > 0;
  const hasDualWield = getSkillLevel("dual_wield") > 0;
  const summaryItems = [];
  if (total.expBoost > 0) {
    summaryItems.push(`<div>獲得経験値：+${Math.floor(total.expBoost)}%</div>`);
  }
  if (total.rareEncounterBoost > 0) {
    summaryItems.push(
      `<div>レアモンスター遭遇率：+${Math.floor(total.rareEncounterBoost)}%</div>`,
    );
  }
  if (total.cursedWeaponKillCountBoost > 0) {
    summaryItems.push(
      `<div>呪われた武器撃破カウント増加：+${Math.floor(total.cursedWeaponKillCountBoost)}</div>`,
    );
  }
  if (total.rareEncounterBlock > 0) {
    summaryItems.push("<div>忍び足</div>");
  }
  if (total.brokenEncounterBlock > 0) {
    summaryItems.push("<div>忍び足2</div>");
  }
  if (total.rareEncounterPopupCut > 0) {
    summaryItems.push("<div>静寂の予兆</div>");
  }
  if (total.brokenEncounterPopupCut > 0) {
    summaryItems.push("<div>静寂の予兆2</div>");
  }
  if (total.herbHealBoost > 0) {
    summaryItems.push(
      `<div>やくそう回復量：+${Math.round(total.herbHealBoost * 100)}%</div>`,
    );
  }
  if (total.herbCapacityBoost > 0) {
    summaryItems.push(
      `<div>やくそう所持上限：+${Math.floor(total.herbCapacityBoost)}</div>`,
    );
  }
  if (total.herbBattleReward > 0) {
    summaryItems.push("<div>戦闘終了のやくそう増加</div>");
  }
  if (total.guts > 0) {
    summaryItems.push("<div>ガッツ</div>");
  }
  if (total.lifeSteal > 0) {
    summaryItems.push(`<div>吸血：+${Math.floor(total.lifeSteal)}%</div>`);
  }
  if (total.reflect > 0) {
    summaryItems.push(
      `<div>ダメージ反射：+${Math.floor(total.reflect)}%</div>`,
    );
  }
  if (total.reflectBoost > 0) {
    summaryItems.push("<div>反射強化</div>");
  }
  if (total.evadeBoost > 0) {
    summaryItems.push(`<div>回避率：+${Math.floor(total.evadeBoost)}%</div>`);
  }
  if (total.evadeCounter > 0) {
    summaryItems.push("<div>回避カウンター</div>");
  }
  if (total.lastStandEvadeBoost > 0) {
    summaryItems.push(`<div>緊急回避</div>`);
  }
  if (total.minHits > 0) {
    summaryItems.push(
      `<div>連続攻撃のヒット数：+${Math.floor(total.minHits)}</div>`,
    );
  }
  if (total.vitalityAttackRate > 0) {
    summaryItems.push("<div>シールドバッシュ</div>");
  }
  if (total.herbRevive > 0) {
    summaryItems.push("<div>草命転生</div>");
  }
  if (total.agilityAttackRate > 0) {
    summaryItems.push("<div>スピードアタック</div>");
  }
  if (hasSacrificialAttack) {
    summaryItems.push("<div>捨て身</div>");
  }
  if (hasDualWield) {
    summaryItems.push("<div>二刀流</div>");
  }
  if (total.lifeStealDamage > 0) {
    summaryItems.push("<div>血装撃</div>");
  }
  if (total.lifeStealOverHealRate > 0) {
    summaryItems.push("<div>血装衛</div>");
  }
  if (total.singleHitBoost > 0) {
    summaryItems.push("<div>居合切り</div>");
  }
  if (total.lastStandAttackBoost > 0) {
    summaryItems.push("<div>背水の一撃</div>");
  }
  if (total.maxHpOverride > 0) {
    summaryItems.push("<div>背水の陣</div>");
  }
  const summaryBody = summaryItems.length
    ? summaryItems.join("")
    : "<div>獲得済みの効果はありません</div>";
  const summaryHtml = `
    <div class="skill-summary">
      <div class="skill-summary-title">合計効果</div>
      <div class="skill-summary-grid">
        ${summaryBody}
      </div>
    </div>
`;

  const skillListHtml = SKILLS.filter((skill) => {
    const unlockFloor = Number(skill.unlockFloor) || 0;
    return !unlockFloor || player.maxReachedFloor >= unlockFloor;
  })
    .map((skill) => {
      const level = getSkillLevel(skill.id);
      const isMax = Number.isFinite(skill.maxLevel)
        ? level >= skill.maxLevel
        : false;
      const requiredPoints = Number(skill.requiredPoints) || 1;
      const requirements = Array.isArray(skill.requires) ? skill.requires : [];
      const hasRequirements = hasRequiredSkills(skill);
      const hasExclusiveConflict = hasExclusiveSkillConflict(skill);
      const canLearn =
        player.unassignedPoints >= requiredPoints &&
        !isMax &&
        hasRequirements &&
        !hasExclusiveConflict;
      const canMax =
        player.unassignedPoints >= requiredPoints &&
        !isMax &&
        hasRequirements &&
        !hasExclusiveConflict;
      const canMin = level > 0;
      const canDecrease = level > 0;
      const maxLevelLabel = Number.isFinite(skill.maxLevel)
        ? skill.maxLevel
        : "∞";
      const requirementLabel = requirements.length
        ? `前提スキル：${requirements
            .map((requirement) => {
              const requiredSkill = SKILLS.find(
                (entry) => entry.id === requirement.id,
              );
              return requiredSkill ? requiredSkill.name : requirement.id;
            })
            .join(" / ")}`
        : "";
      const exclusiveLabel = Array.isArray(skill.exclusiveWith)
        ? `同時取得不可：${skill.exclusiveWith
            .map((exclusiveId) => {
              const exclusiveSkill = SKILLS.find(
                (entry) => entry.id === exclusiveId,
              );
              return exclusiveSkill ? exclusiveSkill.name : exclusiveId;
            })
            .join(" / ")}`
        : "";
      return `
      <div class="skill-card ${canLearn ? "is-affordable" : ""} ${
        isMax ? "is-max" : ""
      }">
        <div class="skill-header">
          <div class="skill-title">${skill.name}</div>

          <div class="skill-meta">
            <span class="skill-badge">必要 ${requiredPoints}pt</span>
            <span class="skill-level">Lv.${level}/${maxLevelLabel}</span>
          </div>
        </div>

        <div class="skill-description">${skill.description}</div>
  ${
    requirementLabel
      ? `<div class="skill-requirement">${requirementLabel}</div>`
      : ""
  }
  ${
    exclusiveLabel
      ? `<div class="skill-requirement">${exclusiveLabel}</div>`
      : ""
  }
        <div class="skill-footer">
          <div class="skill-hint">${
            isMax
              ? "MAX"
              : !hasRequirements
                ? "前提スキル不足"
                : hasExclusiveConflict
                  ? "同時取得不可スキル取得済み"
                  : canLearn
                    ? "習得可能"
                    : "ポイント不足"
          }</div>

          <div class="skill-actions">
            <button class="skill-btn" onclick="minUnlearnSkill('${skill.id}')" ${
              canMin ? "" : "disabled"
            }>MIN</button>
            <button class="skill-btn" onclick="unlearnSkill('${skill.id}')" ${
              canDecrease ? "" : "disabled"
            }>−</button>
            <button class="skill-btn" onclick="learnSkill('${skill.id}')" ${
              canLearn ? "" : "disabled"
            }>＋</button>
            <button class="skill-btn" onclick="maxLearnSkill('${skill.id}')" ${
              canMax ? "" : "disabled"
            }>MAX</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  const presetButtonsHtml = [0, 1, 2]
    .map((index) => {
      const label = `セット${index + 1}`;
      const isFilled = Boolean(presets[index]?.skills);
      return `<button class="skill-reset-button skill-preset-button ${
        isFilled ? "is-filled" : "is-empty"
      }" onclick="handleSkillPreset(${index})">${label}</button>`;
    })
    .join("");

  const presetDialogHtml =
    skillPresetDialogIndex === null
      ? ""
      : `
        <div class="skill-preset-dialog-backdrop" onclick="closeSkillPresetDialog()">
          <div class="skill-preset-dialog" onclick="event.stopPropagation()">
            <div class="skill-preset-dialog-title">
              スキルプリセット${skillPresetDialogIndex + 1}
            </div>
            <div class="skill-preset-dialog-body">
              どちらの操作を行いますか？
            </div>
            <div class="skill-preset-dialog-actions">
              <button class="skill-reset-button" onclick="confirmOverwriteSkillPreset()">
                上書き
              </button>
              <button class="skill-reset-button" onclick="confirmApplySkillPreset()">
                呼び出し
              </button>
            </div>
          </div>
        </div>
      `;

  skillScreenContentEl.innerHTML = `
    <div class="skill-top">
      <div class="skill-top-row">
        <div class="skill-points">${pointsLabel}</div>
        <button class="skill-reset-button" onclick="resetAllSkills()" ${
          hasAssignedSkills ? "" : "disabled"
        }>スキル一括リセット</button>
      </div>
      <div class="skill-top-row">
        <div>経験値upへ自動割り振り</div>
        <button class="skill-reset-button skill-toggle-button ${
          player.autoAssignExpSkillPoints ? "is-active" : ""
        }" onclick="toggleAutoAssignExpSkillPoints()">${autoAssignLabel}</button>
      </div>
      <div class="skill-top-row">
        <div>スキルプリセット</div>
        <div class="skill-preset-actions">
          ${presetButtonsHtml}
        </div>
      </div>
      ${summaryHtml}
    </div>
    <div class="skill-list">${skillListHtml}</div>
        <div class="skill-footer">
      <button class="scroll-top-button" onclick="closeSkillAllocation()">
        戻る
      </button>
    </div>
    ${presetDialogHtml}
  `;
}

function handleSkillPreset(index) {
  if (!Array.isArray(player.skillPresets)) {
    player.skillPresets = [null, null, null];
  }
  const preset = player.skillPresets[index];
  if (preset?.skills) {
    skillPresetDialogIndex = index;
    renderSkillScreen();
    return;
  }

  const shouldSave = confirm(
    "このスロットは空です。現在のスキル割り振りを保存しますか？",
  );
  if (shouldSave) {
    saveSkillPreset(index);
  }
}

function closeSkillPresetDialog() {
  skillPresetDialogIndex = null;
  renderSkillScreen();
}

function confirmOverwriteSkillPreset() {
  if (skillPresetDialogIndex === null) return;
  const index = skillPresetDialogIndex;
  closeSkillPresetDialog();
  saveSkillPreset(index);
}

function confirmApplySkillPreset() {
  if (skillPresetDialogIndex === null) return;
  const index = skillPresetDialogIndex;
  closeSkillPresetDialog();
  applySkillPreset(index);
}

function saveSkillPreset(index) {
  if (!Array.isArray(player.skillPresets)) {
    player.skillPresets = [null, null, null];
  }
  player.skillPresets[index] = { skills: { ...player.skills } };
  if (typeof log === "function") {
    log(`📌 スキルプリセット${index + 1}を保存しました`);
  }
  renderSkillScreen();
}

function applySkillPreset(index) {
  if (!Array.isArray(player.skillPresets)) return;
  const preset = player.skillPresets[index];
  if (!preset?.skills) return;

  const totalPoints = getSkillPointsSpent() + player.unassignedPoints;
  const presetCost = getSkillPointsSpent(preset.skills);
  if (presetCost > totalPoints) {
    alert(
      "このプリセットは現在のスキルポイント合計を超えています。ポイント獲得後に再度お試しください。",
    );
    return;
  }

  const prevMaxHp = calcMaxHp();
  player.skills = { ...preset.skills };
  player.unassignedPoints = totalPoints - presetCost;
  removeInvalidDependentSkills();
  const nextMaxHp = calcMaxHp();
  if (typeof adjustHpForMaxChange === "function") {
    adjustHpForMaxChange(prevMaxHp, nextMaxHp);
  } else if (player.hp > nextMaxHp) {
    player.hp = nextMaxHp;
  }
  refresh();
  renderSkillScreen();
  if (typeof log === "function") {
    log(`🧩 スキルプリセット${index + 1}を呼び出しました`);
  }
}

function learnSkill(skillId) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return;
  const unlockFloor = Number(skill.unlockFloor) || 0;
  if (unlockFloor && player.maxReachedFloor < unlockFloor) return;
  const current = getSkillLevel(skillId);
  if (current >= skill.maxLevel) return;
  const requiredPoints = Number(skill.requiredPoints) || 1;
  if (!hasRequiredSkills(skill)) return;
  if (hasExclusiveSkillConflict(skill)) return;
  if (player.unassignedPoints < requiredPoints) return;

  player.skills[skillId] = current + 1;
  player.unassignedPoints -= requiredPoints;
  const maxHp = calcMaxHp();
  if (player.hp > maxHp) {
    player.hp = maxHp;
  }
  refresh();
  renderSkillScreen();
}
function removeInvalidDependentSkills() {
  let didRemove = false;
  let removedThisPass = false;

  do {
    removedThisPass = false;
    SKILLS.forEach((skill) => {
      const currentLevel = getSkillLevel(skill.id);
      if (currentLevel <= 0) return;
      if (hasRequiredSkills(skill)) return;

      const requiredPoints = Number(skill.requiredPoints) || 1;
      delete player.skills[skill.id];
      player.unassignedPoints += requiredPoints * currentLevel;
      removedThisPass = true;
    });
    didRemove = didRemove || removedThisPass;
  } while (removedThisPass);
  if (ensureSecondaryWeaponSlotState()) {
    didRemove = true;
  }
  return didRemove;
}
function ensureSecondaryWeaponSlotState() {
  const canUseDualWield =
    typeof getSkillLevel === "function" && getSkillLevel("dual_wield") > 0;
  if (canUseDualWield || !player.weapon2) return false;

  const prevMaxHp = calcMaxHp();
  const removedWeapon = player.weapon2;
  player.weapon2 = null;
  const nextMaxHp = calcMaxHp();

  if (typeof adjustHpForMaxChange === "function") {
    adjustHpForMaxChange(prevMaxHp, nextMaxHp);
  } else if (player.hp > nextMaxHp) {
    player.hp = nextMaxHp;
  }

  if (typeof log === "function" && removedWeapon?.name) {
    log(`🗡 ${removedWeapon.name}を装備2から外した`);
  }

  return true;
}
function unlearnSkill(skillId) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return;
  const current = getSkillLevel(skillId);
  if (current <= 0) return;
  const requiredPoints = Number(skill.requiredPoints) || 1;
  player.skills[skillId] = current - 1;
  if (player.skills[skillId] <= 0) {
    delete player.skills[skillId];
  }
  player.unassignedPoints += requiredPoints;
  const maxHp = calcMaxHp();
  if (player.hp > maxHp) {
    player.hp = maxHp;
  }
  removeInvalidDependentSkills();
  refresh();
  renderSkillScreen();
}
function resetAllSkills() {
  if (!player.skills || Object.keys(player.skills).length === 0) return;
  const shouldReset = confirm(
    "習得済みのスキルをすべてリセットします。よろしいですか？",
  );
  if (!shouldReset) return;

  let refundedPoints = 0;
  Object.entries(player.skills).forEach(([skillId, level]) => {
    const skill = SKILLS.find((entry) => entry.id === skillId);
    if (!skill) return;
    const requiredPoints = Number(skill.requiredPoints) || 1;
    refundedPoints += requiredPoints * Number(level || 0);
  });

  player.skills = {};
  player.unassignedPoints += refundedPoints;
  const maxHp = calcMaxHp();
  if (player.hp > maxHp) {
    player.hp = maxHp;
  }
  ensureSecondaryWeaponSlotState();
  refresh();
  renderSkillScreen();
}
function resetAllSkillsSilently() {
  if (!player.skills || Object.keys(player.skills).length === 0) return 0;

  let refundedPoints = 0;
  Object.entries(player.skills).forEach(([skillId, level]) => {
    const skill = SKILLS.find((entry) => entry.id === skillId);
    if (!skill) return;
    const requiredPoints = Number(skill.requiredPoints) || 1;
    refundedPoints += requiredPoints * Number(level || 0);
  });

  player.skills = {};
  player.unassignedPoints += refundedPoints;
  const maxHp = calcMaxHp();
  if (player.hp > maxHp) {
    player.hp = maxHp;
  }
  ensureSecondaryWeaponSlotState();

  return refundedPoints;
}
function maxLearnSkill(skillId) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return;
  const unlockFloor = Number(skill.unlockFloor) || 0;
  if (unlockFloor && player.maxReachedFloor < unlockFloor) return;
  if (!hasRequiredSkills(skill)) return;
  if (hasExclusiveSkillConflict(skill)) return;

  const current = getSkillLevel(skillId);
  const maxLevel = Number.isFinite(skill.maxLevel) ? skill.maxLevel : Infinity;
  if (current >= maxLevel) return;

  const requiredPoints = Number(skill.requiredPoints) || 1;
  if (player.unassignedPoints < requiredPoints) return;

  const affordableLevels = Math.floor(player.unassignedPoints / requiredPoints);
  const remainingLevels = Number.isFinite(maxLevel)
    ? Math.max(0, maxLevel - current)
    : affordableLevels;
  const levelsToAdd = Math.min(affordableLevels, remainingLevels);
  if (levelsToAdd <= 0) return;

  player.skills[skillId] = current + levelsToAdd;
  player.unassignedPoints -= levelsToAdd * requiredPoints;
  const maxHp = calcMaxHp();
  if (player.hp > maxHp) {
    player.hp = maxHp;
  }
  refresh();
  renderSkillScreen();
}
function minUnlearnSkill(skillId) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return;
  const current = getSkillLevel(skillId);
  if (current <= 0) return;

  const requiredPoints = Number(skill.requiredPoints) || 1;
  delete player.skills[skillId];
  player.unassignedPoints += requiredPoints * current;
  const maxHp = calcMaxHp();
  if (player.hp > maxHp) {
    player.hp = maxHp;
  }
  removeInvalidDependentSkills();
  refresh();
  renderSkillScreen();
}

function toggleAutoAssignExpSkillPoints() {
  player.autoAssignExpSkillPoints = !player.autoAssignExpSkillPoints;
  if (
    player.autoAssignExpSkillPoints &&
    typeof autoAssignExpSkillPoints === "function"
  ) {
    autoAssignExpSkillPoints();
  }
  refresh();
  renderSkillScreen();
}
