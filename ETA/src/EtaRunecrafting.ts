import type {Runecrafting} from "../../Game-Files/gameTypes/runecrafting";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item, RuneItem} from "../../Game-Files/gameTypes/item";

export class EtaRunecrafting extends ResourceSkillWithMastery {
    constructor(game: Game, runecrafting: Runecrafting, action: any, settings: Settings) {
        super(game, runecrafting, action, settings);
    }

    get masteryModifiedInterval() {
        return this.skill.masteryModifiedInterval;
    }

    actionXP(realmID: string) {
        let xp = super.actionXP(realmID);
        // Tier 2 Mastery Pool Checkpoint: 250% base xp when making runes
        if (this.skill.isMakingRunes && this.isMelvorPoolTierActive(1)) {
            xp *= 2.5;
        }
        if (this.skill.isMakingRunes && this.isAbyssalPoolTierActive(1)) {
            xp *= 1.25;
        }
        return xp;
    }

    getUncappedCostReduction(item: Item) {
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
        if (this.isMelvorPoolTierActive(2)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0))
            modifier += 5;
        return modifier;
    }
}