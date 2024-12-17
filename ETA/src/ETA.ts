import {Card} from "../../TinyMod/src/Card";
import {TabCard} from "../../TinyMod/src/TabCard";
import {TinyMod} from "../../TinyMod/src/TinyMod";
import {EtaSkill, etaSkillConstructor} from "./EtaSkill"
import type {MasterySkillData, SkillWithMastery} from "../../Game-Files/gameTypes/skill";
import type {Game} from "../../Game-Files/gameTypes/game";
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
import type {MasteryAction} from "../../Game-Files/gameTypes/mastery2";
import type {ThievingArea, ThievingNPC} from "../../Game-Files/gameTypes/thieving2";
import {EtaWoodcutting} from "./EtaWoodcutting";
import {EtaCooking} from "./EtaCooking";
import {EtaThieving} from "./EtaThieving";
import {EtaMagic} from "./EtaMagic";
import {MultiActionSkill} from "./MultiActionSkill";
import {EtaAgility} from "./EtaAgility";
import {EtaAstrology} from "./EtaAstrology";
import {EtaArchaeology} from "./EtaArchaeology";
import {EtaHarvesting} from "./EtaHarvesting";
import {MultiAgility} from "./MultiAgility";
import {MultiWoodcutting} from "./MultiWoodcutting";
import {EtaCartographyPaper} from "./EtaCartographyPaper";
import {EtaCartographyMap} from "./EtaCartographyMap";
import {EtaCartographySurvey} from "./EtaCartographySurvey";
import {Cartography} from "../../Game-Files/gameTypes/cartography";

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
    private readonly npcAreaMap: Map<string, ThievingArea>;
    private recomputeTimeMap: Map<string, number>

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
        this.recomputeTimeMap = new Map<string, number>();

        // add non-combat skills
        this.addSkillCalculators(EtaWoodcutting, game.woodcutting);
        this.addSkillCalculators(EtaFishing, game.fishing);
        this.addSkillCalculators(EtaFiremaking, game.firemaking);
        this.addSkillCalculators(EtaCooking, game.cooking);
        this.addSkillCalculators(EtaMining, game.mining);
        this.addSkillCalculators(EtaSmithing, game.smithing);
        this.addSkillCalculators(EtaThieving, game.thieving);
        this.addSkillCalculators(EtaFletching, game.fletching);
        this.addSkillCalculators(EtaCrafting, game.crafting);
        this.addSkillCalculators(EtaRunecrafting, game.runecrafting);
        this.addSkillCalculators(EtaHerblore, game.herblore);
        this.addSkillCalculators(EtaAgility, game.agility);
        this.addSkillCalculators(EtaSummoning, game.summoning);
        this.addSkillCalculators(EtaAstrology, game.astrology);
        this.addSkillCalculators(EtaMagic, game.altMagic);
        if (this.game.cartography) {
            this.addCartCalculators(game.cartography);
        }
        if (this.game.archaeology) {
            this.addSkillCalculators(EtaArchaeology, game.archaeology);
        }
        if (this.game.harvesting) {
            this.addSkillCalculators(EtaHarvesting, game.harvesting);
        }

        // we made it
        this.log('Loaded!');
    }

    addCartCalculators(cartography: Cartography) {
        try {
            const skillMap = new Map<string, EtaSkill>();
            skillMap.set('ETA:PaperMaking', new EtaCartographyPaper(
                this.game,
                cartography,
                {id: 'ETA:PaperMaking'},
                this.settings,
            ));
            skillMap.set('ETA:MapCreation', new EtaCartographyMap(
                this.game,
                cartography,
                {id: 'ETA:MapCreation'},
                this.settings,
            ));
            skillMap.set('ETA:Survey', new EtaCartographySurvey(
                this.game,
                cartography,
                {id: 'ETA:Survey'},
                this.settings,
            ));
            // @ts-ignore
            const skillID = cartography.id;
            this.skillCalculators.set(skillID, skillMap);
        } catch (e) {
            this.log(e);
        }
    }

    addSkillCalculators(constructor: etaSkillConstructor, skill: SkillWithMastery<MasteryAction, MasterySkillData>) {
        try {
            const skillMap = new Map<string, EtaSkill>();
            this.getSkillActions(skill).forEach((action: any) => {
                skillMap.set(action.id, new constructor(this.game, skill, action, this.settings));
                // this.displayManager.getDisplay(skill, action.id);
            });
            // @ts-ignore
            const skillID = skill.id;
            this.skillCalculators.set(skillID, skillMap);
        } catch (e) {
            this.log(e)
        }
    }

    getSkillActions(skill: SkillWithMastery<MasteryAction, MasterySkillData>): any[] {
        // @ts-ignore
        if (game.cartography && skill.id === game.cartography.id) {
            // cartography has custom actions
            return [
                {id: 'ETA:PaperMaking'},
                {id: 'ETA:MapCreation'},
                {id: 'ETA:Survey'},
            ];
        }
        return skill.actions;
    }

    recompute(skill: SkillWithMastery<MasteryAction, MasterySkillData>, throttle: boolean) {
        // @ts-ignore
        const skillID = skill.id;
        // recompute a skill only once every x ms
        const now = Date.now();
        if (throttle && this.recomputeTimeMap.has(skillID)) {
            const lastRecompute = this.recomputeTimeMap.get(skillID)!;
            if (now - lastRecompute < this.settings.get('minimalRecomputeTime')) {
                // throttle recomputes
                // this.log(`Throttling recomputation of ${skillID} to once every ${this.settings.get('minimalRecomputeTime')}ms`)
                return;
            } else {
                // this.log(`Recomputing ${skillID} after ${now - lastRecompute}ms`);
            }
        }
        this.recomputeTimeMap.set(skillID, now);

        // check if the skill should be recomputed
        if (!this.game.loopStarted || !this.game.enableRendering) {
            //this.log('Game loop is not running or rendering, probably fastforwarding. Skip all ETA recomputes.');
            return;
        }
        if (this.getSkillActions(skill) === undefined) {
            return;
        }
        if (this.game.openPage.action !== skill) {
            // this.log(`Not on ${skillID} page`);
            return;
        }
        setTimeout(() => {
            this.getSkillActions(skill).forEach((action: any) => {
                // this.log(`Checking ${skillID} ${action.id}`)
                if (!this.skipAction(skill, action)) {
                    // this.log(`Recomputing ${skillID} ${action.id}`)
                    this.computeAndInjectHTML(skill, action);
                } else {
                    this.displayManager.hideHTML(skill, action.id);
                }
            });
            let actions: any[];
            let injectSubCalcs = false;
            // @ts-ignore
            switch (skillID) {
                case this.game.woodcutting.id:
                    actions = [...this.game.woodcutting.activeTrees];
                    break;
                case this.game.agility.id:
                    actions = [];
                    for (let i = 0; i < this.game.agility.activeCourse.builtObstacles.size; i++) {
                        const obstacle = this.game.agility.activeCourse.builtObstacles.get(i);
                        if (obstacle === undefined) {
                            break;
                        }
                        actions.push(obstacle);
                    }
                    injectSubCalcs = true;
                    break;
                default:
                    return;
            }
            if (!this.skipMultiAction(skill, actions)) {
                // this.log(`Recomputing ${skillID} multi actions ${actions.map(a => a.id)}`)
                // @ts-ignore
                this.computeAndInjectMultiHTML(skill, actions, injectSubCalcs);
            } else {
                // @ts-ignore
                this.displayManager.hideHTML(skill);
            }
        });
    }

    computeAndInjectHTML(skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any) {
        const display = this.displayManager.getDisplay(skill, action.id);
        if (display === undefined) {
            return;
        }
        // @ts-ignore
        const skillID = skill.id;
        const calculator = this.skillCalculators.get(skillID)!.get(action.id);
        if (calculator === undefined) {
            this.warn(`Skill ${skillID} Action ${action.id} is not implemented in ETA.`);
            return;
        }
        if (calculator.isComputing) {
            // already computing
            return;
        }
        this.displayManager.injectHTML(display, this.timeRemaining(calculator), new Date());
    }

    computeAndInjectMultiHTML(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actions: any[], injectSubCalcs: boolean) {
        // @ts-ignore
        const skillID = skill.id;
        let calculator = this.skillMultiCalculators.get(skillID);
        if (calculator && calculator.isComputing) {
            // already computing
            return;
        }
        // check if the display exists
        const display = this.displayManager.getDisplay(skill);
        if (display === undefined) {
            return;
        }
        // create new multi action calculators
        if (skillID === this.game.woodcutting.id) {
            calculator = new MultiWoodcutting(this.game, this.game.woodcutting, actions, this.settings);
        } else if (skillID === this.game.agility.id) {
            calculator = new MultiAgility(this.game, this.game.agility, actions, this.settings);
        } else {
            return;
        }
        // inject the calculator results
        this.skillMultiCalculators.set(skillID, calculator);
        this.displayManager.injectHTML(display, this.timeRemaining(calculator), new Date());
        if (injectSubCalcs) {
            calculator.calculators.forEach(sub => {
                const subDisplay = this.displayManager.getDisplay(skill, sub.action.id);
                this.displayManager.injectHTML(subDisplay!, sub, new Date())
            });
        }
    }

    skipAction(skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any): boolean {
        // @ts-ignore
        const skillID = skill.id;
        // check if this calculator wants to skip
        const calculators = this.skillCalculators.get(skillID);
        if (!calculators) {
            return true;
        }
        const calculator = calculators.get(action.id);
        if (!calculator) {
            return true;
        }
        if (calculator.skip()) {
            return true;
        }
        // skip actions for which we do not have the level requirement
        if (!calculator.levelReqReached) {
            return true;
        }
        const cartID = this.game.cartography ? this.game.cartography.id : 'invalidID';
        const archID = this.game.archaeology ? this.game.archaeology.id : 'invalidID';
        const harvestingID = this.game.harvesting ? this.game.harvesting.id : 'invalidID';
        switch (skillID) {
            case this.game.woodcutting.id:
            case this.game.mining.id:
            case this.game.astrology.id:
            case harvestingID:
                // compute all actions for woodcutting, mining, astrology, and harvesting
                return false;
            case cartID:
                switch (action.id) {
                    case 'ETA:Survey':
                        // only compute survey if there are queued hexes
                        return this.game.cartography.surveyQueue.size === 0;
                    case 'ETA:MapCreation':
                        // only compute map creation if there is a selected map
                        const selectedDigSite = this.game.cartography.selectedMapUpgradeDigsite;
                        return selectedDigSite === undefined
                            || selectedDigSite.selectedUpgradeMap === undefined;
                    case 'ETA:PaperMaking':
                        // only compute paper making if there is a selected recipe
                        return this.game.cartography.selectedPaperRecipe === undefined;
                }
                // unknown action, skip
                return true;
            case this.game.agility.id:
                // only compute selected obstacles for agility
                const built = this.game.agility.activeCourse.builtObstacles.get(action.category);
                return built === undefined || built.id !== action.id;
            case this.game.altMagic.id:
                // only compute selected spell for magic
                return this.game.altMagic.selectedSpell === undefined
                    || this.game.altMagic.activeSpell !== action;
            case this.game.thieving.id:
                // only compute selected actions for thieving
                const area = this.npcAreaMap.get(action.id);
                // @ts-ignore
                return thievingMenu.areaPanels.get(area).selectedNPC !== action;
            case this.game.cooking.id:
                // only compute selected actions for cooking
                return this.game.cooking.selectedRecipes.get(action.category) !== action;
            case this.game.fishing.id:
                // only compute selected actions for fishing
                const calculators = this.skillCalculators.get(skillID);
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
            case archID:
                return !this.game.archaeology.actions.getObjectByID(action.id).isDiscovered;
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
        // @ts-ignore
        const skillID = skill.id;
        if (skillID === this.game.woodcutting.id) {
            return actions.length < 1;
        }
        if (skillID === this.game.agility.id) {
            return this.game.agility.activeCourse.builtObstacles.get(0) === undefined;
        }
        return true;
    }

    timeRemaining(calculator: EtaSkill) {
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
        this.togglesCard = new Card(this.idManager, this.content, '', '150px', true);
        this.settings.generalSettingsArray.toggles.forEach(toggle => {
            this.togglesCard.addToggleRadio(
                toggle.label,
                toggle.name,
                this.settings,
                toggle.name,
                this.settings.get(toggle.name),
            );
        });
    }

    addGlobalTargetInputs() {
        this.globalTargetsCard = new Card(this.idManager, this.content, '', '150px', true);
        // targets
        // other numerical settings
        this.settings.generalSettingsArray.targets.forEach(target => {
            const globalKey = target.name;
            this.globalTargetsCard.addNumberArrayInput(
                target.label,
                this.settings,
                globalKey,
                target.default,
                () => this.settings.get(globalKey),
                (_: any, __: string, result: any) => {
                    this.settings.set(globalKey, result);
                    recomputeEverySkill();
                },
            );
        });
        this.settings.generalSettingsArray.numerical.forEach(numerical => {
            const key = numerical.name;
            this.globalTargetsCard.addNumberInput(
                numerical.label,
                this.settings.get(key),
                0,
                Infinity,
                (event: any) => {
                    let value = parseInt(event.currentTarget.value);
                    if (isNaN(value)) {
                        value = numerical.default;
                    }
                    if (value < 0) {
                        value = numerical.default;
                    }
                    if (value > Infinity) {
                        value = numerical.default;
                    }
                    this.settings.set(key, value);
                    recomputeEverySkill();
                },
            );
        });
    }

    addTargetInputs() {
        this.skillTargetCard = new TabCard(this.idManager, 'EtaTarget', true, this.tag, this.content, '', '150px', true);
        this.settings.skillList.forEach((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => {
            // @ts-ignore
            const skillID = skill.id;
            const card = this.skillTargetCard.addTab(skillID, skill.media, '', '150px', undefined);
            card.addSectionTitle(skill.name);
            this.settings.skillTargetsSettingsArray.forEach(target => {
                if (target.whiteList !== undefined && !target.whiteList.includes(skillID)) {
                    return;
                }
                const key = 'TARGET_' + target.name;
                card.addNumberArrayInput(
                    target.label,
                    this.settings,
                    skillID,
                    [],
                    () => this.settings.get(key, skillID),
                    (_: any, __: string, result: any) => {
                        this.settings.set(key, result, skillID);
                        recomputeSkill(skill, false);
                    },
                );
            });
        });
    }
}

export function recomputeSkill(skill: SkillWithMastery<MasteryAction, MasterySkillData>, throttle: boolean) {
    // @ts-ignore
    const etaApi = mod.api.ETA;
    if (etaApi === undefined || etaApi.ETA === undefined) {
        return;
    }
    // @ts-ignore
    etaApi.ETA.recompute(skill, throttle);
}

export function recomputeEverySkill() {
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
    etaApi.ETA.recompute(skill, false);
}