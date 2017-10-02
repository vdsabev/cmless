const path = require('path');

const compote = require(path.join(__dirname, '..', 'index.js'));
const config = require(path.join(process.cwd(), 'package.json')).compote;

module.exports = compote.config(config);
