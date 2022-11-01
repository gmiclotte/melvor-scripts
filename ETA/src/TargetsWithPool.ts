import {EtaSkillWithPool} from "./EtaSkillWithPool";
import {Targets} from "./Targets";

export class TargetsWithPool extends Targets {
    public poolPercent: number;
    public poolXp: number;
    protected readonly current!: EtaSkillWithPool;

    constructor(current: EtaSkillWithPool, settings: any) {
        super(current, settings);
        if (current.action === undefined) {
            this.poolPercent = 0;
            this.poolXp = 0;
            return this;
        }
        // target pool percentage
        const currentPool = (100 * current.skill.masteryPoolXP) / current.skill.masteryPoolCap;
        this.poolPercent = settings.getTargetPool(current.skill.id, currentPool);
        this.poolXp = this.poolPercent / 100 * current.skill.masteryPoolCap;
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