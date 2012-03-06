
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

  var compileWidget = 'eval' in global
    ? function(scriptText){
        return global["eval"].call(global, scriptText);
      }
    : function(scriptText){
        return scriptText.toObject();
      }

  function widget(widgetName, lazy){
    if (widgetName in widgets == false)
    {
      if (lazy === false)
      {
        var url = widgetRoot + widgetName + widgetSuffix;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.setRequestHeader('If-Modified-Since', new Date(0).toGMTString());
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
  editor.tmplSource.addLink(tokenView, tokenView.setSource);

  // fsobserver -> app
  fsobserver.isOnline.addLink(null, function(value){
    if (value)
      initFilelist();
  });

  var initFilelist = Function.runOnce(function(){
    // add filelist into app
    app.setSatellite('filelist', filelist());

    // tree.selection -> editor
    filelist().tree.selection.addHandler({
      datasetChanged: function(selection, delta){
        this.setSourceFile(selection.pick());
      }
    }, editor);
  });

  function updatePickupElement(value, oldValue){
    if (value && value.element.nodeType == 1)
      basis.cssom.setStyle(value, {
        'box-shadow': '0 0 15px rgba(0,128,0,.75)',
        'outline': '2px solid rgba(0,128,0,.75)',
        'background-color': 'rgba(0,128,0,.5)'
      });
    if (oldValue && oldValue.element.nodeType == 1)
      basis.cssom.setStyle(oldValue, {
        'box-shadow': '',
        'outline': '',
        background: ''
      });
  }

  var pickupActive = new basis.data.property.Property(false, {
    change: function(value){
      updatePickupElement(
        value ? pickupTarget.value : null,
        !value ? pickupTarget.value : null
      );
    }
  });
  var pickupTarget = new basis.data.property.Property(null, {
    change: function(value, oldValue){
      if (pickupActive.value)
        updatePickupElement(value, oldValue);
    }
  }, function(value){
    return value && value.element && value.template instanceof basis.template.Template ? value : null;
  });

  basis.dom.event.addGlobalHandler('mousemove', function(event){
    pickupActive.set(event.altKey && event.ctrlKey);
    var cursor = basis.dom.event.sender(event);
    do {
      if (refId = cursor.basisObjectId)
        return pickupTarget.set(basis.template.resolveObjectById(refId));
    } while (cursor = cursor.parentNode);
  });
  basis.dom.event.addGlobalHandler('click', function(event){
    if (pickupTarget.value && pickupActive.value)
    {
      basis.dom.event.kill(event);

      var source = pickupTarget.value.template.source;
      editor.setSource(String(typeof source == 'function' ? source() : source));
    }
  });
  basis.dom.event.addGlobalHandler('keydown', function(event){
    pickupActive.set(event.altKey && event.ctrlKey);
  });
  basis.dom.event.addGlobalHandler('keyup', function(event){
    pickupActive.set(event.altKey && event.ctrlKey);
  });

  //
  // App
  //

  var app = new basis.ui.Container({
    container: document.body,
    template:
      '<div id="Layout">' +
        '<!--{filelist}-->' +
        '<!--{tokenView}-->' +
        '<!--{editor}-->' +
      '</div>',

    binding: {
      filelist: 'satellite:',
      tokenView: 'satellite:',
      editor: 'satellite:'
    },
    satellite: {
      tokenView: tokenView,
      editor: editor
    }/*
    childNodes: [
      tokenView,
      editor
    ]*/
  });

  editor.tmplEditor.tmpl.field.focus();

  /*'addRule deleteRule insertRule removeRule'.qw().forEach(function(methodName){
    var realMethod = CSSStyleSheet.prototype[methodName];
    CSSStyleSheet.prototype[methodName] = function(){
      console.log(methodName, arguments);
      realMethod.apply(this, arguments);
    }
  })*/


})(basis, this);