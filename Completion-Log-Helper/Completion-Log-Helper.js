// ==UserScript==
// @name         Melvor Completion Log Helper
// @namespace    http://tampermonkey.net/
// @version      0.6.1
// @description  Replaces question mark icon in the Item Completion Log, Mastery Progression, Pet Completion and Monster Completion Log with greyed out images of items/pets/monsters that you have yet to get/kill and adds links to the wiki. Also includes toggle for highlighting items in bank.
// @author       Breindahl#2660
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// @grant        none
// ==/UserScript==
/* jshint esversion: 6 */

// Big thanks to Visua#9999 for helping with parts of the code and troubleshooting

(function () {
    function injectScript(main) {
        var script = document.createElement('script');
        script.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
        document.body.appendChild(script).parentNode.removeChild(script);
    }

    function script() {
        // Loading script

        // item log
        $('#modal-item-log').find('.block-options').prepend('<button id="toggleItems" class="btn btn-sm btn-success" style="margin:0px 10px; float:left;">Toggle Found</button>');
        $('#modal-item-log').find('.block-options').prepend('<img class="skill-icon-xs m-1 BankBordersOn pointer-enabled" id="toggleBankBorders" style="opacity:50%" src="assets/media/main/bank_header.svg">');
        $(document).ready(function () {
            $("#toggleItems").click(function () {
                $(".item-found").toggle();
            });
            $("#toggleBankBorders").click(function () {
                if ($("#toggleBankBorders").hasClass("BankBordersOff")) {
                    $("#toggleBankBorders").removeClass("BankBordersOff").addClass("BankBordersOn").css('opacity', '100%');
                    document.getElementsByClassName('item-in-bank').forEach(x => x.style.border = '1px gold dotted');
                } else {
                    $("#toggleBankBorders").removeClass("BankBordersOn").addClass("BankBordersOff").css('opacity', '50%');
                    document.getElementsByClassName('item-in-bank').forEach(x => x.style.border = '');
                }
            });
        });

        $('#modal-item-log').find('.block-options').prepend('<div class="input-group" style="float:left;width:auto"><input type="text" class="form-control text-danger btn btn-sm" id="searchTextboxItemLog" style="height:auto; text-align:left;" name="searchTextboxItemLog" placeholder="Search Item Log..." autocomplete="off"><div class="input-group-append"><button type="button" class="btn btn-danger btn-sm" id="clearItemLog">X</button></div></div>');

        const itemIds = items.map((_, id) => id);

        function updateItemLogSearch(search) {
            if (search === '') {
                $('#itemlog-container img').removeClass('d-none');
                return;
            }
            search = search.toLowerCase();
            const itemsResults = itemIds.filter(id => items[id].name.toLowerCase().includes(search) || items[id].category.toLowerCase().includes(search) || items[id].type.toLowerCase().includes(search) || id === Number(search));
            $('#itemlog-container img').addClass('d-none');
            for (let i = 0; i < itemsResults.length; i++) {
                document.getElementById('item-log-img-' + itemsResults[i]).classList.remove('d-none');
            }
        }

        function clearItemLogSearch() {
            $('#searchTextboxItemLog').val('');
            updateItemLogSearch($('#searchTextboxItemLog').val());
        }

        $("#clearItemLog").click(function () {
            clearItemLogSearch();
        });

        $(document).ready(function () {
            $("#searchTextboxItemLog").on("keyup", function () {
                updateItemLogSearch($(this).val());
            });
        });

        eval(
            openItemLog.toString()
                .replace(
                    'function openItemLog',
                    'openItemLog = function',
                ).replace(
                '$("#itemlog-container").html("");',
                '$("#itemlog-container").html("");$("#toggleBankBorders").removeClass("BankBordersOn").addClass("BankBordersOff").css(\'opacity\', \'50%\');clearItemLogSearch();',
            ).replace(
                '" id="item-log-img-',
                ' item-found" id="item-log-img-',
            ).replace(
                '{if(!items[i].ignoreCompletion){$("#itemlog-container").append(\'<img class="skill-icon-sm" id="item-log-img-\'+i+\'" src="\'+CDNDIR+\'assets/media/main/question.svg">\');itemTooltip="<div class=\'text-center\'>???</div>";}}',
                '{ignoreCompletion = "";if (items[i].ignoreCompletion) {ignoreCompletion = "<br><span class=\'text-danger\'>Item does not count towards completion.</span>";}$("#itemlog-container").append(\'<a href="https://wiki.melvoridle.com/index.php?title=\' + items[i].name + \'" target="blank"><img class="skill-icon-sm" id="item-log-img-\' + i + \'" style="opacity:0.3;filter: grayscale(30%);" src="\' + getItemMedia(i) + \'"></a>\');itemTooltip = "<div class=\'text-center\'>" + items[i].name + ignoreCompletion + "</div>";}let haveInBank = getBankId(i);if (haveInBank !== -1) {$(\'#item-log-img-\' + i).addClass("item-in-bank");}',
            )
        );

        // monster log
        $('#modal-monster-log').find('.block-options').prepend('<button id="toggleMonsters" class="btn btn-sm btn-success">Toggle Found</button>');
        $(document).ready(function () {
            $("#toggleMonsters").click(function () {
                $(".monster-found").toggle();
            });
        });

        eval(
            openMonsterLog.toString()
                .replace(
                    'function openMonsterLog',
                    'openMonsterLog = function',
                ).replace(
                'if(monsterStats[i].stats[2]>0&&!MONSTERS[i].ignoreCompletion)',
                'const ignoreCompletion = MONSTERS[i].ignoreCompletion ? "<br><span class=\'text-danger\'>Monster does not count towards completion.</span>" : ""; if (monsterStats[i].stats[2] > 0)',
            ).replace(
                '" id="monster-log-img',
                ' monster-found" id="monster-log-img',
            ).replace(
                'if(!MONSTERS[i].ignoreCompletion){$("#monsterlog-container").append(\'<img class="skill-icon-md js-tooltip-enable" src="\'+CDNDIR+\'assets/media/main/question.svg" data-toggle="tooltip" data-html="true" data-placement="bottom" title="" data-original-title="???">\');monsterTooltip="<div class=\'text-center\'>???</div>";}',
                '{$(\'#monsterlog-container\').append(\'<a href="https://wiki.melvoridle.com/index.php?title=\' + MONSTERS[i].name + \'" target="blank"><img class="skill-icon-md" id="monster-log-img-\' + i + \'" style="opacity:0.3;filter: grayscale(30%);" src="\' + MONSTERS[i].media + \'"></a>\');monsterTooltip = "<div class=\'text-center\'>" + MONSTERS[i].name + ignoreCompletion + "</div>";}',
            )
        );

        // pet log
        $('#modal-pet-log').find('.block-options').prepend('<button id="togglePets" class="btn btn-sm btn-success">Toggle Found</button>');
        $(document).ready(function () {
            $("#togglePets").click(function () {
                $(".pet-found").toggle();
            });
        });

        eval(
            openPetLog.toString()
                .replace(
                    'function openPetLog',
                    'openPetLog = function',
                ).replace(
                '" id="pet-log-img-',
                ' pet-found" id="pet-log-img-',
            ).replace(
                'if(!PETS[i].ignoreCompletion){$("#petlog-container").append(\'<img class="skill-icon-md" id="pet-log-img-\'+i+\'" src="\'+CDNDIR+\'assets/media/main/question.svg">\');tooltip="<div class=\\"text-center\\">???<br><small class=\'text-danger\'>Hint: "+PETS[i].acquiredBy+"</small></div>";}',
                '{$(\'#petlog-container\').append(\'<a href="https://wiki.melvoridle.com/index.php?title=\' + PETS[i].name + \'" target="blank"><img class="skill-icon-md" id="pet-log-img-\' + i + \'" style="opacity:0.3;filter: grayscale(50%);" src="\' + PETS[i].media + \'"></a>\');tooltip = \'<div class="text-center">\' + PETS[i].name + \'<br><small class="text-danger">Hint: \' + PETS[i].acquiredBy + \'</small></div>\';}',
            )
        );

        // logging
        console.log('Melvor Completion Log Helper Loaded');
    }

    function loadScript() {
        if (confirmedLoaded) {
            clearInterval(scriptLoader);
            injectScript(script);
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
})();
