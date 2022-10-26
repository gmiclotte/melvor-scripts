import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {RatesWithMastery} from "./RatesWithMastery";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {MultiRates} from "./MultiRates";
import {EtaSkillWithPool} from "./EtaSkillWithPool";

export class MultiActionSkill extends EtaSkillWithPool {
    protected calculators: Map<string, EtaSkillWithMastery>;

    constructor(game: Game, skill: any, actions: any[], settings: Settings) {
        super(game, skill, {}, settings);
        this.calculators = new Map<string, EtaSkillWithMastery>;
        actions.forEach((action: any) => this.calculators.set(
            action.id,
            new EtaSkillWithMastery(game, skill, action, settings),
        ));
    }

    get masteryCompleted() {
        let done = true;
        this.calculators.forEach((calculator: EtaSkillWithMastery) => done &&= calculator.masteryCompleted);
        return done;
    }

    get averageActionTime() {
        return this.actionInterval;
    }

    get actionInterval() {
        return this.modifyInterval(this.skill.baseInterval);
    }

    get weights(): Map<string, number> {
        const weights = new Map<string, number>();
        this.calculators.forEach((calculator: EtaSkillWithMastery, actionID: string) => {
            weights.set(actionID, 1);
        });
        return weights;
    }

    get gainsPerAction() {
        const rateMap = new Map<string, RatesWithMastery>();
        let xp = 0;
        let mastery = 0;
        let ms = this.averageActionTime;
        let maxTime = 0;
        this.calculators.forEach((calculator: EtaSkillWithMastery, actionID: string) => {
            const gains = calculator.gainsPerAction;
            rateMap.set(actionID, gains);
            maxTime = Math.max(maxTime, gains.ms);
        });
        this.calculators.forEach((calculator: EtaSkillWithMastery, actionID: string) => {
            const gains = rateMap.get(actionID)!;
            const weight = maxTime / gains.ms;
            xp += gains.xp * weight;
            mastery += gains.mastery * weight;
            ms = Math.max(ms, gains.ms);
        });
        const pool = this.poolPerAction(mastery);
        return new MultiRates(
            rateMap,
            xp,
            0,
            pool,
            ms,
            1,
        );
    }

    actionsToCheckpoint(gainsPerAction: MultiRates) {
        const actionsToMasteryCheckpoints: number[] = [];
        const weights = this.weights;
        this.calculators.forEach((calculator, actionID) => {
            const rates = gainsPerAction.rateMap.get(actionID)!;
            const requiredForMasteryCheckPoint = calculator.xpToNextLevel(calculator.masteryLevel, calculator.masteryXp);
            actionsToMasteryCheckpoints.push(
                requiredForMasteryCheckPoint
                / rates.mastery
                / weights.get(actionID)!
            );
        });
        return Math.ceil(Math.min(
            super.actionsToCheckpoint(gainsPerAction),
            ...actionsToMasteryCheckpoints,
        ));
    }

    init(game: Game) {
        this.calculators.forEach((calculator) => calculator.init(game));
        // get initial values
        // actions performed
        this.actionsTaken.reset();
        // current xp
        this.skillXp = this.skill.xp;
        // current pool xp
        this.poolXp = this.skill.masteryPoolXP;
        // initial
        this.initial = new RatesWithMastery(
            this.skillXp,
            -Infinity,
            this.poolXp,
            0, // ms
            1, // unit
        );
        // flag to check if target was already reached
        this.poolReached = false;
    }

    setFinalValues() {
        super.setFinalValues();
        this.calculators.forEach((calculator) => {
            calculator.skillXp = this.skillXp;
            calculator.poolXp = this.poolXp;
            calculator.setFinalValues();
        });
    }

    addActions(gainsPerAction: MultiRates, actions: number) {
        super.addActions(gainsPerAction, actions);
    }
}