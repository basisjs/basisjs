var namespaceURI = {
  xlink: 'http://www.w3.org/1999/xlink',
  svg: 'http://www.w3.org/2000/svg'
};

function getNamespace(name, node){
  if (!name)
    return;

  var colonIndex = name.indexOf(':');
  if (colonIndex != -1)
  {
    var prefix = name.substr(0, colonIndex);
    return namespaceURI[prefix] || node && node.lookupNamespaceURI(prefix);
  }
}

module.exports = {
  namespaceURI: namespaceURI,
  getNamespace: getNamespace
};
