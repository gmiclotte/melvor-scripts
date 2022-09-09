import $ from 'jquery';

export function addModal(title: any, id: any, content: any) {
    // create modal
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';

    // create dialog
    const modalDialog = document.createElement('div');
    modalDialog.className = 'modal-dialog';
    modal.appendChild(modalDialog);

    // create content wrapper
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalDialog.appendChild(modalContent);

    // create header
    const modalHeader = $(`<div class="block block-themed block-transparent mb-0"><div class="block-header bg-primary-dark">
        <h3 class="block-title">${title}</h3>
        <div class="block-options"><button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
        <i class="fa fa-fw fa-times"></i></button></div></div></div>`);
    $(modalContent).append(modalHeader);

    // add content
    content.forEach((x: any) => modalContent.appendChild(x));

    // insert modal
    const elt = document.getElementById('page-container');
    if (elt) {
        elt.appendChild(modal);
    } else {
        console.warn(`Failed to attach modal ${id}`);
    }

    // return modal
    return modal;
}

export function createMenu(title: any, menuID: any, eyeID: any) {
    // check if tools menu already exists
    let menu = document.getElementById(menuID);
    if (menu !== null) {
        return menu;
    }

    // Create new tools menu
    menu = document.createElement('li');
    menu.id = menuID;
    menu.className = 'nav-main-heading tinyModNoSelect';
    menu.textContent = title;

    // Create heading eye
    const headingEye = document.createElement('i');
    headingEye.className = 'far fa-eye text-muted ml-1';
    headingEye.id = eyeID;
    headingEye.onclick = () => headingEyeOnClick(eyeID);
    headingEye.style.cursor = 'pointer';
    menu.appendChild(headingEye);
    (window as any).MICSR_eyeHidden = false;

    // insert menu before Minigames
    (document.getElementsByClassName('nav-main-heading') as any).forEach((heading: any) => {
        // @ts-expect-error TS(2304): Cannot find name 'getLangString'.
        if (heading.textContent === getLangString('PAGE_NAME_MISC', '1')) {
            heading.parentElement.insertBefore(menu, heading);
        }
    });
}

/**
 * Callback for when sidebar eye is clicked
 */
export function headingEyeOnClick(eyeID: any) {
    const headingEye = document.getElementById(eyeID);
    if (!headingEye) {
        console.warn(`failed to detect eye ${eyeID}`);
        return;
    }
    if ((window as any).MICSR_eyeHidden) {
        headingEye.className = 'far fa-eye text-muted ml-1';
        (window as any).MICSR_menuTabs.forEach((tab: any) => tab.style.display = '');
        (window as any).MICSR_eyeHidden = false;
    } else {
        headingEye.className = 'far fa-eye-slash text-muted ml-1';
        (window as any).MICSR_menuTabs.forEach((tab: any) => tab.style.display = 'none');
        (window as any).MICSR_eyeHidden = true;
    }
}

export function addMenuItem(itemTitle: any, iconSrc: any, accessID: any, modalID: any, menuTitle = 'Tools', menuID = 'tinyModToolsMenu', eyeID = 'tinyModHeadingEye') {
    createMenu(menuTitle, menuID, eyeID);
    if ((window as any).MICSR_menuTabs === undefined) {
        (window as any).MICSR_menuTabs = [];
    }

    const tabDiv = document.createElement('li');
    (window as any).MICSR_menuTabs.push(tabDiv);
    tabDiv.id = accessID;
    tabDiv.style.cursor = 'pointer';
    tabDiv.className = 'nav-main-item tinyModNoSelect';

    const menuButton = document.createElement('div');
    menuButton.className = 'nav-main-link nav-compact';
    menuButton.dataset.toggle = 'modal';
    menuButton.dataset.target = '#' + modalID;
    tabDiv.appendChild(menuButton);

    const icon = document.createElement('img');
    icon.className = 'nav-img';
    icon.src = iconSrc;
    menuButton.appendChild(icon);

    const menuText = document.createElement('span');
    menuText.className = 'nav-main-link-name';
    menuText.textContent = itemTitle;
    menuButton.appendChild(menuText);

    const elt = document.getElementById(menuID);
    if (elt) {
        elt.after(tabDiv);
    } else {
        console.warn(`failed to insert menu ${menuID}`);
    }

    // return access point
    return tabDiv;
}

export function destroyMenu(menuItemId: any, modalID: any, menuID = 'tinyModToolsMenu') {
    // remove the MICSR tab access point
    const tab = document.getElementById(menuItemId);
    if (tab !== null) {
        (window as any).MICSR_menuTabs = (window as any).MICSR_menuTabs.filter((x: any) => x !== tab);
        tab.remove();
    }
    // remove the tools menu if it is empty
    const menu = document.getElementById(menuID);
    if (menu !== null && (menu as any).length === 0) {
        menu.remove();
    }
    // hide and remove the modal
    const modal = document.getElementById(modalID);
    if (modal) {
        $(modal).modal('hide');
        $(modal).modal('dispose');
        modal.remove();
    }
}