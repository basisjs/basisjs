var transport = resource('transport.js').fetch();

var l10nInspector = resource('../inspector/l10n.js').fetch();
var templateInspector = resource('../inspector/template.js').fetch();

module.exports = {
  getInspectMode: function(){
    var mode = false;
    if (l10nInspector.isActive())
      transport.sendData('startInspect', 'l10n');

    if (templateInspector.isActive())
      transport.sendData('startInspect', 'template');
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
