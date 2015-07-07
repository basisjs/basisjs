var HtmlTemplate = require('basis.template.html').Template;
//;;;basis.require('basis.devpanel');

var srcMap = [];
var tmplMap = [];

function templateWrapper(src){
  var index = srcMap.indexOf(src);
  if (index != -1)
    return tmplMap[index];

  var template = new HtmlTemplate(src);

  srcMap.push(src);
  tmplMap.push(template);

  return template;
}

//
// backbone.js adapter
//

var backboneTemplate = (function(){
  function actionProxy(actionName, event){
    if (typeof this[actionName] == 'function')
      this[actionName](event);
  }

  function updateBind(bindName){
    var binding = this.binding && this.binding[bindName];
    var getter = binding && binding.getter;

    if (getter && this.tmpl)
      this.tmpl.set(bindName, getter(this));
  }

  var gBindings = {};
  var gSeed = 1;
  var BINDING_TEMPLATE_INTERFACE = {
    attach: function(object, handler, context){
      for (var event in handler) {
        var parts = event.split(':');
        if (parts.length > 1)
          object[parts[0]].on(parts[1], handler[event].bind(context, object));
        else
          object.on(event, handler[event], context);
      }
    },
    detach: function(object, handler, context){
      for (var event in handler) {
        var parts = event.split(':');
        if (parts.length > 1)
          object[parts[0]].off(parts[1], handler[event], context);
        else
          object.off(event, handler[event], context);
      }
    }
  };

  return function(source){
    var tmpl = templateWrapper(source);
    return function(){
      var binding;
      if (this.binding)
      {
        binding = gBindings[this.binding.id_];
        if (!binding)
        {
          if (!this.binding.id_)
            this.binding.id_ = gSeed++;

          binding = gBindings[this.binding.id_] = {
            bindingId: this.binding.id_
          };

          for (var key in this.binding) {
            if (this.binding[key]) {
              if (typeof this.binding[key] == 'string')
              {
                var m = this.binding[key].match(/^model:(.*)$/);
                if (m) {
                  binding[key] = (function(key){
                    return {
                      events: 'model:change',
                      getter: function(view){
                        return view.model.get(key);
                      }
                    };
                  })(m[1] || key);
                }
                else
                {
                  binding[key] = (function(key){
                    return {
                      getter: function(view){
                        return view[key];
                      }
                    };
                  })(key);
                }
              }
              else
              {
                if (typeof this.binding[key] == 'string' || typeof this.binding[key] == 'object')
                  binding[key] = this.binding[key];
              }
            }
          }
        }
      }

      this.tmpl = tmpl.createInstance(this, actionProxy, null, binding, BINDING_TEMPLATE_INTERFACE);
      this.updateBind = updateBind;

      return this.tmpl.element;
    };
  };
})();

global.bbt = module.exports = basis.object.extend(backboneTemplate, {
  init: function(config){
    if (!config)
      return this;

    if (config.noConflict)
    {
      delete window.bt;
      return this;
    }
  },

  template: backboneTemplate
});
