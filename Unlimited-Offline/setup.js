export function setup({patch}) {
    patch(Game, 'getOfflineTimeDiff').replace(function() {
        const originalTimeDiff = Date.now() - this.tickTimestamp;
        return {timeDiff: originalTimeDiff, originalTimeDiff: originalTimeDiff};
    });
    // patch the max offline time message out
    loadedLangJson.MENU_TEXT_MAX_OFFLINE_TIME = ' ';
}
