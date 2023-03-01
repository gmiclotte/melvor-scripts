import type {Game} from "../../Game-Files/gameTypes/game";
import type {MasterySkillData, SkillWithMastery} from "../../Game-Files/gameTypes/skill";
import type {MasteryAction} from "../../Game-Files/gameTypes/mastery2";

export class Settings {
    public readonly skillList: SkillWithMastery<MasteryAction, MasterySkillData>[];
    private readonly ctx: any;
    private readonly generalSettings: any;
    private readonly skillSettings: Map<string, any>;

    constructor(ctx: any, game: Game) {
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
        ]);
        // numerical settings
        this.generalSettings.add([
            {
                type: 'number',
                name: 'minimalActionTime',
                min: 0,
                max: Infinity,
                label: 'Minimal action time in ms',
                hint: 'Minimal action time in ms.',
                default: 250,
            },
        ]);
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
        this.skillList = game.skills.filter((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => skill.actions)
            // @ts-ignore
            .filter((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => !['melvorD:Magic', 'melvorD:Farming'].includes(skill.id));
        this.skillList.push(game.altMagic);
        this.skillSettings = new Map<string, any>();
        this.skillList.forEach((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => {
            // @ts-ignore
            const skillID = skill.id;
            [
                {id: 'LEVEL', label: 'Level targets'},
                {id: 'MASTERY', label: 'Mastery targets'},
                {id: 'POOL', label: 'Pool targets (%)'},
            ].forEach(target => {
                const key = 'TARGET_' + target.id;
                this.addSkillSetting(key, target.label, skillID);
            });
        });
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

    getTargetLevel(skillID: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_LEVEL'), this.get('TARGET_LEVEL', skillID), 99, 170);
    }

    getTargetMastery(skillID: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_MASTERY'), this.get('TARGET_MASTERY', skillID), 99, 170);
    }

    getTargetPool(skillID: string, current: number, cap: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_POOL'), this.get('TARGET_POOL', skillID), 100, cap);
    }

    private addSkillSetting(key: string, label: string, skillID: string): string {
        let skillSettings = this.skillSettings.get(skillID);
        if (skillSettings === undefined) {
            skillSettings = this.ctx.settings.section(skillID);
            this.skillSettings.set(skillID, skillSettings);
        }
        skillSettings.add({
            type: 'numberArray',
            name: key,
            label: label,
            hint: `{target.label} for ${skillID}.`,
            default: [],
        });
        return key;
    }
}