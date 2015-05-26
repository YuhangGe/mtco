var Q = require('Q');
var $ = require('./util.js');
var path = require('path');
var ARTICLE_DIRNAME = require('./config.js').ARTICLE_DIRNAME;
var _ = require('lodash');
var cur_dir = '';
var dest_dir = '';
var db = require('./db.js');
var Parser = require('./parse.js');

module.exports = {
  run: generate
};

function generate(dir, dst_dir) {
  dest_dir = dst_dir;
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

  if (year_list.length === 0) {
    $.log('Got nothing. You may create an article first.');
  } else {
    $.log('Got years:', year_list.join(', '));
  }
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
        year: year,
        month: month,
        day: day,
        title: name,
        category: 0,
        tags: [],
        content: '',
        _md: cd,
        _stat: $.stat(file),
        _path: file,
        _dst_path: path.join(dest_dir, year, cd)
      });
    });
  });

  $.log('Got months:', _.map(disk_posts, function(list, month) {
    return month
  }).join(', '));

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
      return deal_data(data);
    });
  }, Q.resolve());
}

function deal_data(data) {
  var db_posts = data.db_posts;
  var disk_posts = data.disk_posts;
  var not_modified_count = 0;
  var tags_modified = [];
  var categories_modified = [];

  $.log('\nGenerate articles of month:', data.year + '/' + data.month);

  var r = Q();
  _.each(db_posts, function(db_post) {
    var day = db_post.day;
    var disk_post = null;
    if (disk_posts[day]) {
      disk_post = _.find(disk_posts[day], 'name', db_post.title);
    }
    if (disk_post) {
      disk_post.__covered = true;
      if (disk_post.stat.mtime.getTime() > db_post.modified_time) {
        r = r.then(function() {
          $.out('  Modified:  ' + disk_post.name + '.md ... ');
          return db.update_post(disk_post).then(function() {

            $.out('Done: ' + disk_post.name + '.html\n');
          });
        })
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

  _.each(disk_posts, function(day_list) {
    day_list.forEach(function(disk_post) {
      if (disk_post.__covered) {
        return;
      }
      r = r.then(function() {
        $.out('  Created:  ' + disk_post.title + '.md ... ');
        Parser.parse(disk_post);
        if (!$.exists(disk_post._dst_path)) {
          $.mkdir(disk_post._dst_path);
        }
        $.write(path.join(disk_post._dst_path, disk_post.title + '.html'), Parser.render(disk_post));
        //return db.create_post(disk_post).then(function(val) {
          //$.log(val);
          //$.out('Done: ' + disk_post.name + '.html\n');
        //});
      });
    });

  });

  if (not_modified_count) {
    $.log('Skip other', not_modified_count, 'articles not modified.');
  }

  r = r.then(function() {

  });

  return r;
}