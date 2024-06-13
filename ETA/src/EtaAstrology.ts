import type {Astrology} from "../../Game-Files/gameTypes/astrology";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";

export class EtaAstrology extends EtaSkillWithMastery {
    constructor(game: Game, astrology: Astrology, action: any, settings: Settings) {
        super(game, astrology, action, settings);
    }

    get actionInterval() {
        // @ts-ignore
        return this.modifyInterval(Astrology.baseInterval);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }
}