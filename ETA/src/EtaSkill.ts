import {PlayerModifiers, SkillModifierObject} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {Rates} from "./Rates";
import {Targets} from "./Targets";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {ActionCounterWrapper} from "./ActionCounter";

export type etaSkillConstructor<BaseSkill = EtaSkill> = new(...args: any[]) => BaseSkill;

export class EtaSkill {
    public readonly skill: any;
    public readonly action: any;
    // trackers
    public skillXp: number;
    public actionsTaken: ActionCounterWrapper;
    // initial and target
    public initial: Rates;
    public targets: Targets;
    // current rates
    public currentRates: Rates;
    // targets reached
    public skillReached: boolean;
    protected readonly modifiers: PlayerModifiers;
    protected readonly astrology: Astrology;
    protected currentRatesSet: boolean;
    // other
    protected infiniteActions: boolean;
    protected readonly TICK_INTERVAL: number;

    constructor(...[game, skill, action, settings]: [Game, any, any, Settings]) {
        this.skill = skill;
        this.action = action;
        this.modifiers = game.modifiers;
        this.astrology = game.astrology;
        this.targets = new Targets(this, settings, skill, action);
        this.skill.baseInterval = skill.baseInterval ?? 0;
        this.actionsTaken = new ActionCounterWrapper();
        this.skillXp = 0;
        this.currentRatesSet = false;
        this.currentRates = Rates.emptyRates;
        this.initial = Rates.emptyRates;
        this.infiniteActions = false;
        // @ts-ignore
        this.TICK_INTERVAL = TICK_INTERVAL;
        // flag to check if target was already reached
        this.skillReached = false;
    }

    /***
     * Get and set rates
     */

    get gainsPerAction() {
        return new Rates(
            this.actionXP,
            this.averageActionTime,
            1, // unit
        );
    }

    get averageRates(): Rates {
        return new Rates(
            (this.skillXp - this.initial.xp) / this.actionsTaken.active.ms,
            this.actionsTaken.active.ms / this.actionsTaken.active.actions, // ms per action
            1, // unit
        );
    }

    get skillLevel(): number {
        return this.xpToLevel(this.skillXp);
    }

    get actionXP(): number {
        return this.modifyXP(this.action.baseExperience);
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

    get completed() {
        return this.infiniteActions || this.targets.completed();
    }

    get skillCompleted() {
        return !this.skillReached && this.targets.skillCompleted();
    }

    getTargets(settings: Settings) {
        return new Targets(this, settings, this.skill, this.action);
    }

    init(game: Game) {
        // get initial values
        // actions performed
        this.actionsTaken.reset();
        // current xp
        this.skillXp = this.skill.xp;
        // initial
        this.initial = new Rates(
            this.skillXp,
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
        const maxIt = 1000;
        let it = 0;
        this.setFinalValues();
        while (!this.completed) {
            this.progress();
            it++;
            if (it >= maxIt) {
                console.error(`ETA skill ${this.skill.name} ran out of iterations for action ${this.action.name} !`);
                break;
            }
        }
        this.setCurrentRates(this.gainsPerAction);
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
        const actions = this.actionsToCheckpoint(gainsPerAction);
        if (actions === Infinity) {
            this.infiniteActions = true;
            return;
        }
        this.addActions(gainsPerAction, actions);
        this.setFinalValues();
    }

    actionsToCheckpoint(gainsPerAction: Rates) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const requiredForXPCheckPoint = this.xpToNextLevel(this.skillLevel, this.skillXp);
        const actionsToXPCheckpoint = requiredForXPCheckPoint / gainsPerAction.xp;
        return Math.ceil(actionsToXPCheckpoint);
    }

    addActions(gainsPerAction: Rates, actions: number) {
        this.skillXp += gainsPerAction.xp * actions;
        this.actionsTaken.active.actions += actions;
        this.actionsTaken.active.ms += actions * gainsPerAction.ms;
    }

    setCurrentRates(gains: Rates) {
        if (!this.currentRatesSet) {
            this.setCurrentRatesNoCheck(gains);
        }
        this.currentRatesSet = true;
    }

    setCurrentRatesNoCheck(gains: Rates): Rates {
        return this.currentRates = new Rates(
            gains.xp / gains.ms,
            gains.ms,
            1, // unit
        );
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
        return this.modifiers.increasedGlobalSkillXP
            - this.modifiers.decreasedGlobalSkillXP
            + this.modifiers.increasedNonCombatSkillXP
            - this.modifiers.decreasedNonCombatSkillXP
            + this.getSkillModifierValue('increasedSkillXP')
            - this.getSkillModifierValue('decreasedSkillXP');
    }

    getSkillModifierValue(modifierID: string): number {
        return this.modifiers.getSkillModifierValue(modifierID as keyof SkillModifierObject<any>, this.skill);
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