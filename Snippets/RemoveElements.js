// remove various elements
// combat
document.getElementById('offline-combat-alert').remove();

// summoning marks
// green
document.getElementById('summoning-category-0').children[0].children[0].children[2].remove();
// orange and red
document.getElementById('summoning-category-0').children[0].children[0].children[1].remove();

// summoning tablets
document.getElementById('summoning-category-1').children[0].children[0].children[0].remove()

// alt. magic
document.getElementById('magic-container').children[0].children[1].remove();

// cloud saving
document.getElementById('header-cloud-save-time').remove();
document.getElementById('header-cloud-save-btn-connected').remove();
