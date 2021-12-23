// Get Localisation Key for a given string
for (const key in loadedLangJson) {
    for (const identifier in loadedLangJson[key]) {
        if (loadedLangJson[key][identifier] === 'Minigame') {
            snippet.log(key, identifier)
        }
    }
}