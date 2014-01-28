
  basis.require('basis.utils.utf16');

 /**
  * @namespace basis.utils.base64
  */

  var utf16 = basis.utils.utf16;

  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');
  var charIndex = chars.reduce(function(res, item, index){
    res[item] = index;
    return res;
  }, {});


  function encode(input, useUTF8){
    // convert to bytes array if necessary
    if (!Array.isArray(input))
      if (useUTF8)
        input = utf16.toUTF8Bytes(input);
      else
        input = utf16.toBytes(input);

    // encode
    var output = '';
    var len = input.length;
    var i = 0;
    var chr1;
    var chr2;
    var chr3;
    var enc1;
    var enc2;
    var enc3;
    var enc4;

    while (i < len)
    {
      chr1 = input[i++];
      chr2 = input[i++];
      chr3 = input[i++];

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (chr2 == undefined)
        enc3 = enc4 = 64;
      else
        if (chr3 == undefined)
          enc4 = 64;

      output += chars[enc1] + chars[enc2] + chars[enc3] + chars[enc4];
    }

    return output;
  }

  function decode(input, useUTF8){
    input = input.replace(/[^a-zA-Z0-9\+\/]/g, '');

    var output = [];
    var len = input.length;
    var i = 0;
    var chr1;
    var chr2;
    var chr3;
    var enc1;
    var enc2;
    var enc3;
    var enc4;

    // decode
    while (i < len)
    {
      enc1 = charIndex[input.charAt(i++)];
      enc2 = charIndex[input.charAt(i++)];
      enc3 = charIndex[input.charAt(i++)];
      enc4 = charIndex[input.charAt(i++)];

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output.push(chr1, chr2, chr3);
    }

    if (enc3 == null || enc3 == 64) output.pop();
    if (enc4 == null || enc4 == 64) output.pop();

    // convert to UTF8 if necessary
    if (useUTF8)
      return utf16.fromUTF8Bytes(output);
    else
      return utf16.fromBytes(output);
  }


  //
  // export names
  //

  module.exports = {
    encode: encode,
    decode: decode
  };
