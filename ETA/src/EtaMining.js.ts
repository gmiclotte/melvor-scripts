import {Mining} from "../../Game-Files/built/rockTicking";
import {CurrentSkill} from "./CurrentSkill";

export class EtaMining extends CurrentSkill {
    constructor(mining: Mining) {
        super(mining);
        this.baseInterval = mining.baseInterval;
    }
}