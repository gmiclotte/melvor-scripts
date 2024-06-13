import type {Archaeology, ArchaeologyTool} from "../../Game-Files/gameTypes/archaeology";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {DigSiteMap} from "../../Game-Files/gameTypes/cartography";

export class EtaArchaeology extends EtaSkillWithMastery {

    private map: DigSiteMap | undefined;

    constructor(game: Game, archaeology: Archaeology, action: any, settings: Settings) {
        super(game, archaeology, action, settings);
        if (this.action.selectedMapIndex > -1) {
            this.map = this.action.maps[this.action.selectedMapIndex];
        }
    }

    get actionInterval() {
        return this.modifyInterval(this.skill.baseInterval);
    }

    skip() {
        return (this.map === undefined || this.action.selectedTools.length === 0) && this.action.realm !== this.skill.currentRealm;
    }

    getBaseSkillXPForDigSite() {
        return Math.max(1, 0.12 * this.action.level);
    }

    getArtefactSkillXPForDigSite() {
        return this.getBaseSkillXPForDigSite() * 50;
    }

    actionXP(realmID: string): number {
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            let modifier = super.getMelvorXPModifier();

            // chance and xp for nothing
            const pArtefact = this.chanceForArtefact();
            const pNothing = 1 - pArtefact;
            const xpNothing = this.getBaseSkillXPForDigSite() * (1 + modifier / 100);

            // chance and xp for common rarity
            const pCommon = this.chanceForArtefact(true);
            const modCommon = modifier + this.modifiers.archaeologyCommonItemSkillXP;
            const xpCommon = this.getArtefactSkillXPForDigSite() * (1 + modCommon / 100);

            // chance and xp for higher rarity
            const pHigher = pArtefact - pCommon;
            const xpHigher = this.getArtefactSkillXPForDigSite() * (1 + modifier / 100);

            // compute weighted average
            return pNothing * xpNothing + pCommon * xpCommon + pHigher * xpHigher;
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            return 0; // there are no Abyssal actions for this skill
        }
        return 0;
    }

    chanceForArtefact(common: boolean = false) {
        let chanceSum = 0;
        let count = 0;
        // iterate over all tools, so we can average the xp gain
        this.action.selectedTools.forEach((tool: ArchaeologyTool) => {
            const type = tool.artefactType;
            const baseToolCalc = 5 * (1 + (tool.level + 1) / 4);
            // @ts-ignore
            let base = (baseToolCalc / (this.map.artefactValues[type] + 31)) * 100;
            if (common) {
                base *= this.action.artefacts[type].drops
                        // @ts-ignore
                        .filter((item: any) => item.weight >= ArtefactWeightRange.COMMON && item.weight < ArtefactWeightRange.NOTHING)
                        .reduce((sum: number, item: any) => sum + item.weight, 0)
                    / this.action.artefacts[type].totalWeight;
            }
            chanceSum += base + this.modifiers[`${type}ArtefactChance`];
            count++;
        });
        return chanceSum / count / 100;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }
}