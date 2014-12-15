var CSS_CLASSNAME_START = /^\-?([_a-z]|[^\x00-\xb1]|\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?|\\[^\n\r\f0-9a-f])/i; // http://www.w3.org/TR/css3-selectors/#lex
var CSS_CLASSNAME_START_MAXLEN = 8; // -?\\.{1,6}
var CSS_NESTED_ATRULE = /^(media|supports|document)\b/i;
var CSS_NESTED_ATRULE_MAXLEN = 8; // maxlength(media | supports | document) = 8 symbols
var CSS_FNSELECTOR = /^(not|has|matches|nth-child|nth-last-child)\(/i;
var CSS_FNSELECTOR_MAXLEN = 15; // maxlength(not | has | matches | nth-child | nth-last-child) + '(' = 15 symbols

function genIsolateMarker(){
  return 'i' + basis.genUID() + '__';
}

function isolateCss(css, prefix){
  function jumpAfter(str, offset){
    var index = css.indexOf(str, offset);
    i = index !== -1 ? index + str.length : sym.length;
  }

  function parseString(endSym){
    var quote = sym[i];

    if (quote !== '"' && quote !== '\'')
      return;

    for (i++; i < len && sym[i] !== quote; i++)
      if (sym[i] === '\\')
        i++;

    return true;
  }

  function parseBraces(endSym){
    var bracket = sym[i];

    if (bracket === '(')
    {
      jumpAfter(')', i + 1);
      return true;
    }

    if (bracket === '[')
    {
      for (i++; i < len && sym[i] !== ']'; i++)
        parseString();
      return true;
    }
  }

  function parseComment(){
    if (sym[i] !== '/' || sym[i + 1] !== '*')
      return;

    jumpAfter('*/', i + 2);

    return true;
  }

  function parsePseudoContent(){
    for (; i < len && sym[i] != ')'; i++)
      if (parseComment() || parseBraces() || parsePseudo() || parseClassName())
        continue;
  }

  function parsePseudo(){
    if (sym[i] !== ':')
      return;

    var m = css.substr(i + 1, CSS_FNSELECTOR_MAXLEN).match(CSS_FNSELECTOR);
    if (m)
    {
      i += m[0].length + 1;
      parsePseudoContent();
    }

    return true;
  }

  function parseAtRule(){
    if (sym[i] !== '@')
      return;

    var m = css.substr(i + 1, CSS_NESTED_ATRULE_MAXLEN).match(CSS_NESTED_ATRULE);
    if (m)
    {
      i += m[0].length;
      nestedStyleSheet = true;
    }

    return true;
  }

  function parseBlock(){
    if (sym[i] !== '{')
      return;

    if (nestedStyleSheet)
    {
      i++;
      parseStyleSheet(true);
      return;
    }

    for (i++; i < len && sym[i] !== '}'; i++)
      parseString() || parseBraces();

    return true;
  }

  function parseClassName(){
    if (sym[i] !== '.')
      return;

    var m = css.substr(i + 1, CSS_CLASSNAME_START_MAXLEN).match(CSS_CLASSNAME_START);
    if (m)
    {
      i++;
      result.push(css.substring(lastMatchPos, i), prefix);
      lastMatchPos = i;
    }

    return true;
  }

  function parseStyleSheet(nested){
    for (nestedStyleSheet = false; i < len; i++)
    {
      if (parseComment() || parseAtRule() || parsePseudo() || parseBraces() || parseClassName())
        continue;

      if (nested && sym[i] == '}')
        return;

      parseBlock();
    }
  }

  var result = [];
  var sym = css.split('');
  var len = sym.length;
  var lastMatchPos = 0;
  var i = 0;
  var nestedStyleSheet;

  if (!prefix)
    prefix = genIsolateMarker();

  parseStyleSheet(false);

  return result.join('') + css.substring(lastMatchPos);
}

module.exports = isolateCss;
