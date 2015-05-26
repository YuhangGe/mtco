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
  case 's':
  case 'server':
    mtco.server();
    break;
  case 'create':
  case 'edit':
  case 'c':
    mtco.create(cmd);
    break;
  default:
    if (!cmd) {
      mtco.generate();
    } else if (/^(?:(?:http)|(?:git@)).+?\.git$/.test(cmd)) {
      mtco.clone(cmd);
    } else {
      mtco.create(cmd);
    }
    break;
}
