import type {Game} from "../../Game-Files/gameTypes/game";
import type {MasterySkillData, SkillWithMastery} from "../../Game-Files/gameTypes/skill";
import type {MasteryAction} from "../../Game-Files/gameTypes/mastery2";

export class Settings {
    public readonly skillList: SkillWithMastery<MasteryAction, MasterySkillData>[];
    public readonly generalSettingsArray: {
        numerical: {
            type: string,
            name: string,
            label: string,
            hint: string,
            default: number,
            min: number,
            max: number,
        }[];
        toggles: {
            type: string,
            name: string,
            label: string,
            hint: string,
            default: boolean,
        }[];
        targets: {
            type: string,
            name: string,
            label: string,
            hint: string,
            default: number[],
        }[];
    };
    public readonly skillTargetsSettingsArray: { name: string, label: string, whiteList: string[] | undefined }[];
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
        // setting arrays
        this.generalSettingsArray = {
            toggles: [
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
            ],
            numerical: [
                {
                    type: 'number',
                    name: 'minimalActionTime',
                    label: 'Minimal action time in ms',
                    hint: 'Minimal action time in ms.',
                    default: 250,
                    min: 0,
                    max: Infinity,
                },
            ],
            targets: [
                {
                    type: 'numberArray',
                    name: 'GLOBAL_TARGET_LEVEL',
                    label: 'Global level targets',
                    hint: 'Global level targets.',
                    default: [99, 120],
                },
                {
                    type: 'numberArray',
                    name: 'GLOBAL_TARGET_ABYSSAL',
                    label: 'Global abyssal level targets',
                    hint: 'Global abyssal level targets.',
                    default: [60],
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
            ],
        };

        this.skillTargetsSettingsArray = [
            {name: 'LEVEL', label: 'Level targets', whiteList: undefined},
            {name: 'ABYSSAL', label: 'Abyssal level targets', whiteList: undefined},
            {name: 'MASTERY', label: 'Mastery targets', whiteList: undefined},
            {name: 'POOL', label: 'Pool targets (%)', whiteList: undefined},
            {name: 'INTENSITY', label: 'Intensity targets', whiteList: ['melvorItA:Harvesting']},
        ];

        // general settings
        this.generalSettings = ctx.settings.section('General');
        this.generalSettings.add(this.generalSettingsArray.toggles);
        this.generalSettings.add(this.generalSettingsArray.numerical);
        this.generalSettings.add(this.generalSettingsArray.targets);
        // skillSettings
        this.skillList = game.skills.filter((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => skill.actions)
            // @ts-ignore
            .filter((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => !['melvorD:Magic', 'melvorD:Farming'].includes(skill.id));
        this.skillList.push(game.altMagic);
        this.skillSettings = new Map<string, any>();
        this.skillList.forEach((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => {
            // @ts-ignore
            const skillID = skill.id;
            this.skillTargetsSettingsArray.forEach(target => {
                if (target.whiteList !== undefined && !target.whiteList.includes(skillID)) {
                    return;
                }
                const key = 'TARGET_' + target.name;
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

    getTargetLevel(realmID: string, skillID: string, current: number) {
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            return this.getTarget(current, this.get('GLOBAL_TARGET_LEVEL'), this.get('TARGET_LEVEL', skillID), 99, 170);
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            return this.getTarget(current, this.get('GLOBAL_TARGET_ABYSSAL'), this.get('TARGET_ABYSSAL', skillID), 99, 170);
        }
    }

    getTargetMastery(skillID: string, current: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_MASTERY'), this.get('TARGET_MASTERY', skillID), 99, 170);
    }

    getTargetPool(skillID: string, current: number, cap: number) {
        return this.getTarget(current, this.get('GLOBAL_TARGET_POOL'), this.get('TARGET_POOL', skillID), 100, cap);
    }

    getTargetIntensity(skillID: string, current: number, milestones: number[]) {
        return this.getTarget(current, milestones, this.get('TARGET_INTENSITY', skillID), 100, 100);
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