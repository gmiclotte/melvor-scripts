import {TinyMod} from "../../TinyMod/src/TinyMod";
import {Card} from "../../TinyMod/src/Card";
import {removePoolLimitSetting} from "./RemovePoolLimit";
import {unlimitedOfflineSetting} from "./UnlimitedOffline";

export type Snippet = {
    function: (ctx: any) => void,
    setting: {
        type: string,
        name: string,
        label: string,
        hint: string,
        default: boolean,
    }
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
        ];
        // create toggles
        this.toggles = ctx.settings.section('Toggles');
        this.snippets.forEach(snippet => this.toggles.add(snippet.setting));
    }

    addToggles() {
        this.togglesCard = new Card(this.tag, this.content, '', '150px', true);
        this.snippets.forEach(snippet => {
            const key = snippet.setting.name;
            const label = snippet.setting.label;
            this.togglesCard.addToggleRadio(
                label,
                key,
                this.toggles,
                key,
                this.toggles.get(key),
            );
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
            confirmButtonText: getLangString('MENU_TEXT', 'CONFIRM'),
        }).then((_: any) => {
            this.snippets.forEach((snippet: any) => {
                // execute snippet if toggled on
                if (this.toggles.get(snippet.setting.name)) {
                    this.log(`executing ${snippet.setting.name}`);
                    snippet.function(this.ctx);
                }
            });
        });
    }
}