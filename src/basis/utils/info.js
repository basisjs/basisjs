
  function resolveGetter(getter){
    if (getter[basis.getter.ID] > 0)
    {
      var result = 'getter(';

      if (typeof getter.base == 'string')
        result += '"' + getter.base.replace(/"/g, '\\"') + '"';
      else
      {
        if (!getter.mod)
          return resolveGetter(getter.base);
        else
          result += resolveGetter(getter.base);
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
    else
      return Function.prototype.toString.call(getter);
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
    var source = Function.prototype.toString.call(fn);
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
    fn: functionInfo
  };
