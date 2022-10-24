import {Runecrafting} from "../../Game-Files/built/runecrafting";
import {Settings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceSkill} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";
import {EquipmentItem, Item} from "../../Game-Files/built/item";

export class EtaRunecrafting extends ResourceSkill {
    constructor(game: Game, runecrafting: Runecrafting, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: Settings) {
        super(game, runecrafting, action, modifiers, astrology, settings);
    }

    get masteryModifiedInterval() {
        return 1700;
    }

    get actionXP() {
        let xp = super.actionXP;
        // Tier 2 Mastery Pool Checkpoint: 250% base xp when making runes
        if (this.skill.isMakingRunes && this.isPoolTierActive(1)) {
            xp *= 2.5;
        }
        return xp;
    }

    modifyItemCost(item: Item, quantity: number) {
        if (this.action.product instanceof EquipmentItem && item.type === 'Rune') {
            const masteryLevel = this.masteryLevel;
            let runeCostReduction = Math.floor(masteryLevel / 10) * 0.05;
            if (masteryLevel >= 99) {
                runeCostReduction += 0.15;
            }
            quantity = Math.floor(quantity * (1 - runeCostReduction));
        }
        return Math.max(1, quantity);
    }

    getPreservationChance(chance: number) {
        if (this.isPoolTierActive(2)) {
            chance += 10;
        }
        if (this.action.product.type === 'Magic Staff') {
            chance += this.modifiers.increasedRunecraftingStavePreservation;
        } else if (this.action.category.id === "melvorF:StandardRunes"
            || this.action.category.id === "melvorF:CombinationRunes") {
            chance += this.modifiers.increasedRunecraftingEssencePreservation;
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