var gutil = require('gulp-util');
var through = require('through2');
var fs = require('fs');

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
    console.log(path.resolve(opt.base, opt.cssPath), path.resolve(opt.base, opt.pngPath))
    var obj = sprite.compile(path.relative(path.dirname(path.resolve(opt.base, opt.cssPath)), path.resolve(opt.base, opt.pngPath)));
    var buffers = [];
    var stream = obj.png;
    stream.on('data', function (b) {
      buffers.push(b);
    });
    stream.on('end', function(){
      var pngFile = new gutil.File({
        cwd: "/",
        base: opt.base,
        path: path.resolve(opt.base, opt.pngPath),
        contents:Buffer.concat(buffers)
      });
      self.push(pngFile);
      done();
    })

    var cssFile = new gutil.File({
      cwd: "/",
      base: opt.base,
      path: path.resolve(opt.base, opt.cssPath),
      contents: new Buffer(obj.css)
    });
    this.push(cssFile);
  }

  return through.obj(bufferImages, endStream);
};
