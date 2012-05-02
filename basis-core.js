// Package basis-core.js

!function(){
  if (typeof document != 'undefined')
  {
    var scripts = document.getElementsByTagName('script');
    var curLocation = scripts[scripts.length - 1].src.replace(/[^\/]+\.js$/, '');

    document.write('<script basis-config="{}" src="' + curLocation + 'src/basis.js"></script>');

    document.write('<script src="' + curLocation + 'src/package/core.js"></script>');

  }
}();