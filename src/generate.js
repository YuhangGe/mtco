var Q = require('Q');
var $ = require('./util.js');
var path = require('path');
var ARTICLE_DIRNAME = require('./config.js').ARTICLE_DIRNAME;
var _ = require('lodash');
var cur_dir;
var db = require('./db.js');

module.exports = {
  run: generate
};

function generate(dir) {
  cur_dir = path.join(dir, ARTICLE_DIRNAME);
  var year_list = _.map($.readdir(cur_dir, false), function(ydir) {
    var bn = path.basename(ydir);
    if (/^\d{4}$/.test(bn)) { //注意，当年份超过4位数时，这里会有BUG。但我觉得这段代码不会那么长命。
      return parseInt(bn);
    } else {
      return -1;
    }
  }).filter(function(year) {
    return year > 0
  }).sort();

  var r = Q();
  year_list.forEach(function(year) {
    r = r.then(function() {
      return g_each_year(year.toString());
    });
  });

  return r;
}

function g_each_year(year) {

  var disk_posts = new Array(12);
  //$.log('read year', year);
  $.readdir(path.join(cur_dir, year), false).forEach(function(dir) {
    var cd = dir.substring(dir.length - 5);
    if (!/^\/\d{4}$/.test(cd)) {
      return;
    }
    var month = parseInt(cd.substring(1, 3)) - 1;
    var day = parseInt(cd.substring(3)) - 1;

    $.readdir(path.join(cur_dir, year, cd), 'md', false).forEach(function(file) {
      var bn = path.basename(file);
      var name = bn.substring(0, bn.lastIndexOf('.'));
      if (!disk_posts[month]) {
        disk_posts[month] = [];
      }
      if (!disk_posts[month][day]) {
        disk_posts[month][day] = [];
      }
      disk_posts[month][day].push({
        name: name,
        stat: $.stat(file)
      })
    });
  });

  return _.map(disk_posts, function(posts, month) {
    if (!posts) {
      return Q.resolve(null);
    }
    return db.get_posts(year, month + 1);
  }).reduce(function(sequence, m_promise) {
    return sequence.then(function() {
      return m_promise;
    }).then(function(db_posts) {
      if (db_posts) {
        $.log(db_posts);
      } else {
        $.log('skip');
      }
    });
  }, Q.resolve());

}