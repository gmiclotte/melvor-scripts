import {AltMagic} from "../../Game-Files/built/altMagic";
import {Settings} from "./Settings";
import {ResourceSkillWithoutMastery} from "./ResourceSkill";
import {Item} from "../../Game-Files/built/item";
import {Costs} from "../../Game-Files/built/skill";
import {Game} from "../../Game-Files/built/game";

export class EtaMagic extends ResourceSkillWithoutMastery {
    private game: Game;
    private consumptionID: any;

    constructor(game: Game, magic: AltMagic, action: any, settings: Settings) {
        const args: [Game, any, any, Settings] = [game, magic, action, settings];
        super(...args);
        this.game = game;
        // @ts-ignore
        this.consumptionID = AltMagicConsumptionID;
    }

    getRecipeCosts() {
        const costs = new Costs({});
        // rune costs
        this.game.combat.player.getRuneCosts(this.action).forEach((cost: { item: Item, quantity: number }) => {
            costs.addItem(cost.item, cost.quantity);
        });
        // variable item costs
        switch (this.action.specialCost.type) {
            case this.consumptionID.AnyItem:
            case this.consumptionID.JunkItem:
            case this.consumptionID.AnySuperiorGem:
            case this.consumptionID.AnyNormalFood:
                if (this.skill.selectedConversionItem !== undefined)
                    costs.addItem(this.skill.selectedConversionItem, this.action.specialCost.quantity);
                break;
            case this.consumptionID.BarIngredientsWithCoal:
                if (this.skill.selectedSmithingRecipe !== undefined)
                    return this.skill.getSuperheatBarCosts(this.skill.selectedSmithingRecipe, true, this.action.specialCost.quantity);
                break;
            case this.consumptionID.BarIngredientsWithoutCoal:
                if (this.skill.selectedSmithingRecipe !== undefined)
                    return this.skill.getSuperheatBarCosts(this.skill.selectedSmithingRecipe, false, this.action.specialCost.quantity);
                break;
            case this.consumptionID.None:
                break;
        }
        // fixed item costs
        this.action.fixedItemCosts.forEach((cost: { item: Item, quantity: number }) => {
            costs.addItem(cost.item, cost.quantity);
        });
        return costs;
    }
}