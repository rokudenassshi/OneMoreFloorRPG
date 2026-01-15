let skillReturnState = "EXPLORE";

function getSkillLevel(skillId) {
  return Number(player.skills?.[skillId]) || 0;
}

function getSkillEffects() {
  const total = {
    maxHp: 0,
    attack: 0,
    evadeRate: 0,
    expBoost: 0,
    minHits: 0,
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

  const pointsLabel = `未使用スキルポイント：${player.unassignedPoints}`;

  // （任意）合計効果を上に出す：すでに getSkillEffects() があるので活用
  const total = getSkillEffects();
  const summaryHtml = `
    <div class="skill-summary">
      <div class="skill-summary-title">合計効果</div>
      <div class="skill-summary-grid">
        <div>最大HP：+${total.maxHp}</div>
        <div>攻撃力：+${total.attack}</div>
        <div>回避率：+${total.evadeRate}%</div>
        <div>EXP：+${total.expBoost}%</div>
      </div>
    </div>
  `;

  const skillListHtml = SKILLS.map((skill) => {
    const level = getSkillLevel(skill.id);
    const isMax = level >= skill.maxLevel;
    const requiredPoints = Number(skill.requiredPoints) || 1;

    const canLearn = player.unassignedPoints >= requiredPoints && !isMax;
    const canDecrease = level > 0;

    const progressPct = Math.round((level / skill.maxLevel) * 100);

    return `
      <div class="skill-card ${canLearn ? "is-affordable" : ""} ${
      isMax ? "is-max" : ""
    }">
        <div class="skill-header">
          <div class="skill-title">${skill.name}</div>

          <div class="skill-meta">
            <span class="skill-badge">必要 ${requiredPoints}pt</span>
            <span class="skill-level">Lv.${level}/${skill.maxLevel}</span>
          </div>
        </div>

        <div class="skill-description">${skill.description}</div>

        <div class="skill-progress" aria-hidden="true">
          <div class="skill-progress-bar" style="width:${progressPct}%"></div>
        </div>

        <div class="skill-footer">
          <div class="skill-hint">${
            isMax ? "MAX" : canLearn ? "習得可能" : "ポイント不足"
          }</div>

          <div class="skill-actions">
            <button class="skill-btn" onclick="learnSkill('${skill.id}')" ${
      canLearn ? "" : "disabled"
    }>＋</button>
            <button class="skill-btn" onclick="unlearnSkill('${skill.id}')" ${
      canDecrease ? "" : "disabled"
    }>−</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  skillScreenContentEl.innerHTML = `
    <div class="skill-top">
      <div class="skill-points">${pointsLabel}</div>
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
  if (player.unassignedPoints < requiredPoints) return;

  player.skills[skillId] = current + 1;
  player.unassignedPoints -= requiredPoints;
  log(`✨ スキル習得：${skill.name} Lv.${player.skills[skillId]}`);
  refresh();
  renderSkillScreen();
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
  log(`🔄 スキル取り消し：${skill.name} Lv.${Math.max(current - 1, 0)}`);
  refresh();
  renderSkillScreen();
}
