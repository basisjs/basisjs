/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev
 * Roman Dvornov
 */

basis.require('basis.dom');
basis.require('basis.dom.event');

!function(basis, global){

 'use strict';

 /**
  * @namespace basis.cssom
  */
  
  var namespace = 'basis.cssom';

  //
  // import names
  //

  var document = global.document;
  var dom = basis.dom;
  var event = basis.dom.event;
  var Class = basis.Class;

  //
  // main part
  //

  var IMPORTANT_REGEXP = /\s*!important/i;
  var IMPORTANT = String('important');
  var GENERIC_RULE_SEED = 1;
  var cssStyleSheets = {};

  //
  // shortcut
  //
  
  function cssRule(selector, styleSheet){
    return getStyleSheet(styleSheet, true).getRule(selector, true);
  }

  function isPropertyImportant(style, property){
    if (style.getPropertyPriority)
      return style.getPropertyPriority(property) == IMPORTANT;
    else
      return false;
  }

 /**
  * @func
  * @param {Element} element
  */
  function uniqueRule(element){
    var token = 'genericRule-' + GENERIC_RULE_SEED++;

    if (element)
      classList(element).add(token);

    var result = cssRule('.' + token);
    result.token = token;

    return result;
  }

  //
  // working with stylesheets
  //

  function StyleSheet_insertRule(rule, index){
    // fetch selector and style from rule description
    var m = rule.match(/^([^{]+)\{(.*)\}\s*$/);
    if (m)
    {
      var selectors = m[1].trim().split(/\s*,\s*/);
      for (var i = 0; i < selectors.length; i++)
        this.addRule(selectors[i], m[2] || null, index++);
      return index - 1;
    }

    ;;;throw new Error("Syntax error in CSS rule to be added");
  }

  function StyleSheet_makeCompatible(style){
    // FF throws exception if access to cssRules property until stylesheet isn't ready (loaded)
    try {
      if (!style.cssRules)
        style.cssRules = style.rules;
    }
    catch(e){
    }

    // extend style sheet with methods according to W3C spec
    if (!style.insertRule)
      style.insertRule = StyleSheet_insertRule;

    if (!style.deleteRule)
      style.deleteRule = style.removeRule;

    return style;
  }

 /**
  * Creates <STYLE> or <LINK> node, adds it to document and returns it's stylesheet object.
  * @param {string=} url Url of css file. In this case <LINK> will created. If this parameter ommited <STYLE> will created
  * @param {string=} title Value for title attribute.
  * @return {StyleSheet}
  */
  function addStyleSheet(url, title){
    var element = dom.createElement(!url ? 'STYLE[type="text/css"]' : 'LINK[type="text/css"][rel="{alt}stylesheet"][href={url}]'.format({
      alt: title ? 'alternate ' : '',
      url: url.quote('"')
    }));

    dom.tag(null, 'HEAD')[0].appendChild(element);

    return StyleSheet_makeCompatible(element.sheet || element.styleSheet);
  }

  var basisId = 1;

 /**
  * Returns generic stylesheet by it's id.
  * @param {string=} id
  * @param {boolean=} createIfNotExists
  * @return {basis.cssom.CssStyleSheetWrapper}
  */
  function getStyleSheet(id, createIfNotExists){
    if (!id)
      id = 'DefaultGenericStyleSheet';

    if (!cssStyleSheets[id])
      if (createIfNotExists)
        cssStyleSheets[id] = new CssStyleSheetWrapper(addStyleSheet())

    return cssStyleSheets[id];
  }

  //
  // Style mapping
  //

  var styleMapping = {};
  var testElement = dom.createElement('DIV');

  function createStyleMapping(property, names, regSupport, getters){
    getters = getters || {};
    names = names.qw();

    for (var i = 0, name; name = names[i]; i++)
    {
      if (typeof testElement.style[name] != 'undefined')
      {
        if (regSupport)
          basis.platformFeature['css-' + property] = name;

        styleMapping[property] = {
          key: name,
          getter: getters[name]
        };

        return;
      }
    }
  };

  createStyleMapping('opacity', 'opacity MozOpacity KhtmlOpacity filter', true, {
    fitler: function(value){ return 'alpha(opacity:' + parseInt(value * 100) + ')' }
  });
  createStyleMapping('border-radius', 'borderRadius MozBorderRadius WebkitBorderRadius', true);
  createStyleMapping('float', 'cssFloat styleFloat');

 /**
  * Apply new style property values for node.
  * @param {Node} node Node which style to be changed.
  * @param {object} style Object contains new values for node style properties.
  * @return {Node} 
  */
  function getStylePropertyMapping(key, value){
    var mapping = styleMapping[key];
    if (key = mapping ? mapping.key : key.replace(/^-ms-/, 'ms-').camelize())
      return {
        key: key,
        value: mapping && mapping.getter ? mapping.getter(value) : value
      };
  }

 /**
  * Apply new style property value for node.
  * @param {Node} node Node which style to be changed.
  * @param {string} key Name of property.
  * @param {string} value Value of property.
gj   */
  function setStyleProperty(node, key, value){
    if (typeof node.setProperty == 'function')
      return node.setProperty(key, value);

    var mapping = getStylePropertyMapping(key, value);
    if (mapping)
      return node.style[mapping.key] = mapping.value;
  }

 /**
  * Apply new style properties for node.
  * @param {Node} node Node which style to be changed.
  * @param {object} style Object contains new values for node style properties.
  * @return {Node} 
  */
  function setStyle(node, style){
    for (var key in style)
      setStyleProperty(node, key, style[key]);

    return node;
  }


  //
  // dom node styling
  //

 /**
  * Changes for node display value.
  * @param {Node} node
  * @param {boolean|string} display
  * @return {Node}
  */
  function display(node, display){
    return setStyleProperty(node, 'display', typeof display == 'string' ? display : (display ? '' : 'none'));
  }

 /**
  * @deprecated use basis.dom.display instead.
  */
  function show(element){
    return display(element, 1);
  }
 /**
  * @deprecated use basis.dom.display instead.
  */
  function hide(element){ 
    return display(element);
  }

 /**
  * Changes node visibility.
  * @param {Node} node
  * @param {boolean} visible
  * @return {Node}
  */
  function visibility(node, visible){
    return setStyleProperty(node, 'visibility', visible ? '' : 'hidden');
  }

 /**
  * @deprecated use basis.dom.visibility instead.
  */
  function visible(element){
    return visibility(element, 1);
  }
 /**
  * @deprecated use basis.dom.visibility instead.
  */
  function invisible(element){
    return visibility(element);
  }

  //
  // classes
  //

 /**
  * @class
  */
  var CssStyleSheetWrapper = Class(null, {
    className: namespace + '.CssStyleSheetWrapper',

   /**
    * Wrapped stylesheet
    * @type {StyleSheet}
    */
    styleSheet: null,

   /**
    * @type {Array.<CssRuleWrapper|CssRuleWrapperSet>}
    */
    rules: null,

   /**
    * @param {StyleSheet} styleSheet
    * @constructor
    */
    init: function(styleSheet){
      this.styleSheet = styleSheet;
      this.rules = [];
      this.map_ = {};
    },

   /**
    * @param {string} selector
    * @param {boolean=} createIfNotExists
    * @return {CssRuleWrapper|CssRuleWrapperSet}
    */
    getRule: function(selector, createIfNotExists){
      if (!this.map_[selector])
      {
        if (createIfNotExists)
        {
          var styleSheet = this.styleSheet;
          var index = this.rules.length;
          var newIndex = styleSheet.insertRule(selector + '{}', index);

          for (var i = index; i <= newIndex; i++)
            this.rules.push(new CssRuleWrapper(styleSheet.cssRules[i]));

          this.map_[selector] = index != newIndex ? new CssRuleWrapperSet(this.rules.splice(index)) : this.rules[index];
        }
      }

      return this.map_[selector];
    },

   /**
    * @param {string} selector
    */
    deleteRule: function(selector){
      var rule = this.map_[selector];
      if (rule)
      {
        var rules = rule.rules || [rule];
        for (var i = 0; i < rules.length; i++)
        {
          var ruleIndex = this.rules.indexOf(rules[i]);
          this.stylesheet.deleteRule(ruleIndex);
          this.rules.splice(ruleIndex, 1);
        }
        delete this.map_[selector];
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      delete this.rules;
    }
  });

 /**
  * @class
  */
  var CssRuleWrapper = Class(null, {
    className: namespace + '.CssRuleWrapper',

   /**
    * type {CSSRule}
    */
    rule: null,

   /**
    * type {string}
    */
    selector: '',

   /**
    * @param {CSSRule} rule
    * @contructor
    */
    init: function(rule){
      if (rule)
      {
        this.rule = rule;
        this.selector = rule.selectorText;
      }
    },

   /**
    * @param {string} property
    * @param {any} value
    */
    setProperty: function(property, value){
      var mapping;
      var imp = !!IMPORTANT_REGEXP.test(value);
      var style = this.rule.style;
      if (imp || isPropertyImportant(style, property))
      {
        value = value.replace(IMPORTANT_REGEXP, '');

        if (mapping = getStylePropertyMapping(property, value))
        {
          var key = mapping.key;

          if (style.setProperty)
          {
            // W3C scheme

            // if property exists and important, remove it
            if (!imp)
              style.removeProperty(key);

            // set new value for property
            style.setProperty(key, mapping.value, (imp ? IMPORTANT : ''));
          }
          else
          {
            // IE8- scheme
            var newValue = key + ': ' + mapping.value + (imp ? ' !' + IMPORTANT : '') + ';';
            var rxText = style[key] ? key + '\\s*:\\s*' + style[key] + '(\\s*!' + IMPORTANT + ')?\\s*;?' : '^';

            style.cssText = style.cssText.replace(new RegExp(rxText, 'i'), newValue);
          }
        }
      }
      else 
        setStyleProperty(this.rule, property, value);
    },

   /**
    * @param {Object} style
    */
    setStyle: function(style){
      Object.iterate(style, this.setProperty, this);
    },

   /**
    * Removes all style properties
    */
    clear: function(){
      this.rule.style.cssText = "";
    },

   /**
    * @destructor
    */
    destroy: function(){
      delete this.rule;
    }
  });

 /**
  * @class
  */
  var CssRuleWrapperSet = Class(null, {
    className: namespace + '.CssRuleWrapperSet',

   /**
    * @type {Array.<CssRuleWrapper>}
    */
    rules: null,

   /**
    * @param {Array.<CssRuleWrapper>} rules
    * @constructor
    */
    init: function(rules){
      this.rules = rules;
    },
    destroy: function(){
      delete this.rules;
    }
  });

  ['setProperty', 'setStyle', 'clear'].forEach(function(method){
    CssRuleWrapperSet.prototype[method] = function(){
      for (var rule, i = 0; rule = this.rules[i]; i++)
        rule[method].apply(rule, arguments);
    }
  });

  var unitFunc = {};
  ['em', 'ex', 'px', '%'].forEach(function(unit){
    unitFunc[unit == '%' ? 'percent' : unit] = function(value){
      return value == 0 || isNaN(value) ? '0' : value + unit;
    }
  });

  //
  // classList
  //

 /**
  * @func
  */
  var classList;
  var tokenRxCache = {};

  function tokenRegExp(token){
    return tokenRxCache[token] || (tokenRxCache[token] = new RegExp('\\s*\\b' + token + '\\b'));
  }

 /**
  * @class
  */
  var ClassList = Class(null, {
    className: namespace + '.ClassList',

    init: function(element){ 
      ;;;if (!element) throw new Error(namespace + '.classList: Element ' + element + ' not found!');
      this.element = element;
      //this.tokens = this.element.className.qw();
    },
    toString: function(){
      return this.element.className;
    },

    set: function(tokenList){
      this.clear();
      tokenList.qw().forEach(this.add, this);
    },
    replace: function(searchFor, replaceFor, prefix){
      prefix = prefix || '';

      if (typeof searchFor != 'undefined')
        this.remove(prefix + searchFor);
      
      if (typeof replaceFor != 'undefined')
        this.add(prefix + replaceFor);
    },
    bool: function(token, exists){
      if (exists)
        this.add(token);
      else
        this.remove(token);
    },
    clear: function(){
      this.element.className = '';
    },

    contains: function(token){
      return !!this.element.className.match(tokenRegExp(token));
    },
    item: function(index){
      return this.element.className.qw()[index];
    },
    add: function(token){ 
      ;;;if (arguments.length > 1) console.warn('classList.add accept only one argument');
      if (!this.element.className.match(tokenRegExp(token)))
        this.element.className += ' ' + token;
    },
    remove: function(token){
      ;;;if (arguments.length > 1) console.warn('classList.remove accept only one argument');
      var className = this.element.className;
      var newClassName = className.replace(tokenRegExp(token), '');
      if (newClassName != className)
        this.element.className = newClassName;
    },
    toggle: function(token){
      var exists = this.contains(token);

      if (exists)
        this.remove(token);
      else
        this.add(token);

      return !exists;
    }
  });

  //
  // ClassListNS
  //

  var prefixRxCache = {};
  function prefixRegExp(prefix, global){
    var key = (global ? 'g' : 's') + prefix;
    return prefixRxCache[key] || (prefixRxCache[key] = new RegExp((global ? '' : '\\s*') + '\\b' + prefix + '\\S*\\b'));
  }

 /**
  * @class
  */
  var ClassListNS = Class(null, {
    className: namespace + '.ClassListNS',
    delim: '-',

    init: function(ns, classList){
      this.classList = classList;
      this.prefix = ns + this.delim;
    },

    add: function(value){
      this.classList.add(this.prefix + value);
    },
    remove: function(value){
      this.classList.remove(this.prefix + value);
    },
    items: function(){
      var classList = this.classList.toString();
      if (classList)
        return classList.toString().match(prefixRegExp(this.prefix, true));
    },
    set: function(value){
      var items = this.items();
      var token = typeof value != 'undefined' ? this.prefix + value : '';
      var classList = this.classList;

      if (items)
      {
        if (items.length == 1)
        {
          if (items[0] === token)
            return;

          classList.remove(items[0]);
        }
        else
          this.clear();
      }

      if (token)
        classList.add(token);
    },
    clear: function(){
      this.items().forEach(this.classList.remove, this.classList);
    }
  });

  //
  // Make crossbrowser classList
  //
  if (global.DOMTokenList && document.documentElement.classList)
  {
    var proto = ClassList.prototype;
    Object.extend(global.DOMTokenList.prototype, {
      set: proto.set,
      replace: proto.replace,
      bool: proto.bool,
      clear: function(){
        for (var i = this.length; i --> 0;)
          this.remove(this[i]);
      },
      setPrefixToken: proto.setPrefixToken
    });
    classList = function(element){
      return (typeof element == 'string' ? dom.get(element) : element).classList;
    }
  }
  else
  {
    classList = function(element){ 
      return new ClassList(typeof element == 'string' ? dom.get(element) : element);
    }
  }

  var classListProxy = function(element, ns){
    return ns
      ? new ClassListNS(ns, classList(element))
      : classList(element);
  }

  //
  // platform specific actions
  //

  event.onLoad(function(){
    classList(document.body).bool('opacity-not-support', !basis.platformFeature['css-opacity']);
  });

  // export names

  dom.extend({
    // style interface
    setStyleProperty: setStyleProperty,
    setStyle: setStyle,

    // node styling
    display: display,
    show: show,
    hide: hide,
    visibility: visibility,
    visible: visible,
    invisible: invisible
  });

  return basis.namespace(namespace).extend({
    // style interface
    setStyleProperty: setStyleProperty,
    setStyle: setStyle,
    classList: classListProxy,

    // rule and stylesheet interfaces
    uniqueRule: uniqueRule,
    cssRule: cssRule,
    getStyleSheet: getStyleSheet,
    addStyleSheet: addStyleSheet,

    // classes
    CssStyleSheetWrapper: CssStyleSheetWrapper,
    CssRuleWrapper: CssRuleWrapper,
    CssRuleWrapperSet: CssRuleWrapperSet
  }).extend(unitFunc);

}(basis, this);
