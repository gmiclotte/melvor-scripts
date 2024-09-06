import type {  Cartography } from '../../Game-Files/gameTypes/cartography';
import {DigSitePOI, PointOfInterest, PortalPOI} from '../../Game-Files/gameTypes/hexMap';
import type {getLangString} from "../../Game-Files/gameTypes/language";
import type {hideElement} from "../../Game-Files/gameTypes/utils";

export function setup(ctx: any): void {
    // load style sheet
    ctx.loadStylesheet('styles/tinyMod.css');

    // create CoL object
    ctx.onInterfaceReady((_: any) => {
        ctx.api({'confirmPOIDiscoveryModal': confirmPOIDiscoveryModal})
    });

    // patch discoverPOI
    // @ts-ignore
    ctx.patch(Cartography, 'discoverPOI').replace(confirmPOIDiscoveryModal);

    // patch surveyActionQueue
    // @ts-ignore
    ctx.patch(Cartography, 'surveyActionQueue').after(swapToAutoSurvey);
}

// inspired by Cartography.queuePOIDiscoveryModal
function confirmPOIDiscoveryModal(original: any, poi: PointOfInterest) {
    // @ts-ignore
    const { modalBody } = this.getPoiDiscoveryNode(poi);
    const gazerDiv = document.createElement('span');
    gazerDiv.className = 'text-warning';
    gazerDiv.id = 'CoL:gazer';
    gazerDiv.innerHTML = "You gaze into the portal of CoL and see:";
    modalBody.insertBefore(gazerDiv, modalBody.firstChild);
    console.log(modalBody)
    // @ts-ignore
    const costs =  document.getElementById('cartography-poi-modal-costs');
    if (costs) {
        // @ts-ignore
        hideElement(costs);
    }
    // @ts-ignore
    addModalToQueue({
        imageUrl: poi.media,
        // @ts-ignore
        titleText: getLangString('UNDISCOVERED_POI'),
        html: modalBody,
        allowOutsideClick: false,
        showDenyButton: true,
        // @ts-ignore
        denyButtonText: getLangString('VIEW_LATER'),
        showConfirmButton: true,
        // @ts-ignore
        confirmButtonText: 'Discover Now',
        preConfirm: () => {
            // @ts-ignore
            return original(poi);
        },
        // @ts-ignore
        customClass: createSwalCustomClass({
            image: 'cartography__image',
            container: 'cartography__poi_container',
            popup: 'cartography__poi_popup',
        }),
    });
}

function swapToAutoSurvey() {
    // @ts-ignore
    if (this._actionMode === 0) {
        // stopped
        // current hex:
        // @ts-ignore
        const hex = this.activeMap.playerPosition;
        // @ts-ignore
        const nextHex = this.getNextAutoSurveyHex(hex)
        // @ts-ignore
        this.startAutoSurvey(nextHex);
    }
}