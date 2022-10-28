import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {MasteryAction} from "../../Game-Files/built/mastery2";
import {TargetsWithPool} from "./TargetsWithPool";

export class TargetsWithMastery extends TargetsWithPool {
    public masteryLevel: number;
    public masteryXp: number;
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
        // @ts-ignore
        const skillID = skill.id;
        // target mastery
        const mastery = skill.getMasteryXP(action);
        this.masteryLevel = settings.getTargetMastery(skillID, mastery);
        this.masteryXp = this.current.levelToXp(this.masteryLevel);
    }

    masteryCompleted(): boolean {
        return this.masteryXp <= this.current.masteryXp;
    }

    completed(): boolean {
        if (!super.completed()) {
            return false;
        }
        // check mastery xp
        return this.masteryCompleted();
    }
}