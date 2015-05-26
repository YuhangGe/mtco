var Markdown = require('marked');
var Mustache = require('mustache');
var $ = require('./util.js');
var config = require('./config.js');
var path = require('path');
var _ = require('lodash');
var cur_dir = path.resolve(process.cwd());
var template = $.read(path.join(cur_dir, config.MTCO_DIRNAME, config.THEME_DIRNAME, 'template.html')).toString();

var tag_regex = /@tag\s+([^\n]+)/;
var category_regex = /@category\s+([^\n]+)/;
module.exports = {
  parse: parse,
  render: render
};

function parse(post) {
  var cnt = $.read(post._path);
  var m;
  var idx = -1;
  m = cnt.match(tag_regex);
  if (m) {
    post.tags = _.uniq(m[1].trim().split(/\,|，/));
    idx = Math.max(idx, m.index + m[0].length);
  }
  m = cnt.match(category_regex);
  if (m && $.isDefined(config.CATEGORIES[m[1]])) {
    post.category = config.CATEGORIES[m[1]];
    idx = Math.max(idx, m.index + m[0].length);
  }
  cnt = cnt.substring(idx);
  post.content = Markdown.parse(cnt);
}

function render(post) {
  var data = {
    theme_dir: config.SITE_URL + '/' + config.MTCO_DIRNAME + '/' + config.THEME_DIRNAME,
    site_url: config.SITE_URL,
    author: '小葛',
    is_single: true,
    time: post.year + '年' + post.month + '月' + post.day + '日',
    nav: false, //todo
    articles: [g_article(post)]
  };
  return Mustache.render(template, data);
}

function g_article(post) {
  return {
    title: post.title,
    content: post.content,
    link: config.SITE_URL + '/' + post.year + post._md + '/' + encodeURIComponent(post.title) + '.html',
    tags: post.tags.length > 0 ? {
      list :  _.map(post.tags, function(tag) {
        return {
          link: config.SITE_URL + '/tag/' + encodeURIComponent(tag),
          name: tag
        }
      })
    } : false,
    category: {
      link: config.SITE_URL + '/category/' + post.category,
      name: _.findKey(config.CATEGORIES, post.category)
    }
  }
}