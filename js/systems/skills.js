let skillReturnState = "EXPLORE";

function getSkillLevel(skillId) {
  return Number(player.skills?.[skillId]) || 0;
}
function hasRequiredSkills(skill) {
  const requirements = Array.isArray(skill?.requires) ? skill.requires : [];
  return requirements.every(
    (requirement) => getSkillLevel(requirement.id) >= (requirement.level || 1),
  );
}
function getSkillEffects() {
  const total = {
    herbHealBoost: 0,
    herbCapacityBoost: 0,
    herbBattleReward: 0,
    lifeSteal: 0,
    reflect: 0,
    reflectBoost: 0,
    evadeBoost: 0,
    evadeCounter: 0,
    minHits: 0,
    agilityAttackRate: 0,
    vitalityAttackRate: 0,
    expBoost: 0,
    rareEncounterBoost: 0,
    powerRate: 0,
    vitalityRate: 0,
    agilityRate: 0,
    guts: 0,
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

  skillScreenEl.style.display = "block";
  renderSkillScreen();
}

function closeSkillAllocation() {
  gameState = skillReturnState || "EXPLORE";
  skillScreenEl.style.display = "none";

  if (gameState === "STATUS") {
    statusScreenEl.style.display = "block";
    renderStatus();
    return;
  }

  exploreButtons.style.display = gameState === "EXPLORE" ? "block" : "none";
  battleButtons.style.display = gameState === "BATTLE" ? "block" : "none";

  refresh();
}

function renderSkillScreen() {
  if (!skillScreenContentEl) return;

  const pointsLabel = `スキルポイント：${player.unassignedPoints}`;
  const hasAssignedSkills =
    player.skills && Object.keys(player.skills).length > 0;

  // （任意）合計効果を上に出す：すでに getSkillEffects() があるので活用
  const total = getSkillEffects();
  const summaryItems = [];
  if (total.expBoost > 0) {
    summaryItems.push(`<div>獲得経験値：+${Math.floor(total.expBoost)}%</div>`);
  }
  if (total.rareEncounterBoost > 0) {
    summaryItems.push(
      `<div>レアモンスター遭遇率：+${Math.floor(total.rareEncounterBoost)}%</div>`,
    );
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
  if (total.minHits > 0) {
    summaryItems.push(
      `<div>連続攻撃の最低ヒット数：+${Math.floor(total.minHits)}</div>`,
    );
  }
  if (total.vitalityAttackRate > 0) {
    summaryItems.push("<div>シールドバッシュ</div>");
  }
  if (total.agilityAttackRate > 0) {
    summaryItems.push("<div>スピードアタック</div>");
  }
  if (total.powerRate !== 0) {
    summaryItems.push("<div>二刀流</div>");
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

  const skillListHtml = SKILLS.map((skill) => {
    const level = getSkillLevel(skill.id);
    const isMax = Number.isFinite(skill.maxLevel)
      ? level >= skill.maxLevel
      : false;
    const requiredPoints = Number(skill.requiredPoints) || 1;
    const requirements = Array.isArray(skill.requires) ? skill.requires : [];
    const hasRequirements = hasRequiredSkills(skill);

    const canLearn =
      player.unassignedPoints >= requiredPoints && !isMax && hasRequirements;
    const canMax =
      player.unassignedPoints >= requiredPoints && !isMax && hasRequirements;
    const canMin = level > 0;
    const canDecrease = level > 0;
    const maxLevelLabel = Number.isFinite(skill.maxLevel)
      ? skill.maxLevel
      : "∞";
    const requirementLabel = requirements.length
      ? `前提：${requirements
          .map((requirement) => {
            const requiredSkill = SKILLS.find(
              (entry) => entry.id === requirement.id,
            );
            return requiredSkill ? requiredSkill.name : requirement.id;
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
        <div class="skill-footer">
          <div class="skill-hint">${
            isMax
              ? "MAX"
              : !hasRequirements
                ? "前提スキル不足"
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
  }).join("");

  skillScreenContentEl.innerHTML = `
    <div class="skill-top">
      <div class="skill-top-row">
        <div class="skill-points">${pointsLabel}</div>
        <button class="skill-reset-button" onclick="resetAllSkills()" ${
          hasAssignedSkills ? "" : "disabled"
        }>スキル一括リセット</button>
      </div>
      ${summaryHtml}
    </div>
    <div class="skill-list">${skillListHtml}</div>
  `;
}

function learnSkill(skillId) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return;
  const current = getSkillLevel(skillId);
  if (current >= skill.maxLevel) return;
  const requiredPoints = Number(skill.requiredPoints) || 1;
  if (!hasRequiredSkills(skill)) return;
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

  return didRemove;
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
  refresh();
  renderSkillScreen();
}
function maxLearnSkill(skillId) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return;
  if (!hasRequiredSkills(skill)) return;

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
