export class ElementIDManager {
    public readonly tag: string;
    private readonly ids: Map<string, HTMLElement>;

    constructor(tag: string) {
        this.tag = tag;
        this.ids = new Map<string, HTMLElement>();
    }

    hasTaggedID(taggedID: string) {
        return this.ids.get(taggedID) !== undefined;
    }

    get(taggedID: string) {
        return this.ids.get(taggedID);
    }

    hasRawID(rawID: string) {
        const taggedID = this.getID(rawID);
        return this.hasTaggedID(taggedID)
    }

    getID(idData: string): string {
        return `TinyMod-${this.tag}-${idData}`.replace(/ /g, '-');
    }

    setID(idData: string, elt: HTMLElement): string {
        const taggedID = this.getID(idData);
        if (this.ids.get(taggedID)) {
            console.warn(`element with id ${taggedID} already exists!`);
        }
        this.ids.set(taggedID, elt)
        elt.id = taggedID;
        return taggedID;
    }
}