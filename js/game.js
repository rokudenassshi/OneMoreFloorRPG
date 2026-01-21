const hasAutoSave = loadAutoSave();

if (!hasAutoSave) {
  player.hp = calcMaxHp();
  setHerbCount(10, false);
  log("探索開始");
} else {
  log("💾 オートセーブをロード");
}

awardStatPointUnlock();
refresh();
