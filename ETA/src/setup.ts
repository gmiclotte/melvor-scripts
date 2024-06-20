import {ETA, recomputeEverySkill, recomputeSkill} from './ETA';
import type {GatheringSkill} from "../../Game-Files/gameTypes/skill";
import type {SidebarItem} from "../../Game-Files/gameTypes/sidebar";
import {Settings} from "./Settings";

export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');

    [
        // patch GatheringSkill.startActionTimer
        // @ts-ignore
        {clas: GatheringSkill, method: 'startActionTimer', throttle: true},
        // @ts-ignore
        {clas: GatheringSkill, method: 'stop', throttle: false},
        // patch ArtisanSkill.selectRecipeOnClick
        // @ts-ignore
        {clas: ArtisanSkill, method: 'selectRecipeOnClick', throttle: false},
        // patch Fishing.onAreaFishSelection
        // @ts-ignore
        {clas: Fishing, method: 'onAreaFishSelection', throttle: false},
        // patch Firemaking.selectLog
        // @ts-ignore
        {clas: Firemaking, method: 'selectLog', throttle: false},
        // patch Cooking.onRecipeSelectionClick
        // @ts-ignore
        {clas: Cooking, method: 'onRecipeSelectionClick', throttle: false},
        // patch Thieving.onNPCPanelSelection
        // @ts-ignore
        {clas: Thieving, method: 'onNPCPanelSelection', throttle: false},
        // patch selectAltRecipeOnClick
        // @ts-ignore
        {clas: Fletching, method: 'selectAltRecipeOnClick', throttle: false},
        // @ts-ignore
        {clas: Summoning, method: 'selectNonShardCostOnClick', throttle: false},
        // patch AltMagic
        // @ts-ignore
        {clas: AltMagic, method: 'selectSpellOnClick', throttle: false},
        // @ts-ignore
        {clas: AltMagic, method: 'selectItemOnClick', throttle: false},
        // @ts-ignore
        {clas: AltMagic, method: 'selectBarOnClick', throttle: false},
    ].forEach(patch => {
        ctx.patch(patch.clas, patch.method).after(function () {
            // @ts-ignore
            recomputeSkill(this, patch.throttle);
        });
    });

    // patch sidebar click
    // @ts-ignore
    ctx.patch(SidebarItem, 'click').after(recomputeEverySkill)

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
