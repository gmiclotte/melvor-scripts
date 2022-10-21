const archiver = require('archiver');
const copydir = require('copy-dir');
const fs = require('fs');
const path = require('path');

// dirs
copydir.sync('icons', 'build/icons');
// js files
fs.copyFileSync('setup.js', 'build/setup.js');
fs.copyFileSync('manifest.json', 'build/manifest.json');

const { version } = require('./package.json');
// copy manifest.json
const manifest = JSON.parse(fs.readFileSync('manifest.json').toString());
manifest.version = version
fs.writeFileSync('build/manifest.json', JSON.stringify(manifest, null, 4));

const { namespace } = require('./manifest.json');
const zipName = path.join(__dirname, 'dist', `${namespace}-v${version}.zip`);
console.log(zipName)
fs.mkdirSync(path.dirname(zipName), { recursive: true });

const output = fs.createWriteStream(zipName);
const archive = archiver('zip');
archive.pipe(output);

archive.directory('build', '');

if (require.main === module) {
    archive.finalize();
}
exports.zipName = zipName;
exports.archive = archive;

console.log(version);
