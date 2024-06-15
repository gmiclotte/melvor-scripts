import type {Item} from "../../Game-Files/gameTypes/item";
import type {Currency} from "../../Game-Files/gameTypes/currency";

export class EtaCosts {

    _items: Map<Item, number>;
    _currencies: Map<Currency, number>;

    constructor() {
        this._items = new Map();
        this._currencies = new Map();
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