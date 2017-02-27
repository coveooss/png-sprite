var PNG = require('node-pngjs').PNG,
    path = require('path'),
    ejs = require('ejs'),
    fs = require('fs');

var spriteOffset = 2;

function Sprite(opt) {
  this.opt = opt !== undefined ? opt : {};

  if (this.opt.globalTemplate === undefined) {
    this.opt.globalTemplate = '{' +
    'background-image:url(<%- JSON.stringify(relativePngPath) %>);' +
    'display:inline-block;' +
    'background-repeat:no-repeat;' +
    'overflow:hidden;' +
    'background-size: <%= width / ratio %>px <%= height / ratio %>px;' +
    '}';
  }

  if (this.opt.eachTemplate === undefined) {
    this.opt.eachTemplate = ('<%= "."+node.className %>{' +
    'background-position:<%= -node.x / ratio %>px <%= -node.y / ratio %>px;' +
    'width:<%= node.width / ratio %>px;' +
    'height:<%= node.height / ratio %>px;' +
    'text-indent:<%= node.width / ratio %>px;' +
    '}');
  }

  if (this.opt.className === undefined) {
    this.opt.className = '<%= namespace != null ? namespace + "-" : "" %>' +
    '<%= path.normalize(node.image.base != null ? path.relative(node.image.base, node.image.path) : node.image.path).replace(/\\.png$/,"").replace(/\\W+/g,"-") %>';
  }

  if (this.opt.cssTemplate === undefined) {
    this.opt.cssTemplate =
        '<%= nodes.map(function(node){ return "."+node.className }).join(", ") %>' +
        this.opt.globalTemplate +
        '<% nodes.forEach(function(node){ %>' +
        this.opt.eachTemplate +
        '<%})%>';
  }

  if (this.opt.ratio === undefined) {
    this.opt.ratio = 1;
  }

  if (this.opt.namespace === undefined) {
    this.opt.namespace = null;
  }
  this.images = [];
}

Sprite.prototype.addImageSrc = function (images, cb) {
  var self = this,
      wait = images.length;
  images.forEach(function (imagePath) {
    fs.createReadStream(imagePath)
        .pipe(new PNG())
        .on('parsed', function () {
          this.path = imagePath;
          self.images.push(this);
          if (--wait === 0 && cb !== undefined) {
            cb();
          }
        });
  });
};
Sprite.prototype.addFile = function (file, cb) {
  var self = this;
  file
      .pipe(new PNG())
      .on('parsed', function () {
        this.path = file.path;
        this.base = file.base;
        self.images.push(this);
        if (cb !== undefined) {
          cb();
        }
      });
};
Sprite.prototype.addFiles = function (files, cb) {
  var self = this,
      wait = files.length;
  files.forEach(function (file) {
    self.addFile(file, function () {
      if (--wait === 0 && cb !== undefined) {
        cb();
      }
    });
  });
};

Sprite.prototype.compile = function (relativePngPath) {
  var self = this,
      width = 0,
      height = 0,
      root = new Node(),
      sortedImage = this.images.sort(function (a, b) {
        var height = b.height - a.height;
        return height === 0 ? (b.path < a.path ? -1 : 1) : height;
      });

  sortedImage.forEach(function (image) {
    root.insert(image);
  });

  var nodes = root.getNodeWithImages();

  nodes.forEach(function (node) {
    node.width -= spriteOffset;
    node.height -= spriteOffset;
    width = Math.max(width, node.width + node.x);
    height = Math.max(height, node.height + node.y);
  });

  var png = new PNG({
    width: width,
    height: height,
    deflateStrategy: 1
  });

  // clean png
  for (var i = 0; i < width * height * 4; i++) {
    png.data[i] = 0x00;
  }

  nodes.forEach(function (node) {
    // Format Name
    node.className = ejs.render(self.opt.className, {
      path: path,
      node: node,
      namespace: self.opt.namespace
    });
    node.image.bitblt(png, 0, 0, node.width, node.height, node.x, node.y);
  });

  var cssString = ejs.render(this.opt.cssTemplate, {
    path: path,
    nodes: nodes,
    relativePngPath: relativePngPath.replace(/\\/g, '/'),
    ratio: this.opt.ratio,
    namespace: this.opt.namespace,
    width: width,
    height: height
  });

  return {
    css: cssString,
    png: png.pack()
  };
};

exports.Sprite = Sprite;

exports.gulp = function (opt) {
  return require('./gulp')(opt);
};

function Node(x, y, width, height) {
  this.x = x || 0;
  this.y = y || 0;
  this.width = width || Infinity;
  this.height = height || Infinity;
  this.image = null;
  this.left = null;
  this.right = null;
}

Node.prototype.insert = function (image) {
  var width = image.width + spriteOffset
  var height = image.height + spriteOffset
  //  if we're not a leaf
  if (this.image === null && this.left !== null && this.right !== null) {
    // try inserting into first child
    var newNode = this.left.insert(image);
    if (newNode !== null) {
      return newNode;
    }
    //no room, insert into second
    return this.right.insert(image);
  }
  // if there's already a image here
  if (this.image !== null){
    return null;
  }
  // if we're too small
  if (this.width < width || this.height < height){
    return null;
  }
  // if we're just right
  if (this.width === width && this.height === height) {
    this.image = image;
    return this;
  }

  // gotta split this node and create some kids
  var dw = this.width - width;
  var dh = this.height - height;
  if (dw > dh) {
    this.left = new Node(
        this.x,
        this.y,
        width,
        this.height
    );
    this.right = new Node(
        this.x + width,
        this.y,
        this.width - width,
        this.height
    );
  } else {
    this.left = new Node(
        this.x,
        this.y,
        this.width,
        height
    );
    this.right = new Node(
        this.x,
        this.y + height,
        this.width,
        this.height - height
    );
  }
  // insert into first child we created
  return this.left.insert(image);
};

Node.prototype.getNodeWithImages = function () {
  if (this.image) {
    return [this];
  }
  if (this.left !== null && this.right !== null) {
    return this.left.getNodeWithImages().concat(this.right.getNodeWithImages());
  }
  return [];
};
