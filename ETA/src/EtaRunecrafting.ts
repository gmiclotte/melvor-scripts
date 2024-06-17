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

    get isMakingRunes() {
        return this.action.subcategories.some((subcat: any) =>
            subcat.id === "melvorF:Runes" /* RunecraftingSubcategoryIDs.Runes */
        );
    }

    actionXP(realmID: string) {
        let xp = super.actionXP(realmID);
        // add rune base xp modifiers
        if (this.isMakingRunes) {
            let runeBaseXPModifier = 0;
            if (realmID === "melvorD:Melvor") {
                runeBaseXPModifier = this.modifiers.runecraftingBaseXPForRunes;
                // Tier 2 Mastery Pool Checkpoint: +150% base xp when making runes
                if (this.isMelvorPoolTierActive(1)) {
                    runeBaseXPModifier += 150;
                }
            } else if (realmID === "melvorItA:Abyssal") {
                runeBaseXPModifier = this.modifiers.runecraftingBaseAXPForRunes;
                // Tier 2 Abyssal Mastery Pool Checkpoint: +25% base xp when making runes
                if (this.isAbyssalPoolTierActive(1)) {
                    runeBaseXPModifier += 25;
                }
            }
            xp *= 1 + runeBaseXPModifier / 100;
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