import {Woodcutting} from "../../Game-Files/built/woodcutting";
import {EtaSkill} from "./EtaSkill";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";

export class EtaWoodcutting extends EtaSkill {
    constructor(game: Game, woodcutting: Woodcutting, action: any, settings: Settings) {
        super(game, woodcutting, action, settings);
    }

    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.masteryLevel >= 99) {
            modifier -= 200;
        }
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }
}