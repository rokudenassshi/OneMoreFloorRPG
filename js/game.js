const hasAutoSave = loadAutoSave();
const URL_ITEM_GIFT_PARAM = "gift";
const URL_ITEM_GIFT_CODE = "rokudemonai";
const URL_ITEM_GIFT_STORAGE_KEY = "roguelike_url_gift_omf80";

function createUrlGiftItem() {
  return {
    id: "url_gift_omf80",
    name: "ろくでもない贈り物",
    type: "sword",
    tier: 10,
    minFloor: 0,
    atk: 0,
    baseBonus: { power: 80, vitality: 80, agility: 80 },
    optionBonus: { power: 0, vitality: 0, agility: 0 },
    specialOptions: [],
    isLocked: true,
  };
}

function removeGiftParamFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(URL_ITEM_GIFT_PARAM)) return;
  url.searchParams.delete(URL_ITEM_GIFT_PARAM);
  window.history.replaceState({}, document.title, url.toString());
}

function claimUrlGiftItem() {
  const params = new URLSearchParams(window.location.search);
  const giftCode = params.get(URL_ITEM_GIFT_PARAM);
  if (giftCode !== URL_ITEM_GIFT_CODE) return;
  if (localStorage.getItem(URL_ITEM_GIFT_STORAGE_KEY)) {
    removeGiftParamFromUrl();
    return;
  }

  const giftItem = createUrlGiftItem();
  inventory.push(giftItem);
  localStorage.setItem(URL_ITEM_GIFT_STORAGE_KEY, "claimed");
  log("🎁 URL特典で神器を手に入れた！");
  autoSave();
  removeGiftParamFromUrl();
}
if (!hasAutoSave) {
  player.hp = calcMaxHp();
  setHerbCount(10, false);
  log("探索開始");
} else {
  log("💾 オートセーブをロード");
}

claimUrlGiftItem();
awardStatPointUnlock();
refresh();
setGameReady(true);
