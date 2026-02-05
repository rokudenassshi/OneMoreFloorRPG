const PENDING_IMPORT_KEY = "omf_pending_import_v1";

function applyPendingImportIfAny() {
  const payload = localStorage.getItem(PENDING_IMPORT_KEY);
  if (!payload) return;

  try {
    const parsed = JSON.parse(payload);
    const storage = parsed?.storage;

    if (!storage || typeof storage !== "object") {
      localStorage.removeItem(PENDING_IMPORT_KEY);
      return;
    }

    // ここで確実に上書き
    localStorage.clear();
    for (const [k, v] of Object.entries(storage)) {
      if (typeof k !== "string") continue;
      localStorage.setItem(k, v == null ? "" : String(v));
    }
  } catch (e) {
    // 壊れてたら無視
  } finally {
    // clearで消えてる可能性があるので最後にremove
    try {
      localStorage.removeItem(PENDING_IMPORT_KEY);
    } catch (e) {}
  }
}

applyPendingImportIfAny();

// ★この行は「applyPendingImportIfAny() の後」にする
const hasAutoSave = loadAutoSave();

const SKILL_RESET_ONCE_KEY = "skill_reset_once_v1";
let skillResetRefundedPoints = 0;
if (!localStorage.getItem(SKILL_RESET_ONCE_KEY)) {
  skillResetRefundedPoints = resetAllSkillsSilently();
  localStorage.setItem(SKILL_RESET_ONCE_KEY, "done");
}
if (!hasAutoSave) {
  player.hp = calcMaxHp();
  setHerbCount(10, false);
  log("探索開始");
} else {
  log("💾 オートセーブをロード");
}
if (skillResetRefundedPoints > 0) {
  log("🔁 起動時スキルリセットを実行しました");
}

awardStatPointUnlock();
refresh();
setGameReady(true);
if (skillResetRefundedPoints > 0) {
  autoSave();
}
