
 /**
  * @namespace basis.utils.info
  */

  function normalizeOffset(str){
    var lines = str.split(/\n/);

    if (lines.length < 2)
      return str;

    var offsets = lines.map(function(line){
      return line.match(/^(\s*)/)[0].length;
    });
    var firstLineOffset = offsets.shift();
    var otherLinesMinOffset = Math.min.apply(null, offsets);
    var minOffset = firstLineOffset ? Math.min(firstLineOffset, otherLinesMinOffset) : otherLinesMinOffset;

    if (minOffset)
      str = lines.map(function(line, idx){
        return idx || firstLineOffset ? line.substr(minOffset) : line;
      }).join('\n');

    return str;
  }

  function toString(value){
    var host = typeof value == 'function' ? Function : Object;
    var result = host.prototype.toString.call(value);

    if (host === Function)
      result = normalizeOffset(result);

    return result;
  }

  function resolveGetter(getter){
    if (getter === basis.fn.nullGetter)
      return 'basis.fn.nullGetter';

    if (getter[basis.getter.ID])
    {
      var parent = getter[basis.getter.PARENT];
      var result = parent ? resolveGetter(parent) + '.as(' : 'basis.getter(';
      var source = getter[basis.getter.SOURCE];

      if (typeof source == 'string')
        result += '"' + source.replace(/"/g, '\\"') + '"';
      else
      {
        if (!getter.mod)
        {
          if (typeof source == 'function')
            result += toString(source);
          else
            if (typeof JSON !== 'undefined')
              try {
                result += JSON.stringify(source);
              } catch(e){
                result += toString(source);
              }
            else
              result += toString(source);
        }
        else
          result += resolveGetter(source);
      }

      if (getter.mod)
      {
        if (typeof getter.mod == 'string')
          result += ', "' + getter.mod.replace(/"/g, '\\"') + '"';
        else
          result += ', ' + resolveGetter(getter.mod);
      }

      return result + ')';
    }

    return toString(getter);
  }

  function tokenizeFunctionSource(source){
    var chars = source.split('');
    var res = [];
    var last = 0;
    var j;

    function store(type, pos){
      if (arguments.length != 2)
        pos = i;

      if (last != pos)
      {
        res.push([type || 'content', source.substring(last, pos)]);
        last = pos;
      }
    }

    for (var i = 0; i < chars.length; i++) mainLoop:
    {
      var ch = chars[i];
      switch (ch)
      {
        case '/':
          store();
          j = i;

          if (chars[j + 1] === '/')
          {
            j = j + 2;

            // rewind to end of line
            while (j < chars.length && chars[j] !== '\n' && chars[j] !== '\r')
              j++;

            store('comment', j);
            i = last - 1;
            break;
          }

          if (chars[j + 1] == '*')
          {
            j = j + 2;

            while (j < chars.length && !(chars[j] === '*' && chars[j + 1] === '/'))
              j++;

            store('comment', j + 2);
            i = last - 1;
            break;
          }

          while (j < chars.length)
          {
            j++;

            if (chars[j] == '\n')
              break mainLoop;

            if (chars[j] == '\\')
            {
              j++;
            }
            else
            {
              if (chars[j] == ch)
                break;
            }
          }
          store('regexp', j + 1);
          i = last - 1;

          break;
        case '"':
        case '\'':
          store();
          j = i;
          while (j < chars.length)
          {
            j++;
            if (chars[j] == '\\')
            {
              j++;
            }
            else
            {
              if (chars[j] == ch)
                break;
            }
          }

          store('string', j + 1);
          i = last - 1;
          break;

        case '(':
        case '{':
          store();
          last = i + 1;
          res.push(['open', ch]);
          break;

        case ')':
        case '}':
          store();
          last = i + 1;
          res.push(['close', ch]);
          break;

        default:
          if (/\s/.test(ch))
          {
            store();
            j = i + 1;
            while (j < chars.length && /\s/.test(chars[j]))
              j++;

            store('space', j);
            i = last - 1;
          }
      }
    }
    store();

    // if (source != res.map(function(x){return x[1]}).join(''))
    //   basis.dev.warn('Wrong parsing', source);

    return res;
  }

 /**
  * @param {function} fn Function to analyze
  * @return {object} Info about function
  */
  function functionInfo(fn){
    var getter = resolveGetter(fn);
    var source = toString(fn);
    var tokens = tokenizeFunctionSource(source);
    var name = 'anonymous';
    var argsContext = false;
    var wasContent = true;
    var args = [];
    var token;

    while (token = tokens.shift())
    {
      if (token[1] == '{')
        break;

      if (token[0] == 'content')
      {
        wasContent = true;
        if (argsContext)
          args.push(token[1]);
        else
        {
          if (token[1] != 'function')
            name = token[1];
        }
      }
      else
      {
        if (!argsContext)
          argsContext = wasContent && token[1] == '(';
      }
    }

    while (token = tokens.pop())
      if (token[1] == '}')
        break;

    for (var i = 0; i < tokens.length; i++)
      tokens[i] = tokens[i][1];

    args = args.join('').trim().replace(/\s*,\s*/g, ', ');

    return {
      source: source,
      name: name,
      fullname: name + '(' + args + ')',
      args: args,
      body: tokens.join(''),
      getter: getter != source ? getter : false
    };
  }


  //
  // export names
  //

  module.exports = {
    fn: functionInfo,
    normalizeOffset: normalizeOffset
  };
