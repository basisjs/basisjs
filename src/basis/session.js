
  basis.require('basis.event');


 /**
  * @namespace basis.session
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var extend = Object.extend;
  var keys = Object.keys;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;
  var events = basis.event.events;


  /*
   *  Common
   */

  var EXCEPTION_SESSION_NOT_OPEN = 'No opened session';
  var EXCEPTION_SESSION_IS_FROZEN = 'Session is frozen';

  var activeSession;
  var timestamp;
  var freezeState = false;
  var sessions = {};

  function getSession(key){
    if (!sessions[key])
      sessions[key] = new Session(key);

    return sessions[key];
  }

  var genTimestamp = Date.now;

  /*
   *  SessionManager
   */

  var SessionManager = new EventObject({
    event_sessionOpen: createEvent('sessionOpen'),
    event_sessionClose: createEvent('sessionClose'),
    event_sessionFreeze: createEvent('sessionFreeze'),
    event_sessionUnfreeze: createEvent('sessionUnfreeze'),

    isOpened: function(){
      return !!activeSession;
    },
    getTimestamp: function(){
      if (activeSession)
        return timestamp;
    },
    open: function(key, data){
      var session = getSession(key);

      if (activeSession === session)
      {
        // if session isn't changed, unfreeze active session only (if necessary)
        if (freezeState)
          this.unfreeze();

        return;
      }

      // close current session
      this.close();

      // set new active session
      activeSession = session;
      timestamp = genTimestamp();

      // update session data
      if (data)
        extend(session.data, data);

      ;;;basis.dev.info('Session opened: ' + activeSession.key);

      // fire event
      this.event_sessionOpen();
    },
    close: function(){
      if (activeSession)
      {
        if (freezeState)
          this.unfreeze();

        ;;;basis.dev.info('Session closed: ' + activeSession.key);

        this.event_sessionClose();

        activeSession = null;
        timestamp = null;
      }
    },
    freeze: function(){
      if (activeSession && !freezeState)
      {
        this.event_sessionFreeze();

        freezeState = true;
        timestamp = null;
      }
    },
    unfreeze: function(){
      if (activeSession && freezeState)
      {
        freezeState = false;
        timestamp = genTimestamp();

        this.event_sessionUnfreeze();
      }
    },
    storeData: function(key, data){
      if (activeSession)
        return activeSession.storeData(key, data);
      else
        throw new Error(EXCEPTION_SESSION_NOT_OPEN);
    },
    getData: function(key){
      if (activeSession)
        return activeSession.getData(key);
      else
        throw new Error(EXCEPTION_SESSION_NOT_OPEN);
    },
    destroy: function(){
      var keys = keys(sessions);
      var key;
      while (key = keys.pop())
        sessions[key].destroy();

      EventObject.prototype.destroy.call(this);
    }
  });

  /*
   *  Session
   */

  var Session = Class(EventObject, {
    className: namespace + '.Session',

    event_destroy: function(){
      events.event_destroy.call(this);

      if (activeSession == this)
        SessionManager.close();
      delete sessions[this.key];
    },

    extendConstructor_: false,
    init: function(key){
      EventObject.prototype.init.call(this);

      this.key = key;
      this.data = {};

      ;;;basis.dev.info('Session created: ' + key);
    },
    storeData: function(key, data){
      if (freezeState)
        throw new Error(EXCEPTION_SESSION_IS_FROZEN);

      return this.data[key] = data;
    },
    getData: function(key){
      if (freezeState)
        throw new Error(EXCEPTION_SESSION_IS_FROZEN);

      return this.data[key];
    },
    destroy: function(){
      EventObject.prototype.destroy.call(this);

      var keys = keys(this.data);
      var key;
      while (key = keys.pop())
      {
        var data = this.data[key];
        if (data != null && typeof data.destroy == 'function')
          data.destroy();
        delete this.data[key];
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    SessionManager: SessionManager
  };
