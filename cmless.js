#!/usr/bin/env node

const cmless = require('cosmiconfig').cosmiconfigSync('cmless').search();
const server = require('child_process').spawn('node_modules/vite/bin/vite.js', [
  '--config',
  cmless.filepath || 'node_modules/cmless/vite.config.js',
  ...process.argv.slice(2),
]);

server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);
