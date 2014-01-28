
  basis.require('basis.ua');
  basis.require('basis.dom');


 /**
  * @namespace basis.xml
  */

  var namespace = this.path;


  //
  // import names
  //

  var DOM = basis.dom;
  var Class = basis.Class;
  var Browser = basis.ua;

  var extend = basis.object.extend;

  var ELEMENT_NODE = DOM.ELEMENT_NODE;
  var ATTRIBUTE_NODE = DOM.ATTRIBUTE_NODE;
  var TEXT_NODE = DOM.TEXT_NODE;


  //
  // main part
  //

  /*
   *  QName
   */

  var QName = Class(null, {
    className: namespace + '.QName',
    init: function(localpart, namespace, prefix){
      this.localpart = localpart;
      this.namespace = namespace || '';
      this.prefix = prefix || '';
    },
    toString: function(){
      return this.prefix ? this.prefix + ':' + this.localpart : this.localpart;
    }
  });

  /*
   *  Constants
   */

  var XSD_NAMESPACE = String('http://www.w3.org/2001/XMLSchema');
  var XSI_NAMESPACE = String('http://www.w3.org/2001/XMLSchema-instance');
  var NS_NAMESPACE  = String('http://www.w3.org/2000/xmlns/');

  var XSI_NIL_LOCALPART = 'nil';

  var XMLNS = {
    PREFIX: 'xmlns',
    NAMESPACE: NS_NAMESPACE,
    BAD_SUPPORT: Browser.test('webkit528.16-') || Browser.test('opera9-')
                          // !!!todo: make a test like
                          // createElementNS(document, 'test', SOAP_NAMESPACE).attributes.length == 0;
  };

  /*
   *  document
   */

  var XMLProgId = 'native';
  var isNativeSupport = true;

  var createDocument = (function(){
    var implementation = document.implementation;
    if (implementation && implementation.createDocument)
    {
      return function(namespace, nodename){
        var result = implementation.createDocument(namespace, nodename, null);
        if (result.charset && result.charset != document.charset)
          result.charset = document.charset;
        return result;
      };
    }

    if (window.ActiveXObject)
    {
      // http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
      var progId = ['MSXML2.DOMDocument.6.0', 'MSXML2.DOMDocument.3.0'];

      for (var i = 0; i < progId.length; i++)
        try {
          if (new ActiveXObject(progId[i]))
          {
            XMLProgId = progId[i];
            isNativeSupport = false;
            return function(namespace, nodename){
              var xmlDocument = new ActiveXObject(XMLProgId);
              xmlDocument.documentElement = createElementNS(xmlDocument, nodename, namespace);
              return xmlDocument;
            };
          }
        } catch(e) {}
    }

    throw new Error('Browser doesn\'t support for XML document!');

  })();


  /*
   *  element
   */

  function createElementNS(document, nodename, namespace){
    if (namespace)
      return isNativeSupport
               ? document.createElementNS(namespace, nodename)
               : document.createNode(1, nodename, namespace);
    else
      return document.createElement(nodename);
  }


  /*
   *  attribute
   */

  function createAttributeNS(document, nodename, namespace, value){
    var attr;
    if (namespace)
      attr = isNativeSupport
               ? document.createAttributeNS(namespace, nodename)
               : document.createNode(2, nodename, namespace);
    else
      attr = document.createAttribute(nodename);

    attr.nodeValue = value;
    return attr;
  }

  function setAttributeNodeNS(element, attr){
    return element.setAttributeNodeNS
             ? element.setAttributeNodeNS(attr)
             : element.setAttributeNode(attr);
  }

  /*function removeAttributeNodeNS(element, attr){
    return element.removeAttributeNodeNS
             ? element.removeAttributeNodeNS(attr)
             : element.removeAttributeNode(attr);
  }*/

  function addNamespace(element, prefix, namespace){
    setAttributeNodeNS(
      element,
      createAttributeNS(
        element.ownerDocument,
        XMLNS.PREFIX + (prefix ? ':' + prefix : ''),
        XMLNS.NAMESPACE,
        namespace
      )
    );
  }

  /*
   *  text
   */

  function createText(document, value){
    return document.createTextNode(String(value));
  }

  /*
   *  CDATA
   */

  function createCDATA(document, value){
    return document.createCDATASection(value);
  }

  //
  // XML -> Object
  //

 /**
  * Converting xml tree to javascript object representation.
  * @function
  * @param {Node} node
  * @param {object} mapping
  * @return {object}
  */
  function XML2Object(node, mapping){  // require for refactoring
    var nodeType = node.nodeType;
    var attributes = node.attributes;
    var firstChild = node.firstChild;

    if (!firstChild)
    {
      var firstAttr = attributes && attributes[0];
      if (nodeType == ELEMENT_NODE)
      {
        if (!firstAttr)
          return '';

        // test for <node xsi:nil="true"/>
        if (attributes.length == 1
            && (firstAttr.baseName || firstAttr.localName) == XSI_NIL_LOCALPART
            && firstAttr.namespaceURI == XSI_NAMESPACE)
          return null;
      }
      else
      {
        if (!firstAttr)
          return null;
      }
    }
    else
    {
      // single child node and not an element -> return child nodeValue
      if (firstChild.nodeType != ELEMENT_NODE && firstChild === node.lastChild)
        return firstChild.nodeValue;
      else
        if (firstChild !== node.lastChild && firstChild.nodeType == TEXT_NODE)
        {
          var isSeparatedTextNode = true;
          var result = '';
          var cursor = firstChild;
          do
          {
            if (cursor.nodeType !== TEXT_NODE)
            {
              isSeparatedTextNode = false;
              break;
            }
            result += cursor.nodeValue;
          }
          while (cursor = cursor.nextSibling);

          if (isSeparatedTextNode)
            return result;
        }
    }

    var result = {};
    var nodes = [];
    var childNodesCount = 0;
    var value;
    var cursor;
    var object;
    var name;
    var isElement;
    var map;

    if (cursor = firstChild)
    {
      do
      {
        childNodesCount = nodes.push(cursor);
      }
      while (cursor = cursor.nextSibling);
    }

    if (attributes)
      for (var i = 0, attr; attr = attributes[i]; i++)
        nodes.push(attr);

    if (!mapping)
      mapping = {};

    for (var i = 0, child; child = nodes[i]; i++)
    {
      name = child.nodeName;
      isElement = i < childNodesCount;
      map = mapping[name];

      // fetch value
      if (isElement)
      {
        value = XML2Object(child, mapping);
      }
      else
      {
        if (name == 'xmlns')
          continue;

        value = child.nodeValue;
      }

      // mapping keys
      while (map)
      {
        if (map.storeName)
          value[map.storeName] = name;

        if (map.rename)
        {
          name = map.rename;
          map = mapping[name];
        }
        else
        {
          if (map.format)
            value = map.format(value);

          if (!result[name] && map.forceArray)
            value = [value];

          break;
        }
      }

      // store result
      if (name in result)
      {
        if ((object = result[name]) && object.push)
          object.push(value);
        else
          result[name] = [object, value];
      }
      else
        result[name] = value;
    }

    return result;
  }

  //
  // Object -> XML
  //

  function isPrimitiveObject(value){
    return typeof value == 'string'   || typeof value == 'number' ||
           typeof value == 'function' || typeof value == 'boolean' ||
           value.constructor === Date  || value.constructor === RegExp;
  }

 /**
  * @function
  * @param {Document} document
  * @param {string} nodeName
  * @param {string=} namespace
  * @param {object|string} content
  */
  function Object2XML(document, nodeName, namespace, content){
    if (String(nodeName).charAt(0) == '@')
    {
      return content == null
               ? content
               : createAttributeNS(document, nodeName.substr(1), /*namespace*/ '', String(content));
    }
    else
    {
      var result = createElementNS(
                     document,
                     nodeName.toString(),
                     (content && content.xmlns) || nodeName.namespace || namespace
                   );
      if (typeof content == 'undefined' || content === null)
      {
        setAttributeNodeNS(
          result,
          createAttributeNS(document,
            XSI_NIL_LOCALPART,
            XSI_NAMESPACE,
            'true'
          )
        );
      }
      else
      {
        if (isPrimitiveObject(content))
        {
          result.appendChild(createText(document, content));
        }
        else
        {
          var ns = content.xmlns || namespace;

          if (content.xmlns && XMLNS.BAD_SUPPORT)
            addNamespace(result, '', ns);

          for (var prop in content)
          {
            var value = content[prop];

            if (prop == 'xmlns' || typeof value == 'function')
              continue;

            if (value && Array.isArray(value))
            {
              for (var i = 0; i < value.length; i++)
                result.appendChild(Object2XML(document, prop, ns, value[i]));
            }
            else
            {
              if (value && typeof value == 'object' && value.toString !== Object.prototype.toString)
                value = value.toString();

              var node = Object2XML(document, prop, ns, value);
              if (node)
                if (node.nodeType == ATTRIBUTE_NODE)
                  setAttributeNodeNS(result, node);
                else
                  result.appendChild(node);
            }
          }
        }
      }
      return result;
    }
  }

  function getElementsByTagNameNS(element, name, namespace){
    if (element.getElementsByTagNameNS)
      return element.getElementsByTagNameNS(namespace, name);

    var result = [];
    element.ownerDocument.setProperty('SelectionNamespaces', 'xmlns:x="' + namespace + '"');
    var nodes = element.selectNodes('//x:' + name);

    for (var i = 0, node; node = nodes[i++];)
      if (node.namespaceURI == namespace)
        result.push(node);

    return result;
  }

  //
  // XML -> string
  //

  function XML2String(node){
    // modern browsers feature
    if (typeof XMLSerializer != 'undefined')
      return (new XMLSerializer()).serializeToString(node);

    // old IE feature
    if (typeof node.xml == 'string')
      return node.xml;

    // other browsers
    if (node.nodeType == DOM.DOCUMENT_NODE)
      node = node.documentElement;

    return DOM.outerHTML(node);
  }


  //
  // export names
  //

  module.exports = {
    NAMESPACE: {
      XMLShema: XSD_NAMESPACE,
      XMLShemaInstance: XSI_NAMESPACE,
      Namespace: NS_NAMESPACE
    },
    XMLNS: XMLNS,
    QName: QName,
    //XMLElement: XMLElement,
    getElementsByTagNameNS: getElementsByTagNameNS,
    addNamespace: addNamespace,
    createDocument: createDocument,
    createElementNS: createElementNS,
    createAttributeNS: createAttributeNS,
    setAttributeNodeNS: setAttributeNodeNS,
    //removeAttributeNodeNS: removeAttributeNodeNS,
    createText: createText,
    createCDATA: createCDATA,
    XML2Object: XML2Object,
    XML2String: XML2String,
    Object2XML: Object2XML
  };
