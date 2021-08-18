
//////////////////
//mining swapper//
//////////////////
window.rockOrder = [];
setInterval(() => {
    if (currentRock === null) {
        return;
    }
    for (let i = 0; i < window.rockOrder.length; i++) {
        let rock = window.rockOrder[i];
        if (miningData[rock].level > skillLevel[CONSTANTS.skill.Mining]) {
            continue;
        }
        if (!rockData[rock].depleted) {
            if (currentRock === rock) {
                return;
            } else {
                console.log("start mining " + rock);
                mineRock(rock);
                return;
            }
        }
    }
}, 1000);
