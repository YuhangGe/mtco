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
  $.log('Scanning year categories...')
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
  $.log('Got years:', year_list.join(', '));
  var r = Q();
  year_list.forEach(function(year) {
    r = r.then(function() {
      return g_each_year(year.toString());
    });
  });

  return r;
}

function g_each_year(year) {

  var disk_posts = {};
  $.log('\nScanning disk articles of year:', year);
  $.readdir(path.join(cur_dir, year), false).forEach(function(dir) {
    var cd = dir.substring(dir.length - 5);
    if (!/^\/\d{4}$/.test(cd)) {
      return;
    }
    var month = parseInt(cd.substring(1, 3));
    var day = parseInt(cd.substring(3));

    $.readdir(path.join(cur_dir, year, cd), 'md', false).forEach(function(file) {
      var bn = path.basename(file);
      var name = bn.substring(0, bn.lastIndexOf('.'));
      var m = disk_posts[month];
      if (!m) {
        disk_posts[month] = m = {};
      }
      var d = m[day];
      if (!d) {
        m[day] = d = [];
      }
      d.push({
        month: month,
        day: day,
        name: name,
        stat: $.stat(file)
      });
    });
  });

  $.log('Got months:', _.map(disk_posts, function(list, month) {
    return month
  }).join(', '), '\n');

  return _.map(disk_posts, function(posts, month) {
    var defer = Q.defer();
    db.get_posts(year, month).then(function(db_posts) {
      defer.resolve({
        db_posts: db_posts,
        disk_posts: posts,
        year: year,
        month: month
      });
    }, defer.reject);
    return defer.promise;
  }).reduce(function(sequence, m_promise) {
    return sequence.then(function() {
      return m_promise;
    }).then(function(data) {
      if (!data) {
        return;
      }
      deal_data(data);
    });
  }, Q.resolve());
}

function deal_data(data) {
  var db_posts = data.db_posts;
  var disk_posts = data.disk_posts;
  var not_modified_count = 0;

  $.log('Generate articles of month:', data.year + '/' + data.month);
  db_posts.forEach(function(db_post) {
    var day = db_post.day;
    var disk_post = null;
    if (disk_posts[day]) {
      disk_post = _.find(disk_posts[day], 'name', db_post.name);
    }
    if (disk_post) {
      disk_post.__covered = true;
      if (disk_post.stat.mtime.getTime() > db_post.modified_time) {
        $.log('Generate modified article:', db_post.name);

      } else {
        not_modified_count++;
      }
    } else {
      /*
       * 数据库中的文章在磁盘上没有对应的文件。
       */
      $.log('WARNING: Article:', db_post.name + '.md', 'missed on disk.');
    }
  });

  disk_posts.forEach(function(disk_post) {
    if (disk_post.__covered = true) {
      return;
    }
    $.out('Generating created article:', disk_post.name, '...');

    $.out('Done!');
  });

  if (not_modified_count) {
    $.log('Skip other', not_modified_count, 'articles not modified.');
  }

}