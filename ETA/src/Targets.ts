import {SkillWithMastery} from "../../Game-Files/built/skill";
import {CurrentSkill} from "./CurrentSkill";

export class Targets {
    public skillLevel: number;
    public skillXp: number;
    public masteryLevel: number;
    public masteryXp: number;
    public poolPercent: number;
    public poolXp: number;
    public materials: boolean;
    public consumables: boolean;

    constructor(settings: any, skill: SkillWithMastery, action: any = undefined) {
        if (action === undefined) {
            this.skillLevel = 0;
            this.skillXp = 0;
            this.masteryLevel = 0;
            this.masteryXp = 0;
            this.poolPercent = 0;
            this.poolXp = 0;
            this.materials = false;
            this.consumables = false;
            return this;
        }
        // target level
        this.skillLevel = settings.getTargetLevel(skill.name, skill.level);
        this.skillXp = this.level_to_xp(this.skillLevel);
        // target mastery
        if (skill.hasMastery) {
            const mastery = skill.getMasteryXP(action);
            this.masteryLevel = settings.getTargetMastery(skill.name, mastery);
            this.masteryXp = this.level_to_xp(this.masteryLevel);
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
        // flag to compute remaining time materials or consumables
        this.materials = false; // regular crafting materials, e.g. raw fish or ores
        this.consumables = false; // additional consumables e.g. potions, mysterious stones
    }

    level_to_xp(level: number): number {
        if (level === 0) {
            return 0;
        }
        // @ts-ignore 2304
        return exp.level_to_xp(this.skillLevel) + 1;
    }

    skillCompleted(current: CurrentSkill): boolean {
        return this.skillXp <= current.skillXp;
    }

    masteryCompleted(current: CurrentSkill): boolean {
        return this.masteryXp <= current.masteryXp;
    }

    poolCompleted(current: CurrentSkill): boolean {
        return this.poolXp <= current.poolXp;
    }

    completed(current: CurrentSkill): boolean {
        // check skill xp
        if (!this.skillCompleted(current)) {
            return false;
        }
        // check mastery xp
        if (!this.masteryCompleted(current)) {
            return false;
        }
        // check pool xp
        if (!this.poolCompleted(current)) {
            return false;
        }
        // TODO: check for materials and consumables
        return true;
    }
}