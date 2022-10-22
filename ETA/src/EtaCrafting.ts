import {Crafting} from "../../Game-Files/built/crafting";
import {ETASettings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceEtaSkill} from "./ResourceEtaSkill";
import {Game} from "../../Game-Files/built/game";

export class EtaCrafting extends ResourceEtaSkill {
    constructor(game: Game, crafting: Crafting, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: ETASettings) {
        super(game, crafting, action, modifiers, astrology, settings);
    }
}