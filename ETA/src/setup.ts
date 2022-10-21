import {ETA} from './ETA';

export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');
    // create ETA object
    ctx.onInterfaceReady((_: any) => {
        ctx.api({
            // @ts-ignore
            ETA: new ETA(ctx, game),
        })
    });
}