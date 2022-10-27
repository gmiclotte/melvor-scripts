import {Card} from "../../TinyMod/src/Card";
import {TabCard} from "../../TinyMod/src/TabCard";
import {TinyMod} from "../../TinyMod/src/TinyMod";
import {EtaSkill, etaSkillConstructor} from "./EtaSkill"
import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {Game} from "../../Game-Files/built/game";
import {EtaFishing} from "./EtaFishing";
import {EtaMining} from "./EtaMining";
import {DisplayManager} from "./DisplayManager";
import {Settings} from "./Settings";
import {EtaCrafting} from "./EtaCrafting";
import {EtaSmithing} from "./EtaSmithing";
import {EtaFletching} from "./EtaFletching";
import {EtaRunecrafting} from "./EtaRunecrafting";
import {EtaHerblore} from "./EtaHerblore";
import {EtaSummoning} from "./EtaSummoning";
import {EtaFiremaking} from "./EtaFiremaking";
import {MasteryAction} from "../../Game-Files/built/mastery2";
import {ThievingArea, ThievingNPC} from "../../Game-Files/built/thieving2";
import {EtaWoodcutting} from "./EtaWoodcutting";
import {EtaCooking} from "./EtaCooking";
import {EtaThieving} from "./EtaThieving";
import {EtaMagic} from "./EtaMagic";
import {MultiActionSkill} from "./MultiActionSkill";
import {MultiWoodcutting} from "./MultiWoodcutting";
import {EtaAgility} from "./EtaAgility";
import {MultiAgility} from "./MultiAgility";

export class ETA extends TinyMod {
    public readonly artisanSkills: SkillWithMastery<MasteryAction, MasterySkillData>[];
    private readonly game: Game;
    private readonly settings: Settings;
    private readonly nameSpace: string;
    private togglesCard!: Card;
    private skillTargetCard!: TabCard;
    private globalTargetsCard!: Card;
    private skillCalculators: Map<string, Map<string, EtaSkill>>;
    private skillMultiCalculators: Map<string, MultiActionSkill>;
    private displayManager: DisplayManager;
    private npcAreaMap: Map<string, ThievingArea>;

    constructor(ctx: any, settings: Settings, game: Game, tag: string = 'ETA') {
        super(ctx, tag);
        this.game = game;
        this.log('Loading...');

        // initialize settings
        this.settings = settings;
        this.createSettingsMenu();

        // initialize fields
        this.nameSpace = 'eta';
        this.skillCalculators = new Map<string, Map<string, EtaSkill>>();
        this.skillMultiCalculators = new Map<string, MultiActionSkill>();
        this.npcAreaMap = new Map<string, ThievingArea>();
        game.thieving.areas.forEach((area: ThievingArea) =>
            // @ts-ignore
            area.npcs.map((npc: ThievingNPC) => this.npcAreaMap.set(npc.id, area))
        );
        this.displayManager = new DisplayManager(game, this.settings, this.npcAreaMap);
        this.artisanSkills = [
            this.game.firemaking,
            this.game.cooking,
            this.game.smithing,
            this.game.fletching,
            this.game.crafting,
            this.game.runecrafting,
            this.game.herblore,
            this.game.summoning,
        ];

        // add skills
        this.addSkillCalculators(EtaWoodcutting, game.woodcutting);
        this.addSkillCalculators(EtaFishing, game.fishing);
        this.addSkillCalculators(EtaFiremaking, game.firemaking);
        this.addSkillCalculators(EtaCooking, game.cooking);
        this.addSkillCalculators(EtaMining, game.mining);
        this.addSkillCalculators(EtaSmithing, game.smithing);
        this.addSkillCalculators(EtaThieving, game.thieving);
        // Farming not included
        this.addSkillCalculators(EtaFletching, game.fletching);
        this.addSkillCalculators(EtaCrafting, game.crafting);
        this.addSkillCalculators(EtaRunecrafting, game.runecrafting);
        this.addSkillCalculators(EtaHerblore, game.herblore);
        this.addSkillCalculators(EtaAgility, game.agility);
        this.addSkillCalculators(EtaSummoning, game.summoning);
        // TODO this.addSkillCalculators(EtaAstrology, game.astrology);
        // Township not included
        this.addSkillCalculators(EtaMagic, game.altMagic);

        // we made it
        this.log('Loaded!');
    }

    static testup(mod: any, game: Game): any {
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
            // game.astrology,
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

    addSkillCalculators(constructor: etaSkillConstructor, skill: SkillWithMastery<MasteryAction, MasterySkillData>) {
        const skillMap = new Map<string, EtaSkill>();
        skill.actions.forEach((action: any) => {
            skillMap.set(action.id, new constructor(this.game, skill, action, this.settings));
            this.displayManager.getDisplay(skill, action.id);
        });
        this.skillCalculators.set(skill.name, skillMap);
    }

    recompute(skill: SkillWithMastery<MasteryAction, MasterySkillData>) {
        setTimeout(() => {
            skill.actions.forEach((action: any) => {
                if (!this.skipAction(skill, action)) {
                    this.displayManager.injectHTML(this.timeRemaining(skill, action), new Date());
                } else {
                    this.displayManager.hideHTML(skill, action.id);
                }
            });
            let actions: any[];
            switch (skill.name) {
                case this.game.woodcutting.name:
                    actions = [...this.game.woodcutting.activeTrees];
                    break;
                case this.game.agility.name:
                    actions = [];
                    for (let i = 0; i < this.game.agility.builtObstacles.size; i++) {
                        const obstacle = this.game.agility.builtObstacles.get(i);
                        if (obstacle === undefined) {
                            break;
                        }
                        actions.push(obstacle);
                    }
                    break;
                default:
                    return;
            }
            if (!this.skipMultiAction(skill, actions)) {
                this.displayManager.getDisplay(skill);
                this.displayManager.injectHTML(this.multiTimeRemaining(skill, actions), new Date());
            } else {
                this.displayManager.hideHTML(skill);
            }
        });
    }

    skipAction(skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any): boolean {
        // compute all actions for woodcutting and mining
        if ([
            this.game.woodcutting.name,
            this.game.mining.name,
        ].includes(skill.name)) {
            return false;
        }
        // only compute selected obstacles for agility
        if (skill.name === this.game.agility.name) {
            const built = this.game.agility.builtObstacles.get(action.category);
            return built === undefined || built.id !== action.id;
        }
        // only compute selected spell for magic
        if (skill.name === this.game.altMagic.name) {
            return this.game.altMagic.selectedSpell === undefined
                || this.game.altMagic.activeSpell !== action;
        }
        // only compute selected actions for thieving
        if (skill.name === this.game.thieving.name) {
            const area = this.npcAreaMap.get(action.id);
            // @ts-ignore
            return thievingMenu.areaPanels.get(area).selectedNPC !== action;
        }
        // only compute selected actions for cooking
        if (skill.name === this.game.cooking.name) {
            return this.game.cooking.selectedRecipes.get(action.category) !== action;
        }
        // only compute selected actions for fishing
        if (skill.name === this.game.fishing.name) {
            const calculators = this.skillCalculators.get(skill.name);
            if (calculators === undefined) {
                return true;
            }
            const calculator = calculators.get(action.id);
            if (calculator === undefined) {
                return true;
            }
            const fish = this.game.fishing.selectedAreaFish.get((calculator as EtaFishing).area);
            if (fish === undefined) {
                return true;
            }
            return fish.id !== action.id;
        }
        // remainder of artisan skills
        if (this.artisanSkills.includes(skill)) {
            // @ts-ignore
            return skill.selectedRecipe === undefined || skill.activeRecipe.id !== action.id;
        }
        // unknown skill, skip
        return true;
    }

    skipMultiAction(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actions: any[]): boolean {
        if (skill.name === this.game.woodcutting.name) {
            return actions.length < 1;
        }
        if (skill.name === this.game.agility.name) {
            return this.game.agility.builtObstacles.get(0) === undefined;
        }
        return true;
    }

    timeRemaining(skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any): any {
        // get current state of the skill
        // @ts-ignore
        const current = this.skillCalculators.get(skill.name).get(action.id);
        if (current === undefined) {
            this.warn(`Skill ${skill.name} Action ${action.name} is not implemented in ETA.`);
            return undefined;
        }
        // compute the targets
        current.targets = current.getTargets(this.settings);
        current.iterate(this.game);
        return current;
    }

    multiTimeRemaining(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actions: any[]): any {
        // get current state of the skill
        let current;
        if (skill.name === this.game.woodcutting.name) {
            current = new MultiWoodcutting(this.game, this.game.woodcutting, actions, this.settings);
        } else if (skill.name === this.game.agility.name) {
            current = new MultiAgility(this.game, this.game.agility, actions, this.settings);
        } else {
            return;
        }
        this.skillMultiCalculators.set(skill.name, current);
        // compute the targets
        current.targets = current.getTargets(this.settings);
        current.iterate(this.game);
        return current;
    }

    createSettingsMenu(): void {
        super.createSettingsMenu([
            // add toggles card
            () => this.addToggles(),
            // add global target card
            () => this.addGlobalTargetInputs(),
            // add target card
            () => this.addTargetInputs(),
        ]);
    }

    addToggles(): void {
        this.togglesCard = new Card(this.tag, this.content, '', '150px', true);
        const titles = new Map<string, string>()
        titles.set('IS_12H_CLOCK', 'Use 12h clock');
        titles.set('SHOW_XP_RATE', 'Show XP rates');
        titles.set('SHOW_ACTION_TIME', 'Show action times');
        titles.set('UNCAP_POOL', 'Show pool past 100%');
        titles.set('CURRENT_RATES', 'Show current rates');
        titles.forEach((value, key) => {
            this.togglesCard.addToggleRadio(
                value,
                key,
                this.settings,
                key,
                this.settings.get(key),
            );
        });
    }

    addGlobalTargetInputs() {
        this.globalTargetsCard = new Card(this.tag, this.content, '', '150px', true);
        [
            {id: 'LEVEL', label: 'Global level targets', defaultValue: [99]},
            {id: 'MASTERY', label: 'Global mastery targets', defaultValue: [99]},
            {id: 'POOL', label: 'Global pool targets (%)', defaultValue: [100]},
        ].forEach(target => {
            const globalKey = 'GLOBAL_TARGET_' + target.id;
            this.globalTargetsCard.addNumberArrayInput(
                target.label,
                this.settings,
                globalKey,
                target.defaultValue,
                () => this.settings.get(globalKey),
                (_: any, __: string, result: any) => this.settings.set(globalKey, result),
            );
        });

    }

    addTargetInputs() {
        this.skillTargetCard = new TabCard('EtaTarget', true, this.tag, this.content, '', '150px', true);
        this.settings.skillList.forEach((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => {
            const card = this.skillTargetCard.addTab(skill.name, skill.media, '', '150px', undefined);
            card.addSectionTitle(skill.name + ' Targets');
            [
                {id: 'LEVEL', label: 'Level targets'},
                {id: 'MASTERY', label: 'Mastery targets'},
                {id: 'POOL', label: 'Pool targets (%)'},
            ].forEach(target => {
                const key = 'TARGET_' + target.id;
                card.addNumberArrayInput(
                    target.label,
                    this.settings,
                    skill.name,
                    [],
                    () => this.settings.get(key, skill.name),
                    (_: any, __: string, result: any) => this.settings.set(key, result, skill.name),
                );
            });
        });
    }
}