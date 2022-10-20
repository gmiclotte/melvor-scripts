import {SkillWithMastery} from "../../Game-Files/built/skill";

export class Targets {
    public level: number;
    public skillXp: number;
    public mastery: number;
    public masteryXp: number;
    public poolPercent: number;
    public poolXp: number;
    public materials: boolean;
    public consumables: boolean;

    constructor(settings: any, skill: SkillWithMastery, action: any = undefined) {
        if (action === undefined) {
            this.level = 0;
            this.skillXp = 0;
            this.mastery = 0;
            this.masteryXp = 0;
            this.poolPercent = 0;
            this.poolXp = 0;
            this.materials = false;
            this.consumables = false;
            return this;
        }
        // target level
        this.level = settings.getTargetLevel(skill.name, skill.level);
        this.skillXp = this.level_to_xp(this.level);
        // target mastery
        if (skill.hasMastery) {
            const mastery = skill.getMasteryXP(action);
            this.mastery = settings.getTargetMastery(skill.name, mastery);
            this.masteryXp = this.level_to_xp(this.mastery);
        } else {
            this.mastery = 0;
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
        // flag to compute remaining time materials or consumables
        this.materials = false; // regular crafting materials, e.g. raw fish or ores
        this.consumables = false; // additional consumables e.g. potions, mysterious stones
    }

    level_to_xp(level: number): number {
        if (level === 0) {
            return 0;
        }
        // @ts-ignore 2304
        return exp.level_to_xp(this.level) + 1;
    }

    completed(current: any): boolean {
        console.log('targets.completed', this.skillXp, current.skillXp, this.skillXp < current.skillXp)
        if (this.skillXp > current.skillXp) {
            return false;
        }
        return true;
        // TODO: check mastery xp
        if (this.masteryXp > current.masteryXp) {
            return false;
        }
        // TODO: check pool xp
        if (this.poolXp > current.poolXp) {
            return false;
        }
        // TODO: check for materials and consumables
        return true;
    }
}