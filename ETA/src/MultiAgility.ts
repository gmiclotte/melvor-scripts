import type {Agility} from "../../Game-Files/gameTypes/agility";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {MultiActionSkill} from "./MultiActionSkill";
import {EtaAgility} from "./EtaAgility";
// TODO import type {PlayerModifiers} from "../../Game-Files/gameTypes/modifier";
import {MultiRates} from "./MultiRates";

export class MultiAgility extends MultiActionSkill {
    public calculators: Map<string, EtaAgility>;
    // TODO protected modifiers: PlayerModifiers;

    constructor(game: Game, agility: Agility, actions: any[], settings: Settings) {
        super(game, agility, actions, settings);
        // keep a copy of the modifiers
        // @ts-ignore
        this.modifiers = new PlayerModifiers();
        // create the calculators
        this.calculators = new Map<string, EtaAgility>;
        actions.forEach((action: any) => {
            const calculator = new EtaAgility(game, agility, action, settings);
            calculator.init(game);
            this.calculators.set(action.id, calculator);
        });
    }
/*
    get actionInterval() {
        let sumTime = 0;
        this.calculators.forEach((calculator: EtaAgility) => {
            sumTime += calculator.actionInterval;
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
    */
}