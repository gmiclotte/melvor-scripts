export class ElementIDManager {
    public readonly tag: string;
    private readonly ids: Map<string, boolean>;

    constructor(tag: string) {
        this.tag = tag;
        this.ids = new Map<string, boolean>();
    }

    hasTaggedID(taggedID: string) {
        return this.ids.get(taggedID) !== undefined;
    }

    hasRawID(rawID: string) {
        const taggedID = this.getID(rawID, false);
        return this.hasTaggedID(taggedID)
    }

    getID(idData: string, create: boolean): string {
        const taggedID = `TinyMod-${this.tag}-${idData}`.replace(/ /g, '-');
        if (create) {
            if (this.ids.get(taggedID)) {
                console.warn(`element with id ${taggedID} already exists!`);
            }
            this.ids.set(taggedID, true);
        }
        return taggedID;
    }
}