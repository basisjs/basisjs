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

module.exports = {
  styleNamespaceIsolate: styleNamespaceIsolate,
  adoptStyles: adoptStyles,
  addStyle: addStyle
};
