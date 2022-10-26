import {RatesWithMastery} from "./RatesWithMastery";
import {TargetsWithMastery} from "./TargetsWithMastery";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {EtaSkillWithPool} from "./EtaSkillWithPool";

export class EtaSkillWithMastery extends EtaSkillWithPool {
    // trackers
    public masteryXp: number;
    // initial and target
    public initial: RatesWithMastery;
    public targets: TargetsWithMastery;
    // current rates
    public currentRates: RatesWithMastery;
    // targets reached
    public masteryReached: boolean;
    // other
    protected totalMasteryWithoutAction: number;

    constructor(...[game, skill, action, settings]: [Game, any, any, Settings]) {
        const args: [Game, any, any, Settings] = [game, skill, action, settings];
        super(...args);
        this.targets = new TargetsWithMastery(this, settings, skill, action);
        this.masteryXp = 0;
        this.totalMasteryWithoutAction = 0;
        this.currentRates = RatesWithMastery.emptyRates;
        this.initial = RatesWithMastery.emptyRates;
        // flag to check if target was already reached
        this.masteryReached = false;
    }

    /***
     * Get and set rates
     */

    get gainsPerAction() {
        const gains = RatesWithMastery.addMasteryToRates(
            super.gainsPerAction,
            this.getMasteryXPToAddForAction,
        );
        gains.pool = this.poolPerAction(gains.mastery);
        return gains;
    }

    get averageRates(): RatesWithMastery {
        return RatesWithMastery.addMasteryToRates(
            super.averageRates,
            (this.masteryXp - this.initial.mastery) / this.actionsTaken.active.ms,
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

    /***
     * Interval methods
     */

    get masteryModifiedInterval() {
        return this.actionInterval;
    }

    get masteryCompleted() {
        return !this.masteryReached && this.targets.masteryCompleted();
    }

    getTargets(settings: Settings) {
        return new TargetsWithMastery(this, settings, this.skill, this.action);
    }

    init(game: Game) {
        super.init(game);
        // get initial values
        // current mastery xp
        this.masteryXp = this.skill.getMasteryXP(this.action);
        // initial
        this.initial = RatesWithMastery.addMasteryToRates(
            this.initial,
            this.masteryXp,
        );
        // compute total mastery, excluding current action
        this.totalMasteryWithoutAction = this.skill.totalCurrentMasteryLevel - this.masteryLevel;
        // flag to check if target was already reached
        this.masteryReached = false;
    }

    setFinalValues() {
        super.setFinalValues();
        if (this.masteryCompleted) {
            this.actionsTaken.mastery = this.actionsTaken.active.clone();
            this.masteryReached = true;
        }
    }

    actionsToCheckpoint(gainsPerAction: RatesWithMastery) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const requiredForMasteryCheckPoint = this.xpToNextLevel(this.masteryLevel, this.masteryXp);
        const actionsToMasteryCheckpoint = requiredForMasteryCheckPoint / gainsPerAction.mastery;
        return Math.ceil(Math.min(
            super.actionsToCheckpoint(gainsPerAction),
            actionsToMasteryCheckpoint,
        ));
    }

    addActions(gainsPerAction: RatesWithMastery, actions: number) {
        super.addActions(gainsPerAction, actions);
        this.masteryXp += gainsPerAction.mastery * actions;
    }

    setCurrentRatesNoCheck(gains: RatesWithMastery): RatesWithMastery {
        return this.currentRates = RatesWithMastery.addMasteryToRates(
            super.setCurrentRatesNoCheck(gains),
            gains.mastery / gains.ms,
        );
    }

    getMasteryXPModifier() {
        let modifier = this.modifiers.increasedGlobalMasteryXP - this.modifiers.decreasedGlobalMasteryXP;
        modifier += this.getSkillModifierValue('increasedMasteryXP');
        modifier -= this.getSkillModifierValue('decreasedMasteryXP');
        this.astrology.masteryXPConstellations.forEach((constellation) => {
            const modValue = this.getSkillModifierValue(constellation.masteryXPModifier);
            if (modValue > 0) {
                modifier += modValue * constellation.maxValueModifiers;
            }
        });
        return modifier;
    }
}