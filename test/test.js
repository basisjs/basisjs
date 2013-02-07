/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){
    basis.require('basis.dom');
    basis.require('basis.cssom');
    basis.require('basis.ua');
    basis.require('basis.event');
    basis.require('basis.data.property');

    var namespace = 'basis.test';

    // import names

    var DOM = basis.dom;
    var cssClass = basis.cssom.classList;
    var extend = basis.object.extend;
    var arrayFrom = basis.array.from;
    var Class = basis.Class;

    var EventObject = basis.event.EventObject;
    var Property = basis.data.property.Property;

    var events = basis.event.events;
    var createEvent = basis.event.create;

    // const

    var TEST_NUMBER = 0;
    var TestFaultError = new Error('Test fault');

    function sliceOwnOnly(obj){
      var res = {};
      for (var key in obj)
        if (obj.hasOwnProperty(key))
          res[key] = obj[key];
      return res;
    }

    /*
     *  Tools
     */

    function value2string(value, linear){
      switch (typeof value)
      {
        case 'boolean':
        case 'number':
        case 'undefined':
          return String(value);
        case 'string':
          return value.quote("'");
        case 'function':
          return !linear ? value.toString() : value.toString().replace(/\{([\r\n]|.)*\}/, '{..}');
        case 'object':
          if (value === null)
            return 'null';
          
          if (Array.isArray(value))
            return "[" + value.map(value2string).join(', ') + "]";
          
          if (value.constructor == Date)
            return String(value);

          if (!linear)
          {
            var res = [];
            for (var key in value)
              if (value.hasOwnProperty(key))
                res.push(key + ': ' + value2string(value[key], true));
              
            return '{ ' + res.join(', ') + ' }';
          }
          else
            return '{object}';

        default:
          return "unknown type '" + (typeof value) + "'";
      }
    }

    /*
     *  Test
     */

    var AbstractTest = Class(EventObject, {
      className: namespace + '.AbstractTest',

      result:   false,
      error:    null,
      complete: false,
      empty:    false,
      broken:   false,

      testCount: 0,
      successCount: 0,
      totalTestCount: 1,
      completeTestCount: 0,

      event_progress: createEvent('progress'),
      event_reset: createEvent('reset'),
      event_over: createEvent('over'),

      name: 'no name',
      testType: 'AbstractTest',

      extendConstructor_: false,
      init: function(name, critical){
        EventObject.prototype.init.call(this);
        this.name = (name || 'test#' + TEST_NUMBER++);
        this.critical = critical || false;
        this.timer = 0;
        this.tester = Tester;
      },
      reset: function(){
        if (TesterState == 'stop')
        {
          delete this.over;
          this.broken = false;
          this.empty = false;
          this.result = false;
          this.complete = false;
          this.error = null;
          this.successCount = 0;

          var tmp = this.completeTestCount;
          this.completeTestCount = 0;
          this.progress(-tmp);

          this.event_reset();
        }
      },

      run: basis.fn.$null,

      isSuccess: function(){
        return this.testCount == this.successCount;
      },
      over: function(error){
        this.over     = basis.fn.$null;
        this.empty    = !error && this.testCount == 0;
        this.result   = !error && this.isSuccess();
        this.error    = error;
        this.complete = true;

        var tmp = this.totalTestCount - this.completeTestCount;
        this.completeTestCount = this.totalTestCount;
        this.progress(tmp);

        this.event_over();
      },
      success: basis.fn.$null,
      fault: basis.fn.$null,
      progress: function(diff){
        if (diff)
          this.event_progress(diff, this.completeTestCount/(this.totalTestCount || 1));
      },
      toString: function(){
        return (this.testType ? this.testType + ' ' : '') + this.name + ': ' + (this.empty ? 'empty' : (!this.complete ? 'uncomplete' : (this.success ? 'success' : 'fault (passed {1} of {0})'.format(this.testCount, this.successCount))));
      },
      toHTML: function(){
        return DOM.createElement('', this.toDOM()).innerHTML;
      },
      toDOM: function(DOMFOR){
        if (DOMFOR) DOM = DOMFOR;
        return DOM.createElement('.' + this.testType, 
                 DOM.createElement('SPAN', this.testType),
                 '\xA0',
                 DOM.createElement('EM', this.name),
                 ': ',
                 DOM.createElement('SPAN.' + (this.empty ? 'empty' : (!this.complete ? 'uncomplete' : (this.result ? 'success' : 'fault'))),
                   this.empty ? 'empty' : (!this.complete ? 'uncomplete' : (this.result ? 'success' : 'fault'))
                 ),
                 this.complete && !this.result ? DOM.createElement('SPAN.comment', ' (passed {1} of {0})'.format(this.testCount, this.successCount)) : null
               );
      }

    });

    var re0001 = new RegExp('\u0001', 'g');
    var re0002 = new RegExp('\u0002(\\d+)\u0002', 'g');
    var reThisIs = new RegExp('this\\.is\u0002', 'g');
    var Test = Class(AbstractTest, {
      className: namespace + '.Test',

      testType: 'Test',

      init: function(name, critical, test){
        AbstractTest.prototype.init.call(this, name, critical);
        this.test = test;

        this.errorLines = [];
        this.testLines = [];

        var testIndex = 0;

        var t, s = test.toString();
        var lines;
        var str = [];
        var parenthesis = [];  

        // remove function(){ }
        s = s.replace(/^\s*function\s*\([^)]*\)\s*\{\s*[\r\n]+/, '')
             .replace(/\s*\}\s*$/, '');

        // remove leading space
        var ss = s.match(/(^|[\r\n]) +/g);
        if (ss)
        {
          ss = ss.sort();
          var scount = !/^[\r\n]/.test(ss.item(-1).charAt(0)) ? ss.item(-1).length : 0;
          scount = Math.min(scount, ss.item().length - 1);
          if (scount)
            s = s.replace(new RegExp('(^|[\r\n]) {' + scount + '}', 'g'), '$1');
        }

        // remove & store string
        s = s.replace(/"(\\.|[^"])*?"|'(\\.|[^'])*?'|\/\/.+|\/\*(.|\s)*?\*\/|([^\)a-zA-Z0-9]\s*)\/([^\*\/](\\.|[^\/])*)\//g, 
                      function(m, p1, p2, p3, p4, p5){
                        str.push((p4 ? '/' + (p5 || '') + '/' : m));
                        return (p4 || '') + '\u0001'; 
                      });

        // remove & store parenthesis 
        while (s != (t = s.replace(/\([^\(\)]*\)/, function(m){ var idx = parenthesis.push(m) - 1; return '\u0002' + String(idx) + '\u0002'; })))
          s = t;

        // break into lines
        lines = s.split(/\r?\n|\n?\r/);

        // search for this.is
        for (var i = 0; i < lines.length; i++)
          if (lines[i].match(reThisIs))
            this.testLines[i] = testIndex++;

        // restore parenthesis
        for (var i = lines.length - 1; i >= 0; i--)
          while (lines[i] != (t = lines[i].replace(re0002, function(m, idx){ return parenthesis[idx]; })))
            lines[i] = t;

        // restore strings
        for (var i = 0; i < lines.length; i++)
          lines[i] = lines[i].replace(re0001, function(){ 
            var s = str.shift();
            if (/^['"]/.test(s))
              return s.replace(/\\u([0-9a-f]{4})/ig, function(m, code){ return String.fromCharCode(parseInt(code, 16)); });
            else
              return s;
          });//.replace(/ /g, '\xA0');

        this.testText = lines.join('\n');
        this.lines = lines;
      },
      reset: function(){
        if (TesterState == 'stop')
        {
          this.errorLines = [];
          this.testCount = 0;
          AbstractTest.prototype.reset.call(this);
        }
      },
      run: function(){
        var error;

        try {
          Tester.result = this;
          this.test.call(Tester);
        } catch(e) {
          this.testCount++;

          if (typeof e == 'string')
            e = { message: e };

          error = e;
          this.broken = ['Wrong answer', 'Type mismatch'].has(e.message);
        } finally {
          if (this.critical && !this.isSuccess())
            error = TestFaultError;
            
          this.over(error);
        }
      },
      toDOM: function(){
        var element = AbstractTest.prototype.toDOM.call(this);
        if (!this.result)
        {
          var pre;
          element.appendChild(pre = DOM.createElement('DIV.code'));

          var result = new Array();
          var uncomplete = false;
          for (var i = 0; i < this.lines.length; i++)
          {
            var node = DOM.createElement('.line', DOM.createElement({ description: '.lineText', click: function(event){ cssClass(this.parentNode).toggle('show-error-details'); }}, this.lines[i]));
            var testIndex = this.testLines[i];

            if (uncomplete)
              cssClass(node).add('UncompleteLine');
            else if (typeof testIndex != 'undefined')
            {
              var lineError   = this.errorLines[testIndex];
              var isErrorLine = !!lineError;
              var isBreakLine = this.error && !this.broken && testIndex == this.testCount -1;
              var isLastLine  = isBreakLine || (this.broken && testIndex == this.testCount - 1);

              if (isBreakLine || isLastLine)
                cssClass(node).add('BreakLine');
              else if (isErrorLine)
                cssClass(node).add('ErrorLine');

              if (isErrorLine || isBreakLine)
              {
                var details = new Array();

                if (lineError && lineError.error)
                  details.push(
                    DOM.createElement('B', 'Error:'),
                    DOM.createElement('SPAN', lineError.error.message)
                  );

                if (isBreakLine)
                  details.push(
                    DOM.createElement('B', 'Error:'),
                    DOM.createElement('SPAN', this.error.message)
                  );

                if (isErrorLine)
                  details.push(
                    DOM.createElement('B', 'Answer:'),
                    DOM.createElement('SPAN.answer', value2string(lineError.result)),
                    DOM.createElement('B', 'Expected:'),
                    DOM.createElement('SPAN.expect', value2string(lineError.answer))
                  );

                node.firstChild.appendChild(DOM.createElement('.ErrorDetailsExpander'));
                node.appendChild(DOM.createElement('.ErrorDetails', DOM.createElement('', details)));
              }

              uncomplete = isLastLine;
            }

            result.push(node);
          }
          DOM.insert(pre, result);
        }
        return element;
      },
      success: function(){
        this.testCount++;
        this.successCount++;
      },
      fault: function(error, answer, result){
        this.errorLines[this.testCount] = {
          error: error,
          answer: answer && typeof answer == 'object' ? (Array.isArray(answer) ? arrayFrom(answer) : sliceOwnOnly(answer)) : answer,
          result: result && typeof result == 'object' ? (Array.isArray(result) ? arrayFrom(result) : sliceOwnOnly(result)) : result
        };
        this.testCount++;
      }
    });

    var testcaseHandler = {
      over: function(error){
        var self = this;

        // process test result
        this.testcase[self.test.isSuccess() ? 'success' : 'fault']();
//        this.testcase.complete(this.test.completeTestCount);

        // copy test error to testcase if testcase or test is critical
        if (this.test.error && (this.test.critical || this.testcase.critical))
          this.testcase.error = this.test.error;

        // run next step, after all event handlers fires
        this.testcase.timer = setTimeout(function(){ 
          // run next test
          self.testcase.run(self.nextStep);
        }, 0);

        // unlink handler
        this.test.removeHandler(testcaseHandler, this);
      }
    };

    var TestCase = Class(AbstractTest, {
      className: namespace + '.TestCase',

      testType: 'TestCase',

      event_progress: function(diff, progress){
        events.progress.call(this, diff, progress);
        this.completeTestCount += diff;
      },

      init: function(name, critical, tests){
        AbstractTest.prototype.init.call(this, name, critical);

        this.items = [];
        this.totalTestCount = 0;
        for (var i = 0, item, config; config = tests[i]; i++)
        {
          if (config.test)
            item = new Test(config.name, config.critical, config.test);
          else
            item = new TestCase(config.name, config.critical, config.testcase);

          item.addHandler({
            progress: function(sender, diff, progress){
              this.event_progress(diff, (this.completeTestCount + diff)/(this.totalTestCount || 0));
            },
            over: function(sender){
              if (sender instanceof TestCase)
                this.totalSuccessTestCount += sender.totalSuccessTestCount;
              else
                this.totalSuccessTestCount += sender.isSuccess();
            }
          }, this);

          this.items[i] = item;
          this.totalTestCount += item.totalTestCount;
        }
        this.totalSuccessTestCount = 0;
        this.testCount = this.items.length;
      },
      reset: function(){
        if (TesterState == 'stop')
        {
          this.items.forEach(function(item){ item.reset(); });
          AbstractTest.prototype.reset.call(this);
          return true;
        }
      },
      run: function(step){
        step = step || 0;

        clearTimeout(this.timer);

        if (TesterState != 'run')
        {
          TesterPos = { test: this, step: step };
          return;
        }

        if (step >= this.testCount || this.error)
          this.over(this.error);
        else
        {
          var test = this.items[step];

          test.addHandler(testcaseHandler, { testcase: this, test: test, nextStep: step + 1 });
          test.run();          
        }
      },
      success: function(){
        this.successCount++;
      },
      toDOM: function(DOMFOR){
        if (DOMFOR) DOM = DOMFOR;
        return DOM.createElement('.' + this.testType,
                 DOM.createElement('P.' + (this.empty ? 'empty' : (!this.complete ? 'uncomplete' : (this.result ? 'success' : 'fault'))), 
                   DOM.createElement('SPAN', this.testType),
                   '\xA0',
                   DOM.createElement('EM', this.name),
                   (!this.success ? ' ({1} passed of {0})'.format(this.testCount, this.successCount) : '') + ':'
                 ),
                 DOM.createElement('UL', this.items.map(function(item){ return DOM.createElement('LI.' + item.testType, item.toDOM(DOM)); }))
               );
      }
    });


    /*
     *  Tester
     */

    // private variables
    var TesterState = 'stop';
    var TesterPos;
    var RunTest;

    var TesterOverHandler = {
      over: function(){ 
        this.stop();
      } 
    };

    // main object
    var Tester = new EventObject({
      dataStack: [{}],
      resultStack: [],

      // state property
      state: new Property(TesterState),

      is: function(answer, result, critical){
        var error;
        if (
            typeof answer != typeof result 
            || 
            (answer != null && result != null && answer.constructor != result.constructor)
           )
          error = new Error('Type mismatch');
        else if (answer != result)
        {
          switch (typeof answer){
            case 'number':
            case 'string':
            case 'boolean':
            case 'function':
            case 'undefined':
              if (answer !== result)
                error = new Error('Wrong answer');
            break;
            default:
              if (result === answer)
              {
                break;
              }

              if ((!result && answer) || (result && !answer))
              {
                error = new Error('Wrong answer');
                break;
              }

              if (answer && 'length' in answer)
              {
                if (answer.length != result.length)
                  error = new Error('Wrong answer');
                else
                  for (var i = 0; i < answer.length; i++)
                    if (answer[i] !== result[i])
                    {
                      error = new Error('Wrong answer');
                      break;
                    }
              }
              else
              {
                for (var i in answer)
                  if (!(i in result) || answer[i] !== result[i])
                  {
                    error = new Error('Wrong answer');
                    break;
                  }
                for (var i in result)
                  if (!(i in answer) || answer[i] !== result[i])
                  {
                    error = new Error('Wrong answer');
                    break;
                  }
              }
          }
        }

        if (error)
        {
          this.result.fault(error, answer, result);

          if (critical)
            throw error;
          else
            return error;
        }
        else
          this.result.success();
      },

      stop: function(){
        if (!TesterPos)
          TesterPos = { test: RunTest, step: 0 };

        RunTest.removeHandler(TesterOverHandler, this);
        RunTest = null;

        TesterState = 'stop';

        this.state.set(TesterState);
      },
      run: function(testcase){
        if (TesterPos || testcase instanceof AbstractTest)
        {
          var step = 0;

          RunTest = testcase;

          if (TesterPos)
          {
            RunTest = TesterPos.test;
            step = TesterPos.step;

            TesterPos = null;
          }

          if (RunTest.complete)
            RunTest.reset();

          TesterState = 'run';
          this.state.set(TesterState);

          RunTest.addHandler(TesterOverHandler, this);
          RunTest.run(step);
        }
        else
          throw new Error('Instance of AbstractTest excepted');
      },

      parse: function(name, testcase, critical){
        var result = new TestCase(name, critical, testcase);
        TesterPos = { test: result, step: 0 };
        return result;
      }

    });

    //
    // Export
    //

    basis.namespace(namespace).extend({
      Tester: Tester
    });

  })();
