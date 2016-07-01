var hasOwnProperty = Object.prototype.hasOwnProperty;
var consts = require('../const.js');
/** @cut */ var utils = require('./utils.js');
var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE_CLASS = consts.TYPE_ATTRIBUTE_CLASS;
var TOKEN_TYPE = consts.TOKEN_TYPE;
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var ATTR_VALUE_INDEX = consts.ATTR_VALUE_INDEX;
var styleNamespaceIsolate = {};

function adoptStyles(resources, prefix, includeToken){
  for (var i = 0, item; item = resources[i]; i++)
    if (item.type == 'style')
    {
      if (item.isolate !== styleNamespaceIsolate)
        item.isolate = prefix + item.isolate;
      if (!item.includeToken)
        item.includeToken = includeToken;
    }
}

function addStyle(template, token, src, isolatePrefix, namespace){
  var text = token.children[0];
  var url = src
    ? basis.resource.resolveURI(src, template.baseURI, '<b:style src=\"{url}\"/>')
    : basis.resource.virtual('css', text ? text.value : '', template.sourceUrl).url;

  /** @cut */ token.sourceUrl = template.sourceUrl;

  template.resources.push({
    type: 'style',
    url: url,
    isolate: isolatePrefix,
    token: token,
    includeToken: null,
    inline: src ? false : text || true,
    namespace: namespace
  });

  return url;
}

function applyStyleNamespaces(tokens, isolate){
  function processName(name){
    // add prefix only for `ns:name` and ignore global namespace `:name`
    if (name.indexOf(':') <= 0)
      return name;

    /** @cut */ var prefix = name.split(':')[0];
    /** @cut */ isolate.map[isolate.prefix + prefix] = prefix;

    return isolate.prefix + name;
  }

  function walk(tokens, offset){
    for (var i = offset, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];

      if (tokenType == TYPE_ELEMENT)
        walk(token, ELEMENT_ATTRIBUTES_AND_CHILDREN);

      if (tokenType === TYPE_ATTRIBUTE_CLASS)
      {
        var bindings = token[TOKEN_BINDINGS];
        var valueIndex = ATTR_VALUE_INDEX[tokenType];

        if (token[valueIndex])
          token[valueIndex] = token[valueIndex].replace(/\S+/g, processName);

        /** @cut */ if (token.valueLocMap)
        /** @cut */ {
        /** @cut */   var oldValueLocMap = token.valueLocMap;
        /** @cut */   token.valueLocMap = {};
        /** @cut */   for (var name in oldValueLocMap)
        /** @cut */     token.valueLocMap[processName(name)] = oldValueLocMap[name];
        /** @cut */ }

        if (bindings)
          for (var k = 0, bind; bind = bindings[k]; k++)
            bind[0] = processName(bind[0]);
      }
    }
  }

  walk(tokens, 0);
}

function isolateTokens(tokens, isolate, template/*, options*/){
  function processName(name){
    if (name.indexOf(':') == -1)
      return isolate + name;

    // don't resolve namespaced names if not template isolate mode
    if (!template)
      return name;

    var parts = name.split(':');

    // global namespace
    if (!parts[0])
      return parts[1];

    var namespace = hasOwnProperty.call(template.styleNSPrefix, parts[0]) ? template.styleNSPrefix[parts[0]] : false;

    // if namespace not found, no prefix and show warning
    if (!namespace)
    {
      /** @cut */ var isolatedPrefix = options.styleNSIsolateMap[parts[0]];
      /** @cut */ var oldPrefix = parts[0];
      /** @cut */ var fullName = arguments[1];
      /** @cut */ var loc = arguments[2];
      /** @cut */ if (fullName)
      /** @cut */ {
      /** @cut */   if (isolatedPrefix)
      /** @cut */     fullName = fullName.replace(oldPrefix, isolatedPrefix);
      /** @cut */   utils.addTemplateWarn(template, options, 'Namespace `' + (isolatedPrefix || oldPrefix) + '` is not defined: ' + fullName, loc);
      /** @cut */ }
      return false;
    }
    else
    {
      /** @cut */ namespace.used = true;
      return namespace.prefix + parts[1];
    }
  }

  function walk(tokens, offset){
    for (var i = offset, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];

      if (tokenType == TYPE_ELEMENT)
        walk(token, ELEMENT_ATTRIBUTES_AND_CHILDREN);

      if (tokenType == TYPE_ATTRIBUTE_CLASS)
      {
        var bindings = token[TOKEN_BINDINGS];
        var valueIndex = ATTR_VALUE_INDEX[tokenType];

        if (token[valueIndex])
          token[valueIndex] = token[valueIndex]
            .split(/\s+/)
            .map(function(name){
              return processName(name, name, token.valueLocMap ? token.valueLocMap[name] : null);
            })
            .filter(Boolean)
            .join(' ');

        if (bindings)
        {
          for (var j = 0, bind, prefix, removed; bind = bindings[j]; j++)
          {
            prefix = processName(bind[0], bind[0] + '{' + bind[1] + '}', bind.loc);

            if (prefix === false)
            {
              // prefix is false for non-resolved namespaced prefixes -> remove binding
              removed = true;
              bindings[j] = null;
            }
            else
              bind[0] = prefix;
          }

          if (removed)
          {
            bindings = bindings.filter(Boolean);
            token[TOKEN_BINDINGS] = bindings.length ? bindings : 0;
          }
        }

        /** @cut */ if (token.valueLocMap)
        /** @cut */ {
        /** @cut */   var oldValueLocMap = token.valueLocMap;
        /** @cut */   token.valueLocMap = {};
        /** @cut */   for (var name in oldValueLocMap)
        /** @cut */   {
        /** @cut */     var newKey = processName(name);
        /** @cut */     if (newKey)
        /** @cut */       token.valueLocMap[newKey] = oldValueLocMap[name];
        /** @cut */   }
        /** @cut */ }
      }
    }
  }

  /** @cut */ var options = arguments[3];
  walk(tokens, 0);
}

module.exports = {
  styleNamespaceIsolate: styleNamespaceIsolate,
  adoptStyles: adoptStyles,
  addStyle: addStyle,
  applyStyleNamespaces: applyStyleNamespaces,
  isolateTokens: isolateTokens
};
