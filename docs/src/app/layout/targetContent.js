var Node = require('basis.ui').Node;
var count = require('basis.data.index').count;
var appStat = require('app.stat');
var appCore = require('app.core');

var viewInheritance = require('./views/inheritance/inheritance.js');
var viewSourceCode = require('./views/sourceCode/sourceCode.js');
var viewTemplate = require('./views/templateView/templateView.js');
var viewPrototype = require('./views/prototype/prototype.js');
var viewNamespaceMap = require('./views/namespaceMap/namespaceMap.js');
var viewDescription = require('./views/description/description.js');

var VIEW_MAP = {
  'namespace':      [viewDescription, viewNamespaceMap],
  'method':         [viewDescription, viewInheritance, viewSourceCode],
  'function':       [viewDescription, viewSourceCode],
  'property':       [viewDescription, viewInheritance],
  'classMember':    [viewDescription],
  'constant':       [viewDescription],
  'constantObject': [viewDescription],
  'htmlElement':    [viewDescription],
  'class':          [viewDescription, viewInheritance, viewTemplate, viewPrototype],
  'object':         [viewDescription],
  'event':          [viewDescription, viewInheritance, viewSourceCode]
};

module.exports = new Node({
  template: resource('./template/targetContent.tmpl'),
  binding: {
    indexPage: 'satellite:',
    hasDelegate: {
      events: 'delegateChanged',
      getter: function(node){
        return !!node.delegate;
      }
    }
  },

  satellite: {
    indexPage: new Node({
      template: resource('./template/targetContentEmpty.tmpl'),
      binding: {
        moduleCount: basis.fn.$const(
          basis.object.values(basis.namespaces_).reduce(function(res, ns){
            return res + !!ns.filename_;
          }, 0)
        ),
        pageLoadTime: appStat.pageLoadTime,
        walkCount: appStat.walkCount,
        walkTime: appStat.walkTime,
        initTime: appStat.initTime,
        tokenCount: appStat.tokenCount,
        jsDocsCount: count(appCore.JsDocEntity.all),
        searchIndexSize: count(appCore.searchIndex)
      }
    })
  },

  setDelegate: function(delegate){
    this.clear(true);

    Node.prototype.setDelegate.call(this, delegate);

    if (this.delegate)
    {
      this.setChildNodes((VIEW_MAP[this.data.kind.toLowerCase()] || []).filter(function(view){
        return view.isAcceptableObject(this.data);
      }, this), true);

      this.scrollTo(this.firstChild.element, true);
    }
  },
  scrollTo: basis.fn.$true
});
