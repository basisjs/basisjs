
  basis.require('basis.event');
  basis.require('basis.data');

 /**
  * @namespace basis.net
  */

  var namespace = this.path;


  //
  // import names
  //

  var extend = basis.object.extend;
  var arrayFrom = basis.array.from;
  var objectSlice = basis.object.slice;
  var objectMerge = basis.object.merge;
  var createEvent = basis.event.create;

  var STATE = basis.data.STATE;

  var DataObject = basis.data.Object;
  var Emitter = basis.event.Emitter;


 /**
  * @function createEvent
  */

  function createTransportEvent(eventName){
    var event = createEvent(eventName);

    return function transportEvent(){
      event.apply(transportDispatcher, arguments);

      if (this.service)
        event.apply(this.service, arguments);

      event.apply(this, arguments);
    };
  }

  function createRequestEvent(eventName){
    var event = createEvent(eventName);

    return function requestEvent(){
      var args = [this].concat(arrayFrom(arguments));

      event.apply(transportDispatcher, args);

      if (this.transport)
        this.transport['emit_' + eventName].apply(this.transport, args);

      event.apply(this, arguments);
    };
  }



  //
  // transport dispatcher
  //
  var inprogressTransports = [];
  var transportDispatcher = new Emitter({
    abort: function(){
      var result = arrayFrom(inprogressTransports);

      for (var i = 0; i < result.length; i++)
        result[i].abort();

      return result;
    },
    handler: {
      start: function(request){
        basis.array.add(inprogressTransports, request.transport);
      },
      complete: function(request){
        basis.array.remove(inprogressTransports, request.transport);
      }
    }
  });

 /**
  * @class AbstractRequest
  */

  var AbstractRequest = DataObject.subclass({
    className: namespace + '.AbstractRequest',

    influence: null,
    initData: null,
    requestData: null,

    transport: null,
    stateOnAbort: STATE.UNDEFINED,

    emit_start: createRequestEvent('start'),
    emit_timeout: createRequestEvent('timeout'),
    emit_abort: createRequestEvent('abort'),
    emit_success: createRequestEvent('success'),
    emit_failure: createRequestEvent('failure'),
    emit_complete: createRequestEvent('complete'),

    emit_stateChanged: function(oldState){
      DataObject.prototype.emit_stateChanged.call(this, oldState);

      if (this.influence)
        for (var i = 0; i < this.influence.length; i++)
          this.influence[i].setState(this.state, this.state.data);
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

    doRequest: basis.fn.$undef,
    getResponseData: basis.fn.$undef,

    destroy: function(){
      DataObject.prototype.destroy.call(this);

      this.initData = null;
      this.requestData = null;
      this.clearInfluence();
    }
  });

 /**
  * @class AbstractTransport
  */

  var AbstractTransport = Emitter.subclass({
    className: namespace + '.AbstractTransport',

    requestClass: AbstractRequest,

    requests: null,
    poolLimit: null,
    poolHashGetter: basis.fn.$true,

    emit_start: createTransportEvent('start'),
    emit_timeout: createTransportEvent('timeout'),
    emit_abort: createTransportEvent('abort'),
    emit_success: createTransportEvent('success'),
    emit_failure: createTransportEvent('failure'),
    emit_complete: createTransportEvent('complete'),

    init: function(){
      this.requests = {};
      this.requestQueue = [];
      this.inprogressRequests = [];

      Emitter.prototype.init.call(this);

      // handlers
      this.addHandler(TRANSPORT_REQUEST_HANDLER, this);

      if (this.poolLimit)
        this.addHandler(TRANSPORT_POOL_LIMIT_HANDLER, this);
    },

    getRequestByHash: function(requestHashId){
      var request = this.requests[requestHashId];

      if (!request)
      {
        //find idle transport
        for (var id in this.requests)
          if (this.requests[id].isIdle() && !this.requestQueue.indexOf(this.requests[id]) != -1)
          {
            request = this.requests[id];
            delete this.requests[id];
            break;
          }

        if (!request)
          request = new this.requestClass({
            transport: this
          });

        this.requests[requestHashId] = request;
      }

      return request;
    },

    prepare: basis.fn.$true,
    prepareRequestData: basis.fn.$self,

    request: function(config){
      if (!this.prepare())
        return;

      var requestData = objectSlice(config);
      var requestHashId = this.poolHashGetter(this.prepareRequestData(requestData));

      var request = this.getRequestByHash(requestHashId, true);

      if (request.initData)
        request.abort();

      request.initData = requestData;
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
          request.transport.request(request.initData);

        this.stoppedRequests = null;
      }
      this.stopped = false;
    },

    destroy: function(){
      for (var i in this.requests)
        this.requests[i].destroy();

      this.requests = {};
      this.inprogressRequests = null;
      this.requestQueue = null;
      this.stoppedRequests = null;

      Emitter.prototype.destroy.call(this);
    }
  });

  var TRANSPORT_REQUEST_HANDLER = {
    start: function(sender, request){
      basis.array.add(this.inprogressRequests, request);
    },
    complete: function(sender, request){
      basis.array.remove(this.inprogressRequests, request);
    }
  };

  var TRANSPORT_POOL_LIMIT_HANDLER = {
    complete: function(){
      var nextRequest = this.requestQueue.shift();
      if (nextRequest)
      {
        basis.nextTick(function(){
          nextRequest.doRequest();
        });
      }
    }
  };

  

  //
  // export names
  //
  module.exports = {
    createTransportEvent: createTransportEvent,
    createRequestEvent: createRequestEvent,
    transportDispatcher: transportDispatcher,

    AbstractRequest: AbstractRequest,
    AbstractTransport: AbstractTransport
  };
