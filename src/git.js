var $ = require('./util.js');
var _ = require('lodash');
var exec = require('child_process').exec;

function get_dir(repo) {
  var idx = repo.lastIndexOf('/');
  return repo.substring(idx + 1).replace(/\.git$/, '');
}

function clone(repo, dir_path, callback) {
  var cmd = 'git clone ' + repo + ' ' + dir_path;
  $.log(cmd);
  exec(cmd, function(error, stdout, stderr) {
    if (error) {
      $.err('git clone error: ', error);
    }
    callback();
  });
}

module.exports = {
  clone: clone,
  dirname: get_dir
};