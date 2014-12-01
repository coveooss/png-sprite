var gutil = require('gulp-util');
var through = require('through2');

var Sprite = require("./index.js").Sprite;

var path = require('path');
var PluginError = gutil.PluginError;


module.exports = function(opt) {
  opt = opt || {};
  opt.cssPath = opt.cssPath || './sprite.css';
  opt.pngPath = opt.pngPath || './sprite.png';

  var sprite = new Sprite(opt);

  function bufferImages(file, encoding, done) {
    if (file.isNull()) {
      return; // ignore
    }

    if (file.isStream()) {
      return this.emit('error', new PluginError('gulp-sprite',  'Streaming not supported'));
    }

    if(opt.base == null){
      opt.base = file.base;
    }

    sprite.addFile(file, done);
  }

  function endStream (done) {
    var self = this;
    var obj = sprite.compile();
    var cssFile = new gutil.File({
      cwd: "/",
      base: opt.base,
      path: path.resolve(opt.base, opt.cssPath),
      contents: obj.css
    });
    var cssFile = new gutil.File({
      cwd: "/",
      base: opt.base,
      path: path.resolve(opt.base, opt.pngPath),
      contents: obj.png
    });
    this.push(cssFile);
    done();
  }

  return through.obj(bufferImages, endStream);
};