// Get Localisation Key for a given string
getLocalisationKey = (text) => {
    const list = []
    for (const key in loadedLangJson) {
        for (const identifier in loadedLangJson[key]) {
            if (loadedLangJson[key][identifier] === text) {
                list.push({key: key, identifier: identifier});
            }
        }
    }
    return list;
}
