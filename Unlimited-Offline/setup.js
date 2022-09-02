export function setup({patch}) {
    patch(Game, 'getOfflineTimeDiff').replace(() => {
        const currentTime = Date.now();
        const originalTimeDiff = currentTime - game.tickTimestamp;
        const timeDiff = originalTimeDiff;
        return {timeDiff, originalTimeDiff};
    });
}