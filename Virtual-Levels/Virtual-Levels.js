// ==UserScript==
// @name        Melvor Virtual Levels
// @namespace   github.com/gmiclotte
// @version		0.1.5
// @description Display level and xp numbers for virtual levels, similar to regular levels.
// @author		GMiclotte
// @include		https://melvoridle.com/*
// @include		https://*.melvoridle.com/*
// @exclude		https://melvoridle.com/index.php
// @exclude		https://*.melvoridle.com/index.php
// @exclude		https://wiki.melvoridle.com*
// @exclude		https://*.wiki.melvoridle.com*
// @inject-into page
// @noframes
// @grant		none
// ==/UserScript==

((main) => {
    const script = document.createElement('script');
    script.textContent = `try { (${main})(); } catch (e) { console.log(e); }`;
    document.body.appendChild(script).parentNode.removeChild(script);
})(() => {

    function addSummoningProgess() {
        // add summoning to combat skill progress menu
        const table = document.getElementById('combat-skill-progress-menu').children[0];
        const skillID = Skills.Summoning + '-1';
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
        const tooltipBar = document.createElement('div');
        tooltipBar.className = 'progress active';
        tooltipBar.style = 'height: 8px';
        tooltipBar.id = `skill-progress-xp-tooltip-${skillID}`;
        const barInnerDiv = document.createElement('div');
        barInnerDiv.className = 'progress-bar bg-info';
        barInnerDiv.id = `skill-progress-bar-${skillID}`;
        barInnerDiv.role = 'progressbar';
        barInnerDiv.style = 'width: 0%;';
        barInnerDiv.ariaValuenow = '0';
        barInnerDiv.ariaValuemin = '0';
        barInnerDiv.ariaValuemax = '100';
        tooltipBar.appendChild(barInnerDiv);
        bar.appendChild(tooltipBar);
        row.appendChild(bar);
        // add row to table
        table.appendChild(body);
        // add new Summoning elements to `skillProgressDisplay.elems`
        const elems = skillProgressDisplay.elems.get(Skills.Summoning)
        elems.level.push(levelSmall);
        elems.percent.push(percentSmall);
        elems.progress.push(barInnerDiv);
        elems.tooltip.push(skillProgressDisplay.createTooltip(tooltipBar, ''));
        elems.xp.push(xpSmall);
    }

    function startVirtualLevels() {
        addSummoningProgess();

        window.virtualLevels = {
            // here `10000` represents `Infinity`, but `Infinity` is not valid JSON
            navLevelCap: 10000,
            pageLevelCap: 10000,
            // method to save data to local storage
            save: () => {
                window.localStorage['virtualLevels'] = window.JSON.stringify(window.virtualLevels)
            },
            // method to update all skill displays
            update: () => {
                for (let id in SKILLS) {
                    updateSkillVisuals(Number(id));
                }
            }
        }

        if (window.localStorage['virtualLevels'] !== undefined) {
            const stored = window.JSON.parse(window.localStorage['virtualLevels']);
            Object.getOwnPropertyNames(stored).forEach(x => {
                window.virtualLevels[x] = stored[x];
            });
        }

        window.virtualLevels.save();

        //////////////////////////////////
        //show exp to next level past 99//
        //////////////////////////////////
        eval(skillProgressDisplay.updateSkill.toString()
            .replaceAll(
                'this',
                'skillProgressDisplay',
            ).replace(
                'showVirtualLevels',
                'true',
            ).replace(
                'level<99',
                'true',
            ).replace(
                '`${level} / 99`',
                '`${Math.min(virtualLevels.pageLevelCap, level)} / 99`',
            ).replace(
                'nextLevelProgress[skillID]',
                '100 * (xp - exp.level_to_xp(level)) / (exp.level_to_xp(level + 1) - exp.level_to_xp(level))',
            ).replace(
                'updateSkill(skillID){',
                'skillProgressDisplay.updateSkill = (skillID) => {',
            )
        );
        eval(skillNav.updateNav.toString()
            .replaceAll(
                'this',
                'skillNav',
            ).replace(
                'showVirtualLevels?(exp.xp_to_level(xp)-1):level',
                'Math.min(virtualLevels.navLevelCap, exp.xp_to_level(xp)-1)',
            ).replace(
                'updateNav(skillID){',
                'skillNav.updateNav = (skillID) => {',
            )
        );
        // one-time update of all skill windows after a slight delay
        setTimeout(window.virtualLevels.update, 5000);

        ///////
        //log//
        ///////
        console.log("Melvor Virtual Levels Loaded");
    }

    function loadScript() {
        if (typeof confirmedLoaded !== typeof undefined && confirmedLoaded) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            startVirtualLevels();
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
});