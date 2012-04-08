// Package basis-core.js

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
         'basis.require("basis.data.dataset");\n' +
         'basis.require("basis.entity");\n' +
      '</script>'
    );
  }
}();