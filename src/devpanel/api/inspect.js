var sendData = require('devpanel.transport').sendData;
var l10nInspector = require('../inspector/l10n.js');
var templateInspector = require('../inspector/template.js');

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
    l10nInspector.endInspect();
  },
  templateStartInspect: function(){
    templateInspector.startInspect();
  },
  templateEndInspect: function(){
    templateInspector.endInspect();
  }
};
