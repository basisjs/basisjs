
//basis.require('devtools.templater.List');
//basis.require('devtools.templater.tokenView');
//basis.require('devtools.templater.editor');

(function(basis, global){

 /**
  * @namespace
  */
  var namespace = 'app';


  //
  // widget subsystem prototype
  //

  var widgets = {};
  var widgetRoot = 'js/';
  var widgetSuffix = '.widget.js';

  function widget(widgetName){
    var url = widgetRoot + widgetName + widgetSuffix;
    var result = widgets[widgetName];
    if (result)
      return result;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send('');
    if (xhr.status == 200)
    {
      (global.execScript || function(scriptText){
        result = global["eval"].call(global, scriptText + '//@ sourceURL=' + url);
      })(xhr.responseText);

      return widgets[widgetName] = result;
    }
    else
      throw 'Widget `' + widgetName + '`not found (url: ' + url + ')';
  }


  //
  // import names
  //

  var filelist = widget('filelist');
  var editor = widget('editor');
  var tokenView = widget('tokenView');

  //
  // main part
  //

  // tree.selection -> editor
  filelist.tree.selection.addHandler({
    datasetChanged: function(selection, delta){
      this.setDelegate(selection.pick());
    }
  }, editor);

  // editor -> tokenView
  editor.templateSource.addLink(tokenView, tokenView.setSource);

  //
  // App
  //

  var app = new basis.ui.Container({
    id: 'Layout',
    container: document.body,
    childNodes: [
      filelist,
      tokenView,
      editor
    ]
  });

  editor.form.firstChild.tmpl.field.focus();

})(basis, this);