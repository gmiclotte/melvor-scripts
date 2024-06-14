import {Snippets} from "./Snippets";

export function setup(ctx: any): void {
    // create snippets object
    const snippets = new Snippets(ctx);
    // disable onSaveDataLoad
    // @ts-ignore
    snippets.onSaveDataLoad = onSaveDataLoad;
    // @ts-ignore
    onSaveDataLoad = () => {
    };
    // adjust and confirm settings, then apply all desired snippets
    ctx.onCharacterLoaded(async function () {
        ctx.api({snippets: snippets});
        await snippets.patchSnippets();
        // run onSaveDataLoad
        // @ts-ignore
        if (onSaveDataLoad.toString() === "() => {}") {
            // @ts-ignore
            onSaveDataLoad = snippets.onSaveDataLoad;
        }
        // @ts-ignore
        onSaveDataLoad();
    });
}