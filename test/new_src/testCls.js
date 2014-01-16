require('basis.data');
require('basis.dom.wrapper');

var arrayFrom = basis.array.from;

var ERROR_WRONG_ANSWER = 1;
var ERROR_TYPE_MISSMATCH = 2;
var ERROR_TEST_FAULT = 3;

function sliceOwnOnly(obj){
  var result = {};

  for (var key in obj)
    if (obj.hasOwnProperty(key))
      result[key] = obj[key];

  return result;
}

function resolveError(answer, result){
  if (typeof answer != typeof result)
    return ERROR_TYPE_MISSMATCH;

  if (answer != null && result != null && answer.constructor !== result.constructor)
    return ERROR_TYPE_MISSMATCH;

  if (!error && answer != result)
  {
    switch (typeof answer){
      case 'number':
      case 'string':
      case 'boolean':
      case 'function':
      case 'undefined':
        if (answer !== result)
          return ERROR_WRONG_ANSWER;

      default:
        if (result === answer)
          return;

        if ((!result && answer) || (result && !answer))
          return ERROR_WRONG_ANSWER;

        if (answer && 'length' in answer)
        {
          if (answer.length != result.length)
            return ERROR_WRONG_ANSWER;

          for (var i = 0; i < answer.length; i++)
            if (answer[i] !== result[i])
              return ERROR_WRONG_ANSWER;
        }
        else
        {
          for (var i in answer)
            if (!(i in result) || answer[i] !== result[i])
              return ERROR_WRONG_ANSWER;

          for (var i in result)
            if (!(i in answer) || answer[i] !== result[i])
              return ERROR_WRONG_ANSWER;
        }
    }
  }
}

function checkAnswer(answer, result){
  var error = resolveError(answer, result);

  if (error)
  {
    this.report.errorLines[this.report.testCount] = {
      error: error,
      answer: answer && typeof answer == 'object' ? (Array.isArray(answer) ? arrayFrom(answer) : sliceOwnOnly(answer)) : answer,
      result: result && typeof result == 'object' ? (Array.isArray(result) ? arrayFrom(result) : sliceOwnOnly(result)) : result
    };
    this.report.testCount++;
  }
  else
  {
    this.report.testCount++;
    this.report.successCount++;
  }
};

var Test = basis.dom.wrapper.Node.subclass({
  className: 'Test',

  name: '',
  test: function(){
  },

  // name
  // before
  // test
  // after
  init: function(){
    basis.dom.wrapper.Node.prototype.init.call(this);

    var test = this.data.test;
    if (test)
    {
      if (basis.resource.isResource(test))
        test = test.fetch();

      if (Array.isArray(test))
        this.setChildNodes(test);
      else
        this.test = test;
    }
  },

  childClass: basis.Class.SELF,

  reset: function(){
    this.setState(basis.data.STATE.UNDEFINED);
    this.childNodes.forEach(function(test){
      test.reset();
    });
  },
  run: function(prevData){
    var _warn = basis.dev.warn;
    var _error = basis.dev.error;
    var warnMessages = [];
    var errorMessages = [];
    var report = new basis.data.Object();
    var isSuccess;
    var error;
    var env = {
      is: checkAnswer,
      report: {
        successCount: 0,
        testCount: 0,
        errorLines: []
      }
    };

    this.setState(basis.data.STATE.PROCESSING);

    try {
      // basis.dev.warn = function(){
      //   warnMessages.push(arguments);
      //   _warn.apply(this, arguments);
      // };
      // basis.dev.error = function(){
      //   errorMessages.push(arguments);
      //   _error.apply(this, arguments);
      // };

      prevData = this.test.call(env, prevData);
    } catch(e) {
      env.report.testCount++;
      prevData = undefined;

      error = e;
    } finally {
      // basis.dev.warn = _warn;
      // basis.dev.error = _error;
    }

    if (env.report.testCount != env.report.successCount)
      error = ERROR_TEST_FAULT;

    env.report.error = error;
    env.report.empty = !error && env.report.testCount == 0;
    env.report.result = !error && !errorMessages.length;
    env.report.warns = warnMessages.length ? warnMessages : null;

    report.update(env.report);

    this.setState(error ? basis.data.STATE.ERROR : basis.data.STATE.READY, report);

    return prevData;
  }
});

module.exports = Test;
