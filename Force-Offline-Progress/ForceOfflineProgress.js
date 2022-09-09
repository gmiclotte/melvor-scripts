function forceOfflineProgress(hours = 24) {
    const snapShot = game.snapShotOffline();
    const timeDiff = hours * 3600 * 1000
    game.runTicks(Math.floor(timeDiff / TICK_INTERVAL));
    const offlineMessage = game.createOfflineModal(snapShot, timeDiff);
    const modalID = offlineModalID;
    offlineModalID++;
    const html = `<div id="offline-modal-${modalID}" style="height:auto;"><small><div class="spinner-border spinner-border-sm text-primary mr-2" id="offline-progress-spinner" role="status"></div>${getLangString('MENU_TEXT', 'LOADING_OFFLINE_PROGRESS')}</small></div>`;
    const welcomeBackModal = {
        title: getLangString('MISC_STRING', '3'),
        html: html,
        imageUrl: cdnMedia("assets/media/main/question.svg" /* Assets.QuestionMark */),
        imageWidth: 64,
        imageHeight: 64,
        imageAlt: getLangString('CHARACTER_SELECT', '88'),
        allowOutsideClick: false,
    };
    addModalToQueue(welcomeBackModal);
    // Clear out notification queue
    game.combat.notifications.clear();
    if (document.getElementById(`offline-modal-${modalID}`) !== null) {
        $(`#offline-modal-${modalID}`).html(offlineMessage);
    } else {
        const offlineDiv = createElement('div', {
            id: `offline-modal-${modalID}`,
            attributes: [['style', 'height:auto;']],
        });
        if (typeof offlineMessage === 'string') {
            offlineDiv.innerHTML = offlineMessage;
        } else {
            offlineDiv.append(offlineMessage);
        }
        welcomeBackModal.html = offlineDiv;
    }
}