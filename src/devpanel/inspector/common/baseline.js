var document = global.document;
var getComputedStyle = global.getComputedStyle;
var HEIGHT = 150;
var WIDTH = 150;

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var baselineCache = {};

canvas.width = WIDTH;
canvas.height = HEIGHT;

function getTop(font, baseline){
  ctx.font = font;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.textBaseline = baseline;
  ctx.fillText('x', 0, HEIGHT);

  var width = ctx.measureText('x').width;

  // getImageData with source width == 0 returns an error.
  // covering that case
  if (!width)
    return 0;

  var image = ctx.getImageData(0, 0, width, HEIGHT);
  var count = image.width * image.height * 4;
  var data = image.data;

  for (var i = 3; i < count; i += 4)
    if (data[i])
      return Math.floor(i / (image.width * 4));
}

module.exports = function getBaseline(text){
  var font = getComputedStyle(text.parentNode).font;

  if (font in baselineCache)
    return baselineCache[font];

  var baseline = getTop(font, 'alphabetic') - getTop(font, 'bottom');

  baselineCache[font] = baseline;

  return baselineCache[font];
};
