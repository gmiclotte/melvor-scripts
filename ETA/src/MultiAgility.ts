import {Agility} from "../../Game-Files/built/agility";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";
import {MultiActionSkill} from "./MultiActionSkill";
import {EtaAgility} from "./EtaAgility";
import {PlayerModifiers} from "../../Game-Files/built/modifier";

export class MultiAgility extends MultiActionSkill {
    protected calculators: Map<string, EtaAgility>;
    protected modifiers: PlayerModifiers;

    constructor(game: Game, agility: Agility, actions: any[], settings: Settings) {
        super(game, agility, actions, settings);
        // keep a copy of the modifiers
        this.modifiers = new PlayerModifiers();
        // create the calculators
        this.calculators = new Map<string, EtaAgility>;
        actions.forEach((action: any) => {
            const calculator = new EtaAgility(game, agility, action, settings);
            calculator.init(game);
            this.calculators.set(action.id, calculator);
        });
    }

    get averageActionTime() {
        let sumTime = 0;
        this.calculators.forEach((calculator: EtaAgility) => {
            sumTime += calculator.averageActionTime;
        });
        return sumTime;
    }

    init(game: Game) {
        super.init(game);
        // copy modifiers object
        this.modifiers = EtaAgility.cloneModifiers(game.modifiers);
        // set all modifiers to the same object
        this.calculators.forEach(calculator => calculator.modifiers = this.modifiers);
    }

    progress() {
        super.progress();
        this.calculators.forEach(calculator => {
            if (calculator.was99Mastery && !calculator.updatedModifiers && calculator.masteryLevel >= 99) {
                this.modifiers.addMappedModifiers(calculator.getObstacleModifierDebuffChange());
                calculator.updatedModifiers = true;
            }
        });
    }
}