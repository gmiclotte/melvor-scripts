export function setup({patch}) {
    patch(Game, 'getOfflineTimeDiff').replace(() => {
        const currentTime = Date.now();
        const originalTimeDiff = currentTime - game.tickTimestamp;
        const timeDiff = originalTimeDiff;
        return {timeDiff, originalTimeDiff};
    });
    // patch the max offline time message out
    loadedLangJson.MENU_TEXT.MAX_OFFLINE_TIME = ' ';
}