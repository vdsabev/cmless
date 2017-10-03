const path = require('path');

const compote = require('./index.js');
const packageJson = require(path.join(process.cwd(), 'package.json'));

module.exports = compote.config(packageJson.compote.build, packageJson.dependencies);
