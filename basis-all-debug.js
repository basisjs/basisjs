// Package basis-all.js

!function(){
  if (typeof document != 'undefined')
  {
    var scripts = document.getElementsByTagName('script');
    var curLocation = scripts[scripts.length - 1].src.replace(/[^\/]+\.js$/, '');

    document.write(
      '<script src="' + curLocation + 'src/basis.js"></script>',
      '<script>\n' +
         'basis.require("basis.timer");\n' +
         'basis.require("basis.event");\n' +
         'basis.require("basis.ua");\n' +
         'basis.require("basis.dom");\n' +
         'basis.require("basis.dom.event");\n' +
         'basis.require("basis.data");\n' +
         'basis.require("basis.template");\n' +
         'basis.require("basis.html");\n' +
         'basis.require("basis.dom.wrapper");\n' +
         'basis.require("basis.cssom");\n' +
         'basis.require("basis.date");\n' +
         'basis.require("basis.ui");\n' +
         'basis.require("basis.layout");\n' +
         'basis.require("basis.dragdrop");\n' +
         'basis.require("basis.data.property");\n' +
         'basis.require("basis.animation");\n' +
         'basis.require("basis.xml");\n' +
         'basis.require("basis.crypt");\n' +
         'basis.require("basis.data.dataset");\n' +
         'basis.require("basis.data.generator");\n' +
         'basis.require("basis.data.index");\n' +
         'basis.require("basis.entity");\n' +
         'basis.require("basis.session");\n' +
         'basis.require("basis.net.ajax");\n' +
         'basis.require("basis.net.soap");\n' +
         'basis.require("basis.ui.button");\n' +
         'basis.require("basis.ui.label");\n' +
         'basis.require("basis.ui.tree");\n' +
         'basis.require("basis.ui.popup");\n' +
         'basis.require("basis.ui.table");\n' +
         'basis.require("basis.ui.scrolltable");\n' +
         'basis.require("basis.ui.window");\n' +
         'basis.require("basis.ui.tabs");\n' +
         'basis.require("basis.ui.calendar");\n' +
         'basis.require("basis.ui.form");\n' +
         'basis.require("basis.ui.scroller");\n' +
         'basis.require("basis.ui.slider");\n' +
         'basis.require("basis.ui.resizer");\n' +
         'basis.require("basis.ui.paginator");\n' +
         'basis.require("basis.ui.pageslider");\n' +
         'basis.require("basis.ui.canvas");\n' +
         'basis.require("basis.ui.graph");\n' +
         'basis.require("basis.format.highlight");\n' +
      '</script>'
    );
  }
}();