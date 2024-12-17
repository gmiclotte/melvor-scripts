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
    private index: number;
    private upgradesSimulated: number[];
    private maxUpgradeActions: number;

    constructor(game: Game, cartography: Cartography, action: any, settings: Settings) {
        super(game, cartography, action, settings);
        this.upgradesLeft = 0;
        this.index = -1;
        this.upgradesSimulated = [];
        this.maxUpgradeActions = 0;
    }

    get tier() {
        if (this.map === undefined) {
            return 0;
        }
        // count how many tiers have been reached
        // @ts-ignore
        return DigSiteMap.tiers.reduce((a, x) => a + (x.upgradeActions <= this.upgradesSimulated[this.index]), 0) - 1;
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
        this.maxUpgradeActions = DigSiteMap.tiers[DigSiteMap.tiers.length - 1].upgradeActions;
        this.upgradesLeft = this.digSite.maps.reduce((a: number, x: any) =>
                a + Math.max(this.maxUpgradeActions - x._upgradeActions, 0),
            0,
        );
        this.index = this.digSite.selectedUpgradeIndex;
        this.upgradesSimulated = this.digSite.maps.map((x: any) => x._upgradeActions);
        this.determineNextMap();
        super.init(game);
    }

    attemptsToCheckpoint(gainsPerAction: Rates) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        // @ts-ignore
        const nextTierAt = DigSiteMap.tiers[this.tier + 1].upgradeActions;
        const current = this.upgradesSimulated[this.index];
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            nextTierAt - current,
        ));
    }

    determineNextMap() {
        // determine next map, if required
        if (this.map === undefined || this.upgradesSimulated[this.index] === this.maxUpgradeActions) {
            this.index = 0;
            while (this.upgradesSimulated[this.index] === this.maxUpgradeActions) {
                this.index++;
            }
            this.map = this.digSite.maps[this.index];
        }
    }

    addAttempts(gainsPerAction: Rates, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.upgradesLeft -= attempts;
        this.upgradesSimulated[this.index] += attempts;
        this.determineNextMap();
    }

    actionXP(realmID: string): number {
        return this.modifyMelvorXP(this.digSite.level * 2);
    }

    getRecipeCosts() {
        // @ts-ignore
        const costs = new Costs(undefined);
        const upgradeCost = this.digSite.mapUpgradeCost[this.tier]
        if (upgradeCost === undefined) {
            return costs;
        }
        upgradeCost.items.forEach((cost: { item: Item, quantity: number }) => {
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

    getPercentageIntervalModifier() {
        let modifier = super.getPercentageIntervalModifier();
        return modifier + this.modifiers.getValue(
            "melvorD:cartographyMapUpgradeInterval" /* ModifierIDs.cartographyMapUpgradeInterval */,
            this.getActionModifierQuery()
        );
    }
}