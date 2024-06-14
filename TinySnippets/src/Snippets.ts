import {TinyMod} from "../../TinyMod/src/TinyMod";
import {Card} from "../../TinyMod/src/Card";
import {removePoolLimitSetting} from "./RemovePoolLimit";
import {unlimitedOfflineSetting} from "./UnlimitedOffline";
import {pauseOfflineProgressSetting} from "./ZaWarudo";
import type {Game} from "../../Game-Files/gameTypes/game";

export type Toggle = {
    type: string,
    name: string,
    label: string,
    hint: string,
    default: boolean,
};

export type Snippet = {
    object: any,
    function: (ctx: any, game: Game) => void,
    setting: Toggle,
    toggles: Toggle[],
};

export class Snippets extends TinyMod {

    private togglesCard!: Card;
    private readonly snippets: Snippet[];
    private readonly toggles: any;

    constructor(ctx: any, tag: string = 'TinySnippets') {
        super(ctx, tag);
        // create list of snippets
        this.snippets = [
            unlimitedOfflineSetting,
            removePoolLimitSetting,
            pauseOfflineProgressSetting(ctx),
        ];
        // create toggles
        this.toggles = ctx.settings.section('Toggles');
        this.snippets.forEach(snippet => {
            this.toggles.add(snippet.setting);
            snippet.toggles.forEach(toggle => {
                this.toggles.add(toggle);
            });
        });
    }

    addToggle(toggle: Toggle) {
        const key = toggle.name;
        const label = toggle.label;
        this.togglesCard.addToggleRadio(
            label,
            key,
            this.toggles,
            key,
            this.toggles.get(key),
        );
    }

    addToggles() {
        this.togglesCard = new Card(this.idManager, this.content, '', '150px', true);
        this.snippets.forEach(snippet => {
            this.addToggle(snippet.setting);
            snippet.toggles.forEach(toggle => {
                this.addToggle(toggle);
            });
        });
    }

    async patchSnippets() {
        // create view
        this.createModal([() => this.addToggles()]);
        // @ts-ignore
        await SwalLocale.fire({
            title: 'Tiny\'s Snippets',
            // @ts-ignore
            html: this.togglesCard.outerContainer,
            showCancelButton: false,
            // @ts-ignore
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
        }).then((_: any) => {
            this.snippets.forEach((snippet: any) => {
                try {
                    // execute snippet if toggled on
                    if (this.toggles.get(snippet.setting.name)) {
                        this.log(`executing ${snippet.setting.name}`);
                        // @ts-ignore
                        snippet.function(this.ctx, game);
                    }
                } catch (e) {
                    this.error(`Error patching snippet ${snippet.setting.name}: ${e}`);
                }
            });
        });
    }
}