import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {Rates} from "./Rates";
import {Targets} from "./Targets";
import {ETASettings} from "./Settings";

export type currentSkillConstructor = new(
    skill: any,
    action: any,
    modifiers: PlayerModifiers,
    astrology: Astrology,
    settings: ETASettings,
) => EtaSkill;

export class EtaSkill {
    // readonly fields
    public readonly skill: any;
    public readonly action: any;
    public readonly isGathering: boolean;
    // trackers
    public skillXp: number;
    public masteryXp: number;
    public poolXp: number;
    public actionsTaken: Rates;
    public timeTaken: Rates;
    public materials: Map<string, number>;
    public consumables: Map<string, number>;
    // initial and target
    public initial: Rates;
    public targets: Targets;
    // current rates
    public currentRates: Rates;
    public skillReached: boolean;
    public masteryReached: boolean;
    public poolReached: boolean;
    protected readonly modifiers: PlayerModifiers;
    protected readonly masteryCheckpoints: number[];
    protected readonly astrology: Astrology;
    protected readonly isCombat: boolean;
    protected currentRatesSet: boolean;
    // other
    protected totalMasteryWithoutAction: number;
    protected infiniteActions: boolean;
    protected readonly TICK_INTERVAL: number;

    constructor(skill: any, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: ETASettings) {
        this.skill = skill;
        this.action = action;
        this.modifiers = modifiers;
        this.astrology = astrology;
        this.targets = new Targets(this, settings, skill, action);
        this.skill.baseInterval = skill.baseInterval ?? 0;
        this.actionsTaken = Rates.emptyRates;
        this.timeTaken = Rates.emptyRates;
        this.skillXp = 0;
        this.masteryXp = 0;
        this.poolXp = 0;
        this.totalMasteryWithoutAction = 0;
        this.materials = new Map<string, number>();
        this.consumables = new Map<string, number>();
        this.isCombat = false;
        this.isGathering = false;
        this.currentRatesSet = false;
        this.currentRates = Rates.emptyRates;
        this.initial = Rates.emptyRates;
        // @ts-ignore
        this.masteryCheckpoints = [...masteryCheckpoints, Infinity];
        this.infiniteActions = false;
        // @ts-ignore
        this.TICK_INTERVAL = TICK_INTERVAL;
        // flag to check if target was already reached
        this.skillReached = false;
        this.masteryReached = false;
        this.poolReached = false;
    }

    /***
     * Get and set rates
     */

    get gainsPerAction() {
        const masteryPerAction = this.masteryPerAction;
        return new Rates(
            // TODO: get all rates per action
            this.xpPerAction,
            masteryPerAction,
            this.poolPerAction(masteryPerAction),
            this.averageActionTime,
            1, // unit
        );
    }

    get averageRates(): Rates {
        return new Rates(
            (this.skillXp - this.initial.xp) / this.timeTaken.ms,
            (this.masteryXp - this.initial.mastery) / this.timeTaken.ms,
            (this.poolXp - this.initial.pool) / this.timeTaken.ms,
            this.timeTaken.ms / this.actionsTaken.ms, // ms
            1, // unit
        );
    }

    get skillLevel(): number {
        return this.xpToLevel(this.skillXp);
    }

    get xpPerAction(): number {
        return this.modifyXP(this.action.baseExperience);
    }

    /***
     * mastery methods
     */

    get masteryLevel(): number {
        return this.xpToLevel(this.masteryXp);
    }

    get totalCurrentMasteryLevel() {
        return this.masteryLevel + this.totalMasteryWithoutAction;
    }

    get totalUnlockedMasteryActions() {
        return this.skill.actions.reduce((previous: number, action: any) => {
            if (this.skillLevel >= action.level) {
                previous++;
            }
            return previous;
        }, 0);
    }

    get masteryPerAction() {
        const interval = this.masteryModifiedInterval;
        let xpToAdd = (((this.totalUnlockedMasteryActions * this.totalCurrentMasteryLevel) / this.skill.trueMaxTotalMasteryLevel +
                    this.masteryLevel * (this.skill.trueTotalMasteryActions / 10)) *
                (interval / 1000)) /
            2;
        xpToAdd *= 1 + this.getMasteryXPModifier() / 100;
        return xpToAdd;
    }

    get poolProgress() {
        return this.computePoolProgress(this.poolXp)
    }

    get nextPoolCheckpoint() {
        const poolProgress = this.poolProgress;
        const checkPoint = this.masteryCheckpoints.find((checkPoint: number) => checkPoint > poolProgress) ?? Infinity;
        if (poolProgress < this.targets.poolPercent && poolProgress < checkPoint) {
            return this.targets.poolPercent;
        }
        return checkPoint;
    }

    get nextPoolCheckpointXp() {
        return this.nextPoolCheckpoint / 100 * this.skill.baseMasteryPoolCap;
    }

    /***
     * Interval methods
     */

    get actionInterval() {
        return this.modifyInterval(this.skill.baseInterval);
    }

    // for skills without respawn this is a duplicate of actionInterval
    get averageActionTime() {
        return this.actionInterval;
    }

    get masteryModifiedInterval() {
        return this.actionInterval;
    }

    get completed() {
        return this.infiniteActions || this.targets.completed();
    }

    get skillCompleted() {
        return this.targets.skillCompleted();
    }

    get masteryCompleted() {
        return this.targets.masteryCompleted();
    }

    get poolCompleted() {
        return this.targets.poolCompleted();
    }

    computePoolProgress(poolXp: number) {
        let percent = (100 * poolXp) / this.skill.baseMasteryPoolCap;
        percent += this.modifiers.increasedMasteryPoolProgress;
        return percent;
    }

    init() {
        // get initial values
        // actions performed
        this.actionsTaken = Rates.emptyRates;
        // time taken to perform actions
        this.timeTaken = Rates.emptyRates;
        // current xp
        this.skillXp = this.skill.xp;
        // current mastery xp
        this.masteryXp = !this.skill.hasMastery ? 0 : this.skill.getMasteryXP(this.action);
        // current pool xp
        this.poolXp = !this.skill.hasMastery ? 0 : this.skill.masteryPoolXP;
        // initial
        this.initial = new Rates(
            this.skillXp,
            this.masteryXp,
            this.poolXp,
            0, // ms
            1, // unit
        );
        // compute total mastery, excluding current action
        this.totalMasteryWithoutAction = this.skill.totalCurrentMasteryLevel - this.masteryLevel;
        // map containing estimated remaining materials or consumables
        this.materials = new Map<string, number>(); // regular crafting materials, e.g. raw fish or ores
        this.consumables = new Map<string, number>(); // additional consumables e.g. potions, mysterious stones
        // current rates have not yet been computed
        this.currentRatesSet = false;
        this.infiniteActions = false;
        // flag to check if target was already reached
        this.skillReached = false;
        this.masteryReached = false;
        this.poolReached = false;
    }

    setFinalValues() {
        // check targets
        if (!this.skillReached && this.skillCompleted) {
            this.actionsTaken.xp = this.actionsTaken.ms;
            this.timeTaken.xp = this.timeTaken.ms;
            this.skillReached = true;
        }
        if (!this.masteryReached && this.masteryCompleted) {
            this.actionsTaken.mastery = this.actionsTaken.ms;
            this.timeTaken.mastery = this.timeTaken.ms;
            this.masteryReached = true;
        }
        if (!this.poolReached && this.poolCompleted) {
            this.actionsTaken.pool = this.actionsTaken.ms;
            this.timeTaken.pool = this.timeTaken.ms;
            this.poolReached = true;
        }
    }

    iterate(): void {
        this.init();
        const maxIt = 1000;
        let it = 0;
        this.setFinalValues();
        while (!this.completed) {
            this.progress();
            it++;
            if (it >= maxIt) {
                break;
            }
        }
        this.setCurrentRates();
    }

    xpToNextLevel(level: number, xp: number): number {
        const nextXp = this.levelToXp(level + 1);
        /*if (nextXp === xp) {
            return this.xpToNextLevel(level + 1, xp);
        }*/
        return nextXp - xp;
    }

    progress(): void {
        const gainsPerAction = this.gainsPerAction;
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        // TODO: get next checkpoints
        const requiredForCheckPoint = {
            xp: this.xpToNextLevel(this.skillLevel, this.skillXp),
            mastery: this.xpToNextLevel(this.masteryLevel, this.masteryXp),
            pool: this.nextPoolCheckpointXp - this.poolXp,
        }
        // TODO: compute time to nearest checkpoint
        const actionsToCheckpoint = {
            xp: requiredForCheckPoint.xp / gainsPerAction.xp,
            mastery: requiredForCheckPoint.mastery / gainsPerAction.mastery,
            pool: requiredForCheckPoint.pool / gainsPerAction.pool,
        }
        const actions = Math.ceil(Math.min(
            actionsToCheckpoint.xp,
            actionsToCheckpoint.mastery,
            actionsToCheckpoint.pool,
        ));
        // TODO: progress all trackers
        if (actions === Infinity) {
            this.infiniteActions = true;
            return;
        }
        this.skillXp += gainsPerAction.xp * actions;
        this.masteryXp += gainsPerAction.mastery * actions;
        this.poolXp += gainsPerAction.pool * actions;
        this.actionsTaken.ms += actions;
        this.timeTaken.ms += actions * gainsPerAction.ms;
        this.setFinalValues();
    }

    setCurrentRates(gains: Rates | undefined = undefined) {
        if (!this.currentRatesSet) {
            if (gains === undefined) {
                gains = this.gainsPerAction;
            }
            this.currentRates = new Rates(
                gains.xp / gains.ms,
                gains.mastery / gains.ms,
                gains.pool / gains.ms,
                gains.ms,
                1, // unit
            );
        }
        this.currentRatesSet = true;
    }

    /***
     * XP methods
     */

    xpToLevel(xp: number): number {
        // @ts-ignore 2304
        return exp.xp_to_level(xp) - 1;
    }

    levelToXp(level: number): number {
        // @ts-ignore 2304
        return exp.level_to_xp(level) + 0.00001;
    }

    modifyXP(amount: number) {
        amount *= 1 + this.getXPModifier() / 100;
        return amount;
    }

    getXPModifier() {
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

    getMasteryXPModifier() {
        let modifier = this.modifiers.increasedGlobalMasteryXP - this.modifiers.decreasedGlobalMasteryXP;
        modifier += this.modifiers.getSkillModifierValue('increasedMasteryXP', this);
        modifier -= this.modifiers.getSkillModifierValue('decreasedMasteryXP', this);
        this.astrology.masteryXPConstellations.forEach((constellation) => {
            const modValue = this.modifiers.getSkillModifierValue(constellation.masteryXPModifier, this);
            if (modValue > 0)
                modifier += modValue * constellation.maxValueModifiers;
        });
        return modifier;
    }

    /***
     * Pool methods
     */

    poolPerAction(masteryXp: number) {
        if (this.skillLevel >= 99) {
            return masteryXp / 2;
        }
        return masteryXp / 4;
    }

    isPoolTierActive(tier: number) {
        return this.poolProgress >= this.masteryCheckpoints[tier];
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

    getFlatIntervalModifier() {
        return this.getSkillModifierValue('increasedSkillInterval')
            - this.getSkillModifierValue('decreasedSkillInterval');
    }

    getPercentageIntervalModifier() {
        return this.getSkillModifierValue('increasedSkillIntervalPercent')
            - this.getSkillModifierValue('decreasedSkillIntervalPercent')
            + this.modifiers.increasedGlobalSkillIntervalPercent
            - this.modifiers.decreasedGlobalSkillIntervalPercent;
    }
}