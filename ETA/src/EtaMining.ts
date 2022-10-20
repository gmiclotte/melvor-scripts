import {Mining} from "../../Game-Files/built/rockTicking";
import {CurrentSkill} from "./CurrentSkill";
import {ETASettings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";

export class EtaMining extends CurrentSkill {
    constructor(mining: Mining, action: any, modifiers: PlayerModifiers, settings: ETASettings) {
        console.log(action.id)
        super(mining, action, modifiers, settings);
        this.baseInterval = mining.baseInterval;
    }
}