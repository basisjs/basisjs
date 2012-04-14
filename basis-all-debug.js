// Package basis-all.js

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
    document.write('  basis.require("basis.ua.visibility");');
    document.write('  basis.require("basis.dom");');
    document.write('  basis.require("basis.dom.event");');
    document.write('  basis.require("basis.data");');
    document.write('  basis.require("basis.template");');
    document.write('  basis.require("basis.html");');
    document.write('  basis.require("basis.dom.wrapper");');
    document.write('  basis.require("basis.cssom");');
    document.write('  basis.require("basis.date");');
    document.write('  basis.require("basis.l10n");');
    document.write('  basis.require("basis.ui");');
    document.write('  basis.require("basis.layout");');
    document.write('  basis.require("basis.dragdrop");');
    document.write('  basis.require("basis.data.property");');
    document.write('  basis.require("basis.animation");');
    document.write('  basis.require("basis.xml");');
    document.write('  basis.require("basis.crypt");');
    document.write('  basis.require("basis.data.dataset");');
    document.write('  basis.require("basis.data.generator");');
    document.write('  basis.require("basis.data.index");');
    document.write('  basis.require("basis.entity");');
    document.write('  basis.require("basis.session");');
    document.write('  basis.require("basis.net.ajax");');
    document.write('  basis.require("basis.net.soap");');
    document.write('  basis.require("basis.ui.button");');
    document.write('  basis.require("basis.ui.label");');
    document.write('  basis.require("basis.ui.tree");');
    document.write('  basis.require("basis.ui.popup");');
    document.write('  basis.require("basis.ui.table");');
    document.write('  basis.require("basis.ui.scrolltable");');
    document.write('  basis.require("basis.ui.window");');
    document.write('  basis.require("basis.ui.tabs");');
    document.write('  basis.require("basis.ui.calendar");');
    document.write('  basis.require("basis.ui.form");');
    document.write('  basis.require("basis.ui.scroller");');
    document.write('  basis.require("basis.ui.slider");');
    document.write('  basis.require("basis.ui.resizer");');
    document.write('  basis.require("basis.ui.paginator");');
    document.write('  basis.require("basis.ui.pageslider");');
    document.write('  basis.require("basis.ui.canvas");');
    document.write('  basis.require("basis.ui.graph");');
    document.write('  basis.require("basis.format.highlight");');
    document.write('</script>');
  }
}();