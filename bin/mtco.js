#!/usr/bin/env node
var argv = require('yargs')
  .usage('')
  .argv;
var mtco = require('../index.js');

var cmd = argv._[0];

switch (cmd) {
  case 'g':
  case 'generate':
    mtco.generate();
    break;
  case 'create':
  case 'new':
  case 'c':
    mtco.create(argv._[1]);
    break;
  case 'server':
  case 's':
    break;
  default:
    mtco.clone(cmd);
    break;
}
