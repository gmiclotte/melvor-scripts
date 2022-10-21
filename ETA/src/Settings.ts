export class ETASettings {
    private readonly ctx: any;
    private readonly generalSettings: any;
    private readonly skillSettings: Map<string, any>;

    constructor(ctx: any) {
        this.ctx = ctx;
        try {
            ctx.settings.type('numberArray', {
                render: () => ({
                    value: [], querySelector: () => {
                    }
                }),
                get: (root: any): number[] => root.value,
                set: (root: any, value: number[]) => root.value = value,
            });
        } catch (_: any) {
            console.warn('Failed to define settings type \'numberArray\'');
        }
        // general settings
        this.generalSettings = ctx.settings.section('General');
        // toggles
        this.generalSettings.add([
            {
                type: 'switch',
                name: 'IS_12H_CLOCK',
                label: 'Use 12h clock',
                hint: 'Use 12h clock (AM/PM), instead of 24h clock.',
                default: false,
            },
            {
                type: 'switch',
                name: 'IS_SHORT_CLOCK',
                label: 'Use short time format',
                hint: 'Use short clock `xxhxxmxxs`, instead of long clock `xx hours, xx minutes and xx seconds.',
                default: true,
            },
            {
                type: 'switch',
                name: 'SHOW_XP_RATE',
                label: 'Show XP rates',
                hint: 'Show XP rates.',
                default: true,
            },
            {
                type: 'switch',
                name: 'SHOW_ACTION_TIME',
                label: 'Show action times',
                hint: 'Show action times.',
                default: true,
            },
            {
                type: 'switch',
                name: 'UNCAP_POOL',
                label: 'Show pool past 100%',
                hint: 'Show pool past 100%.',
                default: true,
            },
            {
                type: 'switch',
                name: 'CURRENT_RATES',
                label: 'Show current rates',
                hint: 'Show current rates, instead of average rates until all targets are met.',
                default: true,
            },
            {
                type: 'switch',
                name: 'USE_TOKENS',
                label: 'Include tokens in final Pool %',
                hint: 'Include potential pool XP of Mastery tokens in final Pool %.',
                default: false,
            },
            {
                type: 'switch',
                name: 'SHOW_PARTIAL_LEVELS',
                label: 'Show partial levels',
                hint: 'Show partial levels in the final level and mastery.',
                default: true,
            },
            {
                type: 'switch',
                name: 'HIDE_REQUIRED',
                label: 'Hide required resources',
                hint: 'Toggle on to hide the required resources in the ETA tooltips.',
                default: false,
            },
            {
                type: 'switch',
                name: 'DING_RESOURCES',
                label: 'Ding when out of resources',
                hint: 'Play a sound when we run out of resources.',
                default: true,
            },
            {
                type: 'switch',
                name: 'DING_LEVEL',
                label: 'Ding on level target',
                hint: 'Play a sound when we reach a level target.',
                default: true,
            },
            {
                type: 'switch',
                name: 'DING_MASTERY',
                label: 'Ding on mastery target',
                hint: 'Play a sound when we reach a mastery target.',
                default: true,
            },
            {
                type: 'switch',
                name: 'DING_POOL',
                label: 'Ding on pool target',
                hint: 'Play a sound when we reach a pool target.',
                default: true,
            },
            {
                type: 'switch',
                name: 'USE_TABLETS',
                label: '"Use" all created Summoning Tablets',
                hint: 'Toggle on to include potential Summoning exp from created tablets.',
                default: false,
            },
        ]);
        //
        // change the ding sound level
        //this.set('DING_VOLUME', 0.1);
        /*
            targets
         */
        // Default global target level / mastery / pool% is 99 / 99 / 100
        this.generalSettings.add([
            {
                type: 'numberArray',
                name: 'GLOBAL_TARGET_LEVEL',
                label: 'Global level targets',
                hint: 'Global level targets.',
                default: [99],
            },
            {
                type: 'numberArray',
                name: 'GLOBAL_TARGET_MASTERY',
                label: 'Global mastery targets',
                hint: 'Global mastery targets.',
                default: [99],
            },
            {
                type: 'numberArray',
                name: 'GLOBAL_TARGET_POOL',
                label: 'Global pool targets (%)',
                hint: 'Global pool targets (%).',
                default: [100],
            },
        ]);
        // skillSettings
        this.skillSettings = new Map<string, any>();
    }

    addSkillSetting(key: string, label: string, skillName: string): string {
        let skillSettings = this.skillSettings.get(skillName);
        if (skillSettings === undefined) {
            skillSettings = this.ctx.settings.section(skillName);
            this.skillSettings.set(skillName, skillSettings);
        }
        skillSettings.add({
            type: 'numberArray',
            name: key,
            label: label,
            hint: `{target.label} for ${skillName}.`,
            default: [],
        });
        return key;
    }

    get(settingID: string, skillID: string | undefined = undefined): any {
        if (skillID === undefined) {
            return this.generalSettings.get(settingID);
        }
        return this.skillSettings.get(skillID).get(settingID);
    }

    set(settingID: string, value: any, skillID: string | undefined = undefined) {
        if (skillID === undefined) {
            return this.generalSettings.set(settingID, value);
        }
        return this.skillSettings.get(skillID).set(settingID, value);
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
        return this.getTarget(current, this.get('GLOBAL_TARGET_LEVEL'), this.get('TARGET_LEVEL', skillName), 99, 170);
    }

    getTargetMastery(skillName: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_MASTERY'), this.get('TARGET_MASTERY', skillName), 99, 170);
    }

    getTargetPool(skillName: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_POOL'), this.get('TARGET_POOL', skillName), 100, 100);
    }
}