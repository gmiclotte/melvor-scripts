import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Rates} from "./Rates";

export class CurrentSkill {
    public skill: any;
    public baseInterval: number;
    public modifiers: PlayerModifiers;
    public action: any;
    public actions: number;
    public timeMs: number;
    public skillXp: number;
    public masteryXp: number;
    public poolXp: number;
    public materials: Map<string, number>;
    public consumables: Map<string, number>;
    public isCombat: boolean;
    public currentRatesSet: boolean;
    public currentRates: Rates;
    public initial: Rates;

    constructor(skill: any) {
        this.skill = skill;
        this.baseInterval = skill.baseInterval ?? 0;
        this.modifiers = new PlayerModifiers();
        this.action = undefined;
        this.actions = 0;
        this.timeMs = 0;
        this.skillXp = 0;
        this.masteryXp = 0;
        this.poolXp = 0;
        this.materials = new Map<string, number>();
        this.consumables = new Map<string, number>();
        this.isCombat = false;
        this.currentRatesSet = false;
        this.currentRates = Rates.emptyRates;
        this.initial = Rates.emptyRates;
    }

    get currentLevel(): number {
        return this.xp_to_level(this.skillXp);
    }

    get currentMastery(): number {
        return this.xp_to_level(this.masteryXp);
    }

    get currentPoolPercent(): number {
        return (100 * this.poolXp) / this.skill.masteryPoolCap;
    }

    get actionInterval() {
        return this.modifyInterval(this.baseInterval, this.action);
    }

    get averageRates(): Rates {
        return new Rates(
            (this.skillXp - this.initial.xp) / this.timeMs, // xp
            this.timeMs / this.actions, // ms
        );
    }

    init(action: any, modifiers: PlayerModifiers) {
        this.action = action;
        this.modifiers = modifiers;
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
        this.currentRatesSet = false;
    }

    xp_to_level(xp: number): number {
        // @ts-ignore 2304
        return exp.xp_to_level(xp) - 1;
    }

    level_to_xp(level: number): number {
        // @ts-ignore 2304
        return exp.level_to_xp(level);
    }

    setCurrentRates(gains: Rates) {
        if (!this.currentRatesSet) {
            this.currentRates = new Rates(
                gains.xp / gains.ms, // xp
                gains.ms, // ms
            );
        }
        this.currentRatesSet = true;
    }

    progress(): void {
        const gainsPerAction = new Rates(
            // TODO: get all rates per action
            this.xpPerAction(), // xp
            // TODO: get average action time
            this.actionInterval, // ms
        );
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        // TODO: get next checkpoints
        const checkPoints = {
            xp: this.level_to_xp(this.currentLevel + 1) - this.skillXp,
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
        let modifier = this.modifiers.increasedGlobalSkillXP - this.modifiers.decreasedGlobalSkillXP;
        if (!this.isCombat)
            modifier += this.modifiers.increasedNonCombatSkillXP - this.modifiers.decreasedNonCombatSkillXP;
        modifier += this.getSkillModifierValue('increasedSkillXP');
        modifier -= this.getSkillModifierValue('decreasedSkillXP');
        return modifier;
    }

    getSkillModifierValue(modifierID: string): number {
        return this.modifiers.getSkillModifierValue(modifierID, this.skill);
    }

    /** Gets the flat change in [ms] for the given masteryID */
    getFlatIntervalModifier(_: any) {
        return (this.getSkillModifierValue('increasedSkillInterval') -
            this.getSkillModifierValue('decreasedSkillInterval'));
    }

    /** Gets the percentage change in interval for the given masteryID */
    getPercentageIntervalModifier(_: any) {
        return (this.getSkillModifierValue('increasedSkillIntervalPercent') -
            this.getSkillModifierValue('decreasedSkillIntervalPercent') +
            this.modifiers.increasedGlobalSkillIntervalPercent -
            this.modifiers.decreasedGlobalSkillIntervalPercent);
    }

    modifyInterval(interval: number, action: any): number {
        const flatModifier = this.getFlatIntervalModifier(action);
        const percentModifier = this.getPercentageIntervalModifier(action);
        interval *= 1 + percentModifier / 100;
        interval += flatModifier;
        // @ts-ignore
        interval = roundToTickInterval(interval);
        return Math.max(interval, 250);
    }
}