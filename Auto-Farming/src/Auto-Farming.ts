import {TinyMod} from "../../TinyMod/src/TinyMod";

export class AutoFarming extends TinyMod{
    private readonly settings: Map<string, any>;
    private game: any;
    constructor(ctx: any, game: any, tag = 'AutoFarming') {
        super(ctx, tag, 'assets/media/skills/farming/farming.svg');
        this.game = game;
        this.settings = new Map();
        this.settings.set('seedBuffer', 0);
        this.settings.set('targetQty', 1e5);
        this.createSettingsMenu();
    }

    static passiveTick() {
        // extend default behaviour with harvesting and replanting after ticks are processed
        // @ts-ignore 2304
        game.farming.growthTimers.forEach((timer) => {
            timer.tick();
            // @ts-ignore 2304
            if (timer.ticksLeft % TICKS_PER_MINUTE === 0 && timer.ticksLeft > 0) {
                // harvest and replant
                // @ts-ignore 2304
                autoFarming.harvestAndReplant(timer.plots);
                // render new state
                // @ts-ignore 2304
                game.farming.renderQueue.growthTime.add(timer);
            }
        });
        // check for empty plots and plant
        // @ts-ignore 2304
        autoFarming.plantAnyEmpty();
    }

    // @ts-ignore 2304
    static testup(gameObject = game, ctx = mod.getDevContext()): AutoFarming {
        // @ts-ignore 2339
        window.autoFarming = new AutoFarming(ctx, gameObject);
        gameObject.farming.passiveTick = AutoFarming.passiveTick;
    }

    createSettingsMenu(): void {
        super.createSettingsMenu();
    }

    // get the desired recipe for the given category
    getRecipe(category: any) {
        let recipes = this.game.farming.categoryRecipeMap.get(category);
        if (recipes === undefined) {
            return undefined;
        }
        // remove recipes for which we do not own the seeds
        const seedBuffer = this.settings.get('seedBuffer');
        recipes = recipes.filter((recipe: any) => {
            const item = recipe.seedCost.item;
            const qty = recipe.seedCost.quantity;
            return this.game.bank.getQty(item) >= qty + seedBuffer;
        });
        // remove recipes for which we do not have the required level
        recipes = recipes.filter((recipe: any) => recipe.level <= this.game.farming.level);
        if (recipes.length === 0) {
            return undefined;
        }
        // determine amt and level recipes
        let amtRecipe = {recipe: undefined, qty: this.settings.get('targetQty')};
        let levelRecipe = recipes[0];
        recipes.forEach((recipe: any) => {
            const item = recipe.product;
            const qty = this.game.bank.getQty(item);
            if (qty < amtRecipe.qty) {
                amtRecipe = {
                    recipe: recipe,
                    qty: qty,
                }
            }
            if (recipe.level < levelRecipe.level) {
                levelRecipe = recipe;
            }
        });
        // work towards target produce amounts
        if (amtRecipe.recipe) {
            return amtRecipe.recipe;
        }
        // plant highest level seed
        if (levelRecipe) {
            return levelRecipe;
        }
        // do nothing
        return undefined;
    }

    // harvest plots and replant
    harvestAndReplant(plots: any) {
        if (plots.length === 0) {
            return;
        }
        // modified from Farming.harvestAllOnClick
        plots.forEach((plot: any) => {
            switch (plot.state) {
                case 3 /* FarmingPlotState.Grown */:
                    this.game.farming.harvestPlot(plot);
                    break;
                case 4 /* FarmingPlotState.Dead */:
                    this.game.farming.clearDeadPlot(plot);
                    break;
            }
        });
        // replant
        this.game.farming.categories.allObjects.forEach((category: any) => {
            const scriptedRecipe = this.getRecipe(category);
            // modified from Farming.plantAllPlots
            const plotIntervalMap = new Map();
            plots.forEach((plot: any) => {
                if (plot.category !== category || plot.state !== 1) {
                    // check that plot is in fact empty
                    return;
                }
                const recipe = scriptedRecipe ?? plot.selectedRecipe;
                if (recipe === undefined) {
                    return;
                }
                // add compost
                // TODO
                // plant a seed
                const plantInterval = this.game.farming.plantPlot(plot, recipe, scriptedRecipe === undefined);
                if (plantInterval <= 0) {
                    // failed to plant
                    return;
                }
                const sameIntervalPlots = plotIntervalMap.get(plantInterval);
                if (sameIntervalPlots !== undefined) {
                    sameIntervalPlots.push(plot);
                } else {
                    plotIntervalMap.set(plantInterval, [plot]);
                }
            });
            plotIntervalMap.forEach((plots, interval) => this.game.farming.createGrowthTimer(plots, interval));
        });
    }

    // check if any plots are empty, grown, or dead, then attempt to plant in them
    plantAnyEmpty() {
        const emptyPlots = this.game.farming.plots.allObjects.filter((x: any) => x.state !== 0 && x.state !== 2);
        if (emptyPlots.length === 0) {
            return;
        }
        console.log(`Detected ${emptyPlots.length} empty plots.`);
        this.harvestAndReplant(emptyPlots);
    }

    // save settings to local storage
    save() {
        window.localStorage[this.tag] = window.JSON.stringify(this.settings, replacer);
    }

    // load settings from local storage
    load() {
        const stored = JSON.parse(window.localStorage[this.tag], reviver);
        Object.getOwnPropertyNames(stored).forEach(x => {
            // @ts-ignore 7053
            this.settings.set(x, stored[x]);
        });
    }
}

function replacer(key: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}

function reviver(key: any, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}