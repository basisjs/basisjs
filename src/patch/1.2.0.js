basis.patch('basis.net', function(exports){
  var ajax = require('basis.net.ajax');

  // import names from basis.net.ajax
  basis.net.AjaxTransport = ajax.Transport;
  basis.net.AjaxRequest = ajax.Request;
  basis.net.Transport = ajax.Transport;
  basis.net.request = ajax.request;
  exports.AjaxTransport = ajax.Transport;
  exports.AjaxRequest = ajax.Request;
  exports.Transport = ajax.Transport;
  exports.request = ajax.request;

  // function rename
  exports.createEvent = exports.createTransportEvent;
});

basis.patch('basis.layout', function(exports){
  var panel = require('basis.ui.panel');

  basis.layout.VerticalPanel = panel.VerticalPanel;
  basis.layout.VerticalPanelStack = panel.VerticalPanelStack;
  exports.VerticalPanel = panel.VerticalPanel;
  exports.VerticalPanelStack = panel.VerticalPanelStack;

  require('basis.template').define('basis.layout', {
    Panel: basis.resource(panel.VerticalPanel.prototype.template.source.url),
    Stack: basis.resource(panel.VerticalPanelStack.prototype.template.source.url)
  });
});
