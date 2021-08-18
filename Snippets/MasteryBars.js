
////////////////
//Mastery bars//
////////////////
setInterval(() => {
    for (const id in SKILLS) {
        if (SKILLS[id].hasMastery) {
            if ($(`#skill-nav-mastery-${id} .progress-bar`)[0]) {
                $(`#skill-nav-mastery-${id} .progress-bar`)[0].style.width =
                    (MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100 + '%';
                if (MASTERY[id].pool < getMasteryPoolTotalXP(id)) {
                    $(`#skill-nav-mastery-${id}`)[0].style.setProperty('background', 'rgb(76,80,84)', 'important');
                    $(`#skill-nav-mastery-${id} .progress-bar`)[0].className = 'progress-bar bg-warning';
                } else {
                    $(`#skill-nav-mastery-${id}`)[0].style.setProperty('background', 'rgb(48,199,141)', 'success');
                    $(`#skill-nav-mastery-${id} .progress-bar`)[0].className = 'progress-bar bg-success';
                }
                const tip = $(`#skill-nav-mastery-${id}`)[0]._tippy;
                tip.setContent((Math.min(1, MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100).toFixed(2) + '%');
            } else {
                const skillItem = $(`#skill-nav-name-${id}`)[0].parentNode;
                skillItem.style.flexWrap = 'wrap';
                skillItem.style.setProperty('padding-top', '.25rem', 'important');
                const progress = document.createElement('div');
                const progressBar = document.createElement('div');
                progress.id = `skill-nav-mastery-${id}`;
                progress.className = 'progress active pointer-enabled';
                progress.style.height = '6px';
                progress.style.width = '100%';
                progress.style.margin = '.25rem 0rem';
                if (MASTERY[id].pool < getMasteryPoolTotalXP(id)) {
                    progress.style.setProperty('background', 'rgb(76,80,84)', 'important');
                    progressBar.className = 'progress-bar bg-warning';
                } else {
                    progress.style.setProperty('background', 'rgb(48,199,141)', 'success');
                    progressBar.className = 'progress-bar bg-success';
                }
                progressBar.style.width = (MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100 + '%';
                progress.appendChild(progressBar);
                skillItem.appendChild(progress);
                tippy($(`#skill-nav-mastery-${id}`)[0], {
                    placement: 'right',
                    content: ((MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100).toFixed(2) + '%',
                });
            }
        }
    }
}, 5000);
