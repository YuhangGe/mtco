var Q = require('Q');
var $ = require('./util.js');
var path = require('path');
var ARTICLE_DIRNAME = require('./config.js').ARTICLE_DIRNAME;
var _ = require('lodash');
var cur_dir;

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

  _.map(year_list, function(year) {
    return g_each_year(year);
  }).reduce(function (soFar, f) {
    return soFar.then(f);
  }, Q(true));
}

function g_each_year(year) {

  var disk_posts = new Array(12);

  $.readdir(path.join(cur_dir, year), false).forEach(function(cd) {
    if (!/^\d{4}$/.test(cd)) {
      return;
    }
    var month = parseInt(cd.substring(0, 2)) - 1;
    var day = parseInt(cd.substring(2)) - 1;

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

  var defer = Q.defer();
  var i = 0;
  disk_posts.forEach(function(posts, month) {
    if (!posts) {
      i++;
      if (i === disk_posts.length) {
        defer.resolve();
      }
      return;
    }
    $.log(year, '/' + month);
    db.getPosts(year, month + 1).then(function(posts) {


    }).catch(defer.reject);
  });

  return defer.promise;
}