var TYPE = {
  PLAIN_PARAM: 'PLAIN_PARAM',
  ANY_PARAM: 'ANY_PARAM',
  WORD: 'WORD',
  GROUP: 'GROUP',
  GROUP_OPTION: 'GROUP_OPTION'
};

function parsePath(route){
  var value = String(route || '');
  var params = [];

  function findWord(offset){
    return value.substr(offset).match(/^\w+/);
  }

  function getOption(i) {
    return parse(i + 1, ')', '|');
  }

  function getGroup(i) {
    var res;
    var result = '';
    var options = [];

    while (res = getOption(i)) {
      options.push({
        type: TYPE.GROUP_OPTION,
        children: res.AST
      });
      i = res.offset;
      result += res.result;

      if (res.stoppedAt == ')') {
        return {
          type: TYPE.GROUP,
          options: options,
          result: result,
          offset: i
        };
      }
      else
      {
        result += '|';
      }

    }
    return null;
  }

  function parse(offset, stopChar, anotherStopChar){
    var result = '';
    var res;
    var curWord = '';
    var AST = [];

    function putCurrentWord() {
      if (curWord) {
        AST.push({
          type: TYPE.WORD,
          name: curWord
        });
        curWord = '';
      }
    }

    for (var i = offset; i < value.length; i++)
    {
      var c = value.charAt(i);
      switch (c)
      {
        case stopChar:
        case anotherStopChar:
          putCurrentWord();
          return {
            result: result,
            offset: i,
            stoppedAt: c,
            AST: AST
          };

        case '\\':
          var nextChar = value.charAt(++i);
          result += '\\' + nextChar;
          curWord += nextChar;
          break;

        case '|':  // allow | inside braces
          result += stopChar != ')' ? '\\|' : '|';
          curWord += '|';
          break;

        case '(':  // optional: (something) -> (?:something)?
          if (res = getGroup(i))
          {
            i = res.offset;
            result += '(?:' + res.result + ')?';
            putCurrentWord();
            AST.push({
              type: TYPE.GROUP,
              options: res.options
            });
          }
          else
          {
            result += '\\(';
            curWord += '(';
          }

          break;

        case ':':  // named:   :name -> ([^/]+)
          putCurrentWord();
          if (res = findWord(i + 1))
          {
            i += res[0].length;
            result += '([^\/]+)';
            params.push(res[0]);
            AST.push({
              type: TYPE.PLAIN_PARAM,
              name: res[0]
            });
          }
          else
          {
            result += ':';
          }

          break;

        case '*':  // splat:   *name -> (.*?)
          putCurrentWord();
          if (res = findWord(i + 1))
          {
            i += res[0].length;
            result += '(.*?)';
            params.push(res[0]);
            AST.push({
              type: TYPE.ANY_PARAM,
              name: res[0]
            });
          }
          else
          {
            result += '\\*';
          }

          break;

        default:
          result += basis.string.forRegExp(c);
          curWord += c;
      }
    }

    putCurrentWord();

    return stopChar ? null : {
      regexpStr: result,
      AST: AST
    };
  }

  var parsingResult = parse(0);
  var regexp = new RegExp('^' + parsingResult.regexpStr + '$', 'i');
  regexp.params = params;
  return {
    regexp: regexp,
    AST: parsingResult.AST
  };
}

module.exports = {
  parsePath: parsePath,
  TYPE: TYPE
};
