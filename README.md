png-sprite
==========
[![npm](https://img.shields.io/npm/v/png-sprite.svg?style=flat-square)](https://www.npmjs.com/package/png-sprite)
[![dependencies](https://img.shields.io/david/Coveo/png-sprite.svg?style=flat-square)](https://david-dm.org/Coveo/png-sprite)
[![Code Climate](https://img.shields.io/codeclimate/github/Coveo/png-sprite.svg?style=flat-square)](https://codeclimate.com/github/Coveo/png-sprite)
[![license](http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/Coveo/png-sprite/blob/master/LICENSE)

png-sprite is a gulp module that creates sprite sheets from multiple images

```js
var gulp = require('gulp');
var pngSprite = require('png-sprite');

gulp.task('buildSprites', function (done) {
  return gulp.src('img/**/*.png')
      .pipe(pngSprite.gulp({
        cssPath: 'sprites.scss',
        pngPath: 'sprites.png',
        namespace: 'sprites'
      }))
      .pipe(gulp.dest('./target/'))
});
```
```js
var fs = require('fs');
var Sprite = require('png-sprite').Sprite;
var sprite = new Sprite();
sprite.addImageSrc([
  "./img/a.png",
  "./img/b.png",
  "./img/c.png",
  "./img/d.png"
], function(){
  var obj = sprite.compile('./sprite.png');
  obj.png.pipe(fs.createWriteStream('sprite.png'));
  fs.writeFile('sprite.css', obj.css);
});
```
