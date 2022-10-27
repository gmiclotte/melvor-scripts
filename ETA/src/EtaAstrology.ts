import {Astrology} from "../../Game-Files/built/astrology";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";

export class EtaAstrology extends EtaSkillWithMastery {
    constructor(game: Game, astrology: Astrology, action: any, settings: Settings) {
        super(game, astrology, action, settings);
    }

    get actionInterval() {
        return this.modifyInterval(Astrology.baseInterval);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }
}