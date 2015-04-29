#!/usr/bin/env node
var argv = require('yargs')
  .usage('')
  .argv;
var mtco = require('../index.js');

if (argv._.length > 0) {
  mtco.init({
    repo: argv._[0]
  });
} else {
  mtco.serve();
}

