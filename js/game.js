const hasAutoSave = loadAutoSave();
const URL_ITEM_GIFT_PARAM = "gift";
const URL_ITEM_GIFT_CODE = "rokudemonai";
const URL_ITEM_GIFT_STORAGE_KEY = "11";
const SKILL_RESET_ONCE_KEY = "skill_reset_once_v1";

const URL_ITEM_GIFT_PARAM2 = "gift";
const URL_ITEM_GIFT_CODE2 = "owabi";
const URL_ITEM_GIFT_STORAGE_KEY2 = "11";

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
function createUrlGiftItem2() {
  return {
    id: "url_gift_omf",
    name: "ろくでもないお詫び",
    type: "sword",
    tier: 10,
    minFloor: 0,
    atk: 0,
    baseBonus: { power: 50, vitality: 50, agility: 50 },
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
function removeGiftParamFromUrl2() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(URL_ITEM_GIFT_PARAM2)) return;
  url.searchParams.delete(URL_ITEM_GIFT_PARAM2);
  window.history.replaceState({}, document.title, url.toString());
}

function claimUrlGiftItem2() {
  const params = new URLSearchParams(window.location.search);
  const giftCode = params.get(URL_ITEM_GIFT_PARAM2);
  if (giftCode !== URL_ITEM_GIFT_CODE2) return;
  if (localStorage.getItem(URL_ITEM_GIFT_STORAGE_KEY2)) {
    removeGiftParamFromUrl2();
    return;
  }

  const giftItem = createUrlGiftItem2();
  inventory.push(giftItem);
  localStorage.setItem(URL_ITEM_GIFT_STORAGE_KEY2, "claimed");
  log("🎁 URL特典で神器を手に入れた！");
  autoSave();
  removeGiftParamFromUrl2();
}
claimUrlGiftItem();
claimUrlGiftItem2();
awardStatPointUnlock();
refresh();
setGameReady(true);
if (skillResetRefundedPoints > 0) {
  autoSave();
}
