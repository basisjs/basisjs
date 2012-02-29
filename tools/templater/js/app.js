
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

  var compileWidget = global.execScript || function(scriptText){
    return global["eval"].call(global, scriptText);
  };

  function widget(widgetName, lazy){
    if (widgetName in widgets == false)
    {
      if (lazy === false)
      {
        var url = widgetRoot + widgetName + widgetSuffix;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send('');

        if (xhr.status == 200)
        {
          // reserve widget name
          widgets[widgetName] = undefined;
          widgets[widgetName] = compileWidget(xhr.responseText + '//@ sourceURL=' + url);
        }
        else
          throw 'Widget `' + widgetName + '`not found (url: ' + url + ')';
      }
      else
        widgets[widgetName] = Function.lazyInit(function(){
          delete widgets[widgetName];
          return widget(widgetName, false);
        });
    }

    return widgets[widgetName];
  }


  //
  // import names
  //

  var editor = widget('editor', false);
  var tokenView = widget('tokenView', false);
  var filelist = widget('filelist');
  var fsobserver = basis.devtools;

  //
  // main part
  //

  // editor -> tokenView
  editor.templateSource.addLink(tokenView, tokenView.setSource);

  // fsobserver -> app
  fsobserver.isOnline.addLink(null, function(value){
    if (value)
      initFilelist();
  });

  var initFilelist = Function.runOnce(function(){
    // add filelist into app
    app.insertBefore(filelist(), tokenView);

    // tree.selection -> editor
    filelist().tree.selection.addHandler({
      datasetChanged: function(selection, delta){
        this.setDelegate(selection.pick());
      }
    }, editor);
  });


  //
  // App
  //

  var app = new basis.ui.Container({
    id: 'Layout',
    container: document.body,
    childNodes: [
      tokenView,
      editor
    ]
  });

  editor.form.firstChild.tmpl.field.focus();

})(basis, this);