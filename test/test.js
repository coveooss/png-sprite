const fs = require('fs');

const Sprite = require("../index.js").Sprite;
const sprite = new Sprite();

sprite.addImageSrc([
  "./test/img/red.png",
  "./test/img/green.png",
  "./test/img/blue.png",
  "./test/img/yellow.png"
], function(){
  const obj = sprite.compile('./sprite.png');
  obj.png.pipe(fs.createWriteStream('sprite.png'));
  fs.writeFileSync('sprite.css', obj.css);
});
