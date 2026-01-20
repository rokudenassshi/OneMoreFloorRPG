const ENABLE_ONE_TIME_CACHE_CLEAR = true;
const cacheClearOnceKey = "roguelike_cache_cleared_once";
const resetVersionKey = "roguelike_reset_version";

function clearGameCacheOnce() {
  if (!ENABLE_ONE_TIME_CACHE_CLEAR) return;
  const storedResetVersion = Number(localStorage.getItem(resetVersionKey));
  if (storedResetVersion === GAME_RESET_VERSION) return;

  localStorage.setItem(resetVersionKey, String(GAME_RESET_VERSION));
  localStorage.setItem(cacheClearOnceKey, String(Date.now()));
  localStorage.removeItem(autosaveKey);
  localStorage.removeItem(discardThresholdsKey);
  localStorage.removeItem(cacheClearOnceKey);
}

clearGameCacheOnce();

const hasAutoSave = loadAutoSave();

if (!hasAutoSave) {
  player.hp = calcMaxHp();
  log("探索開始");
} else {
  log("💾 オートセーブをロード");
}

awardStatPointUnlock();
refresh();
