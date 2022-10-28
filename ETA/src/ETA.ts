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
import {EtaAstrology} from "./EtaAstrology";

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
        this.addSkillCalculators(EtaAstrology, game.astrology);
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

    addSkillCalculators(constructor: etaSkillConstructor, skill: SkillWithMastery<MasteryAction, MasterySkillData>) {
        const skillMap = new Map<string, EtaSkill>();
        skill.actions.forEach((action: any) => {
            skillMap.set(action.id, new constructor(this.game, skill, action, this.settings));
            this.displayManager.getDisplay(skill, action.id);
        });
        this.skillCalculators.set(skill.name, skillMap);
    }

    recompute(skill: SkillWithMastery<MasteryAction, MasterySkillData>) {
        if (this.game.openPage.action !== skill) {
            // this.log(`Not on ${skill.name} page`);
            return;
        }
        setTimeout(() => {
            skill.actions.forEach((action: any) => {
                if (!this.skipAction(skill, action)) {
                    // this.log(`Recomputing ${skill.name} ${action.name}.`);
                    this.computeAndInjectHTML(skill, action);
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
                // this.log(`Recomputing ${skill.name} multi.`);
                this.computeAndInjectMultiHTML(skill, actions);
            } else {
                this.displayManager.hideHTML(skill);
            }
        });
    }

    computeAndInjectHTML(skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any) {
        const calculator = this.skillCalculators.get(skill.name)!.get(action.id);
        if (calculator === undefined) {
            this.warn(`Skill ${skill.name} Action ${action.name} is not implemented in ETA.`);
            return;
        }
        if (calculator.isComputing) {
            // already computing
            return;
        }
        this.displayManager.injectHTML(this.timeRemaining(calculator), new Date());
    }

    computeAndInjectMultiHTML(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actions: any[]) {
        let calculator = this.skillMultiCalculators.get(skill.name);
        if (calculator && calculator.isComputing) {
            // already computing
            return;
        }
        // create new multi action calculators
        if (skill.name === this.game.woodcutting.name) {
            calculator = new MultiWoodcutting(this.game, this.game.woodcutting, actions, this.settings);
        } else if (skill.name === this.game.agility.name) {
            calculator = new MultiAgility(this.game, this.game.agility, actions, this.settings);
        } else {
            return;
        }
        this.skillMultiCalculators.set(skill.name, calculator);
        this.displayManager.getDisplay(skill);
        this.displayManager.injectHTML(this.timeRemaining(calculator), new Date());
    }

    skipAction(skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any): boolean {
        // skip actions for which we do not have the level requirement
        // agility actions do not have a level requirement comparable to skill level
        // TODO: check other requirements ?
        if (skill.name !== this.game.agility.name && action.level > skill.level) {
            return true;
        }
        switch (skill.name) {
            case this.game.woodcutting.name:
            case this.game.mining.name:
            case this.game.astrology.name:
                // compute all actions for woodcutting, mining, and astrology
                return false;
            case this.game.agility.name:
                if (this.game.agility.getObstacleLevel(action.category) > skill.level) {
                    return true;
                }
                // only compute selected obstacles for agility
                const built = this.game.agility.builtObstacles.get(action.category);
                return built === undefined || built.id !== action.id;
            case this.game.altMagic.name:
                // only compute selected spell for magic
                return this.game.altMagic.selectedSpell === undefined
                    || this.game.altMagic.activeSpell !== action;
            case this.game.thieving.name:
                // only compute selected actions for thieving
                const area = this.npcAreaMap.get(action.id);
                // @ts-ignore
                return thievingMenu.areaPanels.get(area).selectedNPC !== action;
            case this.game.cooking.name:
                // only compute selected actions for cooking
                return this.game.cooking.selectedRecipes.get(action.category) !== action;
            case this.game.fishing.name:
                // only compute selected actions for fishing
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

    timeRemaining(calculator: EtaSkill) {
        // compute the targets
        calculator.targets = calculator.getTargets(this.settings);
        calculator.iterate(this.game);
        return calculator;
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