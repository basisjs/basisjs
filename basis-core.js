// Package basis-core.js

!function(){
  if (typeof document != 'undefined')
  {
    var scripts = document.getElementsByTagName('script');
    var curLocation = scripts[scripts.length - 1].src.replace(/[^\/]+\.js$/, '');

    document.write('<script src="' + curLocation + 'src/basis.js"></script>');

    document.write('<script>');
    document.write('  basis.require("basis.timer");');
    document.write('  basis.require("basis.event");');
    document.write('  basis.require("basis.ua");');
    document.write('  basis.require("basis.dom");');
    document.write('  basis.require("basis.dom.event");');
    document.write('  basis.require("basis.data");');
    document.write('  basis.require("basis.template");');
    document.write('  basis.require("basis.html");');
    document.write('  basis.require("basis.dom.wrapper");');
    document.write('  basis.require("basis.cssom");');
    document.write('  basis.require("basis.data.dataset");');
    document.write('  basis.require("basis.entity");');
    document.write('</script>');
  }
}();