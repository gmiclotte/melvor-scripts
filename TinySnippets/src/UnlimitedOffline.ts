import {Game} from "../../Game-Files/built/game";

export function unlimitedOffline(ctx: any) {
    ctx.patch(Game, 'getOfflineTimeDiff').replace(function () {
        // @ts-ignore
        const originalTimeDiff = Date.now() - this.tickTimestamp;
        return {timeDiff: originalTimeDiff, originalTimeDiff: originalTimeDiff};
    });
    // @ts-ignore
    // patch the max offline time message out
    loadedLangJson.MENU_TEXT.MAX_OFFLINE_TIME = ' ';
}

export const unlimitedOfflineSetting = {
    function: unlimitedOffline,
    setting: {
        type: 'switch',
        name: 'unlimitedOffline',
        label: 'Remove offline progress limit',
        hint: 'Remove offline progress limit',
        default: false,
    },
}