
  var viewInheritance = basis.resource('app/views/inheritance/inheritance.js')();
  var viewSourceCode = basis.resource('app/views/sourceCode/sourceCode.js')();
  var viewTemplate = basis.resource('app/views/templateView/templateView.js')();
  var viewPrototype = basis.resource('app/views/prototype/prototype.js')();
  var viewNamespaceMap = basis.resource('app/views/namespaceMap/namespaceMap.js')();
  var viewDescription = basis.resource('app/views/description/description.js')();

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
    id: 'ObjectView',

    template: resource('template/targetContent.tmpl'),

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


  