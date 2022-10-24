import {ETA} from './ETA';
import {GatheringSkill} from "../../Game-Files/built/skill";
import {Settings} from "./Settings";

export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');
    // patch GatheringSkill.startActionTimer
    ctx.patch(GatheringSkill, 'startActionTimer').after(function () {
        // @ts-ignore
        const etaApi = mod.api.ETA;
        if (etaApi === undefined || etaApi.ETA === undefined) {
            return;
        }
        // @ts-ignore
        etaApi.ETA.recompute(this);
    });
    // create settings -> outside of hooks !
    // @ts-ignore
    const settings = new Settings(ctx, game);

    // create ETA object
    ctx.onInterfaceReady((_: any) => {
        ctx.api({
            // @ts-ignore
            ETA: new ETA(ctx, settings, game),
        })
    });
}