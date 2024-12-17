import {ResourceSkillWithoutMastery} from "./ResourceSkill";
import type {Realm} from "../../Game-Files/gameTypes/realms";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Cartography} from "../../Game-Files/gameTypes/cartography";
import {Settings} from "./Settings";
import type {Item} from "../../Game-Files/gameTypes/item";
import {Rates} from "./Rates";

export class EtaCartographyMap extends ResourceSkillWithoutMastery {
    private digSite: any;
    private map: any;
    private upgradesLeft: number;

    constructor(game: Game, cartography: Cartography, action: any, settings: Settings) {
        super(game, cartography, action, settings);
        this.upgradesLeft = 0;
    }

    get tier() {
        if (this.map === undefined) {
            return 0;
        }
        return this.map.tier.index;
    }

    get actionInterval() {
        return this.modifyInterval(this.skill.BASE_MAP_UPGRADE_INTERVAL);
    }

    get levelReqReached(): boolean {
        return true;
    }

    get noResourceCheckpointLeft() {
        return super.noResourceCheckpointLeft || this.upgradesLeft <= 0;
    }

    init(game: Game) {
        this.digSite = this.skill.selectedMapUpgradeDigsite;
        this.map = this.digSite.selectedUpgradeMap;
        // @ts-ignore
        const maxUpgradeActions = DigSiteMap.tiers[DigSiteMap.tiers.length - 1].upgradeActions;
        this.upgradesLeft = this.digSite.maps.reduce((a: number, x: any) =>
                a + Math.max(maxUpgradeActions - x._upgradeActions, 0),
            0,
        );
        super.init(game);
    }

    attemptsToCheckpoint(gainsPerAction: Rates) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            this.upgradesLeft,
        ));
    }

    addAttempts(gainsPerAction: Rates, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.upgradesLeft -= attempts;
    }

    actionXP(realmID: string): number {
        return this.modifyMelvorXP(this.digSite.level * 2);
    }

    getRecipeCosts() {
        // @ts-ignore
        const costs = new Costs(undefined);
        if (this.digSite.mapUpgradeCost[this.tier] === undefined) {
            return costs;
        }
        this.digSite.mapUpgradeCost[this.tier].items.forEach((cost: { item: Item, quantity: number }) => {
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

    completed() {
        return super.completed() || this.noResourceCheckpointLeft;
    }
}