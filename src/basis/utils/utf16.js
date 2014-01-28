
 /**
  * @namespace basis.utils.utf16
  */

  var chars = basis.array.create(255, function(i){
    return String.fromCharCode(i);
  });

  // utf16 string -> utf16 bytes array
  function toBytes(input){
    var output = [];
    var len = input.length;

    for (var i = 0; i < len; i++)
    {
      var c = input.charCodeAt(i);
      output.push(c & 0xFF, c >> 8);
    }

    return output;
  }

  // utf16 bytes array -> utf16 string
  function fromBytes(input){
    var output = '';
    var len = input.length;
    var i = 0;
    var b1;
    var b2;

    while (i < len)
    {
      b1 = input[i++] || 0;
      b2 = input[i++] || 0;
      output += String.fromCharCode((b2 << 8) | b1);
    }
    return output;
  }

  // utf16 string -> utf8 string
  function toUTF8(input){
    var output = '';
    var len = input.length;

    for (var i = 0; i < len; i++)
    {
      var c = input.charCodeAt(i);

      if (c < 128)
        output += chars[c];
      else
        if (c < 2048)
          output += chars[(c >> 6) | 192] +
                    chars[(c & 63) | 128];
        else
          output += chars[(c >> 12) | 224] +
                    chars[((c >> 6) & 63) | 128] +
                    chars[(c & 63) | 128];
    }
    return output;
  }

  // utf16 string -> utf8 bytes array
  function toUTF8Bytes(input){
    // utf16 -> utf8
    input = toUTF8(input);

    // string -> array of bytes
    var len = input.length;
    var output = new Array(len);

    for (var i = 0; i < len; i++)
      output[i] = input.charCodeAt(i);

    return output;
  }

  // utf8 string -> utf16 string
  function fromUTF8(input){
    var output = '';
    var len = input.length;
    var i = 0;
    var c1;
    var c2;
    var c3;

    while (i < len)
    {
      c1 = input.charCodeAt(i++);
      if (c1 < 128)
        output += chars[c1];
      else
      {
        c2 = input.charCodeAt(i++);
        if (c1 & 32)
        {
          c3 = input.charCodeAt(i++);
          output += String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        }
        else
          output += String.fromCharCode(((c1 & 31) << 6)  | (c2 & 63));
      }
    }
    return output;
  }

  // utf8 bytes array -> utf16 string
  function fromUTF8Bytes(input){
    return fromUTF8(input.map(function(b){
      return chars[b];
    }).join(''));
  }


  //
  // export names
  //

  module.exports = {
    toBytes: toBytes,
    fromBytes: fromBytes,
    toUTF8: toUTF8,
    fromUTF8: fromUTF8,
    toUTF8Bytes: toUTF8Bytes,
    fromUTF8Bytes: fromUTF8Bytes
  };
