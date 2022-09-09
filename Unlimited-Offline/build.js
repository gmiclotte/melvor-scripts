const archiver = require('archiver');
const copydir = require('copy-dir');
const fs = require('fs');
const path = require('path');

// dirs
copydir.sync('icons', 'dist/icons');
// js files
fs.copyFileSync('setup.js', 'dist/setup.js');
fs.copyFileSync('manifest.json', 'dist/manifest.json');

const { version } = require('./package.json');
// copy manifest.json
const manifest = JSON.parse(fs.readFileSync('manifest.json').toString());
manifest.version = version
fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 4));

const { namespace } = require('./manifest.json');
const zipName = path.join(__dirname, '.build', `${namespace}-v${version}.zip`);
console.log(zipName)
fs.mkdirSync(path.dirname(zipName), { recursive: true });

const output = fs.createWriteStream(zipName);
const archive = archiver('zip');
archive.pipe(output);

archive.directory('dist', '');

if (require.main === module) {
    archive.finalize();
}
exports.zipName = zipName;
exports.archive = archive;

console.log(version);
