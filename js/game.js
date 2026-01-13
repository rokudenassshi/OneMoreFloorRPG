const hasAutoSave = loadAutoSave();

if (!hasAutoSave) {
  player.hp = calcMaxHp();
  log("探索開始");
} else {
  log("💾 オートセーブをロード");
  if (reloadPenalty) {
    log(`⚠ 戦闘中リロードのペナルティで階層が${reloadPenaltyFloorLoss}戻った`);
  }
}

refresh();
