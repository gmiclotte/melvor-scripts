import type {Archaeology} from "../../Game-Files/gameTypes/archaeology";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {ArchaeologyTool} from "../../Game-Files/gameTypes/archaeology";

export class EtaArchaeology extends EtaSkillWithMastery {
    constructor(game: Game, archaeology: Archaeology, action: any, settings: Settings) {
        super(game, archaeology, action, settings);
    }
/*
    get actionInterval() {
        return this.modifyInterval(this.skill.baseInterval);
    }

    getBaseSkillXPForDigSite() {
        return Math.max(1, 0.12 * this.action.level);
    }

    getArtefactSkillXPForDigSite() {
        return this.getBaseSkillXPForDigSite() * 50;
    }

    actionXP(): number {
        let modifier = super.getXPModifier();
        // chance and xp for nothing / common / higher rarity
        const pArtefact = this.chanceForArtefact();
        const pNothing = 1 - pArtefact;
        const xpNothing = this.getBaseSkillXPForDigSite() * (1 + modifier /100 );
        const pCommon = this.chanceForArtefact(true);
        const modCommon = modifier + this.modifiers.increasedArchaeologyCommonItemSkillXP;
        const xpCommon = this.getArtefactSkillXPForDigSite() * (1 + modCommon / 100);
        const pHigher = pArtefact - pCommon;
        const xpHigher = this.getArtefactSkillXPForDigSite() * (1 + modifier /100 );

        // compute weighted average
        return pNothing * xpNothing + pCommon * xpCommon + pHigher * xpHigher;
    }

    chanceForArtefact(common: boolean = false) {
        let chanceSum = 0;
        let count = 0;
        this.action.selectedTools.forEach((tool: ArchaeologyTool) => {
            const type = tool.artefactType;
            const baseToolCalc = 5 * (1 + (tool.level + 1) / 4);
            // @ts-ignore
            let base = baseToolCalc / (this.modifyInitialArtefactValue(this.action.selectedMap.artefactValues[type]) + 31) * 100;
            if (common) {
                base *= this.action.artefacts[type].drops
                        // @ts-ignore
                    .filter((item: any) => item.weight >= ArtefactWeightRange.COMMON && item.weight < ArtefactWeightRange.NOTHING)
                    .reduce((sum: number, item: any) => sum + item.weight, 0)
                    / this.action.artefacts[type].totalWeight;
            }
            switch (type) {
                // @ts-ignore
                case ArtefactType.TINY:
                    chanceSum += base + this.modifiers.increasedTinyArtefactChance - this.modifiers.decreasedTinyArtefactChance;
                    count++;
                    break;
                // @ts-ignore
                case ArtefactType.SMALL:
                    chanceSum += base + this.modifiers.increasedSmallArtefactChance - this.modifiers.decreasedSmallArtefactChance;
                    count++;
                    break;
                // @ts-ignore
                case ArtefactType.MEDIUM:
                    chanceSum += base + this.modifiers.increasedMediumArtefactChance - this.modifiers.decreasedMediumArtefactChance;
                    count++;
                    break;
                // @ts-ignore
                case ArtefactType.LARGE:
                    chanceSum += base + this.modifiers.increasedLargeArtefactChance - this.modifiers.decreasedLargeArtefactChance;
                    count++;
                    break;
                default:
                    chanceSum += 0;
            }
        });
        return chanceSum / count / 100;
    }

    modifyInitialArtefactValue(value: number) {
        const modifier = this.modifiers.increasedInitialMapArtefactValues - this.modifiers.decreasedInitialMapArtefactValues;
        value *= 1 + modifier / 100;
        value = Math.max(Math.floor(value), 1);
        return value;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

 */
}