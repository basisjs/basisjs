var extend = basis.object.extend;
var createEventHandler = require('basis.event').createHandler;


/**
* Create ruleEvents property.
* @param {function(sender, ..args)} fn
* @param {string|Array.<string>} events
*/
module.exports = function createRuleEvents(fn, events){
  return (function createRuleEventsExtend(events){
    if (!events)
      return null;

    if (events.__extend__)
      return events;

    if (typeof events != 'string' && !Array.isArray(events))
      events = null;

    return extend(createEventHandler(events, fn), {
      __extend__: createRuleEventsExtend
    });
  })(events);
};
