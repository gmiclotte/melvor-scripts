import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {MasteryAction} from "../../Game-Files/built/mastery2";
import {Targets} from "./Targets";

export class TargetsWithMastery extends Targets {
    public masteryLevel: number;
    public masteryXp: number;
    public poolPercent: number;
    public poolXp: number;
    protected readonly current!: EtaSkillWithMastery;

    constructor(current: EtaSkillWithMastery, settings: any, skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any = undefined) {
        super(current, settings, skill, action);
        if (action === undefined) {
            this.masteryLevel = 0;
            this.masteryXp = 0;
            this.poolPercent = 0;
            this.poolXp = 0;
            return this;
        }
        // target mastery
        if (skill.hasMastery) {
            const mastery = skill.getMasteryXP(action);
            this.masteryLevel = settings.getTargetMastery(skill.name, mastery);
            this.masteryXp = this.current.levelToXp(this.masteryLevel);
        } else {
            this.masteryLevel = 0;
            this.masteryXp = 0;
        }
        // target pool percentage
        if (skill.hasMastery) {
            const pool = (100 * skill.masteryPoolXP) / skill.masteryPoolCap;
            this.poolPercent = settings.getTargetPool(skill.name, pool);
            this.poolXp = this.poolPercent / 100 * skill.masteryPoolCap;
        } else {
            this.poolPercent = 0;
            this.poolXp = 0;
        }
    }

    skillCompleted(): boolean {
        return this.skillXp <= this.current.skillXp;
    }

    masteryCompleted(): boolean {
        return this.masteryXp <= this.current.masteryXp;
    }

    poolCompleted(): boolean {
        return this.poolXp <= this.current.poolXp;
    }

    completed(): boolean {
        if (!super.completed()) {
            return false;
        }
        // check mastery xp
        if (!this.masteryCompleted()) {
            return false;
        }
        // check pool xp
        if (!this.poolCompleted()) {
            return false;
        }
        return true;
    }
}