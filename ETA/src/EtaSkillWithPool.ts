import {RatesWithPool} from "./RatesWithPool";
import {TargetsWithPool} from "./TargetsWithPool";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {EtaSkill} from "./EtaSkill";

export class EtaSkillWithPool extends EtaSkill {
    // trackers
    public poolXp: number;
    // initial and target
    public initial: RatesWithPool;
    public targets: TargetsWithPool;
    // current rates
    public currentRates: RatesWithPool;
    // targets reached
    public poolReached: boolean;
    protected readonly masteryCheckpoints: number[];

    constructor(...[game, skill, action, settings]: [Game, any, any, Settings]) {
        const args: [Game, any, any, Settings] = [game, skill, action, settings];
        super(...args);
        this.targets = this.getTargets();
        this.poolXp = 0;
        this.currentRates = RatesWithPool.emptyRates;
        this.initial = RatesWithPool.emptyRates;
        // @ts-ignore
        this.masteryCheckpoints = [10, 25, 50, 95, Infinity];
        // flag to check if target was already reached
        this.poolReached = false;
    }

    /***
     * pool methods
     */

    get poolProgress() {
        return this.poolXpToPercentWithModifiers(this.poolXp);
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
        return this.nextPoolCheckpoint / 100 * this.skill.getMasteryPoolCap(this.action.realm);
    }

    /***
     * Interval methods
     */

    get poolCompleted() {
        return !this.poolReached && this.targets.poolCompleted();
    }

    /***
     * Get and set rates
     */

    gainsPerAction() {
        return RatesWithPool.addPoolToRates(
            super.gainsPerAction(),
            0,
        );
    }

    getTargets() {
        return new TargetsWithPool(this, this.settings);
    }

    init(game: Game) {
        super.init(game);
        // get initial values
        // current pool xp
        this.poolXp = this.skill._masteryPoolXP.get(this.action.realm);
        // initial
        this.initial = RatesWithPool.addPoolToRates(
            this.initial,
            this.poolXp,
        );
        // flag to check if target was already reached
        this.poolReached = false;
    }

    setFinalValues() {
        super.setFinalValues();
        if (this.poolCompleted) {
            this.actionsTaken.pool = this.actionsTaken.active.clone();
            this.poolReached = true;
        }
    }

    attemptsToCheckpoint(gainsPerAction: RatesWithPool) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const requiredForPoolCheckPoint = this.nextPoolCheckpointXp - this.poolXp;
        const attemptsToPoolCheckpoint = requiredForPoolCheckPoint / gainsPerAction.pool / gainsPerAction.successRate;
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            attemptsToPoolCheckpoint,
        ));
    }

    addAttempts(gainsPerAction: RatesWithPool, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.poolXp += gainsPerAction.pool * attempts * gainsPerAction.successRate;
    }

    setCurrentRatesNoCheck(gains: RatesWithPool): RatesWithPool {
        return this.currentRates = RatesWithPool.addPoolToRates(
            super.setCurrentRatesNoCheck(gains),
            gains.pool / gains.ms * gains.successRate,
        );
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

    poolXpToPercent(poolXp: number) {
        return (100 * poolXp) / this.skill.getMasteryPoolCap(this.action.realm);
    }

    poolXpToPercentWithModifiers(poolXp: number) {
        return this.poolXpToPercent(poolXp) + this.modifiers.masteryPoolProgress;
    }

    getXpMap() {
        const levels = super.getXpMap();
        levels.set('poolXp', this.poolXp);
        return levels;
    }
}