
var inspector = resource('templateInspector.js').fetch();

module.exports = {
  templateStartInspect: function(){
    inspector.startInspect();
  },
  templateEndInspect: function(){
    inspector.endInspect();
  }
}