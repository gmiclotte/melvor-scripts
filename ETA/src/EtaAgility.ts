import type {Agility} from "../../Game-Files/gameTypes/agility";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";

export class EtaAgility extends EtaSkillWithMastery {
    public courseDuration: number;

    constructor(game: Game, agility: Agility, action: any, settings: Settings) {
        super(game, agility, action, settings);
        this.courseDuration = Infinity;
    }

    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    // rescale this for displaying actions per hour
    get averageAttemptTime() {
        return this.courseDuration === Infinity ? this.actionInterval : this.courseDuration;
    }

    init(game: Game) {
        super.init(game);
    }

    getPercentageIntervalModifier() {
        let modifier = super.getPercentageIntervalModifier();
        // Mastery Level Scaling: Every 10 levels, reduce the interval by 3%
        const changeIn10MasteryLevel = Math.floor(this.masteryLevel / 10) - Math.floor(this.initialMasteryLevel / 10);
        modifier -= changeIn10MasteryLevel * 3;
        return modifier;
    }

    getMelvorXPModifier() {
        let modifier = super.getMelvorXPModifier();
        // TODO recompute negative exp modifiers on this obstacle at mastery 99
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        // TODO recompute negative mastery modifiers on this obstacle at mastery 99
        return modifier;
    }
}