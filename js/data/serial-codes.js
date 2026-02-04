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
  doubleEffectBonus: {
    isUnlocked: () =>
      localStorage.getItem("omf_double_effect_bonus_v1") === "enabled",
    unlock: () => {
      localStorage.setItem("omf_double_effect_bonus_v1", "enabled");
    },
    logMessage:
      "✨ シリアルコードを確認しました。光り輝く装飾品の抽選強化が有効になった！",
  },
};
