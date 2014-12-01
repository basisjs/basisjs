var consts = require('./const.js');
var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_TEXT = consts.TYPE_TEXT;
var TYPE_COMMENT = consts.TYPE_COMMENT;
var ATTR_TYPE_BY_NAME = consts.ATTR_TYPE_BY_NAME;

// parsing variables
var SYNTAX_ERROR = 'Invalid or unsupported syntax';

// html parsing states
var TEXT = /((?:.|[\r\n])*?)(\{(?:l10n:([a-zA-Z_][a-zA-Z0-9_\-]*(?:\.[a-zA-Z_][a-zA-Z0-9_\-]*)*(?:\.\{[a-zA-Z_][a-zA-Z0-9_\-]*\})?)\})?|<(\/|!--(\s*\{)?)?|$)/g;
var TAG_NAME = /([a-z_][a-z0-9\-_]*)(:|\{|\s*(\/?>)?)/ig;
var ATTRIBUTE_NAME_OR_END = /([a-z_][a-z0-9_\-]*)(:|\{|=|\s*)|(\/?>)/ig;
var COMMENT = /(.|[\r\n])*?-->/g;
var CLOSE_TAG = /([a-z_][a-z0-9_\-]*(?::[a-z_][a-z0-9_\-]*)?)>/ig;
var REFERENCE = /([a-z_][a-z0-9_]*)(\||\}\s*)/ig;
var ATTRIBUTE_VALUE = /"((?:(\\")|[^"])*?)"\s*/g;
var QUOTE_UNESCAPE = /\\"/g;
var BREAK_TAG_PARSE = /^/g;
var SINGLETON_TAG = /^(area|base|br|col|command|embed|hr|img|input|link|meta|param|source)$/i;
var TAG_IGNORE_CONTENT = {
  text: /((?:.|[\r\n])*?)(?:<\/b:text>|$)/g,
  style: /((?:.|[\r\n])*?)(?:<\/b:style>|$)/g
};

var ATTR_BINDING = /\{([a-z_][a-z0-9_]*|l10n:[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)*(?:\.\{[a-z_][a-z0-9_]*\})?)\}/i;
var CLASS_ATTR_PARTS = /(\S+)/g;
var CLASS_ATTR_BINDING = /^((?:[a-z_][a-z0-9_\-]*)?(?::(?:[a-z_][a-z0-9_\-]*)?)?)\{((anim:)?[a-z_][a-z0-9_\-]*)\}$/i;
var STYLE_ATTR_PARTS = /\s*[^:]+?\s*:(?:\(.*?\)|".*?"|'.*?'|[^;]+?)+(?:;|$)/gi;
var STYLE_PROPERTY = /\s*([^:]+?)\s*:((?:\(.*?\)|".*?"|'.*?'|[^;]+?)+);?$/i;
var STYLE_ATTR_BINDING = /\{([a-z_][a-z0-9_]*)\}/i;


/**
 * Converts HTML tokens in string to UTF symbols.
 * i.e. '2014 &copy; foo &#8594; bar' -> '2014 © foo → bar'
 * @param {string} string
 * @return {string}
 */
var decodeHTMLTokens = (function(string){
  var tokenMap = {};
  var tokenElement = !basis.NODE_ENV ? document.createElement('div') : null;
  var NAMED_CHARACTER_REF = /&([a-z]+\d*|#\d+|#x[0-9a-f]{1,4});?/gi;

  // load token map when node evironment, because html parsing is not available
  // comment it, to not include code to build
  /** @cut */ if (basis.NODE_ENV || true)
  /** @cut */   tokenMap = require('./htmlentity.json');

  function namedCharReplace(m, token){
    if (!tokenMap[token])
    {
      if (token.charAt(0) == '#')
      {
        tokenMap[token] = String.fromCharCode(
          token.charAt(1) == 'x' || token.charAt(1) == 'X'
            ? parseInt(token.substr(2), 16)
            : token.substr(1)
        );
      }
      else
      {
        if (tokenElement)
        {
          tokenElement.innerHTML = m;
          tokenMap[token] = tokenElement.firstChild ? tokenElement.firstChild.nodeValue : m;
        }
      }
    }
    return tokenMap[token] || m;
  }

  return function decodeHTMLTokens(string){
    return String(string).replace(NAMED_CHARACTER_REF, namedCharReplace);
  };
})();

function buildAttrExpression(parts){
  var bindName;
  var names = [];
  var expression = [];
  var map = {};

  for (var j = 0; j < parts.length; j++)
    if (j % 2)
    {
      bindName = parts[j];

      if (!map[bindName])
      {
        map[bindName] = names.length;
        names.push(bindName);
      }

      expression.push(map[bindName]);
    }
    else
    {
      if (parts[j])
        expression.push(decodeHTMLTokens(parts[j]));
    }

  return [names, expression];
}

function processAttr(token, mode){
  var value = token.value;
  var bindings = 0;
  var parts;
  var m;

  // other attributes
  if (value)
  {
    switch (mode)
    {
      case 'class':
        if (parts = value.match(CLASS_ATTR_PARTS))
        {
          var newValue = [];

          bindings = [];

          for (var j = 0, part; part = parts[j]; j++)
          {
            if (m = part.match(CLASS_ATTR_BINDING))
              bindings.push([m[1] || '', m[2]]);
            else
              newValue.push(part);
          }

          // set new value
          value = newValue.join(' ');
        }
        break;

      case 'style':
        var props = [];

        bindings = [];
        if (parts = value.match(STYLE_ATTR_PARTS))
        {
          for (var j = 0, part; part = parts[j]; j++)
          {
            var m = part.match(STYLE_PROPERTY);
            var propertyName = m[1];
            var value = m[2].trim();

            var valueParts = value.split(STYLE_ATTR_BINDING);
            if (valueParts.length > 1)
            {
              var expr = buildAttrExpression(valueParts);
              expr.push(propertyName);
              bindings.push(expr);
            }
            else
              props.push(propertyName + ': ' + decodeHTMLTokens(value));
          }
        }
        else
        {
          /** @cut */ if (/\S/.test(value))
          /** @cut */   basis.dev.warn('Bad value for style attribute (value ignored):', value);
        }

        value = props.join('; ');
        if (value)
          value += ';';
        break;

      default:
        parts = value.split(ATTR_BINDING);
        if (parts.length > 1)
          bindings = buildAttrExpression(parts);
        else
          value = decodeHTMLTokens(value);
    }
  }

  if (bindings && !bindings.length)
    bindings = 0;

  token.binding = bindings;
  token.value = value;
  token.type = ATTR_TYPE_BY_NAME[mode] || TYPE_ATTRIBUTE;
}

/**
 * Post processing tokens:
 *   - process attribute value
 *   - join subling text nodes if possible
 *   - decode HTML tokens in text, attribute and comment value
 * @param {[type]} tokens [description]
 * @return {[type]} [description]
 */
function postProcessing(tokens){
  function tokenName(token){
    return (token.prefix ? token.prefix + ':' : '') + token.name;
  }

  function getTokenAttrs(token){
    return token.attrs.reduce(function(res, attr){
      res[tokenName(attr)] = attr.value;
      return res;
    }, {});
  }

  function walk(tokens){
    var token;
    var prev;

    for (var i = 0; token = tokens[i++]; prev = token)
    {
      // process element
      if (token.type == TYPE_ELEMENT)
      {
        // process attribute content
        var attrs = getTokenAttrs(token);
        for (var j = 0, attr; attr = token.attrs[j++];)
        {
          var mode;

          if (token.prefix == 'b')
          {
            // process specified attributes in special tags
            if (attr.name == 'value')
            {
              // parse value attribute in
              //   <b:class>/<b:append-class>/<b:set-class>/<b:remove-class>
              //   <b:attr name="name">/<b:append-attr name="name">/<b:set-attr name="name">/<b:remove-attr name="name">
              if (/^(|append-|set-|remove-)class$/.test(token.name))
                mode = 'class';
              else if (/^(|append-|set-|remove-)attr$/.test(token.name))
                mode = attrs.name;
            }
            else if (token.name == 'include')
            {
              // parse class and id attributes in <b:include>
              if (attr.name == 'class')
                mode = 'class';
              else if (attr.name == 'id')
                mode = 'id';
            }
          }
          else
          {
            // process every attributes in standart tags
            mode = attr.name;
          }

          if (mode)
          {
            // process bindings and decode HTML tokens
            processAttr(attr, mode);
          }
          else
          {
            // just decode HTML tokens in value
            token.value = decodeHTMLTokens(token.value);
          }
        }

        // walk recursive
        walk(token.children);
      }

      // process text
      if (token.type == TYPE_TEXT)
      {
        // decode HTML tokens in value
        token.value = decodeHTMLTokens(token.value);

        // try join text tokens
        if (!token.refs && prev && prev.type == TYPE_TEXT && !prev.refs)
        {
          prev.value += token.value;
          prev.end_ = token.end_;
          tokens.splice(--i, 1);
        }
      }

      // process comment
      if (token.type == TYPE_COMMENT)
      {
        // decode HTML tokens in value
        token.value = decodeHTMLTokens(token.value);
      }
    }
  }

  walk(tokens);
}

/**
* Parse html into tokens.
* @param {string} source Source of template
* @return {Array.<object>}
*/
function tokenize(source){
  var result = [];
  var tagStack = [];
  var lastTag = { children: result };
  var token;
  var bufferPos;
  var startPos;
  var parseTag = false;
  var textStateEndPos = 0;
  var textEndPos;

  var state = TEXT;
  var pos = 0;
  var m;

  source = source.trim();
  /** @cut */ result.source_ = source;
  /** @cut */ result.warns = [];

  while (pos < source.length || state != TEXT)
  {
    state.lastIndex = pos;
    startPos = pos;

    m = state.exec(source);

    if (!m || m.index !== pos)
    {
      // treat broken comment reference as comment content
      if (state == REFERENCE && token && token.type == TYPE_COMMENT)
      {
        state = COMMENT;
        continue;
      }

      if (parseTag)
        lastTag = tagStack.pop();

      if (token)
        lastTag.children.pop();

      if (token = lastTag.children.pop())
      {
        if (token.type == TYPE_TEXT && !token.refs)
          textStateEndPos -= 'len' in token ? token.len : token.value.length;
        else
          lastTag.children.push(token);
      }

      parseTag = false;
      state = TEXT;
      continue;
    }

    pos = state.lastIndex;

    //stat[state] = (stat[state] || 0) + 1;
    switch (state)
    {
      case TEXT:

        textEndPos = startPos + m[1].length;

        if (textStateEndPos != textEndPos)
        {
          var sourceText = textStateEndPos == startPos
            ? m[1]
            : source.substring(textStateEndPos, textEndPos);

          sourceText = sourceText.replace(/\s*(\r\n?|\n\r?)\s*/g, '');

          if (sourceText)
            lastTag.children.push({
              start_: textStateEndPos,
              end_: textEndPos,
              type: TYPE_TEXT,
              len: sourceText.length,
              value: sourceText
            });
        }

        textStateEndPos = textEndPos;

        if (m[3])
        {
          lastTag.children.push({
            start_: textEndPos,
            end_: pos,
            type: TYPE_TEXT,
            refs: ['l10n:' + m[3]],
            value: '{l10n:' + m[3] + '}'
          });
        }
        else if (m[2] == '{')
        {
          bufferPos = pos - 1;
          lastTag.children.push(token = {
            start_: textEndPos,
            end_: textEndPos,
            type: TYPE_TEXT
          });
          state = REFERENCE;
        }
        else if (m[4])
        {
          if (m[4] == '/')
          {
            token = null;
            state = CLOSE_TAG;
          }
          else //if (m[3] == '!--')
          {
            lastTag.children.push(token = {
              start_: textEndPos,
              end_: textEndPos,
              type: TYPE_COMMENT
            });

            if (m[5])
            {
              bufferPos = pos - m[5].length;
              state = REFERENCE;
            }
            else
            {
              bufferPos = pos;
              state = COMMENT;
            }
          }
        }
        else if (m[2]) // m[2] == '<' open tag
        {
          parseTag = true;
          tagStack.push(lastTag);

          lastTag.children.push(token = {
            start_: textEndPos,
            end_: textEndPos,
            type: TYPE_ELEMENT,
            attrs: [],
            children: []
          });
          lastTag = token;

          state = TAG_NAME;
        }

        break;

      case CLOSE_TAG:
        if (m[1] !== (lastTag.prefix ? lastTag.prefix + ':' : '') + lastTag.name)
        {
          //throw 'Wrong close tag';
          lastTag.children.push({
            start_: startPos - 2,
            end_: startPos + m[0].length,
            type: TYPE_TEXT,
            value: '</' + m[0]
          });
        }
        else
          lastTag = tagStack.pop();

        state = TEXT;
        break;

      case TAG_NAME:
      case ATTRIBUTE_NAME_OR_END:
        if (m[2] == ':')
        {
          if (token.prefix)      // prefix was before, break tag parse
            state = BREAK_TAG_PARSE;
          else
            token.prefix = m[1];

          break;
        }

        if (m[1])
        {
          // store name (it may be null when check for attribute and end)
          token.name = m[1];
          token.end_ = startPos + m[1].length;

          // store attribute
          if (token.type == TYPE_ATTRIBUTE)
            lastTag.attrs.push(token);
        }

        if (m[2] == '{')
        {
          if (token.type == TYPE_ELEMENT)
            state = REFERENCE;
          else
            state = BREAK_TAG_PARSE;

          break;
        }

        if (m[3]) // end tag declaration
        {
          parseTag = false;
          lastTag.end_ = pos;

          if (m[3] == '/>' ||
              (!lastTag.prefix && SINGLETON_TAG.test(lastTag.name)))
          {
            /** @cut */ if (m[3] != '/>')
            /** @cut */   result.warns.push('Tag <' + lastTag.name + '> doesn\'t closed explicit (use `/>` as tag ending)');

            lastTag = tagStack.pop();
          }
          else
          {
            // otherwise m[3] == '>'
            if (lastTag.prefix == 'b' && lastTag.name in TAG_IGNORE_CONTENT)
            {
              state = TAG_IGNORE_CONTENT[lastTag.name];
              break;
            }
          }

          state = TEXT;
          break;
        }

        if (m[2] == '=') // ATTRIBUTE_NAME_OR_END only
        {
          state = ATTRIBUTE_VALUE;
          break;
        }

        // m[2] == '\s+' next attr, state doesn't change
        token = {
          start_: pos,
          end_: pos,
          type: TYPE_ATTRIBUTE
        };
        state = ATTRIBUTE_NAME_OR_END;
        break;

      case COMMENT:
        token.value = source.substring(bufferPos, pos - 3);
        token.end_ = pos;
        state = TEXT;
        break;

      case REFERENCE:
        // add reference to token list name
        if (token.refs)
          token.refs.push(m[1]);
        else
          token.refs = [m[1]];

        // go next
        if (m[2] != '|') // m[2] == '}\s*'
        {
          if (token.type == TYPE_TEXT)
          {
            pos -= m[2].length - 1;
            token.value = source.substring(bufferPos, pos);
            token.end_ = pos;
            state = TEXT;
          }
          else if (token.type == TYPE_COMMENT)
          {
            state = COMMENT;
          }
          else if (token.type == TYPE_ATTRIBUTE && source[pos] == '=')
          {
            pos++;
            state = ATTRIBUTE_VALUE;
          }
          else // ATTRIBUTE || ELEMENT
          {
            token = {
              start_: pos,
              end_: pos,
              type: TYPE_ATTRIBUTE
            };
            state = ATTRIBUTE_NAME_OR_END;
          }
        }

        // continue to collect references
        break;

      case ATTRIBUTE_VALUE:
        token.value = m[1].replace(QUOTE_UNESCAPE, '"');
        token.end_ = startPos + m[1].length + 2;

        token = {
          start_: pos,
          end_: pos,
          type: TYPE_ATTRIBUTE
        };
        state = ATTRIBUTE_NAME_OR_END;

        break;

      case TAG_IGNORE_CONTENT.text:
      case TAG_IGNORE_CONTENT.style:
        lastTag.children.push({
          start_: startPos,
          end_: startPos + m[1].length,
          type: TYPE_TEXT,
          value: m[1]
        });

        lastTag = tagStack.pop();

        state = TEXT;
        break;

      default:
        throw 'Parser bug'; // Must never to be here; bug in parser otherwise
    }

    if (state == TEXT)
      textStateEndPos = pos;
  }

  if (textStateEndPos != pos)
    lastTag.children.push({
      start_: textStateEndPos,
      end_: pos,
      type: TYPE_TEXT,
      value: source.substring(textStateEndPos, pos)
    });

  // process attributes binding and join text tokens
  postProcessing(result);

  /** @cut */ if (lastTag.name)
  /** @cut */   result.warns.push('No close tag for <' + lastTag.name + '>');
  /** @cut */
  /** @cut */ if (!result.warns.length)
  /** @cut */   delete result.warns;

  result.templateTokens = true;

  return result;
};

module.exports = tokenize;
