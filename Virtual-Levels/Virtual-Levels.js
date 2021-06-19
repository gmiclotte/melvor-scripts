// ==UserScript==
// @name         Melvor Virtual Levels
// @version		 0.0.3
// @namespace    github.com/gmiclotte
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// @description Display level and xp numbers for virtual levels, similar to regular levels.
// ==/UserScript==

function script() {

    function addSummoningProgess() {
        // add summoning to combat skill progress menu
        const table = document.getElementById('combat-skill-progress-menu').children[0];
        const skillID = CONSTANTS.skill.Summoning + '-1';
        const body = document.createElement('tbody');
        const row = body.insertRow();
        // header
        const header = document.createElement('th');
        header.className = 'text-center';
        header.scope = 'row';
        const headerImg = document.createElement('img');
        headerImg.className = 'skill-icon-xs';
        headerImg.src = 'https://cdn.melvor.net/core/v018/assets/media/skills/summoning/summoning.svg';
        header.appendChild(headerImg);
        row.appendChild(header);
        // level
        const level = document.createElement('td');
        level.className = 'font-w600 font-size-sm';
        const levelSmall = document.createElement('small');
        levelSmall.id = `skill-progress-level-${skillID}`;
        level.appendChild(levelSmall);
        row.appendChild(level);
        // progress %
        const percent = document.createElement('td');
        percent.className = 'font-w600 font-size-sm';
        const percentSmall = document.createElement('small');
        percentSmall.id = `skill-progress-percent-${skillID}`;
        percent.appendChild(percentSmall);
        row.appendChild(percent);
        // xp
        const xp = document.createElement('td');
        xp.className = 'font-w600 font-size-sm d-none d-md-table-cell';
        const xpSmall = document.createElement('small');
        xpSmall.id = `skill-progress-xp-${skillID}`;
        xp.appendChild(xpSmall);
        row.appendChild(xp);
        // progress bar
        const bar = document.createElement('td');
        const barDiv = document.createElement('div');
        barDiv.className = 'progress active';
        barDiv.style = 'height: 8px';
        barDiv.id = `skill-progress-xp-tooltip-${skillID}`;
        const barInnerDiv = document.createElement('div');
        barInnerDiv.className = 'progress-bar bg-success';
        barInnerDiv.id = `skill-progress-bar-${skillID}`;
        barInnerDiv.role = 'progressbar';
        barInnerDiv.style = 'width: 0%;';
        barInnerDiv.ariaValuenow = '0';
        barInnerDiv.ariaValuemin = '0';
        barInnerDiv.ariaValuemax = '100';
        barDiv.appendChild(barInnerDiv);
        bar.appendChild(barDiv);
        row.appendChild(bar);
        // add row to table
        table.appendChild(body);
    }

    addSummoningProgess();

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

    match = `let xp=0;if(skillLevel[i]>=99)xp=numberWithCommas(Math.floor(skillXP[i]));else xp=numberWithCommas(Math.floor(skillXP[i]))+" / "+numberWithCommas(exp.level_to_xp(skillLevel[i]+1));const tooltip=tippy("#skill-progress-xp-tooltip-"+i,{content:"<div class='text-center'>"+xp+"</div>",allowHTML:true,placement:"top",interactive:false,animation:false,});tooltipInstances.combatXP=tooltipInstances.combatXP.concat(tooltip);$("#skill-progress-xp-"+i).text(numberWithCommas(Math.floor(skillXP[i]))+" / "+numberWithCommas(exp.level_to_xp(skillLevel[i]+1)));$("#skill-progress-level-"+i).text(skillLevel[i]+" / 99");$("#skill-progress-percent-"+i).text(Math.floor(nextLevelProgress[i])+"%");$("#skill-progress-bar-"+i).css("width",nextLevelProgress[i]+"%");`
    replacement = 'const currXp = Math.floor(skillXP[i]);'
        + 'const nextLevel = exp.xp_to_level(skillXP[i]);'
        + 'const nextXp = exp.level_to_xp(nextLevel);'
        + 'const currLevelXp = exp.level_to_xp(nextLevel - 1);'
        + 'const progress = Math.floor((currXp - currLevelXp) / (nextXp - currLevelXp) * 100);'
        + 'const id = i === CONSTANTS.skill.Summoning ? i + "-1" : i;'
        + '$("#skill-progress-xp-" + id).text(numberWithCommas(currXp) + " / " + numberWithCommas(nextXp));'
        + '$("#skill-progress-level-" + id).text((nextLevel - 1) + " / 99");'
        + '$("#skill-progress-percent-" + id).text(`${progress}%`);'
        + '$("#skill-progress-bar-" + id).css("width", `${progress}%`);';
    eval(updateSkillWindow.toString()
        .replace(match, replacement)
        .replace('if(!SKILLS[i].hasMastery)', 'if (!SKILLS[i].hasMastery || i === CONSTANTS.skill.Summoning)')
        .replace(/^function (\w+)/, "window.$1 = function")
    );

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