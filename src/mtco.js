var exec = require('child_process').exec;
var path = require('path');
var Q = require('q');
var $ = require('./util.js');
var git = require('./git.js');
var db = require('./db.js');
var creator = require('./create.js');
var generator = require('./generate.js');
var Config = require('./config.js');
var server = require('./server.js');

var cur_dir = path.resolve(process.cwd());

function init(repo) {
  var defer = Q.defer();
  cur_dir = path.join(cur_dir, git.dirname(repo));
  if ($.exists(cur_dir) && $.exists(path.join(cur_dir, Config.GIT_DIRNAME))) {
    $.log('repo ' + repo + ' exists at:', cur_dir);
    defer.resolve();
  } else {
    if (!$.exists(cur_dir)) {
      $.mkdir(cur_dir);
    }
    git.clone(repo + ' --branch gh-pages', cur_dir, defer.resolve);
  }
  return defer.promise;
}
function check_template() {
  var defer = Q.defer();
  var mtco_dir = path.join(cur_dir, Config.MTCO_DIRNAME);
  if (!$.exists(mtco_dir)) {
    $.mkdir(mtco_dir);
    git.clone('https://github.com/YuhangGe/mtco.git --branch template --single-branch', mtco_dir, function() {
      exec('rm -rf ' + path.join(mtco_dir, Config.GIT_DIRNAME), function(error) {
        if (error) {
          defer.reject(error);
        } else {
          defer.resolve();
        }
      });
    });
  } else {
    $.log('mtco directory exists at:', mtco_dir);
    defer.resolve();
  }
  return defer.promise;
}

function get_ready() {
  var mtco_dir = path.join(cur_dir, Config.MTCO_DIRNAME);
  var git_dir = path.join(cur_dir, Config.GIT_DIRNAME);
  if (!$.exists(git_dir) || !$.exists(mtco_dir)) {
    $.err('It\'s not a mtco dirctory');
  }
  return db.open(path.join(mtco_dir, Config.DB_NAME));
}

function generate() {
  get_ready().then(function() {
    return generator.run(path.join(cur_dir, Config.MTCO_DIRNAME), cur_dir);
  }).then(function() {
    $.log('Generate Pages Finish!');
    db.close();
  }).catch($.err);
}

function create(post_name) {
  get_ready().then(function() {
    return creator.create(path.join(cur_dir, Config.MTCO_DIRNAME), post_name);
  }).then(function(file_name) {
    db.close();
  }).catch($.err);
}

function check_db() {
  cur_dir = path.join(cur_dir, Config.MTCO_DIRNAME);
  return db.open(path.join(cur_dir, Config.DB_NAME));
}

function clone(repo) {
  init(repo).then(check_template).then(check_db).then(function() {
    $.log('Everything is ready. Enjoying writing.');
    db.close();
  }).catch($.err);
}

function serve() {
  server();
}

module.exports = {
  clone: clone,
  create: create,
  generate: generate,
  server: serve
};
