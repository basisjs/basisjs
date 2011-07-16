/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

   /**
    * Interface for communication with SOAP services.
    *
    * @link ./demo/ajax/soap-simple.html
    * @link ./demo/ajax/soap-list.html
    *
    * @namespace Basis.SOAP
    */

    var namespace = 'Basis.SOAP';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;

    var nsAjax = Basis.Ajax;
    var XML = Basis.XML;

    var Transport = nsAjax.Transport;

    var QName = XML.QName;
    var addNamespace = XML.addNamespace;
    var XML2Object = XML.XML2Object;
    var Object2XML = XML.Object2XML;
    var createElementNS = XML.createElementNS;
    var NAMESPACE = XML.NAMESPACE;

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

    
    //
    //  Service / ServiceCall / ServiceCallTransport
    //

   /**
    * @class
    */
    var Service = Class(null, {
      className: namespace + '.Service',

     /**
      * @type {string}
      * @readonly
      */
      url: null,

     /**
      * @type {string}
      * @readonly
      */
      namespace: null,

     /**
      * @contructor
      */
      init: function(url, namespace){
        this.url = url;
        this.namespace = namespace;
      },

     /**
      * @param {string} method
      * @param {object} config
      */
      call: function(method, config){
        var method = this.createMethodCall(method, config, false);
        method.transport.abort();
        method.invoke(config.header, config.body, config.callback, config.mapping);
      },

     /**
      * @param {string} method
      * @param {object} config
      * @return {Basis.SOAP.ServiceCall} Return new ServiceCall instance
      */
      createMethodCall: function(method, config, staticData){
        return new ServiceCall(this, new QName(method, this.namespace), config, staticData);
      }

     /**
      * @destructor
      */
    });

   /**
    * @class
    */
    var ServiceCall = Class(null, {
      className: namespace + '.ServiceCall',

     /**
      * @type {Basis.SOAP.Service}
      */
      service: null,

     /**
      * @type {Basis.SOAP.ServiceCallTransport}
      * @readonly
      */
      transport: null,

     /**
      * @type {Basis.XML.QName}
      */
      method: null,

     /**
      * Request envelope
      * @type {Basis.SOAP.Envelope}
      * @private
      */
      envelope: null,

     /**
      * Request body content
      * @type {Object}
      */
      body: null,

     /**
      * @constructor
      */
      init: function(service, method, config, staticData){
        config = config || {};

        //this.service = service;
        this.method = method;
        this.envelope = new Envelope();

        this.url = service.url;

        // transport
        this.transport = new ServiceCallTransport(method, config.callback);
        //this.transport.completeRequest = Object.coalesce(config.completeRequest, false);
        this.transport.requestHeaders = { SOAPAction: (method.namespace + (!/\/$/.test(method.namespace) ? '/' : '') + method) };

        this.transport.requestEnvelope = this.envelope;
        this.transport.postBody = this.envelope.document;
        this.transport.url = {
          toString: function(){
            return service.url;
          }
        }

        if (config.mapping)  this.transport.setMapping(config.mapping);
        if (config.callback) this.transport.setCallback(config.callback);

        if (staticData)
        {
          this.body = config.body || {};
        }
      },
      repeatCall: function(){
        this.transport.get(); // this.service.url
      },
      call: function(body){
        return this.invoke(null, body || this.body);
      },
      invoke: function(headerData, bodyData, callback, mapping){
        this.transport.abort();

        this.envelope.getBody(true).setValue(this.method, bodyData);

        if (headerData)
          this.envelope.getHeader(true).setValue(headerData, this.method.namespace);

        if (callback)
          this.transport.setCallback(callback);

        if (mapping)
          this.transport.setMapping(mapping);

        this.transport.get(); // this.service.url
      },
      destroy: function(){
        this.destroy = Function.$undef;

        this.transport.destroy();
        this.envelope.destroy();

        this.contructor.prototype.destroy.call(this);
        //this.inherit();
      }
    });

    //
    // Service call transport
    //

   /**
    * @class
    */
    var ServiceCallTransport = Class(Transport, {
      className: namespace + '.ServiceCallTransport',
      callback: {},
      mapping: null,

      method: 'POST',
      contentType: 'text/xml',
      encoding: 'utf-8',

      event_success: function(request){
        var xml = request.responseXML;
        if (xml === undefined || xml.documentElement === undefined)
        {
          //eventName = 'failure';
          //Transport.prototype.event_failure.call(this, arguments);
          this.event_failure(this);
        }
        else
        {
          var args = Array.from(arguments);

          if (xml.xml && DOMParser)
          {
            var parser = new DOMParser();
            xml = parser.parseFromString(xml.xml, "text/xml");
          }

          this.responseEnvelope = new Envelope(xml.documentElement);
          //this.responseData = XML2Object(this.responseEnvelope.element, this.mapping);
        
          args.push(
            this.getResponseData(),
            this.getRequestData()
          );

          Transport.prototype.event_success.apply(this, args);
        }
      },
      event_failure: function(request){
        var args = Array.from(arguments);

        var error = this.state.data || this.getRequestError(request);
        if (error.isSoapFailure)
          this.event_soapfailure(request, error.code, error.msg);
          //nsAjax.TransportDispatcher.dispatch.call(this, 'soapfailure', error.code, error.msg);

        args.push(
          error.code,
          error.msg
        );

        Transport.prototype.event_failure.apply(this, args);
      },
      event_soapfailure: nsAjax.createEvent('soapfailure'),

      /*behaviour: {
        failure: function(req, code, message){
        }
      },*/

      requestDataGetter: Function.$self,
      responseDataGetter: Function.$self,

      errorCodeGetter: function(node){
        return DOM.tag(node, 'code')[0];
      },
      errorMessageGetter: function(node){
        return DOM.tag(node, 'message')[0];
      },

      extendConstructor_: false,
      init: function(soapMethod, callback){
        //this.inherit();
        Transport.prototype.init.call(this);
        this.soapMethod = soapMethod;
      },
      /*dispatch: function(eventName, request){
        var args = Array.from(arguments);
        if (eventName == 'success')
        {
          var xml = request.responseXML;
          if (xml === undefined || xml.documentElement === undefined)
            eventName = 'failure';
          else
          {
            if (xml.xml && DOMParser)
            {
              var parser = new DOMParser();
              xml = parser.parseFromString(xml.xml, "text/xml");
            }

            this.responseEnvelope = new Envelope(xml.documentElement);
            //this.responseData = XML2Object(this.responseEnvelope.element, this.mapping);
          
            args.push(
              this.getResponseData(),
              this.getRequestData()
            );
          }
        }

        if (eventName == 'failure')
        {
          var error = this.state.data || this.getRequestError(request);
          if (error.isSoapFailure)
            //this.event_soapfailure(error.code, error.msg);
            nsAjax.TransportDispatcher.dispatch.call(this, 'soapfailure', error.code, error.msg);

          args.push(
            error.code,
            error.msg
          );
        }

        Transport.prototype.dispatch.apply(this, args);
      },*/
      setCallback: function(callback){
        if (typeof callback == 'object')
        {
          ;;;if (callback.fault) { throw new Error('callback.failure must be used instead of callback.fault'); }
          ;;;if (typeof callback == 'function') { console.warn('Callback must be an object, callback ignored') } else

          this.addHandler(callback);
        }
      },
      setMapping: function(mapping){
        this.mapping = mapping;
      },
      //invoke: function(headerData, bodyData, callback){ /* deprecate */ },
      getRequestData: function(){
        return this.requestDataGetter(this, this.requestEnvelope.getBody().getValue());
      },
      getResponseData: function(){
        var body = this.responseEnvelope && this.responseEnvelope.getBody();
        if (body)
          return this.responseDataGetter(body.getValue(this.mapping));
      },
      getRequestError: function(req){
        var code, message, isSoapFailure = false;
        var xml = req.responseXML;
        if (xml != undefined && xml.documentElement != undefined)
        {
          var element = xml.documentElement;
          var codeElement = this.errorCodeGetter(element);
          var messageElement = this.errorMessageGetter(element);

          this.responseEnvelope = new Envelope(element);

          code = codeElement ? codeElement.firstChild.nodeValue : 'UNKNOWN_ERROR';
          message = messageElement ? messageElement.firstChild.nodeValue : 'Unknown error';

          console.log('SoapError:', code.quote('('), message)

          isSoapFailure = true;
        }

        return {
          code: code || 'TRANSPORT_ERROR',
          msg: message,
          //faultactor: faultactor,
          isSoapFailure: isSoapFailure
        }
      }

      // full destroy in Transport class
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

    Basis.namespace(namespace).extend({
      Service: Service,
      ServiceCall: ServiceCall,
      ServiceCallTransport: ServiceCallTransport,
      Envelope: Envelope,
      EnvelopeHeader: EnvelopeHeader,
      EnvelopeBody: EnvelopeBody
    });

  })();
