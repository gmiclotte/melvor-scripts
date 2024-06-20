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
        chance += this.changeInXMasteryLevel(20) * 5;
        if (this.checkMasteryMilestone(99)) {
            chance += 10;
        }
        if (this.isMelvorPoolTierActive(1)) {
            chance += 5;
        }
        if (this.isMelvorPoolTierActive(2)) {
            chance += 5;
        }
        if (this.isAbyssalPoolTierActive(1)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }

    getPreservationCap() {
        let cap = super.getPreservationCap();
        if (this.isAbyssalPoolTierActive(3)) {
            cap += 2;
        }
        return cap;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0)) {
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

    getFlatCostReduction(item: Item | undefined) {
        let reduction = super.getFlatCostReduction(item);
        // @ts-ignore
        if (item !== undefined && item.id == "melvorD:Coal_Ore" /* ItemIDs.Coal_Ore */) {
            reduction -= this.modifiers.flatSmithingCoalCost;
        }
        return reduction;
    }
}