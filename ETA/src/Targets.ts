import {EtaSkill} from "./EtaSkill";

export class Targets {
    public skillLevel: number;
    public skillXp: number;
    protected readonly current: EtaSkill;

    constructor(current: EtaSkill, settings: any) {
        this.current = current;
        if (current.action === undefined) {
            this.skillLevel = 0;
            this.skillXp = 0;
            return this;
        }
        // target level
        const currentLevel = current.initialVirtualLevel;
        this.skillLevel = settings.getTargetLevel(current.action.realm.id, current.skill.id, currentLevel);
        this.skillXp = this.current.levelToXp(this.skillLevel);
    }

    skillCompleted(): boolean {
        return this.skillXp <= this.current.skillXp;
    }

    completed(): boolean {
        // check skill xp
        return this.skillCompleted();
    }
}