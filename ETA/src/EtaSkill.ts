import type {PlayerModifierTable} from "../../Game-Files/gameTypes/modifierTable";
import {Rates} from "./Rates";
import {Targets} from "./Targets";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {ActionCounterWrapper} from "./ActionCounter";

export type etaSkillConstructor<BaseSkill = EtaSkill> = new(...args: any[]) => BaseSkill;

export class EtaSkill {
    public isComputing: boolean;
    public readonly skill: any;
    public readonly action: any;
    // trackers
    public skillXp: number;
    public actionsTaken: ActionCounterWrapper;
    // initial and target
    public initial: Rates;
    public targets: Targets;
    // current rates
    public attemptsPerHour: number;
    public currentRates: Rates;
    // targets reached
    public skillReached: boolean;
    protected readonly modifiers: PlayerModifierTable;
    protected readonly settings: Settings;
    protected currentRatesSet: boolean;
    // other
    protected infiniteActions: boolean;
    protected readonly TICK_INTERVAL: number;

    constructor(...[game, skill, action, settings]: [Game, any, any, Settings]) {
        this.skill = skill;
        this.action = action;
        this.modifiers = game.modifiers;
        this.settings = settings;
        this.targets = this.getTargets();
        this.skill.baseInterval = skill.baseInterval ?? 0;
        this.actionsTaken = new ActionCounterWrapper();
        this.skillXp = 0;
        this.currentRatesSet = false;
        this.attemptsPerHour = 0;
        this.currentRates = Rates.emptyRates;
        this.initial = Rates.emptyRates;
        this.infiniteActions = false;
        // @ts-ignore
        this.TICK_INTERVAL = TICK_INTERVAL;
        // flag to check if target was already reached
        this.skillReached = false;
        this.isComputing = false;
    }

    get skillLevel(): number {
        return this.xpToLevel(this.skillXp);
    }

    /***
     * Interval methods
     */

    get actionInterval() {
        return this.modifyInterval(this.skill.baseInterval);
    }

    // for skills without respawns or failures this is a duplicate of actionInterval
    get averageAttemptTime() {
        return this.actionInterval;
    }

    get successRate() {
        return 1;
    }

    get skillCompleted() {
        return !this.skillReached && this.targets.skillCompleted();
    }

    /***
     * Get and set rates
     */

    gainsPerAction() {
        return new Rates(
            this.actionXP(),
            this.successRate,
            this.averageAttemptTime,
            1, // unit
        );
    }

    actionXP(): number {
        return this.modifyXP(this.action.baseExperience);
    }

    completed() {
        return this.infiniteActions || this.targets.completed();
    }

    getTargets() {
        return new Targets(this, this.settings);
    }

    init(game: Game) {
        this.isComputing = true;
        // get initial values
        // actions performed
        this.actionsTaken.reset();
        // current xp
        this.skillXp = this.skill.xp;
        // initial
        this.initial = new Rates(
            this.skillXp,
            this.successRate,
            0, // ms
            1, // unit
        );
        // current rates have not yet been computed
        this.currentRatesSet = false;
        this.infiniteActions = false;
        // flag to check if target was already reached
        this.skillReached = false;
    }

    setFinalValues() {
        // check targets
        if (this.skillCompleted) {
            this.actionsTaken.skill = this.actionsTaken.active.clone();
            this.skillReached = true;
        }
    }

    iterate(game: Game): void {
        this.init(game);
        // compute the targets
        this.targets = this.getTargets();
        // limit to 1000 iterations, in case something goes wrong
        const maxIt = 1000;
        let it = 0;
        this.setFinalValues();
        while (!this.completed()) {
            this.progress();
            it++;
            if (it >= maxIt) {
                console.error(`ETA skill ${this.skill.id} ran out of iterations for action ${this.action.id} !`);
                break;
            }
        }
        this.setCurrentRates(this.gainsPerAction());
    }

    xpToNextLevel(level: number, xp: number): number {
        const nextXp = this.levelToXp(level + 1);
        /*if (nextXp === xp) {
            return this.xpToNextLevel(level + 1, xp);
        }*/
        return nextXp - xp;
    }

    progress(): void {
        const gainsPerAction = this.gainsPerAction();
        const attempts = this.attemptsToCheckpoint(gainsPerAction);
        if (attempts === Infinity) {
            this.infiniteActions = true;
            return;
        }
        this.addAttempts(gainsPerAction, attempts);
        this.setFinalValues();
    }

    attemptsToCheckpoint(gainsPerAction: Rates) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const requiredForXPCheckPoint = this.xpToNextLevel(this.skillLevel, this.skillXp);
        const attemptsToXPCheckpoint = requiredForXPCheckPoint / gainsPerAction.xp / gainsPerAction.successRate;
        return Math.ceil(attemptsToXPCheckpoint);
    }

    addAttempts(gainsPerAction: Rates, attempts: number) {
        this.skillXp += gainsPerAction.xp * attempts * gainsPerAction.successRate;
        this.actionsTaken.active.actions += attempts;
        this.actionsTaken.active.ms += attempts * gainsPerAction.ms;
    }

    setCurrentRates(gains: Rates) {
        if (!this.currentRatesSet) {
            this.setCurrentRatesNoCheck(gains);
        }
        this.currentRatesSet = true;
    }

    setCurrentRatesNoCheck(gains: Rates): Rates {
        // ms per hour divided by ms per attempt
        this.attemptsPerHour = 3600 * 1000 / this.averageAttemptTime;
        return this.currentRates = new Rates(
            gains.xp / gains.ms * gains.successRate,
            gains.successRate,
            gains.ms,
            1, // unit
        );
    }

    /***
     * XP methods
     */

    xpToLevel(xp: number): number {
        // @ts-ignore 2304
        return exp.xpToLevel(xp) ;
    }

    levelToXp(level: number): number {
        // @ts-ignore 2304
        return exp.levelToXP(level) + 0.00001;
    }

    modifyXP(amount: number) {
        amount *= 1 + this.getXPModifier() / 100;
        if (this.modifiers.halveSkillXP > 0) {
            amount /= 2;
        }
        return amount;
    }

    getXPModifier() {
        let modifier = this.modifiers.getValue(
            "melvorD:skillXP" /* ModifierIDs.skillXP */,
            this.getActionModifierQuery()
        );
        modifier += this.modifiers.nonCombatSkillXP;
        return modifier;
    }

    modifyInterval(interval: number): number {
        const flatModifier = this.getFlatIntervalModifier();
        const percentModifier = this.getPercentageIntervalModifier();
        interval *= 1 + percentModifier / 100;
        interval += flatModifier;
        if (this.modifiers.halveSkillInterval > 0) {
            interval /= 2;
        }
        // @ts-ignore
        interval = roundToTickInterval(interval);
        return Math.max(interval, this.settings.get('minimalActionTime'));
    }

    getFlatIntervalModifier() {
        return this.modifiers.getValue(
            "melvorD:flatSkillInterval" /* ModifierIDs.flatSkillInterval */,
            this.getActionModifierQuery()
        );
    }

    getPercentageIntervalModifier() {
        return this.modifiers.getValue(
            "melvorD:skillInterval" /* ModifierIDs.skillInterval */,
            this.getActionModifierQuery()
        );
    }

    getXpMap() {
        const levels = new Map<string, number>();
        levels.set('skillXp', this.skillXp);
        return levels;
    }

    getActionModifierQuery() {
        return this.skill.getActionModifierQuery(this.action)
    }
}