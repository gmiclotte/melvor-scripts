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
        let targets: number[] = [];

        if (this.current.settings.get('SHOW_LEVEL_NEXT')) {
            targets.push(currentLevel + 1);
        }
        if (this.current.settings.get('SHOW_LEVEL_MILESTONE') && current.nextMilestone !== Infinity) {
            targets.push(current.nextMilestone);
        }
        if (this.current.settings.get('SHOW_LEVEL_TARGET')) {
            targets.push(settings.getTargetLevel(current.actionRealmID, current.skill.id, currentLevel));
        }
        this.skillLevel = Math.max(1, ...targets);
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