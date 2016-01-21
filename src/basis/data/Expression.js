var basisData = require('basis.data');
var Value = basisData.Value;
var ReadOnlyValue = basisData.ReadOnlyValue;

var CLASSNAME = 'basis.data.Expression';
var EXPRESSION_SKIP_INIT = {};
var EXPRESSION_BBVALUE_HANDLER = function(){
  schedule.add(this);
};
var EXPRESSION_BBVALUE_DESTROY_HANDLER = function(){
  this.destroy();
};
var BBVALUE_GETTER = function(value){
  return value.bindingBridge.get(value);
};
var schedule = basis.asap.schedule(function(expression){
  expression.update();
});

function initExpression(){
  var count = arguments.length - 1;
  var calc = arguments[count];
  var values = new Array(count);

  if (typeof calc != 'function')
    throw new Error(CLASSNAME + ': Last argument of constructor must be a function');

  for (var i = 0; i < count; i++)
  {
    var value = values[i] = arguments[i];

    if (!value.bindingBridge)
      throw new Error(CLASSNAME + ': bb-value required');

    value.bindingBridge.attach(value, EXPRESSION_BBVALUE_HANDLER, this, EXPRESSION_BBVALUE_DESTROY_HANDLER);
  }

  this.calc_ = calc;
  this.values_ = values;
  this.update();

  /** @cut */ basis.dev.setInfo(this, 'sourceInfo', {
  /** @cut */   type: 'Expression',
  /** @cut */   source: values,
  /** @cut */   transform: calc
  /** @cut */ });

  return this;
}

/**
* @class
*/
var Expression = ReadOnlyValue.subclass({
  className: CLASSNAME,

  calc_: null,
  values_: null,

  // use custom constructor
  extendConstructor_: false,
  init: function(skip){
    ReadOnlyValue.prototype.init.call(this);

    if (skip === EXPRESSION_SKIP_INIT)
      return;

    initExpression.apply(this, arguments);
  },

  update: function(){
    schedule.remove(this);

    Value.prototype.set.call(this, this.calc_.apply(null, this.values_.map(BBVALUE_GETTER)));
  },

  destroy: function(){
    schedule.remove(this);

    for (var i = 0, value; value = this.values_[i]; i++)
      value.bindingBridge.detach(value, EXPRESSION_BBVALUE_HANDLER, this);

    ReadOnlyValue.prototype.destroy.call(this);
  }
});

Expression.create = function createExpression(){
  return initExpression.apply(new Expression(EXPRESSION_SKIP_INIT), arguments);
};

module.exports = Expression;
