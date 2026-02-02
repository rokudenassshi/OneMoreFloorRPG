const serialCodeActions = {
  stayBattle: {
    isUnlocked: () => player.stayBattleUnlocked,
    unlock: () => {
      player.stayBattleUnlocked = true;
    },
    logMessage:
      "✨ シリアルコードを確認しました。転移に新機能が追加されました。",
  },
  accessorySynthesis: {
    isUnlocked: () => player.accessorySynthesisUnlocked,
    unlock: () => {
      player.accessorySynthesisUnlocked = true;
    },
    logMessage:
      "✨ シリアルコードを確認しました。装飾品に合成機能が追加されました。",
  },
};
