var fs = require('fs');
var path = require('path');
var _ = require('lodash');

function err() {
  console.error.apply(console, arguments);
  console.trace();
  debugger;
  process.exit(-1);
}

function log() {
  console.log.apply(console, arguments);
}

function debug() {
  console.log.apply(console, arguments);
}

function out(msg) {
  process.stdout.write(msg);
}

/*
 * 当ext === 'false' 时，代表读取文件夹下的所有子文件夹。
 * 否则，代表读取所有以ext为后缀名的文件。
 */
function readdir(dir_path, ext, deep) {

  function walk(dir) {
    var list = [];
    fs.readdirSync(dir).forEach(function(file) {
      var fullpath = path.join(dir, file);
      var stat = fs.statSync(fullpath);
      if (ext === false && stat.isDirectory()) {
        list.push(fullpath);
      } else if (ext && stat.isFile() && new RegExp('\\.' + ext + '$').test(file)) {
        list.push(fullpath);
      } else if(ext && stat.isDirectory() && deep) {
        list.push(walk(fullpath))
      }
    });
    return list;
  }

  return walk(dir_path);
}

function exists(filename) {
  return fs.existsSync(filename);
}
module.exports = {
  isDefined: function(obj) {
    //lodash没有 isDefined 你会信？！
    return !_.isUndefined(obj);
  },
  log: log,
  err: err,
  debug: debug,
  out: out,
  exists: exists,
  stat: function(path) {
    return fs.statSync(path);
  },
  mkdir: function(dir) {
    var ps = dir[0] === '/' ? '/' : '';
    dir.split(/\/|\\/).forEach(function(p) {
      p = p.trim();
      if (p && !exists(ps = path.join(ps, p))) {
        fs.mkdirSync(ps);
      }
    });
  },
  readdir: readdir,
  read: function(filename) {
    return fs.readFileSync(filename).toString();
  },
  write: function(filename, content) {
    fs.writeFileSync(filename, content);
  }
};