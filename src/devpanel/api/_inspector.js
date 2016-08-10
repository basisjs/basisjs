var sendData = require('./transport.js').sendData;
var l10nInspector = require('../inspector/l10n.js');
var templateInspector = require('../inspector/template.js');

l10nInspector.inspectMode.link(null, function(active){
  sendData(active ? 'startInspect' : 'endInspect', 'l10n');
}, true);

templateInspector.inspectMode.link(null, function(active){
  sendData(active ? 'startInspect' : 'endInspect', 'template');
}, true);

module.exports = {
  getInspectMode: function(){
    if (l10nInspector.isActive())
      sendData('startInspect', 'l10n');

    if (templateInspector.isActive())
      sendData('startInspect', 'template');
  },
  l10nStartInspect: function(){
    l10nInspector.startInspect();
  },
  l10nEndInspect: function(){
    l10nInspector.stopInspect();
  },
  templateStartInspect: function(){
    templateInspector.startInspect();
  },
  templateEndInspect: function(){
    templateInspector.stopInspect();
  }
};
