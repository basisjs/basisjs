// simple class, like native js class
var SimpleClass = basis.Class(null, {
  name: 'no name',
  init: function(name){
    this.name = name;
  }
});
var simple = new SimpleClass('Jhon');

// auto extend on init class
var AutoExtendClass = basis.Class(null, {
  name: 'no name',
  extendConstructor_: true
});
var autoExtend = new AutoExtendClass({
  name: 'Jhon'
});