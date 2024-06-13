import type {Harvesting} from "../../Game-Files/gameTypes/harvesting";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";

export class EtaHarvesting extends EtaSkillWithMastery {
    constructor(game: Game, Harvesting: Harvesting, action: any, settings: Settings) {
        super(game, Harvesting, action, settings);
    }
}