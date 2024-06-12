import {RatesWithMastery} from "./RatesWithMastery";
import {TargetsWithMastery} from "./TargetsWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {EtaSkillWithPool} from "./EtaSkillWithPool";
import {Astrology, AstrologyRecipe} from "../../Game-Files/gameTypes/astrology";

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
    private astrology: Astrology;

    constructor(...[game, skill, action, settings]: [Game, any, any, Settings]) {
        const args: [Game, any, any, Settings] = [game, skill, action, settings];
        super(...args);
        this.astrology = game.astrology;
        this.targets = this.getTargets();
        this.masteryXp = 0;
        this.totalMasteryWithoutAction = 0;
        this.currentRates = RatesWithMastery.emptyRates;
        this.initial = RatesWithMastery.emptyRates;
        // flag to check if target was already reached
        this.masteryReached = false;
    }

    /***
     * mastery methods
     */

    get initialMasteryLevel(): number {
        return Math.min(99, this.xpToLevel(this.initial.mastery));
    }

    get masteryLevel(): number {
        return Math.min(99, this.virtualMasteryLevel);
    }

    get virtualMasteryLevel(): number {
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

    /***
     * Get and set rates
     */

    gainsPerAction() {
        const gains = RatesWithMastery.addMasteryToRates(
            super.gainsPerAction(),
            this.getMasteryXPToAddForAction,
        );
        gains.pool = this.poolPerAction(gains.mastery);
        return gains;
    }

    getTargets() {
        return new TargetsWithMastery(this, this.settings);
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

    attemptsToCheckpoint(gainsPerAction: RatesWithMastery) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const requiredForMasteryCheckPoint = this.xpToNextLevel(this.virtualMasteryLevel, this.masteryXp);
        const attemptsToMasteryCheckpoint = requiredForMasteryCheckPoint / gainsPerAction.mastery / gainsPerAction.successRate;
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            attemptsToMasteryCheckpoint,
        ));
    }

    addAttempts(gainsPerAction: RatesWithMastery, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.masteryXp += gainsPerAction.mastery * attempts * gainsPerAction.successRate;
    }

    setCurrentRatesNoCheck(gains: RatesWithMastery): RatesWithMastery {
        return this.currentRates = RatesWithMastery.addMasteryToRates(
            super.setCurrentRatesNoCheck(gains),
            gains.mastery / gains.ms * gains.successRate,
        );
    }

    getMasteryXPModifier() {
        let modifier = this.modifiers.getValue(
            "melvorD:masteryXP" /* ModifierIDs.masteryXP */,
            this.getActionModifierQuery()
        );
        this.astrology.masteryXPConstellations.forEach((constellation: AstrologyRecipe) => {
            const modValue = this.modifiers.getValue(constellation.masteryXPModifier.id, this.skill.modQuery);
            if (modValue > 0) {
                modifier += modValue * constellation.maxValueModifiers;
            }
        });
        return modifier;
    }

    getXpMap() {
        const levels = super.getXpMap();
        levels.set('masteryXp', this.masteryXp);
        return levels;
    }

    checkMasteryMilestone(milestoneLevel: number) {
        if (this.initialMasteryLevel >= milestoneLevel) {
            // already reached initially, so should be included in the PlayerModifierTable
            return false;
        }
        return this.masteryLevel >= milestoneLevel;
    }
}