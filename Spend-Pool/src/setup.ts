import {SpendPool} from './SpendPool';

export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');

    // create SpendPool object
    ctx.onInterfaceReady((_: any) => {
        ctx.api({
            // @ts-ignore
            SpendPool: new SpendPool(ctx, game, exp),
        })
    });
}
