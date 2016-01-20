var namespaceURI = {
  xlink: 'http://www.w3.org/1999/xlink',
  svg: 'http://www.w3.org/2000/svg'
};

function getTagNamespace(name){
  var colonIndex = name.indexOf(':');
  if (colonIndex != -1)
  {
    var prefix = name.substr(0, colonIndex);
    return namespaceURI[prefix];
  }
}

function getAttrNamespace(node, name){
  var colonIndex = name.indexOf(':');
  if (colonIndex != -1)
  {
    var prefix = name.substr(0, colonIndex);
    return namespaceURI[prefix] || node.lookupNamespaceURI(prefix);
  }
}

module.exports = {
  namespaceURI: namespaceURI,
  getTagNamespace: getTagNamespace,
  getAttrNamespace: getAttrNamespace
};
