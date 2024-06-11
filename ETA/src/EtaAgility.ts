import type {Agility} from "../../Game-Files/gameTypes/agility";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {PlayerModifierTable} from "../../Game-Files/gameTypes/modifierTable";

export class EtaAgility extends EtaSkillWithMastery {
    public was99Mastery: boolean;
    public updatedModifiers: boolean;
    public modifiers!: PlayerModifierTable;
    public courseDuration: number;

    constructor(game: Game, agility: Agility, action: any, settings: Settings) {
        super(game, agility, action, settings);
        this.was99Mastery = false;
        this.updatedModifiers = false;
        //this.modifiers = EtaAgility.cloneModifiers(game.modifiers);
        this.courseDuration = Infinity;
    }
/*
    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    // rescale this for displaying actions per hour
    get averageAttemptTime() {
        return this.courseDuration === Infinity ? this.actionInterval : this.courseDuration;
    }

    static cloneModifiers(modifiers: PlayerModifierTable) {
        const modifierObject: any = {};
        modifiers.getActiveModifiers().map((x: any) => {
            const split = x.name.split(':');
            const id = split.shift()!;
            return {id: id, skillID: split.join(':')}
        }).forEach((modifier: { id: string, skillID: string }) => {
            // @ts-ignore
            if (modifierData[modifier.id].isSkill) {
                const modifierID = modifier.id as keyof SkillModifierObject<any>;
                const skillModifierArray = modifierObject[modifier.id] ?? [];
                // @ts-ignore
                const skill = game.skills.getObjectByID(modifier.skillID);
                const value = modifiers.getSkillModifierValue(modifierID, skill);
                skillModifierArray.push({skill: skill, value: value});
                modifierObject[modifierID] = skillModifierArray;
            } else {
                const modifierID = modifier.id as keyof StandardModifierObject<any>;
                modifierObject[modifierID] = modifiers[modifierID];
            }
        })
        // copy to new PlayerModifiers object
        // @ts-ignore
        const clonedModifiers = new PlayerModifierTable();
        // TODO clonedModifiers.addModifiers(modifierObject);
        return clonedModifiers;
    }

    init(game: Game) {
        super.init(game);
        this.was99Mastery = this.checkMasteryMilestone(99);
        this.updatedModifiers = false;
        this.modifiers = EtaAgility.cloneModifiers(game.modifiers);
    }

    progress() {
        super.progress();
        if (this.was99Mastery && !this.updatedModifiers && this.checkMasteryMilestone(99)) {
            this.modifiers.addMappedModifiers(this.getObstacleModifierDebuffChange());
            this.updatedModifiers = true;
        }
    }

    getPercentageIntervalModifier() {
        let modifier = super.getPercentageIntervalModifier();
        const masteryLevel = this.masteryLevel;
        // Mastery Level Scaling: Every 10 levels, reduce the interval by 3%
        modifier -= Math.floor(masteryLevel / 10) * 3;
        return modifier;
    }

    getXPModifier() {
        let modifier = super.getXPModifier();
        if (this.skill.obstacleHasNegativeModifiers(this.action)) {
            modifier += this.modifiers.increasedXPFromNegativeObstacles;
            modifier -= this.modifiers.decreasedXPFromNegativeObstacles;
        }
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        if (this.skill.obstacleHasNegativeModifiers(this.action)) {
            modifier += this.modifiers.increasedMasteryXPFromNegativeObstacles;
            modifier -= this.modifiers.decreasedMasteryXPFromNegativeObstacles;
        }
        return modifier;
    }

    /** Gets the change in debuff modifiers after obtaining 99 mastery */
    /*
    getObstacleModifierDebuffChange(): MappedModifiers {
        // @ts-ignore
        const modifiers = new MappedModifiers();
        const masteryLevel = this.masteryLevel;
        // Level 99 Mastery: Debuffs are halved for obstacle
        const negMult = checkMasteryMilestone(99) ? 0.5 : 1;
        modifiers.addModifiers(this.action.modifiers, -negMult, 0);
        return modifiers;
    }
    */
}