var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var sqlite = require('../lib/q-sqlite3').verbose();
var _ = require('lodash');
var Q = require('q');

var db;
var cur_dir = path.resolve(process.cwd());
var MTCO_DIRNAME = 'mtco';  // '.mtco'

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
  if (!$exists(MTCO_DIRNAME)) {
    $mkdir(MTCO_DIRNAME);
    git_clone('https://github.com/YuhangGe/mtco.git --branch template --single-branch', path.join(cur_dir, MTCO_DIRNAME), function() {
      exec('rm -rf ' + path.join(cur_dir, MTCO_DIRNAME, '.git'), function(error) {
        if (error) {
          err(error);
        }
        check_mtco();
      });
    });
  } else {
    check_mtco();
  }
}

var tables = ['post', 'tag', 'category', 'post_tag', 'post_category'];
var columns = [{
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  name: 'TEXT NOT NULL',
  title: 'TEXT',
  year: 'INTEGER NOT NULL',
  month: 'INTEGER NOT NULL',
  day: 'INTEGER NOT NULL',
  created_time: 'NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP',
  modified_time: 'NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP'
}, {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  name: 'TEXT NOT NULL'
}, {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  name: 'TEXT NOT NULL'
}, {
  post_id: 'INTEGER NOT NULL',
  tag_id: 'INTEGER NOT NULL'
}, {
  post_id: 'INTEGER NOT NULL',
  category_id: 'INTEGER NOT NULL'
}];
var indexes = [[{
  search_index: 'year, month, day, name' //由于需要用文件名来查找id，故建立索引。
}], false, false, [{
  post_tag_index: 'post_id, tag_id'
}], [{
  post_category_index: 'post_id, category_id'
}]];

function check_mtco() {
  cur_dir = path.join(cur_dir, MTCO_DIRNAME);
  sqlite.createDatabase(path.join(cur_dir, 'db/main.sqlite')).then(function(database) {
    db = database;
    db.on('trace', function(sql) {
      log('SQL:', sql);
    });
    Q.all(_.map(tables, function(table_name, idx) {
      return create_table_if_not_exists(idx);
    })).then(function() {
      log('database ready.');
      db.close();
    }, err);
  }, err);
}

function create_table_if_not_exists(i) {
  var defer = Q.defer();
  db.get('SELECT name FROM sqlite_master WHERE type="table" AND name= ? ', tables[i])
    .then(function(row) {
      if (row) {
        defer.resolve(row);
        return
      }
      var table_name = tables[i];
      db.run('CREATE TABLE ' + table_name + ' (' + _.map(columns[i], function(c, k) {
        return k + ' ' + c;
      }).join(',') +')').then(function() {
        if (indexes[i]) {
          Q.all(_.map(indexes[i], function(each_indexes) {
            return Q.all(_.map(each_indexes, function(n, c) {
              return db.run('CREATE INDEX ' + c + ' ON ' + table_name + ' (' + n + ')');
            }));
          })).then(defer.resolve, defer.reject);
        } else {
          defer.resolve();
        }
      }, defer.reject);
  }, defer.reject);
  return defer.promise;
}
function check_gitignore() {

}

function serve() {

}
function pull() {

}
function push() {

}

function generate() {

}

function create() {

}

module.exports.init = init;
module.exports.serve = serve;
module.exports.pull = pull;
module.exports.push = push;