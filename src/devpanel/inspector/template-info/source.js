var consts = require('basis.template.const');
var Node = require('basis.ui').Node;
var fileAPI = require('../../api/file.js');
var declToken = new basis.Token();
var declCodeToken = new basis.Token('');

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

var buildHtml = function(tokens, parent, colorMap){
  function expression(binding){
    return binding[1].map(function(sb){
      return typeof sb == 'number' ? '<span class="refs">{' + this[sb] + '}</span>' : sb;
    }, binding[0]).join('');
  }

  function escapeHtml(str){
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;');
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

    addToResult(result.attrs, token, name + '="' + value + '"');
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

  for (var i = parent ? 4 : 0, token; token = tokens[i]; i++)
  {
    switch (token[consts.TOKEN_TYPE])
    {
      case consts.TYPE_ELEMENT:
        var tagName = token[consts.ELEMENT_NAME];

        // precess for children and attributes
        var res = buildHtml(token, true, colorMap);

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

      case consts.TYPE_ATTRIBUTE:
        var attrName = token[consts.ATTR_NAME];
        var attrValue = escapeHtml(token[consts.ATTR_VALUE]);
        var eventName = attrName.replace(/^event-/, '');

        if (eventName != attrName)
        {
          setEventAttribute(eventName, attrValue, token);
        }
        else
        {
          if (attrValue || token[consts.TOKEN_BINDINGS])
            setAttribute(attrName, attrValue || '', token);
        }

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

var view = new Node({
  decl: declToken,
  template: resource('./template/source/main.tmpl'),
  binding: {
    code: declCodeToken
  },
  childClass: {
    childClass: basis.Class.SELF,
    template: resource('./template/source/template.tmpl'),
    binding: {
      url: 'data:',
      caption: {
        events: 'update',
        getter: function(node){
          return node.data.url || '[inline]';
        }
      },
      content: function(node){
        function wrap(color, str){
          if (!str)
            return '';

          str = str.replace(/</g, '&lt;');

          return color
            ? '<span style="background: ' + color + '">' + str + '</span>'
            : str;
        }

        var content = node.data.content;
        var ranges = node.data.ranges;
        var color = node.data.color;
        var offset = 0;
        var res = '';

        for (var i = 0, range; range = ranges[i]; i++)
        {
          res +=
            wrap(color, content.substring(offset, range[0])) +
            wrap(range[2], content.substring(range[0], range[1]));

          offset = range[1];
        }

        return res + wrap(color, content.substring(offset));
      },
      color: 'data:'
    },
    action: {
      openFile: function(){
        if (this.data.url)
          fileAPI.openFile(this.data.url);
      }
    }
  }
});

declToken.attach(function(decl){
  var children = [];
  var code = '';

  if (decl)
  {
    var colorMap = new ColorMap([decl.sourceUrl].concat(decl.deps.map(function(dep){
      return dep.url;
    })).filter(Boolean));
    var bb = buildHtml(decl.tokens, false, colorMap);
    var root = {
      token: null,
      src: null,
      resource: basis.object.extend(new basis.Token(decl.tokens.source_), {
        url: decl.sourceUrl || ''
      }),
      nested: decl.includes
    };

    code = bb.children.join('\n');
    children = [root].map(function processInclude(inc){
      var resource = inc.resource;
      return {
        data: {
          url: resource.url,
          content: resource.bindingBridge ? resource.bindingBridge.get(resource) : resource,
          color: this.colorMap.get(resource.url || '', 'red'),
          ranges: []
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
                return removal.token.sourceToken.range;
              })
            )
            .concat(
              inc.nested.map(function(item){
                return getTokenAttrs(item.token).src.valueRange.concat(
                  this.colorMap.get(item.resource.url || item.resource)
                );
              }, this)
            )
            .sort(function(a, b){
              return a[0] - b[0];
            })
        },
        childNodes: inc.nested.map(processInclude, this)
      };
    }, bb);
  }

  declCodeToken.set(code);
  view.setChildNodes(children);

}, view);

module.exports = view;
