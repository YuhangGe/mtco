var Q = require('Q');
var $ = require('./util.js');
var path = require('path');
var ARTICLE_DIRNAME = require('./config.js').ARTICLE_DIRNAME;


module.exports = {
  create: create
};

function format(num) {
  return num < 10 ? '0' + num : num.toString()
}

function parse(post_name) {
  var names = post_name.split('/');
  var year, day, name;
  var today = new Date();

  if (names.length === 3) {
    year = names[0];
    day = names[1];
    name = names[2];
  } else if (names.length === 2) {
    year = today.getFullYear().toString();
    day = names[0];
    name = names[1];
  } else {
    year = today.getFullYear().toString();
    day = format(today.getMonth() + 1) + format(today.getDate());
    name = post_name
  }

  return {
    year: year,
    day: day,
    name: name
  };
}

function create(dir, post_name) {
  var cur_dir = path.join(dir, ARTICLE_DIRNAME);
  var posts = parse(post_name);

  var dir1 = path.join(cur_dir, posts.year);
  if (!$.exists(dir1)) {
    $.mkdir(dir1);
  }
  var dir2 = path.join(dir1, posts.day);
  if (!$.exists(dir2)) {
    $.mkdir(dir2);
  }

  var new_file = path.join(dir2, posts.name + '.md');
  if ($.exists(new_file)) {
    $.err('ERROR: Article with name "' + post_name + '" is exists at: ' + new_file);
  }

  $.write(new_file, "@title Title Here\r\n@tag hello, world\r\n\r\nHello, World.   \r\nThis is my pure article.");

  return Q.resolve(new_file);
}