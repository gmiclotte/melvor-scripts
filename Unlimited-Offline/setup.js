export function setup(gameContext) {
    // Override max offline time variable
    game.MAX_OFFLINE_TIME = 9223372036854775807; 
    
    // patch the max offline time message out
    loadedLangJson.MENU_TEXT_MAX_OFFLINE_TIME = 'There is no maximum limit for offline time.';
}
