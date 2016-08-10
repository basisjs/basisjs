var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var remote = require('../remote.js');
var hasRemote = new Expression(
  remote.remoteInspectors,
  remote.devtools,
  function(inspectors, plugin){
    return Boolean(inspectors || plugin);
  }
);

function createDynamicView(input, Class, config){
  var view = new Expression(input, hasRemote, function(input, remote){
    return {
      input: input,
      remote: remote
    };
  })
    .link(new Value(), function(value, oldValue){
      this.set(value.input && !value.remote && (!oldValue || value.input !== oldValue.input));
    })
    .as(function(showView){
      return showView ? new Class(config) : null;
    });

  view.link(null, function(view, oldView){
    if (oldView)
      oldView.destroy();
  });

  return view;
}

module.exports = {
  createDynamicView: createDynamicView
};
