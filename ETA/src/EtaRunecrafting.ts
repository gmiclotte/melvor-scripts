import type {Runecrafting} from "../../Game-Files/gameTypes/runecrafting";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {EquipmentItem, Item} from "../../Game-Files/gameTypes/item";

export class EtaRunecrafting extends ResourceSkillWithMastery {
    constructor(game: Game, runecrafting: Runecrafting, action: any, settings: Settings) {
        super(game, runecrafting, action, settings);
    }

    get masteryModifiedInterval() {
        return this.skill.masteryModifiedInterval;
    }

    actionXP() {
        let xp = super.actionXP();
        // Tier 2 Mastery Pool Checkpoint: 250% base xp when making runes
        if (this.skill.isMakingRunes && this.isPoolTierActive(1)) {
            xp *= 2.5;
        }
        return xp;
    }

    getUncappedCostReduction(item:Item) {
        let reduction = super.getUncappedCostReduction(item);
        // @ts-ignore
        if (item instanceof RuneItem) {
            reduction += this.modifiers.getValue(
                "melvorD:runecraftingRuneCostReduction" /* ModifierIDs.runecraftingRuneCostReduction */,
                this.getActionModifierQuery()
            );
        }
        return reduction;
    }

    getPreservationChance(chance: number) {
        if (this.isPoolTierActive(2)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0))
            modifier += 5;
        return modifier;
    }
}