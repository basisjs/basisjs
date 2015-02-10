
 /**
  * Interface for communication with SOAP services.
  *
  * @see ./demo/ajax/soap-simple.html
  * @see ./demo/ajax/soap-list.html
  *
  * @namespace basis.net.soap
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;

  var DOM = require('basis.dom');
  var XML = require('basis.xml');
  var QName = XML.QName;
  var addNamespace = XML.addNamespace;
  var XML2Object = XML.XML2Object;
  var Object2XML = XML.Object2XML;
  var createElementNS = XML.createElementNS;
  var NAMESPACE = XML.NAMESPACE;

  var basisNetAjax = require('basis.net.ajax');
  var AjaxTransport = basisNetAjax.Transport;
  var AjaxRequest = basisNetAjax.Request;


  //
  // Main part
  //

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
    className: namespace + '.SOAPRequest',

    requestDataGetter: basis.fn.$self,
    responseDataGetter: basis.fn.$self,

    errorCodeGetter: function(node){
      return DOM.tag(node, 'code')[0];
    },
    errorMessageGetter: function(node){
      return DOM.tag(node, 'message')[0];
    },

    isSuccessful: function(){
      if (!AjaxRequest.prototype.isSuccessful.call(this))
        return false;

      var xml = this.xhr.responseXML;
      return xml !== undefined && xml !== null && xml.documentElement !== undefined;
    },

    init: function(){
      AjaxRequest.prototype.init.call(this);
      this.requestEnvelope = new Envelope();
    },

    processResponse: basis.fn.$undef,

    getResponseError: function(){
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

      return {
        code: code || 'TRANSPORT_ERROR',
        message: message
      };
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
          if (xml.xml && global.DOMParser)
            xml = new DOMParser().parseFromString(xml.xml, 'text/xml');

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
        for (var key in requestData.soapHeaderSections)
        {
          var section = requestData.soapHeaderSections[key];
          var ns = section.namespace || this.transport.namespace;
          var data = section.data || section;

          header.setSection(new QName(key, ns), data);
        }
      }

      this.requestEnvelope.getBody(true).setValue(new QName(requestData.methodName, requestData.namespace), requestData.soapBody);

      requestData.body = this.requestEnvelope.document;

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
  var SOAPTransport = Class(AjaxTransport, {
    className: namespace + '.SOAPTransport',

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

      AjaxTransport.prototype.init.call(this);
    },

    prepareRequestData: function(requestData){
      requestData = AjaxTransport.prototype.prepareRequestData.call(this, requestData);

      basis.object.extend(requestData, {
        namespace: this.namespace,
        methodName: this.methodName,
        soapBody: requestData.soapBody || this.soapBody,
        soapHeader: requestData.soapHeader || this.soapHeader,
        soapHeaderSections: basis.object.merge(this.soapHeaderSections, requestData.soapHeaderSections),
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
        var headerElement = this.getElementByName(SOAP_HEADER);

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
        var bodyElement = this.getElementByName(SOAP_BODY);

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
      this.element = element || createElementNS(document, SOAP_HEADER, SOAP_NAMESPACE);
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
      this.appendChild(basis.fn.wrapper(qname)(data), qname.namespace);
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
      this.element = element || createElementNS(document, SOAP_BODY, SOAP_NAMESPACE);
    },
    getValue: function(mapping){
      return XML2Object(this.element, mapping);
    },
    setValue: function(method, data, encodingStyle){
      DOM.clear(this.element);
      this.appendChild(method, data, encodingStyle);
    },
    appendChild: function(method, data, encodingStyle){
      var child = Object2XML(this.element.ownerDocument, method, method.namespace, basis.fn.$defined(data) ? data : {});

      this.element.appendChild(child);

      if (XML.XMLNS.BAD_SUPPORT) // add namespace for bad browsers (xmlns attribute)
        addNamespace(child.element, '', method.namespace);

      if (encodingStyle)
        XML.setAttributeNS(child, 'encodingStyle', SOAP_ENCODING, encodingStyle);
    }
  });


  //
  // export names
  //

  module.exports = {
    Transport: SOAPTransport,
    Request: SOAPRequest,

    Envelope: Envelope,
    EnvelopeHeader: EnvelopeHeader,
    EnvelopeBody: EnvelopeBody
  };
