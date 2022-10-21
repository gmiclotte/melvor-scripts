import {ETASettings} from "./Settings";

import {Card} from "../../TinyMod/src/Card";
import {TabCard} from "../../TinyMod/src/TabCard";
import {TinyMod} from "../../TinyMod/src/TinyMod";
import {Targets} from "./Targets";
import {CurrentSkill, currentSkillConstructor} from "./CurrentSkill"
import {SkillWithMastery} from "../../Game-Files/built/skill";
import {Game} from "../../Game-Files/built/game";
import {EtaMining} from "./EtaMining.js";
import {EtaDisplayManager} from "./EtaDisplayManager";
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";

export class ETA extends TinyMod {
    private readonly settings: ETASettings;
    private readonly nameSpace: string;

    // @ts-ignore 2564
    private togglesCard: Card;
    // @ts-ignore 2564
    private skillTargetCard: TabCard;
    // @ts-ignore 2564
    private globalTargetsCard: Card;
    private previousTargets: Map<string, Targets>;
    private skillCalculators: Map<string, Map<string, CurrentSkill>>;
    private displayManager: EtaDisplayManager;

    constructor(ctx: any, game: Game) {
        super(ctx, 'ETA');
        this.log('Loading...');
        // initialize fields
        this.nameSpace = 'eta';
        this.settings = new ETASettings();
        this.previousTargets = new Map<string, Targets>();
        this.skillCalculators = new Map<string, Map<string, CurrentSkill>>()
        this.displayManager = new EtaDisplayManager(game, this.settings);

        // add skills
        this.addSkillCalculators(EtaMining, game.mining, game.modifiers, game.astrology);
        // create menu
        this.createSettingsMenu();
        // we made it
        this.log('Loaded!');
    }

    static testup(mod: any, game: Game): any {
        const eta = new ETA(mod.getDevContext(), game, 'Dev');
        // @ts-ignore
        window.eta = eta;
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
        return eta;
    }

    addSkillCalculators(constructor: currentSkillConstructor, skill: SkillWithMastery, modifiers: PlayerModifiers, astrology: Astrology) {
        const skillMap = new Map<string, CurrentSkill>();
        skill.actions.forEach((action: any) => {
            skillMap.set(action.id, new constructor(skill, action, modifiers, astrology, this.settings));
            this.displayManager.createDisplay(skill, action.id);
        });
        this.skillCalculators.set(skill.name, skillMap);
    }

    recompute(skill: SkillWithMastery) {
        setTimeout(() => {
            skill.actions.forEach((action: any) => {
                this.displayManager.injectHTML(this.timeRemaining(skill, action), new Date());
            });
        });
    }

    timeRemaining(skill: SkillWithMastery, action: any): any {
        // get current state of the skill
        // @ts-ignore
        const current = this.skillCalculators.get(skill.name).get(action.id);
        if (current === undefined) {
            this.warn(`Skill ${skill.name} Action ${action.name} is not implemented in ETA.`);
            return undefined;
        }
        // check if previous targets were met
        const previousTargets = this.previousTargets.get(skill.name);
        if (previousTargets !== undefined) {
            // TODO check previous targets by comparing `current` and `previousTargets`
        }
        // compute the targets and store them as the next previous targets
        current.targets = new Targets(current, this.settings, skill, action);
        this.previousTargets.set(skill.name, current.targets);
        current.iterate();
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
        titles.set('IS_SHORT_CLOCK', 'Use short time format');
        titles.set('SHOW_XP_RATE', 'Show XP rates');
        titles.set('SHOW_ACTION_TIME', 'Show action times');
        titles.set('UNCAP_POOL', 'Show pool past 100%');
        titles.set('CURRENT_RATES', 'Show current rates');
        titles.set('USE_TOKENS', '"Use" Mastery tokens for final Pool %');
        titles.set('SHOW_PARTIAL_LEVELS', 'Show partial levels');
        titles.set('HIDE_REQUIRED', 'Hide required resources');
        titles.set('DING_RESOURCES', 'Ding when out of resources');
        titles.set('DING_LEVEL', 'Ding on level target');
        titles.set('DING_MASTERY', 'Ding on mastery target');
        titles.set('DING_POOL', 'Ding on pool target');
        titles.set('USE_TABLETS', '"Use" all created Summoning Tablets');
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
            );
        });

    }

    addTargetInputs() {
        this.skillTargetCard = new TabCard('EtaTarget', true, this.tag, this.content, '', '150px', true);
        // @ts-ignore 2304
        game.skills.allObjects.filter((skill: any) => !skill.isCombat).forEach((skill: any) => {
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
                    this.settings.get(key),
                    skill.name,
                );
            });
        });
    }
}