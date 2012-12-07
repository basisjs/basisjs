
  basis.require('basis.event');
  basis.require('basis.net');

 /**
  * @namespace basis.net.service
  */

  var namespace = this.path;

  var EventObject = basis.event.EventObject;

  var AjaxTransport = basis.net.AjaxTransport;
  var AjaxRequest = basis.net.AjaxRequest;

  var createEvent = basis.event.create;

 /**
  * @class Service
  */

  var SERVICE_HANDLER = {
    start: function(service, request){
      this.inprogressTransports.add(request.transport);
    },
    complete: function(service, request){
      this.inprogressTransports.remove(request.transport);
    }
  };


  var Service = EventObject.subclass({
    className: namespace + '.Service',

    inprogressTransports: null,

    transportClass: AjaxTransport,
    requestClass: AjaxRequest,

    event_sessionOpen: createEvent('sessionOpen'),
    event_sessionClose: createEvent('sessionClose'),
    event_sessionFreeze: createEvent('sessionFreeze'),
    event_sessionUnfreeze: createEvent('sessionUnfreeze'),

    isSecure: false,

    prepare: Function.$true,
    signature: Function.$undef,
    isSessionExpiredError: Function.$false,

    init: function(){
      EventObject.prototype.init.call(this);

      this.inprogressTransports = [];

      var TransportClass = this.transportClass;

      this.transportClass = this.transportClass.subclass({
        service: this,

        needSignature: this.isSecure,

        event_failure: function(req){
          TransportClass.prototype.event_failure.call(this, req);

          if (this.needSignature && this.service.isSessionExpiredError(req))
          {
            this.service.freeze();
            this.service.stoppedTransports.push(this);
            this.stop();
          }
        },

        request: function(requestData){
          if (!this.service.prepare(this, requestData))
            return;

          if (this.needSignature && !this.service.sign(this))
            return;

          return TransportClass.prototype.request.call(this, requestData);
        },

        requestClass: this.requestClass
      });

      this.addHandler(SERVICE_HANDLER, this);
    },

    sign: function(transport){
      if (this.sessionKey)
      {
        this.signature(transport, this.sessionData);
        return true;
      }
      else
      {
        ;;; if (typeof console != 'undefined') console.warn('Request skipped. Service session is not opened');
        return false;
      }
    },

    openSession: function(sessionKey, sessionData){
      this.sessionKey = sessionKey;
      this.sessionData = sessionData;

      this.unfreeze();

      this.event_sessionOpen();
    },

    closeSession: function(){
      this.freeze();

      this.event_sessionClose();
    },

    freeze: function(){ 
      if (!this.sessionKey)
        return;

      this.sessionKey = null;
      this.sessionData = null;

      this.stoppedTransports = this.inprogressTransports.filter(function(transport){
        return transport.needSignature;
      });

      for (var i = 0, transport; transport = this.inprogressTransports[i]; i++)
        transport.stop();

      this.event_sessionFreeze();
    },

    unfreeze: function(){
      if (this.stoppedTransports)
      {
        for (var i = 0, transport; transport = this.stoppedTransports[i]; i++)
          transport.resume();
      }

      this.event_sessionUnfreeze();
    },
    
    createTransport: function(config){
      return new this.transportClass(config);
    },

    destroy: function(){
      delete this.inprogressTransports;
      delete this.stoppedTransports;
      delete this.sessionData;
      delete this.sessionKey;

      EventObject.prototype.destroy.call(this);
    }
  });

  //
  // exports
  //
  module.exports = {
    Service: Service
  }
