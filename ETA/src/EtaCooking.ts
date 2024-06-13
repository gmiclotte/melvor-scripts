import type {Cooking} from "../../Game-Files/gameTypes/cooking";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Realm} from "../../Game-Files/gameTypes/realms";

export class EtaCooking extends ResourceSkillWithMastery {
    constructor(game: Game, cooking: Cooking, action: any, settings: Settings) {
        super(game, cooking, action, settings);
    }

    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    get successRate() {
        return this.recipeSuccessChance;
    }

    get masteryModifiedInterval() {
        return this.action.baseInterval * 0.85;
    }

    get recipeSuccessChance() {
        const masteryLevel = this.masteryLevel;
        // @ts-ignore
        let chance = Cooking.baseSuccessChance;
        chance += this.modifiers.getValue("melvorD:successfulCookChance" /* ModifierIDs.successfulCookChance */, this.getActionModifierQuery());
        let chanceCap = 100;
        // Pig + Mole Synergy: Cap success rate at 75%
        chanceCap += this.modifiers.cookingSuccessCap;
        chance = Math.min(chance, chanceCap);
        if (chance < 0) {
            return 0;
        }
        return chance / 100;
    }

    activeRealm(): Realm {
        const category = this.action.category;
        return this.skill.selectedRecipes.get(category).realm;
    }

    skip() {
        const category = this.action.category;
        return this.action !== this.skill.selectedRecipes.get(category) || this.action.realm !== this.activeRealm();
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    modifyMelvorXP(amount: number) {
        // TODO: check if this works properly
        //  full xp for successful actions, no xp for failed actions
        return super.modifyMelvorXP(amount);
    }

    getPreservationChance(chance: number) {
        if (this.isMelvorPoolTierActive(2) || this.isAbyssalPoolTierActive(2)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }
}