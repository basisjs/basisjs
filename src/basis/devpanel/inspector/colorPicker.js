function hsv_to_rgb(h, s, v){
  var h1 = h * 6;
  var c = v * s;
  var x = c * (1 - Math.abs(h1 % 2 - 1));
  var rgb;

  switch(Math.floor(h1))
  { 
    case 0: rgb = [c, x, 0]; break;
    case 1: rgb = [x, c, 0]; break;
    case 2: rgb = [0, c, x]; break;
    case 3: rgb = [0, x, c]; break;
    case 4: rgb = [x, 0, c]; break;
    case 5: rgb = [c, 0, x]; break;
  }

  var m = v - c;
   
  return [
    Math.floor((rgb[0] + m) * 256), 
    Math.floor((rgb[1] + m) * 256), 
    Math.floor((rgb[2] + m) * 256) 
  ];
}

module.exports = {
  getColor: function(){
    var golden_ratio_conjugate = 0.618033988749895;

    var h = Math.random();
    h += golden_ratio_conjugate;
    h %= 1;

    return hsv_to_rgb(h, 0.7, 0.95);
  }
};
