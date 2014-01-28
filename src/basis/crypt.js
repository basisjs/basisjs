
  basis.require('basis.utils.utf8');
  basis.require('basis.utils.utf16');
  basis.require('basis.utils.base64');

 /**
  * @namespace basis.crypt
  */

  var arrayFrom = basis.array.from;
  var createArray = basis.array.create;
  var repeatArray = basis.array.repeat;
  var flatten = basis.array.flatten;
  var UTF16 = basis.utils.utf16;
  var UTF8 = basis.utils.utf8;
  var base64 = basis.utils.base64;


  function rotateLeft(number, offset){
    return (number << offset) | (number >>> (32 - offset));
  }


  // =======================================
  //  [ hex Encode/Decode ]

  function number2hex(number){
    var result = [];

    do
    {
      result.push((number & 0x0F).toString(16));
      number >>= 4;
    }
    while (number);

    if (result.length & 1)
      result.push('0');

    return result.reverse().join('');
  }

  function hex(input){
    if (typeof input == 'number')
      return number2hex(input);

    var output;
    if (Array.isArray(input))
      output = input.map(hex);
    else
      output = String(input).split('').map(function(c){
        return number2hex(c.charCodeAt(0));
      });

    return output.join('');
  }

  // ==========================================
  //  sha1

  var sha1 = (function(){

    var K = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6];
    var F = [
      function(x, y, z){
        return z ^ (x & (y ^ z));
      },
      function(x, y, z){
         return x ^ y ^ z;
      },
      function(x, y, z){
         return (x & y) | (z & (x | y));
      },
      function(x, y, z){
         return y ^ x ^ z;
      }
    ];

    function vector(val){
      var result = [];
      for (var i = 3; i >= 0; i--)
        result.push((val >> i * 8) & 0xFF);
      return result;
    }

    //
    // sha1 main function
    //

    return function(message, useUTF8){
      // convert to bytes array if necessary
      if (!Array.isArray(message))
        if (useUTF8)
          message = UTF16.toUTF8Bytes(message);
        else
          message = UTF16.toBytes(message);

      // convert message to dword array
      var len = message.length;
      var dwords = [];

      for (var i = 0; i < len; i++)
        dwords[i >> 2] |= message[i] << ((3 - (i & 3)) << 3);

      if (len & 3)
        dwords[len >> 2] |= Math.pow(2, ((4 - (len & 3)) << 3) - 1);
      else
        dwords[len >> 2] = 0x80000000;

      // padding 0
      dwords.push.apply(dwords, createArray(((dwords.length & 0x0F) > 14 ? 30 : 14) - (dwords.length & 0x0F), 0));

      // add length
      dwords.push(len >>> 29);
      dwords.push((len << 3) & 0x0FFFFFFFF);

      // reverse
      dwords.reverse();

      // init arguments h0, h1, h2, h3, h4
      var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
      var stored = arrayFrom(H);

      // make a hash
      var S;
      var chunk = dwords.length >> 4;
      var W = new Array(80);

      while (chunk--)
      {
        for (var i = 0; i < 16; i++)
          W[i] = dwords.pop();
        for (var i = 16; i < 80; i++)
          W[i] = rotateLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        for (var i = 0; i < 80; i++)
        {
          S = Math.floor(i / 20);
          H[4] = (rotateLeft(H[0], 5) + F[S](H[1], H[2], H[3]) + H[4] + W[i] + K[S]) & 0x0FFFFFFFF;
          H[1] = rotateLeft(H[1], 30);
          H.unshift(H.pop());
        }

        for (var i = 0; i < 5; i++)
          H[i] = stored[i] = (H[i] + stored[i]) & 0x0FFFFFFFF;
      }

      // return sha1 hash bytes array
      return flatten(H.map(vector));
    };
  })();

  // ==========================================
  //  md5

  var md5 = (function(){

    var C_2_POW_32 = Math.pow(2, 32);
    var S;
    var K = [];
    var I = [];
    var F = [
      function(x, y, z){
        return z ^ (x & (y ^ z));
      },
      function(x, y, z){
        return y ^ (z & (y ^ x));
      },
      function(x, y, z){
        return x ^ y ^ z;
      },
      function(x, y, z){
        return y ^ (x | ~z);
      }
    ];

    function initConst(){
      S = flatten([
        repeatArray([7, 12, 17, 22], 4),
        repeatArray([5, 9, 14, 20], 4),
        repeatArray([4, 11, 16, 23], 4),
        repeatArray([6, 10, 15, 21], 4)
      ]);

      for (var i = 0; i < 64; i++)
      {
        K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * C_2_POW_32);
        switch (i >> 4)
        {
          case 0:
            I[i] = i;
            break;

          case 1:
            I[i] = (i * 5 + 1) & 0x0F;
            break;

          case 2:
            I[i] = (i * 3 + 5) & 0x0F;
            break;

          case 3:
            I[i] = (i * 7) & 0x0F;
            break;
        }
      }
    }

    function add(word){  // safe add
      var count = arguments.length;
      var lw = word & 0xFFFF;
      var hw = word >> 16;

      for (var i = 1; i < count; i++)
      {
        var b = arguments[i];
        lw += (b & 0xFFFF);
        hw += (b >> 16) + (lw >> 16);
        lw &= 0xFFFF;
      }

      return (hw << 16) | (lw & 0xFFFF);
    }

    function vector(val){
      var result = [];
      for (var i = 0; i < 4; i++)
        result.push((val >> i * 8) & 0xFF);
      return result;
    }

    //
    // md5 main function
    //

    return function(message, useUTF8){
      // one time const init
      if (!S)
        initConst();

      // convert to bytes array if necessary
      if (!Array.isArray(message))
        if (useUTF8)
          message = UTF16.toUTF8Bytes(message);
        else
          message = UTF16.toBytes(message);

      // convert message to dword array
      var dwords = [];
      var len = message.length;

      for (var i = 0; i < len; i++)
        dwords[i >> 2] |= message[i] << ((i & 3) << 3);

      dwords[len >> 2] |= 0x80 << ((len & 3) << 3);

      // padding 0
      dwords.push.apply(dwords, new Array(((dwords.length & 0x0F) > 14 ? 30 : 14) - (dwords.length & 0x0F)));
      // add length
      dwords.push((len << 3) & 0x0FFFFFFFF);
      dwords.push(len >>> 29);

      // init arguments a, b, c, d
      var A = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
      var stored = arrayFrom(A);

      // make a hash
      var chunk = dwords.length >> 4;
      while (chunk--)
      {
        for (var i = 0; i < 64; i++)
        {
          A[0] = add(rotateLeft(add(A[0], F[i >> 4](A[1], A[2], A[3]), dwords[I[i]], K[i]), S[i]), A[1]);
          A.unshift(A.pop());
        }

        for (var i = 0; i < 4; i++)
          A[i] = stored[i] = add(A[i], stored[i]);
      }

      // return md5 hash bytes array
      return flatten(A.map(vector));
    };
  })();


  //
  // chain wrapper
  //

  var cryptTarget = '';

  var cryptMethods = {
    sha1: function(useUTF8){
      return sha1(this, useUTF8);
    },
    sha1hex: function(useUTF8){
      return hex(sha1(this, useUTF8));
    },
    md5: function(useUTF8){
      return md5(this, useUTF8);
    },
    md5hex: function(useUTF8){
      return hex(md5(this, useUTF8));
    },
    base64: function(useUTF8){
      return base64.encode(this, useUTF8);
    },
    hex: function(){
      return hex(this);
    }
  };

  var context_ = {};
  basis.object.iterate(cryptMethods, function(name, value){
    context_[name] = function(useUTF8){
      var result = value.call(cryptTarget, useUTF8);
      return cryptTarget = basis.object.extend(typeof result != 'object' ? Object(result) : result, context_);
    };
  });

  function wrap(target){
    cryptTarget = target || '';
    return context_;
  };

  var a = {
    a: 1,
    b: 2,
  };


  //
  // export names
  //

  module.exports = {
    hex: hex,
    sha1: sha1,
    md5: md5,

    wrap: wrap
  };
