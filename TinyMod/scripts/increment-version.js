const inquirer = require('inquirer');

const {version} = require('./package.json');
const choices = [];
const fs = require("fs");
const preReleaseSplit = version.split('-');
const isPreRelease = preReleaseSplit[1] !== undefined;
const fullVersion = preReleaseSplit[0];
if (isPreRelease) {
    choices.push([fullVersion, Number(preReleaseSplit[1]) + 1].join('-'));
    choices.push(fullVersion);
}
const split = fullVersion.split('.').map(x => Number(x));
const majorVersion = `${split[0] + 1}.0.0`;
const minorVersion = `${split[0]}.${split[1] + 1}.0`;
const patchVersion = `${split[0]}.${split[1]}.${split[2] + 1}`;

inquirer.prompt([{
    type: 'list',
    name: 'version',
    message: `Current version: ${version}, select next version:`,
    choices: [
        ...choices,
        patchVersion + '-0',
        patchVersion,
        minorVersion + '-0',
        minorVersion,
        majorVersion + '-0',
        majorVersion,
    ],
}]).then(answers => {
    console.log(JSON.stringify(answers, null, '  '));
    const package = JSON.parse(fs.readFileSync('package.json').toString());
    package.version = answers.version
    fs.writeFileSync('package.json', JSON.stringify(package, null, 4));
});