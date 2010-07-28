/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    // namespace

    var namespace = 'Basis.XML';

    // import names

    var DOM = Basis.DOM;
    var Class = Basis.Class;
    var Browser = Basis.Browser;

    var extend = Object.extend;

    var ELEMENT_NODE = DOM.ELEMENT_NODE;
    var ATTRIBUTE_NODE = DOM.ATTRIBUTE_NODE;

    /*
     *  QName
     */

    var QName = Class(null, {
      className: namespace + '.QName',
      init: function(localpart, namespace, prefix){
        this.localpart = localpart;
        if (namespace)
          this.namespace = namespace;
        if (prefix)
          this.prefix = prefix;
      },
      toString: function(){
        return this.prefix ? this.prefix + ':' + this.localpart : this.localpart;
      },
      equals: function(obj){
        return (obj instanceof QName &&
                obj.localpart == this.localpart &&
                obj.namespace == this.namespace);
      }
    });

    extend(QName, {
      fromElement: function(element){
        return new QName(
          element.baseName || element.localName,
          element.namespaceURI,
          element.prefix
        );
      },
      createDocument: function(qname){
        return createDocument(qname.namespace, qname);
      },
      createElement: function(document, qname){
        return createElementNS(document, qname, qname.namespace);
      },
      createAttribute: function(document, qname, value){
        return createAttributeNS(document, qname, qname.namespace, value);
      }
    });

    /*
     *  Constants
     */

    var XMLNS = {
      PREFIX: 'xmlns',
      NAMESPACE: 'http://www.w3.org/2000/xmlns/',
      BAD_SUPPORT: Browser.test('webkit528.16-') || Browser.test('opera9-')
                            // !!!todo: make a test like
                            // createElementNS(document, 'test', SOAP_NAMESPACE).attributes.length == 0;
    };

    var XSD = {
      PREFIX: 'xsd',
      NAMESPACE: 'http://www.w3.org/2001/XMLSchema'
    };

    var XSI = {
      PREFIX: 'xsi',
      NAMESPACE: 'http://www.w3.org/2001/XMLSchema-instance'
    };

    var XSI_NIL = new QName('nil', XSI.NAMESPACE, XSI.PREFIX);

    /*
     * XML Element wraper
     */

    var XMLElement = Class(null, {
      className: namespace + '.XMLElement',

      init: function(element){
        this.setElement(element);
      },
      setElement: function(element){
        this.element = element;
      },
      qname: function(){
        return QName.fromElement(this.element);
      },
      setAttribute: function(qname, value){
        var attr = QName.createAttribute(this.element.ownerDocument, qname, value);
        if (this.element.setAttributeNodeNS)
          this.element.setAttributeNodeNS(attr);
        else
          this.element.setAttributeNode(attr);
      },
      getAttribute: function(qname){
        for (var i = 0, attr; attr = this.element.attributes[i++];)
        {
          if (qname.equals(QName.fromElement(attr)))
            return attr.nodeValue;
        }
        return null;
      },
      hasAttribute: function(qname){
        for (var i = 0, attr; attr = this.element.attributes[i++];)
        {
          if (qname.equals(QName.fromElement(attr)))
            return true;
        }
        return false;
      },
      setValue: function(value, cdata){
        var createFunction = cdata ? createCDATA : createText;
        this.element.appendChild(createFunction(this.element.ownerDocument, value));
      },
      getValue: function(){ // is correct?
        return this.element.firstChild.nodeValue;
      },
      clear: function(){
        DOM.clear(this.element);
      },
      createChild: function(qname){
        var child = QName.createElement(this.element.ownerDocument, qname);
        this.element.appendChild(child);
        return new XMLElement(child);
      },
      getChildren: function(qname){
        return getElementsByQName(this.element, qname).map(function(element){
          return new XMLElement(element)
        });
      },
      destroy: function(){
        this.inherit();
      }
    });

    /*
     *  document
     */
    var XMLProgID;
    var createDocument = function(){
      var implementation = document.implementation
      if (implementation && implementation.createDocument)
      {
        XMLProgID = 'native';
        return function(namespace, nodename){ 
          return implementation.createDocument(namespace, nodename, null);
        };
      }

      if (window.ActiveXObject)
      {
        // http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
        var progID = ["MSXML2.DOMDocument.6.0", "MSXML2.DOMDocument.3.0"];

        for (var i = 0; i < progID.length; i++)
          try { 
            if (new ActiveXObject(progID[i]))
            {
              XMLProgID = progID[i];
              return function(namespace, nodename){
                var xmlDocument = new ActiveXObject(XMLProgID);
                xmlDocument.documentElement = createElementNS(xmlDocument, nodename, namespace);
                return xmlDocument;
              };
            }
          } catch(e) {}
      }

      return Function.$null;
    }();

    if (createDocument === Function.$null)
      throw new Error('Browser doesn\'t support for XML document!');

    /*
     *  element
     */

    function createElementNS(document, nodename, namespace){
      if (namespace)
      {
        if (XMLProgID == 'native')
          return document.createElementNS(namespace, nodename);
        else
          return document.createNode(1, nodename, namespace);
      }
      else
      {
        if (XMLProgID == 'native')
          return document.createElement(nodename);
        else
          return document.createNode(1, nodename);
      }
    };

    /*
     *  attribute
     */

    function createAttribute(document, nodename, value){
      var attr = XMLProgID == 'native'
                   ? document.createAttribute(nodename)
                   : document.createNode(2, nodename);

      attr.nodeValue = value;
      return attr;
    }

    function createAttributeNS(document, nodename, namespace, value){
      var attr = XMLProgID == 'native'
                   ? document.createAttributeNS(namespace, nodename)
                   : document.createNode(2, nodename, namespace);

      attr.nodeValue = value;
      return attr;
    }

    function setAttributeNodeNS(element, attr){
      return element.setAttributeNodeNS ? element.setAttributeNodeNS(attr) : element.setAttributeNode(attr);
    }

    function removeAttributeNodeNS(element, attr){
      return element.removeAttributeNodeNS ? element.removeAttributeNodeNS(attr) : element.removeAttributeNode(attr);
    }

    function addNamespace(element, prefix, namespace){
      setAttributeNodeNS(element, createAttributeNS(element.ownerDocument, XMLNS.PREFIX + (prefix ? ':' + prefix : ''), XMLNS.NAMESPACE, namespace));
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
    };

    /*
     *  tools
     */

    function XML2Object(element, mapping){  // require for refactoring
      var childNodes = element.childNodes;
      var attributes = element.attributes;
      var len = childNodes.length;
      mapping = mapping || {};

      if (len == 0 && element.nodeType != ELEMENT_NODE && (!attributes || attributes.length == 0))
        return null;
      if (len == 0 && element.nodeType == ELEMENT_NODE)  
      {
        if (attributes.length == 0)
          return '';

        // test for <node xsi:nil="true"/>
        if (attributes.length == 1 && XSI_NIL.equals(QName.fromElement(attributes[0])))
          return null;
      }

      if (len == 1 && childNodes[0].nodeType != ELEMENT_NODE)
        return childNodes[0].nodeValue;

      var result = {};
      var nodes = Array.from(childNodes).concat(Array.from(attributes));
      for (var i = 0; i < nodes.length; i++)
      {
        var child = nodes[i];
        var name  = child.tagName || child.nodeName;

        if (name == undefined || (name == 'xmlns' && child.nodeType == ATTRIBUTE_NODE))
          continue;

        var obj = child.nodeType == ATTRIBUTE_NODE 
                    ? child.nodeValue              // Opera's attributes haven't childNodes
                    : XML2Object(child, mapping);  // ! recursion

        if (mapping[name])
        {
          var realName = name;

          if (mapping[name].storeName)
            obj[mapping[name].storeName] = realName;

          if (mapping[name].rename)
            name = mapping[name].rename;

          if (!result[name] && mapping[realName].forceArray) // ?!
            result[name] = new Array();
        }

        var node = result[name];
        if (node)
        {
          if (node.constructor != Array)
            node = result[name] = [node];
          node.push(obj);
        }
        else
          result[name] = obj;

      }
      return result;
    };

    function isPrimitiveObject(value){
      return typeof value == 'string'   || typeof value == 'number' || 
             typeof value == 'function' || typeof value == 'boolean' || 
             value.constructor == Date  || value.constructor == RegExp;
    };

    function Object2XML(document, nodeName, namespace, content){
      if (String(nodeName).charAt(0) == '@')
        return content == null ? content : createAttributeNS(document, nodeName.substr(1), /*namespace*/ '', content);
      else
      {
        var result = createElementNS(document, nodeName.toString(), (content && content.xmlns) || nodeName.namespace || namespace);
        if (typeof content == 'undefined' || content === null)
          setAttributeNodeNS(result, QName.createAttribute(document, XSI_NIL, 'true'));
        else if (isPrimitiveObject(content))
            result.appendChild(createText(document, content));
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
                if (value != null && typeof value == 'object' && value.toString !== Object.prototype.toString)
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
        return result;
      }
    };

    function getElementsByQName(element, qname){
      if(element.getElementsByTagNameNS)
        return element.getElementsByTagNameNS(qname.namespace, qname.localpart);

      var result = new Array();
      var nodes = DOM.tag(element, qname);

      for (var i = 0, node; node = nodes[i++];)
        if (node.namespaceURI == qname.namespace)
          result.push(node);

      return result;
    };

    function XML2String(node){
      // gecko feature
      if (typeof XMLSerializer != 'undefined')
        return (new XMLSerializer()).serializeToString(node);

      // IE feature
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

    Basis.namespace(namespace).extend({
      XMLNS: XMLNS,
      XSI: XSI,
      XSD: XSD,
      QName: QName,
      XMLElement: XMLElement,
      getElementsByQName: getElementsByQName,
      addNamespace: addNamespace,
      createDocument: createDocument,
      createElementNS: createElementNS,
      createAttribute: createAttribute,
      createAttributeNS: createAttributeNS,
      setAttributeNodeNS: setAttributeNodeNS,
      removeAttributeNodeNS: removeAttributeNodeNS,
      createText: createText,
      createCDATA: createCDATA,
      XML2Object: XML2Object,
      XML2String: XML2String,
      Object2XML: Object2XML
    });

  })();
