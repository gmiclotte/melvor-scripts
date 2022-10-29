import {Snippets} from "./Snippets";

export function setup(ctx: any): void {
    // create snippets object
    const snippets = new Snippets(ctx);
    // adjust and confirm settings, then apply all desired snippets
    ctx.onCharacterLoaded(async function () {
        ctx.api({snippets: snippets});
        await snippets.patchSnippets();
    });
}