var hasOwnProperty = Object.prototype.hasOwnProperty;
/** @cut */ var utils = require('./utils.js');
var walk = require('./ast.js').walk;
var consts = require('../const.js');
var TYPE_ATTRIBUTE_CLASS = consts.TYPE_ATTRIBUTE_CLASS;
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

  walk(tokens, function(type, node){
    if (type !== TYPE_ATTRIBUTE_CLASS)
      return;

    var bindings = node[TOKEN_BINDINGS];
    var valueIndex = ATTR_VALUE_INDEX[type];

    if (node[valueIndex])
      node[valueIndex] = node[valueIndex].replace(/\S+/g, processName);

    /** @cut */ if (node.valueLocMap)
    /** @cut */ {
    /** @cut */   var oldValueLocMap = node.valueLocMap;
    /** @cut */   node.valueLocMap = {};
    /** @cut */   for (var name in oldValueLocMap)
    /** @cut */     node.valueLocMap[processName(name)] = oldValueLocMap[name];
    /** @cut */ }

    if (bindings)
      for (var k = 0, bind; bind = bindings[k]; k++)
        bind[0] = processName(bind[0]);
  });
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

  /** @cut */ var options = arguments[3];

  walk(tokens, function(type, node){
    if (type !== TYPE_ATTRIBUTE_CLASS)
      return;

    var bindings = node[TOKEN_BINDINGS];
    var valueIndex = ATTR_VALUE_INDEX[type];

    if (node[valueIndex])
      node[valueIndex] = node[valueIndex]
        .split(/\s+/)
        .map(function(name){
          return processName(name, name, node.valueLocMap ? node.valueLocMap[name] : null);
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
        node[TOKEN_BINDINGS] = bindings.length ? bindings : 0;
      }
    }

    /** @cut */ if (node.valueLocMap)
    /** @cut */ {
    /** @cut */   var oldValueLocMap = node.valueLocMap;
    /** @cut */   node.valueLocMap = {};
    /** @cut */   for (var name in oldValueLocMap)
    /** @cut */   {
    /** @cut */     var newKey = processName(name);
    /** @cut */     if (newKey)
    /** @cut */       node.valueLocMap[newKey] = oldValueLocMap[name];
    /** @cut */   }
    /** @cut */ }
  });
}

module.exports = {
  styleNamespaceIsolate: styleNamespaceIsolate,
  adoptStyles: adoptStyles,
  addStyle: addStyle,
  applyStyleNamespaces: applyStyleNamespaces,
  isolateTokens: isolateTokens
};
