import {Woodcutting} from "../../Game-Files/built/woodcutting";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {MultiActionSkill} from "./MultiActionSkill";
import {EtaWoodcutting} from "./EtaWoodcutting";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";

export class WoodcuttingMultiAction extends MultiActionSkill {
    protected calculators: Map<string, EtaWoodcutting>;

    constructor(game: Game, woodcutting: Woodcutting, actions: any[], settings: Settings) {
        super(game, woodcutting, actions, settings);
        this.calculators = new Map<string, EtaWoodcutting>;
        actions.forEach((action: any) => {
            const calculator = new EtaWoodcutting(game, woodcutting, action, settings);
            calculator.init(game);
            this.calculators.set(action.id, calculator);
        });
        let maxTime = 0;
        actions.forEach((action: any) => maxTime = Math.max(
            maxTime,
            this.calculators.get(action.id)!.actionInterval),
        );
    }

    get weights(): Map<string, number> {
        let maxTime = 0;
        const weights = new Map<string, number>();
        this.calculators.forEach((calculator: EtaSkillWithMastery, actionID: string) => {
            maxTime = Math.max(maxTime, calculator.averageActionTime);
            weights.set(actionID, calculator.averageActionTime);
        });
        weights.forEach((weight: number, actionID: string) => {
            weights.set(actionID, maxTime / weights.get(actionID)!);
        });
        return weights;
    }
}
