import {ETA} from './ETA';

export function setup(ctx: any): void {
    ctx.onInterfaceReady((_: any) => {
        ctx.api({
            ETA: new ETA(ctx),
        })
    });
}