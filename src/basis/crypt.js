
 /**
  * @namespace basis.crypt
  */

  var namespace = this.path;


  //
  // Main part
  //

  var arrayFrom = basis.array.from;
  var createArray = basis.array.create;

  function rotateLeft(number, offset){
    return (number << offset) | (number >>> (32 - offset));
  }

  var chars = createArray(255, function(i){
    return String.fromCharCode(i);
  });

  // =======================================
  //  [ UTF16 Encode/Decode ]

  var UTF16 = (function(){
  
   /**
    * @namespace basis.crypt.UTF16
    */
    var namespace = 'basis.crypt.UTF16';

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
      var b1, b2;
      var i = 0;

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
      return UTF8.toBytes(toUTF8(input));
    }

    // utf8 string -> utf16 string
    function fromUTF8(input){
      //return this.fromUTF8Bytes(UTF8.toBytes(input));

      var output = '';
      var len = input.length;
      var c1, c2, c3;
      var i = 0;

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
      return fromUTF8(UTF8.fromBytes(input));
    }

    return basis.namespace(namespace).extend({
      toBytes: toBytes,
      fromBytes: fromBytes,
      toUTF8: toUTF8,
      fromUTF8: fromUTF8,
      toUTF8Bytes: toUTF8Bytes,
      fromUTF8Bytes: fromUTF8Bytes
    });

  })();

  // =======================================
  //  [ UTF8 Encode/Decode ]

  var UTF8 = (function(){
  
    var namespace = 'basis.crypt.UTF8';

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
      return UTF16.fromUTF8(input);
    }

    // utf8 string  -> utf16 bytes array
    function toUTF16Bytes(input){
      return UTF16.toBytes(UTF16.fromUTF8(input));
    }
    
    // utf16 string -> utf8 string
    function fromUTF16(input){
      return UTF16.toUTF8(input);
    }

    // utf16 bytes array -> utf8 string
    function fromUTF16Bytes(input){
      return UTF16.toUTF8(UTF16.fromBytes(input));
    }

    return basis.namespace(namespace).extend({
      toBytes: toBytes,
      fromBytes: fromBytes,
      toUTF16: toUTF16,
      fromUTF16: fromUTF16,
      toUTF16Bytes: toUTF16Bytes,
      fromUTF16Bytes: fromUTF16Bytes
    });
  })();

  // =====================================================
  //   BASE64

  var Base64 = (function(){

   /**
    * @namespace basis.crypt.Base64
    */
    var namespace = 'basis.crypt.Base64';

    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".toArray();
    var charIndex = {};
    
    chars.forEach(function(item, index){ charIndex[item] = index; });

    function encode(input, useUTF8){
      // convert to bytes array if necessary
      if (input.constructor != Array)
        if (useUTF8)
          input = UTF16.toUTF8Bytes(input);
        else
          input = UTF16.toBytes(input);
       
      // encode
      var len = input.length;
      var i = 0;
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;

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
        else if (chr3 == undefined)
        	enc4 = 64;

        output += chars[enc1] + chars[enc2] + chars[enc3] + chars[enc4];
      }
       
      return output;
    } 
    
    function decode(input, useUTF8){
      input = input.replace(/[^a-z0-9\+\/]/ig, '');

      var output = [];
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      var len = input.length;
      
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
        return UTF16.fromUTF8Bytes(output);
      else
        return UTF16.fromBytes(output);
    }

    //
    // export names
    //

    return basis.namespace(namespace).extend({
      encode: encode,
      decode: decode
    });

  })();

 /**
  * @namespace basis.crypt
  */

  // =======================================
  //  [ HEX Encode/Decode ]

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

  function HEX(input){
    if (typeof input == 'number')
      return number2hex(input);

    var output;
    if (Array.isArray(input))
      output = input.map(HEX);
    else
      output = String(input).toArray().map(function(c){ return number2hex(c.charCodeAt(0)); });

    return output.join('');
  }

  // ==========================================
  //  SHA1

  var SHA1 = (function(){

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
    // SHA1 main function
    //

    return function(message, useUTF8){
      // convert to bytes array if necessary
      if (message.constructor != Array)
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
        for(var i = 0; i < 16; i++) 
          W[i] = dwords.pop();
        for(var i = 16; i < 80; i++) 
          W[i] = rotateLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        for (var i = 0; i < 80; i++) 
        {
          S = Math.floor(i/20);
          H[4] = (rotateLeft(H[0], 5) + F[S](H[1], H[2], H[3]) + H[4] + W[i] + K[S]) & 0x0FFFFFFFF;
          H[1] = rotateLeft(H[1], 30);
          H.unshift(H.pop());
        }

        for (var i = 0; i < 5; i++)
          H[i] = stored[i] = (H[i] + stored[i]) & 0x0FFFFFFFF;
      }

      // return sha1 hash bytes array
      return H.map(vector).flatten();
    };
  })();

  // ==========================================
  //  MD5

  var MD5 = (function(){

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
      S = [[7,12,17,22].repeat(4), [5,9,14,20].repeat(4), [4,11,16,23].repeat(4), [6,10,15,21].repeat(4)].flatten();

      for (var i = 0; i < 64; i++)
      {
        K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * C_2_POW_32);
        switch (i >> 4)
        {
          case 0: I[i] = i; break;
          case 1: I[i] = (i * 5 + 1) & 0x0F; break;
          case 2: I[i] = (i * 3 + 5) & 0x0F; break;
          case 3: I[i] = (i * 7) & 0x0F; break;
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
    // MD5 main function
    //

    return function(message, useUTF8){
      // one time const init
      if (!S)
        initConst();

      // convert to bytes array if necessary
      if (message.constructor != Array)
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
      return A.map(vector).flatten();
    };
  })();


  //
  // wrap function
  //

  var cryptTarget = '';

  var cryptMethods = {
    sha1: function(useUTF8){ return SHA1(this, useUTF8); },
    sha1hex: function(useUTF8){ return HEX(SHA1(this, useUTF8)); },
    md5: function(useUTF8){ return MD5(this, useUTF8); },
    md5hex: function(useUTF8){ return HEX(MD5(this, useUTF8)); },
    base64: function(useUTF8){ return Base64.encode(this, useUTF8); },
    hex: function(){ return HEX(this); }
  };

  var context_ = {};
  basis.object.iterate(cryptMethods, function(name, value){
    context_[name] = function(useUTF8){
      var result = value.call(cryptTarget, useUTF8);
      return cryptTarget = basis.object.extend(typeof result != 'object' ? Object(result) : result, context_);
    };
  });

  this.setWrapper(function(target){
    cryptTarget = target || '';
    return context_;
  });

  //
  // export names
  //

  module.exports = {
    HEX: HEX,
    SHA1: SHA1,
    MD5: MD5
  };
