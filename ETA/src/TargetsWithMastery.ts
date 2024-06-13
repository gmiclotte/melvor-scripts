import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {TargetsWithPool} from "./TargetsWithPool";

export class TargetsWithMastery extends TargetsWithPool {
    public masteryLevel: number;
    public masteryXp: number;
    protected readonly current!: EtaSkillWithMastery;

    constructor(current: EtaSkillWithMastery, settings: any) {
        super(current, settings);
        if (current.action === undefined) {
            this.masteryLevel = 0;
            this.masteryXp = 0;
            return this;
        }
        // target mastery
        const currentMastery = current.skill.getMasteryLevel(current.action);
        this.masteryLevel = settings.getTargetMastery(current.skill.id, currentMastery);
        this.masteryXp = this.current.masteryLevelToXp(this.masteryLevel);
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