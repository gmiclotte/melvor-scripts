
/////////////////////
//Show Fish Cooking//
/////////////////////
// make cookable array and sort it based on cooking milestone index
const cookable = items.filter(x => x.cookingID !== undefined);
cookable.forEach((x, i) => {
    for (let j = 0; j < MILESTONES.Cooking.length; j++) {
        const ms = MILESTONES.Cooking[j];
        if (ms.name === x.name) {
            cookable[i].msId = j;
            return;
        }
    }
});
cookable.sort((a, b) => a.msId - b.msId);
// set to true to show raw foods with 0 amount banked
window.showAllRaws = true;
// override updateAvailableFood
updateAvailableFood = () => {
    $("#cooking-food-dropdown").html("");
    let selectedFoodExists = 0;
    cookable.forEach(raw => {
        let onClick = 'void(0)';
        let required = `<div className="font-size-sm"><small>Level ${raw.cookingLevel} Required</small></div>`
        if (skillLevel[3] >= raw.cookingLevel) {
            onClick = `selectFood(${raw.id})`;
            required = '';
        }
        const bankId = getBankId(raw.id);
        const qty = bankId === -1 ? 0 : bank[bankId].qty;
        if (!showAllRaws && qty === 0) {
            return;
        }
        $("#cooking-food-dropdown").append(''
            + `<a class="dropdown-item pointer-enabled" id="skill-cooking-food-${raw.msId}" onClick="${onClick}">`
            + '  <div class="media d-flex align-items-center push mb-0">'
            // img
            + '    <div class="mr-2">'
            + '      <img class="skill-icon-sm" src="' + raw.media + '">'
            + '    </div>'
            + '    <div class="media-body">'
            // name
            + '      <div class="font-w600 font-size-sm">'
            + raw.name
            + '      </div>'
            // required level
            + required
            // qty
            + '      <div class="font-w600 font-size-sm">'
            + '        <span class="badge badge-pill badge-primary">'
            + formatNumber(qty)
            + '        </span>'
            + '      </div>'
            // xp and healing
            + '      <div class="font-size-sm text-info">'
            + '        <small>'
            + `${raw.cookingXP} XP`
            + '        </small>'
            + '        <small class="text-success ml-2">'
            + '          <img class="skill-icon-xxs mr-1" src="https://melvorcdn.fra1.cdn.digitaloceanspaces.com/current/assets/media/skills/combat/hitpoints.svg">'
            + `${items[raw.cookedItemID].healsFor * numberMultiplier} HP`
            + '        </small>'
            + '      </div>'
            + '    </div>'
            + '  </div>'
            + '</a>'
        );
        if (selectedFood === raw.id) {
            $("#skill-cooking-food-selected-qty").text(formatNumber(qty));
            selectedFoodExists++;
        }
    });
    if (selectedFoodExists < 1) {
        $("#skill-cooking-food-selected-qty").text(0);
    }
}
