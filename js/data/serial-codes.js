const serialCodeActions = {
  stayBattle: {
    isUnlocked: () => player.stayBattleUnlocked,
    unlock: () => {
      player.stayBattleUnlocked = true;
    },
    logMessage: "✨ 特殊コードを確認しました。転移に新機能が追加されました。",
  },
};
