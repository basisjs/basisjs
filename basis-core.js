// Package basis-core.js

!function(){
  if (typeof document != 'undefined')
  {
    var curScript = document.getElementByTagName('script');
    var curLocation = curScript.src.replace(/[^\/]+\.js$/, '');

    document.write('<script src="' + curLocation + 'src/basis.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ua.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/dom.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/dom/event.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/data.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/html.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/dom/wrapper.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/cssom.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/data/dataset.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/entity.js"></script>');
    document.write('<script src="' + curLocation + 'src/package/core.js"></script>');
  }
}();