
  basis.require('basis.event');
  basis.require('basis.data');

 /**
  * @namespace basis.net.proxy
  */

  var namespace = this.path;

  var arrayFrom = basis.array.from;
  var DataObject = basis.data.DataObject;
  var EventObject = basis.event.EventObject;

  var createEvent = basis.event.create;

 /**
  * @class Request
  */

  var Request = DataObject.subclass({
    className: namespace + '.Request',

    influence: null,

    event_stateChanged: function(oldState){
      DataObject.prototype.event_stateChanged.call(this, oldState);

      if (this.influence)
      {
        for (var i = 0; i < this.influence.length; i++)
          this.influence[i].setState(this.state, this.state.data);
      }
    },

    init: function(){
      DataObject.prototype.init.call(this);
      this.influence = [];
    },
    
    setInfluence: function(influence){
      this.influence = arrayFrom(influence);
    },
    clearInfluence: function(){
      this.influence = null;
    },

    destroy: function(){
      DataObject.prototype.destroy.call(this);

      this.clearInfluence();
    }
  });

 /**
  * @class Proxy
  */

  var Proxy = EventObject.subclass({
    className: namespace + '.Proxy',

    requests: null,
    poolLimit: null,
    poolHashGetter: Function.$true,

    event_start: createProxyEvent('start'),
    event_timeout: createProxyEvent('timeout'),
    event_abort: createProxyEvent('abort'),
    event_success: createProxyEvent('success'),
    event_failure: createProxyEvent('failure'),
    event_complete: createProxyEvent('complete'),

    init: function(){
      this.requests = {};
      this.requestQueue = [];
      this.inprogressRequests = [];

      EventObject.prototype.init.call(this);

      // handlers
      this.addHandler(PROXY_REQUEST_HANDLER, this);

      if (this.poolLimit)
        this.addHandler(PROXY_POOL_LIMIT_HANDLER, this);
    },

    getRequestByHash: function(requestHashId){
      if (!this.requests[requestHashId])
      {
        var request;
        //find idle transport
        for (var i in this.requests)
          if (this.requests[i].isIdle() && !this.requestQueue.has(this.requests[i]))
          {
            request = this.requests[i];
            delete this.requests[i];
          }

        this.requests[requestHashId] = request || new this.requestClass({ proxy: this });
      }

      return this.requests[requestHashId];
    },

    prepare: Function.$true,
    prepareRequestData: Function.$self,

    request: function(config){
      if (!this.prepare())
        return;

      var requestData = Object.slice(config);

      var requestData = this.prepareRequestData(requestData);
      var requestHashId = this.poolHashGetter(requestData);

      if (this.requests[requestHashId])
        this.requests[requestHashId].abort();

      var request = this.getRequestByHash(requestHashId);

      request.initData = Object.slice(config);
      request.requestData = requestData;
      request.setInfluence(requestData.influence || this.influence);

      if (this.poolLimit && this.inprogressRequests.length >= this.poolLimit)
      {
        this.requestQueue.push(request);
        request.setState(STATE.PROCESSING);
      }
      else
        request.doRequest();

      return request;
    },

    abort: function(){
      for (var i = 0, request; request = this.inprogressRequests[i]; i++)
        request.abort();

      for (var i = 0, request; request = this.requestQueue[i]; i++)
        request.setState(STATE.ERROR);

      this.inprogressRequests = [];
      this.requestQueue = [];
    },

    stop: function(){
      if (!this.stopped)
      {
        this.stoppedRequests = this.inprogressRequests.concat(this.requestQueue);
        this.abort();
        this.stopped = true;
      }
    },

    resume: function(){
      if (this.stoppedRequests)
      {
        for (var i = 0, request; request = this.stoppedRequests[i]; i++)
          request.proxy.request(request.initData);

        this.stoppedRequests = [];
      }
      this.stopped = false;
    },

    /*repeat: function(){ 
      if (this.requestData)
        this.request(this.requestData);
    },*/

    destroy: function(){
      for (var i in this.requests)
        this.requests[i].destroy();

      delete this.requestData;
      delete this.requestQueue;

        
      EventObject.prototype.destroy.call(this);

      delete this.requests;
      cleaner.remove(this);
    }
  });

  var PROXY_REQUEST_HANDLER = {
    start: function(sender, request){
      this.inprogressRequests.add(request);
    },
    complete: function(sender, request){
      this.inprogressRequests.remove(request);
    }
  };

  var PROXY_POOL_LIMIT_HANDLER = {
    complete: function(){
      var nextRequest = this.requestQueue.shift();
      if (nextRequest)
      {
        setTimeout(function(){
          nextRequest.doRequest();
        }, 0);
      }
    }
  };

 /**
  * @function createEvent
  */

  function createProxyEvent(eventName) {
    var event = createEvent(eventName);

    return function(){
      event.apply(ProxyDispatcher, arguments);

      if (this.service)
        event.apply(this.service, arguments);

      event.apply(this, arguments);
    };
  }

  //
  // ProxyDispatcher
  //

  var ProxyDispatcher = new EventObject({
    abort: function(){
      var result = arrayFrom(inprogressProxies);
      for (var i = 0; i < result.length; i++)
        result[i].abort();

      return result;
    }
  });

  var inprogressProxies = [];
  ProxyDispatcher.addHandler({
    start: function(request){
      inprogressProxies.add(request.proxy);
    },
    complete: function(request){
      inprogressProxies.remove(request.proxy);
    }
  });

  Proxy.createEvent = createProxyEvent;

  //
  // exports
  //
  module.exports = {
    createEvent: createProxyEvent,

    Request: Request,
    Proxy: Proxy,

    ProxyDispatcher: ProxyDispatcher
  }

