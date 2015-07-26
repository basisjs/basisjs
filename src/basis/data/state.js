var hasOwnProperty = Object.prototype.hasOwnProperty;
var values = basis.object.values;
var STATE_EXISTS = {};

/**
* @enum {string}
*/
var STATE = {
  priority: [],
  values: {},

  /**
  * Register new state
  * @param {string} state
  * @param {string=} order
  */
  add: function(state, order){
    var name = state;
    var value = state.toLowerCase();

    STATE[name] = value;
    STATE_EXISTS[value] = name;
    this.values[value] = name;

    if (order)
      order = this.priority.indexOf(order);
    else
      order = -1;

    if (order == -1)
      this.priority.push(value);
    else
      this.priority.splice(order, 0, value);
  },

  /**
  * Returns all registred states
  * @return {Array.<basis.data.STATE>}
  */
  getList: function(){
    return values(STATE_EXISTS);
  },

  /**
  * Check value is valid state.
  * @return {boolean}
  */
  isValid: function(value){
    return hasOwnProperty.call(STATE_EXISTS, value);
  },

  /**
  * NOTE: was implemented and deprecated during 1.4 developing.
  * @deprecated
  */
  factory: function(events, getter){
    /** @cut */ basis.dev.warn('basis.data.STATE.factory() is deprecated, use basis.data.Value.stateFactory() instead.');
    return Value.stateFactory(events, getter);
  },

  /**
  * NOTE: was implemented and deprecated during 1.4 developing.
  * @deprecated
  */
  from: function(source){
    /** @cut */ basis.dev.warn('basis.data.STATE.state() is deprecated, use basis.data.Value.state() instead.');
    return Value.state(source);
  }
};

// Register base states

STATE.add('READY');
STATE.add('DEPRECATED');
STATE.add('UNDEFINED');
STATE.add('ERROR');
STATE.add('PROCESSING');

module.exports = STATE;
