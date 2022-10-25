const archiver = require('archiver');
const copydir = require('copy-dir');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// clean up old files
const buildFile = './build/setup.mjs';
const testFile = './packed/setup.cleaned.js';
fs.unlink(buildFile, () => {
});
fs.unlink(testFile, () => {
});

// dirs
const {config, version} = require('./package.json');
copydir.sync(`./${config.tinyMod}/styles`, './build/styles');
copydir.sync('./icons', './build/icons');

const {namespace} = require("./manifest.json");
// copy manifest.json
const manifest = JSON.parse(fs.readFileSync('./manifest.json').toString());
manifest.version = version
fs.writeFileSync('./build/manifest.json', JSON.stringify(manifest, null, 4));

// clean the packed file
const lineReader = readline.createInterface({
    input: fs.createReadStream('./packed/setup.mjs')
});
(async () => {
    let writeLines = true;
    let writeLinesTest = false;
    await lineReader.on('line', function (line) {
        if (line.includes('CONCATENATED MODULE')) {
            if (!line.includes('Game-Files')) {
                writeLines = true;
                writeLinesTest = true;
            } else {
                writeLines = false;
                writeLinesTest = false;
            }
        }
        line = line.replace('external_Game_Files_namespaceObject.', '');
        if (writeLines) {
            fs.appendFileSync(buildFile, line + '\n', () => {
            });
        }
        if (writeLinesTest && !line.includes('webpack_exports')) {
            const cleanedLine = line.replace(/^function ([a-zA-Z]+)/, '$1 = function')
                .replace(/^class ([a-zA-Z]+)/, '$1 = class');
            fs.appendFileSync(testFile, cleanedLine + '\n', () => {
            });
        }
    });
})();

function createZip () {
    // create zip for distribution
    const zipName = path.join(__dirname, 'dist', `${namespace}-v${version}.zip`);
    console.log(zipName)
    fs.mkdirSync(path.dirname(zipName), {recursive: true});

    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip');
    archive.pipe(output);

    archive.directory('build', '');

    if (require.main === module) {
        archive.finalize();
    }
    exports.zipName = zipName;
    exports.archive = archive;
}

lineReader.on('close', () => {
    createZip();
    // add test command to the test file
    fs.appendFileSync(testFile, '\n' + fs.readFileSync('./testCommand.js').toString() + '\n');
    // add css to the test file
    fs.appendFileSync(testFile,  '(function(){let style = `<style>\n');
    const dir = fs.opendirSync('./build/styles')
    let cssFile;
    while ((cssFile = dir.readSync()) !== null) {
        fs.appendFileSync(testFile, '\n' + fs.readFileSync(path.join(dir.path, cssFile.name)).toString() + '\n');
    }
    dir.closeSync()
    fs.appendFileSync(testFile, '\n</style>`;\ndocument.head.insertAdjacentHTML(\'beforeend\', style);})();');
    // log version
    console.log(version);
});