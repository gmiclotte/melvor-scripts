import type {Game} from "../../Game-Files/gameTypes/game";

export function unlimitedOffline(ctx: any) {
    // @ts-ignore
    ctx.patch(Game, 'getOfflineTimeDiff').replace(function () {
        // @ts-ignore
        const originalTimeDiff = Date.now() - this.tickTimestamp;
        return {timeDiff: originalTimeDiff, originalTimeDiff: originalTimeDiff};
    });
    // @ts-ignore
    // patch the max offline time message out, it needs to be at least 1 character long
    loadedLangJson.MENU_TEXT_MAX_OFFLINE_TIME = ' ';
}

export const unlimitedOfflineSetting = {
    object: null,
    function: unlimitedOffline,
    setting: {
        type: 'switch',
        name: 'unlimitedOffline',
        label: 'Remove offline progress limit',
        hint: 'Remove offline progress limit',
        default: false,
    },
    toggles: [],
}