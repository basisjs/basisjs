
 /**
  * @namespace basis.net.service
  */

  var namespace = this.path;


  //
  // import names
  //

  var basisEvent = require('basis.event');
  var createEvent = basisEvent.create;
  var Emitter = basisEvent.Emitter;

  var AjaxTransport = require('basis.net.ajax').Transport;
  var createAction = require('basis.net.action').create;


 /**
  * @class Service
  */

  function removeTransportFromService(service, transport){
    service.inprogressRequests = service.inprogressRequests.filter(function(request){
      return request.transport !== transport;
    });
    basis.array.remove(service.inprogressTransports, transport);

    if (service.inprogressTransports.indexOf(transport) == -1 &&
        (!service.stoppedTransports || service.stoppedTransports.indexOf(transport) == -1))
      transport.removeHandler(TRANSPORT_HANDLER, service);
  }

  var TRANSPORT_HANDLER = {
    destroy: function(transport){
      if (this.stoppedTransports)
        basis.array.remove(this.stoppedTransports, transport);

      removeTransportFromService(this, transport);
    }
  };

  var SERVICE_HANDLER = {
    start: function(service, request){
      this.inprogressRequests.push(request);
      if (basis.array.add(this.inprogressTransports, request.transport))
        request.transport.addHandler(TRANSPORT_HANDLER, this);
    },
    complete: function(service, request){
      basis.array.remove(this.inprogressRequests, request);

      var hasOtherTransportRequests = this.inprogressRequests.some(function(request){
        return request.transport === this.transport;
      }, request);

      if (!hasOtherTransportRequests)
        removeTransportFromService(this, request.transport);
    }
  };


  var Service = Emitter.subclass({
    className: namespace + '.Service',

    inprogressRequests: null,
    inprogressTransports: null,
    stoppedTransports: null,

    transportClass: AjaxTransport,

    emit_sessionOpen: createEvent('sessionOpen'),
    emit_sessionClose: createEvent('sessionClose'),
    emit_sessionFreeze: createEvent('sessionFreeze'),
    emit_sessionUnfreeze: createEvent('sessionUnfreeze'),

    secure: false,

    prepare: basis.fn.$true,
    signature: basis.fn.$undef,
    isSessionExpiredError: basis.fn.$false,

    init: function(){
      /** @cut */ if (this.requestClass)
      /** @cut */   basis.dev.warn(namespace + '.Service#requestClass is not supported; set requestClass via transportClass');

      Emitter.prototype.init.call(this);

      if ('isSecure' in this)
      {
        /** @cut */ basis.dev.warn(namespace + '.Service#isSecure is deprecated and will be remove in next version. Please, use Service.secure property instead');
        this.secure = this.isSecure;
      }

      this.inprogressRequests = [];
      this.inprogressTransports = [];

      var TransportClass = this.transportClass;
      this.transportClass = TransportClass.subclass({
        service: this,
        secure: this.secure,

        emit_failure: function(request, error){
          TransportClass.prototype.emit_failure.call(this, request, error);

          if (this.secure && this.service.isSessionExpiredError(request))
          {
            this.service.freeze();
            if (this.service.stoppedTransports)
              if (basis.array.add(this.service.stoppedTransports, this))
                this.addHandler(TRANSPORT_HANDLER, this.service);
            this.stop();
          }
        },

        init: function(){
          TransportClass.prototype.init.call(this);
          if ('needSignature' in this)
          {
            /** @cut */ basis.dev.warn('`needSignature` property is deprecated and will be remove in next version. Please, use `secure` property instead');
            this.secure = this.needSignature;
          }
        },

        request: function(requestData){
          if (!this.service.prepare(this, requestData))
            return;

          if (this.secure && !this.service.sign(this))
            return;

          return TransportClass.prototype.request.call(this, requestData);
        }
      });

      this.addHandler(SERVICE_HANDLER);
    },

    sign: function(transport){
      if (this.sessionKey)
      {
        this.signature(transport, this.sessionData);
        return true;
      }
      else
      {
        /** @cut */ basis.dev.warn('Request ignored. Service have no session key');
      }
    },

    openSession: function(sessionKey, sessionData){
      this.sessionKey = sessionKey;
      this.sessionData = sessionData || sessionKey;

      this.unfreeze();

      this.emit_sessionOpen();
    },

    closeSession: function(){
      this.freeze();

      this.emit_sessionClose();
    },

    freeze: function(){
      if (!this.sessionKey)
        return;

      this.sessionKey = null;
      this.sessionData = null;

      this.stoppedTransports = this.inprogressTransports.filter(function(transport){
        return transport.secure;
      });

      for (var i = 0, transport; transport = this.inprogressTransports[i]; i++)
        transport.stop();

      this.emit_sessionFreeze();
    },

    unfreeze: function(){
      if (this.stoppedTransports)
      {
        for (var i = 0, transport; transport = this.stoppedTransports[i]; i++)
          transport.resume();
        this.stoppedTransports = null;
      }

      this.emit_sessionUnfreeze();
    },

    createTransport: function(config){
      return new this.transportClass(config);
    },

    createAction: function(config){
      return createAction(basis.object.complete({
        service: this
      }, config));
    },

    destroy: function(){
      this.inprogressRequests = null;
      this.inprogressTransports = null;
      this.stoppedTransports = null;
      this.sessionKey = null;
      this.sessionData = null;

      Emitter.prototype.destroy.call(this);
    }
  });

  //
  // exports
  //
  module.exports = {
    Service: Service
  };
