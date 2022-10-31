import {ETA} from './ETA';
import {GatheringSkill} from "../../Game-Files/built/skill";
import {ArtisanSkill} from "../../Game-Files/built/artisanSkill";
import {Fletching} from "../../Game-Files/built/fletching";
import {Summoning} from "../../Game-Files/built/summoning";
import {SidebarItem} from "../../Game-Files/built/sidebar";
import {AltMagic} from "../../Game-Files/built/altMagic";
import {Fishing} from "../../Game-Files/built/fishing";
import {Firemaking} from "../../Game-Files/built/firemakingTicks";
import {Cooking} from "../../Game-Files/built/cooking";
import {Thieving} from "../../Game-Files/built/thieving2";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";


export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');

    [
        // patch GatheringSkill.startActionTimer
        {clas: GatheringSkill, method: 'startActionTimer'},
        {clas: GatheringSkill, method: 'stop'},
        // patch ArtisanSkill.selectRecipeOnClick
        {clas: ArtisanSkill, method: 'selectRecipeOnClick'},
        // patch Fishing.onAreaFishSelection
        {clas: Fishing, method: 'onAreaFishSelection'},
        // patch Firemaking.selectLog
        {clas: Firemaking, method: 'selectLog'},
        // patch Cooking.onRecipeSelectionClick
        {clas: Cooking, method: 'onRecipeSelectionClick'},
        // patch Thieving.onNPCPanelSelection
        {clas: Thieving, method: 'onNPCPanelSelection'},
        // patch selectAltRecipeOnClick
        {clas: Fletching, method: 'selectAltRecipeOnClick'},
        {clas: Summoning, method: 'selectAltRecipeOnClick'},
        // patch AltMagic
        {clas: AltMagic, method: 'selectSpellOnClick'},
        {clas: AltMagic, method: 'selectItemOnClick'},
        {clas: AltMagic, method: 'selectBarOnClick'},
    ].forEach(patch =>
        ctx.patch(patch.clas, patch.method).after(function () {
            // @ts-ignore
            const etaApi = mod.api.ETA;
            if (etaApi === undefined || etaApi.ETA === undefined) {
                return;
            }
            // @ts-ignore
            etaApi.ETA.recompute(this);
        })
    );

    // patch sidebar click
    ctx.patch(SidebarItem, 'click').after(function () {
        // @ts-ignore
        const etaApi = mod.api.ETA;
        if (etaApi === undefined || etaApi.ETA === undefined) {
            return;
        }
        // @ts-ignore
        const skill = game.openPage.action;
        // @ts-ignore
        if (skill === undefined || game.skills.getObjectByID(skill.id) === undefined) {
            // page is not a skill or is township
            return;
        }
        // @ts-ignore
        etaApi.ETA.recompute(skill);
    })

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