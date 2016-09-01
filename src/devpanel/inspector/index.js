var inspect = require('api').inspect;
var inspectors = {
  'grid': resource('./grid.js'),
  'heatmap': resource('./heatmap.js'),
  'l10n': resource('./l10n.js'),
  'roles': resource('./roles.js'),
  'pick-roles': resource('./roles.js'),
  'template': resource('./template.js')
};

var currentInspector = inspect.as(function(mode){
  return inspectors.hasOwnProperty(mode) ? inspectors[mode].fetch() : false;
});
var currentInspectorName = currentInspector.as('name');

// activate/deactivate
currentInspector.link(null, function(inspector, oldInspector){
  if (oldInspector)
    oldInspector.stopInspect();
  if (inspector)
    inspector.startInspect();
});

module.exports = {
  inspectors: inspectors,
  current: currentInspector,
  currentName: currentInspectorName
};
