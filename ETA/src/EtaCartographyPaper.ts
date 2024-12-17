import {ResourceSkillWithoutMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Cartography} from "../../Game-Files/gameTypes/cartography";
import {Settings} from "./Settings";
import type {Realm} from "../../Game-Files/gameTypes/realms";
import type {Item} from "../../Game-Files/gameTypes/item";

export class EtaCartographyPaper extends ResourceSkillWithoutMastery {

    constructor(game: Game, cartography: Cartography, action: any, settings: Settings) {
        super(game, cartography, action, settings);
    }

    get actionInterval() {
        return this.modifyInterval(this.skill.BASE_PAPER_MAKING_INTERVAL);
    }

    get levelReqReached(): boolean {
        return true;
    }

    init(game: Game) {
        this.action = this.skill.selectedPaperRecipe;
        super.init(game);
    }

    getRecipeCosts() {
        // @ts-ignore
        const costs = new Costs(undefined);
        this.action.costs.items.forEach((cost: { item: Item, quantity: number }) => {
            let quantity = this.modifyItemCost(cost.item, cost.quantity);
            costs.addItem(cost.item, quantity);
        });
        return costs;
    }

    activeRealm(): Realm {
        return this.skill.currentRealm;
    }

    actionRealm() {
        return this.skill.currentRealm;
    }

    skip() {
        return !this.actionIsInActiveRealm;
    }

    getPercentageIntervalModifier() {
        let modifier = super.getPercentageIntervalModifier();
        return modifier + this.modifiers.getValue(
            "melvorD:cartographyPaperMakingInterval" /* ModifierIDs.cartographyPaperMakingInterval */,
            this.getActionModifierQuery()
        );
    }
}