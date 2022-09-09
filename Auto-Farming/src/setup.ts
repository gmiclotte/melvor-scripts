import {AutoFarming} from "./Auto-Farming";

export function setup(ctx: any) {
    ctx.onInterfaceReady(() => {
        ctx.api({
            // @ts-ignore 2304
            autoFarming: new AutoFarming(ctx, game),
        })
    });
    // @ts-ignore 2304
    ctx.patch(Farming, 'passiveTick').replace(AutoFarming.passiveTick);
}