import {RatesWithMastery} from "./RatesWithMastery";
import {TargetsWithMastery} from "./TargetsWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {EtaSkillWithPool} from "./EtaSkillWithPool";
import type {Astrology, AstrologyRecipe} from "../../Game-Files/gameTypes/astrology";

export class EtaSkillWithMastery extends EtaSkillWithPool {
    // trackers
    public masteryXp: number;
    // initial and target
    public initial: RatesWithMastery;
    // @ts-ignore
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
        return Math.min(99, this.masteryXpToLevel(this.initial.mastery));
    }

    get masteryLevel(): number {
        return Math.min(99, this.virtualMasteryLevel);
    }

    get changeInMasteryLevel() {
        return this.masteryLevel - this.initialMasteryLevel;
    }

    get changeIn10MasteryLevel() {
        return Math.floor(this.masteryLevel / 10) - Math.floor(this.initialMasteryLevel / 10);
    }

    get virtualMasteryLevel(): number {
        return this.masteryXpToLevel(this.masteryXp);
    }

    get totalCurrentMasteryLevel() {
        return this.masteryLevel + this.totalMasteryWithoutAction;
    }

    get getMasteryXPToAddForAction() {
        let xpToAdd = this.getBaseMasteryXPToAddForAction(this.masteryModifiedInterval);
        xpToAdd *= 1 + this.getMasteryXPModifier() / 100;
        if (this.modifiers.halveMasteryXP > 0) {
            xpToAdd /= 2;
        }
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

    get totalUnlockedMasteryActionsInRealm() {
        const skillLevel = this.skillLevel;
        let totalUnlockedMasteryActions = 0;
        this.skill.actions.forEach((action: any) => {
            if (action.realm.id !== this.actionRealmID) {
                return;
            }
            if (this.isMasteryActionUnlocked(action, skillLevel)) {
                totalUnlockedMasteryActions++;
            }
        });
        return totalUnlockedMasteryActions;
    }

    isBasicSkillRecipeUnlocked(action: any, skillLevel: number) {
        if (action.realm.id === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            return action.level <= skillLevel;
        } else if (action.realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            return action.abyssalLevel <= skillLevel;
        }
        return false;
    }

    isMasteryActionUnlocked(action: any, skillLevel: number) {
        return this.isBasicSkillRecipeUnlocked(action, skillLevel);
    }

    getBaseMasteryXPToAddForAction(interval: number): number {
        const totalUnlockedInRealm = this.totalUnlockedMasteryActionsInRealm;
        const totalCurrent = this.totalCurrentMasteryLevel;
        const trueMax = this.skill.getTrueMaxTotalMasteryLevelInRealm(this.actionRealm());
        const trueTotal = this.skill.getTrueTotalMasteryActionsInRealm(this.actionRealm());
        const skillMasteryContribution = (totalUnlockedInRealm * totalCurrent) / trueMax;
        const actionMasteryContribution = this.masteryLevel * (trueTotal / 10);
        const average = (skillMasteryContribution + actionMasteryContribution) / 2;
        const intervalFactor = interval / 1000;
        return average * intervalFactor;
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
        this.totalMasteryWithoutAction = this.skill.getTotalCurrentMasteryLevelInRealm(this.actionRealm()) - this.masteryLevel;
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
        const requiredForMasteryCheckPoint = this.masteryXpToNextLevel(this.virtualMasteryLevel, this.masteryXp);
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
        if (this.isAbyssalPoolTierActive(0)) {
            modifier += 6;
        }
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