const Buffer = require('buffer').Buffer;
const Vinyl = require('vinyl');
const path = require('path');
const through = require('through2');
const stream = require('stream');

const Sprite = require("./index.js").Sprite;

module.exports = function (opt) {
  opt = opt || {};
  opt.cssPath = opt.cssPath || './sprite.css';
  opt.pngPath = opt.pngPath || './sprite.png';

  const sprite = new Sprite(opt);

  function bufferImages(file, encoding, done) {
    if (file.isNull()) {
      return; // ignore
    }

    if (opt.base === undefined) {
      opt.base = file.base;
    }

    if (file.isStream()) {
      sprite.addFile(file, done);
    } else if (file.isBuffer()) {

      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.contents);

      bufferStream.base = file.base;
      bufferStream.path = file.path;

      sprite.addFile(bufferStream, done);
    }
  }

  function endStream(done) {
    const relativePath = opt.relPath || path.relative(path.dirname(opt.cssPath), opt.pngPath);
    const obj = sprite.compile(relativePath);
    this.push(new Vinyl({
      cwd: "/",
      base: opt.base,
      path: path.resolve(opt.base, opt.cssPath),
      contents: Buffer.from(obj.css)
    }));

    // through don't like the png stream
    // just concat the buffer ftw
    const buffers = [];
    obj.png.on('data', (chunk) => buffers.push(chunk));
    obj.png.on('end', () => {
      this.push(new Vinyl({
        cwd: "/",
        base: opt.base,
        path: path.resolve(opt.base, opt.pngPath),
        contents: Buffer.concat(buffers)
      }));
      done();
    });
  }

  return through.obj(bufferImages, endStream);
};
