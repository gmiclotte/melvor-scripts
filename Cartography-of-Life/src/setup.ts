export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');

    // create SpendPool object
    ctx.onInterfaceReady((_: any) => {
        ctx.api({
        })
    });
}
