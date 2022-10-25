import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {EtaSkill} from "./EtaSkill";
import {MasteryAction} from "../../Game-Files/built/mastery2";

export class Targets {
    public skillLevel: number;
    public skillXp: number;
    public masteryLevel: number;
    public masteryXp: number;
    public poolPercent: number;
    public poolXp: number;
    public materials: boolean;
    public consumables: boolean;
    private readonly current: EtaSkill;

    constructor(current: EtaSkill, settings: any, skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: any = undefined) {
        this.current = current;
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
        this.skillXp = this.current.levelToXp(this.skillLevel);
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
        // flag to compute remaining time materials or consumables
        this.materials = false; // regular crafting materials, e.g. raw fish or ores
        this.consumables = false; // additional consumables e.g. potions, mysterious stones
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
        // check skill xp
        if (!this.skillCompleted()) {
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
        // TODO: check for materials and consumables
        return true;
    }
}