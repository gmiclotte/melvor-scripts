// ==UserScript==
// @name         Melvor Make-XI
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  Specify the number of actions to perform, Firemaking and Cooking are not supported. Forked from the original Melvor MakeX by Breindahl#2660
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// @grant        none
// ==/UserScript==
/* jshint esversion: 6 */
 
// Note that this script is made for MelvorIdle version 0.19
 
function script() {
    // Loading script
    console.log('Melvor Make-XI Loaded');
 
    // Funtion to check if task is complete
    function taskComplete(skillID) {
        if (window.makeLeft === 0) {
            notifyPlayer(skillID, "Task Done");
            console.log('make-x task done');
            let ding = new Audio("https://www.myinstants.com/media/sounds/ding-sound-effect.mp3");
            ding.volume = 0.1;
            ding.play();
            window.makeLeft = Infinity;
        }
    }
 
    const newVerb = (name, verb, selected, start) => {return {
        name: name,
        verb: verb,
        id: `#${verb}X`,
        verbX: `${verb}X`,
        start: start,
        selected: () => window[selected],
    }};
 
    const skillVerbs = {
        //[CONSTANTS.skill.Firemaking]: newVerb('Firemaking', 'Burn', 'selectedLog', 'burnLog'),
        //[CONSTANTS.skill.Cooking]: newVerb('Cooking', 'Cook', 'selectedFood', 'startCooking'),
        [CONSTANTS.skill.Smithing]: newVerb('Smithing', 'Smith', 'selectedSmith', 'startSmithing'),
        [CONSTANTS.skill.Fletching]: newVerb('Fletching', 'Fletch', 'selectedFletch', 'startFletching'),
        [CONSTANTS.skill.Crafting]: newVerb('Crafting', 'Craft', 'selectedCraft', 'startCrafting'),
        [CONSTANTS.skill.Runecrafting]: newVerb('Runecrafting', 'Create', 'selectedRunecraft', 'startRunecrafting'),
        [CONSTANTS.skill.Herblore]: newVerb('Herblore', 'Brew', 'selectedHerblore', 'startHerblore'),
        [CONSTANTS.skill.Magic]: newVerb('Magic', 'Cast', 'selectedAltMagic', 'castMagic'),
    };
 
 
    const TempContainerMakeX = ['<small class="mr-2" id="','"><button type="button" class="btn btn-warning m-3" onclick="setMakeX(',');">','</button></small>'];
    //$("#skill-fm-logs-selected-qty").after(TempContainerMakeX[0]+"BurnX"+TempContainerMakeX[1]+"CONSTANTS.skill.Firemaking"+TempContainerMakeX[2]+"Burn X"+TempContainerMakeX[3]);
    //$("#skill-cooking-food-selected-qty").after(TempContainerMakeX[0]+"CookX"+TempContainerMakeX[1]+"CONSTANTS.skill.Cooking"+TempContainerMakeX[2]+"Cook X"+TempContainerMakeX[3]);
    $("#smith-item-have").parent().parent().parent().children().last().children().first().children().first().after(TempContainerMakeX[0]+"SmithX"+TempContainerMakeX[1]+"CONSTANTS.skill.Smithing"+TempContainerMakeX[2]+"Smith X"+TempContainerMakeX[3]);
    $("#fletch-item-have").parent().parent().parent().children().last().children().first().children().first().after(TempContainerMakeX[0]+"FletchX"+TempContainerMakeX[1]+"CONSTANTS.skill.Fletching"+TempContainerMakeX[2]+"Fletch X"+TempContainerMakeX[3]);
    $("#craft-item-have").parent().parent().parent().children().last().children().first().children().first().after(TempContainerMakeX[0]+"CraftX"+TempContainerMakeX[1]+"CONSTANTS.skill.Crafting"+TempContainerMakeX[2]+"Craft X"+TempContainerMakeX[3]);
    $("#runecraft-item-have").parent().parent().parent().children().last().children().first().children().first().after(TempContainerMakeX[0]+"CreateX"+TempContainerMakeX[1]+"CONSTANTS.skill.Runecrafting"+TempContainerMakeX[2]+"Create X"+TempContainerMakeX[3]);
    $("#herblore-item-have").parent().parent().parent().children().last().children().first().children().first().after(TempContainerMakeX[0]+"BrewX"+TempContainerMakeX[1]+"CONSTANTS.skill.Herblore"+TempContainerMakeX[2]+"Brew X"+TempContainerMakeX[3]);
    $("#magic-item-have").parent().parent().parent().children().last().children().first().children().first().after(TempContainerMakeX[0]+"CastX"+TempContainerMakeX[1]+"CONSTANTS.skill.Magic"+TempContainerMakeX[2]+"Cast X"+TempContainerMakeX[3]);
 
    window.makeLeft = Infinity;
    let startedNow = false;
 
    function makeX(clicked, skillID) {
        const verb = skillVerbs[skillID].verb;
        const verbx = skillVerbs[skillID].verbx;
        const id = skillVerbs[skillID].id;
        if (offline.skill === [skillID] && clicked) {
            window.makeLeft = Infinity;
            $(id).children().first().html(verbx);
        }
        if (makeLeft !== Infinity) {
            if (clicked) {
                if (!startedNow) {
                    makeLeft = Infinity;
                    $(id).children().first().html(verb + " X");
                }
            } else {
                window.makeLeft--;
                $(id).children().first().html(makeLeft + " left");
            }
        }
        startedNow = false;
        // console.log('makeLeft: '+ makeLeft);
        if (window.makeLeft === 0) {
            taskComplete(skillID);
            refs[skillID](true);
            $(id).children().first().html(verb + " X");
        }
 
    }
 
    window.setMakeX = function(skillID) {
        const verb = skillVerbs[skillID].verb;
        const verbx = skillVerbs[skillID].verbx;
        const id = skillVerbs[skillID].id;
        const selected = skillVerbs[skillID].selected();
        if (selected !== undefined && selected !== null && selected >= 0) {
            if (makeLeft === Infinity) {
                let SetMakeX = prompt('How many would you like to make?');
                try {
                    SetMakeX = parseInt(SetMakeX, 10);
                    if (SetMakeX !== null) {
                        window.makeLeft = SetMakeX;
                        $(id).children().first().html(makeLeft + " left");
                        // console.log('makeLeft: '+ makeLeft);
                        if (offline.skill === skillID) {
                            return;
                        }
                    }
                } catch (e) {
                    console.error(e)
                }
            } else {
                window.makeLeft = Infinity;
                $(id).children().first().html(verbx);
            }
        }
        startedNow = true;
        skillVerbs[skillID].start(true);
    };
 
    const refs = {};
    const wrapper = (id) => {
        const start = skillVerbs[id].start;
        refs[id] = window[start];//.bind({});;
        window[start] = (...args) => {
            refs[id](...args);
            makeX(args[0], id);
        }
        skillVerbs[id].start = window[start];
    }
    Object.getOwnPropertyNames(skillVerbs).forEach(skillID => wrapper(skillID));
 
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
