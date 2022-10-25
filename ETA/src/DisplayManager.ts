import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {Game} from "../../Game-Files/built/game";
import {Settings} from "./Settings";
import {FishingArea} from "../../Game-Files/built/fishing";
import {DisplayWithMastery} from "./DisplayWithMastery";
import {Display} from "./Display";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {ResourceDisplay} from "./ResourceDisplay";
import {MasteryAction} from "../../Game-Files/built/mastery2";
import {CookingCategory} from "../../Game-Files/built/cooking";
import {ThievingArea} from "../../Game-Files/built/thieving2";

export class DisplayManager {
    private readonly game: Game;
    private readonly displays: Map<string, Display>;
    private readonly settings: Settings;
    private readonly npcAreaMap: Map<string, ThievingArea>;

    constructor(game: Game, settings: Settings, npcAreaMap: Map<string, ThievingArea>) {
        this.displays = new Map<string, Display>()
        this.settings = settings;
        this.game = game;
        this.npcAreaMap = npcAreaMap;
    }

    removeAllDisplays() {
        this.displays.forEach(display => {
            display.container.remove();
        });
        this.displays.clear();
    }

    public getDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        let display = this.displays.get(displayID);
        if (display) {
            // display already exists
            return display;
        }
        // create new display
        display = this.createDisplay(skill, actionID);
        this.displays.set(displayID, display);
        return display;
    }

    public getDisplayID(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): string {
        let displayID = `etaTime${skill.name}`;
        if (actionID !== undefined) {
            displayID += actionID;
        }
        return displayID.replace(' ', '-');
    }

    hideHTML(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string) {
        // disable time left element
        const display = this.getDisplay(skill, actionID);
        display.container.style.display = 'none';
    }

    injectHTML(result: EtaSkillWithMastery, now: Date) {
        const display = this.getDisplay(result.skill, result.action.id);
        display.container.style.display = 'block';
        display.injectHTML(result, now);
    }

    private createArtisanDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string, eltID: string) {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplay(this, this.settings, this.game.bank, this.game.items, displayID);
        const container = document.getElementById(eltID);
        if (container === null) {
            return display;
        }
        const parent = container.children[0].children[0].children[0].children[0].children[1];
        const node = parent.children[0];
        if (node === null) {
            return display;
        }
        parent.insertBefore(display.container, node.nextSibling);
        // @ts-ignore
        if (skill.activeRecipe.id !== actionID) {
            display.container.style.display = 'none';
        }
        return display;
    }

    private createWoodcuttingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementsByClassName('progress-bar bg-woodcutting');
        if (node === null) {
            return display;
        }
        const index = this.game.woodcutting.actions.allObjects.findIndex((action: any) => action.id === actionID);
        node = node[index + 1].parentNode;
        node!.parentNode!.insertBefore(display.container, node!.nextSibling);
        return display;
    }

    private createFishingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById('fishing-area-menu-container');
        if (node === null) {
            return display;
        }
        const index = this.game.fishing.areas.allObjects.findIndex((area: FishingArea) =>
            area.fish.find((fish: any) => fish.id === actionID) !== undefined);
        node = node.children[index].children[0].children[0].children[3].children[0].children[1].children[1];
        node.appendChild(display.container);
        return display;
    }

    private createMiningDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById(`mining-ores-container`);
        if (node === null) {
            return display;
        }
        const index = skill.actions.allObjects.findIndex((action: any) => action.id === actionID);
        node = node.children[index].childNodes[1].childNodes[1].childNodes[1].childNodes[8];
        const parent = node.parentNode;
        parent!.insertBefore(display.container, node);
        return display;
    }

    private createFiremakingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplay(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById('firemaking-bonfire-button');
        if (node === null) {
            return display;
        }
        node.parentNode!.parentNode!.parentNode!.appendChild(display.container);
        // @ts-ignore
        if (skill.activeRecipe.id !== actionID) {
            display.container.style.display = 'none';
        }
        return display;
    }

    private createCookingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplay(this, this.settings, this.game.bank, this.game.items, displayID);
        const category = this.game.cooking.actions.getObjectByID(actionID).category;
        const index = this.game.cooking.categories.allObjects.findIndex((c: CookingCategory) => c === category);
        const node = document.getElementById(`cooking-menu-container`)!.children[index].firstChild!.firstChild!.firstChild!.firstChild!.childNodes[2].firstChild!;
        node.insertBefore(display.container, node.childNodes[1]);
        // @ts-ignore
        if (skill.selectedRecipes.get(category) !== actionID) {
            display.container.style.display = 'none';
        }
        return display;
    }

    private createThievingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const area = this.npcAreaMap.get(actionID);
        // @ts-ignore
        const node = document.getElementById(`thieving-area-panel-${area!.id}`)!.firstChild!.firstChild!.childNodes[2].firstChild!;
        node.insertBefore(display.container, node.childNodes[1]);
        // @ts-ignore
        const selectedNPC = thievingMenu.areaPanels.get(area).selectedNPC;
        if (selectedNPC.id !== actionID) {
            display.container.style.display = 'none';
        }
        return display;
    }

    private createDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        // create new display
        // standard processing container
        if ([
            this.game.smithing,
            this.game.fletching,
            this.game.crafting,
            this.game.runecrafting,
            this.game.herblore,
        ].includes(skill)) {
            return this.createArtisanDisplay(skill, actionID, `${skill.name.toLowerCase()}-artisan-container`);
        }
        // other containers
        switch (skill.name) {
            case this.game.woodcutting.name:
                return this.createWoodcuttingDisplay(skill, actionID);
            case this.game.fishing.name:
                return this.createFishingDisplay(skill, actionID);
            case this.game.firemaking.name:
                return this.createFiremakingDisplay(skill, actionID);
            case this.game.cooking.name:
                return this.createCookingDisplay(skill, actionID);
            case this.game.mining.name:
                return this.createMiningDisplay(skill, actionID);
            case this.game.thieving.name:
                return this.createThievingDisplay(skill, actionID);
            // case this.game.agility.name:
            case this.game.summoning.name:
                return this.createArtisanDisplay(skill, actionID, `${skill.name.toLowerCase()}-creation-element`);
            // case this.game.astrology.name:
            // case this.game.altMagic.name:
        }
        return new Display(this, this.settings, this.game.bank, this.game.items, displayID);
    }
}