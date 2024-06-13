import type {ItemCurrencyLike} from "../../Game-Files/gameTypes/skill";
import type {Item} from "../../Game-Files/gameTypes/item";
import type {Currency} from "../../Game-Files/gameTypes/currency";

export class EtaCosts {

    _items: Map<Item, number>;
    _currencies: Map<Currency, number>;

    constructor() {
        this._items = new Map();
        this._currencies = new Map();
    }

    /** Returns true if all of the costs are zero */
    get isFree() {
        return this._currencies.size === 0 && this._items.size === 0;
    }

    addItem(item: any, quantity: number) {
        var _a;
        this._items.set(item, quantity + ((_a = this._items.get(item)) !== null && _a !== void 0 ? _a : 0));
    }

    addCurrency(currency: any, quantity: number) {
        var _a;
        this._currencies.set(currency, quantity + ((_a = this._currencies.get(currency)) !== null && _a !== void 0 ? _a : 0));
    }

    /**
     * Adds an ItemCurrencyLikes costs to the costs.
     * @param costs The costs to add
     * @param multiplier Optional multiplier to all of the costs. Item costs can not be reduced below 1.
     */
    addItemsAndCurrency(costs: ItemCurrencyLike, multiplier = 1) {
        var _a, _b;
        (_a = costs.currencies) === null || _a === void 0 ? void 0 : _a.forEach(({currency, quantity}) => {
            this.addCurrency(currency, Math.floor(quantity * multiplier));
        });
        (_b = costs.items) === null || _b === void 0 ? void 0 : _b.forEach(({item, quantity}) => {
            quantity = Math.max(Math.floor(quantity * multiplier), 1);
            this.addItem(item, quantity);
        });
    }

    /**
     * Gets an ItemQuantity array to interface with UI classes
     */
    getItemQuantityArray() {
        const costArray: any[] = [];
        this._items.forEach((quantity, item: Item) => costArray.push({item, quantity}));
        return costArray;
    }

    /** Gets a CurrencyQuantity array to interface with UI classes */
    getCurrencyQuantityArray() {
        const currencies: any[] = [];
        this._currencies.forEach((quantity, currency) => currencies.push({currency, quantity}));
        return currencies;
    }

    /** Resets all stored costs */
    reset() {
        this._currencies.clear();
        this._items.clear();
    }

    /** Checks if the player has all the costs */
    checkIfOwned() {
        // TODO
        let owned = true;
        this._currencies.forEach((qty, currency) => {
        });
        this._items.forEach((qty, item) => {
        });
        return owned;
    }

    /** Consumes all the stored costs from the player */
    consumeCosts() {
        // TODO
        this._currencies.forEach((quantity, currency) => {
        });
        this._items.forEach((quantity, item) => {
        });
    }

    /** Creates a clone of this costs object */
    clone() {
        const clone = new EtaCosts();
        clone.addCosts(this);
        return clone;
    }

    /** Adds another costs object's costs to this one */
    addCosts(costs: EtaCosts) {
        costs._items.forEach((quantity, item: Item) => {
            this.addItem(item, quantity);
        });
        costs._currencies.forEach((quantity, currency: Currency) => {
            this.addCurrency(currency, quantity);
        });
    }
}