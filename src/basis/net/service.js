
  basis.require('basis.event');
  basis.require('basis.net.proxy');
  basis.require('basis.net.ajax');

 /**
  * @namespace basis.net.service
  */

  var namespace = this.path;

  var EventObject = basis.event.EventObject;

  var AjaxProxy = basis.net.ajax.AjaxProxy;
  var AjaxRequest = basis.net.ajax.AjaxRequest;

  var createEvent = basis.event.create;

 /**
  * @class Service
  */

  var SERVICE_HANDLER = {
    start: function(service, request){
      this.inprogressProxies.add(request.proxy);
    },
    complete: function(service, request){
      this.inprogressProxies.remove(request.proxy);
    }
  };


  var Service = EventObject.subclass({
    className: namespace + '.Service',

    proxyClass: AjaxProxy,
    requestClass: AjaxRequest,

    event_sessionOpen: createEvent('sessionOpen'),
    event_sessionClose: createEvent('sessionClose'),
    event_sessionFreeze: createEvent('sessionFreeze'),
    event_sessionUnfreeze: createEvent('sessionUnfreeze'),

    //event_service_failure: createEvent('service_failure'),
    isSecure: false,

    prepare: Function.$true,
    signature: Function.$undef,
    isSessionExpiredError: Function.$false,

    init: function(){
      EventObject.prototype.init.call(this);

      this.inprogressProxies = [];

      this.proxyClass = this.proxyClass.subclass({
        service: this,

        needSignature: this.isSecure,

        event_failure: function(req){
          this.constructor.superClass_.prototype.event_failure.call(this, req);

          if (this.needSignature && this.service.isSessionExpiredError(req))
          {
            this.service.freeze();
            this.service.stoppedProxies.push(this);
            this.stop();
          }
        },

        request: function(requestData){
          if (!this.service.prepare(this, requestData))
            return;

          if (this.needSignature && !this.service.sign(this))
            return;

          return this.constructor.superClass_.prototype.request.call(this, requestData);
        },

        requestClass: this.requestClass
      });

      this.addHandler(SERVICE_HANDLER, this);
    },

    sign: function(proxy){
      if (this.sessionKey)
      {
        this.signature(proxy, this.sessionData);
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

      this.stoppedProxies = this.inprogressProxies.filter(function(proxy){
        return proxy.needSignature;
      });

      for (var i = 0, proxy; proxy = this.inprogressProxies[i]; i++)
        proxy.stop();

      this.event_sessionFreeze();
    },

    unfreeze: function(){
      if (this.stoppedProxies)
      {
        for (var i = 0, proxy; proxy = this.stoppedProxies[i]; i++)
          proxy.resume();
      }

      this.event_sessionUnfreeze();
    },
    
    createProxy: function(config){
      return new this.proxyClass(config);
    },

    destroy: function(){
      delete this.inprogressProxies;
      delete this.stoppedProxies;
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
