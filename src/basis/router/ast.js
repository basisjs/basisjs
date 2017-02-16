function parsePath(route){
  var value = String(route || '');
  var params = [];

  function findWord(offset){
    return value.substr(offset).match(/^\w+/);
  }

  function parse(offset, stopChar){
    var result = '';
    var res;

    for (var i = offset; i < value.length; i++)
    {
      var c = value.charAt(i);
      switch (c)
      {
        case stopChar:
          return {
            result: result,
            offset: i
          };

        case '\\':
          result += '\\' + value.charAt(++i);
          break;

        case '|':  // allow | inside braces
          result += stopChar != ')' ? '\\|' : '|';
          break;

        case '(':  // optional: (something) -> (?:something)?
          if (res = parse(i + 1, ')'))
          {
            i = res.offset;
            result += '(?:' + res.result + ')?';
          }
          else
          {
            result += '\\(';
          }

          break;

        case ':':  // named:   :name -> ([^/]+)
          if (res = findWord(i + 1))
          {
            i += res[0].length;
            result += '([^\/]+)';
            params.push(res[0]);
          }
          else
          {
            result += ':';
          }

          break;

        case '*':  // splat:   *name -> (.*?)
          if (res = findWord(i + 1))
          {
            i += res[0].length;
            result += '(.*?)';
            params.push(res[0]);
          }
          else
          {
            result += '\\*';
          }

          break;

        default:
          result += basis.string.forRegExp(c);
      }
    }

    return stopChar ? null : result;
  }

  var regexp = new RegExp('^' + parse(0) + '$', 'i');
  regexp.params = params;
  return {
    regexp: regexp,
    AST: null
  };
}

module.exports = {
  parsePath: parsePath
};
