const functions = require("firebase-functions");

const serialCodeLookup = {
  unlockrokudemonaistay: "stayBattle",
};

exports.verifySerialCode = functions.https.onCall((data) => {
  const code = String(data?.code || "")
    .trim()
    .toLowerCase();
  if (!code) {
    return { ok: false };
  }
  const unlock = serialCodeLookup[code];
  if (!unlock) {
    return { ok: false };
  }
  return { ok: true, unlock };
});
