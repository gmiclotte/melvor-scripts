import {addModal, destroyMenu, destroyModal} from "./Menu";

export class TinyMod {
    protected readonly ctx: any;
    protected readonly modalID: string;
    protected readonly menuItemID: string;
    protected readonly tag: string;
    // @ts-ignore 2564
    protected modal: HTMLDivElement;
    // @ts-ignore 2564
    protected content: HTMLDivElement;
    private readonly icon: string;

    constructor(ctx: any, tag: string, icon = 'assets/media/main/settings_header.svg') {
        this.ctx = ctx;
        this.tag = tag;
        this.icon = icon;
        this.modalID = tag.toLowerCase() + 'Modal';
        this.menuItemID = tag.toLowerCase() + 'Button';
    }

    log(...x: any): void {
        console.log(this.tag, ':', ...x);
    }

    warn(...x: any): void {
        console.warn(this.tag, ...x);
    }

    error(...x: any): void {
        console.error(this.tag, ...x);
    }

    createModal(funcs: (() => void)[] = []): void {
        // clean up in case modal already exists
        destroyModal(this.modalID);
        // create wrapper
        this.content = document.createElement('div');
        this.content.className = 'tinyModTabContent';
        // run inner functions
        funcs.forEach(func => func());
        // create modal and access point
        this.modal = addModal(`${this.tag} Settings`, this.modalID, [this.content]);
    }

    createSettingsMenu(funcs: (() => void)[] = []): void {
        // clean up in case elements already exist
        destroyMenu(this.menuItemID, this.modalID);
        // create the modal
        this.createModal(funcs);
        // @ts-ignore
        sidebar.category('Modding').item('Mod Settings').subitem(this.tag).remove();
        // @ts-ignore
        const settingsSideBarItem = sidebar.category('Modding').item('Mod Settings').subitem(this.tag);
        settingsSideBarItem.rootEl.dataset.toggle = 'modal';
        settingsSideBarItem.rootEl.dataset.target = '#' + this.modalID;
        // log
        this.log('added settings menu!')
    }
}