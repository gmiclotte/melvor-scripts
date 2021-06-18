// ==UserScript==
// @name         Virtual Levels
// @version		 0.0.0
// @namespace    github.com/gmiclotte
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// @description Display level and xp numbers for virtual levels, similar to regular levels.
// ==/UserScript==

function script() {

    //////////////////////////////////
    //show exp to next level past 99//
    //////////////////////////////////
    let match = '$("#skill-progress-percent-"+skill+extraID).text("100%");$("#skill-progress-bar-"+skill+extraID).css("width","100%");';
    let replacement = 'const currXp = Math.floor(skillXP[skill]);'
        + 'const nextLevel = exp.xp_to_level(skillXP[skill]);'
        + 'const nextXp = exp.level_to_xp(nextLevel);'
        + 'const currLevelXp = exp.level_to_xp(nextLevel - 1);'
        + 'const progress = Math.floor((currXp - currLevelXp) / (nextXp - currLevelXp) * 100);'
        + '$("#skill-progress-xp-" + skill + extraID).text(numberWithCommas(currXp) + " / " + numberWithCommas(nextXp));'
        + '$("#skill-progress-percent-" + skill + extraID).text(`${progress}%`);'
        + '$("#skill-progress-bar-" + skill + extraID).css("width", `${progress}%`);';
    eval(updateSkillVisuals.toString().replace(match, replacement).replace(/^function (\w+)/, "window.$1 = function"));

    match = `let xp=0;if(skillLevel[i]>=99)xp=numberWithCommas(Math.floor(skillXP[i]));else xp=numberWithCommas(Math.floor(skillXP[i]))+\" / \"+numberWithCommas(exp.level_to_xp(skillLevel[i]+1));const tooltip=tippy(\"#skill-progress-xp-tooltip-\"+i,{content:\"<div class='text-center'>\"+xp+\"</div>\",allowHTML:true,placement:\"top\",interactive:false,animation:false,});tooltipInstances.combatXP=tooltipInstances.combatXP.concat(tooltip);$(\"#skill-progress-xp-\"+i).text(numberWithCommas(Math.floor(skillXP[i]))+\" / \"+numberWithCommas(exp.level_to_xp(skillLevel[i]+1)));$(\"#skill-progress-level-\"+i).text(skillLevel[i]+\" / 99\");$(\"#skill-progress-percent-\"+i).text(Math.floor(nextLevelProgress[i])+\"%\");$(\"#skill-progress-bar-\"+i).css(\"width\",nextLevelProgress[i]+\"%\");`
    replacement = 'const currXp = Math.floor(skillXP[i]);'
        + 'const nextLevel = exp.xp_to_level(skillXP[i]);'
        + 'const nextXp = exp.level_to_xp(nextLevel);'
        + 'const currLevelXp = exp.level_to_xp(nextLevel - 1);'
        + 'const progress = Math.floor((currXp - currLevelXp) / (nextXp - currLevelXp) * 100);'
        + '$("#skill-progress-xp-" + i).text(numberWithCommas(currXp) + " / " + numberWithCommas(nextXp));'
        + '$("#skill-progress-level-" + i).text((nextLevel - 1) + " / 99");'
        + '$("#skill-progress-percent-" + i).text(`${progress}%`);'
        + '$("#skill-progress-bar-" + i).css("width", `${progress}%`);';
    eval(updateSkillWindow.toString().replace(match, replacement).replace(/^function (\w+)/, "window.$1 = function"));

    // one-time update of all skill windows after a slight delay
    setTimeout(() => {
        for (let id in SKILLS) {
            updateSkillWindow(id);
        }
        updateSkillVisuals(16, '-1');
    }, 5000);

    ///////
    //log//
    ///////
    console.log("Melvor Virtual Levels Loaded")

}

(() => {
    function injectScript(main) {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
        document.body.appendChild(scriptElement).parentNode.removeChild(scriptElement);
    }

    function loadScript() {
        if (window.isLoaded
            || (typeof unsafeWindow !== 'undefined' && unsafeWindow.isLoaded)) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            injectScript(script);
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
})();