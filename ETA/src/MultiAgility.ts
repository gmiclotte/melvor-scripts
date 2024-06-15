import type {Agility} from "../../Game-Files/gameTypes/agility";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {MultiActionSkill} from "./MultiActionSkill";
import {EtaAgility} from "./EtaAgility";
import {MultiRates} from "./MultiRates";

export class MultiAgility extends MultiActionSkill {
    public calculators: Map<string, EtaAgility>;

    constructor(game: Game, agility: Agility, actions: any[], settings: Settings) {
        super(game, agility, actions, settings);
        // keep a copy of the modifiers
        // create the calculators
        this.calculators = new Map<string, EtaAgility>;
        actions.forEach((action: any) => {
            const calculator = new EtaAgility(game, agility, action, settings);
            calculator.init(game);
            this.calculators.set(action.id, calculator);
        });
    }

    get actionInterval() {
        let sumTime = 0;
        this.calculators.forEach((calculator: EtaAgility) => {
            sumTime += calculator.actionInterval;
        });
        return sumTime;
    }

    progress() {
        super.progress();
        this.calculators.forEach(calculator => {
            // TODO recompute negative exp modifiers on this obstacle at mastery 99
        });
    }

    addAttempts(gainsPerAction: MultiRates, attempts: number) {
        this.calculators.forEach((calculator) => {
            const gains = gainsPerAction.rateMap.get(calculator.action.id)!;
            // set course duration
            calculator.courseDuration = gainsPerAction.ms;
            // set current gains before adjusting time back to course duration
            calculator.setCurrentRates(gains);
            // adjust time to time of full course
            gains.ms = calculator.courseDuration;
        });
        super.addAttempts(gainsPerAction, attempts);
    }
}