const hasAutoSave = loadAutoSave();

if (!hasAutoSave) {
  player.hp = calcMaxHp();
  log("探索開始");
} else {
  log("💾 オートセーブをロード");
}

refresh();
