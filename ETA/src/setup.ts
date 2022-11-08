import {ETA, recomputeEverySkill, recomputeSkill} from './ETA';
import type {GatheringSkill} from "../../Game-Files/gameTypes/skill";
import type {ArtisanSkill} from "../../Game-Files/gameTypes/artisanSkill";
import type {Fletching} from "../../Game-Files/gameTypes/fletching";
import type {Summoning} from "../../Game-Files/gameTypes/summoning";
import type {SidebarItem} from "../../Game-Files/gameTypes/sidebar";
import type {AltMagic} from "../../Game-Files/gameTypes/altMagic";
import type {Fishing} from "../../Game-Files/gameTypes/fishing";
import type {Firemaking} from "../../Game-Files/gameTypes/firemakingTicks";
import type {Cooking} from "../../Game-Files/gameTypes/cooking";
import type {Thieving} from "../../Game-Files/gameTypes/thieving2";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";

export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');

    [
        // patch GatheringSkill.startActionTimer
        // @ts-ignore
        {clas: GatheringSkill, method: 'startActionTimer'},
        // @ts-ignore
        {clas: GatheringSkill, method: 'stop'},
        // patch ArtisanSkill.selectRecipeOnClick
        // @ts-ignore
        {clas: ArtisanSkill, method: 'selectRecipeOnClick'},
        // patch Fishing.onAreaFishSelection
        // @ts-ignore
        {clas: Fishing, method: 'onAreaFishSelection'},
        // patch Firemaking.selectLog
        // @ts-ignore
        {clas: Firemaking, method: 'selectLog'},
        // patch Cooking.onRecipeSelectionClick
        // @ts-ignore
        {clas: Cooking, method: 'onRecipeSelectionClick'},
        // patch Thieving.onNPCPanelSelection
        // @ts-ignore
        {clas: Thieving, method: 'onNPCPanelSelection'},
        // patch selectAltRecipeOnClick
        // @ts-ignore
        {clas: Fletching, method: 'selectAltRecipeOnClick'},
        // @ts-ignore
        {clas: Summoning, method: 'selectAltRecipeOnClick'},
        // patch AltMagic
        // @ts-ignore
        {clas: AltMagic, method: 'selectSpellOnClick'},
        // @ts-ignore
        {clas: AltMagic, method: 'selectItemOnClick'},
        // @ts-ignore
        {clas: AltMagic, method: 'selectBarOnClick'},
    ].forEach(patch => {
        ctx.patch(patch.clas, patch.method).after(function () {
            // @ts-ignore
            recomputeSkill(this);
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

export function testup(mod: any, game: Game): any {
    // clean up existing UI elements
    // @ts-ignore
    if (window.eta && window.eta.displayManager) {
        // @ts-ignore
        window.eta.displayManager.removeAllDisplays();
    }
    const settings = new Settings(mod.getDevContext(), game);
    const eta = new ETA(mod.getDevContext(), settings, game, 'Dev');
    // @ts-ignore
    window.eta = eta;

    // mining
    {
        let skill = game.mining;
        // initial compute
        eta.recompute(skill);
        skill.startActionTimer = () => {
            if (!skill.activeRock.isRespawning && skill.activeRock.currentHP > 0) {
                skill.actionTimer.start(skill.actionInterval);
                skill.renderQueue.progressBar = true;
            }
            eta.recompute(skill);
        }
    }

    // thieving
    {
        let skill = game.thieving;
        // initial compute
        eta.recompute(skill);
        skill.startActionTimer = () => {
            // Override to prevent action timer starting when stunned
            if (!(skill.stunState === 1 /* ThievingStunState.Stunned */)) {
                skill.actionTimer.start(skill.actionInterval);
                skill.renderQueue.progressBar = true;
            }
            eta.recompute(skill);
        }
    }

    // skills with generic startActionTimer
    [
        game.woodcutting,
        game.fishing,
        game.firemaking,
        game.cooking,
        // mining is handled separately
        game.smithing,
        // thieving is handled separately
        game.fletching,
        game.crafting,
        game.runecrafting,
        game.herblore,
        game.agility,
        game.summoning,
        game.astrology,
        game.altMagic,
    ].forEach((skill: any) => {
        // initial compute
        eta.recompute(skill);
        skill.startActionTimer = () => {
            skill.actionTimer.start(skill.actionInterval);
            skill.renderQueue.progressBar = true;
            eta.recompute(skill);
        }
    });

    // return eta object
    return eta;
}