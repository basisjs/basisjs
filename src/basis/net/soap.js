/*
  Basis javascript library 
  http://code.google.com/p/basis-js/
 
  @copyright
  Copyright (c) 2006-2012 Roman Dvornov.
 
  @license
  GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
*/

  basis.require('basis.dom');
  basis.require('basis.xml');
  basis.require('basis.net.ajax');


 /**
  * Interface for communication with SOAP services.
  *
  * @link ./demo/ajax/soap-simple.html
  * @link ./demo/ajax/soap-list.html
  *
  * @namespace basis.net.soap
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var nsAjax = basis.net.ajax;
  var XML = basis.xml;



  var QName = XML.QName;
  var addNamespace = XML.addNamespace;
  var XML2Object = XML.XML2Object;
  var Object2XML = XML.Object2XML;
  var createElementNS = XML.createElementNS;
  var NAMESPACE = XML.NAMESPACE;

  var AjaxProxy = nsAjax.AjaxProxy;
  var AjaxRequest = nsAjax.AjaxRequest;

  //
  // Main part
  //

  // CONST

  var SOAP_VERSION   = '1.1';
  var SOAP_PREFIX    = 'soap';
  var SOAP_NAMESPACE = String('http://schemas.xmlsoap.org/soap/envelope/');
  var SOAP_ENCODING  = String('http://schemas.xmlsoap.org/soap/encoding/');

  var SOAP_ENVELOPE = 'Envelope';
  var SOAP_HEADER   = 'Header';
  var SOAP_BODY     = 'Body';
  var SOAP_FAULT    = 'Fault';

  
 /**
  * @class SOAPRequest
  */ 

  var SOAPRequest = Class(AjaxRequest, {
    className: namespace + 'SOAPRequest',

    requestDataGetter: Function.$self,
    responseDataGetter: Function.$self,

    errorCodeGetter: function(node){
      return DOM.tag(node, 'code')[0];
    },
    errorMessageGetter: function(node){
      return DOM.tag(node, 'message')[0];
    },

    isSuccessful: function(){
      var xml = this.xhr.responseXML;
      return AjaxRequest.prototype.isSuccessful.call(this) && (xml !== undefined && xml !== null && xml.documentElement !== undefined);
    },

    init: function(){
      AjaxRequest.prototype.init.call(this);
      this.requestEnvelope = new Envelope();
    },

    processResponse: Function.$undef,

    processErrorResponse: function(){
      this.parseResponseXML();

      var code;
      var message;

      if (this.responseEnvelope)
      {
        var element = this.responseEnvelope.element;
        var codeElement = this.errorCodeGetter(element);
        var messageElement = this.errorMessageGetter(element);

        code = codeElement ? codeElement.firstChild.nodeValue : 'UNKNOWN_ERROR';
        message = messageElement ? messageElement.firstChild.nodeValue : 'Unknown error';
      }
      
      this.update({
        error: {
          code: code || 'TRANSPORT_ERROR',
          message: message
        }
      });
    },

    parseResponseXML: function(){
      if (this.responseEnvelope == undefined)  // NOTE: responseEnvelope must be undefined before parse
      {
        var xml = this.xhr.responseXML;
        if (!xml || xml === undefined || xml.documentElement === undefined)
        {
          this.responseEnvelope = null;          
        }
        else
        {
          // convert to native document for IE
          if (xml.xml && window.DOMParser)
            xml = new DOMParser().parseFromString(xml.xml, "text/xml");

          this.responseEnvelope = new Envelope(xml.documentElement);
        }
      }
    },

    getRequestData: function(){
      var body = this.requestEnvelope.getBody();
      if (body)
        return this.requestDataGetter(body.getValue());
    },
    getResponseData: function(){
      this.parseResponseXML();
      var body = this.responseEnvelope && this.responseEnvelope.getBody();
      if (body)
        return this.responseDataGetter(body.getValue(this.mapping));
    },

    setMapping: function(mapping){
      this.mapping = mapping;
    },

    prepareRequestData: function(requestData){
      delete this.responseEnvelope;

      this.setMapping(requestData.mapping);

      //add SOAPAction header
      requestData.headers.SOAPAction = requestData.namespace + (!/\/$/.test(requestData.namespace) ? '/' : '') + requestData.methodName;

      //update Envelope
      if (requestData.soapHeader)
        this.requestEnvelope.getHeader(true).setValue(requestData.soapHeader, requestData.namespace);

      if (requestData.soapHeaderSections)
      {
        var header = this.requestEnvelope.getHeader(true); 
        for (var i in requestData.soapHeaderSections)
        {
          var section = requestData.soapHeaderSections[i];
          var ns = section.namespace || this.proxy.namespace;
          var data = section.data || section;

          header.setSection(new QName(i, ns), data);
        }
      }

      this.requestEnvelope.getBody(true).setValue(new QName(requestData.methodName, requestData.namespace), requestData.soapBody);

      requestData.postBody = this.requestEnvelope.document;

      return requestData;
    },
    destroy: function(){
      delete this.mapping;

      this.requestEnvelope.destroy();
      if (this.responseEnvelope)
        this.responseEnvelope.destroy();

      AjaxRequest.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var SOAPProxy = Class(AjaxProxy, {
    className: namespace + '.SOAPProxy',

    requestClass: SOAPRequest,

    method: 'POST',
    contentType: 'text/xml',
    encoding: 'utf-8',

    namespace: null,
    methodName: null,

    mapping: null,
    soapBody: null,
    soapHeader: null,
    soapHeaderSections: null,

    setSoapHeaderSection: function(name, data){
      this.soapHeaderSections[name] = data;
    },

    init: function(){
      if (!this.soapHeaderSections)
        this.soapHeaderSections = {};

      AjaxProxy.prototype.init.call(this);
    },

    prepareRequestData: function(requestData){
      requestData = AjaxProxy.prototype.prepareRequestData.call(this, requestData);

      Object.extend(requestData, {
        namespace: this.namespace,
        methodName: this.methodName,
        soapBody: requestData.soapBody || this.soapBody,
        soapHeader: requestData.soapHeader || this.soapHeader,
        soapHeaderSections: [this.soapHeaderSections, requestData.soapHeaderSections].merge(),
        mapping: requestData.mapping || this.mapping
      });

      return requestData;
    }
  });

  //
  // SOAP Envelope
  //

 /**
  * @class
  */
  var Envelope = Class(null, {
    className: namespace + '.Envelope',

    header: null,
    body: null,

    init: function(element){

      if (!element)
      {
        element = XML.createDocument(SOAP_NAMESPACE, SOAP_PREFIX + ':' + SOAP_ENVELOPE).documentElement;
        addNamespace(element, 'xsd', NAMESPACE.XMLShema);
        addNamespace(element, 'xsi', NAMESPACE.XMLShemaInstance);
        if (XML.XMLNS.BAD_SUPPORT) // bad browsers don't set namespace (xmlns attribute)
          addNamespace(element, SOAP_PREFIX, SOAP_NAMESPACE);
      }

      this.document = element.ownerDocument;
      this.element = element;
      this.body = this.getBody(true);  // minOccure for body is 1
    },

    getElementByName: function(name){
      return XML.getElementsByTagNameNS(this.element, name, SOAP_NAMESPACE)[0];
    },

    // Header
    getHeader: function(forceCreate){
      var header = this.header;

      if (!header)
      {
        var headerElement = this.getElementByName('Header');

        if (headerElement || forceCreate)
        {
          header = this.header = new EnvelopeHeader(headerElement, this.document);

          if (!headerElement)
            this.element.insertBefore(header.element, this.element.firstChild);
        }
      }

      return header;
    },
    setHeaderSection: function(qname, data){
      this.getHeader(true).setSection(qname, data);
    },

    // Body
    getBody: function(forceCreate){
      var body = this.body;

      if (!body)
      {
        var bodyElement = this.getElementByName('Body');

        if (bodyElement || forceCreate)
        {
          body = this.body = new EnvelopeBody(bodyElement, this.document);

          if (!bodyElement)
            this.element.appendChild(body.element);
        }
      }

      return body;
    },

    destroy: function(){
      if (this.header)
      {
        this.header.destroy();
        delete this.header;
      }

      if (this.body)
      {
        this.body.destroy();
        delete this.body;
      }

      delete this.element;
      delete this.document;
    }
  });

  //
  // Envelope header
  //

 /**
  * @class
  */
  var EnvelopeHeader = Class(null, {
    className: namespace + '.EnvelopeHeader',

    init: function(element, document){
      this.element = element || createElementNS(document, 'Header', SOAP_NAMESPACE);
    },
    getValue: function(){
      return XML2Object(this.element);
    },
    setValue: function(data, namespace){
      DOM.clear(this.element);
      this.appendChild(data, namespace);
    },
    appendChild: function(data, namespace){
      if (data)
        for (var node in data)
        {
          var element = this.element.appendChild(Object2XML(this.element.ownerDocument, node, namespace, data[node]));
          if (XML.XMLNS.BAD_SUPPORT) // add namespace for bad browsers (xmlns attribute)
            addNamespace(element, '', namespace); 
        }
    },
    setSection: function(qname, data){
      var section = XML.getElementsByTagNameNS(this.element, qname, qname.namespace)[0];
      if (section)
        DOM.remove(section);
      this.appendChild(Function.wrapper(qname)(data), qname.namespace);
    }
  });

  //
  // Envelope body
  //

 /**
  * @class
  */
  var EnvelopeBody = Class(null, {
    className: namespace + '.EnvelopeBody',

    init: function(element, document){
      this.element = element || createElementNS(document, 'Body', SOAP_NAMESPACE);
    },
    getValue: function(mapping){
      return XML2Object(this.element, mapping);
    },
    setValue: function(method, data, encodingStyle){
      DOM.clear(this.element);
      this.appendChild(method, data, encodingStyle);
    },
    appendChild: function(method, data, encodingStyle){
      var child = Object2XML(this.element.ownerDocument, method, method.namespace, Function.$defined(data) ? data : {});

      this.element.appendChild(child);

      if (XML.XMLNS.BAD_SUPPORT) // add namespace for bad browsers (xmlns attribute)
        addNamespace(child.element, '', method.namespace); 

      if (encodingStyle)
        XML.setAttributeNodeNS(child, XML.createAttributeNS(document, 'encodingStyle', SOAP_ENCODING, encodingStyle));
    }
  });


  //
  // export names
  //

  module.exports = {
    /*Service: Service,
    ServiceCall: ServiceCall,
    ServiceCallTransport: ServiceCallTransport,*/

    SOAPProxy: SOAPProxy,
    SOAPRequest: SOAPRequest,

    Envelope: Envelope,
    EnvelopeHeader: EnvelopeHeader,
    EnvelopeBody: EnvelopeBody
  };
