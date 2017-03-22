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
        children: res.ast
      });
      i = res.offset;
      result += res.result;

      if (res.stoppedAt == ')')
      {
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
    var ast = [];

    function putCurrentWord() {
      if (curWord)
      {
        ast.push({
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
            ast: ast
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
            ast.push({
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
            ast.push({
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
            ast.push({
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
      ast: ast
    };
  }

  var parsingResult = parse(0);
  var regexp = new RegExp('^' + parsingResult.regexpStr + '$', 'i');
  return {
    path: route,
    regexp: regexp,
    params: params,
    ast: parsingResult.ast
  };
}

function stringifyGroup(group, values, areModified) {
  var defaultResult = null;

  for (var i = 0; i < group.options.length; i++) {
    var option = group.options[i];
    var stringifiedOption = stringifyNodes(option.children, values, areModified, true);

    if (stringifiedOption.modifiedParamsWritten)
      return stringifiedOption;
    else if (!defaultResult)
      defaultResult = stringifiedOption;
  }

  return defaultResult;
}

function stringifyNodes(nodes, values, areModified) {
  // Part of string complying to default params,
  // which should be written if they precede a modified one
  var trailingDefaults = '';
  var result = '';
  var modifiedParamsWritten = null;

  function markAsWritten(paramName) {
    if (!modifiedParamsWritten)
      modifiedParamsWritten = {};
    modifiedParamsWritten[paramName] = true;
  }

  function append(value) {
    result += trailingDefaults + value;
    trailingDefaults = '';
  }

  nodes.forEach(function(node){
    switch (node.type) {
      case TYPE.WORD:
        append(node.name);
        break;
      case TYPE.PLAIN_PARAM:
      case TYPE.ANY_PARAM:
        append(encodeURIComponent(values[node.name]));
        if (areModified[node.name])
          markAsWritten(node.name);
        break;
      case TYPE.GROUP:
        var groupStringifyResult = stringifyGroup(node, values, areModified);
        if (groupStringifyResult.modifiedParamsWritten)
        {
          append(groupStringifyResult.result);
          basis.object.iterate(groupStringifyResult.modifiedParamsWritten, markAsWritten);
        }
        else
        {
          trailingDefaults += groupStringifyResult.result;
        }
        break;
    }
  });

  return {
    result: result,
    modifiedParamsWritten: modifiedParamsWritten
  };
}

function stringify(nodes, values, areModified) {
  var stringifyPathResult = stringifyNodes.apply(this, arguments);
  var modifiedParamsWritten = stringifyPathResult.modifiedParamsWritten;
  var result = stringifyPathResult.result;
  var query = [];

  basis.object.iterate(values, function(key, value){
    if (modifiedParamsWritten && modifiedParamsWritten[key])
      return;

    if (!areModified[key])
      return;

    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  });

  if (query.length)
    result += '?' + query.join('&');

  return result;
}

module.exports = {
  parsePath: parsePath,
  stringify: stringify,
  TYPE: TYPE
};
