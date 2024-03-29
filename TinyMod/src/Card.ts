import {ElementIDManager} from "./ElementIDManager";

export class Card {
    idManager: ElementIDManager;
    container: any;
    dropDowns: any;
    inputWidth: any;
    numOutputs: any;
    outerContainer: any;

    /**
     * Constructs an instance of McsCard
     * @param {HTMLElement} parentElement The parent element the card should be appended to
     * @param {string} height The height of the card
     * @param {string} inputWidth The width of inputs for the card's ui elements
     * @param {boolean} outer This card is an outside card
     */
    constructor(idManager: ElementIDManager, parentElement: any, height: any, inputWidth: any, outer = false) {
        this.idManager = idManager;
        this.outerContainer = document.createElement('div');
        this.outerContainer.className = `tinyModCardContainer${outer ? ' tinyModOuter block block-rounded border-top border-combat border-4x bg-combat-inner-dark' : ''}`;
        if (height !== '') {
            this.outerContainer.style.height = height;
        }
        this.container = document.createElement('div');
        this.container.className = 'tinyModCardContentContainer';
        this.outerContainer.appendChild(this.container);
        parentElement.appendChild(this.outerContainer);
        this.inputWidth = inputWidth;
        this.dropDowns = [];
        this.numOutputs = [];
    }

    setID(idData: string, elt: HTMLElement): string {
        return this.idManager.setID(idData, elt);
    }

    clearContainer() {
        const container = this.container;
        if (!container) {
            return;
        }
        while (container.firstChild) {
            container.removeChild(container.lastChild);
        }
    }

    /**
     * Creates a new button and appends it to the container. Autoadds callbacks to change colour
     * @param {string} buttonText Text to display on button
     * @param {string} id override for the default id
     * @param {Function} onclickCallback Callback to excute when pressed
     */
    addButton(buttonText: string, id: string, onclickCallback: () => void) {
        const newButton = document.createElement('button');
        newButton.type = 'button';
        this.setID(id, newButton);
        newButton.className = 'btn btn-primary m-1';
        newButton.style.width = `100%`;
        newButton.textContent = buttonText;
        newButton.onclick = onclickCallback;
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'd-flex';
        buttonContainer.appendChild(newButton);
        this.container.appendChild(buttonContainer);
        return newButton;
    }

    /**
     * Adds an image to the card
     * @param {string} imageSource Source of image file
     * @param {number} imageSize size of image in pixels
     * @param {string} imageID Element ID
     * @return {HTMLImageElement}
     */
    addImage(imageSource: any, imageSize: any, imageID = '') {
        const newImage = document.createElement('img');
        newImage.style.width = `${imageSize}px`;
        newImage.style.height = `${imageSize}px`;
        this.setID(imageID, newImage);
        newImage.src = imageSource;
        const div = document.createElement('div');
        div.className = 'mb-1';
        div.style.textAlign = 'center';
        div.appendChild(newImage);
        this.container.appendChild(div);
        return newImage;
    }

    /**
     * Creates a button displaying an image with a tooltip
     * @param {string} imageSource Source of the image on the button
     * @param {string} idText Text to put in the id of the button
     * @param {Function} onclickCallback Callback when clicking the button
     * @param {string} size Image size
     * @param {string} tooltip The tooltip content
     * @return {HTMLButtonElement} The created button element
     */
    createImageButton(imageSource: any, idText: any, onclickCallback: any, size: any, tooltip: any) {
        const newButton = document.createElement('button');
        newButton.type = 'button';
        this.setID(`${idText} Button`, newButton);
        newButton.className = 'btn btn-outline-dark';
        newButton.onclick = onclickCallback;
        if (tooltip) newButton.dataset.tippyContent = tooltip;
        const newImage = document.createElement('img');
        newImage.className = `tinyModButtonImage tinyModImage${size}`;
        this.setID(`${idText} Button Image`, newImage);
        newImage.src = imageSource;
        newButton.appendChild(newImage);
        return newButton;
    }

    /**
     * Creates multiple image buttons in a single container
     * @param {string[]} sources The image source paths
     * @param {string[]} idtexts The ids for the buttons
     * @param {string} size The size of the buttons: Small, Medium
     * @param {Function[]} onclickCallbacks The callbacks for the buttons
     * @param {string[]} tooltips The tooltip contents
     * @param {string} containerWidth container width
     * @return {HTMLDivElement[]} The image buttons
     */
    addImageButtons(sources: any, idtexts: any, size: any, onclickCallbacks: any, tooltips: any, containerWidth: string | undefined = undefined) {
        const newCCContainer = document.createElement('div');
        newCCContainer.className = 'tinyModMultiImageButtonContainer';
        for (let i = 0; i < sources.length; i++) {
            const newButton = this.createImageButton(sources[i], idtexts[i], onclickCallbacks[i], size, tooltips[i]);
            newCCContainer.appendChild(newButton);
        }
        if (containerWidth) {
            newCCContainer.style.width = containerWidth;
        }
        this.container.appendChild(newCCContainer);
    }

    /**
     * Assigns the onclick event to a popupmenu
     * @param {HTMLElement} showElement Element that should show the popup when clicked
     * @param {HTMLElement} popupMenuElement Element that should be displayed when the showElement is clicked
     */
    registerPopupMenu(showElement: any, popupMenuElement: any) {
        showElement.addEventListener('click', () => {
            let firstClick = true;
            if (popupMenuElement.style.display === 'none') {
                const outsideClickListener = (event: any) => {
                    if (firstClick) {
                        firstClick = false;
                        return;
                    }
                    if (popupMenuElement.style.display === '') {
                        popupMenuElement.style.display = 'none';
                        document.body.removeEventListener('click', outsideClickListener);
                    }
                };
                document.body.addEventListener('click', outsideClickListener);
                popupMenuElement.style.display = '';
            }
        });
    }

    /**
     * Creates a multiple button popup menu (Equip grid)
     */
    addMultiPopupMenu(sources: any, elIds: any, popups: any, tooltips: any, newCCContainer: HTMLDivElement | undefined = undefined) {
        if (!newCCContainer) {
            newCCContainer = document.createElement('div');
        }
        if (!newCCContainer) {
            console.warn(`failed to add multi popup menu`);
        }
        newCCContainer.className = 'tinyModEquipmentImageContainer';
        for (let i = 0; i < sources.length; i++) {
            const containerDiv = document.createElement('div');
            containerDiv.style.position = 'relative';
            containerDiv.style.cursor = 'pointer';
            const newImage = document.createElement('img');
            this.setID(elIds[i], newImage);
            newImage.src = sources[i];
            newImage.className = 'combat-equip-img border border-2x border-rounded-equip border-combat-outline p-1';
            newImage.dataset.tippyContent = tooltips[i];
            newImage.dataset.tippyHideonclick = 'true';
            containerDiv.appendChild(newImage);
            containerDiv.appendChild(popups[i]);
            newCCContainer.appendChild(containerDiv);
            popups[i].style.display = 'none';
            this.registerPopupMenu(containerDiv, popups[i]);
        }
        this.container.appendChild(newCCContainer);
        return newCCContainer;
    }

    /**
     * Adds a dropdown to the card
     * @param {string} labelText The text to label the dropdown with
     * @param {string[]} optionText The text of the dropdown's options
     * @param {Array} optionValues The values of the dropdown's options
     * @param {Function} onChangeCallback The callback for when the option is changed
     */
    addDropdown(labelText: any, optionText: any, optionValues: any, onChangeCallback: any) {
        const newCCContainer = this.createCCContainer();
        this.setID(`${labelText} Dropdown Container`, newCCContainer);
        const label = this.createLabel(labelText, newCCContainer.id);
        label.classList.add('mb-1');
        newCCContainer.appendChild(label);
        const newDropdown = this.createDropdown(optionText, optionValues, labelText, onChangeCallback);
        newCCContainer.appendChild(newDropdown);
        this.container.appendChild(newCCContainer);
        return newDropdown;
    }

    /**
     * Adds a dropdown to the card, but also returns a reference to it
     * @param {string[]} optionText The text of the dropdown's options
     * @param {Array} optionValues The values of the dropdown's options
     * @param {string} labelText The id of the dropdown
     * @param {Function} onChangeCallback The callback for when the option is changed
     * @return {HTMLSelectElement}
     */
    createDropdown(optionText: any, optionValues: any, labelText: string, onChangeCallback: any) {
        const newDropdown = document.createElement('select');
        newDropdown.className = 'form-control mb-1';
        this.setID(`${labelText} Dropdown`, newDropdown);
        for (let i = 0; i < optionText.length; i++) {
            const newOption = document.createElement('option');
            newOption.text = optionText[i];
            newOption.value = optionValues[i];
            newDropdown.add(newOption);
        }
        newDropdown.addEventListener('change', onChangeCallback);
        this.dropDowns.push(newDropdown);
        return newDropdown;
    }

    /**
     * Adds an input to the card for a number
     * @param {string} labelText The text for the input's label
     * @param {number} startValue The initial value
     * @param {number} min The minimum value of the input
     * @param {number} max The maximum value of the input
     * @param {Function} onChangeCallback The callback for when the input changes
     */
    addNumberInput(labelText: any, startValue: any, min: any, max: any, onChangeCallback: any) {
        const newCCContainer = this.createCCContainer();
        const newInput = document.createElement('input');
        this.setID(`${labelText} Input`, newInput);
        newInput.type = 'number';
        newInput.min = min;
        newInput.max = max;
        newInput.value = startValue;
        newInput.className = 'form-control mb-1';
        newInput.style.width = this.inputWidth;
        newInput.addEventListener('change', onChangeCallback);
        const label = this.createLabel(labelText, newInput.id);
        label.classList.add('mb-1');
        newCCContainer.appendChild(label);
        newCCContainer.appendChild(newInput);
        this.container.appendChild(newCCContainer);
    }

    /**
     * Adds an input to the card for text
     * @param {string} labelText The text for the input's label
     * @param {string} startValue The initial text in the input
     * @param {Function} onInputCallback The callback for when the input changes
     * @param {string} id
     */
    addTextInput(labelText: any, startValue: any, onInputCallback: any, inputId: string = '') {
        inputId = inputId.length === 0 ? labelText : inputId;
        const newCCContainer = this.createCCContainer();
        const newInput = document.createElement('input');
        this.setID(`${inputId} TextInput`, newInput);
        newInput.type = 'text';
        newInput.value = startValue;
        newInput.className = 'form-control mb-1';
        newInput.style.width = this.inputWidth;
        newInput.addEventListener('input', onInputCallback);
        const label = this.createLabel(labelText, newInput.id);
        label.classList.add('mb-1');
        newCCContainer.appendChild(label);
        newCCContainer.appendChild(newInput);
        this.container.appendChild(newCCContainer);
    }

    numberArrayToInputString(array: any) {
        if (array === undefined || array === null) {
            return '';
        }
        if (!isNaN(array)) {
            array = [array];
        }
        return array.toString() + ' ';
    }

    /**
     * Adds and input for number arrays to the card
     */
    addNumberArrayInput(labelText: any, object: any, key: string, defaultValue: any = undefined,
                        get = this.getKeyFromObject, set = this.setValToObject) {
        const onInputCallback = (event: any) => {
            const rawInput = event.currentTarget.value;
            const input = rawInput === 'undefined' || rawInput === 'null' ? '' : rawInput;
            let result: any;
            try {
                // split input into numbers
                result = input.split(/\D/)
                    // get rid of empty entries
                    .filter((x: any) => x.length)
                    // parse
                    .map((x: any) => parseInt(x))
                    // sort numerically
                    .sort((a: any, b: any) => a - b)
                    // remove duplicates
                    .filter((e: any, i: any, a: any) => e !== a[i - 1]);
            } catch {
                result = defaultValue;
            }
            if (result.length === 0) {
                result = defaultValue;
            }
            set(object, key, result);
        }
        this.addTextInput(labelText, this.numberArrayToInputString(get(object, key)), onInputCallback, labelText + key);
    }

    getKeyFromObject(object: any, key: string): any {
        if (object.get) {
            return object.get(key);
        }
        return object[key];
    }

    setValToObject(object: any, key: string, val: any): any {
        if (object.set) {
            object.set(key, val);
        } else {
            object[key] = val;
        }
    }

    /**
     * Adds info text
     * @param {string} textToDisplay
     * @return {HTMLDivElement}
     */
    addInfoText(textToDisplay: any) {
        const textDiv = document.createElement('div');
        textDiv.textContent = textToDisplay;
        textDiv.className = 'tinyModInfoText';
        this.container.appendChild(textDiv);
        return textDiv;
    }

    /**
     * Adds a number output to the card
     * @param {string} labelText The text for the output's label
     * @param {string} initialValue The intial text of the output
     * @param {number} height The height of the output in pixels
     * @param {string} imageSrc An optional source for an image, if left as '', an image will not be added
     * @param {string} outputID The id of the output field
     * @param {boolean} setLabelID Whether or not to assign an ID to the label
     */
    addNumberOutput(labelText: string, initialValue: string, height: number, imageSrc: string, outputID: string, setLabelID = false) {
        // container
        const newCCContainer = this.createCCContainer();
        if (imageSrc && imageSrc !== '') {
            newCCContainer.appendChild(this.createImage(imageSrc, height));
        }
        // output field
        const newOutput = document.createElement('span');
        newOutput.className = 'tinyModNumberOutput';
        newOutput.style.width = this.inputWidth;
        newOutput.textContent = initialValue;
        this.setID(outputID ?? `${labelText} Output`, newOutput);
        // label
        const newLabel = this.createLabel(labelText, newOutput.id);
        if (setLabelID) {
            this.setID(`${labelText} Label`, newLabel);
        }
        newCCContainer.appendChild(newLabel);
        newCCContainer.appendChild(newOutput);
        // append container
        this.container.appendChild(newCCContainer);
        this.numOutputs.push(newOutput);
    }

    /**
     * Adds a title to the card
     * @param {string} titleText The text for the title
     */
    addSectionTitle(titleText: string) {
        const newSectionTitle = document.createElement('div');
        this.setID(titleText, newSectionTitle);
        newSectionTitle.textContent = titleText;
        newSectionTitle.className = 'tinyModSectionTitle';
        const titleContainer = document.createElement('div');
        titleContainer.className = 'd-flex justify-content-center';
        titleContainer.appendChild(newSectionTitle);
        this.container.appendChild(titleContainer);
    }

    /**
     * Adds an array of buttons to the card
     * @param {string[]} buttonText The text to put on the buttons
     * @param {number} height The height of the buttons in pixels
     * @param {number} width The width of the buttons in pixels
     * @param {Function[]} buttonCallbacks The callback function for when the buttons are clicked
     */
    addMultiButton(buttonText: any, buttonCallbacks: any, container = this.container) {
        let newButton;
        const newCCContainer = document.createElement('div');
        newCCContainer.className = 'tinyModMultiButtonContainer';
        for (let i = 0; i < buttonText.length; i++) {
            newButton = document.createElement('button');
            newButton.type = 'button';
            this.setID(`${buttonText[i]} Button`, newButton);
            newButton.className = 'btn btn-primary m-1';
            newButton.style.width = '100%';
            newButton.textContent = buttonText[i];
            newButton.onclick = buttonCallbacks[i];
            newCCContainer.appendChild(newButton);
        }
        container.appendChild(newCCContainer);
    }

    addImageToggleWithInfo(imgSrc: string, id: string, callBack: any, text: any, size = 'Medium', tooltip = '') {
        const container = this.createCCContainer();
        // image
        const img = this.createImageButton(imgSrc, id, callBack, size, tooltip);
        container.appendChild(img);
        // filled to push icon to the left and text to the righ
        const filler = document.createElement('p');
        filler.style.flexGrow = '1';
        container.appendChild(filler);
        // text
        const span = document.createElement('span');
        span.textContent = text;
        span.className = 'tinyModInfoText';
        if (id) {
            this.setID(`${id} Info`, span);
        }
        span.style.display = 'block';
        container.appendChild(span);
        // push container to parent
        this.container.appendChild(container);
    }

    addToggleRadio(labelText: any, radioName: any, object: any, flag: string, initialYes = false, height = 25, callBack = () => {
    }) {
        const yesToggle = () => {
            object.set(flag, true);
            callBack();
        }
        const noToggle = () => {
            object.set(flag, false);
            callBack();
        }
        const initialRadio = initialYes ? 0 : 1;
        this.addRadio(labelText, height, radioName, ['Yes', 'No'], [yesToggle, noToggle], initialRadio);
    }

    /**
     * Adds a radio option to the card
     * @param {string} labelText The text for the option's label
     * @param {number} height The height of the radios in pixels
     * @param {string} radioName The name of the radio
     * @param {string[]} radioLabels The labels for the individual radio buttons
     * @param {Function[]} radioCallbacks The callbacks for the individual radio buttons
     * @param {number} initialRadio The initial radio that is on
     * @param {string} imageSrc An optional string to specify the source of a label image, if '' an image is not added
     */
    addRadio(labelText: string, height: number, radioName: string, radioLabels: string[], radioCallbacks: ((e: any) => void)[], initialRadio: number, imageSrc = '') {
        const newCCContainer = this.createCCContainer();
        if (imageSrc && imageSrc !== '') {
            newCCContainer.appendChild(this.createImage(imageSrc, height));
        }
        this.setID(`${labelText} Radio Container`, newCCContainer);
        newCCContainer.appendChild(this.createLabel(labelText, newCCContainer.id));
        const radioContainer = document.createElement('div');
        radioContainer.className = 'tinyModRadioContainer';
        newCCContainer.appendChild(radioContainer);
        // Create Radio elements with labels
        for (let i = 0; i < radioLabels.length; i++) {
            radioContainer.appendChild(this.createRadio(radioName, radioLabels[i], `${labelText} Radio ${radioLabels[i]}`, initialRadio === i, radioCallbacks[i]));
        }
        this.container.appendChild(newCCContainer);
    }

    /**
     * Creates a radio input element
     * @param {string} radioName The name of the radio collection
     * @param {string} radioLabel The text of the radio
     * @param {string} radioID The id of the radio
     * @param {boolean} checked If the radio is checked or not
     * @param {Function} radioCallback Callback for when the radio is clicked
     * @return {HTMLDivElement}
     */
    createRadio(radioName: any, radioLabel: any, radioID: string, checked: any, radioCallback: any) {
        const newDiv = document.createElement('div');
        newDiv.className = 'custom-control custom-radio custom-control-inline';
        const newRadio = document.createElement('input');
        newRadio.type = 'radio';
        this.setID(radioID, newRadio);
        newRadio.name = radioName;
        newRadio.className = 'custom-control-input';
        if (checked) {
            newRadio.checked = true;
        }
        newRadio.addEventListener('change', radioCallback);
        newDiv.appendChild(newRadio);
        const label = this.createLabel(radioLabel, newRadio.id);
        label.className = 'custom-control-label';
        newDiv.appendChild(label);
        return newDiv;
    }

    /**
     * Creates a Card Container Container div
     * @return {HTMLDivElement}
     */
    createCCContainer() {
        const newCCContainer = document.createElement('div');
        newCCContainer.className = 'tinyModCCContainer';
        return newCCContainer;
    }

    /**
     * Creates a label element
     * @param {string} labelText The text of the label
     * @param {string} radioID The text of the label
     * @return {HTMLLabelElement}
     */
    createLabel(labelText: string, radioID: string): HTMLLabelElement {
        const newLabel = document.createElement('label');
        newLabel.className = 'tinyModLabel';
        newLabel.textContent = labelText;
        newLabel.setAttribute('for', radioID);
        return newLabel;
    }

    /**
     * Creates an image element
     * @param {string} imageSrc source of image
     * @param {number} height in pixels
     * @return {HTMLImageElement} The newly created image element
     */
    createImage(imageSrc: any, height: any) {
        const newImage = document.createElement('img');
        newImage.style.height = `${height}px`;
        newImage.src = imageSrc;
        return newImage;
    }

    // Prebaked functions for tooltips
    /**
     * Toggles the display of a tooltip off
     * @param {MouseEvent} e The mouseleave event
     * @param {HTMLDivElement} tooltip The tooltip element
     */
    hideTooltip(e: any, tooltip: any) {
        tooltip.style.display = 'none';
    }

    /**
     * Toggles the display of a tooltip on
     * @param {MouseEvent} e The mouseenter event
     * @param {HTMLDivElement} tooltip The tooltip element
     */
    showTooltip(e: any, tooltip: any) {
        tooltip.style.display = '';
    }
}