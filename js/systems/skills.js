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
  const skillListHtml = SKILLS.map((skill) => {
    const level = getSkillLevel(skill.id);
    const isMax = level >= skill.maxLevel;
    const canLearn = player.unassignedPoints > 0 && !isMax;
    const buttonLabel = level === 0 ? "習得" : "強化";
    const buttonDisabled = canLearn ? "" : "disabled";
    return `
      <div class="skill-card">
        <div class="skill-header">
          <div class="skill-title">${skill.name}</div>
          <div class="skill-level">Lv.${level}/${skill.maxLevel}</div>
        </div>
        <div class="skill-description">${skill.description}</div>
        <div class="skill-actions">
          <button class="skill-button" onclick="learnSkill('${skill.id}')" ${buttonDisabled}>${buttonLabel}</button>
        </div>
      </div>
    `;
  }).join("");

  skillScreenContentEl.innerHTML = `
    <div class="skill-points">${pointsLabel}</div>
    <div class="skill-list">${skillListHtml}</div>
  `;
}

function learnSkill(skillId) {
  if (player.unassignedPoints <= 0) return;
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return;
  const current = getSkillLevel(skillId);
  if (current >= skill.maxLevel) return;

  player.skills[skillId] = current + 1;
  player.unassignedPoints -= 1;
  log(`✨ スキル習得：${skill.name} Lv.${player.skills[skillId]}`);
  refresh();
  renderSkillScreen();
}
