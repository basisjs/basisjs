
  basis.require('basis.utils.utf16');

 /**
  * @namespace basis.utils.utf8
  */

  var utf16 = basis.utils.utf16;
  var chars = basis.array.create(255, function(i){
    return String.fromCharCode(i);
  });

  // utf8 string
  function toBytes(input){
    var len = input.length;
    var output = new Array(len);

    for (var i = 0; i < len; i++)
      output[i] = input.charCodeAt(i);

    return output;
  }

  // utf8 bytes array
  function fromBytes(input){
    var len = input.length;
    var output = '';

    for (var i = 0; i < len; i++)
      output += chars[input[i]];

    return output;
  }

  // utf8 string -> utf16 string
  function toUTF16(input){
    return utf16.fromUTF8(input);
  }

  // utf8 string  -> utf16 bytes array
  function toUTF16Bytes(input){
    return utf16.toBytes(utf16.fromUTF8(input));
  }

  // utf16 string -> utf8 string
  function fromUTF16(input){
    return utf16.toUTF8(input);
  }

  // utf16 bytes array -> utf8 string
  function fromUTF16Bytes(input){
    return utf16.toUTF8(utf16.fromBytes(input));
  }

  module.exports = {
    toBytes: toBytes,
    fromBytes: fromBytes,
    toUTF16: toUTF16,
    fromUTF16: fromUTF16,
    toUTF16Bytes: toUTF16Bytes,
    fromUTF16Bytes: fromUTF16Bytes
  };
