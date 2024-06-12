import type {Smithing} from "../../Game-Files/gameTypes/smithing";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item} from "../../Game-Files/gameTypes/item";

export class EtaSmithing extends ResourceSkillWithMastery {
    constructor(game: Game, smithing: Smithing, action: any, settings: Settings) {
        super(game, smithing, action, settings);
    }

    get masteryModifiedInterval() {
        return this.skill.masteryModifiedInterval;
    }

    getPreservationChance(chance: number) {
        const masteryLevel = this.masteryLevel;
        chance += Math.floor(masteryLevel / 20) * 5;
        if (this.checkMasteryMilestone(99)) {
            chance += 10;
        }
        if (this.isPoolTierActive(1)) {
            chance += 5;
        }
        if (this.isPoolTierActive(2)) {
            chance += 5;
        }
        return super.getPreservationChance(chance);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    getUncappedCostReduction(item: Item) {
        let reduction = super.getUncappedCostReduction(item);
        // @ts-ignore
        if (item !== undefined && item.id == "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */) {
            reduction -= this.modifiers.smithingCoalCost;
        }
        return reduction;
    }

    getFlatCostReduction(item: Item) {
        let reduction = super.getFlatCostReduction(item);
        // @ts-ignore
        if (item !== undefined && item.id == "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */) {
            reduction -= this.modifiers.flatSmithingCoalCost;
        }
        return reduction;
    }
}