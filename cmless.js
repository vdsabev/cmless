#!/usr/bin/env node

const { spawn } = require('child_process');
const server = spawn('node_modules/vite/bin/vite.js', process.argv.slice(2));

server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);
