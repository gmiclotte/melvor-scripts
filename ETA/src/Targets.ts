import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {MasteryAction} from "../../Game-Files/built/mastery2";
import {EtaSkill} from "./EtaSkill";

export class Targets {
    public skillLevel: number;
    public skillXp: number;
    protected readonly current: EtaSkill;

    constructor(current: EtaSkill, settings: any, skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any = undefined) {
        this.current = current;
        if (action === undefined) {
            this.skillLevel = 0;
            this.skillXp = 0;
            return this;
        }
        // target level
        this.skillLevel = settings.getTargetLevel(skill.name, skill.level);
        this.skillXp = this.current.levelToXp(this.skillLevel);
    }

    skillCompleted(): boolean {
        return this.skillXp <= this.current.skillXp;
    }

    completed(): boolean {
        // check skill xp
        if (!this.skillCompleted()) {
            return false;
        }
        return true;
    }
}