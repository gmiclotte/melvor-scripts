import {Card} from "./Card";
import {addModal, destroyMenu} from "./Menu";
import {TabCard} from "./TabCard";
import {TinyMod} from "./TinyMod";

export function setup(ctx: any): void {
    // create TinyMod api
    ctx.onInterfaceReady((_: any) => {
        ctx.api({
            // @ts-ignore
            TinyMod: {
                Card: Card,
                Menu: {addModal, destroyMenu},
                TabCard: TabCard,
                TinyMod: TinyMod,
            },
        })
    });
}