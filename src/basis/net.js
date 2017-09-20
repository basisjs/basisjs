
 /**
  * @namespace basis.net
  */

  var namespace = 'basis.net';


  //
  // import names
  //

  var arrayFrom = basis.array.from;
  var objectSlice = basis.object.slice;

  var basisEvent = require('./event.js');
  var createEvent = basisEvent.create;
  var Emitter = basisEvent.Emitter;

  var DataObject = require('./data.js').Object;
  var STATE = require('./data.js').STATE;


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

      if (this.transport)
        this.transport['emit_' + eventName].apply(this.transport, args);
      else
        event.apply(transportDispatcher, args);

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


  //
  // Request
  //

 /**
  * @class
  */
  var AbstractRequest = DataObject.subclass({
    className: namespace + '.AbstractRequest',

    requestData: null,

    transport: null,
    stateOnAbort: STATE.UNDEFINED,

    emit_start: createRequestEvent('start'),
    emit_timeout: createRequestEvent('timeout'),
    emit_abort: createRequestEvent('abort'),
    emit_success: createRequestEvent('success'),
    emit_failure: createRequestEvent('failure'),
    emit_complete: createRequestEvent('complete'),

    abort: basis.fn.$undef,
    doRequest: basis.fn.$undef,

    destroy: function(){
      DataObject.prototype.destroy.call(this);

      this.requestData = null;
    }
  });


  //
  // Transport
  //

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


 /**
  * @class
  */
  var AbstractTransport = Emitter.subclass({
    className: namespace + '.AbstractTransport',

    requestClass: AbstractRequest,

    stopped: false,
    poolLimit: null,
    poolHashGetter: null,

    requests: null,
    requestQueue: null,
    inprogressRequests: null,
    stoppedRequests: null,

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

    getRequestByHash: function(requestData){
      function findIdleRequest(transport){
        for (var id in transport.requests)
        {
          var request = transport.requests[id];
          if (request.isIdle() && transport.requestQueue.indexOf(request) == -1)
          {
            delete transport.requests[id];
            return request;
          }
        }
      }

      var requestHashId = this.poolHashGetter
                            ? this.poolHashGetter(requestData)
                            : requestData.origin
                              ? requestData.origin.basisObjectId
                              : 'default';
      var request = this.requests[requestHashId];

      if (!request)
      {
        // find idle request or create new one
        request = findIdleRequest(this) || new this.requestClass({
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

      var requestData = this.prepareRequestData(objectSlice(config));
      var request = this.getRequestByHash(requestData);

      if (request.requestData)
        request.abort();

      request.requestData = requestData;

      if (!this.poolLimit || this.inprogressRequests.length < this.poolLimit)
      {
        request.doRequest();
      }
      else
      {
        this.requestQueue.push(request);
        request.setState(STATE.PROCESSING);
      }

      return request;
    },

    abort: function(){
      for (var request; request = this.requestQueue.pop();)
        request.setState(STATE.ERROR);

      for (var request; request = this.inprogressRequests.pop();)
        request.abort();
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
      if (this.stopped)
      {
        for (var request; request = this.stoppedRequests.pop();)
          this.request(request.requestData);

        this.stopped = false;
      }
    },

    destroy: function(){
      for (var id in this.requests)
        this.requests[id].destroy();

      this.requests = null;
      this.inprogressRequests = null;
      this.requestQueue = null;
      this.stoppedRequests = null;

      Emitter.prototype.destroy.call(this);
    }
  });


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
