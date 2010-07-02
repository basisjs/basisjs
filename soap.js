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

    var XML = Basis.XML;

    var QName = XML.QName;
    var XMLElement = XML.XMLElement;
    var addNamespace = XML.addNamespace;
    var XML2Object = XML.XML2Object;
    var Object2XML = XML.Object2XML;

    //
    // Main part
    //

    // CONST

    var DEBUG_MODE = Basis.Browser.Cookies.get('DEBUG_MODE');

    var SOAP_VERSION   = '1.1';
    var SOAP_PREFIX    = 'soap';
    var SOAP_NAMESPACE = 'http://schemas.xmlsoap.org/soap/envelope/';
    var SOAP_ENCODING  = 'http://schemas.xmlsoap.org/soap/encoding/';
    var ENCODING_STYLE = new QName('encodingStyle', SOAP_NAMESPACE, 's');

    var SOAP_ENVELOPE_QNAME = new QName('Envelope', SOAP_NAMESPACE, SOAP_PREFIX);
    var SOAP_HEADER_QNAME   = new QName('Header',   SOAP_NAMESPACE, SOAP_PREFIX);
    var SOAP_BODY_QNAME     = new QName('Body',     SOAP_NAMESPACE, SOAP_PREFIX);
    var SOAP_FAULT_QNAME    = new QName('Fault',    SOAP_NAMESPACE, SOAP_PREFIX);
    
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
        this.methods = new Array();
      },

     /**
      * @param {string} method
      * @param {object} config
      */
      call: function(method, config){
        var method = this.createMethodCall(method, false, config);
        method.transport.abort();
        method.invoke(config.header, config.body, config.callback, config.mapping);
      },

     /**
      * @param {string} method
      * @param {object} config
      * @return {Basis.SOAP.ServiceCall} Return new ServiceCall instance
      */
      createMethodCall: function(method, staticData, config){
        /*if (!this.methods[method])
          this.methods[method] = new ServiceCall(this, new QName(method, this.namespace), config, staticData);

        return this.methods[method];*/
        return new ServiceCall(this, new QName(method, this.namespace), config, staticData);
      },

     /**
      * @destructor
      */
      destroy: function(){
        for (var name in this.methods)
        {
          this.methods[name].destroy();
          delete this.methods[name]
        }
      }
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
        this.service = service;
        this.method = method;
        this.envelope = new Envelope();

        this.url = service.url;

        // transport
        this.transport = new ServiceCallTransport(method, config.callback);
        this.transport.completeRequest = Object.coalesce(config.completeRequest, false);
        this.transport.requestHeaders = { SOAPAction: (method.namespace + (!/\/$/.test(method.namespace) ? '/' : '') + method) };

        this.transport.requestEnvelope = this.envelope;
        this.transport.postBody = this.envelope.element.ownerDocument;

        if (staticData)
        {
          if (config.mapping)  this.transport.setMapping(config.mapping);
          if (config.callback) this.transport.setCallback(config.callback);
          this.body = config.body || {};
        }
      },
      repeatCall: function(){
        this.transport.get(this.url); // this.service.url
      },
      call: function(body){
        return this.invoke(null, body || this.body);
      },
      invoke: function(headerData, bodyData, callback, mapping){
        this.envelope.setBody(this.method, bodyData);

        if (headerData)
          this.envelope.setHeader(headerData, this.method.namespace);

        if (callback)
          this.transport.setCallback(callback);

        if (mapping)
          this.transport.setMapping(mapping);

        this.transport.get(this.url); // this.service.url
      },
      destroy: function(){
        this.destroy = Function.$undef;

        this.transport.destroy();
        this.envelope.destroy();

        this.inherit();
      }
    });

    //
    // Service call transport
    //

    var ServiceCallTransportBehaviour = {
      start: function(){
        /* debug for */
        if (DEBUG_MODE && window.console)
        {
          var request = {}, params = [];
          request.transport = this;
          request.body = this.requestBody();
          request.xmlString = XML.XML2String(this.requestEnvelope.element.ownerDocument);
          request.xml = XML2Object(this.postBody.documentElement);
          for (var param in request.body)
          {
            var value = request.body[param];
            if (typeof value != 'function')
              params.push(param + ': ' + (typeof value == 'string' ? value.quote("'") : value));
          }
          console.log('request ' + this.soapMethod + (params.length ? '(' + params.join(', ') + '):' : ':'), request);
        };

        // complete handler
        if (this.callback.start)
          this.callback.start.call(this);
      },
      complete: function(req){
        /* debug for */
        if (DEBUG_MODE && window.console && Function.$defined(req.responseXML))
        {
          var response = {}, xmlRoot = req.responseXML.documentElement;
          if (Function.$defined(req.responseXML) && Function.$defined(xmlRoot))
          {
            response.xmlString = XML.XML2String(xmlRoot);
            response.xmlObject = XML2Object(xmlRoot);
            if (this.responseIsSuccess())
              response.body = this.responseBody(response.xmlObject);
            else
              response.body = (new Envelope(xmlRoot)).getBody().getValue()[SOAP_FAULT_QNAME];
            response.transport = this;
          }  
          else
            response.text = req.responseText;
          console.log('response ' + this.soapMethod + ':', response);
        }

        // complete handler
        if (this.callback.complete)
          this.callback.complete.call(this);
      },
      failure: function(req){
        var error = this.getRequestError(req);

        if (error.isSoapFailure)
          Basis.Ajax.TransportDispatcher.dispatch.call(this, 'soapfailure', error.code, error.msg);

        if (this.callback.failure)
          this.callback.failure.call(this, error.code, error.msg);
        else
          throw new Error('SOAP error:\n\n  ' +
            (error.faultactor ? error.faultactor + '\n\n  ' : '') +
            error.code + ': ' + error.msg
          );
      },
      timeout: function(req){
        if (this.callback.timeout)
          this.callback.timeout.call(this);
      },
      abort: function(req){
        if (this.callback.abort)
          this.callback.abort.call(this);
      },
      success: function(req){
        var success = this.callback.success;
        if (!success || !Function.$defined(req.responseXML) || !Function.$defined(req.responseXML.documentElement))
          return;

        this.responseEnvelope = new Envelope(req.responseXML.documentElement);

        if (typeof success == 'function')
        {
          var data = XML2Object(this.responseEnvelope.element, this.map);
          success.call(this, data, this.requestEnvelope, req);
        }
        else
        {
          var storage = success;
          var items = this.responseBody();

          if (!items)
            return;

          items = items.Items ? items.Items[Object.keys(items.Items)[0]] : items[Object.keys(items)[0]];

          if (storage.constructor == Array)
          {
            storage.set(items);
          }
          else if (storage.loadData)
          {
            storage.loadData(items);
          }
          else if (storage.appendChild)
          {
            if (typeof storage.clear == 'function')
              storage.clear();

            for (var i = 0; i < items.length; i++)
              storage.appendChild(items[i]);
          }
        }
      }
    };

   /**
    * @class ServiceCallTransport
    */
    var ServiceCallTransport = Class(Basis.Ajax.Transport, {
      className: namespace + '.ServiceCallTransport',
      callback: {},
      map: null,

      behaviour: ServiceCallTransportBehaviour,

      method: 'POST',
      contentType: 'text/xml',
      encoding: 'utf-8',

      init: function(soapMethod, callback){
        this.inherit();
        this.soapMethod = soapMethod;
      },
      setCallback: function(callback){
        if (!callback)
          this.callback = {};
        else
        {
          var failure = callback.failure;

          ;;;if (callback.fault) { console.warn('callback.failure should be used instead of callback.fault'); }
          if (callback.fault) failure = callback.fault; // to remove

          ;;;for (var key in callback) if (typeof callback[key] != 'function') console.info('Probably wrong callback name `' + key + '` used ({0})'.format(callback[key]));

          this.callback = {
            start:    callback.start,
            success:  callback.success || (typeof callback == 'function' ? callback : undefined),
            failure:  failure,
            abort:    callback.abort,
            timeout:  callback.timeout,
            complete: callback.complete !== Function.prototype.complete ? callback.complete : undefined
          }
        }
      },
      setMapping: function(map){
        this.map = map;
      },
      invoke: function(headerData, bodyData, callback){ /* deprecate */ },
      requestBody:  function(){
        return this.requestEnvelope.getBody().getValue()[this.soapMethod];
      },
      responseBody: function(data){
        if (data)
          data = data[SOAP_BODY_QNAME];
        else
          data = this.responseEnvelope.getBody().getValue();
        return data[this.soapMethod + 'Response'][this.soapMethod + 'Result'];
      },
      getRequestError: function(req){
        var code, msg, faultactor, isSoapFailure = false;
        if (Function.$defined(req.responseXML) && Function.$defined(req.responseXML.documentElement))
        {
          var data;
          var fault;

          try {
            data = XML2Object(req.responseXML.documentElement);
            fault = data[SOAP_BODY_QNAME][SOAP_FAULT_QNAME];
          } catch(e) {
            throw new Error('SOAP response parse error');
          }

          if (fault.faultactor)
            faultactor = fault.faultactor;

          if (fault.detail)
          {
            code = fault.detail.code;
            msg  = fault.detail.message;
          }
          else
          {
            if (fault.faultstring.match(/^\s*([a-z0-9\_]+)\s*\:(.+)$/i))
            {
              code = RegExp.$1;
              msg  = RegExp.$2;
            }
            else
            {
              code = 'UNKNOWN_ERROR';
              msg  = fault.faultstring;
            }
          }

          isSoapFailure = true;
        }

        return {
          code: code || 'TRANSPORT_ERROR',
          msg: msg,
          faultactor: faultactor,
          isSoapFailure: isSoapFailure
        }
      },
      extract: function(data){
        return this.responseBody(data);
      }

      // full destroy in Transport class
    });

    //
    // SOAP Envelope
    //

   /**
    * @class
    */
    var Envelope = Class(XMLElement, {
      className: namespace + '.Envelope',

      init: function(element){
        this.setElement(element);
      },
      setElement: function(element){
        this.header = null;
        this.body = null;

        if (!element)
        {
          element = QName.createDocument(SOAP_ENVELOPE_QNAME).documentElement;
          addNamespace(element, XML.XSI.PREFIX, XML.XSI.NAMESPACE);
          addNamespace(element, XML.XSD.PREFIX, XML.XSD.NAMESPACE);
          if (XML.XMLNS.BAD_SUPPORT) // bad browsers don't set namespace (xmlns attribute)
            addNamespace(element, SOAP_PREFIX, SOAP_NAMESPACE);
        }
          
        this.element = element;
        this.header = this.getHeader();
        this.body = this.getBody(true);  // minOccure for body is 1
      },

      setValue: Function.$null,
      getValue: Function.$null,
      createChild: Function.$null,

      // Header
      createHeader: function(){
        if (!this.header)
        {
          this.header = new EnvelopeHeader(null, this.element.ownerDocument);
          DOM.insert(this.element, this.header.element, DOM.INSERT_BEGIN);
        }
        return this.header;
      },
      getHeader: function(forceCreate){
        if (this.header)
          return this.header;

        /*
        var headers = DOM.axis(this.element, DOM.AXIS_CHILD, function(node){
          return DOM.IS_ELEMENT_NODE(node) && SOAP_HEADER_QNAME.equals(QName.fromElement(node))
        });*/
        var headers = XML.getElementsByQName(this.element, SOAP_HEADER_QNAME);

        if (headers[0])
          return new EnvelopeHeader(headers[0])

        if (forceCreate)
          return this.createHeader();
      },
      setHeader: function(data, namespace){
        this.getHeader(true).setValue(data, namespace);
      },
      appendHeader: function(data, namespace){
        this.getHeader(true).appendChild(data, namespace);
      },
      hasHeader: function(){
        return !!this.header;
      },
      setHeaderSection: function(qname, data){
        this.getHeader(true).setSection(qname, data);
      },

      // Body
      createBody: function(){
        if (!this.body)
        {
          this.body = new EnvelopeBody(null, this.element.ownerDocument);
          DOM.insert(this.element, this.body.element);
        }
        return this.body;
      },
      getBody: function(forceCreate){
        if (this.body)
          return this.body;

        /*var bodies = DOM.axis(this.element, DOM.AXIS_CHILD, function(node){
          return DOM.IS_ELEMENT_NODE(node) && SOAP_BODY_QNAME.equals(QName.fromElement(node))
        });*/
        var bodies = XML.getElementsByQName(this.element, SOAP_BODY_QNAME);

        if (bodies[0])
          return new EnvelopeBody(bodies[0])

        if (forceCreate)
          return this.createBody();
      },
      setBody: function(method, data, encoding){
        this.getBody(true).setValue(method, data, encoding);
      },
      hasBody: function(){
        return !!this.body;
      },

      destroy: function(){
        delete this.header;
        delete this.body;
        delete this.element;
      }
    });

    //
    // Envelope header
    //

   /**
    * @class
    */
    var EnvelopeHeader = Class(XMLElement, {
      className: namespace + '.EnvelopeHeader',

      init: function(element, document){
        this.element = element || QName.createElement(document, SOAP_HEADER_QNAME);
      },
      getValue: function(){
        return XML2Object(this.element);
      },
      setValue: function(data, namespace){
        this.clear();
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
        var section = XML.getElementsByQName(this.element, qname);
        if (section[0])
          DOM.remove(section[0]);
        this.appendChild(Basis.Data.wrapper(qname)(data), qname.namespace);
      }
    });

    //
    // Envelope body
    //

   /**
    * @class
    */
    var EnvelopeBody = Class(XMLElement, {
      className: namespace + '.EnvelopeBody',

      init: function(element, document){
        this.element = element || QName.createElement(document, SOAP_BODY_QNAME);
      },
      getValue: function(){
        return XML2Object(this.element);
      },
      setValue: function(method, data, encodingStyle){
        this.clear();
        this.appendChild(method, data, encodingStyle);
      },
      appendChild: function(method, data, encodingStyle){
        var child = Function.$defined(data)
                      ? new XMLElement(this.element.appendChild(Object2XML(this.element.ownerDocument, method, method.namespace, data)))
                      : this.createChild(method);

        if (XML.XMLNS.BAD_SUPPORT) // add namespace for bad browsers (xmlns attribute)
          addNamespace(child.element, '', method.namespace); 

        if (encodingStyle)
          child.setAttribute(ENCODING_STYLE, encodingStyle);
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
