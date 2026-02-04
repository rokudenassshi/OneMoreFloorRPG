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

const URL_DOUBLE_EFFECT_BONUS_PARAM = "double_effect";
const URL_DOUBLE_EFFECT_BONUS_CODE = "enabled";
const DOUBLE_EFFECT_UNLOCK_STORAGE_KEY = "omf_double_effect_bonus_v1";

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
function removeDoubleEffectBonusParamFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(URL_DOUBLE_EFFECT_BONUS_PARAM)) return;
  url.searchParams.delete(URL_DOUBLE_EFFECT_BONUS_PARAM);
  window.history.replaceState({}, document.title, url.toString());
}

function unlockDoubleEffectBonusFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const bonusCode = params.get(URL_DOUBLE_EFFECT_BONUS_PARAM);
  if (bonusCode !== URL_DOUBLE_EFFECT_BONUS_CODE) return;
  if (localStorage.getItem(DOUBLE_EFFECT_UNLOCK_STORAGE_KEY)) {
    removeDoubleEffectBonusParamFromUrl();
    return;
  }

  localStorage.setItem(DOUBLE_EFFECT_UNLOCK_STORAGE_KEY, "enabled");
  log("✅ 特別URL特典: 光り輝く装飾品の抽選強化が有効になった！");
  autoSave();
  removeDoubleEffectBonusParamFromUrl();
}
unlockDoubleEffectBonusFromUrl();
awardStatPointUnlock();
refresh();
setGameReady(true);
if (skillResetRefundedPoints > 0) {
  autoSave();
}
