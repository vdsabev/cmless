#!/usr/bin/env node

const path = require('path');

const cmless = require('cosmiconfig').cosmiconfigSync('cmless').search();
const server = require('child_process').spawn(
  path.join(require.resolve('vite'), '..', 'bin', 'vite.js'),
  [
    '--config',
    cmless.filepath || 'node_modules/cmless/cmless.config.js',
    ...process.argv.slice(2),
  ],
);

server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);
