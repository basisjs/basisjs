basis.require('basis.ui');
basis.require('basis.data.index');
basis.require('app.stat');
basis.require('app.core');

var viewInheritance = resource('views/inheritance/inheritance.js')();
var viewSourceCode = resource('views/sourceCode/sourceCode.js')();
var viewTemplate = resource('views/templateView/templateView.js')();
var viewPrototype = resource('views/prototype/prototype.js')();
var viewNamespaceMap = resource('views/namespaceMap/namespaceMap.js')();
var viewDescription = resource('views/description/description.js')();

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

module.exports = new basis.ui.Node({
  template: resource('template/targetContent.tmpl'),
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
    indexPage: new basis.ui.Node({
      template: resource('template/targetContentEmpty.tmpl'),
      binding: {
        pageLoadTime: app.stat.pageLoadTime,
        moduleCount: basis.fn.$const(basis.object.iterate(basis.namespaces_, function(key, value){ return value.filename_ }).filter(Boolean).length),
        walkCount: app.stat.walkCount,
        walkTime: app.stat.walkTime,
        initTime: app.stat.initTime,
        tokenCount: app.stat.tokenCount,
        jsDocsCount: basis.data.index.count(app.core.JsDocEntity.all),
        searchIndexSize: basis.data.index.count(app.core.searchIndex)
      }
    })
  },

  setDelegate: function(delegate){
    this.clear(true);

    basis.ui.Node.prototype.setDelegate.call(this, delegate);

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


