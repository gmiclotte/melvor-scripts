export function addModal(title: any, id: any, content: any) {
    // create modal
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';

    // create dialog
    const modalDialog = document.createElement('div');
    modalDialog.className = 'modal-dialog';
    modalDialog.style.display = 'flex';
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

export function destroyMenu(menuItemId: string, modalID: string) {
    // remove the TinyMod tab access point
    const tab = document.getElementById(menuItemId);
    if (tab !== null) {
        //tab.remove();
    }
    // hide and remove the modal
    const modal = document.getElementById(modalID);
    if (modal) {
        $(modal).modal('hide');
        $(modal).modal('dispose');
        modal.remove();
    }
}