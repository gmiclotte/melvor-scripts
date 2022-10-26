import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {EtaSkillWithPool} from "./EtaSkillWithPool";
import {MasteryAction} from "../../Game-Files/built/mastery2";
import {Targets} from "./Targets";

export class TargetsWithPool extends Targets {
    public poolPercent: number;
    public poolXp: number;
    protected readonly current!: EtaSkillWithPool;

    constructor(current: EtaSkillWithPool, settings: any, skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any = undefined) {
        super(current, settings, skill, action);
        if (action === undefined) {
            this.poolPercent = 0;
            this.poolXp = 0;
            return this;
        }
        // target pool percentage
        const pool = (100 * skill.masteryPoolXP) / skill.masteryPoolCap;
        this.poolPercent = settings.getTargetPool(skill.name, pool);
        this.poolXp = this.poolPercent / 100 * skill.masteryPoolCap;
    }

    poolCompleted(): boolean {
        return this.poolXp <= this.current.poolXp;
    }

    completed(): boolean {
        if (!super.completed()) {
            return false;
        }
        // check pool xp
        return this.poolCompleted();
    }
}