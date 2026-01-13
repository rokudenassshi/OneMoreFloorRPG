const SCRIPT_PATHS = [
  "js/data/items.js",
  "js/data/enemies.js",
  "js/core/dom.js",
  "js/core/state.js",
  "js/core/player.js",
  "js/systems/explore.js",
  "js/systems/battle.js",
  "js/systems/inventory.js",
  "js/ui/ui.js",
  "js/ui/status.js",
  "js/game.js",
];

const loadScript = (path) =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${path}?v=${GAME_VERSION}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error(`スクリプトの読み込みに失敗しました: ${path}`));
    document.body.appendChild(script);
  });

const loadScriptsSequentially = async () => {
  for (const path of SCRIPT_PATHS) {
    await loadScript(path);
  }
};

loadScriptsSequentially();
