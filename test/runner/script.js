// resources (40):
//  [string] [unknown#1] -> 0.css
//  [string] core/env/iframe_inject.code -> 0.code
//  [array] reporter/template/view.tmpl -> 8.tmpl
//  [array] reporter/module/toc/template/toc-item.tmpl -> 1.tmpl
//  [array] reporter/module/toc/template/toc.tmpl -> 2.tmpl
//  [array] core/env/iframe.tmpl -> 0.tmpl
//  [array] reporter/app/template/test.tmpl -> 4.tmpl
//  [array] reporter/app/template/test-suite.tmpl -> 5.tmpl
//  [array] reporter/app/template/test-case.tmpl -> 6.tmpl
//  [array] reporter/module/test-tree/template/view.tmpl -> 7.tmpl
//  [array] reporter/app/template/test-source.tmpl -> 3.tmpl
//  [string] core.js -> b.js
//  [function] core/runner.js -> c.js
//  [function] ../bower_components/basisjs/src/basis/data/dataset.js -> d.js
//  [function] ../bower_components/basisjs/src/basis/data/index.js -> e.js
//  [function] ../bower_components/basisjs/src/basis/data/value.js -> f.js
//  [function] ../bower_components/basisjs/src/basis/utils/benchmark.js -> g.js
//  [function] core/test.js -> h.js
//  [function] core/utils.js -> p.js
//  [function] ../bower_components/basisjs/src/basis/utils/info.js -> i.js
//  [function] ../bower_components/basisjs/src/basis/app.js -> 1.js
//  [function] core/env/iframe.js -> q.js
//  [function] reporter/app.js -> 0.js
//  [function] ../bower_components/basisjs/src/basis/ui.js -> 2.js
//  [function] core/ast.js -> k.js
//  [function] ../bower_components/esprima/esprima.js -> l.js
//  [function] reporter/module/toc/index.js -> r.js
//  [function] ../bower_components/basisjs/src/basis/l10n.js -> 3.js
//  [function] ../bower_components/basisjs/src/basis/event.js -> 4.js
//  [function] reporter/module/test-tree/index.js -> s.js
//  [function] reporter/app/test.js -> m.js
//  [function] reporter/app/highlight.js -> n.js
//  [function] ../bower_components/jsdiff/diff.js -> o.js
//  [function] ../bower_components/basisjs/src/basis/data.js -> 5.js
//  [function] ../bower_components/basisjs/src/basis/dom/wrapper.js -> 6.js
//  [function] ../bower_components/basisjs/src/basis/template.js -> 7.js
//  [function] ../bower_components/basisjs/src/basis/template/html.js -> 8.js
//  [function] ../bower_components/basisjs/src/basis/dom/event.js -> 9.js
//  [function] ../bower_components/basisjs/src/basis/template/htmlfgen.js -> a.js
//  [function] core/env.js -> j.js
//
// filelist (4): 
//   reporter/app.js
//   core.js
//   ../bower_components/esprima/esprima.js
//   ../bower_components/jsdiff/diff.js
(function(){
"use strict";

var __namespace_map__ = {"0.js":"app","1.js":"basis.app","2.js":"basis.ui","3.js":"basis.l10n","4.js":"basis.event","5.js":"basis.data","6.js":"basis.dom.wrapper","7.js":"basis.template","8.js":"basis.template.html","9.js":"basis.dom.event","a.js":"basis.template.htmlfgen","b.js":"core","c.js":"core.runner","d.js":"basis.data.dataset","e.js":"basis.data.index","f.js":"basis.data.value","g.js":"basis.utils.benchmark","h.js":"core.test","i.js":"basis.utils.info","j.js":"core.env","k.js":"core.ast","l.js":"esprima","m.js":"app.test","n.js":"app.highlight","o.js":"diff"};
var __resources__ = {
  "0.css": "",
  "0.code": "function importScripts(){\r\n  function importScript(url){\r\n    var req = new XMLHttpRequest();\r\n    req.open('GET', url, false);\r\n    req.setRequestHeader('If-Modified-Since', new Date(0).toGMTString());\r\n    req.send(null);\r\n\r\n    if (req.status >= 200 && req.status < 400)\r\n      (window.execScript || function(fn){\r\n        window['eval'].call(window, fn);\r\n      })(req.responseText);\r\n    else\r\n      throw 'Can\\'t load script: ' + url;\r\n  }\r\n\r\n  for (var i = 0; i < arguments.length; i++)\r\n    importScript(arguments[i])\r\n}\r\n\r\nfunction __initTestEnvironment(initCode, deprecateTestEnvironment){\r\n  // basis.js default behaviour\r\n  if (typeof basisjsToolsFileSync != 'undefined')\r\n    basisjsToolsFileSync.notifications.attach(function(type, filename){\r\n      if (typeof basis == 'undefined')\r\n        return; // no basis.js available\r\n\r\n      if (type == 'update' && (\r\n            (basis.filename_ == filename) ||\r\n            (basis.resource && basis.resource.exists(filename))\r\n         ))\r\n        deprecateTestEnvironment();\r\n    });\r\n\r\n  // fallback deprecate function\r\n  if (typeof deprecateTestEnvironment != 'function')\r\n    deprecateTestEnvironment = function(){};\r\n\r\n  // main part\r\n  return eval(initCode + ';(function(__code){\\n' +\r\n  '  return eval(\"(\" + __code + \")\");' +\r\n  '})');\r\n}\r\n",
  "8.tmpl": [ [ 1, 0, [ "element" ], "div", [ 2, 0, 0, "id", "layout" ], [ 1, 0, 0, "div", [ 2, 0, 0, "id", "header" ], [ 1, 0, 0, "span", [ 4, 0, 0, "header-caption" ], [ 3, 0, 0, "Basis.js test runner" ] ], [ 1, 0, 0, "div", [ 4, 0, 0, "header-buttons" ], [ 1, 0, 0, "button", [ 4, 0, 0, "header-button" ], [ 6, "click", "run" ], [ 3, 0, 0, "run" ] ] ], [ 1, 0, 0, "div", [ 4, 0, 0, "header-test-suite-location" ], [ 3, 1, [ "name" ] ], [ 3, 0, 0, " " ], [ 3, 1, [ "done" ] ], [ 3, 0, 0, " / " ], [ 3, 1, [ "total" ] ], [ 3, 0, 0, " (" ], [ 3, 1, [ "assert" ] ], [ 3, 0, 0, ") (time: " ], [ 3, 1, [ "time" ] ], [ 3, 0, 0, " ms)" ] ] ], [ 1, 0, 0, "div", [ 2, 0, 0, "id", "sidebar" ], [ 8, 1, [ "toc" ] ] ], [ 1, 0, 0, "div", [ 2, 0, 0, "id", "content" ], [ 8, 1, [ "tests" ] ] ] ] ],
  "1.tmpl": [ [ 1, 0, [ "element" ], "div", [ 4, [ [ "app-toc-item_", "selected" ] ], 0, "app-toc-item" ], [ 6, "click", "select" ], [ 6, "dblclick", "pickup" ], [ 1, 0, 0, "span", [ 4, [ [ "app-toc-item__progress_", "state" ] ], 0, "app-toc-item__progress" ], [ 5, [ [ [ "progress" ], [ 0, "%" ], "width" ] ], 0 ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-toc-item__state-", "state" ], [ "app-toc-item__state-", "pending" ] ], 0, "app-toc-item__state" ], [ 3, 1, [ "stateMessage" ] ] ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-toc-item__name" ], [ 3, 1, [ "name" ] ] ] ] ],
  "2.tmpl": [ [ 1, 0, [ "element" ], "div", [ 4, 0, 0, "app-toc" ], [ 8, 1, [ "levelUp" ] ], [ 8, 1, [ "faultTests" ] ] ] ],
  "0.tmpl": [ [ 1, 0, [ "element" ], "iframe", [ 2, [ [ "src" ], [ 0 ] ], 0, "src", "{src}" ], [ 6, "load", "ready" ], [ 5, 0, 0, "width: 10px; height: 10px; top: -100px; position: absolute; border: none; opacity: 0.0001;" ] ] ],
  "4.tmpl": [ [ 1, 0, [ "element" ], "div", [ 4, [ [ "app-test-", "hasOwnEnvironment" ] ], 0, "app-test" ], [ 1, 0, 0, "div", [ 4, 0, 0, "app-test-header" ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-test__select-button" ], [ 6, "click", "select" ], [ 3, 0, 0, "pick up" ] ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-test-name" ], [ 3, 1, [ "name" ] ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-splitter_", "state" ] ], 0, "app-test-splitter" ], [ 3, 0, 0, " — " ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-state_state-", "state" ], [ "app-test-state_", "pending" ] ], 0, "app-test-state" ], [ 3, 1, [ "stateMessage" ] ] ] ] ] ],
  "5.tmpl": [ [ 1, 0, [ "element" ], "div", [ 4, [ [ "app-test-", "hasOwnEnvironment" ] ], 0, "app-test app-test-suite" ], [ 1, 0, 0, "div", [ 4, 0, 0, "app-test-header" ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-test__select-button" ], [ 6, "click", "select" ], [ 3, 0, 0, "pick up" ] ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-test-name" ], [ 3, 1, [ "name" ] ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-splitter_", "state" ] ], 0, "app-test-splitter" ], [ 3, 0, 0, " — " ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-state_state-", "state" ], [ "app-test-state_", "pending" ] ], 0, "app-test-state" ], [ 3, 1, [ "stateMessage" ] ] ] ], [ 1, 1, [ "childNodesElement" ], "div", [ 4, 0, 0, "app-test-suite__content" ] ] ] ],
  "6.tmpl": [ [ 1, 0, [ "element" ], "div", [ 4, [ [ "app-test-", "hasOwnEnvironment" ] ], 0, "app-test app-test-case" ], [ 1, 0, 0, "div", [ 4, 0, 0, "app-test-header" ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-test__select-button" ], [ 6, "click", "select" ], [ 3, 0, 0, "pick up" ] ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-test-name" ], [ 3, 1, [ "name" ] ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-splitter_", "state" ] ], 0, "app-test-splitter" ], [ 3, 0, 0, " — " ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-state_state-", "state" ], [ "app-test-state_", "pending" ] ], 0, "app-test-state" ], [ 3, 1, [ "stateMessage" ] ] ] ], [ 8, 1, [ "source" ] ] ], [ 8, 0, 0, '<b:after ref="stateMessage">\r\n       {errorMessage}\r\n  </b:after>' ] ],
  "7.tmpl": [ [ 1, 0, [ "element" ], "div", [ 4, [ [ "app-test-tree_", "hasDelegate" ] ], 0, "app-test-tree" ], [ 1, 0, 0, "div", [ 4, 0, 0, "app-test-tree__header" ], [ 1, 0, 0, "div", [ 4, 0, 0, "app-test-tree__buttons" ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-tree__button-pickup_", "type" ] ], 0, "app-test-tree__button app-test-tree__button-pickup" ], [ 6, "click", "select" ], [ 3, 0, 0, "pick up" ] ] ], [ 1, 0, 0, "span", [ 4, 0, 0, "app-test-tree__caption" ], [ 3, 1, [ "name" ] ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-splitter_", "state" ] ], 0, "app-test-splitter" ], [ 3, 0, 0, " — " ] ], [ 1, 0, 0, "span", [ 4, [ [ "app-test-state_state-", "state" ], [ "app-test-state_", "pending" ] ], 0, "app-test-state" ], [ 3, 1, [ "stateMessage" ] ] ] ], [ 1, 1, [ "childNodesElement" ], "div", [ 4, 0, 0, "app-test-tree__content" ] ], [ 8, 1, [ "sourceCode" ] ] ] ],
  "3.tmpl": [ [ 1, 1, [ "code", "element" ], "pre", [ 4, 0, 0, "Basis-SyntaxHighlight" ], [ 3, 1, [ "sourceCode" ] ] ] ],
  "b.js": "/* Javascript file C:/usr/local/Apache2/htdocs/git/test-runner/src/core.js not found */",
  "c.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./5.js");
    basis.require("./d.js");
    basis.require("./e.js");
    basis.require("./g.js");
    var TestCase = basis.require("./h.js").TestCase;
    var testsToRun = new basis.data.Dataset;
    var awaitProcessingTests = new basis.data.Dataset({
      listen: {
        item: {
          stateChanged: function(item) {
            if (item.state != basis.data.STATE.PROCESSING) this.remove(item);
          }
        }
      }
    });
    var faultTests = new basis.data.dataset.Subset({
      source: testsToRun,
      ruleEvents: "stateChanged",
      rule: function(test) {
        return test.state == basis.data.STATE.ERROR;
      }
    });
    var processingQueue = new basis.data.dataset.Subset({
      ruleEvents: "stateChanged",
      rule: function(test) {
        return test.state != basis.data.STATE.READY && test.state != basis.data.STATE.ERROR;
      }
    });
    var processingQueueTop = new basis.data.dataset.Slice({
      source: processingQueue,
      rule: "basisObjectId",
      limit: 1,
      handler: {
        itemsChanged: function(sender, delta) {
          if (delta.inserted) delta.inserted.forEach(function(item) {
            basis.nextTick(function() {
              if (processingQueueTop.has(item)) item.run();
            });
          });
        }
      }
    });
    var testStartTime;
    var time = new basis.data.Value({
      value: 0
    });
    var assertCount = basis.data.index.sum(testsToRun, "stateChanged", function(test) {
      if (test.state.data instanceof basis.data.Object) return test.state.data.data.testCount;
      return 0;
    });
    var testCount = basis.data.Value.from(testsToRun, "itemsChanged", "itemCount");
    var testDone = basis.data.index.count(testsToRun, "stateChanged", function(test) {
      return test.state == basis.data.STATE.ERROR || test.state == basis.data.STATE.READY;
    });
    var testLeft = new basis.data.value.Expression(testCount, testDone, function(total, done) {
      return total - done;
    });
    testLeft.addHandler({
      change: function(sender, oldValue) {
        if (this.value && !oldValue) testStartTime = basis.utils.benchmark.time();
        time.set(basis.utils.benchmark.time(testStartTime));
      }
    });
    function extractTests(data) {
      var result = [];
      for (var i = 0, item; item = data[i]; i++) {
        var test = item.root;
        if (test instanceof TestCase) result.push(test);
        if (test.firstChild) result.push.apply(result, extractTests(test.childNodes));
      }
      return result;
    }
    function loadTests(data) {
      stop();
      testsToRun.set(extractTests(data));
    }
    function run(data) {
      stop();
      if (awaitProcessingTests.itemCount) return setTimeout(run, 10);
      testsToRun.forEach(function(item) {
        var env = item.getEnvRunner();
        if (env) env.destroy();
        item.root.reset();
      });
      processingQueue.setSource(testsToRun);
    }
    function stop() {
      if (processingQueue.itemCount) {
        awaitProcessingTests.add(processingQueue.getItems().filter(function(test) {
          return test.state == basis.data.STATE.PROCESSING;
        }));
      }
      processingQueue.setSource();
    }
    module.exports = {
      time: time,
      faultTests: faultTests,
      count: {
        assert: assertCount,
        total: testCount,
        left: testLeft,
        done: testDone
      },
      loadTests: loadTests,
      run: run,
      stop: stop
    };
  },
  "d.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./4.js");
    basis.require("./5.js");
    var namespace = this.path;
    var Class = basis.Class;
    var oneFunctionProperty = Class.oneFunctionProperty;
    var extend = basis.object.extend;
    var values = basis.object.values;
    var getter = basis.getter;
    var $self = basis.fn.$self;
    var $true = basis.fn.$true;
    var $false = basis.fn.$false;
    var arrayFrom = basis.array.from;
    var createEvent = basis.event.create;
    var SUBSCRIPTION = basis.data.SUBSCRIPTION;
    var DataObject = basis.data.Object;
    var KeyObjectMap = basis.data.KeyObjectMap;
    var AbstractDataset = basis.data.AbstractDataset;
    var Dataset = basis.data.Dataset;
    var DatasetWrapper = basis.data.DatasetWrapper;
    SUBSCRIPTION.add("SOURCE", {
      sourceChanged: function(object, oldSource) {
        if (oldSource) SUBSCRIPTION.unlink("source", object, oldSource);
        if (object.source) SUBSCRIPTION.link("source", object, object.source);
      },
      sourcesChanged: function(object, delta) {
        var array;
        if (array = delta.inserted) for (var i = 0, item; item = array[i]; i++) SUBSCRIPTION.link("source", object, array[i]);
        if (array = delta.deleted) for (var i = 0, item; item = array[i]; i++) SUBSCRIPTION.unlink("source", object, array[i]);
      }
    }, function(action, object) {
      var sources = object.sources || (object.source ? [ object.source ] : []);
      for (var i = 0, source; source = sources[i++]; ) action("source", object, source);
    });
    SUBSCRIPTION.addProperty("minuend");
    SUBSCRIPTION.addProperty("subtrahend");
    function getDelta(inserted, deleted) {
      var delta = {};
      var result;
      if (inserted && inserted.length) result = delta.inserted = inserted;
      if (deleted && deleted.length) result = delta.deleted = deleted;
      if (result) return delta;
    }
    function createRuleEvents(fn, events) {
      return function createRuleEvents__extend__(events) {
        if (!events) return null;
        if (events.__extend__) return events;
        if (typeof events != "string" && !Array.isArray(events)) {
          events = typeof events == "object" ? basis.object.keys(events) : null;
          if (events) basis.dev.warn("Using an object for ruleEvents is deprecated, use space separated event names string or array of strings instead.");
        }
        return extend(basis.event.createHandler(events, fn), {
          __extend__: createRuleEvents__extend__
        });
      }(events);
    }
    function createKeyMap(config, keyGetter, itemClass, SubsetClass) {
      return new KeyObjectMap(extend({
        keyGetter: keyGetter,
        itemClass: itemClass,
        create: function(key, object) {
          var obj = KeyObjectMap.prototype.create.call(this, key, object);
          obj.setDataset(new SubsetClass({
            ruleValue: key
          }));
          return obj;
        }
      }, config));
    }
    var MERGE_DATASET_HANDLER = {
      itemsChanged: function(source, delta) {
        var memberMap = this.members_;
        var updated = {};
        var object;
        var objectId;
        if (delta.inserted) {
          for (var i = 0; object = delta.inserted[i]; i++) {
            objectId = object.basisObjectId;
            if (memberMap[objectId]) {
              memberMap[objectId].count++;
            } else {
              memberMap[objectId] = {
                count: 1,
                object: object
              };
            }
            updated[objectId] = memberMap[objectId];
          }
        }
        if (delta.deleted) {
          for (var i = 0; object = delta.deleted[i]; i++) {
            objectId = object.basisObjectId;
            updated[objectId] = memberMap[objectId];
            memberMap[objectId].count--;
          }
        }
        this.applyRule(updated);
      },
      destroy: function(source) {
        this.removeSource(source);
      }
    };
    var Merge = Class(AbstractDataset, {
      className: namespace + ".Merge",
      subscribeTo: SUBSCRIPTION.SOURCE,
      emit_sourcesChanged: createEvent("sourcesChanged", "delta"),
      sources: null,
      rule: function(count, sourceCount) {
        return count > 0;
      },
      listen: {
        source: MERGE_DATASET_HANDLER
      },
      init: function() {
        AbstractDataset.prototype.init.call(this);
        var sources = this.sources;
        this.sources = [];
        if (sources) sources.forEach(this.addSource, this);
      },
      setRule: function(rule) {
        if (typeof rule != "function") rule = Merge.UNION;
        if (this.rule !== rule) {
          this.rule = rule;
          this.applyRule();
        }
      },
      applyRule: function(scope) {
        var memberMap = this.members_;
        var rule = this.rule;
        var sourceCount = this.sources.length;
        var inserted = [];
        var deleted = [];
        var memberCounter;
        var isMember;
        var delta;
        if (!scope) scope = memberMap;
        for (var objectId in scope) {
          memberCounter = memberMap[objectId];
          isMember = sourceCount && memberCounter.count && rule(memberCounter.count, sourceCount);
          if (isMember != !!this.items_[objectId]) (isMember ? inserted : deleted).push(memberCounter.object);
          if (memberCounter.count == 0) delete memberMap[objectId];
        }
        if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
        return delta;
      },
      addSource: function(source) {
        if (source instanceof AbstractDataset) {
          if (basis.array.add(this.sources, source)) {
            if (this.listen.source) source.addHandler(this.listen.source, this);
            var memberMap = this.members_;
            for (var objectId in source.items_) {
              if (memberMap[objectId]) {
                memberMap[objectId].count++;
              } else {
                memberMap[objectId] = {
                  count: 1,
                  object: source.items_[objectId]
                };
              }
            }
            this.applyRule();
            this.emit_sourcesChanged({
              inserted: [ source ]
            });
            return true;
          }
        } else {
          basis.dev.warn(this.constructor.className + ".addSource: source isn't instance of AbstractDataset");
        }
      },
      removeSource: function(source) {
        if (basis.array.remove(this.sources, source)) {
          if (this.listen.source) source.removeHandler(this.listen.source, this);
          var memberMap = this.members_;
          for (var objectId in source.items_) memberMap[objectId].count--;
          this.applyRule();
          this.emit_sourcesChanged({
            deleted: [ source ]
          });
          return true;
        } else {
          basis.dev.warn(this.constructor.className + ".removeSource: source isn't in dataset source list");
        }
      },
      setSources: function(sources) {
        var exists = arrayFrom(this.sources);
        for (var i = 0, source; source = sources[i]; i++) {
          if (source instanceof AbstractDataset) {
            if (!basis.array.remove(exists, source)) this.addSource(source);
          } else {
            basis.dev.warn(this.constructor.className + ".setSources: source isn't type of AbstractDataset", source);
          }
        }
        exists.forEach(this.removeSource, this);
      },
      clear: function() {
        arrayFrom(this.sources).forEach(this.removeSource, this);
      },
      destroy: function() {
        AbstractDataset.prototype.destroy.call(this);
        this.sources = null;
      }
    });
    Merge.UNION = Merge.prototype.rule;
    Merge.INTERSECTION = function(count, sourceCount) {
      return count == sourceCount;
    };
    Merge.DIFFERENCE = function(count, sourceCount) {
      return count == 1;
    };
    Merge.MORE_THAN_ONE_INCLUDE = function(count, sourceCount) {
      return sourceCount == 1 || count > 1;
    };
    Merge.AT_LEAST_ONE_EXCLUDE = function(count, sourceCount) {
      return sourceCount == 1 || count < sourceCount;
    };
    var datasetAbsentFilter = function(item) {
      return !this.has(item);
    };
    var SUBTRACTDATASET_MINUEND_HANDLER = {
      itemsChanged: function(dataset, delta) {
        if (!this.subtrahend) return;
        var newDelta = getDelta(delta.inserted && delta.inserted.filter(datasetAbsentFilter, this.subtrahend), delta.deleted && delta.deleted.filter(this.has, this));
        if (newDelta) this.emit_itemsChanged(newDelta);
      },
      destroy: function() {
        this.setOperands(null, this.subtrahend);
      }
    };
    var SUBTRACTDATASET_SUBTRAHEND_HANDLER = {
      itemsChanged: function(dataset, delta) {
        if (!this.minuend) return;
        var newDelta = getDelta(delta.deleted && delta.deleted.filter(datasetAbsentFilter, this), delta.inserted && delta.inserted.filter(this.has, this));
        if (newDelta) this.emit_itemsChanged(newDelta);
      },
      destroy: function() {
        this.setOperands(this.minuend, null);
      }
    };
    var Subtract = Class(AbstractDataset, {
      className: namespace + ".Subtract",
      subscribeTo: SUBSCRIPTION.MINUEND + SUBSCRIPTION.SUBTRAHEND,
      minuend: null,
      emit_minuendChanged: createEvent("minuendChanged", "oldMinuend"),
      subtrahend: null,
      emit_subtrahendChanged: createEvent("subtrahendChanged", "oldSubtrahend"),
      listen: {
        minuend: SUBTRACTDATASET_MINUEND_HANDLER,
        subtrahend: SUBTRACTDATASET_SUBTRAHEND_HANDLER
      },
      init: function() {
        AbstractDataset.prototype.init.call(this);
        var minuend = this.minuend;
        var subtrahend = this.subtrahend;
        this.minuend = null;
        this.subtrahend = null;
        if (minuend || subtrahend) this.setOperands(minuend, subtrahend);
      },
      setOperands: function(minuend, subtrahend) {
        var delta;
        var operandsChanged = false;
        if (minuend instanceof AbstractDataset == false) minuend = null;
        if (subtrahend instanceof AbstractDataset == false) subtrahend = null;
        var oldMinuend = this.minuend;
        var oldSubtrahend = this.subtrahend;
        if (oldMinuend !== minuend) {
          operandsChanged = true;
          this.minuend = minuend;
          var listenHandler = this.listen.minuend;
          if (listenHandler) {
            if (oldMinuend) oldMinuend.removeHandler(listenHandler, this);
            if (minuend) minuend.addHandler(listenHandler, this);
          }
          this.emit_minuendChanged(oldMinuend);
        }
        if (oldSubtrahend !== subtrahend) {
          operandsChanged = true;
          this.subtrahend = subtrahend;
          var listenHandler = this.listen.subtrahend;
          if (listenHandler) {
            if (oldSubtrahend) oldSubtrahend.removeHandler(listenHandler, this);
            if (subtrahend) subtrahend.addHandler(listenHandler, this);
          }
          this.emit_subtrahendChanged(oldSubtrahend);
        }
        if (!operandsChanged) return false;
        if (!minuend || !subtrahend) {
          if (this.itemCount) this.emit_itemsChanged(delta = {
            deleted: this.getItems()
          });
        } else {
          var deleted = [];
          var inserted = [];
          for (var key in this.items_) if (!minuend.items_[key] || subtrahend.items_[key]) deleted.push(this.items_[key]);
          for (var key in minuend.items_) if (!this.items_[key] && !subtrahend.items_[key]) inserted.push(minuend.items_[key]);
          if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
        }
        return delta;
      },
      setMinuend: function(minuend) {
        return this.setOperands(minuend, this.subtrahend);
      },
      setSubtrahend: function(subtrahend) {
        return this.setOperands(this.minuend, subtrahend);
      },
      clear: function() {
        this.setOperands();
      }
    });
    var SourceDataset = Class(AbstractDataset, {
      className: namespace + ".SourceDataset",
      subscribeTo: SUBSCRIPTION.SOURCE,
      source: null,
      emit_sourceChanged: createEvent("sourceChanged", "oldSource"),
      sourceAdapter_: null,
      sourceMap_: null,
      listen: {
        source: {
          destroy: function() {
            if (!this.sourceAdapter_) this.setSource();
          }
        }
      },
      init: function() {
        this.sourceMap_ = {};
        AbstractDataset.prototype.init.call(this);
        var source = this.source;
        if (source) {
          this.source = null;
          this.setSource(source);
        }
      },
      setSource: function(source) {
        source = basis.data.resolveDataset(this, this.setSource, source, "sourceAdapter_");
        if (this.source !== source) {
          var oldSource = this.source;
          var listenHandler = this.listen.source;
          this.source = source;
          if (listenHandler) {
            var itemsChangedHandler = listenHandler.itemsChanged;
            if (oldSource) {
              oldSource.removeHandler(listenHandler, this);
              if (itemsChangedHandler) itemsChangedHandler.call(this, oldSource, {
                deleted: oldSource.getItems()
              });
            }
            if (source) {
              source.addHandler(listenHandler, this);
              if (itemsChangedHandler) itemsChangedHandler.call(this, source, {
                inserted: source.getItems()
              });
            }
          }
          this.emit_sourceChanged(oldSource);
        }
      },
      clear: function() {
        this.setSource();
      },
      destroy: function() {
        AbstractDataset.prototype.destroy.call(this);
        this.sourceMap_ = null;
      }
    });
    var MAPFILTER_SOURCEOBJECT_UPDATE = function(sourceObject) {
      var newMember = this.map ? this.map(sourceObject) : object;
      if (newMember instanceof DataObject == false || this.filter(newMember)) newMember = null;
      var sourceMap = this.sourceMap_[sourceObject.basisObjectId];
      var curMember = sourceMap.member;
      if (curMember !== newMember) {
        var memberMap = this.members_;
        var delta;
        var inserted;
        var deleted;
        sourceMap.member = newMember;
        if (curMember) {
          var curMemberId = curMember.basisObjectId;
          if (this.removeMemberRef) this.removeMemberRef(curMember, sourceObject);
          if (--memberMap[curMemberId] == 0) {
            delete memberMap[curMemberId];
            deleted = [ curMember ];
          }
        }
        if (newMember) {
          var newMemberId = newMember.basisObjectId;
          if (this.addMemberRef) this.addMemberRef(newMember, sourceObject);
          if (memberMap[newMemberId]) {
            memberMap[newMemberId]++;
          } else {
            memberMap[newMemberId] = 1;
            inserted = [ newMember ];
          }
        }
        if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
      }
    };
    var MAPFILTER_SOURCE_HANDLER = {
      itemsChanged: function(source, delta) {
        var sourceMap = this.sourceMap_;
        var memberMap = this.members_;
        var inserted = [];
        var deleted = [];
        var sourceObject;
        var sourceObjectId;
        var member;
        var updateHandler = this.ruleEvents;
        Dataset.setAccumulateState(true);
        if (delta.inserted) {
          for (var i = 0; sourceObject = delta.inserted[i]; i++) {
            member = this.map ? this.map(sourceObject) : sourceObject;
            if (member instanceof DataObject == false || this.filter(member)) member = null;
            if (updateHandler) sourceObject.addHandler(updateHandler, this);
            sourceMap[sourceObject.basisObjectId] = {
              sourceObject: sourceObject,
              member: member
            };
            if (member) {
              var memberId = member.basisObjectId;
              if (memberMap[memberId]) {
                memberMap[memberId]++;
              } else {
                memberMap[memberId] = 1;
                inserted.push(member);
              }
              if (this.addMemberRef) this.addMemberRef(member, sourceObject);
            }
          }
        }
        if (delta.deleted) {
          for (var i = 0; sourceObject = delta.deleted[i]; i++) {
            sourceObjectId = sourceObject.basisObjectId;
            member = sourceMap[sourceObjectId].member;
            if (updateHandler) sourceObject.removeHandler(updateHandler, this);
            delete sourceMap[sourceObjectId];
            if (member) {
              var memberId = member.basisObjectId;
              if (--memberMap[memberId] == 0) {
                delete memberMap[memberId];
                deleted.push(member);
              }
              if (this.removeMemberRef) this.removeMemberRef(member, sourceObject);
            }
          }
        }
        Dataset.setAccumulateState(false);
        if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
      }
    };
    var MapFilter = Class(SourceDataset, {
      className: namespace + ".MapFilter",
      map: $self,
      filter: $false,
      rule: getter($true),
      ruleEvents: createRuleEvents(MAPFILTER_SOURCEOBJECT_UPDATE, "update"),
      addMemberRef: null,
      removeMemberRef: null,
      listen: {
        source: MAPFILTER_SOURCE_HANDLER
      },
      setMap: function(map) {
        if (typeof map != "function") map = $self;
        if (this.map !== map) {
          this.map = map;
          return this.applyRule();
        }
      },
      setFilter: function(filter) {
        if (typeof filter != "function") filter = $false;
        if (this.filter !== filter) {
          this.filter = filter;
          return this.applyRule();
        }
      },
      setRule: function(rule) {
        if (typeof rule != "function") rule = $true;
        if (this.rule !== rule) {
          this.rule = rule;
          return this.applyRule();
        }
      },
      applyRule: function() {
        var sourceMap = this.sourceMap_;
        var memberMap = this.members_;
        var curMember;
        var newMember;
        var curMemberId;
        var newMemberId;
        var sourceObject;
        var sourceObjectInfo;
        var inserted = [];
        var deleted = [];
        var delta;
        for (var sourceObjectId in sourceMap) {
          sourceObjectInfo = sourceMap[sourceObjectId];
          sourceObject = sourceObjectInfo.sourceObject;
          curMember = sourceObjectInfo.member;
          newMember = this.map ? this.map(sourceObject) : sourceObject;
          if (newMember instanceof DataObject == false || this.filter(newMember)) newMember = null;
          if (curMember != newMember) {
            sourceObjectInfo.member = newMember;
            if (curMember) {
              curMemberId = curMember.basisObjectId;
              if (this.removeMemberRef) this.removeMemberRef(curMember, sourceObject);
              memberMap[curMemberId]--;
            }
            if (newMember) {
              newMemberId = newMember.basisObjectId;
              if (this.addMemberRef) this.addMemberRef(newMember, sourceObject);
              if (newMemberId in memberMap) {
                memberMap[newMemberId]++;
              } else {
                memberMap[newMemberId] = 1;
                inserted.push(newMember);
              }
            }
          }
        }
        for (curMemberId in this.items_) if (memberMap[curMemberId] == 0) {
          delete memberMap[curMemberId];
          deleted.push(this.items_[curMemberId]);
        }
        if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
        return delta;
      }
    });
    var Subset = Class(MapFilter, {
      className: namespace + ".Subset",
      filter: function(object) {
        return !this.rule(object);
      }
    });
    var Split = Class(MapFilter, {
      className: namespace + ".Split",
      subsetClass: AbstractDataset,
      subsetWrapperClass: DatasetWrapper,
      keyMap: null,
      map: function(sourceObject) {
        return this.keyMap.resolve(sourceObject);
      },
      setRule: function(rule) {
        if (typeof rule != "function") rule = $true;
        if (this.rule !== rule) {
          this.rule = rule;
          this.keyMap.keyGetter = rule;
          return this.applyRule();
        }
      },
      addMemberRef: function(wrapper, sourceObject) {
        wrapper.dataset.emit_itemsChanged({
          inserted: [ sourceObject ]
        });
      },
      removeMemberRef: function(wrapper, sourceObject) {
        wrapper.dataset.emit_itemsChanged({
          deleted: [ sourceObject ]
        });
      },
      init: function() {
        if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false) this.keyMap = createKeyMap(this.keyMap, this.rule, this.subsetWrapperClass, this.subsetClass);
        MapFilter.prototype.init.call(this);
      },
      getSubset: function(data, autocreate) {
        return this.keyMap.get(data, autocreate);
      },
      destroy: function() {
        MapFilter.prototype.destroy.call(this);
        this.keyMap.destroy();
        this.keyMap = null;
      }
    });
    function binarySearchPos(array, map) {
      if (!array.length) return 0;
      var value = map.value;
      var id = map.object.basisObjectId;
      var cmpValue;
      var cmpId;
      var pos;
      var item;
      var l = 0;
      var r = array.length - 1;
      do {
        pos = l + r >> 1;
        item = array[pos];
        cmpValue = item.value;
        if (value < cmpValue) r = pos - 1; else if (value > cmpValue) l = pos + 1; else {
          cmpId = item.object.basisObjectId;
          if (id < cmpId) r = pos - 1; else if (id > cmpId) l = pos + 1; else return pos;
        }
      } while (l <= r);
      return pos + (cmpValue == value ? cmpId < id : cmpValue < value);
    }
    var SLICE_SOURCEOBJECT_UPDATE = function(sourceObject) {
      var sourceObjectInfo = this.sourceMap_[sourceObject.basisObjectId];
      var newValue = this.rule(sourceObject);
      var index = this.index_;
      if (newValue !== sourceObjectInfo.value) {
        var pos = binarySearchPos(index, sourceObjectInfo);
        var prev = index[pos - 1];
        var next = index[pos + 1];
        sourceObjectInfo.value = newValue;
        if (prev && (prev.value > newValue || prev.value == newValue && prev.object.basisObjectId > sourceObjectInfo.object.basisObjectId) || next && (next.value < newValue || next.value == newValue && next.object.basisObjectId < sourceObjectInfo.object.basisObjectId)) {
          index.splice(pos, 1);
          index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo);
          this.applyRule();
        }
      }
    };
    function sliceIndexSort(a, b) {
      return +(a.value > b.value) || -(a.value < b.value) || a.object.basisObjectId - b.object.basisObjectId;
    }
    var SLICE_SOURCE_HANDLER = {
      itemsChanged: function(source, delta) {
        var sourceMap = this.sourceMap_;
        var index = this.index_;
        var updateHandler = this.ruleEvents;
        var dropIndex = false;
        var buildIndex = false;
        var sourceObjectInfo;
        var inserted = delta.inserted;
        var deleted = delta.deleted;
        if (deleted) {
          if (deleted.length > index.length - deleted.length) {
            dropIndex = true;
            buildIndex = deleted.length != index.length;
            index.length = 0;
          }
          for (var i = 0, sourceObject; sourceObject = deleted[i]; i++) {
            if (!dropIndex) {
              sourceObjectInfo = sourceMap[sourceObject.basisObjectId];
              index.splice(binarySearchPos(index, sourceObjectInfo), 1);
            }
            delete sourceMap[sourceObject.basisObjectId];
            if (updateHandler) sourceObject.removeHandler(updateHandler, this);
          }
          if (buildIndex) for (var key in sourceMap) {
            sourceObjectInfo = sourceMap[key];
            index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo);
          }
        }
        if (inserted) {
          buildIndex = !index.length;
          for (var i = 0, sourceObject; sourceObject = inserted[i]; i++) {
            sourceObjectInfo = {
              object: sourceObject,
              value: this.rule(sourceObject)
            };
            sourceMap[sourceObject.basisObjectId] = sourceObjectInfo;
            if (!buildIndex) index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo); else index.push(sourceObjectInfo);
            if (updateHandler) sourceObject.addHandler(updateHandler, this);
          }
          if (buildIndex) index.sort(sliceIndexSort);
        }
        this.applyRule();
      }
    };
    var Slice = Class(SourceDataset, {
      className: namespace + ".Slice",
      rule: getter($true),
      ruleEvents: createRuleEvents(SLICE_SOURCEOBJECT_UPDATE, "update"),
      index_: null,
      orderDesc: false,
      offset: 0,
      limit: 10,
      listen: {
        source: SLICE_SOURCE_HANDLER
      },
      emit_rangeChanged: createEvent("rangeChanged", "oldOffset", "oldLimit"),
      init: function() {
        this.index_ = [];
        SourceDataset.prototype.init.call(this);
      },
      setRange: function(offset, limit) {
        var oldOffset = this.offset;
        var oldLimit = this.limit;
        var delta = false;
        if (oldOffset != offset || oldLimit != limit) {
          this.offset = offset;
          this.limit = limit;
          delta = this.applyRule();
          this.emit_rangeChanged(oldOffset, oldLimit);
        }
        return delta;
      },
      setOffset: function(offset) {
        return this.setRange(offset, this.limit);
      },
      setLimit: function(limit) {
        return this.setRange(this.offset, limit);
      },
      setRule: function(rule, orderDesc) {
        rule = getter(rule);
        this.orderDesc = !!orderDesc;
        if (this.rule != rule) {
          var index = this.index_;
          for (var i = 0; i < index.length; i++) index[i].value = rule(index[i].object);
          this.rule = rule;
          index.sort(sliceIndexSort);
        }
        return this.applyRule();
      },
      applyRule: function() {
        var start = this.offset;
        var end = start + this.limit;
        if (this.orderDesc) {
          start = this.index_.length - end;
          end = start + this.limit;
        }
        var curSet = basis.object.slice(this.members_);
        var newSet = this.index_.slice(Math.max(0, start), Math.max(0, end));
        var inserted = [];
        var delta;
        for (var i = 0, item; item = newSet[i]; i++) {
          var objectId = item.object.basisObjectId;
          if (curSet[objectId]) delete curSet[objectId]; else {
            inserted.push(item.object);
            this.members_[objectId] = item.object;
          }
        }
        for (var objectId in curSet) delete this.members_[objectId];
        if (delta = getDelta(inserted, values(curSet))) this.emit_itemsChanged(delta);
        return delta;
      },
      destroy: function() {
        SourceDataset.prototype.destroy.call(this);
        this.index_ = null;
      }
    });
    var CLOUD_SOURCEOBJECT_UPDATE = function(sourceObject) {
      var sourceMap = this.sourceMap_;
      var memberMap = this.members_;
      var sourceObjectId = sourceObject.basisObjectId;
      var oldList = sourceMap[sourceObjectId].list;
      var newList = sourceMap[sourceObjectId].list = {};
      var list = this.rule(sourceObject);
      var delta;
      var inserted = [];
      var deleted = [];
      var subset;
      if (Array.isArray(list)) for (var j = 0; j < list.length; j++) {
        subset = this.keyMap.get(list[j], true);
        if (subset && !subset.has(sourceObject)) {
          subsetId = subset.basisObjectId;
          newList[subsetId] = subset;
          if (!oldList[subsetId]) {
            subset.dataset.emit_itemsChanged({
              inserted: [ sourceObject ]
            });
            if (!memberMap[subsetId]) {
              inserted.push(subset);
              memberMap[subsetId] = 1;
            } else memberMap[subsetId]++;
          }
        }
      }
      for (var subsetId in oldList) if (!newList[subsetId]) {
        var subset = oldList[subsetId];
        subset.dataset.emit_itemsChanged({
          deleted: [ sourceObject ]
        });
        if (!--memberMap[subsetId]) {
          delete memberMap[subsetId];
          deleted.push(subset);
        }
      }
      if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
    };
    var CLOUD_SOURCE_HANDLER = {
      itemsChanged: function(dataset, delta) {
        var sourceMap = this.sourceMap_;
        var memberMap = this.members_;
        var updateHandler = this.ruleEvents;
        var array;
        var subset;
        var subsetId;
        var inserted = [];
        var deleted = [];
        Dataset.setAccumulateState(true);
        if (array = delta.inserted) for (var i = 0, sourceObject; sourceObject = array[i]; i++) {
          var list = this.rule(sourceObject);
          var sourceObjectInfo = {
            object: sourceObject,
            list: {}
          };
          sourceMap[sourceObject.basisObjectId] = sourceObjectInfo;
          if (Array.isArray(list)) for (var j = 0, dupFilter = {}; j < list.length; j++) {
            subset = this.keyMap.get(list[j], true);
            if (subset && !dupFilter[subset.basisObjectId]) {
              subsetId = subset.basisObjectId;
              dupFilter[subsetId] = true;
              sourceObjectInfo.list[subsetId] = subset;
              subset.dataset.emit_itemsChanged({
                inserted: [ sourceObject ]
              });
              if (!memberMap[subsetId]) {
                inserted.push(subset);
                memberMap[subsetId] = 1;
              } else memberMap[subsetId]++;
            }
          }
          if (updateHandler) sourceObject.addHandler(updateHandler, this);
        }
        if (array = delta.deleted) for (var i = 0, sourceObject; sourceObject = array[i]; i++) {
          var sourceObjectId = sourceObject.basisObjectId;
          var list = sourceMap[sourceObjectId].list;
          delete sourceMap[sourceObjectId];
          for (var subsetId in list) {
            subset = list[subsetId];
            subset.dataset.emit_itemsChanged({
              deleted: [ sourceObject ]
            });
            if (!--memberMap[subsetId]) {
              delete memberMap[subsetId];
              deleted.push(subset);
            }
          }
          if (updateHandler) sourceObject.removeHandler(updateHandler, this);
        }
        Dataset.setAccumulateState(false);
        if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
      }
    };
    var Cloud = Class(SourceDataset, {
      className: namespace + ".Cloud",
      subsetClass: AbstractDataset,
      subsetWrapperClass: DatasetWrapper,
      rule: getter($false),
      ruleEvents: createRuleEvents(CLOUD_SOURCEOBJECT_UPDATE, "update"),
      keyMap: null,
      map: $self,
      listen: {
        source: CLOUD_SOURCE_HANDLER
      },
      init: function() {
        if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false) this.keyMap = createKeyMap(this.keyMap, this.rule, this.subsetWrapperClass, this.subsetClass);
        SourceDataset.prototype.init.call(this);
      },
      getSubset: function(data, autocreate) {
        return this.keyMap.get(data, autocreate);
      },
      destroy: function() {
        SourceDataset.prototype.destroy.call(this);
        this.keyMap.destroy();
        this.keyMap = null;
      }
    });
    module.exports = {
      createRuleEvents: createRuleEvents,
      Merge: Merge,
      Subtract: Subtract,
      SourceDataset: SourceDataset,
      MapFilter: MapFilter,
      Subset: Subset,
      Split: Split,
      Slice: Slice,
      Cloud: Cloud
    };
  },
  "e.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./5.js");
    basis.require("./d.js");
    basis.require("./f.js");
    var namespace = this.path;
    var Class = basis.Class;
    var DataObject = basis.data.Object;
    var KeyObjectMap = basis.data.KeyObjectMap;
    var AbstractDataset = basis.data.AbstractDataset;
    var DatasetWrapper = basis.data.DatasetWrapper;
    var Value = basis.data.Value;
    var MapFilter = basis.data.dataset.MapFilter;
    function binarySearchPos(array, value) {
      if (!array.length) return 0;
      var pos;
      var cmpValue;
      var l = 0;
      var r = array.length - 1;
      do {
        pos = l + r >> 1;
        cmpValue = array[pos] || 0;
        if (value < cmpValue) r = pos - 1; else if (value > cmpValue) l = pos + 1; else return value == cmpValue ? pos : 0;
      } while (l <= r);
      return pos + (cmpValue < value);
    }
    var Index = Class(Value, {
      className: namespace + ".Index",
      autoDestroy: true,
      indexCache_: null,
      valueGetter: basis.fn.$null,
      updateEvents: {},
      value: 0,
      setNullOnEmitterDestroy: false,
      init: function() {
        this.indexCache_ = {};
        Value.prototype.init.call(this);
      },
      add_: function(value) {},
      remove_: function(value) {},
      update_: function(newValue, oldValue) {},
      normalize: function(value) {
        return Number(value) || 0;
      },
      destroy: function() {
        Value.prototype.destroy.call(this);
        this.indexCache_ = null;
      }
    });
    var Sum = Class(Index, {
      className: namespace + ".Sum",
      add_: function(value) {
        this.value += value;
      },
      remove_: function(value) {
        this.value -= value;
      },
      update_: function(newValue, oldValue) {
        this.set(this.value - oldValue + newValue);
      }
    });
    var Count = Class(Index, {
      className: namespace + ".Count",
      valueGetter: basis.fn.$true,
      add_: function(value) {
        this.value += value;
      },
      remove_: function(value) {
        this.value -= value;
      },
      normalize: function(value) {
        return !!value;
      },
      update_: function(newValue, oldValue) {
        this.set(this.value - !!oldValue + !!newValue);
      }
    });
    var Avg = Class(Index, {
      className: namespace + ".Avg",
      sum_: 0,
      count_: 0,
      add_: function(value) {
        this.sum_ += value;
        this.count_ += 1;
        this.value = this.sum_ / this.count_;
      },
      remove_: function(value) {
        this.sum_ -= value;
        this.count_ -= 1;
        this.value = this.count_ ? this.sum_ / this.count_ : 0;
      },
      update_: function(newValue, oldValue) {
        this.sum_ += newValue - oldValue;
        this.set(this.sum_ / this.count_);
      }
    });
    var VectorIndex = Class(Index, {
      className: namespace + ".VectorIndex",
      itemGetter: basis.fn.$null,
      vector_: null,
      value: undefined,
      init: function() {
        this.vector_ = [];
        Index.prototype.init.call(this);
      },
      add_: function(value) {
        if (value !== null) {
          this.vector_.splice(binarySearchPos(this.vector_, value), 0, value);
          this.value = this.vectorGetter(this.vector_);
        }
      },
      remove_: function(value) {
        if (value !== null) {
          this.vector_.splice(binarySearchPos(this.vector_, value), 1);
          this.value = this.vectorGetter(this.vector_);
        }
      },
      update_: function(newValue, oldValue) {
        if (oldValue !== null) this.vector_.splice(binarySearchPos(this.vector_, oldValue), 1);
        if (newValue !== null) this.vector_.splice(binarySearchPos(this.vector_, newValue), 0, newValue);
        this.set(this.vectorGetter(this.vector_));
      },
      normalize: function(value) {
        return typeof value == "string" || typeof value == "number" ? value : null;
      },
      destroy: function() {
        Index.prototype.destroy.call(this);
        this.vector_ = null;
      }
    });
    var Min = Class(VectorIndex, {
      className: namespace + ".Min",
      vectorGetter: function(vector) {
        return vector[0];
      }
    });
    var Max = Class(VectorIndex, {
      className: namespace + ".Max",
      vectorGetter: function(vector) {
        return vector[vector.length - 1];
      }
    });
    var indexConstructors_ = {};
    var DATASET_INDEX_HANDLER = {
      destroy: function(object) {
        removeDatasetIndex(this, object);
      }
    };
    function IndexConstructor() {}
    function getIndexConstructor(BaseClass, getter, events) {
      if (!Class.isClass(BaseClass) || !BaseClass.isSubclassOf(Index)) throw "Wrong class for index constructor";
      getter = basis.getter(getter);
      events = events || "update";
      if (typeof events != "string") throw "Events must be a event names space separated string";
      events = events.trim().split(" ").sort();
      var indexId = [ BaseClass.basisClassId_, getter.basisGetterId_, events ].join("_");
      var indexConstructor = indexConstructors_[indexId];
      if (indexConstructor) return indexConstructor.owner;
      var events_ = {};
      for (var i = 0; i < events.length; i++) events_[events[i]] = true;
      indexConstructor = new IndexConstructor;
      indexConstructors_[indexId] = {
        owner: indexConstructor,
        indexClass: BaseClass.subclass({
          indexId: indexId,
          updateEvents: events_,
          valueGetter: getter
        })
      };
      indexConstructor.indexId = indexId;
      return indexConstructor;
    }
    var createIndexConstructor = function(IndexClass, defGetter) {
      return function(events, getter) {
        var dataset;
        if (events instanceof AbstractDataset || events instanceof DatasetWrapper) {
          dataset = events;
          events = getter;
          getter = arguments[2];
        }
        if (!getter) {
          getter = events;
          events = "";
        }
        if (events) if (typeof getter == "string" && getter.split(/\s+/).some(function(e) {
          return e in basis.event.events;
        }) || Array.isArray(getter) && getter.some(function(e) {
          return e in basis.event.events;
        })) basis.dev.warn("events must be before getter in basis.data.index constructor");
        var indexConstructor = getIndexConstructor(IndexClass, getter || defGetter, events);
        if (dataset) return getDatasetIndex(dataset, indexConstructor); else return indexConstructor;
      };
    };
    var count = createIndexConstructor(Count, basis.fn.$true);
    var sum = createIndexConstructor(Sum);
    var avg = createIndexConstructor(Avg);
    var min = createIndexConstructor(Min);
    var max = createIndexConstructor(Max);
    function applyIndexDelta(index, inserted, deleted) {
      var indexCache = index.indexCache_;
      var objectId;
      index.lock();
      if (inserted) for (var i = 0, object; object = inserted[i++]; ) {
        var newValue = index.normalize(index.valueGetter(object));
        indexCache[object.basisObjectId] = newValue;
        index.add_(newValue);
      }
      if (deleted) for (var i = 0, object; object = deleted[i++]; ) {
        objectId = object.basisObjectId;
        index.remove_(indexCache[objectId]);
        delete indexCache[objectId];
      }
      index.unlock();
    }
    var ITEM_INDEX_HANDLER = {
      "*": function(event) {
        var oldValue;
        var newValue;
        var index;
        var eventType = event.type;
        var object = event.sender;
        var objectId = object.basisObjectId;
        var indexes = datasetIndexes[this.basisObjectId];
        for (var indexId in indexes) {
          index = indexes[indexId];
          if (index.updateEvents[eventType]) {
            oldValue = index.indexCache_[objectId];
            newValue = index.normalize(index.valueGetter(object));
            if (newValue !== oldValue) {
              index.update_(newValue, oldValue);
              index.indexCache_[objectId] = newValue;
            }
          }
        }
      }
    };
    var DATASET_WITH_INDEX_HANDLER = {
      itemsChanged: function(object, delta) {
        var array;
        if (array = delta.inserted) for (var i = array.length; i-- > 0; ) array[i].addHandler(ITEM_INDEX_HANDLER, this);
        if (array = delta.deleted) for (var i = array.length; i-- > 0; ) array[i].removeHandler(ITEM_INDEX_HANDLER, this);
        var indexes = datasetIndexes[this.basisObjectId];
        for (var indexId in indexes) applyIndexDelta(indexes[indexId], delta.inserted, delta.deleted);
      },
      destroy: function() {
        var indexes = datasetIndexes[this.basisObjectId];
        for (var indexId in indexes) removeDatasetIndex(this, indexes[indexId]);
      }
    };
    var datasetIndexes = {};
    function getDatasetIndex(dataset, indexConstructor) {
      if (indexConstructor instanceof IndexConstructor == false) throw "indexConstructor must be an instance of IndexConstructor";
      var datasetId = dataset.basisObjectId;
      var indexes = datasetIndexes[datasetId];
      if (!indexes) {
        indexes = datasetIndexes[datasetId] = {};
        dataset.addHandler(DATASET_WITH_INDEX_HANDLER);
        DATASET_WITH_INDEX_HANDLER.itemsChanged.call(dataset, dataset, {
          inserted: dataset.getItems()
        });
      }
      var indexId = indexConstructor.indexId;
      var index = indexes[indexId];
      if (!index) {
        indexConstructor = indexConstructors_[indexId];
        if (!indexConstructor) throw "Wrong index constructor";
        index = new indexConstructor.indexClass;
        index.addHandler(DATASET_INDEX_HANDLER, dataset);
        indexes[indexId] = index;
        applyIndexDelta(index, dataset.getItems());
      }
      return index;
    }
    function removeDatasetIndex(dataset, index) {
      var indexes = datasetIndexes[dataset.basisObjectId];
      if (indexes && indexes[index.indexId]) {
        delete indexes[index.indexId];
        index.removeHandler(DATASET_INDEX_HANDLER, dataset);
        for (var key in indexes) return;
        dataset.removeHandler(DATASET_WITH_INDEX_HANDLER);
        delete datasetIndexes[dataset.basisObjectId];
      }
    }
    var CalcIndexPreset = Class(null, {
      className: namespace + ".CalcIndexPreset",
      extendConstructor_: true,
      indexes: {},
      calc: basis.fn.$null
    });
    var calcIndexPresetSeed = 1;
    function getUniqueCalcIndexId() {
      return "calc-index-preset-" + basis.number.lead(calcIndexPresetSeed++, 8);
    }
    function percentOfRange(events, getter) {
      var minIndex = "min_" + getUniqueCalcIndexId();
      var maxIndex = "max_" + getUniqueCalcIndexId();
      var indexes = {};
      indexes[minIndex] = min(events, getter);
      indexes[maxIndex] = max(events, getter);
      getter = basis.getter(getter || events);
      var calc = function(data, index, object) {
        return (getter(object) - index[minIndex]) / (index[maxIndex] - index[minIndex]);
      };
      return calc.preset = new CalcIndexPreset({
        indexes: indexes,
        calc: calc
      });
    }
    function percentOfMax(events, getter) {
      var maxIndex = "max_" + getUniqueCalcIndexId();
      var indexes = {};
      indexes[maxIndex] = max(events, getter);
      getter = basis.getter(getter || events);
      var calc = function(data, index, object) {
        return getter(object) / index[maxIndex];
      };
      return calc.preset = new CalcIndexPreset({
        indexes: indexes,
        calc: calc
      });
    }
    function percentOfSum(getter, events) {
      var sumIndex = "sum_" + getUniqueCalcIndexId();
      var indexes = {};
      indexes[sumIndex] = sum(events, getter);
      getter = basis.getter(getter || events);
      var calc = function(data, index, object) {
        return getter(object) / index[sumIndex];
      };
      return calc.preset = new CalcIndexPreset({
        indexes: indexes,
        calc: calc
      });
    }
    var IndexMap = Class(MapFilter, {
      className: namespace + ".IndexMap",
      calcs: null,
      indexes: null,
      indexes_: null,
      indexesBind_: null,
      timer_: undefined,
      indexUpdated: null,
      indexValues: null,
      memberSourceMap: null,
      keyMap: null,
      map: function(item) {
        return this.keyMap.get(item, true);
      },
      addMemberRef: function(member, sourceObject) {
        this.memberSourceMap[member.basisObjectId] = sourceObject.basisObjectId;
        if (this.listen.member) member.addHandler(this.listen.member, this);
        this.sourceMap_[sourceObject.basisObjectId].updated = true;
        if (member.subscriberCount > 0) this.calcMember(member);
      },
      removeMemberRef: function(member, sourceObject) {
        delete this.memberSourceMap[member.basisObjectId];
        if (this.listen.member) member.removeHandler(this.listen.member, this);
      },
      emit_sourceChanged: function(oldSource) {
        MapFilter.prototype.emit_sourceChanged.call(this, oldSource);
        for (var indexName in this.indexes_) {
          var index = this.indexes_[indexName];
          if (oldSource) {
            this.removeIndex(indexName);
            removeDatasetIndex(oldSource, this.indexes[indexName]);
          }
          if (this.source) this.addIndex(indexName, getDatasetIndex(this.source, index));
        }
      },
      listen: {
        index: {
          change: function(sender) {
            var indexMap = this.indexMap;
            indexMap.indexValues[this.key] = sender.value;
            indexMap.indexUpdated = true;
            indexMap.recalcRequest();
          }
        },
        member: {
          subscribersChanged: function(object, delta) {
            if (object.subscriberCount > 0) this.calcMember(object);
          }
        }
      },
      ruleEvents: basis.data.dataset.createRuleEvents(function(sender, delta) {
        MapFilter.prototype.ruleEvents.update.call(this, sender, delta);
        this.sourceMap_[sender.basisObjectId].updated = true;
        this.recalcRequest();
      }, "update"),
      init: function() {
        this.recalc = this.recalc.bind(this);
        this.indexUpdated = false;
        this.indexesBind_ = {};
        this.memberSourceMap = {};
        var indexes = this.indexes;
        this.indexes = {};
        this.indexes_ = {};
        this.indexValues = {};
        var calcs = this.calcs;
        this.calcs = {};
        if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false) this.keyMap = new KeyObjectMap(basis.object.complete({
          create: function(key, config) {
            return new this.itemClass(config);
          }
        }, this.keyMap));
        MapFilter.prototype.init.call(this);
        basis.object.iterate(indexes, this.addIndex, this);
        basis.object.iterate(calcs, this.addCalc, this);
      },
      addIndex: function(key, index) {
        if (!this.indexes[key]) {
          if (index instanceof IndexConstructor) {
            if (!this.indexes_[key]) {
              this.indexes_[key] = index;
              index = this.source ? getDatasetIndex(this.source, index) : null;
            } else {
              basis.dev.warn("Index `" + key + "` already exists");
              return;
            }
          }
          if (index instanceof Index) {
            this.indexValues[key] = index.value;
            this.indexes[key] = index;
            this.indexesBind_[key] = {
              key: key,
              indexMap: this
            };
            var listenHandler = this.listen.index;
            if (listenHandler) {
              index.addHandler(listenHandler, this.indexesBind_[key]);
              if (listenHandler.change) listenHandler.change.call(this.indexesBind_[key], index, index.value);
            }
          } else {
            basis.dev.warn("Index should be instance of `basis.data.index.Index`");
          }
        } else {
          basis.dev.warn("Index `" + key + "` already exists");
        }
      },
      removeIndex: function(key) {
        if (this.indexes_[key] || this.indexes[key]) {
          if (this.indexes[key] && this.listen.index) this.indexes[key].removeHandler(this.listen.index, this.indexesBind_[key]);
          delete this.indexValues[key];
          delete this.indexesBind_[key];
          delete this.indexes[key];
          delete this.indexes_[key];
        }
      },
      addCalc: function(name, calcCfg) {
        if (calcCfg instanceof CalcIndexPreset) {
          this.calcs[name] = calcCfg.calc;
          for (var indexName in calcCfg.indexes) this.addIndex(indexName, calcCfg.indexes[indexName]);
        } else this.calcs[name] = calcCfg;
        this.recalcRequest();
      },
      removeCalc: function(name) {
        var calcCfg = this.calcs[name];
        if (calcCfg && calcCfg.preset instanceof CalcIndexPreset) {
          var indexes = calcCfg.preset.indexes;
          for (var indexName in indexes) this.removeIndex(indexName, indexes[indexName]);
        }
        delete this.calcs[name];
      },
      lock: function() {
        for (var indexId in this.indexes) this.indexes[indexId].lock();
      },
      unlock: function() {
        for (var indexId in this.indexes) this.indexes[indexId].unlock();
      },
      recalcRequest: function() {
        if (!this.timer_) this.timer_ = basis.setImmediate(this.recalc);
      },
      recalc: function() {
        for (var idx in this.items_) this.calcMember(this.items_[idx]);
        this.indexUpdated = false;
        this.timer_ = basis.clearImmediate(this.timer_);
      },
      calcMember: function(member) {
        var sourceObject = this.sourceMap_[this.memberSourceMap[member.basisObjectId]];
        if (member.subscriberCount && (sourceObject.updated || this.indexUpdated)) {
          sourceObject.updated = false;
          var data = {};
          var newValue;
          var oldValue;
          var update;
          for (var calcName in this.calcs) {
            newValue = this.calcs[calcName](sourceObject.sourceObject.data, this.indexValues, sourceObject.sourceObject);
            oldValue = member.data[calcName];
            if (member.data[calcName] !== newValue && (typeof newValue != "number" || typeof oldValue != "number" || !isNaN(newValue) || !isNaN(oldValue))) {
              data[calcName] = newValue;
              update = true;
            }
          }
          if (update) member.update(data);
        }
      },
      getMember: function(sourceObject) {
        return this.keyMap.get(sourceObject, true);
      },
      destroy: function() {
        this.timer_ = clearTimeout(this.timer_);
        this.calcs = null;
        this.indexUpdated = null;
        this.memberSourceMap = null;
        this.indexesBind_ = null;
        this.keyMap.destroy();
        this.keyMap = null;
        for (var indexName in this.indexes) this.removeIndex(indexName);
        MapFilter.prototype.destroy.call(this);
      }
    });
    module.exports = {
      IndexConstructor: IndexConstructor,
      createIndexConstructor: createIndexConstructor,
      getDatasetIndex: getDatasetIndex,
      removeDatasetIndex: removeDatasetIndex,
      Index: Index,
      Count: Count,
      Sum: Sum,
      Avg: Avg,
      VectorIndex: VectorIndex,
      Min: Min,
      Max: Max,
      count: count,
      sum: sum,
      avg: avg,
      max: max,
      min: min,
      CalcIndexPreset: CalcIndexPreset,
      percentOfRange: percentOfRange,
      percentOfMax: percentOfMax,
      percentOfSum: percentOfSum,
      IndexMap: IndexMap
    };
  },
  "f.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./4.js");
    basis.require("./5.js");
    var namespace = this.path;
    var getter = basis.getter;
    var cleaner = basis.cleaner;
    var Emitter = basis.event.Emitter;
    var AbstractData = basis.data.AbstractData;
    var Value = basis.data.Value;
    var STATE = basis.data.STATE;
    var Property = Value.subclass({
      className: namespace + ".Property",
      extendConstructor_: false,
      init: function(initValue, handler, proxy) {
        this.value = initValue;
        this.handler = handler;
        this.proxy = proxy;
        Value.prototype.init.call(this);
      }
    });
    var OBJECTSET_STATE_PRIORITY = STATE.priority;
    var OBJECTSET_HANDLER = {
      stateChanged: function() {
        this.fire(false, true);
      },
      update: function() {
        this.fire(true);
      },
      change: function() {
        this.fire(true);
      },
      destroy: function(object) {
        this.remove(object);
      }
    };
    var ObjectSet = Value.subclass({
      className: namespace + ".ObjectSet",
      objects: null,
      value: 0,
      valueChanged_: false,
      calculateValue: function() {
        return this.value + 1;
      },
      calculateOnInit: false,
      statePriority: OBJECTSET_STATE_PRIORITY,
      stateChanged_: true,
      timer_: false,
      init: function() {
        Value.prototype.init.call(this);
        var objects = this.objects;
        this.objects = [];
        if (objects && Array.isArray(objects)) {
          this.lock();
          this.add.apply(this, objects);
          this.unlock();
        }
        this.valueChanged_ = this.stateChanged_ = !!this.calculateOnInit;
        this.update();
      },
      add: function() {
        for (var i = 0, len = arguments.length; i < len; i++) {
          var object = arguments[i];
          if (object instanceof AbstractData) {
            if (basis.array.add(this.objects, object)) object.addHandler(OBJECTSET_HANDLER, this);
          } else throw this.constructor.className + "#add: Instance of AbstractData required";
        }
        this.fire(true, true);
      },
      remove: function(object) {
        if (basis.array.remove(this.objects, object)) object.removeHandler(OBJECTSET_HANDLER, this);
        this.fire(true, true);
      },
      clear: function() {
        for (var i = 0, object; object = this.objects[i]; i++) object.removeHandler(OBJECTSET_HANDLER, this);
        this.objects.length = 0;
        this.fire(true, true);
      },
      fire: function(valueChanged, stateChanged) {
        if (!this.locked) {
          this.valueChanged_ = this.valueChanged_ || !!valueChanged;
          this.stateChanged_ = this.stateChanged_ || !!stateChanged;
          if (!this.timer_ && (this.valueChanged_ || this.stateChanged_)) this.timer_ = basis.setImmediate(this.update.bind(this));
        }
      },
      lock: function() {
        this.locked = true;
      },
      unlock: function() {
        this.locked = false;
      },
      update: function() {
        var valueChanged = this.valueChanged_;
        var stateChanged = this.stateChanged_;
        this.valueChanged_ = false;
        this.stateChanged_ = false;
        this.timer_ = basis.clearImmediate(this.timer_);
        if (!cleaner.globalDestroy) {
          if (valueChanged) this.set(this.calculateValue());
          if (stateChanged) {
            var len = this.objects.length;
            if (!len) this.setState(STATE.UNDEFINED); else {
              var maxWeight = -2;
              var curObject;
              for (var i = 0; i < len; i++) {
                var object = this.objects[i];
                var weight = this.statePriority.indexOf(String(object.state));
                if (weight > maxWeight) {
                  curObject = object;
                  maxWeight = weight;
                }
              }
              if (curObject) this.setState(curObject.state, curObject.state.data);
            }
          }
        }
      },
      destroy: function() {
        this.lock();
        this.clear();
        if (this.timer_) basis.clearImmediate(this.timer_);
        Value.prototype.destroy.call(this);
      }
    });
    var Expression = Property.subclass({
      className: namespace + ".Expression",
      init: function(args, calc) {
        Value.prototype.init.call(this);
        var args = basis.array(arguments);
        var calc = args.pop();
        if (typeof calc != "function") {
          basis.dev.warn(this.constructor.className + ": last argument of constructor must be a function");
          calc = basis.fn.$undef;
        }
        if (args.length == 1) {
          args[0].link(this, function(value) {
            this.set(calc.call(this, value));
          });
        }
        if (args.length > 1) {
          var changeWatcher = new ObjectSet({
            objects: args,
            calculateOnInit: true,
            calculateValue: function() {
              return calc.apply(this, args.map(function(item) {
                return item.value;
              }));
            }
          });
          changeWatcher.link(this, this.set);
          this.addHandler({
            destroy: function() {
              if (!cleaner.globalDestroy) changeWatcher.destroy();
            }
          });
        }
      }
    });
    module.exports = {
      Property: Property,
      ObjectSet: ObjectSet,
      Expression: Expression
    };
  },
  "g.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var host = typeof performance !== "undefined" ? performance : Date;
    var nowMethod = "webkitNow" in host ? "webkitNow" : "now";
    module.exports = {
      time: function(time) {
        return !arguments.length ? host[nowMethod]() : parseInt(host[nowMethod]() - time);
      },
      test: function(times, fn) {
        var t = this.time();
        for (var i = 0; i < times; i++) fn(i);
        return this.time(t);
      }
    };
  },
  "h.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./5.js");
    basis.require("./f.js");
    basis.require("./e.js");
    basis.require("./d.js");
    basis.require("./6.js");
    basis.require("./g.js");
    var utils = basis.require("./p.js");
    var envFactory = basis.require("./j.js");
    var astTools = basis.require("./k.js");
    var ERROR_TEST_FAULT = "ERROR_TEST_FAULT";
    var ERROR_EMPTY = "ERROR_EMPTY";
    var ERROR_TEST_CRASH = "ERROR_TEST_CRASH";
    var ERROR_TIMEOUT = "ERROR_TIMEOUT";
    var NOP = function() {};
    var testMap = {};
    function createTestFactory(data) {
      if (data.testcase) basis.dev.warn("`testcase` setting is deprecated, use `test` instead");
      var test = data.test || data.testcase;
      data = basis.object.slice(data);
      basis.object.splice(data, [ "test", "testcase" ]);
      if (test) {
        if (basis.resource.isResource(data)) test = test.fetch();
      } else {
        test = function() {};
      }
      if (!data.name) data.name = "Untitled test";
      var Class;
      var config = {
        data: data
      };
      if (typeof test == "function") {
        var fnInfo = utils.getFnInfo(test);
        config.data.async = !!fnInfo.args.length;
        config.data.testArgs = fnInfo.args;
        config.data.testSource = fnInfo.code;
        Class = TestCase;
      } else {
        config.childNodes = !Array.isArray(test) ? [] : test;
        Class = TestSuite;
      }
      return new Class(config);
    }
    var FILE_HANDLER = {
      update: function(file, delta) {
        if ("content" in delta) {
          var exports = basis.resource.extensions[".js"](file.data.content, file.data.filename + "." + Math.random());
          var config = Array.isArray(exports) ? {
            test: exports
          } : exports;
          var newNode = createTestFactory(config);
          this.parentNode.replaceChild(newNode, this);
          this.destroy();
        }
      }
    };
    var AbstractTest = basis.dom.wrapper.Node.subclass({
      className: "AbstractTest",
      name: "",
      envRunner: null,
      init: function() {
        basis.dom.wrapper.Node.prototype.init.call(this);
      },
      hasOwnEnvironment: function() {
        return Boolean(this.data.init || this.data.html || !this.parentNode);
      },
      getHtml: function() {
        var cursor = this;
        while (!cursor.data.html && cursor.parentNode) cursor = cursor.parentNode;
        return cursor.data.html;
      },
      getEnvRunner: function(autocreate) {
        if (this.envRunner) return this.envRunner;
        var envRunner;
        if (!this.data.init) envRunner = this.parentNode && this.parentNode.getEnvRunner(autocreate);
        if ((this.data.init || this.data.html || !envRunner) && autocreate) {
          envRunner = envFactory.create(this.data.init, this.getHtml());
          envRunner.addHandler({
            destroy: function() {
              this.envRunner = null;
              this.reset();
            }
          }, this);
          this.envRunner = envRunner;
        }
        return envRunner;
      },
      reset: function() {
        if (this.envRunner) {
          this.envRunner.destroy();
          this.envRunner = null;
        }
      },
      destroy: function() {
        basis.dom.wrapper.Node.prototype.destroy.call(this);
        if (this.envRunner) {
          this.envRunner.destroy();
          this.envRunner = null;
        }
        if (this.file) {
          this.file.removeHandler(FILE_HANDLER, this);
          this.file = null;
        }
      }
    });
    var TestCase = AbstractTest.subclass({
      className: "TestCase",
      name: "",
      testSource: null,
      testWrappedSources: null,
      childClass: null,
      getSourceCode: function(breakpointAt) {
        if (this.testWrappedSources === null) {
          this.testWrappedSources = {};
        }
        if (typeof breakpointAt != "number") breakpointAt = "none";
        if (!this.testWrappedSources[breakpointAt]) {
          var ast = astTools.parse(this.data.testSource);
          if (breakpointAt == "none") {
            astTools.traverseAst(ast, function(node) {
              if (node.type == "Program") return;
              if (node.type == "FunctionExpression") {
                var tokens = astTools.getNodeRangeTokens(node);
                var orig = astTools.translateAst(ast, tokens[0].range[0], tokens[1].range[1]);
                tokens[0].value = "__wrapFunctionExpression(" + tokens[0].value;
                tokens[1].value += ", " + orig + ")";
              }
              if (node.type == "FunctionDeclaration") {
                var tokens = astTools.getNodeRangeTokens(node.body);
                tokens[0].value += "\ntry {\n";
                tokens[1].value = "\n} catch(e) {" + "__exception(e);" + "throw e;" + "}\n" + tokens[1].value;
              }
              if (node.type == "CallExpression") {
                if (node.parentNode.type == "ExpressionStatement") {
                  var token = astTools.getNodeRangeTokens(node)[0];
                  token.value = "__isFor([" + node.range + "], " + (node.loc.end.line - 1) + ") || " + token.value;
                  if (node.arguments.length == 1 && node.arguments[0].type == "BinaryExpression" && node.arguments[0].operator.match(/^(===?)$/)) {
                    var leftToken = astTools.getNodeRangeTokens(node.arguments[0].left);
                    var rightToken = astTools.getNodeRangeTokens(node.arguments[0].right);
                    leftToken[0].value = '__actual("' + node.arguments[0].operator + '",' + leftToken[0].value;
                    leftToken[1].value += ")";
                    rightToken[0].value = "__expected(" + rightToken[0].value;
                    rightToken[1].value += ")";
                  }
                }
              }
              if (node.parentNode.type == "BlockStatement" || node.parentNode.type == "Program") {
                var firstToken = astTools.getNodeRangeTokens(node)[0];
                firstToken.value = "__enterLine(" + (firstToken.loc.start.line - 1) + ");" + firstToken.value;
              }
            });
          }
          var wrapperSource = astTools.translateAst(ast, 0, ast.source.length);
          this.testWrappedSources[breakpointAt] = "function(" + this.data.testArgs.concat("assert", "__isFor", "__enterLine", "__exception", "__wrapFunctionExpression", "__actual", "__expected").join(", ") + "){\n" + wrapperSource + "\n}";
        }
        return this.testWrappedSources[breakpointAt];
      },
      reset: function() {
        AbstractTest.prototype.reset.call(this);
        this.setState(basis.data.STATE.UNDEFINED);
      },
      run: function() {
        var warnMessages = [];
        var errorMessages = [];
        var error;
        var time = NaN;
        var startTime;
        var timeoutTimer;
        var async = this.data.async ? 1 : 0;
        var isNode = null;
        var implicitCompare;
        var actual_;
        var expected_;
        var report = {
          test: null,
          testSource: this.data.testSource,
          time: time,
          lastLine: 0,
          pending: false,
          successCount: 0,
          testCount: 0,
          error: null,
          exception: null,
          errorLines: {},
          warns: null
        };
        var env = {
          async: function(fn) {
            async++;
            basis.nextTick(function() {
              if (async > 0) {
                try {
                  fn.call(this);
                } catch (e) {
                  __exception(e);
                } finally {
                  if (async > 0) {
                    if (!--async) testDone();
                  }
                }
              }
            }.bind(this));
          },
          is: function(expected, actual, deep) {
            var error;
            if (arguments.length == 1) {
              error = utils.isTruthy(expected);
              if (implicitCompare) {
                actual = actual_;
                expected = expected_;
              } else {
                actual = expected;
                expected = true;
              }
            } else {
              error = utils.compareValues(expected, actual, deep);
            }
            if (error) {
              if (isNode) {
                var line = isNode.line;
                var errors = report.errorLines[line];
                if (!errors) errors = report.errorLines[line] = [];
                errors.push({
                  num: report.testCount,
                  node: isNode,
                  error: error,
                  expected: utils.makeStaticCopy(expected),
                  expectedStr: utils.value2string(expected, false, deep),
                  actual: utils.makeStaticCopy(actual),
                  actualStr: utils.value2string(actual, false, deep)
                });
              }
            }
            implicitCompare = false;
            actual_ = undefined;
            expected_ = undefined;
            report.successCount += !error;
            report.testCount++;
          },
          report: report
        };
        var __actual = function(operator, value) {
          implicitCompare = operator;
          actual_ = value;
          return value;
        };
        var __expected = function(value) {
          expected_ = value;
          return value;
        };
        var __isFor = function(range, line) {
          report.lastLine = line;
          isNode = {
            range: range,
            line: line
          };
        };
        var __enterLine = function(line) {
          report.lastLine = line;
        };
        var __wrapFunctionExpression = function(fn, orig) {
          var wrappedFn = function() {
            try {
              return fn.apply(this, arguments);
            } catch (e) {
              __exception(e);
              throw e;
            }
          };
          wrappedFn.originalFn_ = orig;
          return wrappedFn;
        };
        var __exception = function(e) {
          if (report.exception) return;
          report.exception = e;
          report.testCount = 0;
          report.successCount = 0;
          testDone(ERROR_TEST_CRASH);
        };
        var asyncDone = async ? basis.fn.runOnce(function() {
          if (async > 0) async--;
          if (!async) testDone();
        }) : NOP;
        var testDone = function(error) {
          time = basis.utils.benchmark.time(startTime);
          timeoutTimer = clearTimeout(timeoutTimer);
          async = 0;
          if (!error && report.testCount != report.successCount) error = ERROR_TEST_FAULT;
          basis.object.extend(report, {
            test: this,
            time: time,
            error: error,
            pending: !error && !report.testCount,
            warns: warnMessages.length ? warnMessages : null
          });
          this.setState(error || errorMessages.length ? basis.data.STATE.ERROR : basis.data.STATE.READY, new basis.data.Object({
            data: report
          }));
        }.bind(this);
        this.setState(basis.data.STATE.PROCESSING);
        if (this.data.pending) return testDone();
        this.getEnvRunner(true).run(this.getSourceCode(), this, function(testFn) {
          startTime = basis.utils.benchmark.time();
          var assert = env.is.bind(env);
          assert.exception = assert.throws = function(fn) {
            try {
              report.exception = true;
              fn();
              assert(false);
            } catch (e) {
              assert(true);
            } finally {
              report.exception = false;
            }
          };
          assert.deep = function(expected, actual) {
            assert(expected, actual, true);
          };
          var args = basis.array.create(this.data.testArgs.length);
          if (args.length) args[0] = asyncDone;
          args.push(assert, __isFor, __enterLine, __exception, __wrapFunctionExpression, __actual, __expected);
          try {
            testFn.apply(env, args);
          } catch (e) {
            return __exception(e);
          }
          if (!async) testDone(); else timeoutTimer = setTimeout(function() {
            testDone(ERROR_TIMEOUT);
          }, this.data.timeout || 250);
        });
      }
    });
    var TestSuite = AbstractTest.subclass({
      className: "TestSuite",
      childFactory: createTestFactory,
      childClass: AbstractTest,
      init: function() {
        AbstractTest.prototype.init.call(this);
        this.nestedTests_ = new basis.data.Dataset({
          items: this.childNodes.reduce(function(res, item) {
            return res.concat(item instanceof TestSuite ? item.nestedTests_.getItems() : item);
          }, [])
        });
        this.testByState_ = new basis.data.dataset.Split({
          source: this.nestedTests_,
          ruleEvents: "stateChanged",
          rule: function(test) {
            return test.state == basis.data.STATE.READY && test.state.data.data.pending ? "pending" : String(test.state);
          }
        });
        this.state_ = new basis.data.value.Expression(basis.data.Value.from(this.nestedTests_, "itemsChanged", "itemCount"), basis.data.Value.from(this.testByState_.getSubset("processing", true), "itemsChanged", "itemCount"), basis.data.Value.from(this.testByState_.getSubset("error", true), "itemsChanged", "itemCount"), basis.data.Value.from(this.testByState_.getSubset("ready", true), "itemsChanged", "itemCount"), basis.data.Value.from(this.testByState_.getSubset("pending", true), "itemsChanged", "itemCount"), function(count, processing, error, ready, pending) {
          if (!count) return [ basis.data.STATE.READY, new basis.data.Object({
            data: {
              pending: true,
              testCount: count,
              successCount: ready
            }
          }) ];
          if (processing + error + ready + pending == 0) return [ basis.data.STATE.UNDEFINED ];
          if (processing || error + ready + pending < count) return [ basis.data.STATE.PROCESSING, (error + ready) / count ];
          return [ error ? basis.data.STATE.ERROR : basis.data.STATE.READY, new basis.data.Object({
            data: {
              pending: pending == count,
              error: error ? ERROR_TEST_FAULT : null,
              testCount: count,
              successCount: ready + pending
            }
          }) ];
        });
        this.state_.changeWatcher = this.state_.handler.handler.context.value;
        this.state_.link(this, function(state) {
          this.setState.apply(this, state);
        });
      },
      reset: function() {
        AbstractTest.prototype.reset.call(this);
        this.state_.lock();
        this.childNodes.forEach(function(test) {
          test.reset();
        });
        this.state_.unlock();
        this.state_.changeWatcher.update();
      },
      destroy: function() {
        this.testByState_.destroy();
        this.testByState_ = null;
        this.nestedTests_.destroy();
        this.nestedTests_ = null;
        this.state_.destroy();
        this.state_ = null;
        AbstractTest.prototype.destroy.call(this);
      }
    });
    module.exports = {
      AbstractTest: AbstractTest,
      TestCase: TestCase,
      TestSuite: TestSuite,
      map: testMap,
      create: createTestFactory
    };
  },
  "p.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./i.js");
    var arrayFrom = basis.array.from;
    var OBJECT_TOSTRING = Object.prototype.toString;
    var ERROR_WRONG_ANSWER = "ERROR_WRONG_ANSWER";
    var ERROR_TYPE_MISSMATCH = "ERROR_TYPE_MISSMATCH";
    function sliceOwnOnly(obj) {
      var result = {};
      for (var key in obj) if (obj.hasOwnProperty(key)) result[key] = obj[key];
      return result;
    }
    function makeStaticCopy(value) {
      if (value && typeof value == "object") return Array.isArray(value) ? arrayFrom(value) : sliceOwnOnly(value);
      return value;
    }
    function value2string(value, linear, deep) {
      switch (typeof value) {
        case "boolean":
        case "number":
        case "undefined":
          return String(value);
        case "string":
          return "'" + value.replace(/\'/g, "\\'") + "'";
        case "function":
          if (value.originalFn_) value = value.originalFn_;
          value = String(value);
          return !linear ? value : value.replace(/\{([\r\n]|.)*\}/, "{..}");
        case "object":
          if (value === null) return "null";
          if (Array.isArray(value)) return "[" + value.map(function(val) {
            return value2string(val, !deep, deep);
          }).join(", ") + "]";
          if (OBJECT_TOSTRING.call(value) === "[object Date]" || OBJECT_TOSTRING.call(value) === "[object RegExp]") return String(value);
          if (value && value.constructor === Number) debugger;
          if (!linear) {
            var res = [];
            for (var key in value) if (value.hasOwnProperty(key)) res.push(key + ": " + value2string(value[key], !deep, deep));
            if (!res.length && value.valueOf() !== value) {
              var m = value.constructor.toString().match(/function (Number|String|Boolean)/);
              if (m) return "new Object(" + value2string(value.valueOf()) + ")";
            }
            return "{ " + res.join(", ") + " }";
          } else return "{object}";
        default:
          return "unknown type `" + typeof value + "`";
      }
    }
    function isTruthy(value) {
      if (!value) return ERROR_WRONG_ANSWER;
    }
    function compareValues(actual, expected, deep) {
      var error;
      if (actual === expected) return;
      if (typeof actual != typeof expected) return ERROR_TYPE_MISSMATCH;
      if (actual != null && expected != null && actual.constructor !== expected.constructor) return ERROR_TYPE_MISSMATCH;
      if (actual == expected) return;
      switch (typeof actual) {
        case "string":
        case "boolean":
        case "undefined":
          return ERROR_WRONG_ANSWER;
        case "number":
          if (actual !== actual && expected !== expected) return;
          return ERROR_WRONG_ANSWER;
        case "function":
          if (expected.originalFn_) expected = expected.originalFn_;
          if (actual.originalFn_) actual = actual.originalFn_;
          if (String(expected) == String(actual)) return;
          return ERROR_WRONG_ANSWER;
        default:
          if (!expected && actual || expected && !actual) return ERROR_WRONG_ANSWER;
          if (String(expected) != String(actual)) return ERROR_WRONG_ANSWER;
          if (actual && "length" in actual) {
            if (actual.length != expected.length) return ERROR_WRONG_ANSWER;
            for (var i = 0; i < actual.length; i++) {
              if (actual[i] !== expected[i]) {
                if (deep && !actual.__antirecursion__) {
                  actual.__antirecursion__ = true;
                  error = compareValues(actual[i], expected[i], deep);
                  delete actual.__antirecursion__;
                  if (error) return error;
                  continue;
                }
                return ERROR_WRONG_ANSWER;
              }
            }
          } else {
            for (var i in actual) if (i in expected == false || actual[i] !== expected[i]) {
              if (deep && i in expected && !actual.__antirecursion__) {
                actual.__antirecursion__ = true;
                error = compareValues(actual[i], expected[i], deep);
                delete actual.__antirecursion__;
                if (error) return error;
                continue;
              }
              return ERROR_WRONG_ANSWER;
            }
            for (var i in expected) if (i in actual == false) return ERROR_WRONG_ANSWER;
          }
      }
    }
    function getFnInfo(test) {
      var info = basis.utils.info.fn(test);
      var args = info.args ? info.args.split(/\s*,\s*/) : [];
      var code = info.body.replace(/([\r\n]|\s)*\"use strict\";/, "").replace(/\r/g, "").replace(/^(\s*\n)+|(\n\s*)*$/g, "");
      var minOffset = code.split(/\n+/).map(function(line) {
        return line.match(/^(\s*)/)[0];
      }).sort()[0];
      return {
        args: args,
        code: code.replace(new RegExp("(^|\\n)" + minOffset, "g"), "$1") || "// no source code"
      };
    }
    module.exports = {
      sliceOwnOnly: sliceOwnOnly,
      makeStaticCopy: makeStaticCopy,
      value2string: value2string,
      compareValues: compareValues,
      isTruthy: isTruthy,
      getFnInfo: getFnInfo
    };
  },
  "i.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    function resolveGetter(getter) {
      if (getter.basisGetterId_ > 0) {
        var result = "getter(";
        if (typeof getter.base == "string") result += '"' + getter.base.replace(/"/g, '\\"') + '"'; else {
          if (!getter.mod) return resolveGetter(getter.base); else result += resolveGetter(getter.base);
        }
        if (getter.mod) {
          if (typeof getter.mod == "string") result += ', "' + getter.mod.replace(/"/g, '\\"') + '"'; else result += ", " + resolveGetter(getter.mod);
        }
        return result + ")";
      } else return Function.prototype.toString.call(getter);
    }
    function tokenizeFunctionSource(source) {
      var chars = source.split("");
      var res = [];
      var last = 0;
      var j;
      function store(type, pos) {
        if (arguments.length != 2) pos = i;
        if (last != pos) {
          res.push([ type || "content", source.substring(last, pos) ]);
          last = pos;
        }
      }
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        switch (ch) {
          case "/":
            j = i + 1;
            if (chars[j] === "/") {
              store();
              while (j < chars.length && chars[j] !== "\n" && chars[j] !== "\r") j++;
              store("comment", j);
              i = last - 1;
              break;
            }
            if (chars[j] == "*") {
              store();
              j = j + 1;
              while (j < chars.length && !(chars[j] === "*" && chars[j + 1] === "/")) j++;
              store("comment", j + 2);
              i = last - 1;
              break;
            }
            break;
          case '"':
          case "'":
            store();
            j = i;
            while (true) {
              j++;
              if (chars[j] == "\\") {
                j++;
              } else {
                if (chars[j] == ch) break;
              }
            }
            store("string", j + 1);
            i = last - 1;
            break;
          case "(":
          case "{":
            store();
            last = i + 1;
            res.push([ "open", ch ]);
            break;
          case ")":
          case "}":
            store();
            last = i + 1;
            res.push([ "close", ch ]);
            break;
          default:
            if (/\s/.test(ch)) {
              store();
              j = i + 1;
              while (j < chars.length && /\s/.test(chars[j])) j++;
              store("space", j);
              i = last - 1;
            }
        }
      }
      store();
      console.log(JSON.stringify(res, null, 2));
      return res;
    }
    function functionInfo(fn) {
      var getter = resolveGetter(fn);
      var source = Function.prototype.toString.call(fn);
      var tokens = tokenizeFunctionSource(source);
      var name = "anonymous";
      var argsContext = false;
      var wasContent = true;
      var args = [];
      var token;
      while (token = tokens.shift()) {
        if (token[1] == "{") break;
        if (token[0] == "content") {
          wasContent = true;
          if (argsContext) args.push(token[1]); else {
            if (token[1] != "function") name = token[1];
          }
        } else {
          if (!argsContext) argsContext = wasContent && token[1] == "(";
        }
      }
      while (token = tokens.pop()) if (token[1] == "}") break;
      for (var i = 0; i < tokens.length; i++) tokens[i] = tokens[i][1];
      args = args.join("").trim().replace(/\s*,\s*/g, ", ");
      return {
        source: source,
        name: name,
        fullname: name + "(" + args + ")",
        args: args,
        body: tokens.join(""),
        getter: getter != source ? getter : false
      };
    }
    module.exports = {
      fn: functionInfo
    };
  },
  "1.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var document = global.document || {
      title: "unknown"
    };
    var appTitle = document.title;
    var appInit = basis.fn.$undef;
    var appInjectPoint;
    var appEl;
    function updateTitle(value) {
      document.title = value;
    }
    function resolveNode(ref) {
      return typeof ref == "string" ? document.getElementById(ref) : ref;
    }
    function replaceNode(oldChild, newChild) {
      oldChild.parentNode.replaceChild(newChild, oldChild);
    }
    var createApp = basis.fn.lazyInit(function(config) {
      var readyHandlers = [];
      var inited = false;
      var app = {
        inited: false,
        setTitle: function(title) {
          if (title != appTitle) {
            if (appTitle instanceof basis.Token) appTitle.detach(updateTitle);
            if (title instanceof basis.Token) {
              title.attach(updateTitle);
              updateTitle(title.get());
            } else updateTitle(title);
            appTitle = title;
          }
        },
        setElement: function(el) {
          var newAppEl = resolveNode(el);
          if (appEl == newAppEl) return;
          if (appEl) {
            replaceNode(appEl, newAppEl);
            return;
          } else appEl = newAppEl;
          if (!appInjectPoint) appInjectPoint = {
            type: "append",
            node: document.body
          };
          var node = resolveNode(appInjectPoint.node);
          if (!node) return;
          if (appInjectPoint.type == "append") node.appendChild(appEl); else replaceNode(node, appEl);
        },
        ready: function(fn, context) {
          if (inited) fn.call(context, app); else readyHandlers.push({
            fn: fn,
            context: context
          });
        }
      };
      for (var key in config) {
        var value = config[key];
        switch (key) {
          case "title":
            app.setTitle(value);
            break;
          case "container":
            appInjectPoint = {
              type: "append",
              node: value
            };
            break;
          case "replace":
            appInjectPoint = {
              type: "replace",
              node: value
            };
            break;
          case "element":
            appEl = value;
            break;
          case "init":
            appInit = typeof value == "function" ? value : appInit;
            break;
          default:
            basis.dev.warn("Unknown config property `" + key + "` for app, value:", value);
        }
      }
      basis.ready(function() {
        var insertEl = appEl;
        var initResult = appInit.call(app);
        if (initResult) {
          if (initResult.element) insertEl = initResult.element; else insertEl = initResult;
        }
        appEl = null;
        app.setElement(insertEl);
        inited = true;
        app.inited = true;
        var handler;
        while (handler = readyHandlers.shift()) handler.fn.call(handler.context, app);
      });
      return app;
    });
    module.exports = {
      create: createApp
    };
  },
  "q.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./i.js");
    basis.require("./2.js");
    function runInContext(contextWindow, code) {
      (contextWindow.execScript || function(code) {
        contextWindow["eval"].call(contextWindow, code);
      })(code);
    }
    var FrameEnv = basis.ui.Node.subclass({
      applyEnvironment: null,
      initEnv: null,
      html: null,
      postInit: function() {
        basis.ui.Node.prototype.postInit.call(this);
        basis.doc.body.add(this.element);
      },
      template: basis.template.get("#1"),
      binding: {
        src: function(node) {
          if (node.html && node.html != "default") return node.html;
          return basis.path.resolve(basis.require("./j.js").baseURI || "", "res/2NM1dsdOx8Ioc7cT_94Adw.html");
        }
      },
      action: {
        ready: function() {
          var frameWindow = this.element.contentWindow;
          var initCode = "";
          var code = basis.resource("./0.code").fetch();
          if (typeof code == "function") code = basis.utils.info.fn(code).body;
          runInContext(frameWindow, code);
          if (typeof this.initEnv == "function") initCode = basis.utils.info.fn(this.initEnv).body;
          this.applyEnvironment = frameWindow.__initTestEnvironment(initCode, function() {
            this.destroy();
          }.bind(this));
          if (this.runArgs) {
            this.run.apply(this, this.runArgs);
            this.runArgs = null;
          }
        }
      },
      run: function(code, context, runTest) {
        if (this.applyEnvironment) runTest.call(context, this.applyEnvironment(code)); else this.runArgs = arguments;
      },
      destroy: function() {
        basis.ui.Node.prototype.destroy.call(this);
        this.applyEnvironment = null;
        this.runArgs = null;
      }
    });
    module.exports = FrameEnv;
  },
  "0.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./1.js");
    basis.require("./2.js");
    var runner = basis.require("./c.js");
    var toc = basis.require("./r.js");
    var testDetails = basis.require("./s.js");
    var rootTestSuite = new basis.data.Object({
      getChildNodesDataset: function() {}
    });
    function findTest(test, filename) {
      if (test.data.filename_ === filename) return test;
      if (test.childNodes) for (var i = 0, child; child = test.childNodes[i]; i++) {
        var res = findTest(child, filename);
        if (res) return res;
      }
    }
    toc.addHandler({
      delegateChanged: function() {
        var cursor = this;
        while (!cursor.data.filename_ && cursor.root.parentNode) cursor = cursor.root.parentNode;
        location.hash = "#" + (cursor.root.parentNode && cursor.data.filename_ ? cursor.data.filename_ : "");
      },
      childNodesModified: function() {
        runner.loadTests(this.childNodes.slice(0));
      }
    });
    toc.selection.addHandler({
      itemsChanged: function(selection) {
        this.setDelegate(selection.pick());
      }
    }, testDetails);
    testDetails.selection.addHandler({
      itemsChanged: function(selection) {
        var selected = selection.pick();
        if (selected) this.setDelegate(selected.root);
      }
    }, toc);
    var view = new basis.ui.Node({
      template: basis.template.get("#9"),
      action: {
        reset: function() {
          toc.setDelegate(rootTestSuite);
        },
        run: function() {
          runner.run();
        }
      },
      binding: {
        toc: toc,
        tests: testDetails,
        name: basis.data.Value.from(rootTestSuite, "update", "data.name"),
        time: runner.time,
        total: runner.count.total,
        assert: runner.count.assert,
        left: runner.count.left,
        done: runner.count.done
      }
    });
    module.exports = {
      loadTests: function(data, reference) {
        if (Array.isArray(data)) data = {
          test: data
        };
        var rootTest = basis.require("./h.js").create(data);
        var marker = location.hash.substr(1);
        var testByFilename;
        if (marker) testByFilename = findTest(rootTest, marker);
        toc.setDelegate(testByFilename || rootTestSuite);
        rootTestSuite.setDelegate(rootTest);
      }
    };
    if (basis.config.exports) {
      global.basisjsTestRunner = basis.object.extend(module.exports, {
        setup: function(config) {
          for (var key in config) {
            var value = config[key];
            switch (key) {
              case "element":
                if (typeof value == "string") value = document.getElementById(value);
                basis.nextTick(function() {
                  this.appendChild(view.element);
                }.bind(value));
                break;
              case "baseURI":
                basis.require("./j.js").baseURI = value;
                break;
            }
          }
        },
        run: function() {
          runner.run();
        }
      });
    } else {
      basis.ready(function() {
        basis.doc.body.add(view.element);
      });
    }
  },
  "2.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./3.js");
    basis.require("./5.js");
    basis.require("./6.js");
    basis.require("./7.js");
    basis.require("./8.js");
    var namespace = this.path;
    var document = global.document;
    var Class = basis.Class;
    var createEvent = basis.event.create;
    var HtmlTemplate = basis.template.html.Template;
    var TemplateSwitcher = basis.template.TemplateSwitcher;
    var DWNode = basis.dom.wrapper.Node;
    var DWPartitionNode = basis.dom.wrapper.PartitionNode;
    var DWGroupingNode = basis.dom.wrapper.GroupingNode;
    var bindingSeed = 1;
    var unknownEventBindingCheck = {};
    function extendBinding(binding, extension) {
      binding.bindingId = bindingSeed++;
      for (var key in extension) {
        var def = null;
        var value = extension[key];
        if (Node && value instanceof Node || basis.resource.isResource(value)) {
          def = {
            events: "satelliteChanged",
            getter: function(key, satellite) {
              var resource = typeof satellite == "function" ? satellite : null;
              var init = function(node) {
                init = false;
                if (resource) {
                  satellite = resource();
                  if (satellite instanceof Node == false) return;
                  resource = null;
                }
                node.setSatellite(key, satellite);
                if (node.satellite[key] !== satellite) basis.dev.warn("basis.ui.binding: implicit satellite `" + key + "` attach to owner failed");
              };
              return function(node) {
                if (init) init(node);
                return resource || (node.satellite[key] ? node.satellite[key].element : null);
              };
            }(key, value)
          };
        } else {
          if (value) {
            if (typeof value == "string") value = BINDING_PRESET.process(key, value); else if (value.bindingBridge) value = basis.fn.$const(value);
            if (typeof value != "object") {
              def = {
                getter: typeof value == "function" ? value : basis.getter(value)
              };
            } else if (Array.isArray(value)) {
              def = {
                events: value[0],
                getter: basis.getter(value[1])
              };
            } else {
              def = {
                events: value.events,
                getter: basis.getter(value.getter)
              };
            }
          }
        }
        binding[key] = def;
      }
    }
    var BINDING_PRESET = function() {
      var presets = {};
      var prefixRegExp = /^([a-z_][a-z0-9_]*):(.*)/i;
      return {
        add: function(prefix, func) {
          if (!presets[prefix]) {
            presets[prefix] = func;
          } else {
            basis.dev.warn("Preset `" + prefix + "` already exists, new definition ignored");
          }
        },
        process: function(key, value) {
          var preset;
          var m = value.match(prefixRegExp);
          if (m) {
            preset = presets[m[1]];
            value = m[2] || key;
          }
          return preset ? preset(value) : value;
        }
      };
    }();
    BINDING_PRESET.add("data", function(path) {
      return {
        events: "update",
        getter: "data." + path
      };
    });
    BINDING_PRESET.add("satellite", function(satelliteName) {
      return {
        events: "satelliteChanged",
        getter: function(node) {
          return node.satellite[satelliteName] ? node.satellite[satelliteName].element : null;
        }
      };
    });
    var TEMPLATE_BINDING = Class.customExtendProperty({
      state: {
        events: "stateChanged",
        getter: function(node) {
          return String(node.state);
        }
      },
      childNodesState: {
        events: "childNodesStateChanged",
        getter: function(node) {
          return String(node.childNodesState);
        }
      },
      childCount: {
        events: "childNodesModified",
        getter: function(node) {
          return node.childNodes ? node.childNodes.length : 0;
        }
      },
      hasChildren: {
        events: "childNodesModified",
        getter: function(node) {
          return !!node.firstChild;
        }
      },
      empty: {
        events: "childNodesModified",
        getter: function(node) {
          return !node.firstChild;
        }
      }
    }, extendBinding);
    var BINDING_TEMPLATE_INTERFACE = {
      attach: function(object, handler, context) {
        object.addHandler(handler, context);
      },
      detach: function(object, handler, context) {
        object.removeHandler(handler, context);
      }
    };
    var TEMPLATE_ACTION = Class.extensibleProperty({
      select: function(event) {
        if (this.isDisabled()) return;
        if (this.contextSelection && this.contextSelection.multiple) this.select(event.ctrlKey || event.metaKey); else this.select();
      }
    });
    var TEMPLATE_SWITCHER_HANDLER = {
      "*": function(event) {
        var switcher = this.templateSwitcher_;
        if (switcher && switcher.ruleEvents && switcher.ruleEvents[event.type]) this.setTemplate(switcher.resolve(this));
      }
    };
    var TEMPLATE = new HtmlTemplate("<div/>");
    var fragments = [];
    function getDocumentFragment() {
      return fragments.pop() || document.createDocumentFragment();
    }
    function reinsertPartitionNodes(partition) {
      var nodes = partition.nodes;
      if (nodes) for (var i = nodes.length - 1, child; child = nodes[i]; i--) child.parentNode.insertBefore(child, child.nextSibling);
    }
    var focusTimer;
    var TemplateMixin = function(super_) {
      return {
        template: TEMPLATE,
        emit_templateChanged: createEvent("templateChanged"),
        templateSwitcher_: null,
        binding: TEMPLATE_BINDING,
        action: TEMPLATE_ACTION,
        tmpl: null,
        element: null,
        childNodesElement: null,
        emit_update: function(delta) {
          this.templateUpdate(this.tmpl, "update", delta);
          super_.emit_update.call(this, delta);
        },
        init: function() {
          this.element = this.childNodesElement = getDocumentFragment();
          super_.init.call(this);
        },
        postInit: function() {
          super_.postInit.call(this);
          var template = this.template;
          if (template) {
            var nodeDocumentFragment = this.element;
            var bindingId = this.constructor.basisClassId_ + "_" + this.binding.bindingId;
            if (bindingId in unknownEventBindingCheck == false) {
              unknownEventBindingCheck[bindingId] = true;
              for (var bindName in this.binding) {
                var events = this.binding[bindName] && this.binding[bindName].events;
                if (events) {
                  events = String(events).trim().split(/\s+|\s*,\s*/);
                  for (var i = 0, eventName; eventName = events[i]; i++) if ("emit_" + eventName in this == false) basis.dev.warn("basis.ui: binding `" + bindName + "` has unknown event `" + eventName + "` for " + this.constructor.className);
                }
              }
            }
            this.template = null;
            this.setTemplate(template);
            fragments.push(nodeDocumentFragment);
            if (this.container) {
              this.container.appendChild(this.element);
              this.container = null;
            }
          }
        },
        templateSync: function() {
          var oldElement = this.element;
          var tmpl = this.template.createInstance(this, this.templateAction, this.templateSync, this.binding, BINDING_TEMPLATE_INTERFACE);
          var noChildNodesElement;
          if (tmpl.childNodesHere) {
            tmpl.childNodesElement = tmpl.childNodesHere.parentNode;
            tmpl.childNodesElement.insertPoint = tmpl.childNodesHere;
          }
          this.tmpl = tmpl;
          this.element = tmpl.element;
          this.childNodesElement = tmpl.childNodesElement || tmpl.element;
          noChildNodesElement = this.childNodesElement.nodeType != 1;
          if (noChildNodesElement) this.childNodesElement = document.createDocumentFragment();
          if (noChildNodesElement) this.noChildNodesElement_ = true; else delete this.noChildNodesElement_;
          if (this.grouping) {
            this.grouping.syncDomRefs();
            var cursor = this;
            while (cursor.grouping) cursor = cursor.grouping;
            var topGrouping = cursor;
            for (var groupNode = topGrouping.lastChild; groupNode; groupNode = groupNode.previousSibling) {
              if (groupNode instanceof PartitionNode) topGrouping.insertBefore(groupNode, groupNode.nextSibling); else reinsertPartitionNodes(groupNode);
            }
            reinsertPartitionNodes(topGrouping.nullGroup);
          } else {
            for (var child = this.lastChild; child; child = child.previousSibling) this.insertBefore(child, child.nextSibling);
          }
          if (this instanceof PartitionNode) reinsertPartitionNodes(this);
          if (this.content) (tmpl.content || tmpl.element).appendChild(this.content.nodeType ? this.content : document.createTextNode(this.content));
          this.templateUpdate(this.tmpl);
          if (oldElement && oldElement !== this.element && oldElement.nodeType != 11) {
            var parentNode = oldElement && oldElement.parentNode;
            if (parentNode) {
              if (this.owner && this.owner.tmpl) this.owner.tmpl.set(oldElement, this.element);
              if (this.element.parentNode !== parentNode) parentNode.replaceChild(this.element, oldElement);
            }
          }
          this.emit_templateChanged();
        },
        setTemplate: function(template) {
          var curSwitcher = this.templateSwitcher_;
          var switcher;
          if (template instanceof TemplateSwitcher) {
            switcher = template;
            template = switcher.resolve(this);
          }
          if (template instanceof HtmlTemplate == false) template = null;
          if (!template) {
            basis.dev.warn("basis.ui.Node#setTemplate: set null to template possible only on node destroy");
            return;
          }
          if (switcher) {
            this.templateSwitcher_ = switcher;
            if (!curSwitcher) this.addHandler(TEMPLATE_SWITCHER_HANDLER, this);
          }
          if (curSwitcher && curSwitcher.resolve(this) !== template) {
            this.templateSwitcher_ = null;
            this.removeHandler(TEMPLATE_SWITCHER_HANDLER, this);
          }
          if (this.template !== template) {
            this.template = template;
            this.templateSync();
          }
        },
        updateBind: function(bindName) {
          var binding = this.binding[bindName];
          var getter = binding && binding.getter;
          if (getter && this.tmpl) this.tmpl.set(bindName, getter(this));
        },
        templateAction: function(actionName, event) {
          var action = this.action[actionName];
          if (action) action.call(this, event);
          if (!action) basis.dev.warn("template call `" + actionName + "` action, but it isn't defined in action list");
        },
        templateUpdate: function(tmpl, eventName, delta) {},
        focus: function(select) {
          var focusElement = this.tmpl ? this.tmpl.focus || this.element : null;
          if (focusElement) {
            if (focusTimer) focusTimer = basis.clearImmediate(focusTimer);
            focusTimer = basis.setImmediate(function() {
              try {
                focusElement.focus();
                if (select) focusElement.select();
              } catch (e) {}
            });
          }
        },
        blur: function() {
          var focusElement = this.tmpl ? this.tmpl.focus || this.element : null;
          if (focusElement) try {
            focusElement.blur();
          } catch (e) {}
        },
        destroy: function() {
          var template = this.template;
          var element = this.element;
          if (this.templateSwitcher_) {
            this.templateSwitcher_ = null;
            this.removeHandler(TEMPLATE_SWITCHER_HANDLER, this);
          }
          template.clearInstance(this.tmpl);
          super_.destroy.call(this);
          this.tmpl = null;
          this.element = null;
          this.childNodesElement = null;
          var parentNode = element && element.parentNode;
          if (parentNode && parentNode.nodeType == 1) parentNode.removeChild(element);
        }
      };
    };
    var ContainerTemplateMixin = function(super_) {
      return {
        insertBefore: function(newChild, refChild) {
          if (this.noChildNodesElement_) {
            delete this.noChildNodesElement_;
            basis.dev.warn("basis.ui: Template has no childNodesElement container, but insertBefore method called; probably it's a bug");
          }
          newChild = super_.insertBefore.call(this, newChild, refChild);
          var target = newChild.groupNode || this;
          var container = target.childNodesElement || this.childNodesElement;
          var nextSibling = newChild.nextSibling;
          var insertPoint = nextSibling && nextSibling.element.parentNode == container ? nextSibling.element : null;
          var childElement = newChild.element;
          var refNode = insertPoint || container.insertPoint || null;
          if (childElement.parentNode !== container || childElement.nextSibling !== refNode) container.insertBefore(childElement, refNode);
          return newChild;
        },
        removeChild: function(oldChild) {
          super_.removeChild.call(this, oldChild);
          var element = oldChild.element;
          var parent = element.parentNode;
          if (parent) parent.removeChild(element);
          return oldChild;
        },
        clear: function(alive) {
          if (alive) {
            var node = this.firstChild;
            while (node) {
              var element = node.element;
              var parent = element.parentNode;
              if (parent) parent.removeChild(element);
              node = node.nextSibling;
            }
          }
          super_.clear.call(this, alive);
        },
        setChildNodes: function(childNodes, keepAlive) {
          if (this.noChildNodesElement_) {
            delete this.noChildNodesElement_;
            basis.dev.warn("basis.ui: Template has no childNodesElement container, but setChildNodes method called; probably it's a bug");
          }
          var domFragment = document.createDocumentFragment();
          var target = this.grouping || this;
          var container = target.childNodesElement;
          target.childNodesElement = domFragment;
          super_.setChildNodes.call(this, childNodes, keepAlive);
          container.insertBefore(domFragment, container.insertPoint || null);
          target.childNodesElement = container;
        }
      };
    };
    var PartitionNode = Class(DWPartitionNode, TemplateMixin, {
      className: namespace + ".PartitionNode",
      binding: {
        title: "data:"
      }
    });
    var GroupingNode = Class(DWGroupingNode, ContainerTemplateMixin, {
      className: namespace + ".GroupingNode",
      childClass: PartitionNode,
      groupingClass: Class.SELF,
      element: null,
      childNodesElement: null,
      emit_ownerChanged: function(oldOwner) {
        this.syncDomRefs();
        DWGroupingNode.prototype.emit_ownerChanged.call(this, oldOwner);
      },
      init: function() {
        this.element = this.childNodesElement = document.createDocumentFragment();
        DWGroupingNode.prototype.init.call(this);
      },
      syncDomRefs: function() {
        var cursor = this;
        var owner = this.owner;
        var element = null;
        if (owner) element = owner.tmpl && owner.tmpl.groupsElement || owner.childNodesElement;
        do {
          cursor.element = cursor.childNodesElement = element;
        } while (cursor = cursor.grouping);
      },
      destroy: function() {
        DWGroupingNode.prototype.destroy.call(this);
        this.element = null;
        this.childNodesElement = null;
      }
    });
    var Node = Class(DWNode, TemplateMixin, ContainerTemplateMixin, {
      className: namespace + ".Node",
      binding: {
        selected: {
          events: "select unselect",
          getter: function(node) {
            return node.selected;
          }
        },
        unselected: {
          events: "select unselect",
          getter: function(node) {
            return !node.selected;
          }
        },
        disabled: {
          events: "disable enable",
          getter: function(node) {
            return node.disabled || node.contextDisabled;
          }
        },
        enabled: {
          events: "disable enable",
          getter: function(node) {
            return !(node.disabled || node.contextDisabled);
          }
        }
      },
      childClass: Class.SELF,
      childFactory: function(config) {
        return new this.childClass(config);
      },
      groupingClass: GroupingNode
    });
    var ShadowNodeList = Node.subclass({
      className: namespace + ".ShadowNodeList",
      emit_ownerChanged: function(oldOwner) {
        Node.prototype.emit_ownerChanged.call(this, oldOwner);
        this.setDataSource(this.owner && this.owner.getChildNodesDataset());
      },
      getChildNodesElement: function(owner) {
        return owner.childNodesElement;
      },
      listen: {
        owner: {
          templateChanged: function() {
            this.childNodes.forEach(function(child) {
              this.appendChild(child.element);
            }, this.getChildNodesElement(this.owner) || this.owner.element);
          }
        }
      },
      childClass: {
        className: namespace + ".ShadowNode",
        getElement: function(node) {
          return node.element;
        },
        templateSync: function() {
          Node.prototype.templateSync.call(this);
          var newElement = this.getElement(this.delegate);
          if (newElement) {
            newElement.basisTemplateId = this.delegate.element.basisTemplateId;
            this.element = newElement;
          }
        },
        listen: {
          delegate: {
            templateChanged: function() {
              var oldElement = this.element;
              var oldElementParent = oldElement.parentNode;
              var newElement = this.getElement(this.delegate);
              if (newElement) newElement.basisTemplateId = this.delegate.element.basisTemplateId;
              this.element = newElement || this.tmpl.element;
              if (oldElementParent) oldElementParent.replaceChild(this.element, oldElement);
            }
          }
        }
      }
    });
    module.exports = {
      BINDING_PRESET: BINDING_PRESET,
      Node: Node,
      PartitionNode: PartitionNode,
      GroupingNode: GroupingNode,
      ShadowNodeList: ShadowNodeList,
      ShadowNode: ShadowNodeList.prototype.childClass
    };
  },
  "k.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var esprima = basis.require("./l.js");
    var TRAVERSE_ABORT = 1;
    var TRAVERSE_STOP_DEEP = 2;
    var NODE_BRANCHES = {
      ArrayExpression: [ "elements" ],
      AssignmentExpression: [ "left", "right" ],
      BinaryExpression: [ "left", "right" ],
      BlockStatement: [ "body" ],
      BreakStatement: [ "label" ],
      CallExpression: [ "callee", "arguments" ],
      CatchClause: [ "param", "body" ],
      ConditionalExpression: [ "test", "consequent", "alternate" ],
      ContinueStatement: [ "label" ],
      DebuggerStatement: [],
      DoWhileStatement: [ "test", "body" ],
      EmptyStatement: [],
      ExpressionStatement: [ "expression" ],
      ForInStatement: [ "left", "right", "body" ],
      ForStatement: [ "init", "test", "update", "body" ],
      FunctionDeclaration: [ "id", "params", "body" ],
      FunctionExpression: [ "id", "params", "defaults", "body" ],
      Identifier: [],
      IfStatement: [ "test", "consequent", "alternate" ],
      LabeledStatement: [ "label", "body" ],
      Literal: [],
      LogicalExpression: [ "left", "right" ],
      MemberExpression: [ "object", "property" ],
      NewExpression: [ "callee", "arguments" ],
      ObjectExpression: [ "properties" ],
      Program: [ "body" ],
      Property: [ "key", "value" ],
      ReturnStatement: [ "argument" ],
      SequenceExpression: [ "expressions" ],
      SwitchCase: [ "test", "consequent" ],
      SwitchStatement: [ "discriminant", "cases" ],
      ThisExpression: [],
      ThrowStatement: [ "argument" ],
      TryStatement: [ "block", "handlers", "finalizer" ],
      UnaryExpression: [ "argument" ],
      UpdateExpression: [ "argument" ],
      VariableDeclaration: [ "declarations" ],
      VariableDeclarator: [ "id", "init" ],
      WhileStatement: [ "test", "body" ],
      WithStatement: [ "object", "body" ]
    };
    function parse(code) {
      function postProcessing(node) {
        var branches = NODE_BRANCHES[node.type];
        for (var i = 0, key; key = branches[i]; i++) {
          var value = node[key];
          if (typeof value == "object" && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(function(child) {
                postProcessing(child);
                child.root = result;
                child.parentNode = node;
                child.parentCollection = value;
              });
            } else {
              postProcessing(value);
              value.root = result;
              value.parentNode = node;
            }
          }
        }
      }
      var result = esprima.parse(code, {
        loc: true,
        range: true,
        comment: true,
        tokens: true
      });
      postProcessing(result);
      result.source = code;
      result.root = result;
      return result;
    }
    function traverseAst(node, visitor) {
      var res = visitor.call(null, node);
      if (res) return res == TRAVERSE_ABORT ? res : false;
      var branches = NODE_BRANCHES[node.type];
      for (var i = 0, key; key = branches[i]; i++) {
        var value = node[key];
        if (typeof value == "object" && value !== null) {
          if (Array.isArray(value)) {
            for (var j = 0, child; child = value[j]; j++) if (traverseAst(child, visitor) & TRAVERSE_ABORT) return TRAVERSE_ABORT;
          } else {
            if (traverseAst(value, visitor) & TRAVERSE_ABORT) return TRAVERSE_ABORT;
          }
        }
      }
    }
    function getRangeTokens(ast, start, end) {
      var first;
      for (var i = 0, pre, prev, token; i < ast.tokens.length; i++) {
        token = ast.tokens[i];
        if (token.range[0] < start) continue;
        if (token.range[1] > end) {
          token = prev;
          break;
        }
        if (!first) first = token;
        prev = token;
      }
      return [ first, token ];
    }
    function getNodeRangeTokens(node) {
      return getRangeTokens(node.root, node.range[0], node.range[1]);
    }
    function translateAst(ast, start, end) {
      var source = ast.source;
      var buffer = [];
      for (var i = 0, pre, prev, token; i < ast.tokens.length; i++) {
        token = ast.tokens[i];
        if (token.range[0] < start) continue;
        if (token.range[1] > end) {
          token = prev;
          break;
        }
        pre = source.substring(prev ? prev.range[1] : start, token.range[0]);
        if (pre) buffer.push(pre);
        buffer.push(token.value);
        prev = token;
      }
      buffer.push(source.substring(token ? token.range[1] : start, end));
      return buffer.join("");
    }
    function translateNode(node) {
      return translateAst(node.root, node.range[0], node.range[1]);
    }
    module.exports = {
      TRAVERSE_ABORT: TRAVERSE_ABORT,
      TRAVERSE_STOP_DEEP: TRAVERSE_STOP_DEEP,
      parse: parse,
      traverseAst: traverseAst,
      translateAst: translateAst,
      translateNode: translateNode,
      getRangeTokens: getRangeTokens,
      getNodeRangeTokens: getNodeRangeTokens
    };
  },
  "l.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    (function(root, factory) {
      "use strict";
      if (typeof define === "function" && define.amd) {
        define([ "exports" ], factory);
      } else if (typeof exports !== "undefined") {
        factory(exports);
      } else {
        factory(root.esprima = {});
      }
    })(this, function(exports) {
      "use strict";
      var Token, TokenName, Syntax, PropertyKind, Messages, Regex, source, strict, index, lineNumber, lineStart, length, buffer, state, extra;
      Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8
      };
      TokenName = {};
      TokenName[Token.BooleanLiteral] = "Boolean";
      TokenName[Token.EOF] = "<end>";
      TokenName[Token.Identifier] = "Identifier";
      TokenName[Token.Keyword] = "Keyword";
      TokenName[Token.NullLiteral] = "Null";
      TokenName[Token.NumericLiteral] = "Numeric";
      TokenName[Token.Punctuator] = "Punctuator";
      TokenName[Token.StringLiteral] = "String";
      Syntax = {
        AssignmentExpression: "AssignmentExpression",
        ArrayExpression: "ArrayExpression",
        BlockStatement: "BlockStatement",
        BinaryExpression: "BinaryExpression",
        BreakStatement: "BreakStatement",
        CallExpression: "CallExpression",
        CatchClause: "CatchClause",
        ConditionalExpression: "ConditionalExpression",
        ContinueStatement: "ContinueStatement",
        DoWhileStatement: "DoWhileStatement",
        DebuggerStatement: "DebuggerStatement",
        EmptyStatement: "EmptyStatement",
        ExpressionStatement: "ExpressionStatement",
        ForStatement: "ForStatement",
        ForInStatement: "ForInStatement",
        FunctionDeclaration: "FunctionDeclaration",
        FunctionExpression: "FunctionExpression",
        Identifier: "Identifier",
        IfStatement: "IfStatement",
        Literal: "Literal",
        LabeledStatement: "LabeledStatement",
        LogicalExpression: "LogicalExpression",
        MemberExpression: "MemberExpression",
        NewExpression: "NewExpression",
        ObjectExpression: "ObjectExpression",
        Program: "Program",
        Property: "Property",
        ReturnStatement: "ReturnStatement",
        SequenceExpression: "SequenceExpression",
        SwitchStatement: "SwitchStatement",
        SwitchCase: "SwitchCase",
        ThisExpression: "ThisExpression",
        ThrowStatement: "ThrowStatement",
        TryStatement: "TryStatement",
        UnaryExpression: "UnaryExpression",
        UpdateExpression: "UpdateExpression",
        VariableDeclaration: "VariableDeclaration",
        VariableDeclarator: "VariableDeclarator",
        WhileStatement: "WhileStatement",
        WithStatement: "WithStatement"
      };
      PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
      };
      Messages = {
        UnexpectedToken: "Unexpected token %0",
        UnexpectedNumber: "Unexpected number",
        UnexpectedString: "Unexpected string",
        UnexpectedIdentifier: "Unexpected identifier",
        UnexpectedReserved: "Unexpected reserved word",
        UnexpectedEOS: "Unexpected end of input",
        NewlineAfterThrow: "Illegal newline after throw",
        InvalidRegExp: "Invalid regular expression",
        UnterminatedRegExp: "Invalid regular expression: missing /",
        InvalidLHSInAssignment: "Invalid left-hand side in assignment",
        InvalidLHSInForIn: "Invalid left-hand side in for-in",
        MultipleDefaultsInSwitch: "More than one default clause in switch statement",
        NoCatchOrFinally: "Missing catch or finally after try",
        UnknownLabel: "Undefined label '%0'",
        Redeclaration: "%0 '%1' has already been declared",
        IllegalContinue: "Illegal continue statement",
        IllegalBreak: "Illegal break statement",
        IllegalReturn: "Illegal return statement",
        StrictModeWith: "Strict mode code may not include a with statement",
        StrictCatchVariable: "Catch variable may not be eval or arguments in strict mode",
        StrictVarName: "Variable name may not be eval or arguments in strict mode",
        StrictParamName: "Parameter name eval or arguments is not allowed in strict mode",
        StrictParamDupe: "Strict mode function may not have duplicate parameter names",
        StrictFunctionName: "Function name may not be eval or arguments in strict mode",
        StrictOctalLiteral: "Octal literals are not allowed in strict mode.",
        StrictDelete: "Delete of an unqualified identifier in strict mode.",
        StrictDuplicateProperty: "Duplicate data property in object literal not allowed in strict mode",
        AccessorDataProperty: "Object literal may not have data and accessor property with the same name",
        AccessorGetSet: "Object literal may not have multiple get/set accessors with the same name",
        StrictLHSAssignment: "Assignment to eval or arguments is not allowed in strict mode",
        StrictLHSPostfix: "Postfix increment/decrement may not have eval or arguments operand in strict mode",
        StrictLHSPrefix: "Prefix increment/decrement may not have eval or arguments operand in strict mode",
        StrictReservedWord: "Use of future reserved word in strict mode"
      };
      Regex = {
        NonAsciiIdentifierStart: new RegExp("[ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〇〡-〩〱-〵〸-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚗꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]"),
        NonAsciiIdentifierPart: new RegExp("[ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮ̀-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁ҃-҇Ҋ-ԧԱ-Ֆՙա-և֑-ׇֽֿׁׂׅׄא-תװ-ײؐ-ؚؠ-٩ٮ-ۓە-ۜ۟-۪ۨ-ۼۿܐ-݊ݍ-ޱ߀-ߵߺࠀ-࠭ࡀ-࡛ࢠࢢ-ࢬࣤ-ࣾऀ-ॣ०-९ॱ-ॷॹ-ॿঁ-ঃঅ-ঌএঐও-নপ-রলশ-হ়-ৄেৈো-ৎৗড়ঢ়য়-ৣ০-ৱਁ-ਃਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹ਼ਾ-ੂੇੈੋ-੍ੑਖ਼-ੜਫ਼੦-ੵઁ-ઃઅ-ઍએ-ઑઓ-નપ-રલળવ-હ઼-ૅે-ૉો-્ૐૠ-ૣ૦-૯ଁ-ଃଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହ଼-ୄେୈୋ-୍ୖୗଡ଼ଢ଼ୟ-ୣ୦-୯ୱஂஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹா-ூெ-ைொ-்ௐௗ௦-௯ఁ-ఃఅ-ఌఎ-ఐఒ-నప-ళవ-హఽ-ౄె-ైొ-్ౕౖౘౙౠ-ౣ౦-౯ಂಃಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹ಼-ೄೆ-ೈೊ-್ೕೖೞೠ-ೣ೦-೯ೱೲംഃഅ-ഌഎ-ഐഒ-ഺഽ-ൄെ-ൈൊ-ൎൗൠ-ൣ൦-൯ൺ-ൿංඃඅ-ඖක-නඳ-රලව-ෆ්ා-ුූෘ-ෟෲෳก-ฺเ-๎๐-๙ກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ູົ-ຽເ-ໄໆ່-ໍ໐-໙ໜ-ໟༀ༘༙༠-༩༹༵༷༾-ཇཉ-ཬཱ-྄྆-ྗྙ-ྼ࿆က-၉ၐ-ႝႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚ፝-፟ᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-᜔ᜠ-᜴ᝀ-ᝓᝠ-ᝬᝮ-ᝰᝲᝳក-៓ៗៜ៝០-៩᠋-᠍᠐-᠙ᠠ-ᡷᢀ-ᢪᢰ-ᣵᤀ-ᤜᤠ-ᤫᤰ-᤻᥆-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉ᧐-᧙ᨀ-ᨛᨠ-ᩞ᩠-᩿᩼-᪉᪐-᪙ᪧᬀ-ᭋ᭐-᭙᭫-᭳ᮀ-᯳ᰀ-᰷᱀-᱉ᱍ-ᱽ᳐-᳔᳒-ᳶᴀ-ᷦ᷼-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼ‌‍‿⁀⁔ⁱⁿₐ-ₜ⃐-⃥⃜⃡-⃰ℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯ⵿-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⷠ-ⷿⸯ々-〇〡-〯〱-〵〸-〼ぁ-ゖ゙゚ゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘫꙀ-꙯ꙴ-꙽ꙿ-ꚗꚟ-꛱ꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠧꡀ-ꡳꢀ-꣄꣐-꣙꣠-ꣷꣻ꤀-꤭ꤰ-꥓ꥠ-ꥼꦀ-꧀ꧏ-꧙ꨀ-ꨶꩀ-ꩍ꩐-꩙ꩠ-ꩶꩺꩻꪀ-ꫂꫛ-ꫝꫠ-ꫯꫲ-꫶ꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯪ꯬꯭꯰-꯹가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻ︀-️︠-︦︳︴﹍-﹏ﹰ-ﹴﹶ-ﻼ０-９Ａ-Ｚ＿ａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]")
      };
      function assert(condition, message) {
        if (!condition) {
          throw new Error("ASSERT: " + message);
        }
      }
      function sliceSource(from, to) {
        return source.slice(from, to);
      }
      if (typeof "esprima"[0] === "undefined") {
        sliceSource = function sliceArraySource(from, to) {
          return source.slice(from, to).join("");
        };
      }
      function isDecimalDigit(ch) {
        return "0123456789".indexOf(ch) >= 0;
      }
      function isHexDigit(ch) {
        return "0123456789abcdefABCDEF".indexOf(ch) >= 0;
      }
      function isOctalDigit(ch) {
        return "01234567".indexOf(ch) >= 0;
      }
      function isWhiteSpace(ch) {
        return ch === " " || ch === "	" || ch === "" || ch === "\f" || ch === " " || ch.charCodeAt(0) >= 5760 && " ᠎             　﻿".indexOf(ch) >= 0;
      }
      function isLineTerminator(ch) {
        return ch === "\n" || ch === "\r" || ch === "\u2028" || ch === "\u2029";
      }
      function isIdentifierStart(ch) {
        return ch === "$" || ch === "_" || ch === "\\" || ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch.charCodeAt(0) >= 128 && Regex.NonAsciiIdentifierStart.test(ch);
      }
      function isIdentifierPart(ch) {
        return ch === "$" || ch === "_" || ch === "\\" || ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch.charCodeAt(0) >= 128 && Regex.NonAsciiIdentifierPart.test(ch);
      }
      function isFutureReservedWord(id) {
        switch (id) {
          case "class":
          case "enum":
          case "export":
          case "extends":
          case "import":
          case "super":
            return true;
        }
        return false;
      }
      function isStrictModeReservedWord(id) {
        switch (id) {
          case "implements":
          case "interface":
          case "package":
          case "private":
          case "protected":
          case "public":
          case "static":
          case "yield":
          case "let":
            return true;
        }
        return false;
      }
      function isRestrictedWord(id) {
        return id === "eval" || id === "arguments";
      }
      function isKeyword(id) {
        var keyword = false;
        switch (id.length) {
          case 2:
            keyword = id === "if" || id === "in" || id === "do";
            break;
          case 3:
            keyword = id === "var" || id === "for" || id === "new" || id === "try";
            break;
          case 4:
            keyword = id === "this" || id === "else" || id === "case" || id === "void" || id === "with";
            break;
          case 5:
            keyword = id === "while" || id === "break" || id === "catch" || id === "throw";
            break;
          case 6:
            keyword = id === "return" || id === "typeof" || id === "delete" || id === "switch";
            break;
          case 7:
            keyword = id === "default" || id === "finally";
            break;
          case 8:
            keyword = id === "function" || id === "continue" || id === "debugger";
            break;
          case 10:
            keyword = id === "instanceof";
            break;
        }
        if (keyword) {
          return true;
        }
        switch (id) {
          case "const":
            return true;
          case "yield":
          case "let":
            return true;
        }
        if (strict && isStrictModeReservedWord(id)) {
          return true;
        }
        return isFutureReservedWord(id);
      }
      function skipComment() {
        var ch, blockComment, lineComment;
        blockComment = false;
        lineComment = false;
        while (index < length) {
          ch = source[index];
          if (lineComment) {
            ch = source[index++];
            if (isLineTerminator(ch)) {
              lineComment = false;
              if (ch === "\r" && source[index] === "\n") {
                ++index;
              }
              ++lineNumber;
              lineStart = index;
            }
          } else if (blockComment) {
            if (isLineTerminator(ch)) {
              if (ch === "\r" && source[index + 1] === "\n") {
                ++index;
              }
              ++lineNumber;
              ++index;
              lineStart = index;
              if (index >= length) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
              }
            } else {
              ch = source[index++];
              if (index >= length) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
              }
              if (ch === "*") {
                ch = source[index];
                if (ch === "/") {
                  ++index;
                  blockComment = false;
                }
              }
            }
          } else if (ch === "/") {
            ch = source[index + 1];
            if (ch === "/") {
              index += 2;
              lineComment = true;
            } else if (ch === "*") {
              index += 2;
              blockComment = true;
              if (index >= length) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
              }
            } else {
              break;
            }
          } else if (isWhiteSpace(ch)) {
            ++index;
          } else if (isLineTerminator(ch)) {
            ++index;
            if (ch === "\r" && source[index] === "\n") {
              ++index;
            }
            ++lineNumber;
            lineStart = index;
          } else {
            break;
          }
        }
      }
      function scanHexEscape(prefix) {
        var i, len, ch, code = 0;
        len = prefix === "u" ? 4 : 2;
        for (i = 0; i < len; ++i) {
          if (index < length && isHexDigit(source[index])) {
            ch = source[index++];
            code = code * 16 + "0123456789abcdef".indexOf(ch.toLowerCase());
          } else {
            return "";
          }
        }
        return String.fromCharCode(code);
      }
      function scanIdentifier() {
        var ch, start, id, restore;
        ch = source[index];
        if (!isIdentifierStart(ch)) {
          return;
        }
        start = index;
        if (ch === "\\") {
          ++index;
          if (source[index] !== "u") {
            return;
          }
          ++index;
          restore = index;
          ch = scanHexEscape("u");
          if (ch) {
            if (ch === "\\" || !isIdentifierStart(ch)) {
              return;
            }
            id = ch;
          } else {
            index = restore;
            id = "u";
          }
        } else {
          id = source[index++];
        }
        while (index < length) {
          ch = source[index];
          if (!isIdentifierPart(ch)) {
            break;
          }
          if (ch === "\\") {
            ++index;
            if (source[index] !== "u") {
              return;
            }
            ++index;
            restore = index;
            ch = scanHexEscape("u");
            if (ch) {
              if (ch === "\\" || !isIdentifierPart(ch)) {
                return;
              }
              id += ch;
            } else {
              index = restore;
              id += "u";
            }
          } else {
            id += source[index++];
          }
        }
        if (id.length === 1) {
          return {
            type: Token.Identifier,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (isKeyword(id)) {
          return {
            type: Token.Keyword,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (id === "null") {
          return {
            type: Token.NullLiteral,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (id === "true" || id === "false") {
          return {
            type: Token.BooleanLiteral,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        return {
          type: Token.Identifier,
          value: id,
          lineNumber: lineNumber,
          lineStart: lineStart,
          range: [ start, index ]
        };
      }
      function scanPunctuator() {
        var start = index, ch1 = source[index], ch2, ch3, ch4;
        if (ch1 === ";" || ch1 === "{" || ch1 === "}") {
          ++index;
          return {
            type: Token.Punctuator,
            value: ch1,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (ch1 === "," || ch1 === "(" || ch1 === ")") {
          ++index;
          return {
            type: Token.Punctuator,
            value: ch1,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        ch2 = source[index + 1];
        if (ch1 === "." && !isDecimalDigit(ch2)) {
          return {
            type: Token.Punctuator,
            value: source[index++],
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        ch3 = source[index + 2];
        ch4 = source[index + 3];
        if (ch1 === ">" && ch2 === ">" && ch3 === ">") {
          if (ch4 === "=") {
            index += 4;
            return {
              type: Token.Punctuator,
              value: ">>>=",
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [ start, index ]
            };
          }
        }
        if (ch1 === "=" && ch2 === "=" && ch3 === "=") {
          index += 3;
          return {
            type: Token.Punctuator,
            value: "===",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (ch1 === "!" && ch2 === "=" && ch3 === "=") {
          index += 3;
          return {
            type: Token.Punctuator,
            value: "!==",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (ch1 === ">" && ch2 === ">" && ch3 === ">") {
          index += 3;
          return {
            type: Token.Punctuator,
            value: ">>>",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (ch1 === "<" && ch2 === "<" && ch3 === "=") {
          index += 3;
          return {
            type: Token.Punctuator,
            value: "<<=",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (ch1 === ">" && ch2 === ">" && ch3 === "=") {
          index += 3;
          return {
            type: Token.Punctuator,
            value: ">>=",
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
        if (ch2 === "=") {
          if ("<>=!+-*%&|^/".indexOf(ch1) >= 0) {
            index += 2;
            return {
              type: Token.Punctuator,
              value: ch1 + ch2,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [ start, index ]
            };
          }
        }
        if (ch1 === ch2 && "+-<>&|".indexOf(ch1) >= 0) {
          if ("+-<>&|".indexOf(ch2) >= 0) {
            index += 2;
            return {
              type: Token.Punctuator,
              value: ch1 + ch2,
              lineNumber: lineNumber,
              lineStart: lineStart,
              range: [ start, index ]
            };
          }
        }
        if ("[]<>+-*%&|^!~?:=/".indexOf(ch1) >= 0) {
          return {
            type: Token.Punctuator,
            value: source[index++],
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ start, index ]
          };
        }
      }
      function scanNumericLiteral() {
        var number, start, ch;
        ch = source[index];
        assert(isDecimalDigit(ch) || ch === ".", "Numeric literal must start with a decimal digit or a decimal point");
        start = index;
        number = "";
        if (ch !== ".") {
          number = source[index++];
          ch = source[index];
          if (number === "0") {
            if (ch === "x" || ch === "X") {
              number += source[index++];
              while (index < length) {
                ch = source[index];
                if (!isHexDigit(ch)) {
                  break;
                }
                number += source[index++];
              }
              if (number.length <= 2) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
              }
              if (index < length) {
                ch = source[index];
                if (isIdentifierStart(ch)) {
                  throwError({}, Messages.UnexpectedToken, "ILLEGAL");
                }
              }
              return {
                type: Token.NumericLiteral,
                value: parseInt(number, 16),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [ start, index ]
              };
            } else if (isOctalDigit(ch)) {
              number += source[index++];
              while (index < length) {
                ch = source[index];
                if (!isOctalDigit(ch)) {
                  break;
                }
                number += source[index++];
              }
              if (index < length) {
                ch = source[index];
                if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                  throwError({}, Messages.UnexpectedToken, "ILLEGAL");
                }
              }
              return {
                type: Token.NumericLiteral,
                value: parseInt(number, 8),
                octal: true,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [ start, index ]
              };
            }
            if (isDecimalDigit(ch)) {
              throwError({}, Messages.UnexpectedToken, "ILLEGAL");
            }
          }
          while (index < length) {
            ch = source[index];
            if (!isDecimalDigit(ch)) {
              break;
            }
            number += source[index++];
          }
        }
        if (ch === ".") {
          number += source[index++];
          while (index < length) {
            ch = source[index];
            if (!isDecimalDigit(ch)) {
              break;
            }
            number += source[index++];
          }
        }
        if (ch === "e" || ch === "E") {
          number += source[index++];
          ch = source[index];
          if (ch === "+" || ch === "-") {
            number += source[index++];
          }
          ch = source[index];
          if (isDecimalDigit(ch)) {
            number += source[index++];
            while (index < length) {
              ch = source[index];
              if (!isDecimalDigit(ch)) {
                break;
              }
              number += source[index++];
            }
          } else {
            ch = "character " + ch;
            if (index >= length) {
              ch = "<end>";
            }
            throwError({}, Messages.UnexpectedToken, "ILLEGAL");
          }
        }
        if (index < length) {
          ch = source[index];
          if (isIdentifierStart(ch)) {
            throwError({}, Messages.UnexpectedToken, "ILLEGAL");
          }
        }
        return {
          type: Token.NumericLiteral,
          value: parseFloat(number),
          lineNumber: lineNumber,
          lineStart: lineStart,
          range: [ start, index ]
        };
      }
      function scanStringLiteral() {
        var str = "", quote, start, ch, code, unescaped, restore, octal = false;
        quote = source[index];
        assert(quote === "'" || quote === '"', "String literal must starts with a quote");
        start = index;
        ++index;
        while (index < length) {
          ch = source[index++];
          if (ch === quote) {
            quote = "";
            break;
          } else if (ch === "\\") {
            ch = source[index++];
            if (!isLineTerminator(ch)) {
              switch (ch) {
                case "n":
                  str += "\n";
                  break;
                case "r":
                  str += "\r";
                  break;
                case "t":
                  str += "	";
                  break;
                case "u":
                case "x":
                  restore = index;
                  unescaped = scanHexEscape(ch);
                  if (unescaped) {
                    str += unescaped;
                  } else {
                    index = restore;
                    str += ch;
                  }
                  break;
                case "b":
                  str += "\b";
                  break;
                case "f":
                  str += "\f";
                  break;
                case "v":
                  str += "";
                  break;
                default:
                  if (isOctalDigit(ch)) {
                    code = "01234567".indexOf(ch);
                    if (code !== 0) {
                      octal = true;
                    }
                    if (index < length && isOctalDigit(source[index])) {
                      octal = true;
                      code = code * 8 + "01234567".indexOf(source[index++]);
                      if ("0123".indexOf(ch) >= 0 && index < length && isOctalDigit(source[index])) {
                        code = code * 8 + "01234567".indexOf(source[index++]);
                      }
                    }
                    str += String.fromCharCode(code);
                  } else {
                    str += ch;
                  }
                  break;
              }
            } else {
              ++lineNumber;
              if (ch === "\r" && source[index] === "\n") {
                ++index;
              }
            }
          } else if (isLineTerminator(ch)) {
            break;
          } else {
            str += ch;
          }
        }
        if (quote !== "") {
          throwError({}, Messages.UnexpectedToken, "ILLEGAL");
        }
        return {
          type: Token.StringLiteral,
          value: str,
          octal: octal,
          lineNumber: lineNumber,
          lineStart: lineStart,
          range: [ start, index ]
        };
      }
      function scanRegExp() {
        var str, ch, start, pattern, flags, value, classMarker = false, restore, terminated = false;
        buffer = null;
        skipComment();
        start = index;
        ch = source[index];
        assert(ch === "/", "Regular expression literal must start with a slash");
        str = source[index++];
        while (index < length) {
          ch = source[index++];
          str += ch;
          if (ch === "\\") {
            ch = source[index++];
            if (isLineTerminator(ch)) {
              throwError({}, Messages.UnterminatedRegExp);
            }
            str += ch;
          } else if (classMarker) {
            if (ch === "]") {
              classMarker = false;
            }
          } else {
            if (ch === "/") {
              terminated = true;
              break;
            } else if (ch === "[") {
              classMarker = true;
            } else if (isLineTerminator(ch)) {
              throwError({}, Messages.UnterminatedRegExp);
            }
          }
        }
        if (!terminated) {
          throwError({}, Messages.UnterminatedRegExp);
        }
        pattern = str.substr(1, str.length - 2);
        flags = "";
        while (index < length) {
          ch = source[index];
          if (!isIdentifierPart(ch)) {
            break;
          }
          ++index;
          if (ch === "\\" && index < length) {
            ch = source[index];
            if (ch === "u") {
              ++index;
              restore = index;
              ch = scanHexEscape("u");
              if (ch) {
                flags += ch;
                str += "\\u";
                for (; restore < index; ++restore) {
                  str += source[restore];
                }
              } else {
                index = restore;
                flags += "u";
                str += "\\u";
              }
            } else {
              str += "\\";
            }
          } else {
            flags += ch;
            str += ch;
          }
        }
        try {
          value = new RegExp(pattern, flags);
        } catch (e) {
          throwError({}, Messages.InvalidRegExp);
        }
        return {
          literal: str,
          value: value,
          range: [ start, index ]
        };
      }
      function isIdentifierName(token) {
        return token.type === Token.Identifier || token.type === Token.Keyword || token.type === Token.BooleanLiteral || token.type === Token.NullLiteral;
      }
      function advance() {
        var ch, token;
        skipComment();
        if (index >= length) {
          return {
            type: Token.EOF,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [ index, index ]
          };
        }
        token = scanPunctuator();
        if (typeof token !== "undefined") {
          return token;
        }
        ch = source[index];
        if (ch === "'" || ch === '"') {
          return scanStringLiteral();
        }
        if (ch === "." || isDecimalDigit(ch)) {
          return scanNumericLiteral();
        }
        token = scanIdentifier();
        if (typeof token !== "undefined") {
          return token;
        }
        throwError({}, Messages.UnexpectedToken, "ILLEGAL");
      }
      function lex() {
        var token;
        if (buffer) {
          index = buffer.range[1];
          lineNumber = buffer.lineNumber;
          lineStart = buffer.lineStart;
          token = buffer;
          buffer = null;
          return token;
        }
        buffer = null;
        return advance();
      }
      function lookahead() {
        var pos, line, start;
        if (buffer !== null) {
          return buffer;
        }
        pos = index;
        line = lineNumber;
        start = lineStart;
        buffer = advance();
        index = pos;
        lineNumber = line;
        lineStart = start;
        return buffer;
      }
      function peekLineTerminator() {
        var pos, line, start, found;
        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;
        return found;
      }
      function throwError(token, messageFormat) {
        var error, args = Array.prototype.slice.call(arguments, 2), msg = messageFormat.replace(/%(\d)/g, function(whole, index) {
          return args[index] || "";
        });
        if (typeof token.lineNumber === "number") {
          error = new Error("Line " + token.lineNumber + ": " + msg);
          error.index = token.range[0];
          error.lineNumber = token.lineNumber;
          error.column = token.range[0] - lineStart + 1;
        } else {
          error = new Error("Line " + lineNumber + ": " + msg);
          error.index = index;
          error.lineNumber = lineNumber;
          error.column = index - lineStart + 1;
        }
        throw error;
      }
      function throwErrorTolerant() {
        try {
          throwError.apply(null, arguments);
        } catch (e) {
          if (extra.errors) {
            extra.errors.push(e);
          } else {
            throw e;
          }
        }
      }
      function throwUnexpected(token) {
        if (token.type === Token.EOF) {
          throwError(token, Messages.UnexpectedEOS);
        }
        if (token.type === Token.NumericLiteral) {
          throwError(token, Messages.UnexpectedNumber);
        }
        if (token.type === Token.StringLiteral) {
          throwError(token, Messages.UnexpectedString);
        }
        if (token.type === Token.Identifier) {
          throwError(token, Messages.UnexpectedIdentifier);
        }
        if (token.type === Token.Keyword) {
          if (isFutureReservedWord(token.value)) {
            throwError(token, Messages.UnexpectedReserved);
          } else if (strict && isStrictModeReservedWord(token.value)) {
            throwErrorTolerant(token, Messages.StrictReservedWord);
            return;
          }
          throwError(token, Messages.UnexpectedToken, token.value);
        }
        throwError(token, Messages.UnexpectedToken, token.value);
      }
      function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
          throwUnexpected(token);
        }
      }
      function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
          throwUnexpected(token);
        }
      }
      function match(value) {
        var token = lookahead();
        return token.type === Token.Punctuator && token.value === value;
      }
      function matchKeyword(keyword) {
        var token = lookahead();
        return token.type === Token.Keyword && token.value === keyword;
      }
      function matchAssign() {
        var token = lookahead(), op = token.value;
        if (token.type !== Token.Punctuator) {
          return false;
        }
        return op === "=" || op === "*=" || op === "/=" || op === "%=" || op === "+=" || op === "-=" || op === "<<=" || op === ">>=" || op === ">>>=" || op === "&=" || op === "^=" || op === "|=";
      }
      function consumeSemicolon() {
        var token, line;
        if (source[index] === ";") {
          lex();
          return;
        }
        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
          return;
        }
        if (match(";")) {
          lex();
          return;
        }
        token = lookahead();
        if (token.type !== Token.EOF && !match("}")) {
          throwUnexpected(token);
        }
      }
      function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
      }
      function parseArrayInitialiser() {
        var elements = [];
        expect("[");
        while (!match("]")) {
          if (match(",")) {
            lex();
            elements.push(null);
          } else {
            elements.push(parseAssignmentExpression());
            if (!match("]")) {
              expect(",");
            }
          }
        }
        expect("]");
        return {
          type: Syntax.ArrayExpression,
          elements: elements
        };
      }
      function parsePropertyFunction(param, first) {
        var previousStrict, body;
        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (first && strict && isRestrictedWord(param[0].name)) {
          throwErrorTolerant(first, Messages.StrictParamName);
        }
        strict = previousStrict;
        return {
          type: Syntax.FunctionExpression,
          id: null,
          params: param,
          defaults: [],
          body: body,
          rest: null,
          generator: false,
          expression: false
        };
      }
      function parseObjectPropertyKey() {
        var token = lex();
        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
          if (strict && token.octal) {
            throwErrorTolerant(token, Messages.StrictOctalLiteral);
          }
          return createLiteral(token);
        }
        return {
          type: Syntax.Identifier,
          name: token.value
        };
      }
      function parseObjectProperty() {
        var token, key, id, param;
        token = lookahead();
        if (token.type === Token.Identifier) {
          id = parseObjectPropertyKey();
          if (token.value === "get" && !match(":")) {
            key = parseObjectPropertyKey();
            expect("(");
            expect(")");
            return {
              type: Syntax.Property,
              key: key,
              value: parsePropertyFunction([]),
              kind: "get"
            };
          } else if (token.value === "set" && !match(":")) {
            key = parseObjectPropertyKey();
            expect("(");
            token = lookahead();
            if (token.type !== Token.Identifier) {
              expect(")");
              throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
              return {
                type: Syntax.Property,
                key: key,
                value: parsePropertyFunction([]),
                kind: "set"
              };
            } else {
              param = [ parseVariableIdentifier() ];
              expect(")");
              return {
                type: Syntax.Property,
                key: key,
                value: parsePropertyFunction(param, token),
                kind: "set"
              };
            }
          } else {
            expect(":");
            return {
              type: Syntax.Property,
              key: id,
              value: parseAssignmentExpression(),
              kind: "init"
            };
          }
        } else if (token.type === Token.EOF || token.type === Token.Punctuator) {
          throwUnexpected(token);
        } else {
          key = parseObjectPropertyKey();
          expect(":");
          return {
            type: Syntax.Property,
            key: key,
            value: parseAssignmentExpression(),
            kind: "init"
          };
        }
      }
      function parseObjectInitialiser() {
        var properties = [], property, name, kind, map = {}, toString = String;
        expect("{");
        while (!match("}")) {
          property = parseObjectProperty();
          if (property.key.type === Syntax.Identifier) {
            name = property.key.name;
          } else {
            name = toString(property.key.value);
          }
          kind = property.kind === "init" ? PropertyKind.Data : property.kind === "get" ? PropertyKind.Get : PropertyKind.Set;
          if (Object.prototype.hasOwnProperty.call(map, name)) {
            if (map[name] === PropertyKind.Data) {
              if (strict && kind === PropertyKind.Data) {
                throwErrorTolerant({}, Messages.StrictDuplicateProperty);
              } else if (kind !== PropertyKind.Data) {
                throwErrorTolerant({}, Messages.AccessorDataProperty);
              }
            } else {
              if (kind === PropertyKind.Data) {
                throwErrorTolerant({}, Messages.AccessorDataProperty);
              } else if (map[name] & kind) {
                throwErrorTolerant({}, Messages.AccessorGetSet);
              }
            }
            map[name] |= kind;
          } else {
            map[name] = kind;
          }
          properties.push(property);
          if (!match("}")) {
            expect(",");
          }
        }
        expect("}");
        return {
          type: Syntax.ObjectExpression,
          properties: properties
        };
      }
      function parseGroupExpression() {
        var expr;
        expect("(");
        expr = parseExpression();
        expect(")");
        return expr;
      }
      function parsePrimaryExpression() {
        var token = lookahead(), type = token.type;
        if (type === Token.Identifier) {
          return {
            type: Syntax.Identifier,
            name: lex().value
          };
        }
        if (type === Token.StringLiteral || type === Token.NumericLiteral) {
          if (strict && token.octal) {
            throwErrorTolerant(token, Messages.StrictOctalLiteral);
          }
          return createLiteral(lex());
        }
        if (type === Token.Keyword) {
          if (matchKeyword("this")) {
            lex();
            return {
              type: Syntax.ThisExpression
            };
          }
          if (matchKeyword("function")) {
            return parseFunctionExpression();
          }
        }
        if (type === Token.BooleanLiteral) {
          lex();
          token.value = token.value === "true";
          return createLiteral(token);
        }
        if (type === Token.NullLiteral) {
          lex();
          token.value = null;
          return createLiteral(token);
        }
        if (match("[")) {
          return parseArrayInitialiser();
        }
        if (match("{")) {
          return parseObjectInitialiser();
        }
        if (match("(")) {
          return parseGroupExpression();
        }
        if (match("/") || match("/=")) {
          return createLiteral(scanRegExp());
        }
        return throwUnexpected(lex());
      }
      function parseArguments() {
        var args = [];
        expect("(");
        if (!match(")")) {
          while (index < length) {
            args.push(parseAssignmentExpression());
            if (match(")")) {
              break;
            }
            expect(",");
          }
        }
        expect(")");
        return args;
      }
      function parseNonComputedProperty() {
        var token = lex();
        if (!isIdentifierName(token)) {
          throwUnexpected(token);
        }
        return {
          type: Syntax.Identifier,
          name: token.value
        };
      }
      function parseNonComputedMember() {
        expect(".");
        return parseNonComputedProperty();
      }
      function parseComputedMember() {
        var expr;
        expect("[");
        expr = parseExpression();
        expect("]");
        return expr;
      }
      function parseNewExpression() {
        var expr;
        expectKeyword("new");
        expr = {
          type: Syntax.NewExpression,
          callee: parseLeftHandSideExpression(),
          arguments: []
        };
        if (match("(")) {
          expr["arguments"] = parseArguments();
        }
        return expr;
      }
      function parseLeftHandSideExpressionAllowCall() {
        var expr;
        expr = matchKeyword("new") ? parseNewExpression() : parsePrimaryExpression();
        while (match(".") || match("[") || match("(")) {
          if (match("(")) {
            expr = {
              type: Syntax.CallExpression,
              callee: expr,
              arguments: parseArguments()
            };
          } else if (match("[")) {
            expr = {
              type: Syntax.MemberExpression,
              computed: true,
              object: expr,
              property: parseComputedMember()
            };
          } else {
            expr = {
              type: Syntax.MemberExpression,
              computed: false,
              object: expr,
              property: parseNonComputedMember()
            };
          }
        }
        return expr;
      }
      function parseLeftHandSideExpression() {
        var expr;
        expr = matchKeyword("new") ? parseNewExpression() : parsePrimaryExpression();
        while (match(".") || match("[")) {
          if (match("[")) {
            expr = {
              type: Syntax.MemberExpression,
              computed: true,
              object: expr,
              property: parseComputedMember()
            };
          } else {
            expr = {
              type: Syntax.MemberExpression,
              computed: false,
              object: expr,
              property: parseNonComputedMember()
            };
          }
        }
        return expr;
      }
      function parsePostfixExpression() {
        var expr = parseLeftHandSideExpressionAllowCall(), token;
        token = lookahead();
        if (token.type !== Token.Punctuator) {
          return expr;
        }
        if ((match("++") || match("--")) && !peekLineTerminator()) {
          if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
            throwErrorTolerant({}, Messages.StrictLHSPostfix);
          }
          if (!isLeftHandSide(expr)) {
            throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
          }
          expr = {
            type: Syntax.UpdateExpression,
            operator: lex().value,
            argument: expr,
            prefix: false
          };
        }
        return expr;
      }
      function parseUnaryExpression() {
        var token, expr;
        token = lookahead();
        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
          return parsePostfixExpression();
        }
        if (match("++") || match("--")) {
          token = lex();
          expr = parseUnaryExpression();
          if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
            throwErrorTolerant({}, Messages.StrictLHSPrefix);
          }
          if (!isLeftHandSide(expr)) {
            throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
          }
          expr = {
            type: Syntax.UpdateExpression,
            operator: token.value,
            argument: expr,
            prefix: true
          };
          return expr;
        }
        if (match("+") || match("-") || match("~") || match("!")) {
          expr = {
            type: Syntax.UnaryExpression,
            operator: lex().value,
            argument: parseUnaryExpression(),
            prefix: true
          };
          return expr;
        }
        if (matchKeyword("delete") || matchKeyword("void") || matchKeyword("typeof")) {
          expr = {
            type: Syntax.UnaryExpression,
            operator: lex().value,
            argument: parseUnaryExpression(),
            prefix: true
          };
          if (strict && expr.operator === "delete" && expr.argument.type === Syntax.Identifier) {
            throwErrorTolerant({}, Messages.StrictDelete);
          }
          return expr;
        }
        return parsePostfixExpression();
      }
      function parseMultiplicativeExpression() {
        var expr = parseUnaryExpression();
        while (match("*") || match("/") || match("%")) {
          expr = {
            type: Syntax.BinaryExpression,
            operator: lex().value,
            left: expr,
            right: parseUnaryExpression()
          };
        }
        return expr;
      }
      function parseAdditiveExpression() {
        var expr = parseMultiplicativeExpression();
        while (match("+") || match("-")) {
          expr = {
            type: Syntax.BinaryExpression,
            operator: lex().value,
            left: expr,
            right: parseMultiplicativeExpression()
          };
        }
        return expr;
      }
      function parseShiftExpression() {
        var expr = parseAdditiveExpression();
        while (match("<<") || match(">>") || match(">>>")) {
          expr = {
            type: Syntax.BinaryExpression,
            operator: lex().value,
            left: expr,
            right: parseAdditiveExpression()
          };
        }
        return expr;
      }
      function parseRelationalExpression() {
        var expr, previousAllowIn;
        previousAllowIn = state.allowIn;
        state.allowIn = true;
        expr = parseShiftExpression();
        while (match("<") || match(">") || match("<=") || match(">=") || previousAllowIn && matchKeyword("in") || matchKeyword("instanceof")) {
          expr = {
            type: Syntax.BinaryExpression,
            operator: lex().value,
            left: expr,
            right: parseShiftExpression()
          };
        }
        state.allowIn = previousAllowIn;
        return expr;
      }
      function parseEqualityExpression() {
        var expr = parseRelationalExpression();
        while (match("==") || match("!=") || match("===") || match("!==")) {
          expr = {
            type: Syntax.BinaryExpression,
            operator: lex().value,
            left: expr,
            right: parseRelationalExpression()
          };
        }
        return expr;
      }
      function parseBitwiseANDExpression() {
        var expr = parseEqualityExpression();
        while (match("&")) {
          lex();
          expr = {
            type: Syntax.BinaryExpression,
            operator: "&",
            left: expr,
            right: parseEqualityExpression()
          };
        }
        return expr;
      }
      function parseBitwiseXORExpression() {
        var expr = parseBitwiseANDExpression();
        while (match("^")) {
          lex();
          expr = {
            type: Syntax.BinaryExpression,
            operator: "^",
            left: expr,
            right: parseBitwiseANDExpression()
          };
        }
        return expr;
      }
      function parseBitwiseORExpression() {
        var expr = parseBitwiseXORExpression();
        while (match("|")) {
          lex();
          expr = {
            type: Syntax.BinaryExpression,
            operator: "|",
            left: expr,
            right: parseBitwiseXORExpression()
          };
        }
        return expr;
      }
      function parseLogicalANDExpression() {
        var expr = parseBitwiseORExpression();
        while (match("&&")) {
          lex();
          expr = {
            type: Syntax.LogicalExpression,
            operator: "&&",
            left: expr,
            right: parseBitwiseORExpression()
          };
        }
        return expr;
      }
      function parseLogicalORExpression() {
        var expr = parseLogicalANDExpression();
        while (match("||")) {
          lex();
          expr = {
            type: Syntax.LogicalExpression,
            operator: "||",
            left: expr,
            right: parseLogicalANDExpression()
          };
        }
        return expr;
      }
      function parseConditionalExpression() {
        var expr, previousAllowIn, consequent;
        expr = parseLogicalORExpression();
        if (match("?")) {
          lex();
          previousAllowIn = state.allowIn;
          state.allowIn = true;
          consequent = parseAssignmentExpression();
          state.allowIn = previousAllowIn;
          expect(":");
          expr = {
            type: Syntax.ConditionalExpression,
            test: expr,
            consequent: consequent,
            alternate: parseAssignmentExpression()
          };
        }
        return expr;
      }
      function parseAssignmentExpression() {
        var token, expr;
        token = lookahead();
        expr = parseConditionalExpression();
        if (matchAssign()) {
          if (!isLeftHandSide(expr)) {
            throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
          }
          if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
            throwErrorTolerant(token, Messages.StrictLHSAssignment);
          }
          expr = {
            type: Syntax.AssignmentExpression,
            operator: lex().value,
            left: expr,
            right: parseAssignmentExpression()
          };
        }
        return expr;
      }
      function parseExpression() {
        var expr = parseAssignmentExpression();
        if (match(",")) {
          expr = {
            type: Syntax.SequenceExpression,
            expressions: [ expr ]
          };
          while (index < length) {
            if (!match(",")) {
              break;
            }
            lex();
            expr.expressions.push(parseAssignmentExpression());
          }
        }
        return expr;
      }
      function parseStatementList() {
        var list = [], statement;
        while (index < length) {
          if (match("}")) {
            break;
          }
          statement = parseSourceElement();
          if (typeof statement === "undefined") {
            break;
          }
          list.push(statement);
        }
        return list;
      }
      function parseBlock() {
        var block;
        expect("{");
        block = parseStatementList();
        expect("}");
        return {
          type: Syntax.BlockStatement,
          body: block
        };
      }
      function parseVariableIdentifier() {
        var token = lex();
        if (token.type !== Token.Identifier) {
          throwUnexpected(token);
        }
        return {
          type: Syntax.Identifier,
          name: token.value
        };
      }
      function parseVariableDeclaration(kind) {
        var id = parseVariableIdentifier(), init = null;
        if (strict && isRestrictedWord(id.name)) {
          throwErrorTolerant({}, Messages.StrictVarName);
        }
        if (kind === "const") {
          expect("=");
          init = parseAssignmentExpression();
        } else if (match("=")) {
          lex();
          init = parseAssignmentExpression();
        }
        return {
          type: Syntax.VariableDeclarator,
          id: id,
          init: init
        };
      }
      function parseVariableDeclarationList(kind) {
        var list = [];
        do {
          list.push(parseVariableDeclaration(kind));
          if (!match(",")) {
            break;
          }
          lex();
        } while (index < length);
        return list;
      }
      function parseVariableStatement() {
        var declarations;
        expectKeyword("var");
        declarations = parseVariableDeclarationList();
        consumeSemicolon();
        return {
          type: Syntax.VariableDeclaration,
          declarations: declarations,
          kind: "var"
        };
      }
      function parseConstLetDeclaration(kind) {
        var declarations;
        expectKeyword(kind);
        declarations = parseVariableDeclarationList(kind);
        consumeSemicolon();
        return {
          type: Syntax.VariableDeclaration,
          declarations: declarations,
          kind: kind
        };
      }
      function parseEmptyStatement() {
        expect(";");
        return {
          type: Syntax.EmptyStatement
        };
      }
      function parseExpressionStatement() {
        var expr = parseExpression();
        consumeSemicolon();
        return {
          type: Syntax.ExpressionStatement,
          expression: expr
        };
      }
      function parseIfStatement() {
        var test, consequent, alternate;
        expectKeyword("if");
        expect("(");
        test = parseExpression();
        expect(")");
        consequent = parseStatement();
        if (matchKeyword("else")) {
          lex();
          alternate = parseStatement();
        } else {
          alternate = null;
        }
        return {
          type: Syntax.IfStatement,
          test: test,
          consequent: consequent,
          alternate: alternate
        };
      }
      function parseDoWhileStatement() {
        var body, test, oldInIteration;
        expectKeyword("do");
        oldInIteration = state.inIteration;
        state.inIteration = true;
        body = parseStatement();
        state.inIteration = oldInIteration;
        expectKeyword("while");
        expect("(");
        test = parseExpression();
        expect(")");
        if (match(";")) {
          lex();
        }
        return {
          type: Syntax.DoWhileStatement,
          body: body,
          test: test
        };
      }
      function parseWhileStatement() {
        var test, body, oldInIteration;
        expectKeyword("while");
        expect("(");
        test = parseExpression();
        expect(")");
        oldInIteration = state.inIteration;
        state.inIteration = true;
        body = parseStatement();
        state.inIteration = oldInIteration;
        return {
          type: Syntax.WhileStatement,
          test: test,
          body: body
        };
      }
      function parseForVariableDeclaration() {
        var token = lex();
        return {
          type: Syntax.VariableDeclaration,
          declarations: parseVariableDeclarationList(),
          kind: token.value
        };
      }
      function parseForStatement() {
        var init, test, update, left, right, body, oldInIteration;
        init = test = update = null;
        expectKeyword("for");
        expect("(");
        if (match(";")) {
          lex();
        } else {
          if (matchKeyword("var") || matchKeyword("let")) {
            state.allowIn = false;
            init = parseForVariableDeclaration();
            state.allowIn = true;
            if (init.declarations.length === 1 && matchKeyword("in")) {
              lex();
              left = init;
              right = parseExpression();
              init = null;
            }
          } else {
            state.allowIn = false;
            init = parseExpression();
            state.allowIn = true;
            if (matchKeyword("in")) {
              if (!isLeftHandSide(init)) {
                throwErrorTolerant({}, Messages.InvalidLHSInForIn);
              }
              lex();
              left = init;
              right = parseExpression();
              init = null;
            }
          }
          if (typeof left === "undefined") {
            expect(";");
          }
        }
        if (typeof left === "undefined") {
          if (!match(";")) {
            test = parseExpression();
          }
          expect(";");
          if (!match(")")) {
            update = parseExpression();
          }
        }
        expect(")");
        oldInIteration = state.inIteration;
        state.inIteration = true;
        body = parseStatement();
        state.inIteration = oldInIteration;
        if (typeof left === "undefined") {
          return {
            type: Syntax.ForStatement,
            init: init,
            test: test,
            update: update,
            body: body
          };
        }
        return {
          type: Syntax.ForInStatement,
          left: left,
          right: right,
          body: body,
          each: false
        };
      }
      function parseContinueStatement() {
        var token, label = null;
        expectKeyword("continue");
        if (source[index] === ";") {
          lex();
          if (!state.inIteration) {
            throwError({}, Messages.IllegalContinue);
          }
          return {
            type: Syntax.ContinueStatement,
            label: null
          };
        }
        if (peekLineTerminator()) {
          if (!state.inIteration) {
            throwError({}, Messages.IllegalContinue);
          }
          return {
            type: Syntax.ContinueStatement,
            label: null
          };
        }
        token = lookahead();
        if (token.type === Token.Identifier) {
          label = parseVariableIdentifier();
          if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
            throwError({}, Messages.UnknownLabel, label.name);
          }
        }
        consumeSemicolon();
        if (label === null && !state.inIteration) {
          throwError({}, Messages.IllegalContinue);
        }
        return {
          type: Syntax.ContinueStatement,
          label: label
        };
      }
      function parseBreakStatement() {
        var token, label = null;
        expectKeyword("break");
        if (source[index] === ";") {
          lex();
          if (!(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
          }
          return {
            type: Syntax.BreakStatement,
            label: null
          };
        }
        if (peekLineTerminator()) {
          if (!(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
          }
          return {
            type: Syntax.BreakStatement,
            label: null
          };
        }
        token = lookahead();
        if (token.type === Token.Identifier) {
          label = parseVariableIdentifier();
          if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
            throwError({}, Messages.UnknownLabel, label.name);
          }
        }
        consumeSemicolon();
        if (label === null && !(state.inIteration || state.inSwitch)) {
          throwError({}, Messages.IllegalBreak);
        }
        return {
          type: Syntax.BreakStatement,
          label: label
        };
      }
      function parseReturnStatement() {
        var token, argument = null;
        expectKeyword("return");
        if (!state.inFunctionBody) {
          throwErrorTolerant({}, Messages.IllegalReturn);
        }
        if (source[index] === " ") {
          if (isIdentifierStart(source[index + 1])) {
            argument = parseExpression();
            consumeSemicolon();
            return {
              type: Syntax.ReturnStatement,
              argument: argument
            };
          }
        }
        if (peekLineTerminator()) {
          return {
            type: Syntax.ReturnStatement,
            argument: null
          };
        }
        if (!match(";")) {
          token = lookahead();
          if (!match("}") && token.type !== Token.EOF) {
            argument = parseExpression();
          }
        }
        consumeSemicolon();
        return {
          type: Syntax.ReturnStatement,
          argument: argument
        };
      }
      function parseWithStatement() {
        var object, body;
        if (strict) {
          throwErrorTolerant({}, Messages.StrictModeWith);
        }
        expectKeyword("with");
        expect("(");
        object = parseExpression();
        expect(")");
        body = parseStatement();
        return {
          type: Syntax.WithStatement,
          object: object,
          body: body
        };
      }
      function parseSwitchCase() {
        var test, consequent = [], statement;
        if (matchKeyword("default")) {
          lex();
          test = null;
        } else {
          expectKeyword("case");
          test = parseExpression();
        }
        expect(":");
        while (index < length) {
          if (match("}") || matchKeyword("default") || matchKeyword("case")) {
            break;
          }
          statement = parseStatement();
          if (typeof statement === "undefined") {
            break;
          }
          consequent.push(statement);
        }
        return {
          type: Syntax.SwitchCase,
          test: test,
          consequent: consequent
        };
      }
      function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound;
        expectKeyword("switch");
        expect("(");
        discriminant = parseExpression();
        expect(")");
        expect("{");
        cases = [];
        if (match("}")) {
          lex();
          return {
            type: Syntax.SwitchStatement,
            discriminant: discriminant,
            cases: cases
          };
        }
        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;
        while (index < length) {
          if (match("}")) {
            break;
          }
          clause = parseSwitchCase();
          if (clause.test === null) {
            if (defaultFound) {
              throwError({}, Messages.MultipleDefaultsInSwitch);
            }
            defaultFound = true;
          }
          cases.push(clause);
        }
        state.inSwitch = oldInSwitch;
        expect("}");
        return {
          type: Syntax.SwitchStatement,
          discriminant: discriminant,
          cases: cases
        };
      }
      function parseThrowStatement() {
        var argument;
        expectKeyword("throw");
        if (peekLineTerminator()) {
          throwError({}, Messages.NewlineAfterThrow);
        }
        argument = parseExpression();
        consumeSemicolon();
        return {
          type: Syntax.ThrowStatement,
          argument: argument
        };
      }
      function parseCatchClause() {
        var param;
        expectKeyword("catch");
        expect("(");
        if (match(")")) {
          throwUnexpected(lookahead());
        }
        param = parseVariableIdentifier();
        if (strict && isRestrictedWord(param.name)) {
          throwErrorTolerant({}, Messages.StrictCatchVariable);
        }
        expect(")");
        return {
          type: Syntax.CatchClause,
          param: param,
          body: parseBlock()
        };
      }
      function parseTryStatement() {
        var block, handlers = [], finalizer = null;
        expectKeyword("try");
        block = parseBlock();
        if (matchKeyword("catch")) {
          handlers.push(parseCatchClause());
        }
        if (matchKeyword("finally")) {
          lex();
          finalizer = parseBlock();
        }
        if (handlers.length === 0 && !finalizer) {
          throwError({}, Messages.NoCatchOrFinally);
        }
        return {
          type: Syntax.TryStatement,
          block: block,
          guardedHandlers: [],
          handlers: handlers,
          finalizer: finalizer
        };
      }
      function parseDebuggerStatement() {
        expectKeyword("debugger");
        consumeSemicolon();
        return {
          type: Syntax.DebuggerStatement
        };
      }
      function parseStatement() {
        var token = lookahead(), expr, labeledBody;
        if (token.type === Token.EOF) {
          throwUnexpected(token);
        }
        if (token.type === Token.Punctuator) {
          switch (token.value) {
            case ";":
              return parseEmptyStatement();
            case "{":
              return parseBlock();
            case "(":
              return parseExpressionStatement();
            default:
              break;
          }
        }
        if (token.type === Token.Keyword) {
          switch (token.value) {
            case "break":
              return parseBreakStatement();
            case "continue":
              return parseContinueStatement();
            case "debugger":
              return parseDebuggerStatement();
            case "do":
              return parseDoWhileStatement();
            case "for":
              return parseForStatement();
            case "function":
              return parseFunctionDeclaration();
            case "if":
              return parseIfStatement();
            case "return":
              return parseReturnStatement();
            case "switch":
              return parseSwitchStatement();
            case "throw":
              return parseThrowStatement();
            case "try":
              return parseTryStatement();
            case "var":
              return parseVariableStatement();
            case "while":
              return parseWhileStatement();
            case "with":
              return parseWithStatement();
            default:
              break;
          }
        }
        expr = parseExpression();
        if (expr.type === Syntax.Identifier && match(":")) {
          lex();
          if (Object.prototype.hasOwnProperty.call(state.labelSet, expr.name)) {
            throwError({}, Messages.Redeclaration, "Label", expr.name);
          }
          state.labelSet[expr.name] = true;
          labeledBody = parseStatement();
          delete state.labelSet[expr.name];
          return {
            type: Syntax.LabeledStatement,
            label: expr,
            body: labeledBody
          };
        }
        consumeSemicolon();
        return {
          type: Syntax.ExpressionStatement,
          expression: expr
        };
      }
      function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted, oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody;
        expect("{");
        while (index < length) {
          token = lookahead();
          if (token.type !== Token.StringLiteral) {
            break;
          }
          sourceElement = parseSourceElement();
          sourceElements.push(sourceElement);
          if (sourceElement.expression.type !== Syntax.Literal) {
            break;
          }
          directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
          if (directive === "use strict") {
            strict = true;
            if (firstRestricted) {
              throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
            }
          } else {
            if (!firstRestricted && token.octal) {
              firstRestricted = token;
            }
          }
        }
        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        while (index < length) {
          if (match("}")) {
            break;
          }
          sourceElement = parseSourceElement();
          if (typeof sourceElement === "undefined") {
            break;
          }
          sourceElements.push(sourceElement);
        }
        expect("}");
        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        return {
          type: Syntax.BlockStatement,
          body: sourceElements
        };
      }
      function parseFunctionDeclaration() {
        var id, param, params = [], body, token, stricted, firstRestricted, message, previousStrict, paramSet;
        expectKeyword("function");
        token = lookahead();
        id = parseVariableIdentifier();
        if (strict) {
          if (isRestrictedWord(token.value)) {
            throwErrorTolerant(token, Messages.StrictFunctionName);
          }
        } else {
          if (isRestrictedWord(token.value)) {
            firstRestricted = token;
            message = Messages.StrictFunctionName;
          } else if (isStrictModeReservedWord(token.value)) {
            firstRestricted = token;
            message = Messages.StrictReservedWord;
          }
        }
        expect("(");
        if (!match(")")) {
          paramSet = {};
          while (index < length) {
            token = lookahead();
            param = parseVariableIdentifier();
            if (strict) {
              if (isRestrictedWord(token.value)) {
                stricted = token;
                message = Messages.StrictParamName;
              }
              if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                stricted = token;
                message = Messages.StrictParamDupe;
              }
            } else if (!firstRestricted) {
              if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictParamName;
              } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
              } else if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                firstRestricted = token;
                message = Messages.StrictParamDupe;
              }
            }
            params.push(param);
            paramSet[param.name] = true;
            if (match(")")) {
              break;
            }
            expect(",");
          }
        }
        expect(")");
        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
          throwError(firstRestricted, message);
        }
        if (strict && stricted) {
          throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;
        return {
          type: Syntax.FunctionDeclaration,
          id: id,
          params: params,
          defaults: [],
          body: body,
          rest: null,
          generator: false,
          expression: false
        };
      }
      function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, param, params = [], body, previousStrict, paramSet;
        expectKeyword("function");
        if (!match("(")) {
          token = lookahead();
          id = parseVariableIdentifier();
          if (strict) {
            if (isRestrictedWord(token.value)) {
              throwErrorTolerant(token, Messages.StrictFunctionName);
            }
          } else {
            if (isRestrictedWord(token.value)) {
              firstRestricted = token;
              message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
              firstRestricted = token;
              message = Messages.StrictReservedWord;
            }
          }
        }
        expect("(");
        if (!match(")")) {
          paramSet = {};
          while (index < length) {
            token = lookahead();
            param = parseVariableIdentifier();
            if (strict) {
              if (isRestrictedWord(token.value)) {
                stricted = token;
                message = Messages.StrictParamName;
              }
              if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                stricted = token;
                message = Messages.StrictParamDupe;
              }
            } else if (!firstRestricted) {
              if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictParamName;
              } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
              } else if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                firstRestricted = token;
                message = Messages.StrictParamDupe;
              }
            }
            params.push(param);
            paramSet[param.name] = true;
            if (match(")")) {
              break;
            }
            expect(",");
          }
        }
        expect(")");
        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
          throwError(firstRestricted, message);
        }
        if (strict && stricted) {
          throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;
        return {
          type: Syntax.FunctionExpression,
          id: id,
          params: params,
          defaults: [],
          body: body,
          rest: null,
          generator: false,
          expression: false
        };
      }
      function parseSourceElement() {
        var token = lookahead();
        if (token.type === Token.Keyword) {
          switch (token.value) {
            case "const":
            case "let":
              return parseConstLetDeclaration(token.value);
            case "function":
              return parseFunctionDeclaration();
            default:
              return parseStatement();
          }
        }
        if (token.type !== Token.EOF) {
          return parseStatement();
        }
      }
      function parseSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;
        while (index < length) {
          token = lookahead();
          if (token.type !== Token.StringLiteral) {
            break;
          }
          sourceElement = parseSourceElement();
          sourceElements.push(sourceElement);
          if (sourceElement.expression.type !== Syntax.Literal) {
            break;
          }
          directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
          if (directive === "use strict") {
            strict = true;
            if (firstRestricted) {
              throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
            }
          } else {
            if (!firstRestricted && token.octal) {
              firstRestricted = token;
            }
          }
        }
        while (index < length) {
          sourceElement = parseSourceElement();
          if (typeof sourceElement === "undefined") {
            break;
          }
          sourceElements.push(sourceElement);
        }
        return sourceElements;
      }
      function parseProgram() {
        var program;
        strict = false;
        program = {
          type: Syntax.Program,
          body: parseSourceElements()
        };
        return program;
      }
      function addComment(type, value, start, end, loc) {
        assert(typeof start === "number", "Comment must have valid position");
        if (extra.comments.length > 0) {
          if (extra.comments[extra.comments.length - 1].range[1] > start) {
            return;
          }
        }
        extra.comments.push({
          type: type,
          value: value,
          range: [ start, end ],
          loc: loc
        });
      }
      function scanComment() {
        var comment, ch, loc, start, blockComment, lineComment;
        comment = "";
        blockComment = false;
        lineComment = false;
        while (index < length) {
          ch = source[index];
          if (lineComment) {
            ch = source[index++];
            if (isLineTerminator(ch)) {
              loc.end = {
                line: lineNumber,
                column: index - lineStart - 1
              };
              lineComment = false;
              addComment("Line", comment, start, index - 1, loc);
              if (ch === "\r" && source[index] === "\n") {
                ++index;
              }
              ++lineNumber;
              lineStart = index;
              comment = "";
            } else if (index >= length) {
              lineComment = false;
              comment += ch;
              loc.end = {
                line: lineNumber,
                column: length - lineStart
              };
              addComment("Line", comment, start, length, loc);
            } else {
              comment += ch;
            }
          } else if (blockComment) {
            if (isLineTerminator(ch)) {
              if (ch === "\r" && source[index + 1] === "\n") {
                ++index;
                comment += "\r\n";
              } else {
                comment += ch;
              }
              ++lineNumber;
              ++index;
              lineStart = index;
              if (index >= length) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
              }
            } else {
              ch = source[index++];
              if (index >= length) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
              }
              comment += ch;
              if (ch === "*") {
                ch = source[index];
                if (ch === "/") {
                  comment = comment.substr(0, comment.length - 1);
                  blockComment = false;
                  ++index;
                  loc.end = {
                    line: lineNumber,
                    column: index - lineStart
                  };
                  addComment("Block", comment, start, index, loc);
                  comment = "";
                }
              }
            }
          } else if (ch === "/") {
            ch = source[index + 1];
            if (ch === "/") {
              loc = {
                start: {
                  line: lineNumber,
                  column: index - lineStart
                }
              };
              start = index;
              index += 2;
              lineComment = true;
              if (index >= length) {
                loc.end = {
                  line: lineNumber,
                  column: index - lineStart
                };
                lineComment = false;
                addComment("Line", comment, start, index, loc);
              }
            } else if (ch === "*") {
              start = index;
              index += 2;
              blockComment = true;
              loc = {
                start: {
                  line: lineNumber,
                  column: index - lineStart - 2
                }
              };
              if (index >= length) {
                throwError({}, Messages.UnexpectedToken, "ILLEGAL");
              }
            } else {
              break;
            }
          } else if (isWhiteSpace(ch)) {
            ++index;
          } else if (isLineTerminator(ch)) {
            ++index;
            if (ch === "\r" && source[index] === "\n") {
              ++index;
            }
            ++lineNumber;
            lineStart = index;
          } else {
            break;
          }
        }
      }
      function filterCommentLocation() {
        var i, entry, comment, comments = [];
        for (i = 0; i < extra.comments.length; ++i) {
          entry = extra.comments[i];
          comment = {
            type: entry.type,
            value: entry.value
          };
          if (extra.range) {
            comment.range = entry.range;
          }
          if (extra.loc) {
            comment.loc = entry.loc;
          }
          comments.push(comment);
        }
        extra.comments = comments;
      }
      function collectToken() {
        var start, loc, token, range, value;
        skipComment();
        start = index;
        loc = {
          start: {
            line: lineNumber,
            column: index - lineStart
          }
        };
        token = extra.advance();
        loc.end = {
          line: lineNumber,
          column: index - lineStart
        };
        if (token.type !== Token.EOF) {
          range = [ token.range[0], token.range[1] ];
          value = sliceSource(token.range[0], token.range[1]);
          extra.tokens.push({
            type: TokenName[token.type],
            value: value,
            range: range,
            loc: loc
          });
        }
        return token;
      }
      function collectRegex() {
        var pos, loc, regex, token;
        skipComment();
        pos = index;
        loc = {
          start: {
            line: lineNumber,
            column: index - lineStart
          }
        };
        regex = extra.scanRegExp();
        loc.end = {
          line: lineNumber,
          column: index - lineStart
        };
        if (extra.tokens.length > 0) {
          token = extra.tokens[extra.tokens.length - 1];
          if (token.range[0] === pos && token.type === "Punctuator") {
            if (token.value === "/" || token.value === "/=") {
              extra.tokens.pop();
            }
          }
        }
        extra.tokens.push({
          type: "RegularExpression",
          value: regex.literal,
          range: [ pos, index ],
          loc: loc
        });
        return regex;
      }
      function filterTokenLocation() {
        var i, entry, token, tokens = [];
        for (i = 0; i < extra.tokens.length; ++i) {
          entry = extra.tokens[i];
          token = {
            type: entry.type,
            value: entry.value
          };
          if (extra.range) {
            token.range = entry.range;
          }
          if (extra.loc) {
            token.loc = entry.loc;
          }
          tokens.push(token);
        }
        extra.tokens = tokens;
      }
      function createLiteral(token) {
        return {
          type: Syntax.Literal,
          value: token.value
        };
      }
      function createRawLiteral(token) {
        return {
          type: Syntax.Literal,
          value: token.value,
          raw: sliceSource(token.range[0], token.range[1])
        };
      }
      function createLocationMarker() {
        var marker = {};
        marker.range = [ index, index ];
        marker.loc = {
          start: {
            line: lineNumber,
            column: index - lineStart
          },
          end: {
            line: lineNumber,
            column: index - lineStart
          }
        };
        marker.end = function() {
          this.range[1] = index;
          this.loc.end.line = lineNumber;
          this.loc.end.column = index - lineStart;
        };
        marker.applyGroup = function(node) {
          if (extra.range) {
            node.groupRange = [ this.range[0], this.range[1] ];
          }
          if (extra.loc) {
            node.groupLoc = {
              start: {
                line: this.loc.start.line,
                column: this.loc.start.column
              },
              end: {
                line: this.loc.end.line,
                column: this.loc.end.column
              }
            };
          }
        };
        marker.apply = function(node) {
          if (extra.range) {
            node.range = [ this.range[0], this.range[1] ];
          }
          if (extra.loc) {
            node.loc = {
              start: {
                line: this.loc.start.line,
                column: this.loc.start.column
              },
              end: {
                line: this.loc.end.line,
                column: this.loc.end.column
              }
            };
          }
        };
        return marker;
      }
      function trackGroupExpression() {
        var marker, expr;
        skipComment();
        marker = createLocationMarker();
        expect("(");
        expr = parseExpression();
        expect(")");
        marker.end();
        marker.applyGroup(expr);
        return expr;
      }
      function trackLeftHandSideExpression() {
        var marker, expr;
        skipComment();
        marker = createLocationMarker();
        expr = matchKeyword("new") ? parseNewExpression() : parsePrimaryExpression();
        while (match(".") || match("[")) {
          if (match("[")) {
            expr = {
              type: Syntax.MemberExpression,
              computed: true,
              object: expr,
              property: parseComputedMember()
            };
            marker.end();
            marker.apply(expr);
          } else {
            expr = {
              type: Syntax.MemberExpression,
              computed: false,
              object: expr,
              property: parseNonComputedMember()
            };
            marker.end();
            marker.apply(expr);
          }
        }
        return expr;
      }
      function trackLeftHandSideExpressionAllowCall() {
        var marker, expr;
        skipComment();
        marker = createLocationMarker();
        expr = matchKeyword("new") ? parseNewExpression() : parsePrimaryExpression();
        while (match(".") || match("[") || match("(")) {
          if (match("(")) {
            expr = {
              type: Syntax.CallExpression,
              callee: expr,
              arguments: parseArguments()
            };
            marker.end();
            marker.apply(expr);
          } else if (match("[")) {
            expr = {
              type: Syntax.MemberExpression,
              computed: true,
              object: expr,
              property: parseComputedMember()
            };
            marker.end();
            marker.apply(expr);
          } else {
            expr = {
              type: Syntax.MemberExpression,
              computed: false,
              object: expr,
              property: parseNonComputedMember()
            };
            marker.end();
            marker.apply(expr);
          }
        }
        return expr;
      }
      function filterGroup(node) {
        var n, i, entry;
        n = Object.prototype.toString.apply(node) === "[object Array]" ? [] : {};
        for (i in node) {
          if (node.hasOwnProperty(i) && i !== "groupRange" && i !== "groupLoc") {
            entry = node[i];
            if (entry === null || typeof entry !== "object" || entry instanceof RegExp) {
              n[i] = entry;
            } else {
              n[i] = filterGroup(entry);
            }
          }
        }
        return n;
      }
      function wrapTrackingFunction(range, loc) {
        return function(parseFunction) {
          function isBinary(node) {
            return node.type === Syntax.LogicalExpression || node.type === Syntax.BinaryExpression;
          }
          function visit(node) {
            var start, end;
            if (isBinary(node.left)) {
              visit(node.left);
            }
            if (isBinary(node.right)) {
              visit(node.right);
            }
            if (range) {
              if (node.left.groupRange || node.right.groupRange) {
                start = node.left.groupRange ? node.left.groupRange[0] : node.left.range[0];
                end = node.right.groupRange ? node.right.groupRange[1] : node.right.range[1];
                node.range = [ start, end ];
              } else if (typeof node.range === "undefined") {
                start = node.left.range[0];
                end = node.right.range[1];
                node.range = [ start, end ];
              }
            }
            if (loc) {
              if (node.left.groupLoc || node.right.groupLoc) {
                start = node.left.groupLoc ? node.left.groupLoc.start : node.left.loc.start;
                end = node.right.groupLoc ? node.right.groupLoc.end : node.right.loc.end;
                node.loc = {
                  start: start,
                  end: end
                };
              } else if (typeof node.loc === "undefined") {
                node.loc = {
                  start: node.left.loc.start,
                  end: node.right.loc.end
                };
              }
            }
          }
          return function() {
            var marker, node;
            skipComment();
            marker = createLocationMarker();
            node = parseFunction.apply(null, arguments);
            marker.end();
            if (range && typeof node.range === "undefined") {
              marker.apply(node);
            }
            if (loc && typeof node.loc === "undefined") {
              marker.apply(node);
            }
            if (isBinary(node)) {
              visit(node);
            }
            return node;
          };
        };
      }
      function patch() {
        var wrapTracking;
        if (extra.comments) {
          extra.skipComment = skipComment;
          skipComment = scanComment;
        }
        if (extra.raw) {
          extra.createLiteral = createLiteral;
          createLiteral = createRawLiteral;
        }
        if (extra.range || extra.loc) {
          extra.parseGroupExpression = parseGroupExpression;
          extra.parseLeftHandSideExpression = parseLeftHandSideExpression;
          extra.parseLeftHandSideExpressionAllowCall = parseLeftHandSideExpressionAllowCall;
          parseGroupExpression = trackGroupExpression;
          parseLeftHandSideExpression = trackLeftHandSideExpression;
          parseLeftHandSideExpressionAllowCall = trackLeftHandSideExpressionAllowCall;
          wrapTracking = wrapTrackingFunction(extra.range, extra.loc);
          extra.parseAdditiveExpression = parseAdditiveExpression;
          extra.parseAssignmentExpression = parseAssignmentExpression;
          extra.parseBitwiseANDExpression = parseBitwiseANDExpression;
          extra.parseBitwiseORExpression = parseBitwiseORExpression;
          extra.parseBitwiseXORExpression = parseBitwiseXORExpression;
          extra.parseBlock = parseBlock;
          extra.parseFunctionSourceElements = parseFunctionSourceElements;
          extra.parseCatchClause = parseCatchClause;
          extra.parseComputedMember = parseComputedMember;
          extra.parseConditionalExpression = parseConditionalExpression;
          extra.parseConstLetDeclaration = parseConstLetDeclaration;
          extra.parseEqualityExpression = parseEqualityExpression;
          extra.parseExpression = parseExpression;
          extra.parseForVariableDeclaration = parseForVariableDeclaration;
          extra.parseFunctionDeclaration = parseFunctionDeclaration;
          extra.parseFunctionExpression = parseFunctionExpression;
          extra.parseLogicalANDExpression = parseLogicalANDExpression;
          extra.parseLogicalORExpression = parseLogicalORExpression;
          extra.parseMultiplicativeExpression = parseMultiplicativeExpression;
          extra.parseNewExpression = parseNewExpression;
          extra.parseNonComputedProperty = parseNonComputedProperty;
          extra.parseObjectProperty = parseObjectProperty;
          extra.parseObjectPropertyKey = parseObjectPropertyKey;
          extra.parsePostfixExpression = parsePostfixExpression;
          extra.parsePrimaryExpression = parsePrimaryExpression;
          extra.parseProgram = parseProgram;
          extra.parsePropertyFunction = parsePropertyFunction;
          extra.parseRelationalExpression = parseRelationalExpression;
          extra.parseStatement = parseStatement;
          extra.parseShiftExpression = parseShiftExpression;
          extra.parseSwitchCase = parseSwitchCase;
          extra.parseUnaryExpression = parseUnaryExpression;
          extra.parseVariableDeclaration = parseVariableDeclaration;
          extra.parseVariableIdentifier = parseVariableIdentifier;
          parseAdditiveExpression = wrapTracking(extra.parseAdditiveExpression);
          parseAssignmentExpression = wrapTracking(extra.parseAssignmentExpression);
          parseBitwiseANDExpression = wrapTracking(extra.parseBitwiseANDExpression);
          parseBitwiseORExpression = wrapTracking(extra.parseBitwiseORExpression);
          parseBitwiseXORExpression = wrapTracking(extra.parseBitwiseXORExpression);
          parseBlock = wrapTracking(extra.parseBlock);
          parseFunctionSourceElements = wrapTracking(extra.parseFunctionSourceElements);
          parseCatchClause = wrapTracking(extra.parseCatchClause);
          parseComputedMember = wrapTracking(extra.parseComputedMember);
          parseConditionalExpression = wrapTracking(extra.parseConditionalExpression);
          parseConstLetDeclaration = wrapTracking(extra.parseConstLetDeclaration);
          parseEqualityExpression = wrapTracking(extra.parseEqualityExpression);
          parseExpression = wrapTracking(extra.parseExpression);
          parseForVariableDeclaration = wrapTracking(extra.parseForVariableDeclaration);
          parseFunctionDeclaration = wrapTracking(extra.parseFunctionDeclaration);
          parseFunctionExpression = wrapTracking(extra.parseFunctionExpression);
          parseLeftHandSideExpression = wrapTracking(parseLeftHandSideExpression);
          parseLogicalANDExpression = wrapTracking(extra.parseLogicalANDExpression);
          parseLogicalORExpression = wrapTracking(extra.parseLogicalORExpression);
          parseMultiplicativeExpression = wrapTracking(extra.parseMultiplicativeExpression);
          parseNewExpression = wrapTracking(extra.parseNewExpression);
          parseNonComputedProperty = wrapTracking(extra.parseNonComputedProperty);
          parseObjectProperty = wrapTracking(extra.parseObjectProperty);
          parseObjectPropertyKey = wrapTracking(extra.parseObjectPropertyKey);
          parsePostfixExpression = wrapTracking(extra.parsePostfixExpression);
          parsePrimaryExpression = wrapTracking(extra.parsePrimaryExpression);
          parseProgram = wrapTracking(extra.parseProgram);
          parsePropertyFunction = wrapTracking(extra.parsePropertyFunction);
          parseRelationalExpression = wrapTracking(extra.parseRelationalExpression);
          parseStatement = wrapTracking(extra.parseStatement);
          parseShiftExpression = wrapTracking(extra.parseShiftExpression);
          parseSwitchCase = wrapTracking(extra.parseSwitchCase);
          parseUnaryExpression = wrapTracking(extra.parseUnaryExpression);
          parseVariableDeclaration = wrapTracking(extra.parseVariableDeclaration);
          parseVariableIdentifier = wrapTracking(extra.parseVariableIdentifier);
        }
        if (typeof extra.tokens !== "undefined") {
          extra.advance = advance;
          extra.scanRegExp = scanRegExp;
          advance = collectToken;
          scanRegExp = collectRegex;
        }
      }
      function unpatch() {
        if (typeof extra.skipComment === "function") {
          skipComment = extra.skipComment;
        }
        if (extra.raw) {
          createLiteral = extra.createLiteral;
        }
        if (extra.range || extra.loc) {
          parseAdditiveExpression = extra.parseAdditiveExpression;
          parseAssignmentExpression = extra.parseAssignmentExpression;
          parseBitwiseANDExpression = extra.parseBitwiseANDExpression;
          parseBitwiseORExpression = extra.parseBitwiseORExpression;
          parseBitwiseXORExpression = extra.parseBitwiseXORExpression;
          parseBlock = extra.parseBlock;
          parseFunctionSourceElements = extra.parseFunctionSourceElements;
          parseCatchClause = extra.parseCatchClause;
          parseComputedMember = extra.parseComputedMember;
          parseConditionalExpression = extra.parseConditionalExpression;
          parseConstLetDeclaration = extra.parseConstLetDeclaration;
          parseEqualityExpression = extra.parseEqualityExpression;
          parseExpression = extra.parseExpression;
          parseForVariableDeclaration = extra.parseForVariableDeclaration;
          parseFunctionDeclaration = extra.parseFunctionDeclaration;
          parseFunctionExpression = extra.parseFunctionExpression;
          parseGroupExpression = extra.parseGroupExpression;
          parseLeftHandSideExpression = extra.parseLeftHandSideExpression;
          parseLeftHandSideExpressionAllowCall = extra.parseLeftHandSideExpressionAllowCall;
          parseLogicalANDExpression = extra.parseLogicalANDExpression;
          parseLogicalORExpression = extra.parseLogicalORExpression;
          parseMultiplicativeExpression = extra.parseMultiplicativeExpression;
          parseNewExpression = extra.parseNewExpression;
          parseNonComputedProperty = extra.parseNonComputedProperty;
          parseObjectProperty = extra.parseObjectProperty;
          parseObjectPropertyKey = extra.parseObjectPropertyKey;
          parsePrimaryExpression = extra.parsePrimaryExpression;
          parsePostfixExpression = extra.parsePostfixExpression;
          parseProgram = extra.parseProgram;
          parsePropertyFunction = extra.parsePropertyFunction;
          parseRelationalExpression = extra.parseRelationalExpression;
          parseStatement = extra.parseStatement;
          parseShiftExpression = extra.parseShiftExpression;
          parseSwitchCase = extra.parseSwitchCase;
          parseUnaryExpression = extra.parseUnaryExpression;
          parseVariableDeclaration = extra.parseVariableDeclaration;
          parseVariableIdentifier = extra.parseVariableIdentifier;
        }
        if (typeof extra.scanRegExp === "function") {
          advance = extra.advance;
          scanRegExp = extra.scanRegExp;
        }
      }
      function stringToArray(str) {
        var length = str.length, result = [], i;
        for (i = 0; i < length; ++i) {
          result[i] = str.charAt(i);
        }
        return result;
      }
      function parse(code, options) {
        var program, toString;
        toString = String;
        if (typeof code !== "string" && !(code instanceof String)) {
          code = toString(code);
        }
        source = code;
        index = 0;
        lineNumber = source.length > 0 ? 1 : 0;
        lineStart = 0;
        length = source.length;
        buffer = null;
        state = {
          allowIn: true,
          labelSet: {},
          inFunctionBody: false,
          inIteration: false,
          inSwitch: false
        };
        extra = {};
        if (typeof options !== "undefined") {
          extra.range = typeof options.range === "boolean" && options.range;
          extra.loc = typeof options.loc === "boolean" && options.loc;
          extra.raw = typeof options.raw === "boolean" && options.raw;
          if (typeof options.tokens === "boolean" && options.tokens) {
            extra.tokens = [];
          }
          if (typeof options.comment === "boolean" && options.comment) {
            extra.comments = [];
          }
          if (typeof options.tolerant === "boolean" && options.tolerant) {
            extra.errors = [];
          }
        }
        if (length > 0) {
          if (typeof source[0] === "undefined") {
            if (code instanceof String) {
              source = code.valueOf();
            }
            if (typeof source[0] === "undefined") {
              source = stringToArray(code);
            }
          }
        }
        patch();
        try {
          program = parseProgram();
          if (typeof extra.comments !== "undefined") {
            filterCommentLocation();
            program.comments = extra.comments;
          }
          if (typeof extra.tokens !== "undefined") {
            filterTokenLocation();
            program.tokens = extra.tokens;
          }
          if (typeof extra.errors !== "undefined") {
            program.errors = extra.errors;
          }
          if (extra.range || extra.loc) {
            program.body = filterGroup(program.body);
          }
        } catch (e) {
          throw e;
        } finally {
          unpatch();
          extra = {};
        }
        return program;
      }
      exports.version = "1.0.4";
      exports.parse = parse;
      exports.Syntax = function() {
        var name, types = {};
        if (typeof Object.create === "function") {
          types = Object.create(null);
        }
        for (name in Syntax) {
          if (Syntax.hasOwnProperty(name)) {
            types[name] = Syntax[name];
          }
        }
        if (typeof Object.freeze === "function") {
          Object.freeze(types);
        }
        return types;
      }();
    });
  },
  "r.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./2.js");
    var runner = basis.require("./c.js");
    var TestSuite = basis.require("./h.js").TestSuite;
    var Item = basis.ui.Node.subclass({
      template: basis.template.get("#2"),
      binding: {
        name: "data:",
        progress: [ "stateChanged", function(node) {
          return 100 * (node.state == basis.data.STATE.PROCESSING ? node.state.data : 1);
        } ],
        pending: [ "stateChanged", function(node) {
          return node.state.data instanceof basis.data.Object && !!node.state.data.data.pending;
        } ],
        stateMessage: [ "stateChanged", function(node) {
          var report = node.state.data;
          switch (String(node.state)) {
            case basis.data.STATE.READY:
              if (report.data && report.data.pending) return "Pending";
              return "OK";
            case basis.data.STATE.ERROR:
              if (report instanceof basis.data.Object == false) return "Error";
              if (report.data.exception) return "Exception";
              if (report.data.error == "ERROR_TIMEOUT") return "Timeout";
              return report.data.testCount - report.data.successCount + " of " + report.data.testCount + " fault";
            case basis.data.STATE.PROCESSING:
              return "running";
            default:
              return "";
          }
        } ]
      },
      action: {
        pickup: function(event) {
          if (this.parentNode && this.root instanceof TestSuite) this.parentNode.setDelegate(this.root);
        }
      }
    });
    var view = new basis.ui.Node({
      dataSource: basis.data.Value.factory("rootChanged", function(node) {
        return node.root.getChildNodesDataset();
      }),
      template: basis.template.get("#3"),
      binding: {
        faultTests: "satellite:",
        levelUp: "satellite:"
      },
      selection: true,
      listen: {
        selection: {
          itemsChanged: function(selection) {
            if (!selection.itemCount) this.satellite.faultTests.select();
          }
        }
      },
      childClass: Item
    });
    view.setSatellite("faultTests", new Item({
      contextSelection: view.selection,
      delegate: new basis.data.Object({
        data: {
          name: "Summary"
        },
        getChildNodesDataset: function() {
          return runner.faultTests;
        }
      })
    }));
    view.setSatellite("levelUp", {
      events: "rootChanged",
      existsIf: function(owner) {
        return owner.root.parentNode;
      },
      delegate: function(owner) {
        return owner.root.parentNode;
      },
      instance: new Item({
        binding: {
          name: function() {
            return "..";
          }
        },
        action: {
          select: function() {
            this.owner.setDelegate(this.root);
          }
        }
      })
    });
    basis.ready(function() {
      if (!view.selection.itemCount) view.satellite.faultTests.select();
    });
    module.exports = view;
  },
  "3.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./4.js");
    var namespace = this.path;
    var Class = basis.Class;
    var Emitter = basis.event.Emitter;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    basis.resource.extensions[".l10n"] = function(content, url) {
      return resolveDictionary(url).update(basis.resource.extensions[".json"](content, url));
    };
    function ownKeys(object) {
      var result = [];
      for (var key in object) if (hasOwnProperty.call(object, key)) result.push(key);
      return result;
    }
    var tokenIndex = [];
    var tokenComputeFn = {};
    var tokenComputes = {};
    var ComputeToken = Class(basis.Token, {
      className: namespace + ".ComputeToken",
      init: function(value, token) {
        token.computeTokens[this.basisObjectId] = this;
        this.token = token;
        this.get = token.computeGetMethod;
        basis.Token.prototype.init.call(this, value);
      },
      toString: function() {
        return this.get();
      },
      destroy: function() {
        delete this.token.computeTokens[this.basisObjectId];
        this.token = null;
        basis.Token.prototype.destroy.call(this);
      }
    });
    var Token = Class(basis.Token, {
      className: namespace + ".Token",
      index: NaN,
      dictionary: null,
      name: "",
      type: "default",
      computeTokens: null,
      init: function(dictionary, tokenName, type, value) {
        basis.Token.prototype.init.call(this, value);
        this.index = tokenIndex.push(this) - 1;
        this.name = tokenName;
        this.dictionary = dictionary;
        this.computeTokens = {};
        if (type) this.setType(type); else this.apply();
      },
      toString: function() {
        return this.get();
      },
      computeGetMethod: function() {},
      apply: function() {
        var values = {};
        var tokens = this.computeTokens;
        var get = this.type == "plural" ? function() {
          return values[cultures[currentCulture].plural(this.value)];
        } : function() {
          return values[this.value];
        };
        this.computeGetMethod = get;
        if (this.type == "plural" && Array.isArray(this.value) || this.type == "default" && typeof this.value == "object") values = basis.object.slice(this.value, ownKeys(this.value));
        for (var key in tokens) {
          var computeToken = tokens[key];
          var curValue = computeToken.get();
          var newValue = get.call(computeToken);
          computeToken.get = get;
          if (curValue !== newValue) computeToken.apply();
        }
        basis.Token.prototype.apply.call(this);
      },
      setType: function(type) {
        if (type != "plural" && (!basis.l10n.enableMarkup || type != "markup")) type = "default";
        if (this.type != type) {
          this.type = type;
          this.apply();
        }
      },
      compute: function(events, getter) {
        if (arguments.length == 1) {
          getter = events;
          events = "";
        }
        getter = basis.getter(getter);
        events = String(events).trim().split(/\s+|\s*,\s*/).sort();
        var tokenId = this.basisObjectId;
        var enumId = events.concat(tokenId, getter.basisGetterId_).join("_");
        if (tokenComputeFn[enumId]) return tokenComputeFn[enumId];
        var token = this;
        var objectTokenMap = {};
        var updateValue = function(object) {
          this.set(getter(object));
        };
        var handler = {
          destroy: function(object) {
            delete objectTokenMap[object.basisObjectId];
            this.destroy();
          }
        };
        for (var i = 0, eventName; eventName = events[i]; i++) if (eventName != "destroy") handler[eventName] = updateValue;
        return tokenComputeFn[enumId] = function(object) {
          if (object instanceof Emitter == false) throw "basis.l10n.Token#compute: object must be an instanceof Emitter";
          var objectId = object.basisObjectId;
          var computeToken = objectTokenMap[objectId];
          if (!computeToken) {
            computeToken = objectTokenMap[objectId] = new ComputeToken(getter(object), token);
            object.addHandler(handler, computeToken);
          }
          return computeToken;
        };
      },
      computeToken: function(value) {
        return new ComputeToken(value, this);
      },
      token: function(name) {
        if (this.type == "plural") name = cultures[currentCulture].plural(name);
        if (this.dictionary) return this.dictionary.token(this.name + "." + name);
      },
      destroy: function() {
        for (var key in this.computeTokens) this.computeTokens[key].destroy();
        this.computeTokens = null;
        this.value = null;
        basis.Token.prototype.destroy.call(this);
      }
    });
    function resolveToken(path) {
      if (path.charAt(0) == "#") {
        return tokenIndex[parseInt(path.substr(1), 36)];
      } else {
        var parts = path.match(/^(.+?)@(.+)$/);
        if (parts) return resolveDictionary(basis.path.resolve(parts[2])).token(parts[1]);
        basis.dev.warn("basis.l10n.token accepts token references in format `token.path@path/to/dict.l10n` only");
      }
    }
    var dictionaries = [];
    var dictionaryByUrl = {};
    var createDictionaryNotifier = new basis.Token;
    function walkTokens(dictionary, culture, tokens, path) {
      var cultureValues = dictionary.cultureValues[culture];
      path = path ? path + "." : "";
      for (var name in tokens) if (hasOwnProperty.call(tokens, name)) {
        var tokenName = path + name;
        var tokenValue = tokens[name];
        cultureValues[tokenName] = tokenValue;
        if (tokenValue && (typeof tokenValue == "object" || Array.isArray(tokenValue))) walkTokens(dictionary, culture, tokenValue, tokenName);
      }
    }
    var Dictionary = Class(null, {
      className: namespace + ".Dictionary",
      tokens: null,
      types: null,
      cultureValues: null,
      index: NaN,
      resource: null,
      init: function(content) {
        this.tokens = {};
        this.types = {};
        this.cultureValues = {};
        this.index = dictionaries.push(this) - 1;
        if (basis.resource.isResource(content)) {
          var resource = content;
          this.resource = resource;
          if (!dictionaryByUrl[resource.url]) {
            dictionaryByUrl[resource.url] = this;
            createDictionaryNotifier.set(resource.url);
          }
          resource.fetch();
        } else {
          basis.dev.warn("Use object as content of dictionary is experimental and not production-ready");
          this.update(content || {});
        }
      },
      update: function(data) {
        if (!data) data = {};
        this.cultureValues = {};
        for (var culture in data) if (!/^_|_$/.test(culture)) {
          this.cultureValues[culture] = {};
          walkTokens(this, culture, data[culture]);
        }
        this.types = data._meta && data._meta.type || {};
        for (var key in this.tokens) this.tokens[key].setType(this.types[key]);
        this.syncValues();
        return this;
      },
      syncValues: function() {
        for (var tokenName in this.tokens) this.tokens[tokenName].set(this.getValue(tokenName));
      },
      getValue: function(tokenName) {
        var fallback = cultureFallback[currentCulture] || [];
        for (var i = 0, cultureName; cultureName = fallback[i]; i++) {
          var cultureValues = this.cultureValues[cultureName];
          if (cultureValues && tokenName in cultureValues) return cultureValues[tokenName];
        }
      },
      getCultureValue: function(culture, tokenName) {
        return this.cultureValues[culture] && this.cultureValues[culture][tokenName];
      },
      token: function(tokenName) {
        var token = this.tokens[tokenName];
        if (!token) {
          token = this.tokens[tokenName] = new Token(this, tokenName, this.types[tokenName], this.getValue(tokenName));
        }
        return token;
      },
      destroy: function() {
        this.tokens = null;
        this.cultureValues = null;
        basis.array.remove(dictionaries, this);
        if (this.resource) {
          delete dictionaryByUrl[this.resource.url];
          this.resource = null;
        }
      }
    });
    function resolveDictionary(source) {
      var dictionary;
      if (typeof source == "string") {
        var location = source;
        var extname = basis.path.extname(location);
        if (extname != ".l10n") location = basis.path.dirname(location) + "/" + basis.path.basename(location, extname) + ".l10n";
        source = basis.resource(location);
      }
      if (basis.resource.isResource(source)) dictionary = dictionaryByUrl[source.url];
      return dictionary || new Dictionary(source);
    }
    function getDictionaries() {
      return dictionaries.slice(0);
    }
    var cultureList = [];
    var currentCulture = null;
    var cultures = {};
    var cultureFallback = {};
    var pluralFormsMap = {};
    var pluralForms = [ [ 1, function(n) {
      return 0;
    } ], [ 2, function(n) {
      return n == 1 || n % 10 == 1 ? 0 : 1;
    } ], [ 2, function(n) {
      return n == 0 ? 0 : 1;
    } ], [ 2, function(n) {
      return n == 1 ? 0 : 1;
    } ], [ 2, function(n) {
      return n == 0 || n == 1 ? 0 : 1;
    } ], [ 2, function(n) {
      return n % 10 != 1 || n % 100 == 11 ? 1 : 0;
    } ], [ 3, function(n) {
      return n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    } ], [ 3, function(n) {
      return n % 10 == 1 && n % 100 != 11 ? 0 : n != 0 ? 1 : 2;
    } ], [ 3, function(n) {
      return n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    } ], [ 3, function(n) {
      return n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    } ], [ 3, function(n) {
      return n == 0 ? 0 : n == 1 ? 1 : 2;
    } ], [ 3, function(n) {
      return n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2;
    } ], [ 3, function(n) {
      return n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    } ], [ 3, function(n) {
      return n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
    } ], [ 4, function(n) {
      return n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3;
    } ], [ 4, function(n) {
      return n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3;
    } ], [ 4, function(n) {
      return n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0;
    } ], [ 4, function(n) {
      return n == 1 ? 0 : n == 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3;
    } ], [ 4, function(n) {
      return n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3;
    } ], [ 5, function(n) {
      return n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4;
    } ], [ 6, function(n) {
      return n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
    } ] ];
    [ "ay bo cgg dz fa id ja jbo ka kk km ko ky lo ms my sah su th tt ug vi wo zh", "mk", "jv", "af an ast az bg bn brx ca da de doi el en eo es es-AR et eu ff fi fo fur fy gl gu ha he hi hne hu hy ia it kn ku lb mai ml mn mni mr nah nap nb ne nl nn no nso or pa pap pms ps pt rm rw sat sco sd se si so son sq sv sw ta te tk ur yo", "ach ak am arn br fil fr gun ln mfe mg mi oc pt-BR tg ti tr uz wa zh", "is", "csb", "lv", "lt", "be bs hr ru sr uk", "mnk", "ro", "pl", "cs sk", "cy", "kw", "sl", "mt", "gd", "ga", "ar" ].forEach(function(langs, idx) {
      langs.split(" ").forEach(function(lang) {
        pluralFormsMap[lang] = this;
      }, pluralForms[idx]);
    });
    var Culture = basis.Class(null, {
      className: namespace + ".Culture",
      name: "",
      pluralForm: null,
      init: function(name, pluralForm) {
        this.name = name;
        if (!cultures[name]) cultures[name] = this;
        this.pluralForm = pluralForm || pluralFormsMap[name] || pluralFormsMap[name.split("-")[0]] || pluralForms[0];
      },
      plural: function(value) {
        return Number(this.pluralForm[1](Math.abs(parseInt(value, 10))));
      }
    });
    function resolveCulture(name, pluralForm) {
      if (name && !cultures[name]) cultures[name] = new Culture(name, pluralForm);
      return cultures[name || currentCulture];
    }
    basis.object.extend(resolveCulture, new basis.Token);
    resolveCulture.set = setCulture;
    function getCulture() {
      return currentCulture;
    }
    function setCulture(culture) {
      if (!culture) return;
      if (currentCulture != culture) {
        if (cultureList.indexOf(culture) == -1) {
          basis.dev.warn("basis.l10n.setCulture: culture `" + culture + "` not in the list, the culture isn't changed");
          return;
        }
        currentCulture = culture;
        for (var i = 0, dictionary; dictionary = dictionaries[i]; i++) dictionary.syncValues();
        basis.Token.prototype.set.call(resolveCulture, culture);
      }
    }
    function getCultureList() {
      return cultureList.slice(0);
    }
    function setCultureList(list) {
      if (typeof list == "string") list = list.trim().split(" ");
      if (!list.length) {
        basis.dev.warn("basis.l10n.setCultureList: culture list can't be empty, the culture list isn't changed");
        return;
      }
      var cultures = {};
      var cultureRow;
      var baseCulture;
      cultureFallback = {};
      for (var i = 0, culture, cultureName; culture = list[i]; i++) {
        cultureRow = culture.split("/");
        if (cultureRow.length > 2) {
          basis.dev.warn("basis.l10n.setCultureList: only one fallback culture can be set for certain culture, try to set `" + culture + "`; other cultures except first one was ignored");
          cultureRow = cultureRow.slice(0, 2);
        }
        cultureName = cultureRow[0];
        if (!baseCulture) baseCulture = cultureName;
        cultures[cultureName] = resolveCulture(cultureName);
        cultureFallback[cultureName] = cultureRow;
      }
      for (var cultureName in cultureFallback) {
        cultureFallback[cultureName] = basis.array.flatten(cultureFallback[cultureName].map(function(name) {
          return cultureFallback[name];
        })).concat(baseCulture).filter(function(item, idx, array) {
          return !idx || array.lastIndexOf(item, idx - 1) == -1;
        });
      }
      cultureList = basis.object.keys(cultures);
      if (currentCulture in cultures == false) setCulture(baseCulture);
    }
    function onCultureChange(fn, context, fire) {
      resolveCulture.attach(fn, context);
      if (fire) fn.call(context, currentCulture);
    }
    setCultureList("en-US");
    setCulture("en-US");
    module.exports = {
      ComputeToken: ComputeToken,
      Token: Token,
      token: resolveToken,
      Dictionary: Dictionary,
      dictionary: resolveDictionary,
      getDictionaries: getDictionaries,
      addCreateDictionaryHandler: createDictionaryNotifier.attach.bind(createDictionaryNotifier),
      removeCreateDictionaryHandler: createDictionaryNotifier.detach.bind(createDictionaryNotifier),
      Culture: Culture,
      culture: resolveCulture,
      getCulture: getCulture,
      setCulture: setCulture,
      getCultureList: getCultureList,
      setCultureList: setCultureList,
      pluralForms: pluralForms,
      onCultureChange: onCultureChange
    };
  },
  "4.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var namespace = this.path;
    var Class = basis.Class;
    var extend = basis.object.extend;
    var slice = Array.prototype.slice;
    var NULL_HANDLER = {};
    var events = {};
    var warnOnDestroy = function() {
      basis.dev.warn("Object had been destroyed before. Destroy method must not be called more than once.");
    };
    function createDispatcher(eventName) {
      var eventFunction = events[eventName];
      if (!eventFunction) {
        eventFunction = function() {
          var cursor = this;
          var args;
          var fn;
          while (cursor = cursor.handler) {
            fn = cursor.callbacks[eventName];
            if (typeof fn == "function") {
              if (!args) {
                args = [ this ];
                for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
              }
              fn.apply(cursor.context || this, args);
            }
            fn = cursor.callbacks["*"];
            if (typeof fn == "function") {
              if (!args) {
                args = [ this ];
                for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
              }
              fn.call(cursor.context || this, {
                sender: this,
                type: eventName,
                args: args
              });
            }
          }
          if (this.debug_emit) this.debug_emit({
            sender: this,
            type: eventName,
            args: arguments
          });
        };
        eventFunction = (new Function("slice", 'return {"' + namespace + ".events." + eventName + '":\n\n      ' + "function(" + slice.call(arguments, 1).join(", ") + "){" + eventFunction.toString().replace(/\beventName\b/g, '"' + eventName + '"').replace(/^function[^(]*\(\)[^{]*\{|\}$/g, "") + "}" + '\n\n}["' + namespace + ".events." + eventName + '"];'))(slice);
        events[eventName] = eventFunction;
      }
      return eventFunction;
    }
    function createHandler(events, eventCallback) {
      var handler = {
        events: []
      };
      if (events) {
        events = String(events).trim().split(/\s+|\s*,\s*/).sort();
        handler = {
          events: events
        };
        for (var i = 0, eventName; eventName = events[i]; i++) if (eventName != "destroy") handler[eventName] = eventCallback;
      }
      return handler;
    }
    var Emitter = Class(null, {
      className: namespace + ".Emitter",
      extendConstructor_: true,
      handler: null,
      emit_destroy: createDispatcher("destroy"),
      listen: Class.nestedExtendProperty(),
      debug_handlers: function() {
        var result = [];
        var cursor = this;
        while (cursor = cursor.handler) result.push([ cursor.callbacks, cursor.context ]);
        return result;
      },
      debug_emit: null,
      init: function() {
        if (this.handler && !this.handler.callbacks) this.handler = {
          callbacks: this.handler,
          context: this,
          handler: null
        };
      },
      addHandler: function(callbacks, context) {
        if (!callbacks) basis.dev.warn(namespace + ".Emitter#addHandler: callbacks is not an object (", callbacks, ")");
        context = context || this;
        var cursor = this;
        while (cursor = cursor.handler) {
          if (cursor.callbacks === callbacks && cursor.context === context) {
            basis.dev.warn(namespace + ".Emitter#addHandler: add duplicate event callbacks", callbacks, "to Emitter instance:", this);
            break;
          }
        }
        this.handler = {
          callbacks: callbacks,
          context: context,
          handler: this.handler
        };
      },
      removeHandler: function(callbacks, context) {
        var cursor = this;
        var prev;
        context = context || this;
        while (prev = cursor, cursor = cursor.handler) if (cursor.callbacks === callbacks && cursor.context === context) {
          cursor.callbacks = NULL_HANDLER;
          prev.handler = cursor.handler;
          return;
        }
        basis.dev.warn(namespace + ".Emitter#removeHandler: no handler removed");
      },
      destroy: function() {
        this.destroy = warnOnDestroy;
        this.emit_destroy();
        this.handler = null;
      }
    });
    module.exports = {
      create: createDispatcher,
      createHandler: createHandler,
      events: events,
      Emitter: Emitter
    };
  },
  "s.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var coreTest = basis.require("./h.js");
    var appTest = basis.require("./m.js");
    var view = new appTest.TestSuiteNode({
      template: basis.template.get("#8"),
      binding: {
        sourceCode: "satellite:",
        type: [ "rootChanged", function(node) {
          if (node.root instanceof coreTest.TestSuite) return "suite";
          if (node.root instanceof coreTest.TestCase) return "case";
          return "unknown";
        } ],
        hasDelegate: [ "delegateChanged", function(node) {
          return !!node.delegate;
        } ]
      },
      selection: true,
      satellite: {
        sourceCode: {
          instanceOf: appTest.CodeView,
          events: "rootChanged stateChanged",
          existsIf: function(owner) {
            return owner.root instanceof coreTest.TestCase;
          },
          delegate: function(owner) {
            return owner.state == basis.data.STATE.ERROR && owner.state.data instanceof basis.data.Object ? owner.state.data : owner;
          }
        }
      }
    });
    view.contextSelection = view.selection;
    view.addHandler({
      delegateChanged: function() {
        this.selection.clear();
      }
    });
    module.exports = view;
  },
  "m.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./5.js");
    basis.require("./2.js");
    var document = global.document;
    var highlight = basis.require("./n.js");
    var TestCase = basis.require("./h.js").TestCase;
    var strDiff = basis.require("./o.js");
    function htmlEscape(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var CodeView = basis.ui.Node.subclass({
      template: basis.template.get("#4"),
      binding: {
        sourceCode: "codeElement"
      },
      init: function() {
        this.codeElement = document.createElement("div");
        basis.ui.Node.prototype.init.call(this);
        this.syncCode();
      },
      handler: {
        update: function() {
          this.syncCode();
        }
      },
      syncCode: function() {
        this.codeElement.innerHTML = highlight(this.data.testSource, {
          keepFormat: true,
          noLineNumber: true
        });
        var lines = this.codeElement.childNodes;
        if (this.data.exception) {
          var startLine = this.data.lastLine;
          lines[startLine++].className += " exception-line";
          for (var i = startLine; i < lines.length; i++) lines[i].className += " disabled-line";
          return;
        }
        var errorLines = this.data.errorLines;
        for (var lineNum in errorLines) {
          lines[lineNum].className += " error-line";
          lines[lineNum].innerHTML += '<div class="error-line-details">' + errorLines[lineNum].map(function(lineError) {
            var diffType = typeof lineError.expected == "string" && typeof lineError.actual == "string" ? "diffChars" : "diffWords";
            var diff = strDiff[diffType](lineError.expectedStr, lineError.actualStr);
            var expected = "";
            var actual = "";
            for (var i = 0, chunk; chunk = diff[i]; i++) {
              if (chunk.removed) {
                expected += '<span class="diff-removed">' + htmlEscape(chunk.value) + "</span>";
                continue;
              }
              if (chunk.added) {
                actual += '<span class="diff-added">' + htmlEscape(chunk.value) + "</span>";
                continue;
              }
              expected += htmlEscape(chunk.value);
              actual += htmlEscape(chunk.value);
            }
            return '<div class="error-line-details-item">' + '<span class="num">' + (lineError.num + 1) + "</span>" + '<span class="caption">Expected:</span>' + '<span class="expected">' + expected + "</span>" + '<span class="caption">Actual:</span>' + '<span class="actual">' + actual + "</span>" + "</div>";
          }).join("") + "</div>";
        }
      }
    });
    var TestNode = basis.ui.Node.subclass({
      template: basis.template.get("#5"),
      binding: {
        name: "data:",
        hasOwnEnvironment: [ "rootChanged", function(node) {
          return node.root.hasOwnEnvironment();
        } ],
        time: [ "stateChanged", function(node) {
          return node.state.data && node.state.data.data && node.state.data.data.time;
        } ],
        errorMessage: [ "stateChanged", function(node) {
          return node.state == basis.data.STATE.ERROR && node.state.data ? node.state.data.data.error : "";
        } ],
        pending: [ "stateChanged", function(node) {
          return node.state.data instanceof basis.data.Object && !!node.state.data.data.pending;
        } ],
        stateData: [ "stateChanged", function(node) {
          return node.state == basis.data.STATE.PROCESSING ? (100 * node.state.data || 0).toFixed(2) : node.state.data && node.state.data.data.error || "";
        } ],
        stateMessage: [ "stateChanged", function(node) {
          var report = node.state.data;
          switch (String(node.state)) {
            case basis.data.STATE.READY:
              if (report instanceof basis.data.Object) {
                if (report.data.pending) return "Pending";
              }
              return "OK";
            case basis.data.STATE.ERROR:
              if (report instanceof basis.data.Object == false) return "Error";
              if (report.data.exception) return report.data.exception;
              if (report.data.error == "ERROR_TIMEOUT") return "Timeout";
              return report.data.testCount - report.data.successCount + " of " + report.data.testCount + " fault";
            case basis.data.STATE.PROCESSING:
              return "running";
            default:
              return "";
          }
        } ]
      }
    });
    var TestSuiteNode = TestNode.subclass({
      dataSource: basis.data.Value.factory("rootChanged", function(node) {
        return node.root.getChildNodesDataset();
      }),
      template: basis.template.get("#6"),
      childClass: TestNode,
      childFactory: function(config) {
        if (config.delegate.root instanceof TestCase) return new TestCaseNode(config); else return new TestSuiteNode(config);
      }
    });
    var TestCaseNode = TestNode.subclass({
      template: basis.template.get("#7"),
      binding: {
        source: "satellite:"
      },
      satellite: {
        source: {
          events: "stateChanged",
          existsIf: function(owner) {
            return owner.state == basis.data.STATE.ERROR && owner.state.data && owner.state.data.data && owner.state.data.data.testSource;
          },
          delegate: "state.data",
          instanceOf: CodeView
        }
      }
    });
    module.exports = {
      TestNode: TestNode,
      TestCaseNode: TestCaseNode,
      TestSuiteNode: TestSuiteNode,
      CodeView: CodeView
    };
  },
  "n.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var lead = basis.number.lead;
    var repeat = basis.string.repeat;
    var keywords = "break case catch continue " + "default delete do else false " + "for function if in instanceof " + "new null return super switch " + "this throw true try typeof var while with";
    var keywordRegExp = new RegExp("\\b(" + keywords.split(" ").join("|") + ")\\b", "g");
    function parse(text) {
      function addMatch(kind, start, end, rn) {
        if (lastMatchPos != start) result.push(text.substring(lastMatchPos, start).replace(keywordRegExp, '<span class="token-keyword">$1</span>'));
        lastMatchPos = end + 1;
        if (kind) result.push('<span class="token-' + kind + '">' + text.substring(start, end + 1) + "</span>" + (rn || ""));
      }
      var result = [];
      var sym = text.split("");
      var start;
      var lastMatchPos = 0;
      var strSym;
      for (var i = 0; i < sym.length; i++) {
        if (sym[i] == "'" || sym[i] == '"') {
          strSym = sym[i];
          start = i;
          while (++i < sym.length) {
            if (sym[i] == "\\") {
              if (sym[i + 1] == "\n") {
                addMatch("string", start, i);
                start = ++i + 1;
              } else i += 2;
            }
            if (sym[i] == strSym) {
              addMatch("string", start, i);
              break;
            }
            if (sym[i] == "\n") break;
          }
        } else if (sym[i] == "/") {
          start = i;
          i++;
          if (sym[i] == "/") {
            while (++i < sym.length) {
              if (sym[i] == "\n") break;
            }
            addMatch("comment", start, i - 1);
          } else if (sym[i] == "*") {
            while (++i < sym.length) {
              if (sym[i] == "*" && sym[i + 1] == "/") {
                addMatch("comment", start, ++i);
                break;
              } else if (sym[i] == "\n") {
                addMatch("comment", start, i - 1, "\n");
                lastMatchPos = start = i + 1;
              }
            }
          }
        }
      }
      addMatch(null, text.length);
      return result;
    }
    function highlight(text, options) {
      function normalize(text) {
        text = text.trimRight().replace(/\r\n|\n\r|\r/g, "\n");
        if (!options.keepFormat) text = text.replace(/^(?:\s*[\n]+)+?([ \t]*)/, "$1");
        text = text.replace(/\n[ \t]+/g, function(m) {
          return m.replace(/\t/g, "  ");
        }).replace(/\n[ \t]+\n/g, "\n\n");
        if (!options.keepFormat) {
          var minOffset = 1e3;
          var lines = text.split(/\n+/);
          var startLine = Number(text.match(/^function/) != null);
          for (var i = startLine; i < lines.length; i++) {
            var m = lines[i].match(/^\s*/);
            if (m[0].length < minOffset) minOffset = m[0].length;
            if (minOffset == 0) break;
          }
          if (minOffset > 0) text = text.replace(new RegExp("(^|\\n) {" + minOffset + "}", "g"), "$1");
        }
        text = text.replace(new RegExp("(^|\\n)( +)", "g"), function(m, a, b) {
          return a + repeat(" ", b.length);
        });
        return text;
      }
      if (!options) options = {};
      var html = parse(normalize(text || "").replace(/</g, "&lt;"));
      var lines = html.join("").split("\n");
      var numberWidth = String(lines.length).length;
      var lineClass = options.noLineNumber ? "" : " hasLineNumber";
      var res = [];
      for (var i = 0; i < lines.length; i++) res.push('<div class="line ' + (i % 2 ? "odd" : "even") + lineClass + '">' + '<span class="lineContent">' + (!options.noLineNumber ? '<input class="lineNumber" value="' + lead(i + 1, numberWidth) + '" type="none" unselectable="on" readonly="readonly" tabindex="-1" />' + '<span class="over"></span>' : "") + (lines[i] + "\r\n") + "</span>" + "</div>");
      return res.join("");
    }
    module.exports = highlight;
  },
  "o.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var JsDiff = function() {
      function clonePath(path) {
        return {
          newPos: path.newPos,
          components: path.components.slice(0)
        };
      }
      function removeEmpty(array) {
        var ret = [];
        for (var i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }
        return ret;
      }
      function escapeHTML(s) {
        var n = s;
        n = n.replace(/&/g, "&amp;");
        n = n.replace(/</g, "&lt;");
        n = n.replace(/>/g, "&gt;");
        n = n.replace(/"/g, "&quot;");
        return n;
      }
      var Diff = function(ignoreWhitespace) {
        this.ignoreWhitespace = ignoreWhitespace;
      };
      Diff.prototype = {
        diff: function(oldString, newString) {
          if (newString === oldString) {
            return [ {
              value: newString
            } ];
          }
          if (!newString) {
            return [ {
              value: oldString,
              removed: true
            } ];
          }
          if (!oldString) {
            return [ {
              value: newString,
              added: true
            } ];
          }
          newString = this.tokenize(newString);
          oldString = this.tokenize(oldString);
          var newLen = newString.length, oldLen = oldString.length;
          var maxEditLength = newLen + oldLen;
          var bestPath = [ {
            newPos: -1,
            components: []
          } ];
          var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
          if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
            return bestPath[0].components;
          }
          for (var editLength = 1; editLength <= maxEditLength; editLength++) {
            for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
              var basePath;
              var addPath = bestPath[diagonalPath - 1], removePath = bestPath[diagonalPath + 1];
              oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
              if (addPath) {
                bestPath[diagonalPath - 1] = undefined;
              }
              var canAdd = addPath && addPath.newPos + 1 < newLen;
              var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
              if (!canAdd && !canRemove) {
                bestPath[diagonalPath] = undefined;
                continue;
              }
              if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
                basePath = clonePath(removePath);
                this.pushComponent(basePath.components, oldString[oldPos], undefined, true);
              } else {
                basePath = clonePath(addPath);
                basePath.newPos++;
                this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);
              }
              var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);
              if (basePath.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
                return basePath.components;
              } else {
                bestPath[diagonalPath] = basePath;
              }
            }
          }
        },
        pushComponent: function(components, value, added, removed) {
          var last = components[components.length - 1];
          if (last && last.added === added && last.removed === removed) {
            components[components.length - 1] = {
              value: this.join(last.value, value),
              added: added,
              removed: removed
            };
          } else {
            components.push({
              value: value,
              added: added,
              removed: removed
            });
          }
        },
        extractCommon: function(basePath, newString, oldString, diagonalPath) {
          var newLen = newString.length, oldLen = oldString.length, newPos = basePath.newPos, oldPos = newPos - diagonalPath;
          while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
            newPos++;
            oldPos++;
            this.pushComponent(basePath.components, newString[newPos], undefined, undefined);
          }
          basePath.newPos = newPos;
          return oldPos;
        },
        equals: function(left, right) {
          var reWhitespace = /\S/;
          if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {
            return true;
          } else {
            return left === right;
          }
        },
        join: function(left, right) {
          return left + right;
        },
        tokenize: function(value) {
          return value;
        }
      };
      var CharDiff = new Diff;
      var WordDiff = new Diff(true);
      var WordWithSpaceDiff = new Diff;
      WordDiff.tokenize = WordWithSpaceDiff.tokenize = function(value) {
        return removeEmpty(value.split(/(\s+|\b)/));
      };
      var CssDiff = new Diff(true);
      CssDiff.tokenize = function(value) {
        return removeEmpty(value.split(/([{}:;,]|\s+)/));
      };
      var LineDiff = new Diff;
      LineDiff.tokenize = function(value) {
        var retLines = [], lines = value.split(/^/m);
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i], lastLine = lines[i - 1];
          if (line == "\n" && lastLine && lastLine[lastLine.length - 1] === "\r") {
            retLines[retLines.length - 1] += "\n";
          } else if (line) {
            retLines.push(line);
          }
        }
        return retLines;
      };
      return {
        Diff: Diff,
        diffChars: function(oldStr, newStr) {
          return CharDiff.diff(oldStr, newStr);
        },
        diffWords: function(oldStr, newStr) {
          return WordDiff.diff(oldStr, newStr);
        },
        diffWordsWithSpace: function(oldStr, newStr) {
          return WordWithSpaceDiff.diff(oldStr, newStr);
        },
        diffLines: function(oldStr, newStr) {
          return LineDiff.diff(oldStr, newStr);
        },
        diffCss: function(oldStr, newStr) {
          return CssDiff.diff(oldStr, newStr);
        },
        createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {
          var ret = [];
          ret.push("Index: " + fileName);
          ret.push("===================================================================");
          ret.push("--- " + fileName + (typeof oldHeader === "undefined" ? "" : "	" + oldHeader));
          ret.push("+++ " + fileName + (typeof newHeader === "undefined" ? "" : "	" + newHeader));
          var diff = LineDiff.diff(oldStr, newStr);
          if (!diff[diff.length - 1].value) {
            diff.pop();
          }
          diff.push({
            value: "",
            lines: []
          });
          function contextLines(lines) {
            return lines.map(function(entry) {
              return " " + entry;
            });
          }
          function eofNL(curRange, i, current) {
            var last = diff[diff.length - 2], isLast = i === diff.length - 2, isLastOfType = i === diff.length - 3 && (current.added !== last.added || current.removed !== last.removed);
            if (!/\n$/.test(current.value) && (isLast || isLastOfType)) {
              curRange.push("\\ No newline at end of file");
            }
          }
          var oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
          for (var i = 0; i < diff.length; i++) {
            var current = diff[i], lines = current.lines || current.value.replace(/\n$/, "").split("\n");
            current.lines = lines;
            if (current.added || current.removed) {
              if (!oldRangeStart) {
                var prev = diff[i - 1];
                oldRangeStart = oldLine;
                newRangeStart = newLine;
                if (prev) {
                  curRange = contextLines(prev.lines.slice(-4));
                  oldRangeStart -= curRange.length;
                  newRangeStart -= curRange.length;
                }
              }
              curRange.push.apply(curRange, lines.map(function(entry) {
                return (current.added ? "+" : "-") + entry;
              }));
              eofNL(curRange, i, current);
              if (current.added) {
                newLine += lines.length;
              } else {
                oldLine += lines.length;
              }
            } else {
              if (oldRangeStart) {
                if (lines.length <= 8 && i < diff.length - 2) {
                  curRange.push.apply(curRange, contextLines(lines));
                } else {
                  var contextSize = Math.min(lines.length, 4);
                  ret.push("@@ -" + oldRangeStart + "," + (oldLine - oldRangeStart + contextSize) + " +" + newRangeStart + "," + (newLine - newRangeStart + contextSize) + " @@");
                  ret.push.apply(ret, curRange);
                  ret.push.apply(ret, contextLines(lines.slice(0, contextSize)));
                  if (lines.length <= 4) {
                    eofNL(ret, i, current);
                  }
                  oldRangeStart = 0;
                  newRangeStart = 0;
                  curRange = [];
                }
              }
              oldLine += lines.length;
              newLine += lines.length;
            }
          }
          return ret.join("\n") + "\n";
        },
        applyPatch: function(oldStr, uniDiff) {
          var diffstr = uniDiff.split("\n");
          var diff = [];
          var remEOFNL = false, addEOFNL = false;
          for (var i = diffstr[0][0] === "I" ? 4 : 0; i < diffstr.length; i++) {
            if (diffstr[i][0] === "@") {
              var meh = diffstr[i].split(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
              diff.unshift({
                start: meh[3],
                oldlength: meh[2],
                oldlines: [],
                newlength: meh[4],
                newlines: []
              });
            } else if (diffstr[i][0] === "+") {
              diff[0].newlines.push(diffstr[i].substr(1));
            } else if (diffstr[i][0] === "-") {
              diff[0].oldlines.push(diffstr[i].substr(1));
            } else if (diffstr[i][0] === " ") {
              diff[0].newlines.push(diffstr[i].substr(1));
              diff[0].oldlines.push(diffstr[i].substr(1));
            } else if (diffstr[i][0] === "\\") {
              if (diffstr[i - 1][0] === "+") {
                remEOFNL = true;
              } else if (diffstr[i - 1][0] === "-") {
                addEOFNL = true;
              }
            }
          }
          var str = oldStr.split("\n");
          for (var i = diff.length - 1; i >= 0; i--) {
            var d = diff[i];
            for (var j = 0; j < d.oldlength; j++) {
              if (str[d.start - 1 + j] !== d.oldlines[j]) {
                return false;
              }
            }
            Array.prototype.splice.apply(str, [ d.start - 1, +d.oldlength ].concat(d.newlines));
          }
          if (remEOFNL) {
            while (!str[str.length - 1]) {
              str.pop();
            }
          } else if (addEOFNL) {
            str.push("");
          }
          return str.join("\n");
        },
        convertChangesToXML: function(changes) {
          var ret = [];
          for (var i = 0; i < changes.length; i++) {
            var change = changes[i];
            if (change.added) {
              ret.push("<ins>");
            } else if (change.removed) {
              ret.push("<del>");
            }
            ret.push(escapeHTML(change.value));
            if (change.added) {
              ret.push("</ins>");
            } else if (change.removed) {
              ret.push("</del>");
            }
          }
          return ret.join("");
        },
        convertChangesToDMP: function(changes) {
          var ret = [], change;
          for (var i = 0; i < changes.length; i++) {
            change = changes[i];
            ret.push([ change.added ? 1 : change.removed ? -1 : 0, change.value ]);
          }
          return ret;
        }
      };
    }();
    if (typeof module !== "undefined") {
      module.exports = JsDiff;
    }
  },
  "5.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./4.js");
    var namespace = this.path;
    var Class = basis.Class;
    var cleaner = basis.cleaner;
    var values = basis.object.values;
    var $self = basis.fn.$self;
    var Emitter = basis.event.Emitter;
    var createEvent = basis.event.create;
    var events = basis.event.events;
    var NULL_OBJECT = {};
    var EMPTY_ARRAY = [];
    var STATE_EXISTS = {};
    var STATE = {
      priority: [],
      values: {},
      add: function(state, order) {
        var name = state;
        var value = state.toLowerCase();
        STATE[name] = value;
        STATE_EXISTS[value] = name;
        this.values[value] = name;
        if (order) order = this.priority.indexOf(order); else order = -1;
        if (order == -1) this.priority.push(value); else this.priority.splice(order, 0, value);
      },
      getList: function() {
        return values(STATE_EXISTS);
      }
    };
    STATE.add("READY");
    STATE.add("DEPRECATED");
    STATE.add("UNDEFINED");
    STATE.add("ERROR");
    STATE.add("PROCESSING");
    var subscriptionConfig = {};
    var subscriptionSeed = 1;
    var SUBSCRIPTION = {
      NONE: 0,
      ALL: 0,
      link: function(type, from, to) {
        var subscriberId = type + from.basisObjectId;
        var subscribers = to.subscribers_;
        if (!subscribers) subscribers = to.subscribers_ = {};
        if (!subscribers[subscriberId]) {
          subscribers[subscriberId] = from;
          var count = to.subscriberCount += 1;
          if (count == 1) to.emit_subscribersChanged(+1);
        } else {
          basis.dev.warn("Attempt to add duplicate subscription");
        }
      },
      unlink: function(type, from, to) {
        var subscriberId = type + from.basisObjectId;
        var subscribers = to.subscribers_;
        if (subscribers && subscribers[subscriberId]) {
          delete subscribers[subscriberId];
          var count = to.subscriberCount -= 1;
          if (count == 0) {
            to.emit_subscribersChanged(-1);
            to.subscribers_ = null;
          }
        } else {
          basis.dev.warn("Trying remove non-exists subscription");
        }
      },
      add: function(name, handler, action) {
        subscriptionConfig[subscriptionSeed] = {
          handler: handler,
          action: action
        };
        SUBSCRIPTION[name] = subscriptionSeed;
        SUBSCRIPTION.ALL |= subscriptionSeed;
        subscriptionSeed <<= 1;
      },
      addProperty: function(propertyName, eventName) {
        var handler = {};
        handler[eventName || propertyName + "Changed"] = function(object, oldValue) {
          if (oldValue) SUBSCRIPTION.unlink(propertyName, object, oldValue);
          if (object[propertyName]) SUBSCRIPTION.link(propertyName, object, object[propertyName]);
        };
        this.add(propertyName.toUpperCase(), handler, function(fn, object) {
          if (object[propertyName]) fn(propertyName, object, object[propertyName]);
        });
      }
    };
    var maskConfig = {};
    function mixFunctions(fnA, fnB) {
      return function() {
        fnA.apply(this, arguments);
        fnB.apply(this, arguments);
      };
    }
    function getMaskConfig(mask) {
      var config = maskConfig[mask];
      if (!config) {
        var actions = [];
        var handler = {};
        var idx = 1;
        config = maskConfig[mask] = {
          actions: actions,
          handler: handler
        };
        while (mask) {
          if (mask & 1) {
            var cfg = subscriptionConfig[idx];
            actions.push(cfg.action);
            for (var key in cfg.handler) handler[key] = handler[key] ? mixFunctions(handler[key], cfg.handler[key]) : cfg.handler[key];
          }
          idx <<= 1;
          mask >>= 1;
        }
      }
      return config;
    }
    function addSub(object, mask) {
      var config = getMaskConfig(mask);
      for (var i = 0, action; action = config.actions[i]; i++) action(SUBSCRIPTION.link, object);
      object.addHandler(config.handler);
    }
    function remSub(object, mask) {
      var config = getMaskConfig(mask);
      for (var i = 0, action; action = config.actions[i++]; ) action(SUBSCRIPTION.unlink, object);
      object.removeHandler(config.handler);
    }
    SUBSCRIPTION.addProperty("delegate");
    SUBSCRIPTION.addProperty("target");
    SUBSCRIPTION.addProperty("dataset");
    var AbstractData = Class(Emitter, {
      className: namespace + ".AbstractData",
      state: STATE.UNDEFINED,
      emit_stateChanged: createEvent("stateChanged", "oldState"),
      active: false,
      emit_activeChanged: createEvent("activeChanged"),
      subscribeTo: SUBSCRIPTION.NONE,
      subscriberCount: 0,
      subscribers_: null,
      emit_subscribersChanged: createEvent("subscribersChanged", "delta"),
      syncEvents: Class.oneFunctionProperty(function() {
        if (this.isSyncRequired()) this.syncAction();
      }, {
        stateChanged: true,
        subscribersChanged: true
      }),
      syncAction: null,
      init: function() {
        Emitter.prototype.init.call(this);
        if (this.active) this.addHandler(getMaskConfig(this.subscribeTo).handler);
        var syncAction = this.syncAction;
        if (syncAction) {
          this.syncAction = null;
          this.setSyncAction(syncAction);
        }
      },
      setState: function(state, data) {
        var stateCode = String(state);
        if (!STATE_EXISTS[stateCode]) throw new Error("Wrong state value");
        if (this.state != stateCode || this.state.data != data) {
          var oldState = this.state;
          this.state = Object(stateCode);
          this.state.data = data;
          this.emit_stateChanged(oldState);
          return true;
        }
        return false;
      },
      deprecate: function() {
        if (this.state != STATE.PROCESSING) this.setState(STATE.DEPRECATED);
      },
      setActive: function(isActive) {
        isActive = !!isActive;
        if (this.active != isActive) {
          this.active = isActive;
          this.emit_activeChanged();
          if (isActive) addSub(this, this.subscribeTo); else remSub(this, this.subscribeTo);
          return true;
        }
        return false;
      },
      setSubscription: function(subscriptionType) {
        var curSubscriptionType = this.subscribeTo;
        var newSubscriptionType = subscriptionType & SUBSCRIPTION.ALL;
        var delta = curSubscriptionType ^ newSubscriptionType;
        if (delta) {
          this.subscribeTo = newSubscriptionType;
          if (this.active) {
            var curConfig = getMaskConfig(curSubscriptionType);
            var newConfig = getMaskConfig(newSubscriptionType);
            this.removeHandler(curConfig.handler);
            this.addHandler(newConfig.handler);
            var idx = 1;
            while (delta) {
              if (delta & 1) {
                var cfg = subscriptionConfig[idx];
                if (curSubscriptionType & idx) cfg.action(SUBSCRIPTION.unlink, this); else cfg.action(SUBSCRIPTION.link, this);
              }
              idx <<= 1;
              delta >>= 1;
            }
          }
          return true;
        }
        return false;
      },
      isSyncRequired: function() {
        return this.subscriberCount > 0 && (this.state == STATE.UNDEFINED || this.state == STATE.DEPRECATED);
      },
      setSyncAction: function(syncAction) {
        var oldAction = this.syncAction;
        if (typeof syncAction != "function") syncAction = null;
        this.syncAction = syncAction;
        if (syncAction) {
          if (!oldAction) this.addHandler(this.syncEvents);
          if (this.isSyncRequired()) this.syncAction();
        } else {
          if (oldAction) this.removeHandler(this.syncEvents);
        }
      },
      destroy: function() {
        Emitter.prototype.destroy.call(this);
        if (this.active) {
          var config = getMaskConfig(this.subscribeTo);
          for (var i = 0, action; action = config.actions[i]; i++) action(SUBSCRIPTION.unlink, this);
        }
        this.state = STATE.UNDEFINED;
      }
    });
    var computeFunctions = {};
    var valueSetters = {};
    var valueSyncToken = function(value) {
      this.set(this.fn(value));
    };
    var VALUE_EMMITER_HANDLER = {
      destroy: function(object) {
        this.value.unlink(object, this.fn);
      }
    };
    var VALUE_EMMITER_DESTROY_HANDLER = {
      destroy: function(object) {
        this.set(null);
      }
    };
    var Value = Class(AbstractData, {
      className: namespace + ".Value",
      emit_change: createEvent("change", "oldValue") && function(oldValue) {
        events.change.call(this, oldValue);
        var cursor = this;
        while (cursor = cursor.links_) cursor.fn.call(cursor.context, this.value, oldValue);
      },
      value: null,
      initValue: null,
      proxy: null,
      locked: false,
      lockedValue_: null,
      links_: null,
      setNullOnEmitterDestroy: true,
      bindingBridge: {
        attach: function(host, callback, context) {
          host.link(context, callback, true);
        },
        detach: function(host, callback, context) {
          host.unlink(context, callback);
        },
        get: function(host) {
          return host.value;
        }
      },
      init: function() {
        AbstractData.prototype.init.call(this);
        if (this.proxy) this.value = this.proxy(this.value);
        if (this.setNullOnEmitterDestroy && this.value instanceof Emitter) this.value.addHandler(VALUE_EMMITER_DESTROY_HANDLER, this);
        this.initValue = this.value;
      },
      set: function(value) {
        var oldValue = this.value;
        var newValue = this.proxy ? this.proxy(value) : value;
        var changed = newValue !== oldValue;
        if (changed) {
          if (this.setNullOnEmitterDestroy) {
            if (oldValue instanceof Emitter) oldValue.removeHandler(VALUE_EMMITER_DESTROY_HANDLER, this);
            if (newValue instanceof Emitter) newValue.addHandler(VALUE_EMMITER_DESTROY_HANDLER, this);
          }
          this.value = newValue;
          if (!this.locked) this.emit_change(oldValue);
        }
        return changed;
      },
      reset: function() {
        this.set(this.initValue);
      },
      lock: function() {
        if (!this.locked) {
          this.locked = true;
          this.lockedValue_ = this.value;
        }
      },
      unlock: function() {
        if (this.locked) {
          var lockedValue = this.lockedValue_;
          this.lockedValue_ = null;
          this.locked = false;
          if (this.value !== lockedValue) this.emit_change(lockedValue);
        }
      },
      compute: function(events, fn) {
        if (!fn) {
          fn = events;
          events = null;
        }
        var hostValue = this;
        var handler = basis.event.createHandler(events, function(object) {
          this.set(fn(object, hostValue.value));
        });
        var getComputeTokenId = handler.events.concat(String(fn), this.basisObjectId).join("_");
        var getComputeToken = computeFunctions[getComputeTokenId];
        if (!getComputeToken) {
          var tokenMap = {};
          handler.destroy = function(object) {
            delete tokenMap[object.basisObjectId];
            this.destroy();
          };
          this.addHandler({
            change: function() {
              for (var key in tokenMap) {
                var pair = tokenMap[key];
                pair.token.set(fn(pair.object, this.value));
              }
            },
            destroy: function() {
              for (var key in tokenMap) {
                var pair = tokenMap[key];
                pair.object.removeHandler(handler, pair.token);
                pair.token.destroy();
              }
              tokenMap = null;
              hostValue = null;
            }
          });
          getComputeToken = computeFunctions[getComputeTokenId] = function(object) {
            if (object instanceof basis.event.Emitter == false) basis.dev.warn("basis.data.Value#compute: object must be an instanceof basis.event.Emitter");
            var objectId = object.basisObjectId;
            var pair = tokenMap[objectId];
            var value = fn(object, hostValue.value);
            if (!pair) {
              var token = new basis.Token(value);
              object.addHandler(handler, token);
              pair = tokenMap[objectId] = {
                token: token,
                object: object
              };
            } else {
              pair.token.set(value);
            }
            return pair.token;
          };
          getComputeToken.deferred = function() {
            return function(object) {
              return getComputeToken(object).deferred();
            };
          };
        }
        return getComputeToken;
      },
      as: function(fn, deferred) {
        if (this.links_) {
          var cursor = this;
          while (cursor = cursor.links_) if (cursor.context instanceof basis.Token && cursor.context.fn == String(fn)) return deferred ? cursor.context.deferred() : cursor.context;
        }
        var token = new basis.Token;
        token.fn = fn;
        this.link(token, valueSyncToken);
        return deferred ? token.deferred() : token;
      },
      deferred: function(fn) {
        return this.as(fn, true);
      },
      link: function(context, fn, noApply) {
        if (typeof fn != "function") {
          var property = String(fn);
          fn = valueSetters[property];
          if (!fn) fn = valueSetters[property] = function(value) {
            this[property] = value;
          };
        }
        var cursor = this;
        while (cursor = cursor.links_) if (cursor.context === context && cursor.fn === fn) {
          basis.dev.warn(this.constructor.className + "#attach: Duplicate link pair context-fn");
          break;
        }
        this.links_ = {
          value: this,
          context: context,
          fn: fn,
          links_: this.links_
        };
        if (context instanceof Emitter) context.addHandler(VALUE_EMMITER_HANDLER, this.links_);
        if (!noApply) fn.call(context, this.value);
        return context;
      },
      unlink: function(context, fn) {
        var cursor = this;
        var prev;
        while (prev = cursor, cursor = cursor.links_) if (cursor.context === context && (!fn || cursor.fn === fn)) {
          cursor.fn = basis.fn.$undef;
          prev.links_ = cursor.links_;
          if (cursor.context instanceof Emitter) cursor.context.removeHandler(VALUE_EMMITER_HANDLER, cursor);
        }
      },
      destroy: function() {
        AbstractData.prototype.destroy.call(this);
        if (this.setNullOnEmitterDestroy && this.value instanceof Emitter) this.value.removeHandler(VALUE_EMMITER_DESTROY_HANDLER, this);
        var cursor = this;
        while (cursor = cursor.links_) if (cursor.context instanceof Emitter) cursor.context.removeHandler(VALUE_EMMITER_HANDLER, cursor);
        this.proxy = null;
        this.initValue = null;
        this.value = null;
        this.lockedValue_ = null;
        this.links_ = null;
      }
    });
    var castValueMap = {};
    Value.from = function(obj, events, getter) {
      var result;
      if (!obj) return null;
      if (obj instanceof Emitter) {
        if (!getter) {
          getter = events;
          events = null;
        }
        var handler = basis.event.createHandler(events, function(object) {
          this.set(getter(object));
        });
        var id = handler.events.concat(String(getter), obj.basisObjectId).join("_");
        result = castValueMap[id];
        if (!result) {
          getter = basis.getter(getter);
          result = castValueMap[id] = new Value({
            value: getter(obj)
          });
          handler.destroy = function(sender) {
            delete castValueMap[id];
            this.destroy();
          };
          obj.addHandler(handler, result);
        }
      }
      if (!result) {
        var id = obj.basisObjectId;
        var bindingBridge = obj.bindingBridge;
        if (id && bindingBridge) {
          result = castValueMap[id];
          if (!result) {
            result = castValueMap[id] = new Value({
              value: bindingBridge.get(obj)
            });
            bindingBridge.attach(obj, result.set, result);
          }
        }
      }
      if (!result) throw "Bad object type";
      return result;
    };
    Value.factory = function(events, getter) {
      return function(object) {
        return Value.from(object, events, getter);
      };
    };
    function isConnected(a, b) {
      while (b && b !== a && b !== b.delegate) b = b.delegate;
      return b === a;
    }
    function applyDelegateChanges(object, oldRoot, oldTarget) {
      var delegate = object.delegate;
      if (delegate) {
        object.root = delegate.root;
        object.target = delegate.target;
        object.data = delegate.data;
        object.state = delegate.state;
      }
      if (object.root !== oldRoot) {
        var rootListenHandler = object.listen.root;
        if (rootListenHandler) {
          if (oldRoot && oldRoot !== object) oldRoot.removeHandler(rootListenHandler, object);
          if (object.root && object.root !== object) object.root.addHandler(rootListenHandler, object);
        }
        object.emit_rootChanged(oldRoot);
      }
      if (object.target !== oldTarget) {
        var targetListenHandler = object.listen.target;
        if (targetListenHandler) {
          if (oldTarget && oldTarget !== object) oldTarget.removeHandler(targetListenHandler, object);
          if (object.target && object.target !== object) object.target.addHandler(targetListenHandler, object);
        }
        object.emit_targetChanged(oldTarget);
      }
      var cursor = object.delegates_;
      while (cursor) {
        if (cursor.delegate) applyDelegateChanges(cursor.delegate, oldRoot, oldTarget);
        cursor = cursor.next;
      }
    }
    var DataObject = Class(AbstractData, {
      className: namespace + ".Object",
      subscribeTo: SUBSCRIPTION.DELEGATE + SUBSCRIPTION.TARGET,
      data: null,
      emit_update: createEvent("update", "delta") && function(delta) {
        var cursor = this.delegates_;
        events.update.call(this, delta);
        while (cursor) {
          if (cursor.delegate) cursor.delegate.emit_update(delta);
          cursor = cursor.next;
        }
      },
      emit_stateChanged: function(oldState) {
        var cursor = this.delegates_;
        AbstractData.prototype.emit_stateChanged.call(this, oldState);
        while (cursor) {
          if (cursor.delegate) {
            cursor.delegate.state = this.state;
            cursor.delegate.emit_stateChanged(oldState);
          }
          cursor = cursor.next;
        }
      },
      delegate: null,
      delegates_: null,
      emit_delegateChanged: createEvent("delegateChanged", "oldDelegate"),
      target: null,
      emit_targetChanged: createEvent("targetChanged", "oldTarget"),
      root: null,
      emit_rootChanged: createEvent("rootChanged", "oldRoot"),
      init: function() {
        this.root = this;
        AbstractData.prototype.init.call(this);
        var delegate = this.delegate;
        if (delegate) {
          this.delegate = null;
          this.target = null;
          this.data = delegate.data;
          this.state = delegate.state;
          this.setDelegate(delegate);
        } else {
          if (!this.data) this.data = {};
          if (this.target !== null) this.target = this;
        }
      },
      setSyncAction: function(syncAction) {
        if (syncAction && this.delegate) basis.dev.warn(this.constructor.syncAction + " instance has a delegate and syncAction - it may produce conflics with data & state");
        AbstractData.prototype.setSyncAction.call(this, syncAction);
      },
      setDelegate: function(newDelegate) {
        if (newDelegate && newDelegate instanceof DataObject) {
          if (newDelegate.delegate && isConnected(this, newDelegate)) {
            basis.dev.warn("New delegate has already connected to object. Delegate assignment has been ignored.", this, newDelegate);
            return false;
          }
        } else {
          newDelegate = null;
        }
        if (this.delegate !== newDelegate) {
          var oldState = this.state;
          var oldData = this.data;
          var oldDelegate = this.delegate;
          var oldTarget = this.target;
          var oldRoot = this.root;
          var delta = {};
          var dataChanged = false;
          var delegateListenHandler = this.listen.delegate;
          if (oldDelegate) {
            if (delegateListenHandler) oldDelegate.removeHandler(delegateListenHandler, this);
            var cursor = oldDelegate.delegates_;
            var prev = oldDelegate;
            while (cursor) {
              if (cursor.delegate === this) {
                cursor.delegate = null;
                if (prev === oldDelegate) oldDelegate.delegates_ = cursor.next; else prev.next = cursor.next;
                break;
              }
              cursor = cursor.next;
            }
          }
          if (newDelegate) {
            this.delegate = newDelegate;
            newDelegate.delegates_ = {
              delegate: this,
              next: newDelegate.delegates_
            };
            for (var key in newDelegate.data) if (key in oldData === false) {
              dataChanged = true;
              delta[key] = undefined;
            }
            for (var key in oldData) if (oldData[key] !== newDelegate.data[key]) {
              dataChanged = true;
              delta[key] = oldData[key];
            }
            if (delegateListenHandler) newDelegate.addHandler(delegateListenHandler, this);
          } else {
            this.delegate = null;
            this.target = null;
            this.root = this;
            this.data = {};
            for (var key in oldData) this.data[key] = oldData[key];
          }
          applyDelegateChanges(this, oldRoot, oldTarget);
          if (dataChanged) this.emit_update(delta);
          if (oldState !== this.state && (String(oldState) != this.state || oldState.data !== this.state.data)) this.emit_stateChanged(oldState);
          this.emit_delegateChanged(oldDelegate);
          return true;
        }
        return false;
      },
      setState: function(state, data) {
        if (this.delegate) return this.root.setState(state, data); else return AbstractData.prototype.setState.call(this, state, data);
      },
      update: function(data) {
        if (this.delegate) return this.root.update(data);
        if (data) {
          var delta = {};
          var changed = false;
          for (var prop in data) if (this.data[prop] !== data[prop]) {
            changed = true;
            delta[prop] = this.data[prop];
            this.data[prop] = data[prop];
          }
          if (changed) {
            this.emit_update(delta);
            return delta;
          }
        }
        return false;
      },
      destroy: function() {
        AbstractData.prototype.destroy.call(this);
        var cursor = this.delegates_;
        this.delegates_ = null;
        while (cursor) {
          cursor.delegate.setDelegate();
          cursor = cursor.next;
        }
        if (this.delegate) this.setDelegate();
        this.data = NULL_OBJECT;
        this.root = null;
        this.target = null;
      }
    });
    var Slot = Class(DataObject, {
      className: namespace + ".Slot"
    });
    var KEYOBJECTMAP_MEMBER_HANDLER = {
      destroy: function() {
        delete this.map[this.itemId];
      }
    };
    var KeyObjectMap = Class(null, {
      className: namespace + ".KeyObjectMap",
      itemClass: DataObject,
      keyGetter: $self,
      map_: null,
      extendConstructor_: true,
      init: function() {
        this.map_ = {};
        cleaner.add(this);
      },
      resolve: function(object) {
        return this.get(this.keyGetter(object), object);
      },
      create: function(key, object) {
        var itemConfig = {};
        if (key instanceof DataObject) {
          itemConfig.delegate = key;
        } else {
          itemConfig.data = {
            id: key,
            title: key
          };
        }
        return new this.itemClass(itemConfig);
      },
      get: function(key, object) {
        var itemId = key instanceof DataObject ? key.basisObjectId : key;
        var item = this.map_[itemId];
        if (!item && object) {
          item = this.map_[itemId] = this.create(key, object);
          item.addHandler(KEYOBJECTMAP_MEMBER_HANDLER, {
            map: this.map_,
            itemId: itemId
          });
        }
        return item;
      },
      destroy: function() {
        cleaner.remove(this);
        var items = values(this.map_);
        for (var i = 0, item; item = items[i++]; ) item.destroy();
      }
    });
    function getDelta(inserted, deleted) {
      var delta = {};
      var result;
      if (inserted && inserted.length) result = delta.inserted = inserted;
      if (deleted && deleted.length) result = delta.deleted = deleted;
      if (result) return delta;
    }
    function getDatasetDelta(a, b) {
      if (!a || !a.itemCount) {
        if (b && b.itemCount) return {
          inserted: b.getItems()
        };
      } else {
        if (!b || !b.itemCount) {
          if (a.itemCount) return {
            deleted: a.getItems()
          };
        } else {
          var inserted = [];
          var deleted = [];
          for (var key in a.items_) {
            var item = a.items_[key];
            if (item.basisObjectId in b.items_ == false) deleted.push(item);
          }
          for (var key in b.items_) {
            var item = b.items_[key];
            if (item.basisObjectId in a.items_ == false) inserted.push(item);
          }
          return getDelta(inserted, deleted);
        }
      }
    }
    var DatasetWrapper = Class(DataObject, {
      className: namespace + ".DatasetWrapper",
      subscribeTo: DataObject.prototype.subscribeTo + SUBSCRIPTION.DATASET,
      listen: {
        dataset: {
          itemsChanged: function(dataset, delta) {
            this.itemCount = dataset.itemCount;
            this.emit_itemsChanged(delta);
          },
          destroy: function() {
            this.setDataset();
          }
        }
      },
      dataset: null,
      datasetAdapter_: null,
      emit_datasetChanged: createEvent("datasetChanged", "oldDataset"),
      emit_itemsChanged: createEvent("itemsChanged", "delta"),
      init: function() {
        DataObject.prototype.init.call(this);
        var dataset = this.dataset;
        if (dataset) {
          this.dataset = null;
          this.setDataset(dataset);
        }
      },
      setDataset: function(dataset) {
        dataset = resolveDataset(this, this.setDataset, dataset, "datasetAdapter_");
        if (this.dataset !== dataset) {
          var listenHandler = this.listen.dataset;
          var oldDataset = this.dataset;
          var delta;
          if (listenHandler) {
            if (oldDataset) oldDataset.removeHandler(listenHandler, this);
            if (dataset) dataset.addHandler(listenHandler, this);
          }
          this.itemCount = dataset ? dataset.itemCount : 0;
          if (delta = getDatasetDelta(oldDataset, dataset)) this.emit_itemsChanged(delta);
          this.dataset = dataset;
          this.emit_datasetChanged(oldDataset);
        }
      },
      has: function(object) {
        return this.dataset ? this.dataset.has(object) : null;
      },
      getItems: function() {
        return this.dataset ? this.dataset.getItems() : [];
      },
      pick: function() {
        return this.dataset ? this.dataset.pick() : null;
      },
      top: function(count) {
        return this.dataset ? this.dataset.top(count) : [];
      },
      forEach: function(fn) {
        if (this.dataset) return this.dataset.forEach(fn);
      },
      destroy: function() {
        if (this.dataset || this.datasetAdapter_) this.setDataset();
        DataObject.prototype.destroy.call(this);
      }
    });
    var AbstractDataset = Class(AbstractData, {
      className: namespace + ".AbstractDataset",
      itemCount: 0,
      items_: null,
      members_: null,
      cache_: null,
      emit_itemsChanged: createEvent("itemsChanged", "delta") && function(delta) {
        var items;
        var insertCount = 0;
        var deleteCount = 0;
        var object;
        if (items = delta.inserted) {
          while (object = items[insertCount]) {
            this.items_[object.basisObjectId] = object;
            insertCount++;
          }
        }
        if (items = delta.deleted) {
          while (object = items[deleteCount]) {
            delete this.items_[object.basisObjectId];
            deleteCount++;
          }
        }
        this.itemCount += insertCount - deleteCount;
        this.cache_ = insertCount == this.itemCount ? delta.inserted : null;
        events.itemsChanged.call(this, delta);
      },
      init: function() {
        AbstractData.prototype.init.call(this);
        this.members_ = {};
        this.items_ = {};
      },
      has: function(object) {
        return !!(object && this.items_[object.basisObjectId]);
      },
      getItems: function() {
        if (!this.cache_) this.cache_ = values(this.items_);
        return this.cache_;
      },
      pick: function() {
        for (var objectId in this.items_) return this.items_[objectId];
        return null;
      },
      top: function(count) {
        var result = [];
        if (count) for (var objectId in this.items_) if (result.push(this.items_[objectId]) >= count) break;
        return result;
      },
      forEach: function(fn) {
        var items = this.getItems();
        for (var i = 0; i < items.length; i++) fn(items[i]);
      },
      clear: function() {},
      destroy: function() {
        this.clear();
        AbstractData.prototype.destroy.call(this);
        this.cache_ = EMPTY_ARRAY;
        this.itemCount = 0;
        this.members_ = null;
        this.items_ = null;
      }
    });
    var Dataset = Class(AbstractDataset, {
      className: namespace + ".Dataset",
      listen: {
        item: {
          destroy: function(object) {
            this.remove([ object ]);
          }
        }
      },
      init: function() {
        AbstractDataset.prototype.init.call(this);
        var items = this.items;
        if (items) {
          this.items = null;
          this.set(items);
        }
      },
      add: function(items) {
        var memberMap = this.members_;
        var listenHandler = this.listen.item;
        var inserted = [];
        var delta;
        if (items && !Array.isArray(items)) items = [ items ];
        for (var i = 0; i < items.length; i++) {
          var object = items[i];
          if (object instanceof DataObject) {
            var objectId = object.basisObjectId;
            if (!memberMap[objectId]) {
              memberMap[objectId] = object;
              if (listenHandler) object.addHandler(listenHandler, this);
              inserted.push(object);
            }
          } else {
            basis.dev.warn("Wrong data type: value must be an instance of basis.data.Object");
          }
        }
        if (inserted.length) {
          this.emit_itemsChanged(delta = {
            inserted: inserted
          });
        }
        return delta;
      },
      remove: function(items) {
        var memberMap = this.members_;
        var listenHandler = this.listen.item;
        var deleted = [];
        var delta;
        if (items && !Array.isArray(items)) items = [ items ];
        for (var i = 0; i < items.length; i++) {
          var object = items[i];
          if (object instanceof DataObject) {
            var objectId = object.basisObjectId;
            if (memberMap[objectId]) {
              if (listenHandler) object.removeHandler(listenHandler, this);
              delete memberMap[objectId];
              deleted.push(object);
            }
          } else {
            basis.dev.warn("Wrong data type: value must be an instance of basis.data.Object");
          }
        }
        if (deleted.length) {
          this.emit_itemsChanged(delta = {
            deleted: deleted
          });
        }
        return delta;
      },
      set: function(items) {
        if (!this.itemCount) return this.add(items);
        if (!items || !items.length) return this.clear();
        var memberMap = this.members_;
        var listenHandler = this.listen.item;
        var exists = {};
        var deleted = [];
        var inserted = [];
        var object;
        var objectId;
        var delta;
        for (var i = 0; i < items.length; i++) {
          object = items[i];
          if (object instanceof DataObject) {
            objectId = object.basisObjectId;
            exists[objectId] = object;
            if (!memberMap[objectId]) {
              memberMap[objectId] = object;
              if (listenHandler) object.addHandler(listenHandler, this);
              inserted.push(object);
            }
          } else {
            basis.dev.warn("Wrong data type: value must be an instance of basis.data.Object");
          }
        }
        for (var objectId in memberMap) {
          if (!exists[objectId]) {
            object = memberMap[objectId];
            if (listenHandler) object.removeHandler(listenHandler, this);
            delete memberMap[objectId];
            deleted.push(object);
          }
        }
        if (delta = getDelta(inserted, deleted)) this.emit_itemsChanged(delta);
        return delta;
      },
      sync: function(items) {
        var delta = this.set(items) || {};
        var deleted = delta.deleted;
        Dataset.setAccumulateState(true);
        if (deleted) for (var i = 0, object; object = deleted[i]; i++) object.destroy();
        Dataset.setAccumulateState(false);
        return delta.inserted;
      },
      clear: function() {
        var deleted = this.getItems();
        var listenHandler = this.listen.item;
        var delta;
        if (deleted.length) {
          if (listenHandler) for (var i = 0; i < deleted.length; i++) deleted[i].removeHandler(listenHandler, this);
          this.emit_itemsChanged(delta = {
            deleted: deleted
          });
          this.members_ = {};
        }
        return delta;
      }
    });
    var DatasetAdapter = function(context, fn, source, handler) {
      this.context = context;
      this.fn = fn;
      this.source = source;
      this.handler = handler;
    };
    DatasetAdapter.prototype.adapter_ = null;
    DatasetAdapter.prototype.proxy = function() {
      this.fn.call(this.context, this.source);
    };
    var DATASETWRAPPER_ADAPTER_HANDLER = {
      datasetChanged: function(wrapper) {
        this.fn.call(this.context, wrapper);
      },
      destroy: function() {
        this.fn.call(this.context, null);
      }
    };
    var VALUE_ADAPTER_HANDLER = {
      change: function(value) {
        this.fn.call(this.context, value);
      },
      destroy: function() {
        this.fn.call(this.context, null);
      }
    };
    function resolveDataset(context, fn, source, property) {
      var oldAdapter = context[property] || null;
      var newAdapter = null;
      if (typeof source == "function") source = source.call(context, context);
      if (source instanceof DatasetWrapper) {
        newAdapter = new DatasetAdapter(context, fn, source, DATASETWRAPPER_ADAPTER_HANDLER);
        source = source.dataset;
      }
      if (source instanceof basis.Token) source = Value.from(source);
      if (source instanceof Value) {
        newAdapter = new DatasetAdapter(context, fn, source, VALUE_ADAPTER_HANDLER);
        source = resolveDataset(newAdapter, newAdapter.proxy, source.value, "adapter_");
      }
      if (source instanceof AbstractDataset == false) source = null;
      if (property && oldAdapter !== newAdapter) {
        if (oldAdapter) {
          oldAdapter.source.removeHandler(oldAdapter.handler, oldAdapter);
          if (oldAdapter.adapter_) resolveDataset(oldAdapter, null, null, "adapter_");
        }
        if (newAdapter) newAdapter.source.addHandler(newAdapter.handler, newAdapter);
        context[property] = newAdapter;
      }
      return source;
    }
    Dataset.setAccumulateState = function() {
      var proto = AbstractDataset.prototype;
      var realEvent = proto.emit_itemsChanged;
      var setStateCount = 0;
      var urgentTimer;
      var eventCache = {};
      function flushCache(cache) {
        var dataset = cache.dataset;
        realEvent.call(dataset, cache);
      }
      function flushAllDataset() {
        var eventCacheCopy = eventCache;
        eventCache = {};
        for (var datasetId in eventCacheCopy) flushCache(eventCacheCopy[datasetId]);
      }
      function storeDatasetDelta(delta) {
        var dataset = this;
        var datasetId = dataset.basisObjectId;
        var inserted = delta.inserted;
        var deleted = delta.deleted;
        var cache = eventCache[datasetId];
        if (inserted && deleted) {
          if (cache) {
            delete eventCache[datasetId];
            flushCache(cache);
          }
          realEvent.call(dataset, delta);
          return;
        }
        var mode = inserted ? "inserted" : "deleted";
        if (cache) {
          var array = cache[mode];
          if (!array) flushCache(cache); else {
            array.push.apply(array, inserted || deleted);
            return;
          }
        }
        eventCache[datasetId] = delta;
        delta.dataset = dataset;
      }
      function urgentFlush() {
        urgentTimer = null;
        if (setStateCount) {
          basis.dev.warn("(debug) Urgent flush dataset changes");
          setStateCount = 0;
          setAccumulateStateOff();
        }
      }
      function setAccumulateStateOff() {
        proto.emit_itemsChanged = realEvent;
        flushAllDataset();
      }
      return function(state) {
        if (state) {
          if (setStateCount == 0) {
            proto.emit_itemsChanged = storeDatasetDelta;
            if (!urgentTimer) urgentTimer = basis.setImmediate(urgentFlush);
          }
          setStateCount++;
        } else {
          setStateCount -= setStateCount > 0;
          if (setStateCount == 0) setAccumulateStateOff();
        }
      };
    }();
    function wrapData(data) {
      if (Array.isArray(data)) return data.map(function(item) {
        return {
          data: item
        };
      }); else return {
        data: data
      };
    }
    function wrapObject(data) {
      if (!data || data.constructor !== Object) data = {
        value: data
      };
      return new DataObject({
        data: data
      });
    }
    function wrap(value, retObject) {
      var wrapper = retObject ? wrapObject : wrapData;
      return Array.isArray(value) ? value.map(wrapper) : wrapper(value);
    }
    module.exports = {
      STATE: STATE,
      SUBSCRIPTION: SUBSCRIPTION,
      AbstractData: AbstractData,
      Value: Value,
      Object: DataObject,
      Slot: Slot,
      KeyObjectMap: KeyObjectMap,
      AbstractDataset: AbstractDataset,
      Dataset: Dataset,
      DatasetWrapper: DatasetWrapper,
      DatasetAdapter: DatasetAdapter,
      isConnected: isConnected,
      getDatasetDelta: getDatasetDelta,
      resolveDataset: resolveDataset,
      wrapData: wrapData,
      wrapObject: wrapObject,
      wrap: wrap
    };
  },
  "6.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./4.js");
    basis.require("./5.js");
    var namespace = this.path;
    var Class = basis.Class;
    var complete = basis.object.complete;
    var arrayFrom = basis.array;
    var arrayRemove = basis.array.remove;
    var $undef = basis.fn.$undef;
    var getter = basis.getter;
    var nullGetter = basis.fn.nullGetter;
    var oneFunctionProperty = Class.oneFunctionProperty;
    var createEvent = basis.event.create;
    var events = basis.event.events;
    var SUBSCRIPTION = basis.data.SUBSCRIPTION;
    var STATE = basis.data.STATE;
    var AbstractData = basis.data.AbstractData;
    var DataObject = basis.data.Object;
    var AbstractDataset = basis.data.AbstractDataset;
    var Dataset = basis.data.Dataset;
    var DatasetWrapper = basis.data.DatasetWrapper;
    var EXCEPTION_CANT_INSERT = namespace + ": Node can't be inserted at specified point in hierarchy";
    var EXCEPTION_NODE_NOT_FOUND = namespace + ": Node was not found";
    var EXCEPTION_BAD_CHILD_CLASS = namespace + ": Child node has wrong class";
    var EXCEPTION_NULL_CHILD = namespace + ": Child node is null";
    var EXCEPTION_DATASOURCE_CONFLICT = namespace + ": Operation is not allowed because node is under dataSource control";
    var EXCEPTION_DATASOURCEADAPTER_CONFLICT = namespace + ": Operation is not allowed because node is under dataSource adapter control";
    var EXCEPTION_PARENTNODE_OWNER_CONFLICT = namespace + ": Node can't has owner and parentNode";
    var EXCEPTION_NO_CHILDCLASS = namespace + ": Node can't has children and dataSource as childClass isn't specified";
    var DELEGATE = {
      ANY: true,
      NONE: false,
      PARENT: "parent",
      OWNER: "owner"
    };
    var childNodesDatasetMap = {};
    function warnOnDataSourceItemNodeDestoy() {
      basis.dev.warn(namespace + ": node can't be destroyed as representing dataSource item, destroy delegate item or remove it from dataSource first");
    }
    function warnOnAutoSatelliteOwnerChange() {
      basis.dev.warn(namespace + ": satellite can't change owner as it auto-satellite");
    }
    function warnOnAutoSatelliteDestoy() {
      basis.dev.warn(namespace + ": satellite can't be destroyed as it auto-create satellite, and could be destroyed on owner destroy");
    }
    function lockDataSourceItemNode(node) {
      node.setDelegate = basis.fn.$undef;
      node.destroy = warnOnDataSourceItemNodeDestoy;
    }
    function unlockDataSourceItemNode(node) {
      var proto = node.constructor.prototype;
      node.setDelegate = proto.setDelegate;
      node.destroy = proto.destroy;
    }
    function sortingSearch(node) {
      return node.sortingValue || 0;
    }
    function sortAsc(a, b) {
      a = a.sortingValue || 0;
      b = b.sortingValue || 0;
      return +(a > b) || -(a < b);
    }
    function sortDesc(a, b) {
      a = a.sortingValue || 0;
      b = b.sortingValue || 0;
      return -(a > b) || +(a < b);
    }
    function sortChildNodes(obj) {
      return obj.childNodes.sort(obj.sortingDesc ? sortDesc : sortAsc);
    }
    function binarySearchPos(array, value, getter_, desc) {
      if (!array.length) return 0;
      desc = !!desc;
      var pos;
      var compareValue;
      var l = 0;
      var r = array.length - 1;
      do {
        pos = l + r >> 1;
        compareValue = getter_(array[pos]);
        if (desc ? value > compareValue : value < compareValue) r = pos - 1; else if (desc ? value < compareValue : value > compareValue) l = pos + 1; else return value == compareValue ? pos : 0;
      } while (l <= r);
      return pos + (compareValue < value ^ desc);
    }
    function updateNodeContextSelection(root, oldSelection, newSelection, rootUpdate, ignoreRootSelection) {
      if (oldSelection === newSelection) return;
      var nextNode;
      var cursor = root;
      var selected = [];
      if (rootUpdate) {
        root.contextSelection = newSelection;
        if (root.selected) selected.push(root);
      }
      while (cursor) {
        nextNode = !cursor.selection || ignoreRootSelection && cursor === root ? cursor.firstChild : null;
        if (nextNode && nextNode.contextSelection !== oldSelection) throw "Try change wrong context selection";
        while (!nextNode) {
          if (cursor === root) {
            if (selected.length) {
              if (oldSelection) oldSelection.remove(selected);
              if (newSelection) newSelection.add(selected);
            }
            return;
          }
          nextNode = cursor.nextSibling;
          if (!nextNode) cursor = cursor.parentNode;
        }
        cursor = nextNode;
        if (cursor.selected) selected.push(cursor);
        cursor.contextSelection = newSelection;
      }
    }
    function updateNodeDisableContext(node, disabled) {
      if (node.contextDisabled != disabled) {
        node.contextDisabled = disabled;
        if (node.disabled) return;
        if (disabled) node.emit_disable(); else node.emit_enable();
      }
    }
    SUBSCRIPTION.addProperty("owner");
    SUBSCRIPTION.addProperty("dataSource");
    function processSatelliteConfig(value) {
      if (!value) return null;
      if (value.isSatelliteConfig) return value;
      if (value instanceof AbstractNode) return value;
      if (Class.isClass(value)) value = {
        instanceOf: value
      };
      if (value && value.constructor === Object) {
        var handlerRequired = false;
        var config = {
          isSatelliteConfig: true
        };
        var instanceClass;
        for (var key in value) switch (key) {
          case "instance":
            if (value[key] instanceof AbstractNode) config[key] = value[key]; else {
              basis.dev.warn(namespace + ": `instance` value in satellite config must be an instance of basis.dom.wrapper.AbstractNode");
            }
            break;
          case "instanceOf":
            if (Class.isClass(value[key]) && value[key].isSubclassOf(AbstractNode)) instanceClass = value[key]; else {
              basis.dev.warn(namespace + ": `instanceOf` value in satellite config must be a subclass of basis.dom.wrapper.AbstractNode");
            }
            break;
          case "existsIf":
          case "delegate":
          case "dataSource":
            handlerRequired = true;
            config[key] = getter(value[key]);
            break;
          case "config":
            config[key] = value[key];
            break;
        }
        if (!config.instance) config.instanceOf = instanceClass || AbstractNode; else {
          if (instanceClass) basis.dev.warn(namespace + ": `instanceOf` can't be set with `instance` value in satellite config, value ignored");
        }
        if (handlerRequired) {
          var events = "events" in value ? value.events : "update";
          if ("hook" in value) {
            if ("events" in value == false) {
              basis.dev.warn(namespace + ": hook property in satellite config is deprecated, use events property instead");
              events = basis.object.keys(value.hook);
            } else {
              basis.dev.warn(namespace + ": hook property in satellite config was ignored (events property used)");
            }
          }
          if (Array.isArray(events)) events = events.join(" ");
          if (typeof events == "string") {
            var handler = {};
            events = events.split(/\s+/);
            for (var i = 0, eventName; eventName = events[i]; i++) {
              handler[eventName] = SATELLITE_UPDATE;
              config.handler = handler;
            }
          }
        }
        return config;
      }
      return null;
    }
    function extendSatelliteConfig(result, extend) {
      for (var name in extend) result[name] = processSatelliteConfig(extend[name]);
    }
    function applySatellites(node, satellites) {
      for (var name in satellites) if (satellites[name] && typeof satellites[name] == "object") node.setSatellite(name, satellites[name]);
    }
    var NULL_SATELLITE_CONFIG = Class.customExtendProperty({}, function(result, extend) {
      for (var key in extend) {
        basis.dev.warn("basis.dom.wrapper.AbstractNode#satelliteConfig is deprecated now, use basis.dom.wrapper.AbstractNode#satellite instead");
        break;
      }
      extendSatelliteConfig(result, extend);
    });
    var NULL_SATELLITE = Class.customExtendProperty({}, extendSatelliteConfig);
    var SATELLITE_UPDATE = function(owner) {
      var name = this.name;
      var config = this.config;
      var exists = !config.existsIf || config.existsIf(owner);
      var satellite = owner.satellite[name];
      if (exists) {
        if (satellite) {
          if (config.delegate) satellite.setDelegate(config.delegate(owner));
          if (config.dataSource) satellite.setDataSource(config.dataSource(owner));
        } else {
          satellite = config.instance;
          if (!satellite) {
            var satelliteConfig = (typeof config.config == "function" ? config.config(owner) : config.config) || {};
            satelliteConfig.owner = owner;
            if (config.delegate) {
              satelliteConfig.autoDelegate = false;
              satelliteConfig.delegate = config.delegate(owner);
            }
            if (config.dataSource) satelliteConfig.dataSource = config.dataSource(owner);
            satellite = new config.instanceOf(satelliteConfig);
            satellite.destroy = warnOnAutoSatelliteDestoy;
            if (owner.listen && owner.listen.satellite) satellite.addHandler(owner.listen && owner.listen.satellite, owner);
          } else {
            if (config.delegate) satellite.setDelegate(config.delegate(owner));
            if (config.dataSource) satellite.setDataSource(config.dataSource(owner));
          }
          owner.satellite.__auto__[name].instance = satellite;
          owner.setSatellite(name, satellite, true);
        }
      } else {
        if (satellite) {
          if (config.instance) {
            if (config.delegate) satellite.setDelegate();
            if (config.dataSource) satellite.setDataSource();
          }
          owner.satellite.__auto__[name].instance = null;
          owner.setSatellite(name, null, true);
        }
      }
    };
    var AUTO_SATELLITE_INSTANCE_HANDLER = {
      destroy: function() {
        this.owner.setSatellite(this.name, null);
      }
    };
    var AbstractNode = Class(DataObject, {
      className: namespace + ".AbstractNode",
      subscribeTo: DataObject.prototype.subscribeTo + SUBSCRIPTION.DATASOURCE,
      isSyncRequired: function() {
        return this.state == STATE.UNDEFINED || this.state == STATE.DEPRECATED;
      },
      syncEvents: {
        activeChanged: false
      },
      emit_update: function(delta) {
        DataObject.prototype.emit_update.call(this, delta);
        var parentNode = this.parentNode;
        if (parentNode) {
          if (parentNode.matchFunction) this.match(parentNode.matchFunction);
          parentNode.insertBefore(this, this.nextSibling);
        }
      },
      listen: {
        owner: {
          destroy: function() {
            if (!this.ownerSatelliteName) this.setOwner();
          }
        }
      },
      autoDelegate: DELEGATE.NONE,
      name: null,
      childNodes: null,
      emit_childNodesModified: createEvent("childNodesModified", "delta") && function(delta) {
        events.childNodesModified.call(this, delta);
        var listen = this.listen.childNode;
        var array;
        if (listen) {
          if (array = delta.inserted) for (var i = 0, child; child = array[i]; i++) child.addHandler(listen, this);
          if (array = delta.deleted) for (var i = 0, child; child = array[i]; i++) child.removeHandler(listen, this);
        }
      },
      childNodesState: STATE.UNDEFINED,
      emit_childNodesStateChanged: createEvent("childNodesStateChanged", "oldState"),
      childClass: AbstractNode,
      dataSource: null,
      emit_dataSourceChanged: createEvent("dataSourceChanged", "oldDataSource"),
      dataSourceAdapter_: null,
      dataSourceMap_: null,
      destroyDataSourceMember: true,
      parentNode: null,
      nextSibling: null,
      previousSibling: null,
      firstChild: null,
      lastChild: null,
      sorting: nullGetter,
      sortingDesc: false,
      emit_sortingChanged: createEvent("sortingChanged", "oldSorting", "oldSortingDesc"),
      groupingClass: null,
      grouping: null,
      emit_groupingChanged: createEvent("groupingChanged", "oldGrouping"),
      groupNode: null,
      groupId: NaN,
      satelliteConfig: NULL_SATELLITE_CONFIG,
      satellite: NULL_SATELLITE,
      ownerSatelliteName: null,
      emit_satelliteChanged: createEvent("satelliteChanged", "name", "oldSatellite"),
      owner: null,
      emit_ownerChanged: createEvent("ownerChanged", "oldOwner"),
      init: function() {
        DataObject.prototype.init.call(this);
        var childNodes = this.childNodes;
        var dataSource = this.dataSource;
        if (childNodes) this.childNodes = null;
        if (dataSource) this.dataSource = null;
        var grouping = this.grouping;
        if (grouping) {
          this.grouping = null;
          this.setGrouping(grouping);
        }
        if (this.childClass) {
          this.childNodes = [];
          if (dataSource) {
            this.setDataSource(dataSource);
          } else {
            if (childNodes) this.setChildNodes(childNodes);
          }
        }
        var satellites = this.satellite;
        if (this.satelliteConfig !== NULL_SATELLITE_CONFIG) {
          if (this.satelliteConfig !== this.constructor.prototype.satelliteConfig) basis.dev.warn("basis.dom.wrapper.AbstractNode#satelliteConfig is deprecated now, use basis.dom.wrapper.AbstractNode#satellite instead");
          satellites = basis.object.merge(satellites, this.satelliteConfig);
        }
        if (satellites !== NULL_SATELLITE) {
          this.satellite = NULL_SATELLITE;
          applySatellites(this, satellites);
        }
        var owner = this.owner;
        if (owner) {
          this.owner = null;
          this.setOwner(owner);
        }
      },
      setChildNodesState: function(state, data) {
        var stateCode = String(state);
        var oldState = this.childNodesState;
        if (!STATE.values[stateCode]) throw new Error("Wrong state value");
        if (oldState != stateCode || oldState.data != data) {
          this.childNodesState = Object(stateCode);
          this.childNodesState.data = data;
          this.emit_childNodesStateChanged(oldState);
        }
      },
      appendChild: function(newChild) {},
      insertBefore: function(newChild, refChild) {},
      removeChild: function(oldChild) {},
      replaceChild: function(newChild, oldChild) {},
      clear: function(alive) {},
      setChildNodes: function(nodes) {},
      setGrouping: function(grouping, alive) {},
      setSorting: function(sorting, desc) {},
      setDataSource: function(dataSource) {},
      setOwner: function(owner) {
        if (!owner || owner instanceof AbstractNode == false) owner = null;
        if (owner && this.parentNode) throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;
        var oldOwner = this.owner;
        if (oldOwner !== owner) {
          var listenHandler = this.listen.owner;
          if (oldOwner) {
            if (this.ownerSatelliteName && oldOwner.satellite.__auto__ && this.ownerSatelliteName in oldOwner.satellite.__auto__) {
              basis.dev.warn(namespace + ": auto-satellite can't change it's owner");
              return;
            }
            if (listenHandler) oldOwner.removeHandler(listenHandler, this);
            if (this.ownerSatelliteName) {
              this.owner = null;
              oldOwner.setSatellite(this.ownerSatelliteName, null);
            }
          }
          if (owner && listenHandler) owner.addHandler(listenHandler, this);
          this.owner = owner;
          this.emit_ownerChanged(oldOwner);
          if (this.autoDelegate == DELEGATE.OWNER || this.autoDelegate === DELEGATE.ANY) this.setDelegate(owner);
        }
      },
      setSatellite: function(name, satellite, autoSet) {
        var oldSatellite = this.satellite[name] || null;
        var auto = this.satellite.__auto__;
        var autoConfig = auto && auto[name];
        var preserveAuto = autoSet && autoConfig;
        if (preserveAuto) {
          satellite = autoConfig.instance;
          if (autoConfig.config.instance) {
            if (satellite) delete autoConfig.config.instance.setOwner;
          }
        } else {
          satellite = processSatelliteConfig(satellite);
          if (satellite && satellite.owner && auto && satellite.ownerSatelliteName && auto[satellite.ownerSatelliteName]) {
            basis.dev.warn(namespace + ": auto-create satellite can't change name inside owner");
            return;
          }
          if (autoConfig) {
            delete auto[name];
            if (autoConfig.config.instance) autoConfig.config.instance.removeHandler(AUTO_SATELLITE_INSTANCE_HANDLER, autoConfig);
            if (autoConfig.config.handler) this.removeHandler(autoConfig.config.handler, autoConfig);
          }
        }
        if (oldSatellite !== satellite) {
          var satelliteListen = this.listen.satellite;
          var destroySatellite;
          if (oldSatellite) {
            delete this.satellite[name];
            oldSatellite.ownerSatelliteName = null;
            if (autoConfig && oldSatellite.destroy === warnOnAutoSatelliteDestoy) {
              destroySatellite = oldSatellite;
            } else {
              if (satelliteListen) oldSatellite.removeHandler(satelliteListen, this);
              oldSatellite.setOwner(null);
            }
            if (preserveAuto && !satellite && autoConfig.config.instance) autoConfig.config.instance.setOwner = warnOnAutoSatelliteOwnerChange;
          }
          if (satellite) {
            if (satellite instanceof AbstractNode == false) {
              var autoConfig = {
                owner: this,
                name: name,
                config: satellite,
                instance: null
              };
              if (satellite.handler) this.addHandler(satellite.handler, autoConfig);
              if (satellite.instance) {
                satellite.instance.addHandler(AUTO_SATELLITE_INSTANCE_HANDLER, autoConfig);
                satellite.instance.setOwner = warnOnAutoSatelliteOwnerChange;
              }
              if (!auto) {
                if (this.satellite === NULL_SATELLITE) this.satellite = {};
                auto = this.satellite.__auto__ = {};
              }
              auto[name] = autoConfig;
              SATELLITE_UPDATE.call(autoConfig, this);
              if (!autoConfig.instance && oldSatellite) this.emit_satelliteChanged(name, oldSatellite);
              if (destroySatellite) {
                delete destroySatellite.destroy;
                destroySatellite.destroy();
              }
              return;
            }
            if (satellite.owner !== this) {
              if (autoConfig && autoConfig.config.delegate) {
                var autoDelegate = satellite.autoDelegate;
                satellite.autoDelegate = false;
                satellite.setOwner(this);
                satellite.autoDelegate = autoDelegate;
              } else satellite.setOwner(this);
              if (satellite.owner !== this) return;
              if (satelliteListen) satellite.addHandler(satelliteListen, this);
            } else {
              if (satellite.ownerSatelliteName) {
                delete this.satellite[satellite.ownerSatelliteName];
                this.emit_satelliteChanged(satellite.ownerSatelliteName, satellite);
              }
            }
            if (this.satellite == NULL_SATELLITE) this.satellite = {};
            this.satellite[name] = satellite;
            satellite.ownerSatelliteName = name;
          }
          this.emit_satelliteChanged(name, oldSatellite);
          if (destroySatellite) {
            delete destroySatellite.destroy;
            destroySatellite.destroy();
          }
        }
      },
      getChildNodesDataset: function() {
        return childNodesDatasetMap[this.basisObjectId] || new ChildNodesDataset({
          sourceNode: this
        });
      },
      destroy: function() {
        DataObject.prototype.destroy.call(this);
        if (this.dataSource || this.dataSourceAdapter_) {
          this.setDataSource();
        } else {
          if (this.firstChild) this.clear();
        }
        if (this.parentNode) this.parentNode.removeChild(this);
        if (this.grouping) {
          this.grouping.setOwner();
          this.grouping = null;
        }
        if (this.owner) this.setOwner();
        var satellites = this.satellite;
        if (satellites !== NULL_SATELLITE) {
          var auto = satellites.__auto__;
          delete satellites.__auto__;
          for (var name in auto) if (auto[name].config.instance && !auto[name].instance) auto[name].config.instance.destroy();
          for (var name in satellites) {
            var satellite = satellites[name];
            satellite.owner = null;
            satellite.ownerSatelliteName = null;
            if (satellite.destroy === warnOnAutoSatelliteDestoy) delete satellite.destroy;
            satellite.destroy();
          }
          this.satellite = null;
        }
        this.childNodes = null;
        this.parentNode = null;
        this.previousSibling = null;
        this.nextSibling = null;
        this.firstChild = null;
        this.lastChild = null;
      }
    });
    var PartitionNode = Class(AbstractNode, {
      className: namespace + ".PartitionNode",
      autoDestroyIfEmpty: false,
      nodes: null,
      first: null,
      last: null,
      init: function() {
        this.nodes = [];
        AbstractNode.prototype.init.call(this);
      },
      insert: function(newNode, refNode) {
        var nodes = this.nodes;
        var pos = refNode ? nodes.indexOf(refNode) : -1;
        if (pos == -1) {
          nodes.push(newNode);
          this.last = newNode;
        } else nodes.splice(pos, 0, newNode);
        this.first = nodes[0];
        newNode.groupNode = this;
        this.emit_childNodesModified({
          inserted: [ newNode ]
        });
      },
      remove: function(oldNode) {
        var nodes = this.nodes;
        if (arrayRemove(nodes, oldNode)) {
          this.first = nodes[0] || null;
          this.last = nodes[nodes.length - 1] || null;
          oldNode.groupNode = null;
          this.emit_childNodesModified({
            deleted: [ oldNode ]
          });
        }
        if (!this.first && this.autoDestroyIfEmpty) this.destroy();
      },
      clear: function() {
        if (!this.first) return;
        var nodes = this.nodes;
        for (var i = nodes.length; i-- > 0; ) nodes[i].groupNode = null;
        this.nodes = [];
        this.first = null;
        this.last = null;
        this.emit_childNodesModified({
          deleted: nodes
        });
        if (this.autoDestroyIfEmpty) this.destroy();
      },
      destroy: function() {
        AbstractNode.prototype.destroy.call(this);
        this.nodes = null;
        this.first = null;
        this.last = null;
      }
    });
    var DOMMIXIN_DATASOURCE_HANDLER = {
      itemsChanged: function(dataSource, delta) {
        var newDelta = {};
        var deleted = [];
        if (delta.deleted) {
          newDelta.deleted = deleted;
          if (this.childNodes.length == delta.deleted.length) {
            deleted = arrayFrom(this.childNodes);
            for (var i = 0, child; child = deleted[i]; i++) unlockDataSourceItemNode(child);
            var tmp = this.dataSource;
            this.dataSource = null;
            this.clear(true);
            this.dataSource = tmp;
            this.dataSourceMap_ = {};
          } else {
            for (var i = 0, item; item = delta.deleted[i]; i++) {
              var delegateId = item.basisObjectId;
              var oldChild = this.dataSourceMap_[delegateId];
              unlockDataSourceItemNode(oldChild);
              delete this.dataSourceMap_[delegateId];
              this.removeChild(oldChild);
              deleted.push(oldChild);
            }
          }
        }
        if (delta.inserted) {
          newDelta.inserted = [];
          for (var i = 0, item; item = delta.inserted[i]; i++) {
            var newChild = createChildByFactory(this, {
              delegate: item
            });
            lockDataSourceItemNode(newChild);
            this.dataSourceMap_[item.basisObjectId] = newChild;
            newDelta.inserted.push(newChild);
            if (this.firstChild) this.insertBefore(newChild);
          }
        }
        if (!this.firstChild) this.setChildNodes(newDelta.inserted); else this.emit_childNodesModified(newDelta);
        if (this.destroyDataSourceMember && deleted.length) for (var i = 0, item; item = deleted[i]; i++) item.destroy();
      },
      stateChanged: function(dataSource) {
        this.setChildNodesState(dataSource.state, dataSource.state.data);
      },
      destroy: function(dataSource) {
        if (!this.dataSourceAdapter_) this.setDataSource();
      }
    };
    var MIXIN_DATASOURCE_WRAPPER_HANDLER = {
      datasetChanged: function(wrapper) {
        this.setDataSource(wrapper);
      },
      destroy: function() {
        this.setDataSource();
      }
    };
    function fastChildNodesOrder(node, order) {
      var lastIndex = order.length - 1;
      node.childNodes = order;
      node.firstChild = order[0] || null;
      node.lastChild = order[lastIndex] || null;
      for (var orderNode, i = lastIndex; orderNode = order[i]; i--) {
        orderNode.nextSibling = order[i + 1] || null;
        orderNode.previousSibling = order[i - 1] || null;
        node.insertBefore(orderNode, orderNode.nextSibling);
      }
    }
    function fastChildNodesGroupOrder(node, order) {
      for (var i = 0, child; child = order[i]; i++) child.groupNode.nodes.push(child);
      order.length = 0;
      for (var group = node.grouping.nullGroup; group; group = group.nextSibling) {
        var nodes = group.nodes;
        group.first = nodes[0] || null;
        group.last = nodes[nodes.length - 1] || null;
        order.push.apply(order, nodes);
        group.emit_childNodesModified({
          inserted: nodes
        });
      }
      return order;
    }
    function createChildByFactory(node, config) {
      var child;
      if (typeof node.childFactory == "function") {
        child = node.childFactory(config);
        if (child instanceof node.childClass) return child;
      }
      if (!child) throw EXCEPTION_NULL_CHILD;
      basis.dev.warn(EXCEPTION_BAD_CHILD_CLASS + " (expected " + (node.childClass && node.childClass.className) + " but " + (child && child.constructor && child.constructor.className) + ")");
      throw EXCEPTION_BAD_CHILD_CLASS;
    }
    var DomMixin = {
      childClass: AbstractNode,
      childFactory: null,
      listen: {
        dataSource: DOMMIXIN_DATASOURCE_HANDLER
      },
      getChild: function(value, getter) {
        return basis.array.search(this.childNodes, value, getter);
      },
      getChildByName: function(name) {
        return this.getChild(name, "name");
      },
      appendChild: function(newChild) {
        return this.insertBefore(newChild);
      },
      insertBefore: function(newChild, refChild) {
        if (!this.childClass) throw EXCEPTION_NO_CHILDCLASS;
        if (newChild.firstChild) {
          var cursor = this;
          while (cursor = cursor.parentNode) {
            if (cursor === newChild) throw EXCEPTION_CANT_INSERT;
          }
        }
        var isChildClassInstance = newChild && newChild instanceof this.childClass;
        if (this.dataSource) {
          if (!isChildClassInstance || !newChild.delegate || this.dataSourceMap_[newChild.delegate.basisObjectId] !== newChild) throw EXCEPTION_DATASOURCE_CONFLICT;
        } else {
          if (this.dataSourceAdapter_) throw EXCEPTION_DATASOURCEADAPTER_CONFLICT;
        }
        if (!isChildClassInstance) newChild = createChildByFactory(this, newChild instanceof DataObject ? {
          delegate: newChild
        } : newChild);
        if (newChild.owner) throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;
        var isInside = newChild.parentNode === this;
        var childNodes = this.childNodes;
        var grouping = this.grouping;
        var groupNodes;
        var currentNewChildGroup = newChild.groupNode;
        var group = null;
        var sorting = this.sorting;
        var sortingDesc;
        var correctSortPos = false;
        var newChildValue;
        var pos = -1;
        var nextSibling;
        var prevSibling;
        if (isInside) {
          nextSibling = newChild.nextSibling;
          prevSibling = newChild.previousSibling;
        }
        if (sorting !== nullGetter) {
          refChild = null;
          sortingDesc = this.sortingDesc;
          newChildValue = sorting(newChild) || 0;
          if (isInside) {
            if (newChildValue === newChild.sortingValue) {
              correctSortPos = true;
            } else {
              if ((!nextSibling || (sortingDesc ? nextSibling.sortingValue <= newChildValue : nextSibling.sortingValue >= newChildValue)) && (!prevSibling || (sortingDesc ? prevSibling.sortingValue >= newChildValue : prevSibling.sortingValue <= newChildValue))) {
                newChild.sortingValue = newChildValue;
                correctSortPos = true;
              }
            }
          }
        }
        if (grouping) {
          var cursor;
          group = grouping.getGroupNode(newChild, true);
          groupNodes = group.nodes;
          if (currentNewChildGroup === group) if (correctSortPos || sorting === nullGetter && nextSibling === refChild) return newChild;
          if (sorting !== nullGetter) {
            if (currentNewChildGroup === group && correctSortPos) {
              if (nextSibling && nextSibling.groupNode === group) pos = groupNodes.indexOf(nextSibling); else pos = groupNodes.length;
            } else {
              pos = binarySearchPos(groupNodes, newChildValue, sortingSearch, sortingDesc);
              newChild.sortingValue = newChildValue;
            }
          } else {
            if (refChild && refChild.groupNode === group) pos = groupNodes.indexOf(refChild); else pos = groupNodes.length;
          }
          if (pos < groupNodes.length) {
            refChild = groupNodes[pos];
          } else {
            if (group.last) {
              refChild = group.last.nextSibling;
            } else {
              cursor = group;
              refChild = null;
              while (cursor = cursor.nextSibling) if (refChild = cursor.first) break;
            }
          }
          if (newChild === refChild || isInside && nextSibling === refChild) {
            if (currentNewChildGroup !== group) {
              if (currentNewChildGroup) currentNewChildGroup.remove(newChild);
              group.insert(newChild, refChild);
            }
            return newChild;
          }
          pos = -1;
        } else {
          if (sorting !== nullGetter) {
            if (correctSortPos) return newChild;
            pos = binarySearchPos(childNodes, newChildValue, sortingSearch, sortingDesc);
            refChild = childNodes[pos];
            newChild.sortingValue = newChildValue;
            if (newChild === refChild || isInside && nextSibling === refChild) return newChild;
          } else {
            if (refChild && refChild.parentNode !== this) throw EXCEPTION_NODE_NOT_FOUND;
            if (isInside) {
              if (nextSibling === refChild) return newChild;
              if (newChild === refChild) throw EXCEPTION_CANT_INSERT;
            }
          }
        }
        if (isInside) {
          if (nextSibling) {
            nextSibling.previousSibling = prevSibling;
            newChild.nextSibling = null;
          } else this.lastChild = prevSibling;
          if (prevSibling) {
            prevSibling.nextSibling = nextSibling;
            newChild.previousSibling = null;
          } else this.firstChild = nextSibling;
          if (pos == -1) arrayRemove(childNodes, newChild); else {
            var oldPos = childNodes.indexOf(newChild);
            childNodes.splice(oldPos, 1);
            pos -= oldPos < pos;
          }
          if (currentNewChildGroup) {
            currentNewChildGroup.remove(newChild);
            currentNewChildGroup = null;
          }
        } else {
          if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
        }
        if (currentNewChildGroup != group) group.insert(newChild, refChild);
        if (refChild) {
          if (pos == -1) pos = childNodes.indexOf(refChild);
          if (pos == -1) throw EXCEPTION_NODE_NOT_FOUND;
          newChild.nextSibling = refChild;
          childNodes.splice(pos, 0, newChild);
        } else {
          pos = childNodes.length;
          childNodes.push(newChild);
          refChild = {
            previousSibling: this.lastChild
          };
          this.lastChild = newChild;
        }
        newChild.parentNode = this;
        newChild.previousSibling = refChild.previousSibling;
        if (pos == 0) this.firstChild = newChild; else refChild.previousSibling.nextSibling = newChild;
        refChild.previousSibling = newChild;
        if (!isInside) {
          updateNodeContextSelection(newChild, newChild.contextSelection, this.selection || this.contextSelection, true);
          updateNodeDisableContext(newChild, this.disabled || this.contextDisabled);
          if ((newChild.underMatch_ || this.matchFunction) && newChild.match) newChild.match(this.matchFunction);
          if (newChild.autoDelegate == DELEGATE.PARENT || newChild.autoDelegate === DELEGATE.ANY) newChild.setDelegate(this);
          if (!this.dataSource) this.emit_childNodesModified({
            inserted: [ newChild ]
          });
          if (newChild.listen.parentNode) this.addHandler(newChild.listen.parentNode, newChild);
        }
        return newChild;
      },
      removeChild: function(oldChild) {
        if (!oldChild || oldChild.parentNode !== this) throw EXCEPTION_NODE_NOT_FOUND;
        if (oldChild instanceof this.childClass == false) throw EXCEPTION_BAD_CHILD_CLASS;
        if (this.dataSource) {
          if (this.dataSource.has(oldChild.delegate)) throw EXCEPTION_DATASOURCE_CONFLICT;
        } else {
          if (this.dataSourceAdapter_) throw EXCEPTION_DATASOURCEADAPTER_CONFLICT;
        }
        var pos = this.childNodes.indexOf(oldChild);
        if (pos == -1) throw EXCEPTION_NODE_NOT_FOUND;
        this.childNodes.splice(pos, 1);
        oldChild.parentNode = null;
        if (oldChild.nextSibling) oldChild.nextSibling.previousSibling = oldChild.previousSibling; else this.lastChild = oldChild.previousSibling;
        if (oldChild.previousSibling) oldChild.previousSibling.nextSibling = oldChild.nextSibling; else this.firstChild = oldChild.nextSibling;
        oldChild.nextSibling = null;
        oldChild.previousSibling = null;
        if (oldChild.listen.parentNode) this.removeHandler(oldChild.listen.parentNode, oldChild);
        updateNodeContextSelection(oldChild, oldChild.contextSelection, null, true);
        if (oldChild.groupNode) oldChild.groupNode.remove(oldChild);
        if (!this.dataSource) this.emit_childNodesModified({
          deleted: [ oldChild ]
        });
        if (oldChild.autoDelegate == DELEGATE.PARENT || oldChild.autoDelegate === DELEGATE.ANY) oldChild.setDelegate();
        return oldChild;
      },
      replaceChild: function(newChild, oldChild) {
        if (this.dataSource) throw EXCEPTION_DATASOURCE_CONFLICT;
        if (this.dataSourceAdapter_) throw EXCEPTION_DATASOURCEADAPTER_CONFLICT;
        if (oldChild == null || oldChild.parentNode !== this) throw EXCEPTION_NODE_NOT_FOUND;
        this.insertBefore(newChild, oldChild);
        return this.removeChild(oldChild);
      },
      clear: function(alive) {
        if (this.dataSource && this.dataSource.itemCount) throw EXCEPTION_DATASOURCE_CONFLICT;
        if (!this.firstChild) return;
        if (alive) updateNodeContextSelection(this, this.selection || this.contextSelection, null, false, true);
        var childNodes = this.childNodes;
        this.firstChild = null;
        this.lastChild = null;
        this.childNodes = [];
        this.emit_childNodesModified({
          deleted: childNodes
        });
        for (var i = childNodes.length; i-- > 0; ) {
          var child = childNodes[i];
          if (child.listen.parentNode) child.parentNode.removeHandler(child.listen.parentNode, child);
          child.parentNode = null;
          child.groupNode = null;
          if (alive) {
            child.nextSibling = null;
            child.previousSibling = null;
            if (child.autoDelegate == DELEGATE.PARENT || child.autoDelegate === DELEGATE.ANY) child.setDelegate();
          } else child.destroy();
        }
        if (this.grouping) {
          for (var childNodes = this.grouping.childNodes, i = childNodes.length - 1, group; group = childNodes[i]; i--) group.clear();
        }
      },
      setChildNodes: function(newChildNodes, keepAlive) {
        if (!this.dataSource && !this.dataSourceAdapter_) this.clear(keepAlive);
        if (newChildNodes) {
          if ("length" in newChildNodes == false) newChildNodes = [ newChildNodes ];
          if (newChildNodes.length) {
            var tmp = this.emit_childNodesModified;
            this.emit_childNodesModified = $undef;
            for (var i = 0, len = newChildNodes.length; i < len; i++) this.insertBefore(newChildNodes[i]);
            this.emit_childNodesModified = tmp;
            this.emit_childNodesModified({
              inserted: this.childNodes
            });
          }
        }
      },
      setDataSource: function(dataSource) {
        if (!this.childClass) throw EXCEPTION_NO_CHILDCLASS;
        dataSource = basis.data.resolveDataset(this, this.setDataSource, dataSource, "dataSourceAdapter_");
        if (this.dataSource !== dataSource) {
          var oldDataSource = this.dataSource;
          var listenHandler = this.listen.dataSource;
          if (oldDataSource) {
            this.dataSourceMap_ = null;
            this.dataSource = null;
            if (listenHandler) oldDataSource.removeHandler(listenHandler, this);
          }
          if (this.firstChild) {
            if (oldDataSource) for (var i = 0, child; child = this.childNodes[i]; i++) unlockDataSourceItemNode(child);
            this.clear();
          }
          this.dataSource = dataSource;
          if (dataSource) {
            this.dataSourceMap_ = {};
            this.setChildNodesState(dataSource.state, dataSource.state.data);
            if (listenHandler) {
              dataSource.addHandler(listenHandler, this);
              if (dataSource.itemCount && listenHandler.itemsChanged) {
                listenHandler.itemsChanged.call(this, dataSource, {
                  inserted: dataSource.getItems()
                });
              }
            }
          } else {
            this.setChildNodesState(STATE.UNDEFINED);
          }
          this.emit_dataSourceChanged(oldDataSource);
        }
      },
      setGrouping: function(grouping, alive) {
        if (typeof grouping == "function" || typeof grouping == "string") grouping = {
          rule: grouping
        };
        if (grouping instanceof GroupingNode == false) {
          grouping = grouping && typeof grouping == "object" ? new this.groupingClass(grouping) : null;
        }
        if (this.grouping !== grouping) {
          var oldGrouping = this.grouping;
          var order;
          if (oldGrouping) {
            this.grouping = null;
            if (!grouping) {
              if (this.firstChild) {
                if (this.sorting !== nullGetter) order = sortChildNodes(this); else order = this.childNodes;
                oldGrouping.nullGroup.clear();
                var groups = oldGrouping.childNodes.slice(0);
                for (var i = 0; i < groups.length; i++) groups[i].clear();
                fastChildNodesOrder(this, order);
              }
            }
            oldGrouping.setOwner();
          }
          if (grouping) {
            this.grouping = grouping;
            grouping.setOwner(this);
            if (this.firstChild) {
              if (this.sorting !== nullGetter) order = sortChildNodes(this); else order = this.childNodes;
              for (var i = 0, child; child = order[i]; i++) child.groupNode = this.grouping.getGroupNode(child, true);
              order = fastChildNodesGroupOrder(this, order);
              fastChildNodesOrder(this, order);
            }
          }
          this.emit_groupingChanged(oldGrouping);
        }
      },
      setSorting: function(sorting, sortingDesc) {
        sorting = getter(sorting);
        sortingDesc = !!sortingDesc;
        if (this.sorting !== sorting || this.sortingDesc != !!sortingDesc) {
          var oldSorting = this.sorting;
          var oldSortingDesc = this.sortingDesc;
          this.sorting = sorting;
          this.sortingDesc = !!sortingDesc;
          if (sorting !== nullGetter && this.firstChild) {
            var order = [];
            var nodes;
            for (var node = this.firstChild; node; node = node.nextSibling) node.sortingValue = sorting(node) || 0;
            if (this.grouping) {
              for (var group = this.grouping.nullGroup; group; group = group.nextSibling) {
                nodes = group.nodes = sortChildNodes({
                  childNodes: group.nodes,
                  sortingDesc: this.sortingDesc
                });
                group.first = nodes[0] || null;
                group.last = nodes[nodes.length - 1] || null;
                order.push.apply(order, nodes);
              }
            } else {
              order = sortChildNodes(this);
            }
            fastChildNodesOrder(this, order);
          }
          this.emit_sortingChanged(oldSorting, oldSortingDesc);
        }
      },
      setMatchFunction: function(matchFunction) {
        if (this.matchFunction != matchFunction) {
          var oldMatchFunction = this.matchFunction;
          this.matchFunction = matchFunction;
          for (var node = this.lastChild; node; node = node.previousSibling) node.match(matchFunction);
          this.emit_matchFunctionChanged(oldMatchFunction);
        }
      }
    };
    var Node = Class(AbstractNode, DomMixin, {
      className: namespace + ".Node",
      emit_enable: createEvent("enable") && function() {
        for (var child = this.firstChild; child; child = child.nextSibling) updateNodeDisableContext(child, false);
        events.enable.call(this);
      },
      emit_disable: createEvent("disable") && function() {
        for (var child = this.firstChild; child; child = child.nextSibling) updateNodeDisableContext(child, true);
        events.disable.call(this);
      },
      emit_satelliteChanged: function(name, oldSatellite) {
        AbstractNode.prototype.emit_satelliteChanged.call(this, name, oldSatellite);
        if (this.satellite[name] instanceof Node) updateNodeDisableContext(this.satellite[name], this.disabled || this.contextDisabled);
      },
      emit_select: createEvent("select"),
      emit_unselect: createEvent("unselect"),
      emit_match: createEvent("match"),
      emit_unmatch: createEvent("unmatch"),
      emit_matchFunctionChanged: createEvent("matchFunctionChanged", "oldMatchFunction"),
      selectable: true,
      selected: false,
      selection: null,
      contextSelection: null,
      matchFunction: null,
      matched: true,
      disabled: false,
      contextDisabled: false,
      listen: {
        owner: {
          enable: function() {
            updateNodeDisableContext(this, false);
          },
          disable: function() {
            updateNodeDisableContext(this, true);
          }
        }
      },
      init: function() {
        if (this.selection) {
          if (this.selection instanceof AbstractDataset == false) this.selection = new Selection(this.selection);
          if (this.listen.selection) this.selection.addHandler(this.listen.selection, this);
        }
        AbstractNode.prototype.init.call(this);
        if (this.disabled) this.emit_disable();
        if (this.selected) {
          this.selected = false;
          this.select(true);
        }
      },
      setSelection: function(selection) {
        if (this.selection !== selection) {
          updateNodeContextSelection(this, this.selection || this.contextSelection, selection || this.contextSelection, false, true);
          if (this.selection && this.listen.selection) this.selection.removeHandler(this.listen.selection, this);
          this.selection = selection;
          if (selection && this.listen.selection) selection.addHandler(this.listen.selection, this);
          return true;
        }
      },
      select: function(multiple) {
        var selected = this.selected;
        var selection = this.contextSelection;
        if (selection) {
          if (!multiple) {
            if (this.selectable) selection.set([ this ]);
          } else {
            if (selected) selection.remove([ this ]); else selection.add([ this ]);
          }
        } else if (!selected && this.selectable) {
          this.selected = true;
          this.emit_select();
        }
        return this.selected != selected;
      },
      unselect: function() {
        var selected = this.selected;
        if (selected) {
          var selection = this.contextSelection;
          if (selection) selection.remove([ this ]); else {
            this.selected = false;
            this.emit_unselect();
          }
        }
        return this.selected != selected;
      },
      setSelected: function(selected, multiple) {
        return selected ? this.select(multiple) : this.unselect();
      },
      enable: function() {
        var disabled = this.disabled;
        if (disabled) {
          this.disabled = false;
          if (!this.contextDisabled) this.emit_enable();
        }
        return this.disabled != disabled;
      },
      disable: function() {
        var disabled = this.disabled;
        if (!disabled) {
          this.disabled = true;
          if (!this.contextDisabled) this.emit_disable();
        }
        return this.disabled != disabled;
      },
      setDisabled: function(disabled) {
        return disabled ? this.disable() : this.enable();
      },
      isDisabled: function() {
        return this.disabled || this.contextDisabled;
      },
      match: function(func) {
        if (typeof func != "function") func = null;
        if (this.underMatch_ && !func) this.underMatch_(this, true);
        this.underMatch_ = func;
        var matched = !func || func(this);
        if (this.matched != matched) {
          this.matched = matched;
          if (matched) this.emit_match(); else this.emit_unmatch();
        }
      },
      destroy: function() {
        this.unselect();
        this.contextSelection = null;
        if (this.selection) this.setSelection();
        AbstractNode.prototype.destroy.call(this);
      }
    });
    var GroupingNode = Class(AbstractNode, DomMixin, {
      className: namespace + ".GroupingNode",
      emit_childNodesModified: function(delta) {
        events.childNodesModified.call(this, delta);
        this.nullGroup.nextSibling = this.firstChild;
        var array;
        if (array = delta.inserted) {
          for (var i = 0, child; child = array[i++]; ) {
            child.groupId_ = child.delegate ? child.delegate.basisObjectId : child.data.id;
            this.map_[child.groupId_] = child;
          }
          if (this.dataSource && this.nullGroup.first) {
            var parentNode = this.owner;
            var nodes = arrayFrom(this.nullGroup.nodes);
            for (var i = nodes.length; i-- > 0; ) parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
          }
        }
      },
      emit_ownerChanged: function(oldOwner) {
        if (oldOwner && oldOwner.grouping === this) oldOwner.setGrouping(null, true);
        if (this.owner && this.owner.grouping !== this) this.owner.setGrouping(this);
        events.ownerChanged.call(this, oldOwner);
        if (!this.owner && this.autoDestroyWithNoOwner) this.destroy();
      },
      map_: null,
      nullGroup: null,
      autoDestroyWithNoOwner: true,
      autoDestroyEmptyGroups: true,
      rule: nullGetter,
      childClass: PartitionNode,
      childFactory: function(config) {
        return new this.childClass(complete({
          autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
        }, config));
      },
      init: function() {
        this.map_ = {};
        this.nullGroup = new PartitionNode;
        if ("groupGetter" in this) {
          this.rule = getter(this.groupGetter);
          basis.dev.warn("basis.dom.wrapper.GroupingNode#groupGetter is deprecated now, use basis.dom.wrapper.GroupingNode#rule instead. groupGetter value was set to rule property.");
        }
        AbstractNode.prototype.init.call(this);
      },
      getGroupNode: function(node, autocreate) {
        var groupRef = this.rule(node);
        var isDelegate = groupRef instanceof DataObject;
        var group = this.map_[isDelegate ? groupRef.basisObjectId : groupRef];
        if (this.dataSource) autocreate = false;
        if (!group && autocreate) {
          group = this.appendChild(isDelegate ? groupRef : {
            data: {
              id: groupRef,
              title: groupRef
            }
          });
        }
        return group || this.nullGroup;
      },
      setDataSource: function(dataSource) {
        var curDataSource = this.dataSource;
        DomMixin.setDataSource.call(this, dataSource);
        var owner = this.owner;
        if (owner && this.dataSource !== curDataSource) {
          var nodes = arrayFrom(owner.childNodes);
          for (var i = nodes.length - 1; i >= 0; i--) owner.insertBefore(nodes[i], nodes[i + 1]);
        }
      },
      insertBefore: function(newChild, refChild) {
        newChild = DomMixin.insertBefore.call(this, newChild, refChild);
        var firstNode = newChild.first;
        if (firstNode) {
          var parent = firstNode.parentNode;
          var lastNode = newChild.last;
          var beforePrev;
          var beforeNext;
          var afterPrev;
          var afterNext = null;
          var cursor = newChild;
          while (cursor = cursor.nextSibling) {
            if (afterNext = cursor.first) break;
          }
          afterPrev = afterNext ? afterNext.previousSibling : parent.lastChild;
          beforePrev = firstNode.previousSibling;
          beforeNext = lastNode.nextSibling;
          if (beforeNext !== afterNext) {
            var parentChildNodes = parent.childNodes;
            var nodes = newChild.nodes;
            var nodesCount = nodes.length;
            if (beforePrev) beforePrev.nextSibling = beforeNext;
            if (beforeNext) beforeNext.previousSibling = beforePrev;
            if (afterPrev) afterPrev.nextSibling = firstNode;
            if (afterNext) afterNext.previousSibling = lastNode;
            firstNode.previousSibling = afterPrev;
            lastNode.nextSibling = afterNext;
            var firstPos = parentChildNodes.indexOf(firstNode);
            var afterNextPos = afterNext ? parentChildNodes.indexOf(afterNext) : parentChildNodes.length;
            if (afterNextPos > firstPos) afterNextPos -= nodesCount;
            parentChildNodes.splice(firstPos, nodesCount);
            parentChildNodes.splice.apply(parentChildNodes, [ afterNextPos, 0 ].concat(nodes));
            if (!afterPrev || !beforePrev) parent.firstChild = parentChildNodes[0];
            if (!afterNext || !beforeNext) parent.lastChild = parentChildNodes[parentChildNodes.length - 1];
            if (firstNode instanceof PartitionNode) for (var i = nodesCount, insertBefore = afterNext; i-- > 0; ) {
              parent.insertBefore(nodes[i], insertBefore);
              insertBefore = nodes[i];
            }
          }
        }
        return newChild;
      },
      removeChild: function(oldChild) {
        if (oldChild = DomMixin.removeChild.call(this, oldChild)) {
          delete this.map_[oldChild.groupId_];
          for (var i = 0, node; node = oldChild.nodes[i]; i++) node.parentNode.insertBefore(node);
        }
        return oldChild;
      },
      clear: function(alive) {
        var nodes = [];
        var getGroupNode = this.getGroupNode;
        var nullGroup = this.nullGroup;
        this.getGroupNode = function() {
          return nullGroup;
        };
        for (var group = this.firstChild; group; group = group.nextSibling) nodes.push.apply(nodes, group.nodes);
        for (var i = 0, child; child = nodes[i]; i++) child.parentNode.insertBefore(child);
        this.getGroupNode = getGroupNode;
        DomMixin.clear.call(this, alive);
        this.map_ = {};
      },
      destroy: function() {
        this.autoDestroyWithNoOwner = false;
        AbstractNode.prototype.destroy.call(this);
        this.nullGroup.destroy();
        this.nullGroup = null;
        this.map_ = null;
      }
    });
    AbstractNode.prototype.groupingClass = GroupingNode;
    var CHILDNODESDATASET_HANDLER = {
      childNodesModified: function(sender, delta) {
        var memberMap = this.members_;
        var newDelta = {};
        var node;
        var insertCount = 0;
        var deleteCount = 0;
        var inserted = delta.inserted;
        var deleted = delta.deleted;
        if (inserted && inserted.length) {
          newDelta.inserted = inserted;
          while (node = inserted[insertCount]) {
            memberMap[node.basisObjectId] = node;
            insertCount++;
          }
        }
        if (deleted && deleted.length) {
          newDelta.deleted = deleted;
          while (node = deleted[deleteCount]) {
            delete memberMap[node.basisObjectId];
            deleteCount++;
          }
        }
        if (insertCount || deleteCount) this.emit_itemsChanged(newDelta);
      },
      destroy: function() {
        this.destroy();
      }
    };
    var ChildNodesDataset = Class(AbstractDataset, {
      className: namespace + ".ChildNodesDataset",
      sourceNode: null,
      init: function() {
        AbstractDataset.prototype.init.call(this);
        var sourceNode = this.sourceNode;
        childNodesDatasetMap[sourceNode.basisObjectId] = this;
        if (sourceNode.firstChild) CHILDNODESDATASET_HANDLER.childNodesModified.call(this, sourceNode, {
          inserted: sourceNode.childNodes
        });
        sourceNode.addHandler(CHILDNODESDATASET_HANDLER, this);
      },
      destroy: function() {
        this.sourceNode.removeHandler(CHILDNODESDATASET_HANDLER, this);
        delete childNodesDatasetMap[this.sourceNode.basisObjectId];
        AbstractDataset.prototype.destroy.call(this);
      }
    });
    var Selection = Class(Dataset, {
      className: namespace + ".Selection",
      multiple: false,
      emit_itemsChanged: function(delta) {
        Dataset.prototype.emit_itemsChanged.call(this, delta);
        if (delta.inserted) {
          for (var i = 0, node; node = delta.inserted[i]; i++) {
            if (!node.selected) {
              node.selected = true;
              node.emit_select();
            }
          }
        }
        if (delta.deleted) {
          for (var i = 0, node; node = delta.deleted[i]; i++) {
            if (node.selected) {
              node.selected = false;
              node.emit_unselect();
            }
          }
        }
      },
      add: function(nodes) {
        if (!this.multiple) {
          if (this.itemCount) return this.set(nodes); else nodes = [ nodes[0] ];
        }
        var items = [];
        for (var i = 0, node; node = nodes[i]; i++) {
          if (node.contextSelection == this && node.selectable) items.push(node);
        }
        return Dataset.prototype.add.call(this, items);
      },
      set: function(nodes) {
        var items = [];
        for (var i = 0, node; node = nodes[i]; i++) {
          if (node.contextSelection == this && node.selectable) items.push(node);
        }
        if (!this.multiple) items.splice(1);
        return Dataset.prototype.set.call(this, items);
      }
    });
    module.exports = {
      DELEGATE: DELEGATE,
      AbstractNode: AbstractNode,
      Node: Node,
      GroupingNode: GroupingNode,
      PartitionNode: PartitionNode,
      ChildNodesDataset: ChildNodesDataset,
      Selection: Selection,
      nullSelection: new AbstractDataset
    };
  },
  "7.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./3.js");
    var namespace = this.path;
    var Class = basis.Class;
    var cleaner = basis.cleaner;
    var path = basis.path;
    var arraySearch = basis.array.search;
    var arrayAdd = basis.array.add;
    var arrayRemove = basis.array.remove;
    var templateList = [];
    var tmplFilesMap = {};
    var DECLARATION_VERSION = 2;
    var TYPE_ELEMENT = 1;
    var TYPE_ATTRIBUTE = 2;
    var TYPE_ATTRIBUTE_CLASS = 4;
    var TYPE_ATTRIBUTE_STYLE = 5;
    var TYPE_ATTRIBUTE_EVENT = 6;
    var TYPE_TEXT = 3;
    var TYPE_COMMENT = 8;
    var TOKEN_TYPE = 0;
    var TOKEN_BINDINGS = 1;
    var TOKEN_REFS = 2;
    var ATTR_NAME = 3;
    var ATTR_VALUE = 4;
    var ATTR_EVENT_RX = /^event-(.+)$/;
    var ATTR_NAME_BY_TYPE = {
      4: "class",
      5: "style"
    };
    var ATTR_TYPE_BY_NAME = {
      "class": TYPE_ATTRIBUTE_CLASS,
      style: TYPE_ATTRIBUTE_STYLE
    };
    var ATTR_VALUE_INDEX = {
      2: ATTR_VALUE,
      4: ATTR_VALUE - 1,
      5: ATTR_VALUE - 1,
      6: 2
    };
    var ELEMENT_NAME = 3;
    var ELEMENT_ATTRS = 4;
    var ELEMENT_CHILDS = 5;
    var TEXT_VALUE = 3;
    var COMMENT_VALUE = 3;
    var SYNTAX_ERROR = "Invalid or unsupported syntax";
    var TEXT = /((?:.|[\r\n])*?)(\{(?:l10n:([a-zA-Z_][a-zA-Z0-9_\-]*(?:\.[a-zA-Z_][a-zA-Z0-9_\-]*)*(?:\.\{[a-zA-Z_][a-zA-Z0-9_\-]*\})?)\})?|<(\/|!--(\s*\{)?)?|$)/g;
    var TAG_NAME = /([a-z_][a-z0-9\-_]*)(:|\{|\s*(\/?>)?)/ig;
    var ATTRIBUTE_NAME_OR_END = /([a-z_][a-z0-9_\-]*)(:|\{|=|\s*)|(\/?>)/ig;
    var COMMENT = /(.|[\r\n])*?-->/g;
    var CLOSE_TAG = /([a-z_][a-z0-9_\-]*(?::[a-z_][a-z0-9_\-]*)?)>/ig;
    var REFERENCE = /([a-z_][a-z0-9_]*)(\||\}\s*)/ig;
    var ATTRIBUTE_VALUE = /"((?:(\\")|[^"])*?)"\s*/g;
    var BREAK_TAG_PARSE = /^/g;
    var TAG_IGNORE_CONTENT = {
      text: /((?:.|[\r\n])*?)(?:<\/b:text>|$)/g
    };
    var quoteUnescape = /\\"/g;
    var tokenize = function(source) {
      var result = [];
      var tagStack = [];
      var lastTag = {
        childs: result
      };
      var sourceText;
      var token;
      var bufferPos;
      var startPos;
      var parseTag = false;
      var textStateEndPos = 0;
      var textEndPos;
      var state = TEXT;
      var pos = 0;
      var m;
      source = source.trim();
      result.warns = [];
      while (pos < source.length || state != TEXT) {
        state.lastIndex = pos;
        startPos = pos;
        m = state.exec(source);
        if (!m || m.index !== pos) {
          if (state == REFERENCE && token && token.type == TYPE_COMMENT) {
            state = COMMENT;
            continue;
          }
          if (parseTag) lastTag = tagStack.pop();
          if (token) lastTag.childs.pop();
          if (token = lastTag.childs.pop()) {
            if (token.type == TYPE_TEXT && !token.refs) textStateEndPos -= "len" in token ? token.len : token.value.length; else lastTag.childs.push(token);
          }
          parseTag = false;
          state = TEXT;
          continue;
        }
        pos = state.lastIndex;
        switch (state) {
          case TEXT:
            textEndPos = startPos + m[1].length;
            if (textStateEndPos != textEndPos) {
              sourceText = textStateEndPos == startPos ? m[1] : source.substring(textStateEndPos, textEndPos);
              token = sourceText.replace(/\s*(\r\n?|\n\r?)\s*/g, "");
              if (token) lastTag.childs.push({
                type: TYPE_TEXT,
                len: sourceText.length,
                value: token
              });
            }
            textStateEndPos = textEndPos;
            if (m[3]) {
              lastTag.childs.push({
                type: TYPE_TEXT,
                refs: [ "l10n:" + m[3] ],
                value: "{l10n:" + m[3] + "}"
              });
            } else if (m[2] == "{") {
              bufferPos = pos - 1;
              lastTag.childs.push(token = {
                type: TYPE_TEXT
              });
              state = REFERENCE;
            } else if (m[4]) {
              if (m[4] == "/") {
                token = null;
                state = CLOSE_TAG;
              } else {
                lastTag.childs.push(token = {
                  type: TYPE_COMMENT
                });
                if (m[5]) {
                  bufferPos = pos - m[5].length;
                  state = REFERENCE;
                } else {
                  bufferPos = pos;
                  state = COMMENT;
                }
              }
            } else if (m[2]) {
              parseTag = true;
              tagStack.push(lastTag);
              lastTag.childs.push(token = {
                type: TYPE_ELEMENT,
                attrs: [],
                childs: []
              });
              lastTag = token;
              state = TAG_NAME;
            }
            break;
          case CLOSE_TAG:
            if (m[1] !== (lastTag.prefix ? lastTag.prefix + ":" : "") + lastTag.name) {
              lastTag.childs.push({
                type: TYPE_TEXT,
                value: "</" + m[0]
              });
            } else lastTag = tagStack.pop();
            state = TEXT;
            break;
          case TAG_NAME:
          case ATTRIBUTE_NAME_OR_END:
            if (m[2] == ":") {
              if (token.prefix) state = BREAK_TAG_PARSE; else token.prefix = m[1];
              break;
            }
            if (m[1]) {
              token.name = m[1];
              if (token.type == TYPE_ATTRIBUTE) lastTag.attrs.push(token);
            }
            if (m[2] == "{") {
              if (token.type == TYPE_ELEMENT) state = REFERENCE; else state = BREAK_TAG_PARSE;
              break;
            }
            if (m[3]) {
              parseTag = false;
              if (m[3] == "/>") lastTag = tagStack.pop(); else if (lastTag.prefix == "b" && lastTag.name in TAG_IGNORE_CONTENT) {
                state = TAG_IGNORE_CONTENT[lastTag.name];
                break;
              }
              state = TEXT;
              break;
            }
            if (m[2] == "=") {
              state = ATTRIBUTE_VALUE;
              break;
            }
            token = {
              type: TYPE_ATTRIBUTE
            };
            state = ATTRIBUTE_NAME_OR_END;
            break;
          case COMMENT:
            token.value = source.substring(bufferPos, pos - 3);
            state = TEXT;
            break;
          case REFERENCE:
            if (token.refs) token.refs.push(m[1]); else token.refs = [ m[1] ];
            if (m[2] != "|") {
              if (token.type == TYPE_TEXT) {
                pos -= m[2].length - 1;
                token.value = source.substring(bufferPos, pos);
                state = TEXT;
              } else if (token.type == TYPE_COMMENT) {
                state = COMMENT;
              } else if (token.type == TYPE_ATTRIBUTE && source[pos] == "=") {
                pos++;
                state = ATTRIBUTE_VALUE;
              } else {
                token = {
                  type: TYPE_ATTRIBUTE
                };
                state = ATTRIBUTE_NAME_OR_END;
              }
            }
            break;
          case ATTRIBUTE_VALUE:
            token.value = m[1].replace(quoteUnescape, '"');
            token = {
              type: TYPE_ATTRIBUTE
            };
            state = ATTRIBUTE_NAME_OR_END;
            break;
          case TAG_IGNORE_CONTENT.text:
            lastTag.childs.push({
              type: TYPE_TEXT,
              value: m[1]
            });
            lastTag = tagStack.pop();
            state = TEXT;
            break;
          default:
            throw "Parser bug";
        }
        if (state == TEXT) textStateEndPos = pos;
      }
      if (textStateEndPos != pos) lastTag.childs.push({
        type: TYPE_TEXT,
        value: source.substring(textStateEndPos, pos)
      });
      if (lastTag.name) result.warns.push("No close tag for <" + lastTag.name + ">");
      if (!result.warns.length) delete result.warns;
      result.templateTokens = true;
      return result;
    };
    var tokenTemplate = {};
    var L10nProxyToken = basis.Token.subclass({
      className: namespace + ".L10nProxyToken",
      token: null,
      url: "",
      init: function(token) {
        this.url = token.dictionary.resource.url + ":" + token.name;
        this.token = token;
        this.set();
        token.attach(this.set, this);
      },
      set: function() {
        return basis.Token.prototype.set.call(this, this.token.type == "markup" ? processMarkup(this.token.value, this.token.name + "@" + this.token.dictionary.resource.url) : "");
      },
      destroy: function() {
        basis.Token.prototype.destroy.call(this);
        this.token = null;
      }
    });
    function processMarkup(value, id) {
      return '<span class="basisjs-markup" data-basisjs-l10n="' + id + '">' + String(value) + "</span>";
    }
    function getL10nTemplate(token) {
      if (typeof token == "string") token = basis.l10n.token(token);
      if (!token) return null;
      var id = token.basisObjectId;
      var template = tokenTemplate[id];
      if (!template) template = tokenTemplate[id] = new Template(new L10nProxyToken(token));
      return template;
    }
    var makeDeclaration = function() {
      var IDENT = /^[a-z_][a-z0-9_\-]*$/i;
      var CLASS_ATTR_PARTS = /(\S+)/g;
      var CLASS_ATTR_BINDING = /^([a-z_][a-z0-9_\-]*)?\{((anim:)?[a-z_][a-z0-9_\-]*)\}$/i;
      var STYLE_ATTR_PARTS = /\s*[^:]+?\s*:(?:\(.*?\)|".*?"|'.*?'|[^;]+?)+(?:;|$)/gi;
      var STYLE_PROPERTY = /\s*([^:]+?)\s*:((?:\(.*?\)|".*?"|'.*?'|[^;]+?)+);?$/i;
      var STYLE_ATTR_BINDING = /\{([a-z_][a-z0-9_]*)\}/i;
      var ATTR_BINDING = /\{([a-z_][a-z0-9_]*|l10n:[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)*(?:\.\{[a-z_][a-z0-9_]*\})?)\}/i;
      var NAMED_CHARACTER_REF = /&([a-z]+|#[0-9]+|#x[0-9a-f]{1,4});?/gi;
      var tokenMap = basis.NODE_ENV ? node_require("./template/htmlentity.json") : {};
      var tokenElement = !basis.NODE_ENV ? document.createElement("div") : null;
      var includeStack = [];
      function name(token) {
        return (token.prefix ? token.prefix + ":" : "") + token.name;
      }
      function namedCharReplace(m, token) {
        if (!tokenMap[token]) {
          if (token.charAt(0) == "#") {
            tokenMap[token] = String.fromCharCode(token.charAt(1) == "x" || token.charAt(1) == "X" ? parseInt(token.substr(2), 16) : token.substr(1));
          } else {
            if (tokenElement) {
              tokenElement.innerHTML = m;
              tokenMap[token] = tokenElement.firstChild ? tokenElement.firstChild.nodeValue : m;
            }
          }
        }
        return tokenMap[token] || m;
      }
      function untoken(value) {
        return value.replace(NAMED_CHARACTER_REF, namedCharReplace);
      }
      function refList(token) {
        var array = token.refs;
        if (!array || !array.length) return 0;
        return array;
      }
      function processAttr(name, value) {
        function buildExpression(parts) {
          var bindName;
          var names = [];
          var expression = [];
          var map = {};
          for (var j = 0; j < parts.length; j++) if (j % 2) {
            bindName = parts[j];
            if (!map[bindName]) {
              map[bindName] = names.length;
              names.push(bindName);
            }
            expression.push(map[bindName]);
          } else {
            if (parts[j]) expression.push(untoken(parts[j]));
          }
          return [ names, expression ];
        }
        var bindings = 0;
        var parts;
        var m;
        if (value) {
          switch (name) {
            case "class":
              if (parts = value.match(CLASS_ATTR_PARTS)) {
                var newValue = [];
                bindings = [];
                for (var j = 0, part; part = parts[j]; j++) {
                  if (m = part.match(CLASS_ATTR_BINDING)) bindings.push([ m[1] || "", m[2] ]); else newValue.push(part);
                }
                value = newValue.join(" ");
              }
              break;
            case "style":
              var props = [];
              bindings = [];
              if (parts = value.match(STYLE_ATTR_PARTS)) {
                for (var j = 0, part; part = parts[j]; j++) {
                  var m = part.match(STYLE_PROPERTY);
                  var propertyName = m[1];
                  var value = m[2].trim();
                  var valueParts = value.split(STYLE_ATTR_BINDING);
                  if (valueParts.length > 1) {
                    var expr = buildExpression(valueParts);
                    expr.push(propertyName);
                    bindings.push(expr);
                  } else props.push(propertyName + ": " + untoken(value));
                }
              } else {
                if (/\S/.test(value)) basis.dev.warn("Bad value for style attribute (value ignored):", value);
              }
              value = props.join("; ");
              if (value) value += ";";
              break;
            default:
              parts = value.split(ATTR_BINDING);
              if (parts.length > 1) bindings = buildExpression(parts); else value = untoken(value);
          }
        }
        if (bindings && !bindings.length) bindings = 0;
        return {
          binding: bindings,
          value: value,
          type: ATTR_TYPE_BY_NAME[name] || 2
        };
      }
      function attrs(token, declToken, optimizeSize) {
        var attrs = token.attrs;
        var result = [];
        var m;
        for (var i = 0, attr; attr = attrs[i]; i++) {
          if (attr.prefix == "b") {
            switch (attr.name) {
              case "ref":
                var refs = (attr.value || "").trim().split(/\s+/);
                for (var j = 0; j < refs.length; j++) addTokenRef(declToken, refs[j]);
                break;
            }
            continue;
          }
          if (m = attr.name.match(ATTR_EVENT_RX)) {
            result.push(m[1] == attr.value ? [ TYPE_ATTRIBUTE_EVENT, m[1] ] : [ TYPE_ATTRIBUTE_EVENT, m[1], attr.value ]);
            continue;
          }
          var parsed = processAttr(attr.name, attr.value);
          var item = [ parsed.type, parsed.binding, refList(attr) ];
          if (parsed.type == 2) item.push(name(attr));
          if (parsed.value && (!optimizeSize || !parsed.binding || parsed.type != 2)) item.push(parsed.value);
          result.push(item);
        }
        return result.length ? result : 0;
      }
      function addTokenRef(token, refName) {
        if (!token[TOKEN_REFS]) token[TOKEN_REFS] = [];
        arrayAdd(token[TOKEN_REFS], refName);
        if (refName != "element") token[TOKEN_BINDINGS] = token[TOKEN_REFS].length == 1 ? refName : 0;
      }
      function removeTokenRef(token, refName) {
        var idx = token[TOKEN_REFS].indexOf(refName);
        if (idx != -1) {
          var indexBinding = token[TOKEN_BINDINGS] && typeof token[TOKEN_BINDINGS] == "number";
          token[TOKEN_REFS].splice(idx, 1);
          if (indexBinding) if (idx == token[TOKEN_BINDINGS] - 1) token[TOKEN_BINDINGS] = refName;
          if (!token[TOKEN_REFS].length) token[TOKEN_REFS] = 0; else {
            if (indexBinding) token[TOKEN_BINDINGS] -= idx < token[TOKEN_BINDINGS] - 1;
          }
        }
      }
      function tokenAttrs(token) {
        var result = {};
        if (token.attrs) for (var i = 0, attr; attr = token.attrs[i]; i++) result[name(attr)] = attr.value;
        return result;
      }
      function addUnique(array, items) {
        for (var i = 0; i < items.length; i++) arrayAdd(array, items[i]);
      }
      function process(tokens, template, options) {
        function modifyAttr(token, name, action) {
          var attrs = tokenAttrs(token);
          if (name) attrs.name = name;
          if (!attrs.name) {
            template.warns.push("Instruction <b:" + token.name + "> has no attribute name");
            return;
          }
          if (!IDENT.test(attrs.name)) {
            template.warns.push("Bad attribute name `" + attrs.name + "`");
            return;
          }
          var includedToken = tokenRefMap[attrs.ref || "element"];
          if (includedToken) {
            if (includedToken.token[TOKEN_TYPE] == TYPE_ELEMENT) {
              var itAttrs = includedToken.token;
              var isEvent = attrs.name.match(ATTR_EVENT_RX);
              var itType = isEvent ? TYPE_ATTRIBUTE_EVENT : ATTR_TYPE_BY_NAME[attrs.name] || TYPE_ATTRIBUTE;
              var valueIdx = ATTR_VALUE_INDEX[itType] || ATTR_VALUE;
              var itAttrToken = itAttrs && arraySearch(itAttrs, attrs.name, function(token) {
                if (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT) return "event-" + token[1];
                return ATTR_NAME_BY_TYPE[token[TOKEN_TYPE]] || token[ATTR_NAME];
              }, ELEMENT_ATTRS);
              if (!itAttrToken && action != "remove") {
                if (isEvent) {
                  itAttrToken = [ itType, isEvent[1] ];
                } else {
                  itAttrToken = [ itType, 0, 0, itType == TYPE_ATTRIBUTE ? attrs.name : "" ];
                  if (itType == TYPE_ATTRIBUTE) itAttrToken.push("");
                }
                if (!itAttrs) {
                  itAttrs = [];
                  includedToken.token.push(itAttrs);
                }
                itAttrs.push(itAttrToken);
              }
              var classOrStyle = attrs.name == "class" || attrs.name == "style";
              switch (action) {
                case "set":
                  if (itAttrToken[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT) {
                    if (attrs.value == isEvent[1]) itAttrToken.length = 2; else itAttrToken[valueIdx] = attrs.value;
                    return;
                  }
                  var parsed = processAttr(attrs.name, attrs.value);
                  itAttrToken[TOKEN_BINDINGS] = parsed.binding;
                  if (!options.optimizeSize || !itAttrToken[TOKEN_BINDINGS] || classOrStyle) itAttrToken[valueIdx] = parsed.value || ""; else itAttrToken.length = valueIdx;
                  if (classOrStyle) if (!itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx]) {
                    arrayRemove(itAttrs, itAttrToken);
                    return;
                  }
                  break;
                case "append":
                  var parsed = processAttr(attrs.name, attrs.value);
                  if (!isEvent) {
                    if (parsed.binding) {
                      var attrBindings = itAttrToken[TOKEN_BINDINGS];
                      if (attrBindings) {
                        switch (attrs.name) {
                          case "style":
                            var oldBindingMap = {};
                            for (var i = 0, oldBinding; oldBinding = attrBindings[i]; i++) oldBindingMap[oldBinding[2]] = i;
                            for (var i = 0, newBinding; newBinding = parsed.binding[i]; i++) if (newBinding[2] in oldBindingMap) attrBindings[oldBindingMap[newBinding[2]]] = newBinding; else attrBindings.push(newBinding);
                            break;
                          case "class":
                            attrBindings.push.apply(attrBindings, parsed.binding);
                            break;
                          default:
                            parsed.binding[0].forEach(function(name) {
                              arrayAdd(this, name);
                            }, attrBindings[0]);
                            for (var i = 0; i < parsed.binding[1].length; i++) {
                              var value = parsed.binding[1][i];
                              if (typeof value == "number") value = attrBindings[0].indexOf(parsed.binding[0][value]);
                              attrBindings[1].push(value);
                            }
                        }
                      } else {
                        itAttrToken[TOKEN_BINDINGS] = parsed.binding;
                        if (!classOrStyle) itAttrToken[TOKEN_BINDINGS][1].unshift(itAttrToken[valueIdx]);
                      }
                    } else {
                      if (!classOrStyle && itAttrToken[TOKEN_BINDINGS]) itAttrToken[TOKEN_BINDINGS][1].push(attrs.value);
                    }
                  }
                  if (parsed.value) itAttrToken[valueIdx] = (itAttrToken[valueIdx] || "") + (itAttrToken[valueIdx] && (isEvent || classOrStyle) ? " " : "") + parsed.value;
                  if (classOrStyle) if (!itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx]) {
                    arrayRemove(itAttrs, itAttrToken);
                    return;
                  }
                  break;
                case "remove":
                  if (itAttrToken) arrayRemove(itAttrs, itAttrToken);
                  break;
              }
            } else {
              template.warns.push("Attribute modificator is not reference to element token (reference name: " + (attrs.ref || "element") + ")");
            }
          }
        }
        var result = [];
        for (var i = 0, token, item; token = tokens[i]; i++) {
          var refs = refList(token);
          var bindings = refs && refs.length == 1 ? refs[0] : 0;
          switch (token.type) {
            case TYPE_ELEMENT:
              if (token.prefix == "b") {
                var elAttrs = tokenAttrs(token);
                switch (token.name) {
                  case "resource":
                  case "style":
                    if (token.name == "resource") basis.dev.warn("<b:resource> is deprecated and will be removed in next minor release. Use <b:style> instead." + (template.sourceUrl ? " File: " + template.sourceUrl : ""));
                    if (elAttrs.src) {
                      if (!/^(\.\/|\.\.|\/)/.test(elAttrs.src)) basis.dev.warn("Bad usage: <b:" + token.name + ' src="' + elAttrs.src + '"/>.\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.');
                      template.resources.push(path.resolve(template.baseURI + elAttrs.src));
                    }
                    break;
                  case "l10n":
                    if (template.l10nResolved) template.warns.push("<b:l10n> must be declared before any `l10n:` token (instruction ignored)");
                    if (elAttrs.src) {
                      if (!/^(\.\/|\.\.|\/)/.test(elAttrs.src)) basis.dev.warn("Bad usage: <b:" + token.name + ' src="' + elAttrs.src + '"/>.\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.');
                      template.dictURI = path.resolve(template.baseURI, elAttrs.src);
                    }
                    break;
                  case "define":
                    if ("name" in elAttrs && !template.defines[elAttrs.name]) {
                      switch (elAttrs.type) {
                        case "bool":
                          template.defines[elAttrs.name] = [ elAttrs["default"] == "true" ? 1 : 0 ];
                          break;
                        case "enum":
                          var values = elAttrs.values ? elAttrs.values.trim().split(" ") : [];
                          template.defines[elAttrs.name] = [ values.indexOf(elAttrs["default"]) + 1, values ];
                          break;
                        default:
                          template.warns.push("Bad define type `" + elAttrs.type + "` for " + elAttrs.name);
                      }
                    }
                    break;
                  case "text":
                    var text = token.childs[0];
                    tokens[i--] = basis.object.extend(text, {
                      refs: (elAttrs.ref || "").trim().split(/\s+/),
                      value: "notrim" in elAttrs ? text.value : text.value.replace(/^\s*[\r\n]+|[\r\n]\s*$/g, "")
                    });
                    break;
                  case "include":
                    var templateSrc = elAttrs.src;
                    if (templateSrc) {
                      var isTemplateRef = /^#\d+$/.test(templateSrc);
                      var url = isTemplateRef ? templateSrc.substr(1) : templateSrc;
                      var resource;
                      if (isTemplateRef) resource = templateList[url]; else if (/^[a-z0-9\.]+$/i.test(url) && !/\.tmpl$/.test(url)) resource = getSourceByPath(url); else {
                        if (!/^(\.\/|\.\.|\/)/.test(url)) basis.dev.warn('Bad usage: <b:include src="' + url + '"/>.\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.');
                        resource = basis.resource(path.resolve(template.baseURI + url));
                      }
                      if (!resource) {
                        template.warns.push('<b:include src="' + templateSrc + '"> is not resolved, instruction ignored');
                        basis.dev.warn('<b:include src="' + templateSrc + '"> is not resolved, instruction ignored');
                        continue;
                      }
                      if (includeStack.indexOf(resource) == -1) {
                        var decl;
                        arrayAdd(template.deps, resource);
                        includeStack.push(resource);
                        if (isTemplateRef) {
                          if (resource.source.bindingBridge) arrayAdd(template.deps, resource.source);
                          decl = getDeclFromSource(resource.source, resource.baseURI, true, options);
                        } else {
                          decl = getDeclFromSource(resource, resource.url ? path.dirname(resource.url) + "/" : "", true, options);
                        }
                        includeStack.pop();
                        if (decl.resources && "no-style" in elAttrs == false) addUnique(template.resources, decl.resources);
                        if (decl.deps) addUnique(template.deps, decl.deps);
                        if (decl.l10n) addUnique(template.l10n, decl.l10n);
                        var tokenRefMap = normalizeRefs(decl.tokens);
                        var instructions = (token.childs || []).slice();
                        if (elAttrs["class"]) instructions.push({
                          type: TYPE_ELEMENT,
                          prefix: "b",
                          name: "append-class",
                          attrs: [ {
                            type: TYPE_ATTRIBUTE,
                            name: "value",
                            value: elAttrs["class"]
                          } ]
                        });
                        if (elAttrs.id) instructions.push({
                          type: TYPE_ELEMENT,
                          prefix: "b",
                          name: "set-attr",
                          attrs: [ {
                            type: TYPE_ATTRIBUTE,
                            name: "name",
                            value: "id"
                          }, {
                            type: TYPE_ATTRIBUTE,
                            name: "value",
                            value: elAttrs.id
                          } ]
                        });
                        if (elAttrs.ref) if (tokenRefMap.element) elAttrs.ref.trim().split(/\s+/).map(function(refName) {
                          addTokenRef(tokenRefMap.element.token, refName);
                        });
                        for (var j = 0, child; child = instructions[j]; j++) {
                          if (child.type == TYPE_ELEMENT && child.prefix == "b") {
                            switch (child.name) {
                              case "replace":
                              case "remove":
                              case "before":
                              case "after":
                                var replaceOrRemove = child.name == "replace" || child.name == "remove";
                                var childAttrs = tokenAttrs(child);
                                var ref = "ref" in childAttrs || !replaceOrRemove ? childAttrs.ref : "element";
                                var tokenRef = ref && tokenRefMap[ref];
                                if (tokenRef) {
                                  var pos = tokenRef.owner.indexOf(tokenRef.token);
                                  if (pos != -1) {
                                    var args = [ pos + (child.name == "after"), replaceOrRemove ];
                                    if (child.name != "remove") args = args.concat(process(child.childs, template, options) || []);
                                    tokenRef.owner.splice.apply(tokenRef.owner, args);
                                  }
                                }
                                break;
                              case "prepend":
                              case "append":
                                var childAttrs = tokenAttrs(child);
                                var ref = "ref" in childAttrs ? childAttrs.ref : "element";
                                var tokenRef = ref && tokenRefMap[ref];
                                var token = tokenRef && tokenRef.token;
                                if (token && token[TOKEN_TYPE] == TYPE_ELEMENT) {
                                  var childs = process(child.childs, template, options) || [];
                                  if (child.name == "prepend") token.splice.apply(token, [ ELEMENT_ATTRS, 0 ].concat(childs)); else token.push.apply(token, childs);
                                }
                                break;
                              case "attr":
                              case "set-attr":
                                modifyAttr(child, false, "set");
                                break;
                              case "append-attr":
                                modifyAttr(child, false, "append");
                                break;
                              case "remove-attr":
                                modifyAttr(child, false, "remove");
                                break;
                              case "class":
                              case "append-class":
                                modifyAttr(child, "class", "append");
                                break;
                              case "set-class":
                                modifyAttr(child, "class", "set");
                                break;
                              case "remove-class":
                                modifyAttr(child, "class", "remove");
                                break;
                              case "add-ref":
                                var childAttrs = tokenAttrs(child);
                                var ref = "ref" in childAttrs ? childAttrs.ref : "element";
                                var tokenRef = ref && tokenRefMap[ref];
                                var token = tokenRef && tokenRef.token;
                                if (token && childAttrs.name) addTokenRef(token, childAttrs.name);
                                break;
                              case "remove-ref":
                                var childAttrs = tokenAttrs(child);
                                var ref = "ref" in childAttrs ? childAttrs.ref : "element";
                                var tokenRef = ref && tokenRefMap[ref];
                                var token = tokenRef && tokenRef.token;
                                if (token) removeTokenRef(token, childAttrs.name || childAttrs.ref);
                                break;
                              default:
                                template.warns.push("Unknown instruction tag <b:" + child.name + ">");
                            }
                          } else decl.tokens.push.apply(decl.tokens, process([ child ], template, options) || []);
                        }
                        if (tokenRefMap.element) removeTokenRef(tokenRefMap.element.token, "element");
                        result.push.apply(result, decl.tokens);
                      } else {
                        var stack = includeStack.slice(includeStack.indexOf(resource) || 0).concat(resource).map(function(res) {
                          if (res instanceof Template) res = res.source;
                          if (res instanceof L10nProxyToken) return "{l10n:" + res.token.name + "@" + res.token.dictionary.resource.url + "}";
                          return res.url || "[inline template]";
                        });
                        template.warns.push("Recursion: ", stack.join(" -> "));
                        basis.dev.warn("Recursion in template " + (template.sourceUrl || "[inline template]") + ": ", stack.join(" -> "));
                      }
                    }
                    break;
                }
                continue;
              }
              item = [ 1, bindings, refs, name(token) ];
              item.push.apply(item, attrs(token, item, options.optimizeSize) || []);
              item.push.apply(item, process(token.childs, template, options) || []);
              break;
            case TYPE_TEXT:
              if (refs && refs.length == 2 && arraySearch(refs, "element")) bindings = refs[+!refs.lastSearchIndex];
              if (bindings) {
                var l10nBinding = absl10n(bindings, template.dictURI);
                var parts = l10nBinding.split(/[:@\{]/);
                if (parts[0] == "l10n" && parts.length == 3) {
                  if (!parts[2]) {
                    arrayRemove(refs, bindings);
                    if (refs.length == 0) refs = null;
                    bindings = 0;
                    token.value = token.value.replace(/\}$/, "@undefined}");
                  } else {
                    var l10nId = parts.slice(1).join("@");
                    var l10nToken = basis.l10n.token(l10nId);
                    var l10nTemplate = getL10nTemplate(l10nToken);
                    template.l10nResolved = true;
                    if (l10nTemplate && l10nToken.type == "markup") {
                      tokens[i--] = tokenize('<b:include src="#' + l10nTemplate.templateId + '"/>')[0];
                      continue;
                    } else arrayAdd(template.l10n, l10nId);
                  }
                }
              }
              item = [ 3, bindings, refs ];
              if (!refs || token.value != "{" + refs.join("|") + "}") item.push(untoken(token.value));
              break;
            case TYPE_COMMENT:
              if (options.optimizeSize && !bindings && !refs) continue;
              item = [ 8, bindings, refs ];
              if (!options.optimizeSize) if (!refs || token.value != "{" + refs.join("|") + "}") item.push(untoken(token.value));
              break;
          }
          while (item[item.length - 1] === 0) item.pop();
          result.push(item);
        }
        return result.length ? result : 0;
      }
      function absl10n(value, dictURI) {
        if (typeof value != "string") return value;
        var parts = value.split(":");
        if (parts.length == 2 && parts[0] == "l10n" && parts[1].indexOf("@") == -1) parts[1] = parts[1] + "@" + dictURI;
        return parts.join(":");
      }
      function normalizeRefs(tokens, dictURI, map, stIdx) {
        if (!map) map = {};
        for (var i = stIdx || 0, token; token = tokens[i]; i++) {
          if (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT) continue;
          var refs = token[TOKEN_REFS];
          if (refs) {
            for (var j = refs.length - 1, refName; refName = refs[j]; j--) {
              if (refName.indexOf(":") != -1) {
                removeTokenRef(token, refName);
                continue;
              }
              if (map[refName]) removeTokenRef(map[refName].token, refName);
              if (token[TOKEN_BINDINGS] == refName) token[TOKEN_BINDINGS] = j + 1;
              map[refName] = {
                owner: tokens,
                token: token
              };
            }
          }
          switch (token[TOKEN_TYPE]) {
            case TYPE_TEXT:
              token[TOKEN_BINDINGS] = absl10n(token[TOKEN_BINDINGS], dictURI);
              break;
            case TYPE_ATTRIBUTE:
              if (token[TOKEN_BINDINGS]) {
                var array = token[TOKEN_BINDINGS][0];
                for (var j = 0; j < array.length; j++) array[j] = absl10n(array[j], dictURI);
              }
              break;
            case TYPE_ELEMENT:
              normalizeRefs(token, dictURI, map, ELEMENT_ATTRS);
              break;
          }
        }
        return map;
      }
      function applyDefines(tokens, template, options, stIdx) {
        var unpredictable = 0;
        for (var i = stIdx || 0, token; token = tokens[i]; i++) {
          if (token[TOKEN_TYPE] == TYPE_ELEMENT) unpredictable += applyDefines(token, template, options, ELEMENT_ATTRS);
          if (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_CLASS || token[TOKEN_TYPE] == TYPE_ATTRIBUTE && token[ATTR_NAME] == "class") {
            var bindings = token[TOKEN_BINDINGS];
            var valueIdx = ATTR_VALUE - (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_CLASS);
            if (bindings) {
              var newAttrValue = (token[valueIdx] || "").trim().split(" ");
              for (var k = 0, bind; bind = bindings[k]; k++) {
                if (bind.length > 2) continue;
                var bindName = bind[1].split(":").pop();
                var bindDef = template.defines[bindName];
                if (bindDef) {
                  bind.push.apply(bind, bindDef);
                  bindDef.used = true;
                  if (bindDef[0]) {
                    if (bindDef.length == 1) arrayAdd(newAttrValue, bind[0] + bindName); else arrayAdd(newAttrValue, bind[0] + bindDef[1][bindDef[0] - 1]);
                  }
                } else {
                  template.warns.push("Unpredictable value `" + bindName + "` in class binding: " + bind[0] + "{" + bind[1] + "}");
                  unpredictable++;
                }
              }
              token[valueIdx] = newAttrValue.join(" ");
              if (options.optimizeSize && !token[valueIdx]) token.length = valueIdx;
            }
          }
        }
        return unpredictable;
      }
      return function makeDeclaration(source, baseURI, options, sourceUrl) {
        options = options || {};
        var warns = [];
        var source_;
        var result = {
          sourceUrl: sourceUrl,
          baseURI: baseURI || "",
          tokens: null,
          resources: [],
          deps: [],
          l10n: [],
          defines: {},
          unpredictable: true,
          warns: warns
        };
        result.dictURI = sourceUrl ? basis.path.resolve(sourceUrl) : baseURI || "";
        if (result.dictURI) {
          var extname = basis.path.extname(result.dictURI);
          if (extname && extname != ".l10n") result.dictURI = result.dictURI.substr(0, result.dictURI.length - extname.length) + ".l10n";
        }
        if (!source.templateTokens) {
          source_ = source;
          source = tokenize(String(source));
        } else {
          if (source.warns) warns.push.apply(warns, source.warns);
        }
        result.tokens = process(source, result, options);
        if (!result.tokens) result.tokens = [ [ 3, 0, 0, "" ] ];
        if (source_) result.tokens.source_ = source_;
        addTokenRef(result.tokens[0], "element");
        normalizeRefs(result.tokens, result.dictURI);
        result.unpredictable = !!applyDefines(result.tokens, result, options);
        for (var key in result.defines) if (!result.defines[key].used) warns.push("Unused define for " + key);
        delete result.defines;
        delete result.l10nResolved;
        if (!warns.length) result.warns = false;
        return result;
      };
    }();
    var usableResources = {
      ".css": true
    };
    function startUseResource(uri) {
      if (usableResources[path.extname(uri)]) basis.resource(uri)().startUse();
    }
    function stopUseResource(uri) {
      if (usableResources[path.extname(uri)]) basis.resource(uri)().stopUse();
    }
    function templateSourceUpdate() {
      if (this.destroyBuilder) buildTemplate.call(this);
      for (var i = 0, attach; attach = this.attaches_[i]; i++) attach.handler.call(attach.context);
    }
    function cloneDecl(array) {
      var result = [];
      if (array.source_) result.source_ = array.source_;
      for (var i = 0; i < array.length; i++) result.push(Array.isArray(array[i]) ? cloneDecl(array[i]) : array[i]);
      return result;
    }
    function getDeclFromSource(source, baseURI, clone, options) {
      var result = source;
      var sourceUrl;
      if (typeof result == "function") {
        baseURI = "baseURI" in source ? source.baseURI : baseURI;
        sourceUrl = "url" in source ? source.url : sourceUrl;
        result = result();
      }
      if (result instanceof basis.Token) {
        baseURI = "baseURI" in source ? source.baseURI : baseURI;
        sourceUrl = "url" in source ? source.url : sourceUrl;
        result = result.get();
      }
      if (Array.isArray(result)) {
        if (clone) result = cloneDecl(result);
        result = {
          tokens: result
        };
      } else {
        if (typeof result != "object" || !Array.isArray(result.tokens)) result = String(result);
      }
      if (typeof result == "string") result = makeDeclaration(result, baseURI, options, sourceUrl);
      return result;
    }
    function l10nHandler(value) {
      if (this.type != "markup" && this.token.type == "markup") {
        buildTemplate.call(this.template);
      }
    }
    function buildTemplate() {
      var decl = getDeclFromSource(this.source, this.baseURI);
      var destroyBuilder = this.destroyBuilder;
      var funcs = this.builder(decl.tokens, this);
      var deps = this.deps_;
      var l10n = this.l10n_;
      if (deps) {
        this.deps_ = null;
        for (var i = 0, dep; dep = deps[i]; i++) dep.bindingBridge.detach(dep, buildTemplate, this);
      }
      if (l10n) for (var i = 0, item; item = l10n[i]; i++) item.token.bindingBridge.detach(item.token, l10nHandler, item);
      if (decl.deps && decl.deps.length) {
        deps = decl.deps;
        this.deps_ = deps;
        for (var i = 0, dep; dep = deps[i]; i++) dep.bindingBridge.attach(dep, buildTemplate, this);
      }
      if (decl.l10n) {
        l10n = decl.l10n;
        this.l10n_ = {};
        for (var i = 0, key; key = l10n[i]; i++) {
          var l10nToken = basis.l10n.token(key);
          l10nToken.bindingBridge.attach(l10nToken, l10nHandler, this.l10n_[key] = {
            template: this,
            token: l10nToken,
            type: l10nToken.type
          });
        }
      }
      this.createInstance = funcs.createInstance;
      this.clearInstance = funcs.destroyInstance;
      this.getBinding = function() {
        return {
          names: funcs.keys
        };
      };
      this.destroyBuilder = funcs.destroy;
      this.instances_ = funcs.instances_;
      this.decl_ = decl;
      var declResources = decl.resources && decl.resources.length > 0 ? decl.resources : null;
      if (declResources) for (var i = 0, res; res = declResources[i]; i++) startUseResource(res);
      if (this.resources) for (var i = 0, res; res = this.resources[i]; i++) stopUseResource(res);
      this.resources = declResources;
      if (destroyBuilder) destroyBuilder(true);
    }
    function sourceById(sourceId) {
      var host = document.getElementById(sourceId);
      if (host && host.tagName == "SCRIPT") {
        if (host.type == "text/basis-template") return host.textContent || host.text;
        basis.dev.warn("Template script element with wrong type", host.type);
        return "";
      }
      basis.dev.warn("Template script element with id `" + sourceId + "` not found");
      return "";
    }
    function resolveSourceById(sourceId) {
      return function() {
        return sourceById(sourceId);
      };
    }
    var Template = Class(null, {
      className: namespace + ".Template",
      __extend__: function(value) {
        if (value instanceof Template) return value;
        if (value instanceof TemplateSwitchConfig) return new TemplateSwitcher(value);
        return new Template(value);
      },
      source: "",
      baseURI: "",
      init: function(source) {
        if (templateList.length == 4096) throw "Too many templates (maximum 4096)";
        this.attaches_ = [];
        this.setSource(source || "");
        this.templateId = templateList.push(this) - 1;
      },
      bindingBridge: {
        attach: function(template, handler, context) {
          for (var i = 0, listener; listener = template.attaches_[i]; i++) if (listener.handler == handler && listener.context == context) return;
          template.attaches_.push({
            handler: handler,
            context: context
          });
        },
        detach: function(template, handler, context) {
          for (var i = 0, listener; listener = template.attaches_[i]; i++) if (listener.handler == handler && listener.context == context) {
            template.attaches_.splice(i, 1);
            return;
          }
        },
        get: function() {}
      },
      createInstance: function(object, actionCallback, updateCallback, bindings, bindingInterface) {
        buildTemplate.call(this);
        return this.createInstance(object, actionCallback, updateCallback, bindings, bindingInterface);
      },
      clearInstance: function(tmpl) {},
      getBinding: function(bindings) {
        buildTemplate.call(this);
        return this.getBinding(bindings);
      },
      setSource: function(source) {
        var oldSource = this.source;
        if (oldSource != source) {
          if (typeof source == "string") {
            var m = source.match(/^([a-z]+):/);
            if (m) {
              var prefix = m[1];
              source = source.substr(m[0].length);
              switch (prefix) {
                case "file":
                  source = basis.resource(source);
                  break;
                case "id":
                  source = resolveSourceById(source);
                  break;
                case "tokens":
                  source = basis.string.toObject(source);
                  source.isDecl = true;
                  break;
                case "raw":
                  break;
                case "path":
                  source = getSourceByPath(source);
                  break;
                default:
                  basis.dev.warn(namespace + ".Template.setSource: Unknown prefix " + prefix + " for template source was ingnored.");
              }
            }
          }
          if (oldSource && oldSource.bindingBridge) {
            var tmplList = oldSource.url && tmplFilesMap[oldSource.url];
            if (tmplList) {
              arrayRemove(tmplList, this);
              if (!tmplList.length) delete tmplFilesMap[oldSource.url];
            }
            this.baseURI = "";
            this.source.bindingBridge.detach(oldSource, templateSourceUpdate, this);
          }
          if (source && source.bindingBridge) {
            if (source.url) {
              this.baseURI = path.dirname(source.url) + "/";
              if (!tmplFilesMap[source.url]) tmplFilesMap[source.url] = [];
              arrayAdd(tmplFilesMap[source.url], this);
            }
            source.bindingBridge.attach(source, templateSourceUpdate, this);
          }
          this.source = source;
          templateSourceUpdate.call(this);
        }
      },
      destroy: function() {
        if (this.destroyBuilder) this.destroyBuilder();
        this.attaches_ = null;
        this.createInstance = null;
        this.getBinding = null;
        this.resources = null;
        this.source = null;
        this.instances_ = null;
        this.decl_ = null;
      }
    });
    var TemplateSwitchConfig = function(config) {
      basis.object.extend(this, config);
    };
    var TemplateSwitcher = basis.Class(null, {
      className: namespace + ".TemplateSwitcher",
      ruleRet_: null,
      templates_: null,
      templateClass: Template,
      ruleEvents: null,
      rule: String,
      init: function(config) {
        this.ruleRet_ = [];
        this.templates_ = [];
        this.rule = config.rule;
        var events = config.events;
        if (events && events.length) {
          this.ruleEvents = {};
          for (var i = 0, eventName; eventName = events[i]; i++) this.ruleEvents[eventName] = true;
        }
        cleaner.add(this);
      },
      resolve: function(object) {
        var ret = this.rule(object);
        var idx = this.ruleRet_.indexOf(ret);
        if (idx == -1) {
          this.ruleRet_.push(ret);
          idx = this.templates_.push(new this.templateClass(ret)) - 1;
        }
        return this.templates_[idx];
      },
      destroy: function() {
        this.rule = null;
        this.templates_ = null;
        this.ruleRet_ = null;
      }
    });
    function switcher(events, rule) {
      var args = basis.array(arguments);
      var rule = args.pop();
      return new TemplateSwitchConfig({
        rule: rule,
        events: args.join(" ").trim().split(/\s+/)
      });
    }
    var Theme = Class(null, {
      className: namespace + ".Theme",
      get: getSourceByPath
    });
    var SourceWrapper = Class(basis.Token, {
      className: namespace + ".SourceWrapper",
      path: "",
      url: "",
      baseURI: "",
      init: function(value, path) {
        this.path = path;
        basis.Token.prototype.init.call(this, "");
      },
      get: function() {
        return this.value && this.value.bindingBridge ? this.value.bindingBridge.get(this.value) : this.value;
      },
      set: function() {
        var content = getThemeSource(currentThemeName, this.path);
        if (this.value != content) {
          if (this.value && this.value.bindingBridge) this.value.bindingBridge.detach(this.value, SourceWrapper.prototype.apply, this);
          this.value = content;
          this.url = content && content.url || "";
          this.baseURI = (typeof content == "object" || typeof content == "function") && "baseURI" in content ? content.baseURI : path.dirname(this.url) + "/";
          if (this.value && this.value.bindingBridge) this.value.bindingBridge.attach(this.value, SourceWrapper.prototype.apply, this);
          this.apply();
        }
      },
      destroy: function() {
        this.url = null;
        this.baseURI = null;
        if (this.value && this.value.bindingBridge) this.value.bindingBridge.detach(this.value, this.apply, this);
        basis.Token.prototype.destroy.call(this);
      }
    });
    function getSourceByPath() {
      var path = basis.array(arguments).join(".");
      var source = sourceByPath[path];
      if (!source) {
        source = new SourceWrapper("", path);
        sourceByPath[path] = source;
      }
      return source;
    }
    function normalize(list) {
      var used = {};
      var result = [];
      for (var i = 0; i < list.length; i++) if (!used[list[i]]) {
        used[list[i]] = true;
        result.push(list[i]);
      }
      return result;
    }
    function extendFallback(themeName, list) {
      var result = [];
      result.source = normalize(list).join("/");
      var used = {
        base: true
      };
      for (var i = 0; i < list.length; i++) {
        var name = list[i] || "base";
        if (name == themeName || used[name]) continue;
        var theme = getTheme(name);
        used[name] = true;
        result.push(name);
        list.splice.apply(list, [ i + 1, 0 ].concat(themes[name].fallback));
      }
      result.unshift(themeName);
      if (themeName != "base") result.push("base");
      result.value = result.join("/");
      return result;
    }
    function getThemeSource(name, path) {
      var sourceList = themes[name].sourcesList;
      for (var i = 0, map; map = sourceList[i]; i++) if (map.hasOwnProperty(path)) return map[path];
      return "";
    }
    function themeHasEffect(themeName) {
      return themes[currentThemeName].fallback.indexOf(themeName) != -1;
    }
    function syncCurrentThemePath(path) {
      getSourceByPath(path).set();
    }
    function syncCurrentTheme(changed) {
      basis.dev.log("re-apply templates");
      for (var path in sourceByPath) syncCurrentThemePath(path);
    }
    function getTheme(name) {
      if (!name) name = "base";
      if (themes[name]) return themes[name].theme;
      if (!/^([a-z0-9\_\-]+)$/.test(name)) throw "Bad name for theme - " + name;
      var sources = {};
      var sourceList = [ sources ];
      var themeInterface = new Theme;
      themes[name] = {
        theme: themeInterface,
        sources: sources,
        sourcesList: sourceList,
        fallback: []
      };
      var addSource = function(path, source) {
        if (path in sources == false) {
          sources[path] = source;
          if (themeHasEffect(name)) syncCurrentThemePath(path);
        } else basis.dev.warn("Template path `" + path + "` is already defined for theme `" + name + "` (definition ignored).");
        return getSourceByPath(path);
      };
      basis.object.extend(themeInterface, {
        name: name,
        fallback: function(value) {
          if (themeInterface !== baseTheme && arguments.length > 0) {
            var newFallback = typeof value == "string" ? value.split("/") : [];
            var changed = {};
            newFallback = extendFallback(name, newFallback);
            if (themes[name].fallback.source != newFallback.source) {
              themes[name].fallback.source = newFallback.source;
              basis.dev.log("fallback changed");
              for (var themeName in themes) {
                var curFallback = themes[themeName].fallback;
                var newFallback = extendFallback(themeName, (curFallback.source || "").split("/"));
                if (newFallback.value != curFallback.value) {
                  changed[themeName] = true;
                  themes[themeName].fallback = newFallback;
                  var sourceList = themes[themeName].sourcesList;
                  sourceList.length = newFallback.length;
                  for (var i = 0; i < sourceList.length; i++) sourceList[i] = themes[newFallback[i]].sources;
                }
              }
            }
            var currentFallback = themes[currentThemeName].fallback;
            for (var themeName in changed) {
              if (themeHasEffect(themeName)) {
                syncCurrentTheme();
                break;
              }
            }
          }
          var result = themes[name].fallback.slice(1);
          result.source = themes[name].fallback.source;
          return result;
        },
        define: function(what, wherewith) {
          if (typeof what == "function") what = what();
          if (typeof what == "string") {
            if (typeof wherewith == "object") {
              var namespace = what;
              var dictionary = wherewith;
              var result = {};
              for (var key in dictionary) if (dictionary.hasOwnProperty(key)) result[key] = addSource(namespace + "." + key, dictionary[key]);
              return result;
            } else {
              if (arguments.length == 1) {
                return getSourceByPath(what);
              } else {
                return addSource(what, wherewith);
              }
            }
          } else {
            if (typeof what == "object") {
              var dictionary = what;
              for (var path in dictionary) if (dictionary.hasOwnProperty(path)) addSource(path, dictionary[path]);
              return themeInterface;
            } else {
              basis.dev.warn("Wrong first argument for basis.template.Theme#define");
            }
          }
        },
        apply: function() {
          if (name != currentThemeName) {
            currentThemeName = name;
            syncCurrentTheme();
            for (var i = 0, handler; handler = themeChangeHandlers[i]; i++) handler.fn.call(handler.context, name);
            basis.dev.info("Template theme switched to `" + name + "`");
          }
          return themeInterface;
        },
        getSource: function(path, withFallback) {
          return withFallback ? getThemeSource(name, path) : sources[path];
        },
        drop: function(path) {
          if (sources.hasOwnProperty(path)) {
            delete sources[path];
            if (themeHasEffect(name)) syncCurrentThemePath(path);
          }
        }
      });
      themes[name].fallback = extendFallback(name, []);
      sourceList.push(themes["base"].sources);
      return themeInterface;
    }
    var themes = {};
    var sourceByPath = {};
    var baseTheme = getTheme();
    var currentThemeName = "base";
    var themeChangeHandlers = [];
    function onThemeChange(fn, context, fire) {
      themeChangeHandlers.push({
        fn: fn,
        context: context
      });
      if (fire) fn.call(context, currentThemeName);
    }
    cleaner.add({
      destroy: function() {
        for (var path in sourceByPath) sourceByPath[path].destroy();
        themes = null;
        sourceByPath = null;
        for (var i = 0, template; template = templateList[i]; i++) template.destroy();
        templateList = null;
      }
    });
    module.exports = {
      DECLARATION_VERSION: DECLARATION_VERSION,
      TYPE_ELEMENT: TYPE_ELEMENT,
      TYPE_ATTRIBUTE: TYPE_ATTRIBUTE,
      TYPE_ATTRIBUTE_CLASS: TYPE_ATTRIBUTE_CLASS,
      TYPE_ATTRIBUTE_STYLE: TYPE_ATTRIBUTE_STYLE,
      TYPE_ATTRIBUTE_EVENT: TYPE_ATTRIBUTE_EVENT,
      TYPE_TEXT: TYPE_TEXT,
      TYPE_COMMENT: TYPE_COMMENT,
      TOKEN_TYPE: TOKEN_TYPE,
      TOKEN_BINDINGS: TOKEN_BINDINGS,
      TOKEN_REFS: TOKEN_REFS,
      ATTR_NAME: ATTR_NAME,
      ATTR_VALUE: ATTR_VALUE,
      ATTR_NAME_BY_TYPE: ATTR_NAME_BY_TYPE,
      ELEMENT_NAME: ELEMENT_NAME,
      ELEMENT_ATTRS: ELEMENT_ATTRS,
      ELEMENT_CHILDS: ELEMENT_CHILDS,
      TEXT_VALUE: TEXT_VALUE,
      COMMENT_VALUE: COMMENT_VALUE,
      L10nProxyToken: L10nProxyToken,
      TemplateSwitchConfig: TemplateSwitchConfig,
      TemplateSwitcher: TemplateSwitcher,
      Template: Template,
      SourceWrapper: SourceWrapper,
      switcher: switcher,
      tokenize: tokenize,
      getDeclFromSource: getDeclFromSource,
      makeDeclaration: makeDeclaration,
      getL10nTemplate: getL10nTemplate,
      Theme: Theme,
      theme: getTheme,
      getThemeList: function() {
        return basis.object.keys(themes);
      },
      currentTheme: function() {
        return themes[currentThemeName].theme;
      },
      setTheme: function(name) {
        return getTheme(name).apply();
      },
      onThemeChange: onThemeChange,
      define: baseTheme.define,
      get: getSourceByPath,
      getPathList: function() {
        return basis.object.keys(sourceByPath);
      }
    };
    getTheme("base").define({
      "#1": basis.resource("./0.tmpl"),
      "#2": basis.resource("./1.tmpl"),
      "#3": basis.resource("./2.tmpl"),
      "#4": basis.resource("./3.tmpl"),
      "#5": basis.resource("./4.tmpl"),
      "#6": basis.resource("./5.tmpl"),
      "#7": basis.resource("./6.tmpl"),
      "#8": basis.resource("./7.tmpl"),
      "#9": basis.resource("./8.tmpl")
    });
  },
  "8.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./9.js");
    basis.require("./3.js");
    basis.require("./7.js");
    basis.require("./a.js");
    var namespace = this.path;
    var document = global.document;
    var domEvent = basis.dom.event;
    var arrayFrom = basis.array.from;
    var camelize = basis.string.camelize;
    var l10nToken = basis.l10n.token;
    var getFunctions = basis.template.htmlfgen.getFunctions;
    var TemplateSwitchConfig = basis.template.TemplateSwitchConfig;
    var TemplateSwitcher = basis.template.TemplateSwitcher;
    var Template = basis.template.Template;
    var TYPE_ELEMENT = basis.template.TYPE_ELEMENT;
    var TYPE_ATTRIBUTE = basis.template.TYPE_ATTRIBUTE;
    var TYPE_TEXT = basis.template.TYPE_TEXT;
    var TYPE_COMMENT = basis.template.TYPE_COMMENT;
    var TOKEN_TYPE = basis.template.TOKEN_TYPE;
    var TOKEN_BINDINGS = basis.template.TOKEN_BINDINGS;
    var TOKEN_REFS = basis.template.TOKEN_REFS;
    var ATTR_NAME = basis.template.ATTR_NAME;
    var ATTR_VALUE = basis.template.ATTR_VALUE;
    var ATTR_NAME_BY_TYPE = basis.template.ATTR_NAME_BY_TYPE;
    var ELEMENT_NAME = basis.template.ELEMENT_NAME;
    var TEXT_VALUE = basis.template.TEXT_VALUE;
    var COMMENT_VALUE = basis.template.COMMENT_VALUE;
    var eventAttr = /^event-(.+)+/;
    var tmplEventListeners = {};
    var templates = {};
    var namespaceURI = {
      svg: "http://www.w3.org/2000/svg"
    };
    var afterEventAction = {};
    var insideElementEvent = {};
    var MOUSE_ENTER_LEAVE_SUPPORT = "onmouseenter" in document.documentElement;
    var CAPTURE_FALLBACK = !document.addEventListener && "__basisTemplate" + parseInt(1e9 * Math.random());
    if (CAPTURE_FALLBACK) global[CAPTURE_FALLBACK] = function(eventName, event) {
      domEvent.fireEvent(document, eventName);
      event.returnValue = true;
      var listener = tmplEventListeners[eventName];
      if (listener) listener(new domEvent.Event(event));
    };
    var CLONE_NORMALIZATION_TEXT_BUG = function() {
      var element = document.createElement("div");
      element.appendChild(document.createTextNode("a"));
      element.appendChild(document.createTextNode("a"));
      return element.cloneNode(true).childNodes.length == 1;
    }();
    var SET_CLASS_ATTRIBUTE_BUG = function() {
      var element = document.createElement("div");
      element.setAttribute("class", "a");
      return !element.className;
    }();
    var SET_STYLE_ATTRIBUTE_BUG = function() {
      var element = document.createElement("div");
      element.setAttribute("style", "position:absolute");
      return element.style.position != "absolute";
    }();
    var IS_SET_STYLE_SAFE = !!function() {
      try {
        return document.documentElement.style.color = "x";
      } catch (e) {}
    }();
    if (typeof Node != "undefined" && !Node.prototype.contains) Node.prototype.contains = function(child) {
      return !!(this.compareDocumentPosition(child) & 16);
    };
    var l10nTemplates = {};
    function getL10nTemplate(token) {
      var template = basis.template.getL10nTemplate(token);
      var id = template.templateId;
      var htmlTemplate = l10nTemplates[id];
      if (!htmlTemplate) htmlTemplate = l10nTemplates[id] = new HtmlTemplate(template.source);
      return htmlTemplate;
    }
    function createEventHandler(attrName) {
      return function(event) {
        if (event.type == "click" && event.which == 3) return;
        var bubble = insideElementEvent[event.type] || event.type != "mouseenter" && event.type != "mouseleave";
        var attrCursor = event.sender;
        var attr;
        while (attrCursor) {
          attr = attrCursor.getAttribute && attrCursor.getAttribute(attrName);
          if (!bubble || typeof attr == "string") break;
          attrCursor = attrCursor.parentNode;
        }
        if (typeof attr == "string") {
          var cursor = attrCursor;
          var actionTarget = cursor;
          var refId;
          var tmplRef;
          if (insideElementEvent[event.type]) {
            var relTarget = event.relatedTarget;
            if (relTarget && (cursor === relTarget || cursor.contains(relTarget))) cursor = null;
          }
          while (cursor) {
            refId = cursor.basisTemplateId;
            if (typeof refId == "number") {
              if (tmplRef = resolveInstanceById(refId)) break;
            }
            cursor = cursor.parentNode;
          }
          if (tmplRef && tmplRef.action) {
            var actions = attr.trim().split(/\s+/);
            event.actionTarget = actionTarget;
            for (var i = 0, actionName; actionName = actions[i++]; ) tmplRef.action.call(tmplRef.context, actionName, event);
          }
        }
        if (event.type in afterEventAction) afterEventAction[event.type](event, attrCursor);
      };
    }
    var buildHtml = function(tokens, parent) {
      function emulateEvent(origEventName, emulEventName) {
        regEventHandler(emulEventName);
        insideElementEvent[origEventName] = true;
        afterEventAction[emulEventName] = function(event) {
          event = new domEvent.Event(event);
          event.type = origEventName;
          tmplEventListeners[origEventName](event);
        };
        afterEventAction[origEventName] = function(event, cursor) {
          cursor = cursor && cursor.parentNode;
          if (cursor) {
            event = new domEvent.Event(event);
            event.type = origEventName;
            event.sender = cursor;
            tmplEventListeners[origEventName](event);
          }
        };
      }
      function regEventHandler(eventName) {
        if (!tmplEventListeners[eventName]) {
          tmplEventListeners[eventName] = createEventHandler("event-" + eventName);
          if (!CAPTURE_FALLBACK) {
            if (!MOUSE_ENTER_LEAVE_SUPPORT && eventName == "mouseenter") return emulateEvent(eventName, "mouseover");
            if (!MOUSE_ENTER_LEAVE_SUPPORT && eventName == "mouseleave") return emulateEvent(eventName, "mouseout");
            for (var i = 0, names = domEvent.browserEvents(eventName), browserEventName; browserEventName = names[i]; i++) domEvent.addGlobalHandler(browserEventName, tmplEventListeners[eventName]);
          }
        }
      }
      function setEventAttribute(eventName, actions) {
        regEventHandler(eventName);
        if (CAPTURE_FALLBACK) result.setAttribute("on" + eventName, CAPTURE_FALLBACK + '("' + eventName + '",event)');
        result.setAttribute("event-" + eventName, actions);
      }
      function setAttribute(name, value) {
        if (SET_CLASS_ATTRIBUTE_BUG && name == "class") name = "className";
        if (SET_STYLE_ATTRIBUTE_BUG && name == "style") return result.style.cssText = value;
        result.setAttribute(name, value);
      }
      var result = parent || document.createDocumentFragment();
      for (var i = parent ? 4 : 0, token; token = tokens[i]; i++) {
        switch (token[TOKEN_TYPE]) {
          case TYPE_ELEMENT:
            var tagName = token[ELEMENT_NAME];
            var parts = tagName.split(/:/);
            var element = parts.length > 1 ? document.createElementNS(namespaceURI[parts[0]], tagName) : document.createElement(tagName);
            buildHtml(token, element);
            result.appendChild(element);
            break;
          case TYPE_ATTRIBUTE:
            var attrName = token[ATTR_NAME];
            var attrValue = token[ATTR_VALUE];
            var eventName = attrName.replace(/^event-/, "");
            if (eventName != attrName) {
              setEventAttribute(eventName, attrValue);
            } else {
              if (attrName != "class" && attrName != "style" ? !token[TOKEN_BINDINGS] : attrValue) setAttribute(attrName, attrValue || "");
            }
            break;
          case 4:
          case 5:
            var attrValue = token[ATTR_VALUE - 1];
            if (attrValue) setAttribute(ATTR_NAME_BY_TYPE[token[TOKEN_TYPE]], attrValue);
            break;
          case 6:
            setEventAttribute(token[1], token[2] || token[1]);
            break;
          case TYPE_COMMENT:
            result.appendChild(document.createComment(token[COMMENT_VALUE] || (token[TOKEN_REFS] ? "{" + token[TOKEN_REFS].join("|") + "}" : "")));
            break;
          case TYPE_TEXT:
            if (CLONE_NORMALIZATION_TEXT_BUG && i && tokens[i - 1][TOKEN_TYPE] == TYPE_TEXT) result.appendChild(document.createComment(""));
            result.appendChild(document.createTextNode(token[TEXT_VALUE] || (token[TOKEN_REFS] ? "{" + token[TOKEN_REFS].join("|") + "}" : "") || (token[TOKEN_BINDINGS] ? "{" + token[TOKEN_BINDINGS] + "}" : "")));
            break;
        }
      }
      return result;
    };
    function resolveTemplateById(refId) {
      var templateId = refId & 4095;
      var object = templates[templateId];
      return object && object.template;
    }
    function resolveInstanceById(refId) {
      var templateId = refId & 4095;
      var instanceId = refId >> 12;
      var object = templates[templateId];
      return object && object.instances[instanceId];
    }
    function resolveObjectById(refId) {
      var templateRef = resolveInstanceById(refId);
      return templateRef && templateRef.context;
    }
    function resolveTmplById(refId) {
      var templateRef = resolveInstanceById(refId);
      return templateRef && templateRef.tmpl;
    }
    function getDebugInfoById(refId) {
      var templateRef = resolveInstanceById(refId);
      return templateRef && templateRef.debug && templateRef.debug();
    }
    var builder = function() {
      var WHITESPACE = /\s+/;
      var W3C_DOM_NODE_SUPPORTED = typeof Node == "function" && document instanceof Node;
      var CLASSLIST_SUPPORTED = global.DOMTokenList && document && document.documentElement.classList instanceof global.DOMTokenList;
      var bind_node = W3C_DOM_NODE_SUPPORTED ? function(domRef, oldNode, newValue) {
        var newNode = newValue && newValue instanceof Node ? newValue : domRef;
        if (newNode !== oldNode) oldNode.parentNode.replaceChild(newNode, oldNode);
        return newNode;
      } : function(domRef, oldNode, newValue) {
        var newNode = newValue && typeof newValue == "object" ? newValue : domRef;
        if (newNode !== oldNode) {
          try {
            oldNode.parentNode.replaceChild(newNode, oldNode);
          } catch (e) {
            newNode = domRef;
            if (oldNode !== newNode) oldNode.parentNode.replaceChild(newNode, oldNode);
          }
        }
        return newNode;
      };
      var bind_element = function(domRef, oldNode, newValue) {
        var newNode = bind_node(domRef, oldNode, newValue);
        if (newNode === domRef && typeof newValue == "string") domRef.innerHTML = newValue;
        return newNode;
      };
      var bind_comment = bind_node;
      var bind_textNode = function(domRef, oldNode, newValue) {
        var newNode = bind_node(domRef, oldNode, newValue);
        if (newNode === domRef) domRef.nodeValue = newValue;
        return newNode;
      };
      var bind_attrClass = CLASSLIST_SUPPORTED ? function(domRef, oldClass, newValue, prefix, anim) {
        var newClass = newValue ? prefix + newValue : "";
        if (newClass != oldClass) {
          if (oldClass) domRef.classList.remove(oldClass);
          if (newClass) {
            domRef.classList.add(newClass);
            if (anim) {
              domRef.classList.add(newClass + "-anim");
              basis.nextTick(function() {
                domRef.classList.remove(newClass + "-anim");
              });
            }
          }
        }
        return newClass;
      } : function(domRef, oldClass, newValue, prefix, anim) {
        var newClass = newValue ? prefix + newValue : "";
        if (newClass != oldClass) {
          var className = domRef.className;
          var classNameIsObject = typeof className != "string";
          var classList;
          if (classNameIsObject) className = className.baseVal;
          classList = className.split(WHITESPACE);
          if (oldClass) basis.array.remove(classList, oldClass);
          if (newClass) {
            classList.push(newClass);
            if (anim) {
              basis.array.add(classList, newClass + "-anim");
              basis.nextTick(function() {
                var classList = (classNameIsObject ? domRef.className.baseVal : domRef.className).split(WHITESPACE);
                basis.array.remove(classList, newClass + "-anim");
                if (classNameIsObject) domRef.className.baseVal = classList.join(" "); else domRef.className = classList.join(" ");
              });
            }
          }
          if (classNameIsObject) domRef.className.baseVal = classList.join(" "); else domRef.className = classList.join(" ");
        }
        return newClass;
      };
      var bind_attrStyle = IS_SET_STYLE_SAFE ? function(domRef, propertyName, oldValue, newValue) {
        if (oldValue !== newValue) domRef.style[camelize(propertyName)] = newValue;
        return newValue;
      } : function(domRef, propertyName, oldValue, newValue) {
        if (oldValue !== newValue) {
          try {
            domRef.style[camelize(propertyName)] = newValue;
          } catch (e) {}
        }
        return newValue;
      };
      var bind_attr = function(domRef, attrName, oldValue, newValue) {
        if (oldValue !== newValue) {
          if (newValue) domRef.setAttribute(attrName, newValue); else domRef.removeAttribute(attrName);
        }
        return newValue;
      };
      function updateAttach() {
        this.set(this.name, this.value);
      }
      function resolveValue(bindingName, value, Attaches) {
        var bridge = value && value.bindingBridge;
        var oldAttach = this.attaches && this.attaches[bindingName];
        var tmpl = null;
        if (bridge || oldAttach) {
          if (bridge) {
            if (!oldAttach || value !== oldAttach.value) {
              if (oldAttach) {
                if (oldAttach.tmpl) {
                  oldAttach.tmpl.element.toString = null;
                  getL10nTemplate(oldAttach.value).clearInstance(oldAttach.tmpl);
                }
                oldAttach.value.bindingBridge.detach(oldAttach.value, updateAttach, oldAttach);
              }
              if (value.type == "markup" && value instanceof basis.l10n.Token) {
                var template = getL10nTemplate(value);
                var context = this.context;
                var bindings = this.bindings;
                var bindingInterface = this.bindingInterface;
                tmpl = template.createInstance(context, null, function onRebuild() {
                  tmpl = newAttach.tmpl = template.createInstance(context, null, onRebuild, bindings, bindingInterface);
                  tmpl.element.toString = function() {
                    return value.value;
                  };
                  updateAttach.call(newAttach);
                }, bindings, bindingInterface);
                tmpl.element.toString = function() {
                  return value.value;
                };
              }
              if (!this.attaches) this.attaches = new Attaches;
              var newAttach = this.attaches[bindingName] = {
                name: bindingName,
                value: value,
                tmpl: tmpl,
                set: this.tmpl.set
              };
              bridge.attach(value, updateAttach, newAttach);
            } else tmpl = value && value.type == "markup" ? oldAttach.tmpl : null;
            if (tmpl) return tmpl.element;
            value = bridge.get(value);
          } else {
            if (oldAttach) {
              if (oldAttach.tmpl) {
                oldAttach.tmpl.element.toString = null;
                getL10nTemplate(oldAttach.value).clearInstance(oldAttach.tmpl);
              }
              oldAttach.value.bindingBridge.detach(oldAttach.value, updateAttach, oldAttach);
              this.attaches[bindingName] = null;
            }
          }
        }
        return value;
      }
      function createBindingUpdater(names, getters) {
        return function bindingUpdater(object) {
          for (var i = 0, bindingName; bindingName = names[i]; i++) this(bindingName, getters[bindingName](object));
        };
      }
      function makeHandler(events, getters) {
        for (var name in events) events[name] = createBindingUpdater(events[name], getters);
        return name ? events : null;
      }
      function createBindingFunction(keys) {
        var bindingCache = {};
        return function getBinding(bindings, obj, set, bindingInterface) {
          if (!bindings) return {};
          var cacheId = "bindingId" in bindings ? bindings.bindingId : null;
          if (!cacheId) basis.dev.warn("basis.template.Template.getBinding: bindings has no bindingId property, cache is not used");
          var result = bindingCache[cacheId];
          if (!result) {
            var names = [];
            var getters = {};
            var events = {};
            for (var i = 0, bindingName; bindingName = keys[i]; i++) {
              var binding = bindings[bindingName];
              var getter = binding && binding.getter;
              if (getter) {
                getters[bindingName] = getter;
                names.push(bindingName);
                if (binding.events) {
                  var eventList = String(binding.events).trim().split(/\s+|\s*,\s*/);
                  for (var j = 0, eventName; eventName = eventList[j]; j++) {
                    if (events[eventName]) events[eventName].push(bindingName); else events[eventName] = [ bindingName ];
                  }
                }
              }
            }
            result = {
              names: names,
              sync: createBindingUpdater(names, getters),
              handler: makeHandler(events, getters)
            };
            if (cacheId) bindingCache[cacheId] = result;
          }
          if (obj && set) result.sync.call(set, obj);
          if (!bindingInterface) return;
          if (result.handler) bindingInterface.attach(obj, result.handler, set);
          return result.handler;
        };
      }
      var tools = {
        bind_textNode: bind_textNode,
        bind_node: bind_node,
        bind_element: bind_element,
        bind_comment: bind_comment,
        bind_attr: bind_attr,
        bind_attrClass: bind_attrClass,
        bind_attrStyle: bind_attrStyle,
        resolve: resolveValue,
        l10nToken: l10nToken,
        createBindingFunction: createBindingFunction
      };
      return function(tokens) {
        var fn = getFunctions(tokens, true, this.source.url, tokens.source_, !CLONE_NORMALIZATION_TEXT_BUG);
        var createInstance;
        var instances = {};
        var l10nMap = {};
        var l10nLinks = [];
        var seed = 0;
        var proto = buildHtml(tokens);
        var build = function() {
          return proto.cloneNode(true);
        };
        var id = this.templateId;
        templates[id] = {
          template: this,
          instances: instances
        };
        if (fn.createL10nSync) {
          var l10nProtoSync = fn.createL10nSync(proto, l10nMap, bind_attr, CLONE_NORMALIZATION_TEXT_BUG);
          for (var i = 0, key; key = fn.l10nKeys[i]; i++) l10nProtoSync(key, l10nToken(key).value);
          if (fn.l10nKeys) for (var i = 0, key; key = fn.l10nKeys[i]; i++) {
            var link = {
              path: key,
              token: l10nToken(key),
              handler: function(value) {
                l10nProtoSync(this.path, value);
                for (var key in instances) instances[key].tmpl.set(this.path, value);
              }
            };
            link.token.attach(link.handler, link);
            l10nLinks.push(link);
            link = null;
          }
        }
        createInstance = fn.createInstance(id, instances, build, tools, l10nMap, CLONE_NORMALIZATION_TEXT_BUG);
        return {
          createInstance: function(obj, onAction, onRebuild, bindings, bindingInterface) {
            var instanceId = seed++;
            var instance = createInstance(instanceId, obj, onAction, onRebuild, bindings, bindingInterface);
            instances[instanceId] = instance;
            return instance.tmpl;
          },
          destroyInstance: function(tmpl) {
            var instanceId = tmpl.templateId_;
            var instance = instances[instanceId];
            if (instance) {
              if (instance.handler) instance.bindingInterface.detach(instance.context, instance.handler, instance.tmpl.set);
              for (var key in instance.attaches) resolveValue.call(instance, key, null);
              delete instances[instanceId];
            }
          },
          keys: fn.keys,
          instances_: instances,
          destroy: function(rebuild) {
            for (var i = 0, link; link = l10nLinks[i]; i++) link.token.detach(link.handler, link);
            for (var key in instances) {
              var instance = instances[key];
              if (rebuild && instance.rebuild) instance.rebuild.call(instance.context);
              if (!rebuild || key in instances) {
                if (instance.handler) instance.bindingInterface.detach(instance.context, instance.handler, instance.tmpl.set);
                for (var key in instance.attaches) resolveValue.call(key, null);
              }
            }
            if (templates[id] && templates[id].instances === instances) delete templates[id];
            fn = null;
            build = null;
            proto = null;
            l10nMap = null;
            l10nLinks = null;
            l10nProtoSync = null;
            instances = null;
          }
        };
      };
    }();
    var HtmlTemplate = Template.subclass({
      className: namespace + ".Template",
      __extend__: function(value) {
        if (value instanceof HtmlTemplate) return value;
        if (value instanceof TemplateSwitchConfig) return new HtmlTemplateSwitcher(value);
        return new HtmlTemplate(value);
      },
      builder: builder
    });
    var HtmlTemplateSwitcher = TemplateSwitcher.subclass({
      className: namespace + ".TemplateSwitcher",
      templateClass: HtmlTemplate
    });
    module.exports = {
      Template: HtmlTemplate,
      TemplateSwitcher: HtmlTemplateSwitcher
    };
    basis.template.extend({
      getDebugInfoById: getDebugInfoById,
      buildHtml: buildHtml,
      resolveTemplateById: resolveTemplateById,
      resolveObjectById: resolveObjectById,
      resolveTmplById: resolveTmplById
    });
  },
  "9.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var namespace = this.path;
    var document = global.document;
    var $null = basis.fn.$null;
    var arrayFrom = basis.array.from;
    var W3CSUPPORT = !!document.addEventListener;
    var EVENT_HOLDER = "__basisEvents";
    var KEY = {
      BACKSPACE: 8,
      TAB: 9,
      CTRL_ENTER: 10,
      ENTER: 13,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      ESC: 27,
      ESCAPE: 27,
      SPACE: 32,
      PAGEUP: 33,
      PAGEDOWN: 34,
      END: 35,
      HOME: 36,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      INSERT: 45,
      DELETE: 46,
      F1: 112,
      F2: 113,
      F3: 114,
      F4: 115,
      F5: 116,
      F6: 117,
      F7: 118,
      F8: 119,
      F9: 120,
      F10: 121,
      F11: 122,
      F12: 123
    };
    var MOUSE_LEFT = {
      VALUE: 1,
      BIT: 1
    };
    var MOUSE_MIDDLE = {
      VALUE: 2,
      BIT: 4
    };
    var MOUSE_RIGHT = {
      VALUE: 3,
      BIT: 2
    };
    var BROWSER_EVENTS = {
      mousewheel: [ "mousewheel", "DOMMouseScroll" ]
    };
    function browserEvents(eventName) {
      return BROWSER_EVENTS[eventName] || [ eventName ];
    }
    var Event = basis.Class(null, {
      className: namespace + ".Event",
      KEY: KEY,
      init: function(event) {
        event = wrap(event);
        for (var name in event) if (name != "returnValue" && name != "keyLocation" && name != "layerX" && name != "layerY") if (typeof event[name] != "function" && name in this == false) this[name] = event[name];
        basis.object.extend(this, {
          event_: event,
          sender: sender(event),
          key: key(event),
          charCode: charCode(event),
          mouseLeft: mouseButton(event, MOUSE_LEFT),
          mouseMiddle: mouseButton(event, MOUSE_MIDDLE),
          mouseRight: mouseButton(event, MOUSE_RIGHT),
          mouseX: mouseX(event),
          mouseY: mouseY(event),
          wheelDelta: wheelDelta(event)
        });
      },
      stopBubble: function() {
        cancelBubble(this.event_);
      },
      stopPropagation: function() {
        cancelBubble(this.event_);
      },
      preventDefault: function() {
        cancelDefault(this.event_);
      },
      die: function() {
        this.stopBubble();
        this.preventDefault();
      }
    });
    function wrap(event) {
      return event instanceof Event ? event.event_ : event || global.event;
    }
    function getNode(ref) {
      return typeof ref == "string" ? document.getElementById(ref) : ref;
    }
    function sender(event) {
      var target = event.target || event.srcElement || document;
      return target.nodeType == 3 ? target.parentNode : target;
    }
    function cancelBubble(event) {
      if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;
    }
    function cancelDefault(event) {
      if (event.preventDefault) event.preventDefault(); else event.returnValue = false;
    }
    function kill(event, node) {
      node = getNode(node);
      if (node) addHandler(node, event, kill); else {
        cancelDefault(event);
        cancelBubble(event);
      }
    }
    function key(event) {
      return event.keyCode || event.which || 0;
    }
    function charCode(event) {
      return event.charCode || event.keyCode || 0;
    }
    function mouseButton(event, button) {
      if (typeof event.which == "number") return event.which == button.VALUE; else return !!(event.button & button.BIT);
    }
    function mouseX(event) {
      if (event.changedTouches) return event.changedTouches[0].pageX; else if ("pageX" in event) return event.pageX; else return "clientX" in event ? event.clientX + (document.compatMode == "CSS1Compat" ? document.documentElement.scrollLeft : document.body.scrollLeft) : 0;
    }
    function mouseY(event) {
      if (event.changedTouches) return event.changedTouches[0].pageY; else if ("pageY" in event) return event.pageY; else return "clientY" in event ? event.clientY + (document.compatMode == "CSS1Compat" ? document.documentElement.scrollTop : document.body.scrollTop) : 0;
    }
    function wheelDelta(event) {
      var delta = 0;
      if ("wheelDelta" in event) delta = event.wheelDelta; else if (event.type == "DOMMouseScroll") delta = -event.detail;
      return delta && delta / Math.abs(delta);
    }
    var globalHandlers = {};
    var captureHandlers = {};
    var noCaptureScheme = !W3CSUPPORT;
    function observeGlobalEvents(event) {
      var handlers = arrayFrom(globalHandlers[event.type]);
      var captureHandler = captureHandlers[event.type];
      var wrappedEvent = new Event(event);
      if (captureHandler) {
        captureHandler.handler.call(captureHandler.thisObject, wrappedEvent);
        kill(event);
        return;
      }
      if (handlers) {
        for (var i = handlers.length; i-- > 0; ) {
          var handlerObject = handlers[i];
          handlerObject.handler.call(handlerObject.thisObject, wrappedEvent);
        }
      }
    }
    function captureEvent(eventType, handler, thisObject) {
      if (captureHandlers[eventType]) releaseEvent(eventType);
      addGlobalHandler(eventType, handler, thisObject);
      captureHandlers[eventType] = {
        handler: handler,
        thisObject: thisObject
      };
    }
    function releaseEvent(eventType) {
      var handlerObject = captureHandlers[eventType];
      if (handlerObject) {
        removeGlobalHandler(eventType, handlerObject.handler, handlerObject.thisObject);
        delete captureHandlers[eventType];
      }
    }
    function addGlobalHandler(eventType, handler, thisObject) {
      var handlers = globalHandlers[eventType];
      if (handlers) {
        for (var i = 0, item; item = handlers[i]; i++) if (item.handler === handler && item.thisObject === thisObject) return;
      } else {
        if (noCaptureScheme) addHandler(document, eventType, $null); else document.addEventListener(eventType, observeGlobalEvents, true);
        handlers = globalHandlers[eventType] = [];
      }
      handlers.push({
        handler: handler,
        thisObject: thisObject
      });
    }
    function removeGlobalHandler(eventType, handler, thisObject) {
      var handlers = globalHandlers[eventType];
      if (handlers) {
        for (var i = 0, item; item = handlers[i]; i++) {
          if (item.handler === handler && item.thisObject === thisObject) {
            handlers.splice(i, 1);
            if (!handlers.length) {
              delete globalHandlers[eventType];
              if (noCaptureScheme) removeHandler(document, eventType, $null); else document.removeEventListener(eventType, observeGlobalEvents, true);
            }
            return;
          }
        }
      }
    }
    function addHandler(node, eventType, handler, thisObject) {
      node = getNode(node);
      if (!node) throw "basis.event.addHandler: can't attach event listener to undefined";
      if (typeof handler != "function") throw "basis.event.addHandler: handler is not a function";
      if (!node[EVENT_HOLDER]) node[EVENT_HOLDER] = {};
      var handlerObject = {
        handler: handler,
        thisObject: thisObject
      };
      var handlers = node[EVENT_HOLDER];
      var eventTypeHandlers = handlers[eventType];
      if (!eventTypeHandlers) {
        eventTypeHandlers = handlers[eventType] = [ handlerObject ];
        eventTypeHandlers.fireEvent = function(event) {
          event = wrap(event);
          if (noCaptureScheme && event && globalHandlers[eventType]) {
            if (typeof event.returnValue == "undefined") {
              observeGlobalEvents(event);
              if (event.cancelBubble === true) return;
              if (typeof event.returnValue == "undefined") event.returnValue = true;
            }
          }
          for (var i = 0, wrappedEvent = new Event(event), item; item = eventTypeHandlers[i++]; ) item.handler.call(item.thisObject, wrappedEvent);
        };
        if (W3CSUPPORT) node.addEventListener(eventType, eventTypeHandlers.fireEvent, false); else node.attachEvent("on" + eventType, eventTypeHandlers.fireEvent);
      } else {
        for (var i = 0, item; item = eventTypeHandlers[i]; i++) if (item.handler === handler && item.thisObject === thisObject) return;
        eventTypeHandlers.push(handlerObject);
      }
    }
    function addHandlers(node, handlers, thisObject) {
      node = getNode(node);
      for (var eventType in handlers) addHandler(node, eventType, handlers[eventType], thisObject);
    }
    function removeHandler(node, eventType, handler, thisObject) {
      node = getNode(node);
      var handlers = node[EVENT_HOLDER];
      if (handlers) {
        var eventTypeHandlers = handlers[eventType];
        if (eventTypeHandlers) {
          for (var i = 0, item; item = eventTypeHandlers[i]; i++) {
            if (item.handler === handler && item.thisObject === thisObject) {
              eventTypeHandlers.splice(i, 1);
              if (!eventTypeHandlers.length) clearHandlers(node, eventType);
              return;
            }
          }
        }
      }
    }
    function clearHandlers(node, eventType) {
      node = getNode(node);
      var handlers = node[EVENT_HOLDER];
      if (handlers) {
        if (typeof eventType != "string") {
          for (eventType in handlers) clearHandlers(node, eventType);
        } else {
          var eventTypeHandlers = handlers[eventType];
          if (eventTypeHandlers) {
            if (node.removeEventListener) node.removeEventListener(eventType, eventTypeHandlers.fireEvent, false); else node.detachEvent("on" + eventType, eventTypeHandlers.fireEvent);
            delete handlers[eventType];
          }
        }
      }
    }
    function fireEvent(node, eventType, event) {
      node = getNode(node);
      var handlers = node[EVENT_HOLDER];
      if (handlers && handlers[eventType]) handlers[eventType].fireEvent(event);
    }
    function onUnload(handler, thisObject) {
      addHandler(global, "unload", handler, thisObject);
    }
    var tagNameEventMap = {};
    function getEventInfo(eventName, tagName) {
      if (!tagName) tagName = "div";
      var id = tagName + "-" + eventName;
      if (tagNameEventMap[id]) return tagNameEventMap[id]; else {
        var supported = false;
        var bubble = false;
        if (!W3CSUPPORT) {
          var onevent = "on" + eventName;
          var host = document.createElement("div");
          var target = host.appendChild(document.createElement(tagName));
          host[onevent] = function() {
            bubble = true;
          };
          try {
            target.fireEvent(onevent);
            supported = true;
          } catch (e) {}
        }
        return tagNameEventMap[id] = {
          supported: supported,
          bubble: bubble
        };
      }
    }
    function wrapEventFunction(fn) {
      return function(event, arg) {
        return fn(wrap(event), arg);
      };
    }
    module.exports = {
      W3CSUPPORT: W3CSUPPORT,
      browserEvents: browserEvents,
      getEventInfo: getEventInfo,
      KEY: KEY,
      MOUSE_LEFT: MOUSE_LEFT,
      MOUSE_RIGHT: MOUSE_RIGHT,
      MOUSE_MIDDLE: MOUSE_MIDDLE,
      Event: Event,
      sender: wrapEventFunction(sender),
      cancelBubble: wrapEventFunction(cancelBubble),
      cancelDefault: wrapEventFunction(cancelDefault),
      kill: wrapEventFunction(kill),
      key: wrapEventFunction(key),
      charCode: wrapEventFunction(charCode),
      mouseButton: wrapEventFunction(mouseButton),
      mouseX: wrapEventFunction(mouseX),
      mouseY: wrapEventFunction(mouseY),
      wheelDelta: wrapEventFunction(wheelDelta),
      addGlobalHandler: addGlobalHandler,
      removeGlobalHandler: removeGlobalHandler,
      captureEvent: captureEvent,
      releaseEvent: releaseEvent,
      addHandler: addHandler,
      addHandlers: addHandlers,
      removeHandler: removeHandler,
      clearHandlers: clearHandlers,
      fireEvent: fireEvent,
      onUnload: onUnload,
      wrap: wrap
    };
  },
  "a.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    basis.require("./7.js");
    var TYPE_ELEMENT = basis.template.TYPE_ELEMENT;
    var TYPE_ATTRIBUTE = basis.template.TYPE_ATTRIBUTE;
    var TYPE_TEXT = basis.template.TYPE_TEXT;
    var TYPE_COMMENT = basis.template.TYPE_COMMENT;
    var TOKEN_TYPE = basis.template.TOKEN_TYPE;
    var TOKEN_BINDINGS = basis.template.TOKEN_BINDINGS;
    var TOKEN_REFS = basis.template.TOKEN_REFS;
    var ATTR_NAME = basis.template.ATTR_NAME;
    var ATTR_NAME_BY_TYPE = basis.template.ATTR_NAME_BY_TYPE;
    var ELEMENT_NAME = basis.template.ELEMENT_NAME;
    var ELEMENT_ATTRS = basis.template.ELEMENT_ATTRS;
    var ELEMENT_CHILDS = basis.template.ELEMENT_CHILDS;
    var TEXT_VALUE = basis.template.TEXT_VALUE;
    var COMMENT_VALUE = basis.template.COMMENT_VALUE;
    var tmplFunctions = {};
    var inlineSeed = 1;
    var buildPathes = function() {
      var PATH_REF_NAME = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      var pathList;
      var refList;
      var bindingList;
      var markedElementList;
      var rootPath;
      function putRefs(refs, pathIdx) {
        for (var i = 0, refName; refName = refs[i]; i++) if (refName.indexOf(":") == -1) refList.push(refName + ":" + pathIdx);
      }
      function putPath(path) {
        var len = pathList.length;
        var pathRef = PATH_REF_NAME[len] || "r" + len;
        pathList.push(pathRef + "=" + path);
        return pathRef;
      }
      function putBinding(binding) {
        bindingList.push(binding);
      }
      function processTokens(tokens, path, noTextBug) {
        var localPath;
        var refs;
        var myRef;
        var explicitRef;
        var bindings;
        for (var i = 0, cp = 0, closeText = 0, token; token = tokens[i]; i++, cp++, explicitRef = false) {
          if (!i) localPath = path + ".firstChild"; else {
            if (!tokens[i + 1]) localPath = path + ".lastChild"; else {
              if (token[TOKEN_TYPE] == tokens[i - 1][TOKEN_TYPE] && token[TOKEN_TYPE] == TYPE_TEXT) closeText++;
              localPath = path + ".childNodes[" + (noTextBug ? cp : cp + (closeText ? " + " + closeText + " * TEXT_BUG" : "")) + "]";
            }
          }
          if (refs = token[TOKEN_REFS]) {
            explicitRef = true;
            localPath = putPath(localPath);
            putRefs(refs, localPath);
          }
          if (token[TOKEN_BINDINGS]) {
            if (token[TOKEN_BINDINGS] && typeof token[TOKEN_BINDINGS] == "number") token[TOKEN_BINDINGS] = token[TOKEN_REFS][token[TOKEN_BINDINGS] - 1];
            if (!explicitRef) {
              explicitRef = true;
              localPath = putPath(localPath);
            }
            putBinding([ token[TOKEN_TYPE], localPath, token[TOKEN_BINDINGS] ]);
          }
          if (token[TOKEN_TYPE] == TYPE_ELEMENT) {
            myRef = -1;
            if (path == rootPath) markedElementList.push(localPath + ".basisTemplateId");
            if (!explicitRef) {
              localPath = putPath(localPath);
              myRef = pathList.length;
            }
            var attrs = [];
            var children = [];
            for (var j = ELEMENT_ATTRS, t; t = token[j]; j++) if (t[TOKEN_TYPE] == TYPE_ELEMENT || t[TOKEN_TYPE] == TYPE_TEXT || t[TOKEN_TYPE] == TYPE_COMMENT) children.push(t); else attrs.push(t);
            for (var j = 0, attr; attr = attrs[j]; j++) {
              if (attr[TOKEN_TYPE] == 6) continue;
              var attrName = ATTR_NAME_BY_TYPE[attr[TOKEN_TYPE]] || attr[ATTR_NAME];
              if (refs = attr[TOKEN_REFS]) {
                explicitRef = true;
                putRefs(refs, putPath(localPath + '.getAttributeNode("' + attrName + '")'));
              }
              if (bindings = attr[TOKEN_BINDINGS]) {
                explicitRef = true;
                switch (attrName) {
                  case "class":
                    for (var k = 0, binding; binding = bindings[k]; k++) putBinding([ 2, localPath, binding[1], attrName, binding[0] ].concat(binding.slice(2)));
                    break;
                  case "style":
                    for (var k = 0, property; property = bindings[k]; k++) for (var m = 0, bindName; bindName = property[0][m]; m++) putBinding([ 2, localPath, bindName, attrName, property[0], property[1], property[2] ]);
                    break;
                  default:
                    for (var k = 0, bindName; bindName = bindings[0][k]; k++) putBinding([ 2, localPath, bindName, attrName, bindings[0], bindings[1], token[ELEMENT_NAME] ]);
                }
              }
            }
            if (children.length) processTokens(children, localPath, noTextBug);
            if (!explicitRef && myRef == pathList.length) pathList.pop();
          }
        }
      }
      return function(tokens, path, noTextBug) {
        pathList = [];
        refList = [];
        bindingList = [];
        markedElementList = [];
        rootPath = path || "_";
        processTokens(tokens, rootPath, noTextBug);
        return {
          path: pathList,
          ref: refList,
          binding: bindingList,
          markedElementList: markedElementList
        };
      };
    }();
    var buildBindings = function() {
      var L10N_BINDING = /\.\{([a-zA-Z_][a-zA-Z0-9_\-]*)\}/;
      var SPECIAL_ATTR_MAP = {
        disabled: "*",
        checked: [ "input" ],
        value: [ "input", "textarea" ],
        minlength: [ "input" ],
        maxlength: [ "input" ],
        readonly: [ "input" ],
        selected: [ "option" ],
        multiple: [ "select" ]
      };
      var SPECIAL_ATTR_SINGLE = {
        disabled: true,
        checked: true,
        selected: true,
        readonly: true,
        multiple: true
      };
      var bindFunctions = {
        1: "bind_element",
        3: "bind_textNode",
        8: "bind_comment"
      };
      function buildAttrExpression(binding, special, l10n) {
        var expression = [];
        var symbols = binding[5];
        var dictionary = binding[4];
        var exprVar;
        var colonPos;
        for (var j = 0; j < symbols.length; j++) {
          if (typeof symbols[j] == "string") expression.push('"' + symbols[j].replace(/"/g, '\\"') + '"'); else {
            exprVar = dictionary[symbols[j]];
            colonPos = exprVar.indexOf(":");
            if (colonPos == -1) {
              expression.push(special == "l10n" ? '"{' + exprVar + '}"' : special == "bool" ? "(__" + exprVar + '||"")' : "__" + exprVar);
            } else {
              var bindingName = null;
              var l10nPath = exprVar.substr(colonPos + 1).replace(L10N_BINDING, function(m, name) {
                bindingName = name;
                return "";
              });
              if (bindingName) expression.push(l10n[exprVar.substr(colonPos + 1)]); else expression.push('__l10n["' + l10nPath + '"]');
            }
          }
        }
        if (expression.length == 1) expression.push('""');
        return expression.join("+");
      }
      return function(bindings) {
        function putBindCode(type) {
          toolsUsed[type] = true;
          bindCode.push(bindVar + "=" + type + "(" + basis.array(arguments, 1) + ");");
        }
        var bindMap = {};
        var bindCode;
        var bindVar;
        var varList = [];
        var result = [];
        var varName;
        var l10nMap;
        var l10nCompute = [];
        var l10nBindings = {};
        var l10nBindSeed = 1;
        var toolsUsed = {
          resolve: true
        };
        var specialAttr;
        var debugList = [];
        for (var i = 0, binding; binding = bindings[i]; i++) {
          var bindType = binding[0];
          var domRef = binding[1];
          var bindName = binding[2];
          if ([ "set", "templateId_" ].indexOf(bindName) != -1) {
            basis.dev.warn("binding name `" + bindName + "` is prohibited, binding ignored");
            continue;
          }
          var namePart = bindName.split(":");
          var anim = namePart[0] == "anim";
          if (anim) bindName = namePart[1];
          bindCode = bindMap[bindName];
          bindVar = "_" + i;
          varName = "__" + bindName;
          if (namePart[0] == "l10n" && namePart[1]) {
            var l10nFullPath = namePart[1];
            var l10nBinding = null;
            var l10nName = l10nFullPath.replace(L10N_BINDING, function(m, name) {
              l10nBinding = name;
              return "";
            });
            if (l10nBinding) {
              if (l10nFullPath in l10nBindings == false) {
                varName = "$l10n_" + l10nBindSeed++;
                l10nBindings[l10nFullPath] = varName;
                l10nCompute.push('set("' + varName + '",' + varName + ")");
                varList.push(varName + '=tools.l10nToken("' + l10nName + '").computeToken()');
                bindCode = bindMap[l10nBinding];
                if (!bindCode) {
                  bindCode = bindMap[l10nBinding] = [];
                  varList.push("__" + l10nBinding);
                }
                bindCode.push(varName + ".set(__" + l10nBinding + ");");
              }
              bindName = l10nBindings[l10nFullPath];
              bindVar = "_" + i;
              varName = "__" + bindName;
              bindCode = bindMap[bindName];
              if (!bindCode) {
                bindCode = bindMap[bindName] = [];
                varList.push(varName);
              }
              if (bindType == TYPE_TEXT) {
                debugList.push("{" + [ 'binding:"' + bindName + '"', "dom:" + domRef, "val:" + bindVar, 'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value' ] + "}");
                varList.push(bindVar + "=" + domRef);
                putBindCode(bindFunctions[bindType], domRef, bindVar, "value");
              } else {
                attrName = '"' + binding[ATTR_NAME] + '"';
                debugList.push("{" + [ 'binding:"' + l10nFullPath + '"', "dom:" + domRef, "attr:" + attrName, "val:" + bindVar, 'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value' ] + "}");
                varList.push(bindVar);
                putBindCode("bind_attr", domRef, attrName, bindVar, buildAttrExpression(binding, false, l10nBindings));
              }
              continue;
            }
            if (!l10nMap) l10nMap = {};
            if (!bindMap[l10nName]) {
              bindMap[l10nName] = [];
              l10nMap[l10nName] = [];
            }
            bindCode = bindMap[l10nName];
            bindCode.l10n = true;
            if (bindType == TYPE_TEXT) {
              debugList.push("{" + [ 'binding:"' + l10nFullPath + '"', "dom:" + domRef, 'val:__l10n["' + l10nName + '"]', 'attachment:l10nToken("' + l10nName + '")' ] + "}");
              toolsUsed.l10nToken = true;
              l10nMap[l10nName].push(domRef + ".nodeValue=value;");
              bindCode.push(domRef + '.nodeValue=__l10n["' + l10nName + '"]' + (l10nBinding ? "[__" + l10nBinding + "]" : "") + ";");
              continue;
            } else {
              l10nMap[l10nName].push("bind_attr(" + [ domRef, '"' + binding[ATTR_NAME] + '"', "NaN", buildAttrExpression(binding, "l10n", l10nBindings) ] + ");");
            }
          }
          if (!bindCode) {
            bindCode = bindMap[bindName] = [];
            varList.push(varName);
          }
          if (bindType != TYPE_ATTRIBUTE) {
            debugList.push("{" + [ 'binding:"' + bindName + '"', "dom:" + domRef, "val:" + (bindCode.nodeBind ? varName : bindVar), "updates:$$" + bindName, 'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value' ] + "}");
            if (!bindCode.nodeBind) {
              varList.push(bindVar + "=" + domRef);
              putBindCode(bindFunctions[bindType], domRef, bindVar, "value");
              bindCode.nodeBind = bindVar;
            } else {
              switch (bindType) {
                case TYPE_ELEMENT:
                  putBindCode(bindFunctions[bindType], domRef, domRef, "value!==null?String(value):null");
                  break;
                case TYPE_TEXT:
                  bindCode.push(domRef + ".nodeValue=value;");
                  break;
              }
            }
          } else {
            var attrName = binding[ATTR_NAME];
            debugList.push("{" + [ 'binding:"' + bindName + '"', "dom:" + domRef, 'attr:"' + attrName + '"', "val:" + bindVar, 'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value' ] + "}");
            switch (attrName) {
              case "class":
                var defaultExpr = "";
                var valueExpr = "value";
                var prefix = binding[4];
                var bindingLength = binding.length;
                if (bindingLength >= 6) {
                  if (bindingLength == 6 || typeof binding[6] == "string") {
                    if (bindingLength == 6) {
                      valueExpr = 'value?"' + bindName + '":""';
                      if (binding[5]) defaultExpr = prefix + bindName;
                    } else {
                      prefix = "";
                      valueExpr = 'value?"' + binding[6] + '":""';
                      if (binding[5]) defaultExpr = binding[6];
                    }
                  } else {
                    if (!binding[6].length) continue;
                    if (bindingLength == 7) {
                      valueExpr = binding[6].map(function(val) {
                        return 'value=="' + val + '"';
                      }).join("||") + '?value:""';
                      if (binding[5]) defaultExpr = prefix + binding[6][binding[5] - 1];
                    } else {
                      prefix = "";
                      valueExpr = binding[6].map(function(val, idx) {
                        return 'value=="' + val + '"?"' + this[idx] + '"';
                      }, binding[7]).join(":") + ':""';
                      if (binding[5]) defaultExpr = binding[7][binding[5] - 1];
                    }
                  }
                } else {
                  valueExpr = 'typeof value=="string"||typeof value=="number"?value:(value?"' + bindName + '":"")';
                }
                varList.push(bindVar + '="' + defaultExpr + '"');
                putBindCode("bind_attrClass", domRef, bindVar, valueExpr, '"' + prefix + '"', anim);
                break;
              case "style":
                varList.push(bindVar + '=""');
                putBindCode("bind_attrStyle", domRef, '"' + binding[6] + '"', bindVar, buildAttrExpression(binding, false, l10nBindings));
                break;
              default:
                specialAttr = SPECIAL_ATTR_MAP[attrName];
                varList.push(bindVar + "=" + buildAttrExpression(binding, "l10n", l10nBindings));
                putBindCode("bind_attr", domRef, '"' + attrName + '"', bindVar, specialAttr && SPECIAL_ATTR_SINGLE[attrName] ? buildAttrExpression(binding, "bool", l10nBindings) + '?"' + attrName + '":""' : buildAttrExpression(binding, false, l10nBindings));
                if (specialAttr && (specialAttr == "*" || specialAttr.indexOf(binding[6].toLowerCase()) != -1)) bindCode.push("if(" + domRef + "." + attrName + "!=" + bindVar + ")" + domRef + "." + attrName + "=" + (SPECIAL_ATTR_SINGLE[attrName] ? "!!" + bindVar : bindVar) + ";");
            }
          }
        }
        result.push(";function set(bindName,value){" + 'if(typeof bindName!="string")');
        for (var bindName in bindMap) if (bindMap[bindName].nodeBind) {
          result.push("if(bindName===" + bindMap[bindName].nodeBind + ")" + 'bindName="' + bindName + '";' + "else ");
        }
        result.push("return;");
        result.push("value=resolve.call(instance,bindName,value,Attaches);" + "switch(bindName){");
        for (var bindName in bindMap) {
          if (bindName.indexOf("@") == -1) varList.push("$$" + bindName + "=0");
          result.push('case"' + bindName + '":' + (bindMap[bindName].l10n ? bindMap[bindName].join("") : "if(__" + bindName + "!==value)" + "{" + "$$" + bindName + "++;" + "__" + bindName + "=value;" + bindMap[bindName].join("") + "}") + "break;");
        }
        result.push("}}");
        var toolsVarList = [];
        for (var key in toolsUsed) toolsVarList.push(key + "=tools." + key);
        return {
          debugList: debugList,
          keys: basis.object.keys(bindMap).filter(function(key) {
            return key.indexOf("@") == -1;
          }),
          tools: toolsVarList,
          vars: varList,
          set: result.join(""),
          l10n: l10nMap,
          l10nCompute: l10nCompute
        };
      };
    }();
    function compileFunction(args, body) {
      try {
        return new Function(args, body);
      } catch (e) {
        basis.dev.error("Can't build template function: " + e + "\n", "function(" + args + "){\n" + body + "\n}");
      }
    }
    var getFunctions = function(tokens, debug, uri, source, noTextBug) {
      var fn = tmplFunctions[uri && basis.path.relative(uri)];
      if (fn) return fn;
      var paths = buildPathes(tokens, "_", noTextBug);
      var bindings = buildBindings(paths.binding);
      var objectRefs = paths.markedElementList.join("=");
      var createInstance;
      var fnBody;
      var result = {
        keys: bindings.keys,
        l10nKeys: basis.object.keys(bindings.l10n)
      };
      if (!uri) uri = basis.path.baseURI + "inline_template" + inlineSeed++ + ".tmpl";
      if (bindings.l10n) {
        var code = [];
        for (var key in bindings.l10n) code.push('case"' + key + '":' + 'if(value==null)value="{' + key + '}";' + "__l10n[token]=value;" + bindings.l10n[key].join("") + "break;");
        result.createL10nSync = compileFunction([ "_", "__l10n", "bind_attr", "TEXT_BUG" ], (source ? "\n// " + source.split(/\r\n?|\n\r?/).join("\n// ") + "\n\n" : "") + "var " + paths.path + ";" + "return function(token, value){" + "switch(token){" + code.join("") + "}" + "}" + "\n\n//# sourceURL=" + basis.path.origin + uri + "_l10n");
      }
      result.createInstance = compileFunction([ "tid", "map", "build", "tools", "__l10n", "TEXT_BUG" ], (source ? "\n// " + source.split(/\r\n?|\n\r?/).join("\n// ") + "\n\n" : "") + "var getBindings=tools.createBindingFunction([" + bindings.keys.map(function(key) {
        return '"' + key + '"';
      }) + "])," + (bindings.tools.length ? bindings.tools + "," : "") + "Attaches=function(){};" + "Attaches.prototype={" + bindings.keys.map(function(key) {
        return key + ":null";
      }) + "};" + "return function createInstance_(id,obj,onAction,onRebuild,bindings,bindingInterface){" + "var _=build()," + paths.path.concat(bindings.vars) + "," + "instance={" + "context:obj," + "action:onAction," + "rebuild:onRebuild," + (debug ? "debug:function debug(){return[" + bindings.debugList + "]}," : "") + "handler:null," + "bindings:bindings," + "bindingInterface:bindingInterface," + "attaches:null," + "tmpl:{" + [ paths.ref, "templateId_:id", "set:set" ] + "}" + "}" + (objectRefs ? ";if(obj||onAction)" + objectRefs + "=(id<<12)|tid" : "") + bindings.set + ";instance.handler=bindings?getBindings(bindings,obj,set,bindingInterface):null" + ";" + bindings.l10nCompute + ";return instance" + "}" + "\n\n//# sourceURL=" + basis.path.origin + uri);
      return result;
    };
    module.exports = {
      getFunctions: getFunctions
    };
  },
  "j.js": function(exports, module, basis, global, __filename, __dirname, require, resource) {
    var document = global.document;
    var EnvClass;
    if (document) EnvClass = basis.resource("./q.js").fetch();
    module.exports = {
      create: function(init, html) {
        return new EnvClass({
          initEnv: init,
          html: html
        });
      }
    };
  }
};

(function(global) {
  "use strict";
  var VERSION = "1.2.0-dev";
  var document = global.document;
  var Object_toString = Object.prototype.toString;
  function extend(dest, source) {
    for (var key in source) dest[key] = source[key];
    return dest;
  }
  function complete(dest, source) {
    for (var key in source) if (key in dest == false) dest[key] = source[key];
    return dest;
  }
  function keys(object) {
    var result = [];
    for (var key in object) result.push(key);
    return result;
  }
  function values(object) {
    var result = [];
    for (var key in object) result.push(object[key]);
    return result;
  }
  function slice(source, keys) {
    var result = {};
    if (!keys) return extend(result, source);
    for (var i = 0, key; key = keys[i++]; ) if (key in source) result[key] = source[key];
    return result;
  }
  function splice(source, keys) {
    var result = {};
    if (!keys) return extend(result, source);
    for (var i = 0, key; key = keys[i++]; ) if (key in source) {
      result[key] = source[key];
      delete source[key];
    }
    return result;
  }
  function merge() {
    return arrayFrom(arguments).reduce(extend, {});
  }
  function iterate(object, callback, thisObject) {
    var result = [];
    for (var key in object) result.push(callback.call(thisObject, key, object[key]));
    return result;
  }
  function $undefined(value) {
    return value == undefined;
  }
  function $defined(value) {
    return value != undefined;
  }
  function $isNull(value) {
    return value == null || value == undefined;
  }
  function $isNotNull(value) {
    return value != null && value != undefined;
  }
  function $isSame(value) {
    return value === this;
  }
  function $isNotSame(value) {
    return value !== this;
  }
  function $self(value) {
    return value;
  }
  function $const(value) {
    return function() {
      return value;
    };
  }
  function $false() {
    return false;
  }
  function $true() {
    return true;
  }
  function $null() {
    return null;
  }
  function $undef() {}
  var getter = function() {
    var modificatorSeed = 1;
    var simplePath = /^[a-z$_][a-z$_0-9]*(\.[a-z$_][a-z$_0-9]*)*$/i;
    var getterMap = [];
    var pathCache = {};
    var modCache = {};
    function buildFunction(path) {
      if (simplePath.test(path)) {
        var parts = path.split(".");
        var foo = parts[0];
        var bar = parts[1];
        var baz = parts[2];
        var fn;
        switch (parts.length) {
          case 1:
            fn = function(object) {
              return object != null ? object[foo] : object;
            };
            break;
          case 2:
            fn = function(object) {
              return object != null ? object[foo][bar] : object;
            };
            break;
          case 3:
            fn = function(object) {
              return object != null ? object[foo][bar][baz] : object;
            };
            break;
          default:
            fn = function(object) {
              if (object != null) {
                object = object[foo][bar][baz];
                for (var i = 3, key; key = parts[i]; i++) object = object[key];
              }
              return object;
            };
        }
        fn = Function("parts", "return " + fn.toString().replace(/(foo|bar|baz)/g, function(m, w) {
          return '"' + parts[w == "foo" ? 0 : w == "bar" ? 1 : 2] + '"';
        }).replace(/\[\"([^"]+)\"\]/g, ".$1"))(parts);
        return fn;
      }
      return new Function("object", "return object != null ? object." + path + " : object");
    }
    return function(path, modificator) {
      var func;
      var result;
      var getterId;
      if (!path || path === nullGetter) return nullGetter;
      if (typeof path == "function") {
        getterId = path.basisGetterId_;
        if (getterId) {
          func = getterMap[Math.abs(getterId) - 1];
        } else {
          func = function(object) {
            return path(object);
          };
          func.base = path;
          func.__extend__ = getter;
          getterId = getterMap.push(func);
          path.basisGetterId_ = -getterId;
          func.basisGetterId_ = getterId;
        }
      } else {
        func = pathCache[path];
        if (func) {
          getterId = func.basisGetterId_;
        } else {
          func = buildFunction(path);
          func.base = path;
          func.__extend__ = getter;
          getterId = getterMap.push(func);
          func.basisGetterId_ = getterId;
          pathCache[path] = func;
        }
      }
      var modType = modificator != null && typeof modificator;
      if (!modType) return func;
      var modList = modCache[getterId];
      var modId;
      if (modType == "string") modId = modType + modificator; else if (modType == "function") modId = modificator.basisModId_; else if (modType != "object") {
        consoleMethods.warn("basis.getter: wrong modificator type, modificator not used, path: ", path, ", modificator:", modificator);
        return func;
      }
      if (modId && modList && modList[modId]) return modList[modId];
      if (typeof func.base == "function") func = func.base;
      switch (modType) {
        case "string":
          result = function(object) {
            return String_extensions.format(modificator, func(object));
          };
          break;
        case "function":
          if (!modId) {
            modId = modType + modificatorSeed++;
            modificator.basisModId_ = modId;
          }
          result = function(object) {
            return modificator(func(object));
          };
          break;
        default:
          result = function(object) {
            return modificator[func(object)];
          };
      }
      result.base = func.base || func;
      result.__extend__ = getter;
      if (modId) {
        if (!modList) {
          modList = {};
          modCache[getterId] = modList;
        }
        modList[modId] = result;
        result.mod = modificator;
        result.basisGetterId_ = getterMap.push(result);
      } else {}
      return result;
    };
  }();
  var nullGetter = extend(function() {}, {
    __extend__: getter
  });
  function wrapper(key) {
    return function(value) {
      var result = {};
      result[key] = value;
      return result;
    };
  }
  function lazyInit(init, thisObject) {
    var inited = 0;
    var self;
    var data;
    return self = function() {
      if (!(inited++)) {
        self.inited = true;
        self.data = data = init.apply(thisObject || this, arguments);
        if (typeof data == "undefined") consoleMethods.warn("lazyInit function returns nothing:\n" + init);
      }
      return data;
    };
  }
  function lazyInitAndRun(init, run, thisObject) {
    var inited = 0;
    var self;
    var data;
    return self = function() {
      if (!(inited++)) {
        self.inited = true;
        self.data = data = init.call(thisObject || this);
        if (typeof data == "undefined") consoleMethods.warn("lazyInitAndRun function returns nothing:\n" + init);
      }
      run.apply(data, arguments);
      return data;
    };
  }
  function runOnce(run, thisObject) {
    var fired = 0;
    return function() {
      if (!(fired++)) return run.apply(thisObject || this, arguments);
    };
  }
  var consoleMethods = function() {
    var methods = {
      log: $undef,
      info: $undef,
      warn: $undef,
      error: $undef
    };
    if (typeof console != "undefined") iterate(methods, function(methodName) {
      methods[methodName] = "bind" in Function.prototype && typeof console[methodName] == "function" ? Function.prototype.bind.call(console[methodName], console) : function() {
        Function.prototype.apply.call(console[methodName], console, arguments);
      };
    });
    return methods;
  }();
  var setImmediate = global.setImmediate || global.msSetImmediate;
  var clearImmediate = global.clearImmediate || global.msSetImmediate;
  if (setImmediate) setImmediate = setImmediate.bind(global);
  if (clearImmediate) clearImmediate = clearImmediate.bind(global);
  if (!setImmediate) (function() {
    var MESSAGE_NAME = "basisjs.setImmediate";
    var runTask = function() {
      var taskById = {};
      var taskId = 1;
      setImmediate = function() {
        taskById[++taskId] = {
          fn: arguments[0],
          args: arrayFrom(arguments, 1)
        };
        addToQueue(taskId);
        return taskId;
      };
      clearImmediate = function(id) {
        delete taskById[id];
      };
      return function(id) {
        var task = taskById[id];
        if (task) {
          try {
            if (typeof task.fn == "function") task.fn.apply(undefined, task.args); else {
              (global.execScript || function(fn) {
                global["eval"].call(global, fn);
              })(String(task.fn));
            }
          } finally {
            delete taskById[id];
          }
        }
      };
    }();
    var addToQueue = function(taskId) {
      setTimeout(function() {
        runTask(taskId);
      }, 0);
    };
    if (global.process && typeof process.nextTick == "function") {
      addToQueue = function(taskId) {
        process.nextTick(function() {
          runTask(taskId);
        });
      };
    } else {
      if (global.MessageChannel) {
        addToQueue = function(taskId) {
          var channel = new global.MessageChannel;
          var setImmediateHandler = function() {
            runTask(taskId);
          };
          channel.port1.onmessage = setImmediateHandler;
          channel.port2.postMessage("");
        };
      } else {
        var postMessageSupported = global.postMessage && !global.importScripts;
        if (postMessageSupported) {
          var oldOnMessage = global.onmessage;
          global.onmessage = function() {
            postMessageSupported = false;
          };
          global.postMessage("", "*");
          global.onmessage = oldOnMessage;
        }
        if (postMessageSupported) {
          var setImmediateHandler = function(event) {
            if (event && event.source == global) {
              var taskId = String(event.data).split(MESSAGE_NAME)[1];
              if (taskId) runTask(taskId);
            }
          };
          if (global.addEventListener) global.addEventListener("message", setImmediateHandler, true); else global.attachEvent("onmessage", setImmediateHandler);
          addToQueue = function(taskId) {
            global.postMessage(MESSAGE_NAME + taskId, "*");
          };
        } else {
          var createScript = function() {
            return document.createElement("script");
          };
          if (document && "onreadystatechange" in createScript()) {
            var defaultAddToQueue = addToQueue;
            addToQueue = function beforeHeadReady(taskId) {
              if (typeof documentInterface != "undefined") {
                addToQueue = defaultAddToQueue;
                documentInterface.head.ready(function() {
                  addToQueue = function(taskId) {
                    var scriptEl = createScript();
                    scriptEl.onreadystatechange = function() {
                      runTask(taskId);
                      scriptEl.onreadystatechange = null;
                      documentInterface.remove(scriptEl);
                      scriptEl = null;
                    };
                    documentInterface.head.add(scriptEl);
                  };
                });
              }
              if (addToQueue === beforeHeadReady) defaultAddToQueue(taskId); else addToQueue(taskId);
            };
          }
        }
      }
    }
  })();
  var NODE_ENV = typeof process == "object" && Object_toString.call(process) == "[object process]";
  var pathUtils = function() {
    var ABSOLUTE_RX = /^([^\/]+:|\/)/;
    var PROTOCOL_RX = /^[a-zA-Z0-9\-]+:\/?/;
    var ORIGIN_RX = /^(?:[a-zA-Z0-9\-]+:)?\/\/[^\/]+\/?/;
    var SEARCH_HASH_RX = /[\?#].*$/;
    var utils = {};
    var origin = "";
    var baseURI;
    if (NODE_ENV) {
      var path = require("path").resolve(".").replace(/\\/g, "/");
      baseURI = path.replace(/^[^\/]*/, "");
      origin = path.replace(/\/.*/, "");
    } else {
      baseURI = location.pathname.replace(/[^\/]+$/, "");
      origin = location.protocol + "//" + location.host;
    }
    utils = {
      baseURI: baseURI,
      origin: origin,
      normalize: function(path) {
        path = (path || "").replace(PROTOCOL_RX, "/").replace(ORIGIN_RX, "/").replace(SEARCH_HASH_RX, "");
        var result = [];
        var parts = path.split("/");
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] == "..") {
            if (result.length > 1 || result[0]) result.pop();
          } else {
            if ((parts[i] || !i) && parts[i] != ".") result.push(parts[i]);
          }
        }
        return result.join("/") || (path[0] === "/" ? "/" : "");
      },
      dirname: function(path) {
        var result = utils.normalize(path);
        return result.replace(/\/([^\/]*)$|^[^\/]+$/, "") || (result[0] == "/" ? "/" : ".");
      },
      extname: function(path) {
        var ext = utils.normalize(path).match(/[^\/](\.[^\/\.]*)$/);
        return ext ? ext[1] : "";
      },
      basename: function(path, ext) {
        var filename = utils.normalize(path).match(/[^\\\/]*$/);
        filename = filename ? filename[0] : "";
        if (ext == utils.extname(filename)) filename = filename.substring(0, filename.length - ext.length);
        return filename;
      },
      resolve: function(from, to) {
        var args = arrayFrom(arguments).reverse();
        var path = [];
        var absoluteFound = false;
        for (var i = 0; !absoluteFound && i < args.length; i++) if (typeof args[i] == "string") {
          path.unshift(args[i]);
          absoluteFound = ABSOLUTE_RX.test(args[i]);
        }
        if (!absoluteFound) path.unshift(baseURI == "/" ? "" : baseURI);
        return utils.normalize(path.join("/"));
      },
      relative: function(from, to) {
        if (typeof to != "string") {
          to = from;
          from = baseURI;
        }
        from = utils.normalize(from);
        to = utils.normalize(to);
        if (from[0] == "/" && to[0] != "/") return from;
        if (to[0] == "/" && from[0] != "/") return to;
        var base = from.replace(/^\/$/, "").split(/\//);
        var path = to.replace(/^\/$/, "").split(/\//);
        var result = [];
        var i = 0;
        while (path[i] == base[i] && typeof base[i] == "string") i++;
        for (var j = base.length - i; j > 0; j--) result.push("..");
        return result.concat(path.slice(i).filter(Boolean)).join("/");
      }
    };
    return utils;
  }();
  var basisFilename = "";
  var config = {
    path: {
      basis: "",
      app: "",
      core: "",
      esprima: "",
      diff: ""
    },
    extProto: false,
    exports: true,
    autoload: "./0.js"
  };
  var Class = function() {
    var instanceSeed = {
      id: 1
    };
    var classSeed = 1;
    var classes = [];
    var SELF = {};
    function isClass(object) {
      return typeof object == "function" && !!object.basisClassId_;
    }
    function isSubclassOf(superClass) {
      var cursor = this;
      while (cursor && cursor !== superClass) cursor = cursor.superClass_;
      return cursor === superClass;
    }
    function dev_verboseNameWrap(name, args, fn) {
      return (new Function(keys(args), 'return {"' + name + '": ' + fn + '\n}["' + name + '"]')).apply(null, values(args));
    }
    var TOSTRING_BUG = function() {
      for (var key in {
        toString: 1
      }) return false;
      return true;
    }();
    function createClass(SuperClass, extensions) {
      var classId = classSeed++;
      if (typeof SuperClass != "function") SuperClass = BaseClass;
      var className = "";
      for (var i = 1, extension; extension = arguments[i]; i++) if (typeof extension != "function" && extension.className) className = extension.className;
      if (!className) className = SuperClass.className + "._Class" + classId;
      var NewClassProto = function() {};
      NewClassProto = dev_verboseNameWrap(className, {}, NewClassProto);
      NewClassProto.prototype = SuperClass.prototype;
      var newProto = new NewClassProto;
      var newClassProps = {
        className: className,
        basisClassId_: classId,
        superClass_: SuperClass,
        extendConstructor_: !!SuperClass.extendConstructor_,
        isSubclassOf: isSubclassOf,
        subclass: function() {
          return createClass.apply(null, [ newClass ].concat(arrayFrom(arguments)));
        },
        extend: extendClass,
        __extend__: function(value) {
          if (value && value !== SELF && (typeof value == "object" || typeof value == "function" && !isClass(value))) return BaseClass.create.call(null, newClass, value); else return value;
        },
        prototype: newProto
      };
      for (var i = 1, extension; extension = arguments[i]; i++) newClassProps.extend(extension);
      if (newProto.init !== BaseClass.prototype.init && !/^function[^(]*\(\)/.test(newProto.init) && newClassProps.extendConstructor_) consoleMethods.warn("probably wrong extendConstructor_ value for " + newClassProps.className);
      var newClass = newClassProps.extendConstructor_ ? function(extend) {
        this.basisObjectId = instanceSeed.id++;
        var prop;
        for (var key in extend) {
          prop = this[key];
          this[key] = prop && prop.__extend__ ? prop.__extend__(extend[key]) : extend[key];
        }
        this.init();
        this.postInit();
      } : function() {
        this.basisObjectId = instanceSeed.id++;
        this.init.apply(this, arguments);
        this.postInit();
      };
      newClass = dev_verboseNameWrap(className, {
        instanceSeed: instanceSeed
      }, newClass);
      newProto.constructor = newClass;
      for (var key in newProto) if (newProto[key] === SELF) newProto[key] = newClass;
      extend(newClass, newClassProps);
      classes.push(newClass);
      return newClass;
    }
    function extendClass(source) {
      var proto = this.prototype;
      if (typeof source == "function" && !isClass(source)) source = source(this.superClass_.prototype);
      if (source.prototype) source = source.prototype;
      for (var key in source) {
        var value = source[key];
        var protoValue = proto[key];
        if (key == "className" || key == "extendConstructor_") this[key] = value; else {
          if (protoValue && protoValue.__extend__) proto[key] = protoValue.__extend__(value); else {
            proto[key] = value;
          }
        }
      }
      if (TOSTRING_BUG && source[key = "toString"] !== Object_toString) proto[key] = source[key];
      return this;
    }
    var BaseClass = extend(createClass, {
      className: "basis.Class",
      extendConstructor_: false,
      prototype: {
        basisObjectId: 0,
        constructor: null,
        init: function() {},
        postInit: function() {},
        toString: function() {
          return "[object " + (this.constructor || this).className + "]";
        },
        destroy: function() {
          for (var prop in this) if (hasOwnProperty.call(this, prop)) this[prop] = null;
          this.destroy = $undef;
        }
      }
    });
    var customExtendProperty = function(extension, fn, devName) {
      return {
        __extend__: function(extension) {
          if (!extension) return extension;
          if (extension && extension.__extend__) return extension;
          var Base = function() {};
          Base = dev_verboseNameWrap(devName || "customExtendProperty", {}, Base);
          Base.prototype = this;
          var result = new Base;
          fn(result, extension);
          return result;
        }
      }.__extend__(extension || {});
    };
    var extensibleProperty = function(extension) {
      return customExtendProperty(extension, extend, "extensibleProperty");
    };
    var nestedExtendProperty = function(extension) {
      return customExtendProperty(extension, function(result, extension) {
        for (var key in extension) {
          var value = result[key];
          result[key] = value && value.__extend__ ? value.__extend__(extension[key]) : extensibleProperty(extension[key]);
        }
      }, "nestedExtendProperty");
    };
    var oneFunctionProperty = function(fn, keys) {
      var create = function(keys) {
        var result = {
          __extend__: create
        };
        if (keys) {
          if (keys.__extend__) return keys;
          var Cls = dev_verboseNameWrap("oneFunctionProperty", {}, function() {});
          result = new Cls;
          result.__extend__ = create;
          for (var key in keys) if (keys[key]) result[key] = fn;
        }
        return result;
      };
      return create(keys || {});
    };
    return extend(BaseClass, {
      all_: classes,
      SELF: SELF,
      create: createClass,
      isClass: isClass,
      customExtendProperty: customExtendProperty,
      extensibleProperty: extensibleProperty,
      nestedExtendProperty: nestedExtendProperty,
      oneFunctionProperty: oneFunctionProperty
    });
  }();
  var Token = Class(null, {
    className: "basis.Token",
    value: null,
    handler: null,
    deferredToken: null,
    bindingBridge: {
      attach: function(host, fn, context) {
        host.attach(fn, context);
      },
      detach: function(host, fn, context) {
        host.detach(fn, context);
      },
      get: function(host) {
        return host.get();
      }
    },
    init: function(value) {
      this.value = value;
    },
    get: function() {
      return this.value;
    },
    set: function(value) {
      if (this.value !== value) {
        this.value = value;
        this.apply();
      }
    },
    attach: function(fn, context) {
      var cursor = this;
      while (cursor = cursor.handler) if (cursor.fn === fn && cursor.context === context) consoleMethods.warn("basis.Token#attach: duplicate fn & context pair");
      this.handler = {
        fn: fn,
        context: context,
        handler: this.handler
      };
    },
    detach: function(fn, context) {
      var cursor = this;
      var prev;
      while (prev = cursor, cursor = cursor.handler) if (cursor.fn === fn && cursor.context === context) {
        cursor.fn = $undef;
        prev.handler = cursor.handler;
        return;
      }
      consoleMethods.warn("basis.Token#detach: fn & context pair not found, nothing was removed");
    },
    apply: function() {
      var value = this.get();
      var cursor = this;
      while (cursor = cursor.handler) cursor.fn.call(cursor.context, value);
    },
    deferred: function() {
      var token = this.deferredToken;
      if (!token) {
        token = this.deferredToken = new DeferredToken(this.value);
        this.attach(token.set, token);
      }
      return token;
    },
    destroy: function() {
      if (this.deferredToken) {
        this.deferredToken.destroy();
        this.deferredToken = null;
      }
      this.handler = null;
      this.value = null;
      this.attach = $undef;
      this.detach = $undef;
    }
  });
  var awaitToApply = function() {
    var tokens = {};
    var timer;
    function applyTokens() {
      var list = tokens;
      tokens = {};
      timer = null;
      for (var key in list) list[key].apply();
    }
    return function(token) {
      if (token.basisObjectId in tokens) return;
      tokens[token.basisObjectId] = token;
      if (!timer) setImmediate(applyTokens);
    };
  }();
  var DeferredToken = Token.subclass({
    className: "basis.DeferredToken",
    set: function(value) {
      if (this.value !== value) {
        this.value = value;
        awaitToApply(this);
      }
    },
    deferred: function() {
      return this;
    }
  });
  var resources = {};
  var resourceContentCache = {};
  var resourcePatch = {};
  var resourceResolvingStack = [];
  var requires;
  (function() {
    var map = typeof __resources__ != "undefined" ? __resources__ : null;
    if (map) {
      for (var key in map) resourceContentCache[pathUtils.resolve(key)] = map[key];
      __resources__ = null;
    }
  })();
  function applyResourcePatches(resource) {
    var patches = resourcePatch[resource.url];
    if (patches) for (var i = 0; i < patches.length; i++) {
      consoleMethods.info("Apply patch for " + resource.url);
      patches[i](resource.get(), resource.url);
    }
  }
  var getResourceContent = function(url, ignoreCache) {
    if (ignoreCache || !resourceContentCache.hasOwnProperty(url)) {
      var resourceContent = "";
      if (!NODE_ENV) {
        var req = new XMLHttpRequest;
        req.open("GET", url, false);
        req.setRequestHeader("If-Modified-Since", (new Date(0)).toGMTString());
        req.setRequestHeader("X-Basis-Resource", 1);
        req.send("");
        if (req.status >= 200 && req.status < 400) resourceContent = req.responseText; else {
          consoleMethods.error("basis.resource: Unable to load " + url + " (status code " + req.status + ")");
        }
      } else {
        try {
          resourceContent = require("fs").readFileSync(url, "utf-8");
        } catch (e) {
          consoleMethods.error("basis.resource: Unable to load " + url, e);
        }
      }
      resourceContentCache[url] = resourceContent;
    }
    return resourceContentCache[url];
  };
  var getResource = function(resourceUrl) {
    if (!/^(\.\/|\.\.|\/)/.test(resourceUrl)) consoleMethods.warn("Bad usage: basis.resource('" + resourceUrl + "').\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.");
    resourceUrl = pathUtils.resolve(resourceUrl);
    if (!resources[resourceUrl]) {
      var contentWrapper = getResource.extensions[pathUtils.extname(resourceUrl)];
      var resolved = false;
      var wrapped = false;
      var content;
      var wrappedContent;
      var resource = function() {
        if (resolved) return content;
        var urlContent = getResourceContent(resourceUrl);
        var idx = resourceResolvingStack.indexOf(resourceUrl);
        if (idx != -1) consoleMethods.warn("basis.resource recursion:", resourceResolvingStack.slice(idx).concat(resourceUrl).map(pathUtils.relative, pathUtils).join(" -> "));
        resourceResolvingStack.push(resourceUrl);
        if (contentWrapper) {
          if (!wrapped) {
            wrapped = true;
            content = contentWrapper(urlContent, resourceUrl);
            wrappedContent = urlContent;
          }
        } else {
          content = urlContent;
        }
        resolved = true;
        applyResourcePatches(resource);
        resource.apply();
        resourceResolvingStack.pop();
        return content;
      };
      extend(resource, extend(new Token, {
        url: resourceUrl,
        fetch: function() {
          return resource();
        },
        toString: function() {
          return "[basis.resource " + resourceUrl + "]";
        },
        isResolved: function() {
          return resolved;
        },
        hasChanges: function() {
          return contentWrapper ? resourceContentCache[resourceUrl] !== wrappedContent : false;
        },
        update: function(newContent) {
          newContent = String(newContent);
          if (!resolved || newContent != resourceContentCache[resourceUrl]) {
            resourceContentCache[resourceUrl] = newContent;
            if (contentWrapper) {
              if (wrapped && !contentWrapper.permanent) {
                content = contentWrapper(newContent, resourceUrl);
                applyResourcePatches(resource);
                resource.apply();
              }
            } else {
              content = newContent;
              resolved = true;
              applyResourcePatches(resource);
              resource.apply();
            }
          }
        },
        reload: function() {
          var oldContent = resourceContentCache[resourceUrl];
          var newContent = getResourceContent(resourceUrl, true);
          if (newContent != oldContent) {
            resolved = false;
            resource.update(newContent);
          }
        },
        get: function(source) {
          return source ? getResourceContent(resourceUrl) : resource();
        },
        ready: function(fn, context) {
          if (resolved) {
            fn.call(context, resource());
            if (contentWrapper && contentWrapper.permanent) return;
          }
          resource.attach(fn, context);
          return resource;
        }
      }));
      resources[resourceUrl] = resource;
    }
    return resources[resourceUrl];
  };
  extend(getResource, {
    isResource: function(value) {
      return value ? resources[value.url] === value : false;
    },
    isResolved: function(resourceUrl) {
      var resource = getResource.get(resourceUrl);
      return resource ? resource.isResolved() : false;
    },
    exists: function(resourceUrl) {
      if (!/^(\.\/|\.\.|\/)/.test(resourceUrl)) consoleMethods.warn("Bad usage: basis.resource.exists('" + resourceUrl + "').\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.");
      return resources.hasOwnProperty(pathUtils.resolve(resourceUrl));
    },
    get: function(resourceUrl) {
      if (!/^(\.\/|\.\.|\/)/.test(resourceUrl)) consoleMethods.warn("Bad usage: basis.resource.get('" + resourceUrl + "').\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.");
      resourceUrl = pathUtils.resolve(resourceUrl);
      if (!getResource.exists(resourceUrl)) return null;
      return getResource(resourceUrl);
    },
    getFiles: function(cache) {
      return keys(cache ? resourceContentCache : resources).map(pathUtils.relative);
    },
    extensions: {
      ".js": extend(function(content, filename) {
        var namespace = filename2namespace[filename];
        if (!namespace) {
          var implicitNamespace = true;
          namespace = pathUtils.dirname(filename) + "/" + pathUtils.basename(filename, pathUtils.extname(filename));
          for (var ns in config.path) {
            var path = config.path[ns] + ns + "/";
            if (filename.substr(0, path.length) == path) {
              implicitNamespace = false;
              namespace = namespace.substr(config.path[ns].length);
              break;
            }
          }
          namespace = namespace.replace(/\./g, "_").replace(/^\//g, "").replace(/\//g, ".");
          if (implicitNamespace) namespace = "implicit." + namespace;
        }
        if (requires) Array_extensions.add(requires, namespace);
        if (!namespaces[namespace]) {
          var ns = getNamespace(namespace);
          var savedRequires = requires;
          requires = [];
          ns.exports = runScriptInContext({
            path: ns.path,
            exports: ns.exports
          }, filename, content).exports;
          if (ns.exports && ns.exports.constructor === Object) complete(ns, ns.exports);
          ns.filename_ = filename;
          ns.source_ = content;
          ns.requires_ = requires;
          requires = savedRequires;
        }
        return namespaces[namespace].exports;
      }, {
        permanent: true
      }),
      ".css": function(content, url) {
        var resource = CssResource.resources[url];
        if (!resource) resource = new CssResource(url); else resource.updateCssText(content);
        return resource;
      },
      ".json": function(content, url) {
        if (typeof content == "object") return content;
        var result;
        try {
          content = String(content);
          result = basis.json.parse(content);
        } catch (e) {
          consoleMethods.warn("basis.resource: Can't parse JSON from " + url, {
            url: url,
            content: content
          });
        }
        return result || null;
      }
    }
  });
  function compileFunction(sourceURL, args, body) {
    try {
      return new Function(args, body + "\n\n//# sourceURL=" + pathUtils.origin + sourceURL);
    } catch (e) {
      if (document && "line" in e == false && "addEventListener" in global) {
        global.addEventListener("error", function onerror(event) {
          if (event.filename == pathUtils.origin + sourceURL) {
            global.removeEventListener("error", onerror);
            consoleMethods.error("Compilation error at " + event.filename + ":" + event.lineno + ": " + e);
            event.preventDefault();
          }
        });
        var script = document.createElement("script");
        script.src = sourceURL;
        script.async = false;
        document.head.appendChild(script);
        document.head.removeChild(script);
      }
      consoleMethods.error("Compilation error at " + sourceURL + ("line" in e ? ":" + (e.line - 1) : "") + ": " + e);
    }
  }
  var runScriptInContext = function(context, sourceURL, sourceCode) {
    var baseURL = pathUtils.dirname(sourceURL) + "/";
    var compiledSourceCode = sourceCode;
    if (!context.exports) context.exports = {};
    if (typeof compiledSourceCode != "function") compiledSourceCode = compileFunction(sourceURL, [ "exports", "module", "basis", "global", "__filename", "__dirname", "resource", "require" ], '"use strict";\n' + sourceCode);
    if (typeof compiledSourceCode == "function") compiledSourceCode.call(context.exports, context.exports, context, basis, global, sourceURL, baseURL, function(relativePath) {
      if (!/^(\.\/|\.\.|\/)/.test(relativePath)) consoleMethods.warn("Bad usage: resource('" + relativePath + "').\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.");
      return getResource(pathUtils.resolve(baseURL, relativePath));
    }, function(relativePath, base) {
      return requireNamespace(relativePath, base || baseURL);
    });
    return context;
  };
  var namespaces = {};
  var namespace2filename = {};
  var filename2namespace = {};
  var nsRootPath = slice(config.path);
  (function(map) {
    var map = typeof __namespace_map__ != "undefined" ? __namespace_map__ : null;
    if (map) {
      for (var key in map) {
        var filename = pathUtils.resolve(key);
        var namespace = map[key];
        filename2namespace[filename] = namespace;
        namespace2filename[namespace] = filename;
      }
    }
  })();
  var Namespace = Class(null, {
    className: "basis.Namespace",
    init: function(name) {
      this.name = name;
      this.exports = {
        path: this.name
      };
    },
    toString: function() {
      return "[basis.namespace " + this.path + "]";
    },
    extend: function(names) {
      extend(this.exports, names);
      return complete(this, names);
    }
  });
  function resolveNSFilename(namespace) {
    var namespaceRoot = namespace.split(".")[0];
    var filename = namespace.replace(/\./g, "/") + ".js";
    if (namespace in namespace2filename == false) {
      if (namespaceRoot in nsRootPath == false) nsRootPath[namespaceRoot] = pathUtils.baseURI;
      if (namespaceRoot == namespace) filename2namespace[nsRootPath[namespaceRoot] + filename] = namespaceRoot;
      namespace2filename[namespace] = nsRootPath[namespaceRoot] + filename;
    }
    return namespace2filename[namespace];
  }
  function getRootNamespace(name) {
    var namespace = namespaces[name];
    if (!namespace) {
      namespace = namespaces[name] = new Namespace(name);
      namespace.namespaces_ = {};
      namespace.namespaces_[name] = namespace;
      if (!config.noConflict) global[name] = namespace;
    }
    return namespace;
  }
  function getNamespace(path) {
    path = path.split(".");
    var rootNs = getRootNamespace(path[0]);
    var cursor = rootNs;
    for (var i = 1, name; name = path[i]; i++) {
      if (!cursor[name]) {
        var nspath = path.slice(0, i + 1).join(".");
        cursor[name] = new Namespace(nspath);
        rootNs.namespaces_[nspath] = cursor[name];
      }
      cursor = cursor[name];
    }
    namespaces[path.join(".")] = cursor;
    return cursor;
  }
  var requireNamespace = function() {
    if (NODE_ENV) {
      var moduleProto = module.constructor.prototype;
      return function(filename, dirname) {
        if (!/[^a-z0-9_\.]/i.test(filename) || pathUtils.extname(filename) == ".js") {
          var _compile = moduleProto._compile;
          var namespace = getNamespace(filename);
          moduleProto._compile = function(content, filename) {
            this.basis = basis;
            content = "var node_require = require;\n" + "var basis = module.basis;\n" + 'var resource = function(filename){ return basis.resource(__dirname + "/" + filename) };\n' + "var require = function(filename, baseURI){ return basis.require(filename, baseURI || __dirname) };\n" + content;
            _compile.call(extend(this, namespace), content, filename);
          };
          var exports = require(__dirname + "/" + filename.replace(/\./g, "/"));
          namespace.exports = exports;
          if (exports && exports.constructor === Object) complete(namespace, exports);
          moduleProto._compile = _compile;
          return exports;
        } else {
          filename = pathUtils.resolve(dirname, filename);
          return require(filename);
        }
      };
    } else {
      return function(filename, dirname) {
        if (!/[^a-z0-9_\.]/i.test(filename) && pathUtils.extname(filename) != ".js") {
          filename = resolveNSFilename(filename);
        } else {
          if (!/^(\.\/|\.\.|\/)/.test(filename)) consoleMethods.warn("Bad usage: require('" + filename + "').\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.");
          filename = pathUtils.resolve(dirname, filename);
        }
        return getResource(filename).fetch();
      };
    }
  }();
  function patch(filename, patchFn) {
    if (!/[^a-z0-9_\.]/i.test(filename) && pathUtils.extname(filename) != ".js") {
      filename = resolveNSFilename(filename);
    } else {
      if (!/^(\.\/|\.\.|\/)/.test(filename)) consoleMethods.warn("Bad usage: basis.patch('" + filename + "').\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.");
      filename = pathUtils.resolve(filename);
    }
    if (!resourcePatch[filename]) resourcePatch[filename] = [ patchFn ]; else resourcePatch[filename].push(patchFn);
    var resource = getResource.get(filename);
    if (resource && resource.isResolved()) patchFn(resource.get(), resource.url);
  }
  function extendProto(cls, extensions) {
    if (config.extProto) for (var key in extensions) cls.prototype[key] = function(method, clsName) {
      return function() {
        if (config.extProto == "warn") consoleMethods.warn(clsName + "#" + method + " is not a standard method and will be removed soon; use basis." + clsName.toLowerCase() + "." + method + " instead");
        var args = [ this ];
        Array.prototype.push.apply(args, arguments);
        return extensions[method].apply(extensions, args);
      };
    }(key, cls.name || cls.toString().match(/^\s*function\s*(\w*)\s*\(/)[1]);
  }
  complete(Function.prototype, {
    bind: function(thisObject) {
      var fn = this;
      var params = arrayFrom(arguments, 1);
      return params.length ? function() {
        return fn.apply(thisObject, params.concat.apply(params, arguments));
      } : function() {
        return fn.apply(thisObject, arguments);
      };
    }
  });
  complete(Array, {
    isArray: function(value) {
      return Object_toString.call(value) === "[object Array]";
    }
  });
  function arrayFrom(object, offset) {
    if (object != null) {
      var len = object.length;
      if (typeof len == "undefined" || Object_toString.call(object) == "[object Function]") return [ object ];
      if (!offset) offset = 0;
      if (len - offset > 0) {
        for (var result = [], k = 0, i = offset; i < len; ) result[k++] = object[i++];
        return result;
      }
    }
    return [];
  }
  function createArray(length, fillValue, thisObject) {
    var result = [];
    var isFunc = typeof fillValue == "function";
    for (var i = 0; i < length; i++) result[i] = isFunc ? fillValue.call(thisObject, i, result) : fillValue;
    return result;
  }
  complete(Array.prototype, {
    indexOf: function(searchElement, offset) {
      offset = parseInt(offset, 10) || 0;
      if (offset < 0) return -1;
      for (; offset < this.length; offset++) if (this[offset] === searchElement) return offset;
      return -1;
    },
    lastIndexOf: function(searchElement, offset) {
      var len = this.length;
      offset = parseInt(offset, 10);
      if (isNaN(offset) || offset >= len) offset = len - 1; else offset = (offset + len) % len;
      for (; offset >= 0; offset--) if (this[offset] === searchElement) return offset;
      return -1;
    },
    forEach: function(callback, thisObject) {
      for (var i = 0, len = this.length; i < len; i++) if (i in this) callback.call(thisObject, this[i], i, this);
    },
    every: function(callback, thisObject) {
      for (var i = 0, len = this.length; i < len; i++) if (i in this && !callback.call(thisObject, this[i], i, this)) return false;
      return true;
    },
    some: function(callback, thisObject) {
      for (var i = 0, len = this.length; i < len; i++) if (i in this && callback.call(thisObject, this[i], i, this)) return true;
      return false;
    },
    filter: function(callback, thisObject) {
      var result = [];
      for (var i = 0, len = this.length; i < len; i++) if (i in this && callback.call(thisObject, this[i], i, this)) result.push(this[i]);
      return result;
    },
    map: function(callback, thisObject) {
      var result = [];
      for (var i = 0, len = this.length; i < len; i++) if (i in this) result[i] = callback.call(thisObject, this[i], i, this);
      return result;
    },
    reduce: function(callback, initialValue) {
      var len = this.length;
      var argsLen = arguments.length;
      if (len == 0 && argsLen == 1) throw new TypeError;
      var result;
      var inited = 0;
      if (argsLen > 1) {
        result = initialValue;
        inited = 1;
      }
      for (var i = 0; i < len; i++) if (i in this) if (inited++) result = callback.call(null, result, this[i], i, this); else result = this[i];
      return result;
    }
  });
  var Array_extensions = {
    flatten: function(this_) {
      return this_.concat.apply([], this_);
    },
    repeat: function(this_, count) {
      return Array_extensions.flatten(createArray(parseInt(count, 10) || 0, this_));
    },
    search: function(this_, value, getter_, offset) {
      this_.lastSearchIndex = -1;
      getter_ = getter(getter_ || $self);
      for (var index = parseInt(offset, 10) || 0, len = this_.length; index < len; index++) if (getter_(this_[index]) === value) return this_[this_.lastSearchIndex = index];
    },
    lastSearch: function(this_, value, getter_, offset) {
      this_.lastSearchIndex = -1;
      getter_ = getter(getter_ || $self);
      var len = this_.length;
      var index = isNaN(offset) || offset == null ? len : parseInt(offset, 10);
      for (var i = index > len ? len : index; i-- > 0; ) if (getter_(this_[i]) === value) return this_[this_.lastSearchIndex = i];
    },
    add: function(this_, value) {
      return this_.indexOf(value) == -1 && !!this_.push(value);
    },
    remove: function(this_, value) {
      var index = this_.indexOf(value);
      return index != -1 && !!this_.splice(index, 1);
    },
    has: function(this_, value) {
      return this_.indexOf(value) != -1;
    },
    sortAsObject: function(this_, getter_, comparator, desc) {
      getter_ = getter(getter_);
      desc = desc ? -1 : 1;
      return this_.map(function(item, index) {
        return {
          i: index,
          v: getter_(item)
        };
      }).sort(comparator || function(a, b) {
        return desc * (a.v > b.v || -(a.v < b.v) || (a.i > b.i ? 1 : -1));
      }).map(function(item) {
        return this_[item.i];
      }, this_);
    }
  };
  extendProto(Array, Array_extensions);
  if (![ 1, 2 ].splice(1).length) {
    var nativeArraySplice = Array.prototype.splice;
    Array.prototype.splice = function() {
      var params = arrayFrom(arguments);
      if (params.length < 2) params[1] = this.length;
      return nativeArraySplice.apply(this, params);
    };
  }
  var ESCAPE_FOR_REGEXP = /([\/\\\(\)\[\]\?\{\}\|\*\+\-\.\^\$])/g;
  var FORMAT_REGEXP = /\{([a-z\d_]+)(?::([\.0])(\d+)|:(\?))?\}/gi;
  function isEmptyString(value) {
    return value == null || String(value) == "";
  }
  function isNotEmptyString(value) {
    return value != null && String(value) != "";
  }
  complete(String, {
    toLowerCase: function(value) {
      return String(value).toLowerCase();
    },
    toUpperCase: function(value) {
      return String(value).toUpperCase();
    },
    trim: function(value) {
      return String(value).trim();
    },
    trimLeft: function(value) {
      return String(value).trimLeft();
    },
    trimRight: function(value) {
      return String(value).trimRight();
    }
  });
  complete(String.prototype, {
    trimLeft: function() {
      return this.replace(/^\s+/, "");
    },
    trimRight: function() {
      return this.replace(/\s+$/, "");
    },
    trim: function() {
      return this.trimLeft().trimRight();
    }
  });
  var String_extensions = {
    toObject: function(this_, rethrow) {
      try {
        return (new Function("return 0," + this_))();
      } catch (e) {
        if (rethrow) throw e;
      }
    },
    repeat: function(this_, count) {
      return (new Array(parseInt(count, 10) + 1 || 0)).join(this_);
    },
    qw: function(this_) {
      var trimmed = this_.trim();
      return trimmed ? trimmed.split(/\s+/) : [];
    },
    forRegExp: function(this_) {
      return this_.replace(ESCAPE_FOR_REGEXP, "\\$1");
    },
    format: function(this_, first) {
      var data = arrayFrom(arguments, 1);
      if (typeof first == "object") extend(data, first);
      return this_.replace(FORMAT_REGEXP, function(m, key, numFormat, num, noNull) {
        var value = key in data ? data[key] : noNull ? "" : m;
        if (numFormat && !isNaN(value)) {
          value = Number(value);
          return numFormat == "." ? value.toFixed(num) : Number_extensions.lead(value, num);
        }
        return value;
      });
    },
    capitalize: function(this_) {
      return this_.charAt(0).toUpperCase() + this_.substr(1).toLowerCase();
    },
    camelize: function(this_) {
      return this_.replace(/-(.)/g, function(m, chr) {
        return chr.toUpperCase();
      });
    },
    dasherize: function(this_) {
      return this_.replace(/[A-Z]/g, function(m) {
        return "-" + m.toLowerCase();
      });
    }
  };
  extendProto(String, String_extensions);
  if ("|||".split(/\|/).length + "|||".split(/(\|)/).length != 11) {
    var nativeStringSplit = String.prototype.split;
    String.prototype.split = function(pattern, count) {
      if (!pattern || pattern instanceof RegExp == false || pattern.source == "") return nativeStringSplit.apply(this, arguments);
      var result = [];
      var pos = 0;
      var match;
      if (!pattern.global) pattern = new RegExp(pattern.source, /\/([mi]*)$/.exec(pattern)[1] + "g");
      while (match = pattern.exec(this)) {
        match[0] = this.substring(pos, match.index);
        result.push.apply(result, match);
        pos = pattern.lastIndex;
      }
      result.push(this.substr(pos));
      return result;
    };
  }
  if ("12".substr(-1) != "2") {
    var nativeStringSubstr = String.prototype.substr;
    String.prototype.substr = function(start, end) {
      return nativeStringSubstr.call(this, start < 0 ? Math.max(0, this.length + start) : start, end);
    };
  }
  var Number_extensions = {
    fit: function(this_, min, max) {
      if (!isNaN(min) && this_ < min) return Number(min);
      if (!isNaN(max) && this_ > max) return Number(max);
      return this_;
    },
    lead: function(this_, len, leadChar) {
      return String(this_).replace(/\d+/, function(number) {
        return (len -= number.length - 1) > 1 ? (new Array(len)).join(leadChar || 0) + number : number;
      });
    },
    group: function(this_, len, splitter) {
      return String(this_).replace(/\d+/, function(number) {
        return number.replace(/\d/g, function(m, pos) {
          return !pos + (number.length - pos) % (len || 3) ? m : (splitter || " ") + m;
        });
      });
    },
    format: function(this_, prec, gs, prefix, postfix, comma) {
      var res = this_.toFixed(prec);
      if (gs || comma) res = res.replace(/(\d+)(\.?)/, function(m, number, c) {
        return (gs ? basis.number.group(Number(number), 3, gs) : number) + (c ? comma || c : "");
      });
      if (prefix) res = res.replace(/^-?/, "$&" + (prefix || ""));
      return res + (postfix || "");
    }
  };
  extendProto(Number, Number_extensions);
  complete(Date, {
    now: function() {
      return Number(new Date);
    }
  });
  var ready = function() {
    function isReady() {
      return document.readyState == "complete" && !!document.body;
    }
    var fired = !document || isReady();
    var deferredHandler;
    function runReadyHandler(handler) {
      handler.callback.call(handler.context);
    }
    function fireHandlers() {
      if (isReady()) if (!(fired++)) while (deferredHandler) {
        runReadyHandler(deferredHandler);
        deferredHandler = deferredHandler.next;
      }
    }
    function doScrollCheck() {
      try {
        document.documentElement.doScroll("left");
        fireHandlers();
      } catch (e) {
        setTimeout(doScrollCheck, 1);
      }
    }
    if (!fired) {
      if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", fireHandlers, false);
        global.addEventListener("load", fireHandlers, false);
      } else {
        document.attachEvent("onreadystatechange", fireHandlers);
        global.attachEvent("onload", fireHandlers);
        try {
          if (!global.frameElement && document.documentElement.doScroll) doScrollCheck();
        } catch (e) {}
      }
    }
    return function(callback, context) {
      if (!fired) {
        deferredHandler = {
          callback: callback,
          context: context,
          next: deferredHandler
        };
      } else runReadyHandler({
        callback: callback,
        context: context
      });
    };
  }();
  var documentInterface = function() {
    var timer;
    var reference = {};
    var callbacks = {
      head: [],
      body: []
    };
    function getParent(name) {
      if (document && !reference[name]) {
        reference[name] = document[name] || document.getElementsByTagName(name)[0];
        if (reference[name]) {
          var items = callbacks[name];
          delete callbacks[name];
          for (var i = 0, cb; cb = items[i]; i++) cb[0].call(cb[1], reference[name]);
        }
      }
      return reference[name];
    }
    function add() {
      var name = this[0];
      var node = this[1];
      var ref = this[2];
      remove(node);
      var parent = getParent(name);
      if (parent) {
        if (ref === true) ref = parent.firstChild;
        if (!ref || ref.parentNode !== parent) ref = null;
        parent.insertBefore(node, ref);
      } else callbacks[name].push([ add, [ name, node, ref ] ]);
    }
    function docReady(name, fn, context) {
      if (callbacks[name]) callbacks[name].push([ fn, context ]); else fn.call(context, reference[name]);
    }
    function remove(node) {
      for (var key in callbacks) {
        var entry = Array_extensions.search(callbacks[key], node, function(item) {
          return item[1] && item[1][1];
        });
        if (entry) Array_extensions.remove(callbacks[key], entry);
      }
      if (node && node.parentNode && node.parentNode.nodeType == 1) node.parentNode.removeChild(node);
    }
    function checkParents() {
      if (timer && getParent("head") && getParent("body")) timer = clearInterval(timer);
    }
    if (document && (!getParent("head") || !getParent("body"))) {
      timer = setInterval(checkParents, 5);
      ready(checkParents);
    }
    return {
      head: {
        ready: function(fn, context) {
          docReady("head", fn, context);
        },
        add: function(node, ref) {
          add.call([ "head", node, ref ]);
        }
      },
      body: {
        ready: function(fn, context) {
          docReady("body", fn, context);
        },
        add: function(node, ref) {
          add.call([ "body", node, ref ]);
        }
      },
      remove: remove
    };
  }();
  var cleaner = function() {
    var objects = [];
    function destroy(log) {
      var logDestroy = log && typeof log == "boolean";
      result.globalDestroy = true;
      result.add = $undef;
      result.remove = $undef;
      var object;
      while (object = objects.pop()) {
        if (typeof object.destroy == "function") {
          try {
            if (logDestroy) consoleMethods.log("destroy", "[" + String(object.className) + "]", object);
            object.destroy();
          } catch (e) {
            consoleMethods.warn(String(object), e);
          }
        } else {
          for (var prop in object) object[prop] = null;
        }
      }
      objects.length = 0;
    }
    if ("attachEvent" in global) global.attachEvent("onunload", destroy); else if ("addEventListener" in global) global.addEventListener("unload", destroy, false); else return {
      add: $undef,
      remove: $undef
    };
    var result = {
      add: function(object) {
        if (object != null) objects.push(object);
      },
      remove: function(object) {
        Array_extensions.remove(objects, object);
      }
    };
    result.destroy_ = destroy;
    result.objects_ = objects;
    return result;
  }();
  var CssResource = function() {
    var cssResources = {};
    var cleanupDom = true;
    var STYLE_APPEND_BUGGY = function() {
      try {
        return !document.createElement("style").appendChild(document.createTextNode(""));
      } catch (e) {
        return true;
      }
    }();
    cleaner.add({
      destroy: function() {
        cleanupDom = false;
        for (var url in cssResources) cssResources[url].destroy();
        cssResources = null;
      }
    });
    var baseEl = document && document.createElement("base");
    function setBase(baseURI) {
      baseEl.setAttribute("href", baseURI);
      documentInterface.head.add(baseEl, true);
    }
    function restoreBase() {
      baseEl.setAttribute("href", location.href);
      documentInterface.remove(baseEl);
    }
    function injectStyleToHead() {
      setBase(this.baseURI);
      if (!this.element) {
        this.element = document.createElement("style");
        if (!STYLE_APPEND_BUGGY) this.textNode = this.element.appendChild(document.createTextNode(""));
        this.element.setAttribute("src", pathUtils.relative(this.url));
      }
      documentInterface.head.add(this.element);
      this.syncCssText();
      restoreBase();
    }
    var CssResource = Class(null, {
      className: "basis.CssResource",
      inUse: 0,
      url: "",
      baseURI: "",
      cssText: "",
      resource: null,
      element: null,
      textNode: null,
      init: function(url) {
        this.url = pathUtils.resolve(url);
        this.baseURI = pathUtils.dirname(url) + "/";
        cssResources[url] = this;
      },
      updateCssText: function(cssText) {
        if (this.cssText != cssText) {
          this.cssText = cssText;
          if (this.inUse && this.element) {
            setBase(this.baseURI);
            this.syncCssText();
            restoreBase();
          }
        }
      },
      syncCssText: function() {
        if (this.textNode) {
          this.textNode.nodeValue = this.cssText;
        } else {
          this.element.styleSheet.cssText = this.cssText;
        }
      },
      startUse: function() {
        if (!this.inUse) {
          if (!this.resource) {
            var resource = getResource(this.url);
            this.resource = resource;
            this.cssText = resource.get(true);
          }
          documentInterface.head.ready(injectStyleToHead, this);
        }
        this.inUse += 1;
      },
      stopUse: function() {
        if (this.inUse) {
          this.inUse -= 1;
          if (!this.inUse && this.element) documentInterface.remove(this.element);
        }
      },
      destroy: function() {
        if (this.element && cleanupDom) documentInterface.remove(this.element);
        this.element = null;
        this.textNode = null;
        this.resource = null;
        this.cssText = null;
      }
    });
    CssResource.resources = cssResources;
    return CssResource;
  }();
  var basis = getNamespace("basis").extend({
    filename_: basisFilename,
    version: VERSION,
    NODE_ENV: NODE_ENV,
    config: config,
    platformFeature: {},
    resolveNSFilename: resolveNSFilename,
    patch: patch,
    namespace: getNamespace,
    require: requireNamespace,
    resource: getResource,
    asset: function(url) {
      return url;
    },
    setImmediate: setImmediate,
    clearImmediate: clearImmediate,
    nextTick: function() {
      setImmediate.apply(null, arguments);
    },
    Class: Class,
    Token: Token,
    DeferredToken: DeferredToken,
    getter: getter,
    ready: ready,
    cleaner: cleaner,
    console: consoleMethods,
    path: pathUtils,
    doc: documentInterface,
    object: {
      extend: extend,
      complete: complete,
      keys: keys,
      values: values,
      slice: slice,
      splice: splice,
      merge: merge,
      iterate: iterate
    },
    fn: {
      $undefined: $undefined,
      $defined: $defined,
      $isNull: $isNull,
      $isNotNull: $isNotNull,
      $isSame: $isSame,
      $isNotSame: $isNotSame,
      $self: $self,
      $const: $const,
      $false: $false,
      $true: $true,
      $null: $null,
      $undef: $undef,
      getter: getter,
      nullGetter: nullGetter,
      wrapper: wrapper,
      lazyInit: lazyInit,
      lazyInitAndRun: lazyInitAndRun,
      runOnce: runOnce
    },
    array: extend(arrayFrom, merge(Array_extensions, {
      from: arrayFrom,
      create: createArray
    })),
    string: merge(String_extensions, {
      isEmpty: isEmptyString,
      isNotEmpty: isNotEmptyString
    }),
    number: Number_extensions,
    bool: {
      invert: function(value) {
        return !value;
      }
    },
    json: {
      parse: typeof JSON != "undefined" ? JSON.parse : function(str) {
        return String_extensions.toObject(str, true);
      }
    }
  });
  getNamespace("basis.dev").extend(consoleMethods);
  if (config.autoload) requireNamespace(config.autoload);
})(this);
}).call(this);