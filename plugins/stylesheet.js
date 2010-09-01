(function() {

 /**
  * @namespace
  */
  
  var namespace = String('Basis.DOM.Style');

  // import names

  var Class = Basis.Class;
  var DOM = Basis.DOM;

  //
  // working with themes
  //

  function getStylesheetLinks(){
    return DOM.tag(document, 'LINK').filter(function(link){
      return /stylesheet/.test(link.rel) && /screen/.test(link.media) && link.title;
    });
  }

  function getPrefferedStyleSheet(){
    var styleSheets = getStylesheetLinks();
    for (var i = 0, link; link = styleSheets[i]; i++)
      if (!(/alternate|alternative/.test(link.rel)))
        return link.title;
  }

  function getActiveStyleSheet(){
    var styleSheets = getStylesheetLinks();
    for (var i = 0, link; link = styleSheets[i]; i++)
      if (!link.disabled)
        return link.title;
  }

  function setActiveStyleSheet(title){
    var styleSheets = getStylesheetLinks();
    for (var i = 0, link; link = styleSheets[i]; i++)
    {
      link.disabled = true; // WTF? :)
      link.disabled = title != link.title;
    }
  }

  // misc

  /*
  function createRulesHash(stylesheet, result){
    if (!result)
      result = [];

    // IE @import processing
    Array.from(stylesheet.imports).forEach(function(importRule){ createRulesHash(importRule, result) });

    if (!stylesheet.cssRules)
      stylesheet.cssRules = stylesheet.rules;

    var cssRules = stylesheet.cssRules;
    if (!cssRules) 
      return;

    var rule;
    for (var i = 0; i < cssRules.length; i++)
    {
      rule = cssRules[i];

      var type = rule.type;

      if (rule.selectorText)
        type = 1;

      if (type == 1)
        wrapper.addRuleToTable_(rule, rule.selectorText);
      else if (type == 3 && type == 4)
        createRulesHash(wrapper, rule.styleSheet || rule);
    }
  }*/

  // export names

  Basis.namespace(namespace).extend({
    getActiveStyleSheet: getActiveStyleSheet,
    setActiveStyleSheet: setActiveStyleSheet,
    getPrefferedStyleSheet: getPrefferedStyleSheet
  });

})();