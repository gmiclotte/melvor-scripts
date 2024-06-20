export function setup(gameContext) {
    // Override max offline time variable
    game.MAX_OFFLINE_TIME = Infinity;

    // patch the max offline time message out
    loadedLangJson.MENU_TEXT_MAX_OFFLINE_TIME = ' ';
}