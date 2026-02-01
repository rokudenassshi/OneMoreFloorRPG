const functions = require("firebase-functions");

// ✅ ここに “シリアルコード → 解放キー” を置く（クライアントには公開しない）
const serialCodeLookup = {
  unlockrokudemonaistay: "stayBattle",
  // 追加するならここに
};

exports.verifySerialCode = functions
  .region("us-central1")
  .https.onCall((data) => {
    const code = String(data?.code || "")
      .trim()
      .toLowerCase();
    if (!code) return { ok: false, message: "empty" };

    const unlock = serialCodeLookup[code];
    if (!unlock) return { ok: false, message: "invalid" };

    return { ok: true, unlock };
  });
