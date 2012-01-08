// Package basis-all.js

!function(){
  if (typeof document != 'undefined')
  {
    var scripts = document.getElementsByTagName('script');
    var curLocation = scripts[scripts.length - 1].src.replace(/[^\/]+\.js$/, '');

    document.write('<script src="' + curLocation + 'src/basis.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/event.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ua.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/dom.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/dom/event.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/data.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/html.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/dom/wrapper.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/cssom.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/date.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/layout.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/dragdrop.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/data/property.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/animation.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/xml.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/crypt.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/data/dataset.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/data/generator.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/data/index.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/entity.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/session.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/net/ajax.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/net/soap.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/button.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/label.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/tree.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/popup.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/table.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/scrolltable.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/window.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/tabs.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/calendar.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/form.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/scroller.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/slider.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/resizer.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/paginator.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/pageslider.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/canvas.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/ui/graph.js"></script>');
    document.write('<script src="' + curLocation + 'src/basis/format/highlight.js"></script>');
  }
}();