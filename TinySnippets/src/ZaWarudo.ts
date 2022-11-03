import {Game} from "../../Game-Files/built/game";

const zaWarudo = 'zaWarudo';

export function pauseOfflineProgress(ctx: any) {
    ctx.patch(Game, 'processOffline').replace(function (
        this: Game,
        original: () => Promise<any>,
        proceed = false,
    ) {
        if (proceed) {
            return original();
        }
        return new Promise((resolve: any) => {
            // get offline time and update tickTimestamp
            // @ts-ignore
            const offlineTime = this.getOfflineTimeDiff().timeDiff;
            // @ts-ignore
            this.tickTimestamp = Date.now();
            // add offline time to stored offline time
            const storedTime = ctx.characterStorage.getItem(zaWarudo) ?? 0;
            ctx.characterStorage.setItem(zaWarudo, storedTime + offlineTime);
            // @ts-ignore
            console.log(`Found ${formatAsSHTimePeriod(storedTime)}, `
                // @ts-ignore
                + `added ${formatAsSHTimePeriod(offlineTime)}, `
                // @ts-ignore
                + `stored ${formatAsSHTimePeriod(ctx.characterStorage.getItem(zaWarudo))}`);
            resolve();
            return;
        });
    });

    ctx.patch(Game, 'testForOffline').replace(function (
        this: Game,
        original: (timeToGoBack: number) => void,
        msToGoBack: number | undefined,
    ) {
        // get the stored MS
        const storedMS: number = ctx.characterStorage.getItem(zaWarudo) ?? 0;
        if (msToGoBack === undefined) {
            msToGoBack = storedMS;
        }
        msToGoBack = Math.min(storedMS, msToGoBack);
        msToGoBack = Math.max(0, msToGoBack);
        ctx.characterStorage.setItem(zaWarudo, storedMS - msToGoBack);
        // @ts-ignore
        console.log(`progress ${formatAsSHTimePeriod(msToGoBack)}, `
            // @ts-ignore
            + `${formatAsSHTimePeriod(ctx.characterStorage.getItem(zaWarudo))} remaining`);
        // convert to hours
        // @ts-ignore
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            this.stopMainLoop();
            // @ts-ignore
            this.tickTimestamp -= msToGoBack;
            // @ts-ignore
            saveData('all');
            // @ts-ignore
            yield this.processOffline(true);
            // @ts-ignore
            this.startMainLoop();
        });
    });
}

export const pauseOfflineProgressSetting = {
    function: pauseOfflineProgress,
    setting: {
        type: 'switch',
        name: zaWarudo,
        label: 'Pause offline progress',
        hint: 'Pause offline progress',
        default: false,
    },
}