var consts = require('basis.template.const');
var convertToRange = require('basis.utils.source').convertToRange;
var declToken = new basis.Token();

var colors = [
  'rgb(234, 196, 247)',
  'rgb(182, 207, 182)',
  'rgb(240, 230, 162)',
  'rgb(247, 196, 196)',
  'rgb(196, 211, 247)',
  'rgb(208, 247, 196)',
  'rgb(247, 224, 196)',
  'rgb(196, 236, 247)'
];

var ColorMap = basis.Class.create({}, {
  init: function(sources){
    this.sources = [];
    this.colors = [];

    if (Array.isArray(sources))
      sources.forEach(this.get, this);
  },

  get: function(source, fallback){
    var sourceIdx = this.sources.indexOf(source);

    if (sourceIdx == -1)
    {
      if (fallback)
        return fallback;

      sourceIdx = this.sources.push(source) - 1;
      this.colors.push(colors[this.colors.length]);
    }

    return this.colors[sourceIdx];
  }
});

function getTokenName(token){
  return (token.prefix ? token.prefix + ':' : '') + token.name;
}

function getTokenAttrs(token){
  var result = {};

  if (token.attrs)
    for (var i = 0, attr; attr = token.attrs[i]; i++)
      result[getTokenName(attr)] = attr;

  return result;
}

function escapeHtml(str){
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

function buildHtmlTree(tokens, parent, colorMap, offset){
  function expression(binding){
    return binding[1].map(function(sb){
      return typeof sb == 'number' ? '<span class="refs">{' + this[sb] + '}</span>' : sb;
    }, binding[0]).join('');
  }

  function markSource(loc, str){
    loc = loc ? loc.replace(/:\d+:\d+$/, '') : null;
    var color = loc != null ? colorMap.get(loc) : 'white';

    return color
      ? '<span style="background: ' + color + '">' + str + '</span>'
      : str;
  }

  function setEventAttribute(eventName, actions, token){
    setAttribute('event-' + eventName, actions, token);
  }

  function setAttribute(name, value, token){
    var bindings = token[consts.TOKEN_TYPE] != consts.TYPE_ATTRIBUTE_EVENT ? token[consts.TOKEN_BINDINGS] : 0;

    if (bindings)
      switch (name)
      {
        case 'class':
          if (value && token.valueLocMap)
            value = value.split(/(\s+)/).map(function(name){
              return /^\S/.test(name) ? markSource(token.valueLocMap[name], name) : name;
            }).join('');

          value = (value ? value + ' ' : '') + bindings.map(function(b){
            return markSource(b.loc, b[0] + '<span class="refs">{' + b[1] + '}</span>');
          }).join(' ');
          break;

        case 'style':
          value = (value ? value + ' ' : '') + bindings.map(function(b){
            return b[2] + ': ' + expression(b);
          }).join('; ');
          break;

        default:
          value = expression(bindings);
      }

    addToResult(result.attrs, token, name + (value ? '="' + value + '"' : ''));
  }

  function refs(token){
    return token[consts.TOKEN_REFS] ? '<span class="refs">{' + token[consts.TOKEN_REFS].join('|') + '}</span>' : '';
  }

  function addToResult(array, token, value){
    array.push(markSource(token.loc, value));
  }

  if (!colorMap)
    colorMap = new ColorMap();

  var result = {
    attrs: [],
    children: [],
    colorMap: colorMap
  };

  for (var i = offset || 0, token; token = tokens[i]; i++)
  {
    switch (token[consts.TOKEN_TYPE])
    {
      case consts.TYPE_ELEMENT:
        var tagName = token[consts.ELEMENT_NAME];

        // precess for children and attributes
        var res = buildHtmlTree(token, true, colorMap, consts.ELEMENT_ATTRIBUTES_AND_CHILDREN);

        // add to result
        var html = '&lt;' + tagName + refs(token);

        if (res.attrs.length)
          html += ' ' + res.attrs.join(' ');

        if (!res.children.length)
          html += '/>';
        else
          html += '>\n' +
            '  ' + res.children.join('\n').replace(/\n/g, '\n  ') + '\n' +
            '&lt;/' + tagName + '>';

        addToResult(result.children, token, html);

        break;

      case consts.TYPE_CONTENT:
        var res = buildHtmlTree(token, true, colorMap, consts.CONTENT_CHILDREN);
        var html;

        if (!res.children.length)
          html = '&lt;b:content/>';
        else
          html = '&lt;b:content>\n' +
            '  ' + res.children.join('\n').replace(/\n/g, '\n  ') + '\n' +
            '&lt;/b:content>';

        addToResult(result.children, token, html);

        break;

      case consts.TYPE_ATTRIBUTE:
        var attrName = token[consts.ATTR_NAME];
        var attrValue = escapeHtml(token[consts.ATTR_VALUE]);
        var eventName = attrName.replace(/^event-/, '');

        if (eventName != attrName)
          setEventAttribute(eventName, attrValue, token);
        else
          setAttribute(attrName, attrValue || '', token);

        break;

      case consts.TYPE_ATTRIBUTE_CLASS:
      case consts.TYPE_ATTRIBUTE_STYLE:
        var attrValue = escapeHtml(token[consts.ATTR_VALUE - 1]);

        if (attrValue || token[consts.TOKEN_BINDINGS])
          setAttribute(consts.ATTR_NAME_BY_TYPE[token[consts.TOKEN_TYPE]], attrValue || '', token);

        break;

      case consts.TYPE_ATTRIBUTE_EVENT:
        setEventAttribute(token[1], token[2] || token[1], token);
        break;

      case consts.TYPE_COMMENT:
        addToResult(
          result.children,
          token,
          '&lt;!--' +
          (token[consts.COMMENT_VALUE] ? escapeHtml(token[consts.COMMENT_VALUE]) : refs(token)) +
          '-->'
        );
        break;

      case consts.TYPE_TEXT:
        addToResult(
          result.children,
          token,
          token[consts.TEXT_VALUE]
            ? escapeHtml(token[consts.TEXT_VALUE])
            : refs(token) || (token[consts.TOKEN_BINDINGS] ? '{' + token[consts.TOKEN_BINDINGS] + '}' : '')
        );
        break;
    }
  }

  return result;
};

function addRange(ranges, range){
  var start = range[0];
  var end = range[1];
  var existsRange = ranges[start];

  if (!existsRange)
  {
    ranges[start] = range;
    for (var i = start - 1; i >= 0; i--)
      if (i in ranges)
      {
        var prevRange = ranges[i];

        if (prevRange[1] < start)
        {
          // no intersection, nothing to do here since everything is ok
          // 1: xxxxx
          // 2:      yyyyy
          // =
          //    xxxxxyyyyy
          break;
        }

        if (prevRange[1] <= end)
        {
          // intersection -> change previous range
          // 1: xxxxxxx
          // 2:      yyyyy
          // =
          //    xxxxxyyyyy
          prevRange[1] = start;
        }
        else if (prevRange[1] > end)
        {
          // intersection -> split previous range
          // 1: xxxxxxxxxxxxx
          // 2:      yyyyy
          // =
          //    xxxxxyyyyyxxx
          addRange(ranges, [end, prevRange[1], prevRange[2]]);
          prevRange[1] = start;
        }
        break;
      }
  }
  else
  {
    // new range on the same position as existing one
    var length = end - start;
    var existsLength = existsRange[1] - existsRange[0];

    if (length > existsLength)
    {
      // 1: xxxxx
      // 2: yyyyyyyy
      // =
      //    xxxxx
      //         yyyy
      range[0] += existsLength;
      addRange(ranges, range);
    }
    else if (length < existsLength)
    {
      // 1: xxxxxxxx
      // 2: yyyyy
      // =
      //         xxx
      //    yyyyy
      ranges[start] = range;
      existsRange[0] += length;
      addRange(ranges, existsRange);
    }
    else
    {
      // 1: xxxxx
      // 2: yyyyy
      // =
      //    yyyyy
      ranges[start] = range;
    }
  }

  return ranges;
}

function insertPoint(ranges, point){
  var start = point[0];

  for (var i = start; i >= 0; i--)
    if (i in ranges)
    {
      var range = ranges[i];

      point[2] = range[2];

      if (range[1] > start)
      {
        addRange(ranges, [start, range[1], range[2]]);
        range[1] = start;
      }

      break;
    }
}

function rangeSorting(a, b){
  return a[0] - b[0] || (a[1] - a[0]) - (b[1] - b[0]);
}

var declSourceToken = declToken.as(function(decl){
  if (decl)
  {
    var colorMap = new ColorMap([decl.sourceUrl].concat(decl.deps.map(function(dep){
      return dep.url;
    })).filter(Boolean));
    var source = buildHtmlTree(decl.tokens, false, colorMap).children.join('\n');
    var root = {
      token: null,
      src: null,
      resource: basis.object.extend(new basis.Token(decl.tokens.source_ || ''), {
        url: decl.sourceUrl || ''
      }),
      nested: decl.includes
    };

    var sourceTree = [root].map(function processInclude(inc){
      var resource = inc.resource;
      var source = String((resource.bindingBridge ? resource.bindingBridge.get(resource) : resource) || '');
      var warnFilter = inc === root ? undefined : inc.token;

      var ranges = [
          [0, source.length, colorMap.get(resource.url || '', 'red')]
        ]
        .concat(
          decl.styles.filter(function(style){
            return style.includeToken === inc.token && !style.resource && !style.namespace;
          }).map(function(style){
            return style.styleToken.range;
          })
        )
        .concat(
          decl.removals.filter(function(removal){
            return removal.includeToken === inc.token && removal.token.sourceToken;
          }).map(function(removal){
            return removal.node.sourceToken.range;
          })
        )
        .concat(
          inc.nested.map(function(item){
            return getTokenAttrs(item.token).src.valueRange.concat(
              colorMap.get(item.resource.url || item.resource)
            );
          })
        )
        .sort(rangeSorting)
        .reduce(addRange, {});

      var warnings = (decl.warns || [])
        .filter(function(warn){
          return warn.source === warnFilter;
        })
        .reduce(function(map, warn){
          var parts = (warn.loc || '').split(':');
          var point = { line: Number(parts[1]), column: Number(parts[2]) };
          var range = convertToRange(source, point, point);
          var record = range.concat(
            '',
            String(warn),
            !warn.loc || warn.loc.charAt(0) === ':' ? '' : warn.loc
          );

          insertPoint(ranges, record);

          if (!map[range[0]])
            map[range[0]] = [record];
          else
            map[range[0]].push(record);

          return map;
        }, {});

      var markup = [];

      for (var i = 0; i < source.length; i++)
      {
        if (warnings[i])
          markup.push.apply(markup, warnings[i]);

        if (ranges[i])
        {
          var range = ranges[i];
          var trailingSpaces = source.substring(range[0], range[1]).match(/\n\s+$/);

          if (trailingSpaces)
            range[1] -= trailingSpaces[0].length;

          // don't add zero-length ranges
          if (range[0] !== range[1])
            markup.push(range);
        }
      }

      return {
        data: {
          url: resource.url,
          content: source,
          color: colorMap.get(resource.url || '', 'red'),
          warnings: warnings,
          markup: markup
        },
        childNodes: inc.nested.map(processInclude)
      };
    });

    return JSON.stringify({
      source: source,
      tree: sourceTree
    });
  }

  return '{}';
});

module.exports = {
  decl: declToken,
  source: declSourceToken
};
