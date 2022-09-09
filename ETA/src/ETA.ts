import {ETASettings} from "./Settings";

import {Card} from "../../TinyMod/src/Card";
import {TabCard} from "../../TinyMod/src/TabCard";
import {TinyMod} from "../../TinyMod/src/TinyMod";

export class ETA extends TinyMod {
    private readonly settings: ETASettings;

    // @ts-ignore 2564
    private togglesCard: Card;
    // @ts-ignore 2564
    private skillTargetCard: TabCard;
    // @ts-ignore 2564
    private globalTargetsCard: Card;

    constructor(ctx: any) {
        super(ctx, 'ETA');
        this.log('Loading...');
        // initialize fields
        this.settings = new ETASettings();
        // create menu
        this.createSettingsMenu();
        // we made it
        this.log('Loaded!');
    }

    static testup(): ETA {
        // @ts-ignore 2304
        const ctx = mod.getDevContext();
        return new ETA(ctx);
    }

    createSettingsMenu(): void {
        super.createSettingsMenu([
            // add toggles card
            () => this.addToggles(),
            // add global target card
            () => this.addGlobalTargetInputs(),
            // add target card
            () => this.addTargetInputs(),
        ]);
    }

    addToggles(): void {
        this.togglesCard = new Card(this.tag, this.content, '', '150px', true);
        const titles = new Map<string, string>()
        titles.set('IS_12H_CLOCK', 'Use 12h clock');
        titles.set('IS_SHORT_CLOCK', 'Use short time format');
        titles.set('SHOW_XP_RATE', 'Show XP rates');
        titles.set('SHOW_ACTION_TIME', 'Show action times');
        titles.set('UNCAP_POOL', 'Show pool past 100%');
        titles.set('CURRENT_RATES', 'Show current rates');
        titles.set('USE_TOKENS', '"Use" Mastery tokens for final Pool %');
        titles.set('SHOW_PARTIAL_LEVELS', 'Show partial levels');
        titles.set('HIDE_REQUIRED', 'Hide required resources');
        titles.set('DING_RESOURCES', 'Ding when out of resources');
        titles.set('DING_LEVEL', 'Ding on level target');
        titles.set('DING_MASTERY', 'Ding on mastery target');
        titles.set('DING_POOL', 'Ding on pool target');
        titles.set('USE_TABLETS', '"Use" all created Summoning Tablets');
        titles.forEach((value, key) => {
            this.togglesCard.addToggleRadio(
                value,
                key,
                this.settings,
                key,
                this.settings.get(key),
            );
        });
    }

    addGlobalTargetInputs() {
        this.globalTargetsCard = new Card(this.tag, this.content, '', '150px', true);
        [
            {id: 'LEVEL', label: 'Global level targets', defaultValue: [99]},
            {id: 'MASTERY', label: 'Global mastery targets', defaultValue: [99]},
            {id: 'POOL', label: 'Global pool targets (%)', defaultValue: [100]},
        ].forEach(target => {
            const globalKey = 'GLOBAL_TARGET_' + target.id;
            this.globalTargetsCard.addNumberArrayInput(
                target.label,
                this.settings,
                globalKey,
                target.defaultValue,
            );
        });

    }

    addTargetInputs() {
        this.skillTargetCard = new TabCard('EtaTarget', true, this.tag, this.content, '', '150px', true);
        // @ts-ignore 2304
        game.skills.allObjects.filter((skill: any) => !skill.isCombat).forEach((skill: any) => {
            const card = this.skillTargetCard.addTab(skill.name, skill.media, '', '150px', undefined);
            card.addSectionTitle(skill.name + ' Targets');
            [
                {id: 'LEVEL', label: 'Level targets'},
                {id: 'MASTERY', label: 'Mastery targets'},
                {id: 'POOL', label: 'Pool targets (%)'},
            ].forEach(target => {
                const key = 'TARGET_' + target.id;
                card.addNumberArrayInput(
                    target.label,
                    this.settings.get(key),
                    skill.name,
                );
            });
        });
    }
}