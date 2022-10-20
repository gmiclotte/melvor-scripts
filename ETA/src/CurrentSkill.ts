import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Rates} from "./Rates";
import {Targets} from "./Targets";
import {ETASettings} from "./Settings";

export type currentSkillConstructor = new(skill: any, action: any, modifiers: PlayerModifiers, settings: ETASettings) => CurrentSkill;

export class CurrentSkill {
    public readonly skill: any;
    public readonly modifiers: PlayerModifiers;
    public action: any;
    public actions: number;
    public timeMs: number;
    public skillXp: number;
    public masteryXp: number;
    public poolXp: number;
    public materials: Map<string, number>;
    public consumables: Map<string, number>;
    public isCombat: boolean;
    public isGathering: boolean;
    public currentRatesSet: boolean;
    public currentRates: Rates;
    public initial: Rates;
    public targets: Targets;

    constructor(skill: any, action: any, modifiers: PlayerModifiers, settings: ETASettings) {
        console.log(skill, action, modifiers)
        this.skill = skill;
        this.action = action;
        this.modifiers = modifiers;
        this.targets = new Targets(settings, skill, action);
        this.skill.baseInterval = skill.baseInterval ?? 0;
        this.actions = 0;
        this.timeMs = 0;
        this.skillXp = 0;
        this.masteryXp = 0;
        this.poolXp = 0;
        this.materials = new Map<string, number>();
        this.consumables = new Map<string, number>();
        this.isCombat = false;
        this.isGathering = false;
        this.currentRatesSet = false;
        this.currentRates = Rates.emptyRates;
        this.initial = Rates.emptyRates;
    }

    get skillLevel(): number {
        return this.xpToLevel(this.skillXp);
    }

    get masteryLevel(): number {
        return this.xpToLevel(this.masteryXp);
    }

    get poolProgress() {
        let percent = (100 * this.poolXp) / this.skill.baseMasteryPoolCap;
        percent += this.modifiers.increasedMasteryPoolProgress;
        // @ts-ignore
        return clampValue(percent, 0, 100);
    }

    get actionInterval() {
        return this.modifyInterval(this.skill.baseInterval);
    }

    // for skills without respawn this is a duplicate of actionInterval
    get averageActionTime() {
        return this.actionInterval;
    }

    get averageRates(): Rates {
        return new Rates(
            (this.skillXp - this.initial.xp) / this.timeMs, // xp
            this.timeMs / this.actions, // ms
        );
    }

    get gainsPerAction() {
        return new Rates(
            // TODO: get all rates per action
            this.xpPerAction(), // xp
            // TODO: get average action time
            this.averageActionTime, // ms
        );
    }

    get poolTier() {
        const poolProgress = this.poolProgress;
        // @ts-ignore
        let index = masteryCheckpoints.findIndex((checkPoint: number) => checkPoint > poolProgress);
        if (index === -1) {
            // none of the checkpoints are larger than the current pool, hence all tiers reached
            // @ts-ignore
            index = masteryCheckpoints.length;
        }
        // current pool tier is one lower than the index we found
        return index - 1;
    }

    init() {
        // get initial values
        // actions performed
        this.actions = 0;
        // time taken to perform actions
        this.timeMs = 0;
        // initial
        this.initial = new Rates(
            this.skill.xp, // xp
            0, // ms
        );
        // current xp
        this.skillXp = this.initial.xp;
        // current mastery xp
        this.masteryXp = !this.skill.hasMastery ? 0 : this.skill.getMasteryXP(this.action);
        // current pool xp
        this.poolXp = !this.skill.hasMastery ? 0 : this.skill.masteryPoolXP;
        // map containing estimated remaining materials or consumables
        this.materials = new Map<string, number>(); // regular crafting materials, e.g. raw fish or ores
        this.consumables = new Map<string, number>(); // additional consumables e.g. potions, mysterious stones
        // current rates have not yet been computed
        this.currentRatesSet = false;
    }

    isPoolTierActive(tier: number) {
        // @ts-ignore
        return this.poolProgress >= masteryCheckpoints[tier];
    }

    modifyInterval(interval: number): number {
        const flatModifier = this.getFlatIntervalModifier();
        const percentModifier = this.getPercentageIntervalModifier();
        interval *= 1 + percentModifier / 100;
        interval += flatModifier;
        // @ts-ignore
        interval = roundToTickInterval(interval);
        return Math.max(interval, 250);
    }

    xpToLevel(xp: number): number {
        // @ts-ignore 2304
        return exp.xp_to_level(xp) - 1;
    }

    levelToXp(level: number): number {
        // @ts-ignore 2304
        return exp.level_to_xp(level);
    }

    setCurrentRates(gains: Rates | undefined = undefined) {
        if (!this.currentRatesSet) {
            if (gains === undefined) {
                gains = this.gainsPerAction;
            }
            this.currentRates = new Rates(
                gains.xp / gains.ms, // xp
                gains.ms, // ms
            );
        }
        this.currentRatesSet = true;
    }

    progress(): void {
        const gainsPerAction = this.gainsPerAction;
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        // TODO: get next checkpoints
        const checkPoints = {
            xp: this.levelToXp(this.skillLevel + 1) - this.skillXp,
        }
        // TODO: compute time to nearest checkpoint
        const actionsToCheckpoint = {
            xp: checkPoints.xp / gainsPerAction.xp,
        }
        const actions = Math.ceil(Math.min(actionsToCheckpoint.xp));
        // TODO: progress all trackers
        console.log(gainsPerAction.xp, checkPoints.xp, actionsToCheckpoint.xp);
        this.skillXp += gainsPerAction.xp * actions;
        this.actions += actions;
        this.timeMs += actions * gainsPerAction.ms;
    }

    xpPerAction(): number {
        return this.modifyXP(this.action.baseExperience, this.action);
    }

    modifyXP(amount: number, masteryAction: any) {
        amount *= 1 + this.getXPModifier(masteryAction) / 100;
        return amount;
    }

    /**
     * Gets the percentage xp modifier for a skill
     * @param masteryAction Optional, the action the xp came from
     */
    getXPModifier(masteryAction: any) {
        let modifier = this.modifiers.increasedGlobalSkillXP
            - this.modifiers.decreasedGlobalSkillXP;
        if (!this.isCombat) {
            modifier += this.modifiers.increasedNonCombatSkillXP
                - this.modifiers.decreasedNonCombatSkillXP;
        }
        modifier += this.getSkillModifierValue('increasedSkillXP');
        modifier -= this.getSkillModifierValue('decreasedSkillXP');
        return modifier;
    }

    getSkillModifierValue(modifierID: string): number {
        return this.modifiers.getSkillModifierValue(modifierID, this.skill);
    }

    /** Gets the flat change in [ms] for the given masteryID */
    getFlatIntervalModifier() {
        return this.getSkillModifierValue('increasedSkillInterval')
            - this.getSkillModifierValue('decreasedSkillInterval');
    }

    /** Gets the percentage change in interval for the given masteryID */
    getPercentageIntervalModifier() {
        return this.getSkillModifierValue('increasedSkillIntervalPercent')
            - this.getSkillModifierValue('decreasedSkillIntervalPercent')
            + this.modifiers.increasedGlobalSkillIntervalPercent
            - this.modifiers.decreasedGlobalSkillIntervalPercent;
    }
}