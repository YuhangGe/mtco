var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var cur_dir = path.resolve(process.cwd());

function err(err) {
  console.error.apply(console, arguments);
  process.exit(-1);
}

function log() {
  console.log.apply(console, arguments);
}

function get_git_dir(repo) {
  var idx = repo.lastIndexOf('/');
  return repo.substring(idx + 1).replace(/\.git$/, '');
}

function git_clone(repo, dir, callback) {
  var cmd = 'git clone ' + repo + ' ' + dir;
  log(cmd);
  exec(cmd, function(error, stdout, stderr) {
    if (error) {
      err('git clone error: ', error);
    }
    log('clone finished.');
    callback();
  });
}
function init(params) {
  var repo = params.repo;
  cur_dir = path.join(cur_dir, get_git_dir(repo));
  if (fs.existsSync(cur_dir) && $exists('.git')) {
    log('repo ' + repo + ' exists at:', cur_dir);
    check();
  } else {
    if (!fs.existsSync(cur_dir)) {
      fs.mkdirSync(cur_dir);
    }
    git_clone(repo, cur_dir, check);
  }

}

function $exists(filename) {
  return fs.existsSync(path.join(cur_dir, filename));
}
function $mkdir(dirname) {
  var dir = path.join(cur_dir, dirname);
  fs.mkdirSync(dir);
  log('mkdir:', dir);
}
function $wfile(filename, content) {
  fs.writeFileSync(path.join(cur_dir, filename), content);
}
function check() {
  log('checking...');
  check_gitignore();
  if (!$exists('.mtco')) {
    $mkdir('.mtco');
    git_clone('https://github.com/YuhangGe/mtco.git --branch template --single-branch', cur_dir + '/.mtco', check_mtco);
  } else {
    check_mtco();
  }
}
function check_mtco() {
  cur_dir = path.join(cur_dir, '.mtco');

}
function check_gitignore() {

}

function serve() {

}
function pull() {

}
function push() {

}

module.exports.init = init;
module.exports.serve = serve;
module.exports.pull = pull;
module.exports.push = push;