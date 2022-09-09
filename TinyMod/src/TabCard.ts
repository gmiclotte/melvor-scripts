import {Card} from './Card';

export class TabCard extends Card {
    container: any;
    header: any;
    idPrefix: any;
    selectedTab: any;
    tabCards: any;
    tabContainer: any;
    tabCount: any;
    tabIDs: any;

    constructor(idPrefix: any, init: any, tag: string, parentElement: any, height: any, inputWidth: any, outer = false) {
        super(tag, parentElement, height, inputWidth, outer);
        this.selectedTab = 0;
        this.tabCount = 0;
        this.idPrefix = idPrefix;
        this.tabIDs = [];
        this.tabCards = [];
        if (init) {
            this.addTabMenu();
        }
    }

    addPremadeTab(name: any, img: any, card: any) {
        return this.addTab(name, img, null, null, card);
    }

    addTab(title: any, img: any, height: any, inputWidth: any, card: Card | undefined) {
        // update tab count
        const index = this.tabCount;
        this.tabCount++;
        // create tab id
        const tabID = this.getID(`${this.idPrefix} ${title} tab`, true);
        // set header
        this.addTabHeader(tabID, title, img, () => this.onTabClick(index));
        // create, insert and return card
        card = card ? card : new Card(this.tag, this.tabContainer, height, inputWidth);
        if (!card) {
            console.warn(`failed to add tab ${tabID}`)
            return card;
        }
        this.tabIDs.push(tabID);
        this.tabCards.push(card);
        if (index !== this.selectedTab) {
            card.container.style.display = 'none';
            card.container.className = 'tinyModTabButton';
        } else {
            card.container.className = 'tinyModTabButton tinyModTabButtonSelected';
        }
        return card;
    }

    onTabClick(tabID: any) {
        if (this.selectedTab === tabID) {
            return;
        }
        this.tabCards[this.selectedTab].container.style.display = 'none';
        this.setTabIDToUnSelected(this.tabIDs[this.selectedTab]);
        this.tabCards[tabID].container.style.display = '';
        this.setTabIDToSelected(this.tabIDs[tabID]);
        this.selectedTab = tabID;
    }

    setTabIDToSelected(tabID: any) {
        const elt = document.getElementById(tabID);
        if (elt) {
            elt.className = 'tinyModTabButton tinyModTabButtonSelected';
        }
    }

    setTabIDToUnSelected(tabID: any) {
        const elt = document.getElementById(tabID);
        if (elt) {
            elt.className = 'tinyModTabButton';
        }
    }

    /**
     * Adds a tab menu to the card, the tab elements will have their display toggled on and off when the tab is clicked
     * @return {HTMLDivElement}
     */
    addTabMenu() {
        this.header = document.createElement('div');
        this.header.className = 'tinyModTabButtonContainer';
        this.container.appendChild(this.header);
        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'tinyModTabContainer';
        this.container.appendChild(this.tabContainer);
    }

    addTabHeader(tabID: any, title: any, img: any, callBack: any) {
        // create img element
        const newImage = document.createElement('img');
        newImage.className = 'tinyModButtonImage';
        newImage.id = `${tabID}-image`;
        newImage.src = img;
        // create tab element
        const newTab = document.createElement('button');
        newTab.type = 'button';
        newTab.id = tabID;
        newTab.className = 'tinyModTabButton';
        newTab.dataset.tippyContent = title;
        newTab.onclick = callBack;
        newTab.appendChild(newImage);
        // attach tab to header
        this.header.appendChild(newTab);
    }
}