import {EtaSkill} from "./EtaSkill";

export class Targets {
    public skillLevel: number;
    public skillXp: number;
    public skillLevelTarget: number;
    public hideSkillTarget: boolean;
    protected readonly current: EtaSkill;

    constructor(current: EtaSkill, settings: any) {
        this.current = current;
        if (current.action === undefined) {
            this.skillLevel = 0;
            this.skillXp = 0;
            this.skillLevelTarget = 0;
            this.hideSkillTarget = false;
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
        this.skillLevelTarget = settings.getTargetLevel(current.actionRealmID, current.skill, currentLevel);
        if (this.current.settings.get('SHOW_LEVEL_TARGET')) {
            targets.push(this.skillLevelTarget);
        }
        this.skillLevel = Math.max(1, ...targets);

        // if the skill level target is
        this.hideSkillTarget = this.skillLevelTarget <= currentLevel;
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