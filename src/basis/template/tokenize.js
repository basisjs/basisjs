var consts = require('./const.js');
var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_TEXT = consts.TYPE_TEXT;
var TYPE_COMMENT = consts.TYPE_COMMENT;

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
var BREAK_TAG_PARSE = /^/g;
var SINGLETON_TAG = /^(area|base|br|col|command|embed|hr|img|input|link|meta|param|source)$/i;
var TAG_IGNORE_CONTENT = {
  text: /((?:.|[\r\n])*?)(?:<\/b:text>|$)/g,
  style: /((?:.|[\r\n])*?)(?:<\/b:style>|$)/g
};
var quoteUnescape = /\\"/g;

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
        token.value = m[1].replace(quoteUnescape, '"');
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

  /** @cut */ if (lastTag.name)
  /** @cut */   result.warns.push('No close tag for <' + lastTag.name + '>');
  /** @cut */
  /** @cut */ if (!result.warns.length)
  /** @cut */   delete result.warns;

  result.templateTokens = true;

  return result;
};

module.exports = tokenize;
