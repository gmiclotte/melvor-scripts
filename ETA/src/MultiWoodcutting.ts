import {Woodcutting} from "../../Game-Files/built/woodcutting";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {MultiActionSkill} from "./MultiActionSkill";
import {EtaWoodcutting} from "./EtaWoodcutting";

export class MultiWoodcutting extends MultiActionSkill {
    public calculators: Map<string, EtaWoodcutting>;

    constructor(game: Game, woodcutting: Woodcutting, actions: any[], settings: Settings) {
        super(game, woodcutting, actions, settings);
        // create calculators
        this.calculators = new Map<string, EtaWoodcutting>;
        actions.forEach((action: any) => {
            const calculator = new EtaWoodcutting(game, woodcutting, action, settings);
            calculator.init(game);
            this.calculators.set(action.id, calculator);
        });
    }

    get weights(): Map<string, number> {
        let maxTime = 0;
        const weights = new Map<string, number>();
        this.calculators.forEach((calculator, actionID) => {
            maxTime = Math.max(maxTime, calculator.actionInterval);
            weights.set(actionID, calculator.actionInterval);
        });
        weights.forEach((weight, actionID) => {
            weights.set(actionID, maxTime / weights.get(actionID)!);
        });
        return weights;
    }

    get actionInterval() {
        let maxTime = 0;
        this.calculators.forEach(calculator => {
            maxTime = Math.max(maxTime, calculator.actionInterval);
        });
        return maxTime;
    }
}
