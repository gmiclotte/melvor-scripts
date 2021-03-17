// ==UserScript==
// @name         Melvor Show Modifiers
// @version      0.0.3
// @description  Adds a button to show all your modifiers
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com/*
// @grant        none
// @namespace    http://tampermonkey.net/
// @noframes
// ==/UserScript==

function script() {
    window.melvorShowModifiers = {};
    let codeString = showAllAgilityPassives.toString();
    codeString = codeString.replace(/^function (\w+) *\(\)/, 'window.melvorShowModifiers.showAllModifiers = (modifiers, text) => ');
    codeString = codeString.replace(/agilityPassiveBonuses/g, 'modifiers');
    codeString = codeString.replace('Current Global Active Passives from Agility', '${text}');
    eval(codeString);

    window.melvorShowModifiers.showModifiers = (modifiers, text = 'Active Modifiers') => {
        const filteredModifiers = {};
        Object.getOwnPropertyNames(modifiers).forEach(prop => {
            const value = modifiers[prop];
            if (value.length === undefined) {
                if (value === 0) {
                    return;
                }
                filteredModifiers[prop] = value;
            } else {
                if (value.length === 0) {
                    return;
                }
                filteredModifiers[prop] = value;
            }
        });
        window.melvorShowModifiers.showAllModifiers(filteredModifiers, text);
    }

    let modifierButton = () => {
        return '<div class="dropdown d-inline-block ml-2">'
            + '<button type="button" '
            + 'class="btn btn-sm btn-dual text-combat-smoke" '
            + 'id="page-header-modifiers" '
            + 'onclick="window.melvorShowModifiers.showModifiers(playerModifiers);" '
            + 'aria-haspopup="true" '
            + 'aria-expanded="true">'
            + `<img class="skill-icon-xxs" src="${getItemMedia(CONSTANTS.item.Event_Clue_1)}">`
            + '</button>'
            + '</div>';
    }
    const html2Node = (html) => {
        const template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }
    let node = document.getElementById('page-header-potions-dropdown').parentNode;
    node.parentNode.insertBefore(html2Node(modifierButton()), node);
}


(function () {
    function injectScript(main) {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
        document.body.appendChild(scriptElement).parentNode.removeChild(scriptElement);
    }

    function loadScript() {
        if ((window.isLoaded && !window.currentlyCatchingUp)
            || (typeof unsafeWindow !== 'undefined' && unsafeWindow.isLoaded && !unsafeWindow.currentlyCatchingUp)) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            injectScript(script);
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
})();
