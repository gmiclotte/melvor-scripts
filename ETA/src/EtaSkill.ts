import type {PlayerModifierTable} from "../../Game-Files/gameTypes/modifierTable";
import {Rates} from "./Rates";
import {Targets} from "./Targets";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {ActionCounterWrapper} from "./ActionCounter";
import type {Realm} from "../../Game-Files/gameTypes/realms";

export type etaSkillConstructor<BaseSkill = EtaSkill> = new(...args: any[]) => BaseSkill;

export class EtaSkill {
    public isComputing: boolean;
    public readonly skill: any;
    public action: any;
    // trackers
    public skillXp: number;
    public actionsTaken: ActionCounterWrapper;
    // initial and target
    public initial: Rates;
    // @ts-ignore
    public targets: Targets;
    public nextMilestone: number;
    public milestoneMedia: string[];
    // current rates
    public attemptsPerHour: number;
    public currentRates: Rates;
    // targets reached
    public nextSkillReached: boolean;
    public nextMilestoneReached: boolean;
    public skillReached: boolean;
    public readonly settings: Settings;
    protected readonly modifiers: PlayerModifierTable;
    protected currentRatesSet: boolean;
    // other
    protected infiniteActions: boolean;
    protected readonly TICK_INTERVAL: number;

    constructor(...[game, skill, action, settings]: [Game, any, any, Settings]) {
        this.skill = skill;
        this.action = action;
        this.modifiers = game.modifiers;
        this.settings = settings;
        this.initial = Rates.emptyRates;
        this.skill.baseInterval = skill.baseInterval ?? 0;
        this.actionsTaken = new ActionCounterWrapper();
        this.skillXp = 0;
        this.nextMilestone = 0;
        this.milestoneMedia = [];
        this.currentRatesSet = false;
        this.attemptsPerHour = 0;
        this.currentRates = Rates.emptyRates;
        this.infiniteActions = false;
        // @ts-ignore
        this.TICK_INTERVAL = TICK_INTERVAL;
        // flag to check if target was already reached
        this.nextSkillReached = false;
        this.nextMilestoneReached = false;
        this.skillReached = false;
        this.isComputing = false;
    }

    get levelReqReached(): boolean {
        return this.action.level <= this.skill.level
            && this.action.abyssalLevel <= this.skill.abyssalLevel;
    }

    get actionLevel(): number {
        const realmID = this.actionRealmID;
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            return this.action.level;
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            return this.action.abyssalLevel;
        }
        return 0;
    }

    get skillLevel(): number {
        return this.xpToLevel(this.skillXp);
    }

    get initialVirtualLevel(): number {
        return this.xpToLevel(this.initial.xp);
    }

    get melvorSkillLevel(): number {
        if (this.actionRealmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            // compute the currently simulated skill level when we are in Melvor
            return Math.min(this.skillLevel, this.skill.currentLevelCap);
        }
        // return the current skill level in case we are in another realm
        return this.skill.level;
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
        return !this.skillReached && this.skillLevel >= this.targets.skillLevelTarget;
    }

    get nextSkillCompleted() {
        return !this.nextSkillReached && this.skillLevel >= this.initialVirtualLevel + 1;
    }

    get nextMilestoneCompleted() {
        return !this.nextMilestoneReached && this.skillLevel >= this.nextMilestone;
    }

    get activeRealmID(): string {
        // @ts-ignore
        return this.activeRealm().id;
    }

    get actionRealmID(): string {
        // @ts-ignore
        return this.actionRealm().id;
    }

    get actionIsInActiveRealm(): boolean {
        return this.actionRealmID === this.activeRealmID;
    }

    setNextMilestone(): void {
        const realmID = this.actionRealmID;
        let milestones: any[] = [];
        let milestoneLevels: number[] = [];
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            milestones = this.skill.milestones;
            milestoneLevels = milestones.map((x: any) => x.level);
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            milestones = this.skill.abyssalMilestones;
            milestoneLevels = milestones.map((x: any) => x.abyssalLevel);
        }
        this.nextMilestone = milestoneLevels.find((milestone: number) => milestone > this.skillLevel) ?? Infinity;
        if (this.nextMilestone === Infinity) {
            this.nextMilestoneReached = true;
            return;
        }
        this.milestoneMedia = [];
        milestones.forEach((milestone: number, idx: number) => {
            if (milestoneLevels[idx] === this.nextMilestone) {
                this.milestoneMedia.push(milestones[idx].media);
            }
        });
    }

    activeRealm(): Realm {
        return this.skill.currentRealm;
    }

    actionRealm(): Realm {
        return this.action.realm;
    }

    skip() {
        return !this.actionIsInActiveRealm;
    }

    /***
     * Get and set rates
     */

    gainsPerAction() {
        return new Rates(
            this.actionXP(this.actionRealmID),
            this.successRate,
            this.averageAttemptTime,
            1, // unit
        );
    }

    actionXP(realmID: string): number {
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            return this.modifyMelvorXP(this.action.baseExperience);
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            return this.modifyAbyssalXP(this.action.baseAbyssalExperience);
        }
        return 0;
    }

    completed() {
        return this.infiniteActions || this.targets.completed();
    }

    getTargets() {
        return new Targets(this, this.settings);
    }

    init(game: Game) {
        const realmID = this.actionRealmID;
        this.isComputing = true;
        // get initial values
        // actions performed
        this.actionsTaken.reset();
        // current xp
        this.skillXp = 0;
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            this.skillXp = this.skill.xp;
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            this.skillXp = this.skill.abyssalXP;
        }
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
        this.nextSkillReached = !this.settings.get('SHOW_LEVEL_NEXT');
        this.nextMilestoneReached = !this.settings.get('SHOW_LEVEL_MILESTONE');
        this.skillReached = !this.settings.get('SHOW_LEVEL_TARGET');
        // compute the targets
        this.setNextMilestone();
    }

    setFinalValues() {
        // check targets
        if (this.nextSkillCompleted) {
            this.actionsTaken.nextSkill = this.actionsTaken.active.clone();
            this.nextSkillReached = true;
        }
        if (this.nextMilestoneCompleted) {
            this.actionsTaken.nextMilestone = this.actionsTaken.active.clone();
            this.nextMilestoneReached = true;
        }
        if (this.skillCompleted) {
            this.actionsTaken.skill = this.actionsTaken.active.clone();
            this.skillReached = true;
        }
    }

    iterate(game: Game): void {
        this.init(game);
        this.targets = this.getTargets();
        this.iterateInner();
        this.setCurrentRates(this.gainsPerAction());
    }

    iterateInner(): void {
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
    }

    xpToNextLevel(level: number, xp: number): number {
        let nextXp = this.levelToXp(level + 1);
        while (nextXp <= xp) {
            level++;
            nextXp = this.levelToXp(level + 1);
        }
        return nextXp - xp;
    }

    masteryXpToNextLevel(level: number, xp: number): number {
        let nextXp = this.masteryLevelToXp(level + 1);
        while (nextXp <= xp) {
            level++;
            nextXp = this.masteryLevelToXp(level + 1);
        }
        return nextXp - xp;
    }

    progress(): void {
        const gainsPerAction = this.gainsPerAction();
        let attempts = this.attemptsToCheckpoint(gainsPerAction);
        if (attempts === Infinity) {
            this.infiniteActions = true;
            return;
        }
        if (attempts < 1) {
            console.warn('ETA: attempts to checkpoint is lower than 1:', attempts, this);
            attempts = 1;
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
        const realmID = this.actionRealmID;
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            // @ts-ignore 2304
            return exp.xpToLevel(xp);
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            // @ts-ignore 2304
            return abyssalExp.xpToLevel(xp);
        }
        return 1;
    }

    levelToXp(level: number): number {
        const realmID = this.actionRealmID;
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            // @ts-ignore 2304
            return exp.levelToXP(level);
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            // @ts-ignore 2304
            return abyssalExp.levelToXP(level);
        }
        return 1;
    }

    masteryXpToLevel(xp: number): number {
        // @ts-ignore 2304
        return exp.xpToLevel(xp);
    }

    masteryLevelToXp(level: number): number {
        // @ts-ignore 2304
        return exp.levelToXP(level) + 0.00001;
    }

    modifyMelvorXP(amount: number) {
        amount *= 1 + this.getMelvorXPModifier() / 100;
        if (this.modifiers.halveSkillXP > 0) {
            amount /= 2;
        }
        return amount;
    }

    modifyAbyssalXP(amount: number) {
        amount *= 1 + this.getAbyssalXPModifier() / 100;
        return amount;
    }

    getMelvorXPModifier() {
        let modifier = this.modifiers.getValue(
            "melvorD:skillXP" /* ModifierIDs.skillXP */,
            this.getActionModifierQuery()
        );
        modifier += this.modifiers.nonCombatSkillXP;
        return modifier;
    }

    getAbyssalXPModifier() {
        let modifier = this.modifiers.getValue(
            "melvorD:abyssalSkillXP" /* ModifierIDs.abyssalSkillXP */,
            this.getActionModifierQuery()
        );
        if (this.skill.isCombat) {
            modifier += this.modifiers.abyssalCombatSkillXP;
        }
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