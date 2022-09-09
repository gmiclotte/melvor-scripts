export class ETASettings extends Map<string, any> {

    constructor() {
        super();
        /*
            toggles
         */
        // true for 12h clock (AM/PM), false for 24h clock
        this.set('IS_12H_CLOCK', false);
        // true for short clock `xxhxxmxxs`, false for long clock `xx hours, xx minutes and xx seconds`
        this.set('IS_SHORT_CLOCK', true);
        // true for alternative main display with xp/h, mastery xp/h and action count
        this.set('SHOW_XP_RATE', true);
        // true to show action times
        this.set('HOW_ACTION_TIME', false);
        // true to allow final pool percentage > 100%
        this.set('UNCAP_POOL', true);
        // true will show the current xp/h and mastery xp/h; false shows average if using all resources
        // does not affect anything if SHOW_XP_RATE is false
        this.set('CURRENT_RATES', true);
        // set to true to include mastery tokens in time until 100% pool
        this.set('USE_TOKENS', false);
        // set to true to show partial level progress in the ETA tooltips
        this.set('SHOW_PARTIAL_LEVELS', false);
        // set to true to hide the required resources in the ETA tooltips
        this.set('HIDE_REQUIRED', false);
        // set to true to include "potential" Summoning exp from created tablets
        this.set('USE_TABLETS', false);
        // set to true to play a sound when we run out of resources or reach a target
        this.set('DING_RESOURCES', true);
        this.set('DING_LEVEL', true);
        this.set('DING_MASTERY', true);
        this.set('DING_POOL', true);
        // change the ding sound level
        this.set('DING_VOLUME', 0.1);
        /*
            targets
         */
        // Default global target level / mastery / pool% is 99 / 99 / 100
        this.set('GLOBAL_TARGET_LEVEL', [99]);
        this.set('GLOBAL_TARGET_MASTERY', [99]);
        this.set('GLOBAL_TARGET_POOL', [100]);
        // skill specific targets can be defined here, these override the global targets
        this.set('TARGET_LEVEL', {
            // 'Firemaking': [120],
        });
        this.set('TARGET_MASTERY', {
            // 'Herblore': [90],
        });
        this.set('TARGET_POOL', {
            // 'Crafting': [25],
        });
    }

    // returns the appropriate target
    getNext(current: number, list: Array<number>) {
        if (list === undefined) {
            return current;
        }
        for (let i = 0; i < list.length; i++) {
            if (list[i] > current) {
                return list[i];
            }
        }
        const max = Math.max(...list);
        return max > current ? max : current;
    }

    getTarget(current: number, globals: Array<number>, specifics: Array<number>, defaultTarget: number, maxTarget: number) {
        const global = this.getNext(current, globals);
        const specific = this.getNext(current, specifics);

        let target = defaultTarget;
        if (global > current) {
            target = global;
        }
        if (specific > current) {
            target = specific;
        }
        if (target <= 0) {
            target = defaultTarget;
        }
        if (target >= maxTarget) {
            target = maxTarget;
        }
        return Math.ceil(target);
    }

    getTargetLevel(skillName: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_LEVEL'), this.get('TARGET_LEVEL')[skillName], 99, 170);
    }

    getTargetMastery(skillName: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_MASTERY'), this.get('TARGET_MASTERY')[skillName], 99, 170);
    }

    getTargetPool(skillName: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_POOL'), this.get('TARGET_POOL')[skillName], 100, 100);
    }

    /*
        methods
     */

    // save settings to local storage
    save() {
        console.warn('ETASettings do not persist.');
        window.localStorage['ETASettings'] = window.JSON.stringify(this, replacer);
    }

    // load settings from local storage
    load() {
        console.warn('ETASettings do not persist.');
        return;
        const stored = window.JSON.parse(window.localStorage['ETASettings']);
        Object.getOwnPropertyNames(stored).forEach(x => {
            // @ts-ignore 7053
            this.set(x, stored[x]);
        });
    }
}

function replacer(key: string, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}

function reviver(key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}
