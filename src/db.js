var $ = require('./util.js');
var sqlite = require('../lib/q-sqlite3');
var Q = require('q');
var _ = require('lodash');

module.exports = {
  open: open,
  close: close,
  get_posts: get_posts,
  create_post: create_post,
  get_tag_posts: get_posts_by_tag,
  get_category_posts: get_posts_by_category
};

var db = null;

var tables = ['post', 'post_tag'];
var columns = [{
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  title: 'TEXT NOT NULL',
  category: 'INTEGER NOT NULL DEFAULT 0',
  year: 'INTEGER NOT NULL',
  month: 'INTEGER NOT NULL',
  day: 'INTEGER NOT NULL',
  modified_time: 'NUMERIC NOT NULL DEFAULT CURRENT_TIMESTAMP'
}, {
  post_id: 'INTEGER NOT NULL',
  tag: 'TEXT NOT NULL'
}];
var indexes = [[{
  search_index: 'year, month',
  category_index: 'category'
}], [{
  tag_index: 'post_id, tag'
}]];

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

function open(db_path) {
  var defer = Q.defer();
  if (db !== null) {
    Q().then(function() {
      defer.resolve(db);
    });
  } else {
    sqlite.createDatabase(db_path).then(function(database) {
      db = database;
      db.on('trace', function(sql) {
        $.debug('SQL:', sql);
      });
      Q.all(_.map(tables, function(table_name, idx) {
        return create_table_if_not_exists(idx);
      })).then(function() {
        $.debug('DB:', 'ready');
        defer.resolve(db);
      }, defer.reject);
    }, defer.reject);
  }
  return defer.promise;
}

function close() {
  if (!db) {
    return;
  }
  db.close();
}

function get_posts(year, month) {
  return db.all("SELECT * FROM post WHERE year = ? AND month = ?", [parseInt(year), parseInt(month)]);
}
function get_posts_by_tag(tag) {
  return db.all("SELECT post.* FROM post, post_tag WHERE post.id = post_tag.post_id AND post_tag.tag = ?", tag);
}
function get_posts_by_category(category) {
  return db.all("SELECT * FROM post WHERE category = ?", category);
}

function create_post(post) {
  var cols = [];
  var vals =_.map(post, function(v, k) {
    return {
      col: k,
      val: v
    }
  }).filter(function(cv) {
    return columns[0][cv.col]
  }).map(function(cv) {
    cols.push(cv.col);
    return cv.val;
  });
  return db.run('INSERT INTO post (' + cols.join(',') + ') VALUES('+ vals.join(',') +')');
}