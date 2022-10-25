import {RatesWithMastery} from "./RatesWithMastery";
import {TargetsWithMastery} from "./TargetsWithMastery";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {EtaSkill} from "./EtaSkill";

export class EtaSkillWithMastery extends EtaSkill {
    // trackers
    public masteryXp: number;
    public poolXp: number;
    // initial and target
    public initial: RatesWithMastery;
    public targets: TargetsWithMastery;
    // current rates
    public currentRates: RatesWithMastery;
    // targets reached
    public masteryReached: boolean;
    public poolReached: boolean;
    protected readonly masteryCheckpoints: number[];
    // other
    protected totalMasteryWithoutAction: number;

    constructor(game: Game, skill: any, action: any, settings: Settings) {
        super(game, skill, action, settings);
        this.targets = new TargetsWithMastery(this, settings, skill, action);
        this.masteryXp = 0;
        this.poolXp = 0;
        this.totalMasteryWithoutAction = 0;
        this.currentRates = RatesWithMastery.emptyRates;
        this.initial = RatesWithMastery.emptyRates;
        // @ts-ignore
        this.masteryCheckpoints = [...masteryCheckpoints, Infinity];
        // flag to check if target was already reached
        this.masteryReached = false;
        this.poolReached = false;
    }

    /***
     * Get and set rates
     */

    get gainsPerAction() {
        const masteryPerAction = this.getMasteryXPToAddForAction;
        return new RatesWithMastery(
            // TODO: get all rates per action
            this.actionXP,
            masteryPerAction,
            this.poolPerAction(masteryPerAction),
            this.averageActionTime,
            1, // unit
        );
    }

    get averageRates(): RatesWithMastery {
        return new RatesWithMastery(
            (this.skillXp - this.initial.xp) / this.actionsTaken.active.ms,
            (this.masteryXp - this.initial.mastery) / this.actionsTaken.active.ms,
            (this.poolXp - this.initial.pool) / this.actionsTaken.active.ms,
            this.actionsTaken.active.ms / this.actionsTaken.active.actions, // ms per action
            1, // unit
        );
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

    get getMasteryXPToAddForAction() {
        const interval = this.masteryModifiedInterval;
        let xpToAdd = (((this.totalUnlockedMasteryActions * this.totalCurrentMasteryLevel) / this.skill.trueMaxTotalMasteryLevel
            + this.masteryLevel * (this.skill.trueTotalMasteryActions / 10)) * (interval / 1000)) / 2;
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

    get masteryModifiedInterval() {
        return this.actionInterval;
    }

    get masteryCompleted() {
        return !this.masteryReached && this.targets.masteryCompleted();
    }

    get poolCompleted() {
        return !this.poolReached && this.targets.poolCompleted();
    }

    getTargets(settings: Settings) {
        return new TargetsWithMastery(this, settings, this.skill, this.action);
    }

    computePoolProgress(poolXp: number) {
        let percent = (100 * poolXp) / this.skill.baseMasteryPoolCap;
        percent += this.modifiers.increasedMasteryPoolProgress;
        return percent;
    }

    init(game: Game) {
        super.init(game);
        // get initial values
        // current mastery xp
        this.masteryXp = this.skill.getMasteryXP(this.action);
        // current pool xp
        this.poolXp = this.skill.masteryPoolXP;
        // initial
        this.initial = new RatesWithMastery(
            this.skillXp,
            this.masteryXp,
            this.poolXp,
            0, // ms
            1, // unit
        );
        // compute total mastery, excluding current action
        this.totalMasteryWithoutAction = this.skill.totalCurrentMasteryLevel - this.masteryLevel;
        // flag to check if target was already reached
        this.masteryReached = false;
        this.poolReached = false;
    }

    setFinalValues() {
        super.setFinalValues();
        if (this.masteryCompleted) {
            this.actionsTaken.mastery = this.actionsTaken.active.clone();
            this.masteryReached = true;
        }
        if (this.poolCompleted) {
            this.actionsTaken.pool = this.actionsTaken.active.clone();
            this.poolReached = true;
        }
    }

    actionsToCheckpoint(gainsPerAction: RatesWithMastery) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const requiredForCheckPoint = {
            mastery: this.xpToNextLevel(this.masteryLevel, this.masteryXp),
            pool: this.nextPoolCheckpointXp - this.poolXp,
        }
        const actionsToCheckpoint = {
            mastery: requiredForCheckPoint.mastery / gainsPerAction.mastery,
            pool: requiredForCheckPoint.pool / gainsPerAction.pool,
        }
        return Math.ceil(Math.min(
            super.actionsToCheckpoint(gainsPerAction),
            actionsToCheckpoint.mastery,
            actionsToCheckpoint.pool,
        ));
    }

    addActions(gainsPerAction: RatesWithMastery, actions: number) {
        super.addActions(gainsPerAction, actions);
        this.masteryXp += gainsPerAction.mastery * actions;
        this.poolXp += gainsPerAction.pool * actions;
    }

    setCurrentRates(gains: RatesWithMastery | undefined = undefined) {
        if (!this.currentRatesSet) {
            if (gains === undefined) {
                gains = this.gainsPerAction;
            }
            this.currentRates = new RatesWithMastery(
                gains.xp / gains.ms,
                gains.mastery / gains.ms,
                gains.pool / gains.ms,
                gains.ms,
                1, // unit
            );
        }
        this.currentRatesSet = true;
    }

    getMasteryXPModifier() {
        let modifier = this.modifiers.increasedGlobalMasteryXP - this.modifiers.decreasedGlobalMasteryXP;
        modifier += this.getSkillModifierValue('increasedMasteryXP');
        modifier -= this.getSkillModifierValue('decreasedMasteryXP');
        this.astrology.masteryXPConstellations.forEach((constellation) => {
            const modValue = this.getSkillModifierValue(constellation.masteryXPModifier);
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
}