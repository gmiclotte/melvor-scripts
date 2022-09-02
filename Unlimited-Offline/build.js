const archiver = require('archiver');
const copydir = require('copy-dir');
const fs = require('fs');
const path = require('path');

copydir.sync('icons', 'dist/icons');
fs.copyFileSync('setup.js', 'dist/setup.js');
fs.copyFileSync('manifest.json', 'dist/manifest.json');

const { namespace, version } = require('./manifest.json');

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
