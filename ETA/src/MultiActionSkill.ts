import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {RatesWithMastery} from "./RatesWithMastery";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {MultiRates} from "./MultiRates";
import {EtaSkillWithPool} from "./EtaSkillWithPool";
import type {Realm} from "../../Game-Files/gameTypes/realms";

export class MultiActionSkill extends EtaSkillWithPool {
    public calculators: Map<string, EtaSkillWithMastery>;
    private _actionRealm: Realm | undefined;

    constructor(game: Game, skill: any, actions: any[], settings: Settings) {
        super(game, skill, {}, settings);
        // init
        this.calculators = new Map<string, EtaSkillWithMastery>;
        // set realm
        actions.forEach((action: any) => {
            this._actionRealm = action.realm;
        });
    }

    get masteryCompleted() {
        let done = true;
        this.calculators.forEach((calculator: EtaSkillWithMastery) => done &&= calculator.masteryCompleted);
        return done;
    }

    get weights(): Map<string, number> {
        const weights = new Map<string, number>();
        this.calculators.forEach((calculator: EtaSkillWithMastery, actionID: string) => {
            weights.set(actionID, 1);
        });
        return weights;
    }

    actionRealm(): Realm {
        return this._actionRealm!;
    }

    completed() {
        if (this.infiniteActions) {
            return true;
        }
        if (!this.targets.completed()) {
            return false;
        }
        let masteriesCompleted = true;
        this.calculators.forEach((calculator) => {
            if (!calculator.completed()) {
                masteriesCompleted = false;
            }
        });
        return masteriesCompleted;
    }

    gainsPerAction() {
        const rateMap = new Map<string, RatesWithMastery>();
        let xp = 0;
        let mastery = 0;
        const weights = this.weights;
        this.calculators.forEach((calculator: EtaSkillWithMastery, actionID: string) => {
            rateMap.set(actionID, calculator.gainsPerAction());
        });
        this.calculators.forEach((calculator: EtaSkillWithMastery, actionID: string) => {
            const gains = rateMap.get(actionID)!;
            const weight = weights.get(actionID)!;
            xp += gains.xp * weight;
            mastery += gains.mastery * weight;
        });
        const pool = this.poolPerAction(mastery);
        return new MultiRates(
            rateMap,
            xp,
            0,
            pool,
            this.successRate,
            this.averageAttemptTime,
            1,
        );
    }

    attemptsToCheckpoint(gainsPerAction: MultiRates) {
        const attemptsToMasteryCheckpoints: number[] = [];
        const weights = this.weights;
        this.calculators.forEach((calculator, actionID) => {
            if (calculator.checkMasteryMilestone(99)) {
                return;
            }
            const rates = gainsPerAction.rateMap.get(actionID)!;
            const requiredForMasteryCheckPoint = calculator.masteryXpToNextLevel(calculator.masteryLevel, calculator.masteryXp);
            attemptsToMasteryCheckpoints.push(
                requiredForMasteryCheckPoint
                / rates.mastery
                / weights.get(actionID)!
            );
        });
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            ...attemptsToMasteryCheckpoints,
        ));
    }

    init(game: Game) {
        super.init(game);
        this.isComputing = true;
        this.calculators.forEach((calculator) => calculator.init(game));
    }

    setFinalValues() {
        super.setFinalValues();
        this.calculators.forEach((calculator) => {
            calculator.setFinalValues();
        });
    }

    addAttempts(gainsPerAction: MultiRates, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.calculators.forEach((calculator) => {
            const gains = gainsPerAction.rateMap.get(calculator.action.id)!;
            calculator.addAttempts(gains, attempts);
            calculator.skillXp = this.skillXp;
            calculator.poolXp = this.poolXp;
            calculator.setCurrentRates(gains);
        });
    }
}