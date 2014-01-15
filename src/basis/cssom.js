
  basis.require('basis.dom');


 /**
  * @namespace basis.cssom
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var location = global.location;
  var path = basis.path;
  var arrayFrom = basis.array.from;
  var camelize = basis.string.camelize;
  var Class = basis.Class;
  var cleaner = basis.cleaner;
  var dom = basis.dom;
  var DOMTokenList = global.DOMTokenList;


  //
  // main part
  //

  var CLASSLIST_SUPPORTED = DOMTokenList && document && document.documentElement.classList instanceof DOMTokenList;
  var IMPORTANT_REGEXP = /\s*!important/i;
  var IMPORTANT = 'important';
  var GENERIC_RULE_SEED = 1;
  var cssStyleSheets = {};

  var SET_STYLE_EXCEPTION_BUG = (function(){
    var element = dom.createElement();
    try {
      element.style.width = 'badvalue';
    } catch(e){
      return true;
    }
    return false;
  })();


  //
  // shortcut
  //

  function createRule(selector, styleSheet){
    return getStyleSheet(styleSheet, true).createRule(selector);
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

    var result = createRule('.' + token);
    result.token = token;

    return result;
  }

  //
  // working with stylesheets
  //

  function compatibleStyleSheetInsertRule(rule, index){
    // fetch selector and style from rule description
    var m = rule.match(/^([^{]+)\{(.*)\}\s*$/);
    if (m)
    {
      var selectors = m[1].trim().split(/\s*,\s*/);
      for (var i = 0; i < selectors.length; i++)
        this.addRule(selectors[i], m[2] || null, index++);
      return index - 1;
    }

    ;;;throw new Error('Syntax error in CSS rule to be added');
  }

  function makeStyleSheetCompatible(style){
    // FF throws exception if access to cssRules property until stylesheet isn't ready (loaded)
    try {
      if (!style.cssRules)
        style.cssRules = style.rules;
    } catch(e){
    }

    // extend style sheet with methods according to W3C spec
    if (!style.insertRule)
      style.insertRule = compatibleStyleSheetInsertRule;

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
    var element = dom.createElement(!url ? 'style[type="text/css"]' : basis.string.format('link[type="text/css"][rel="{alt}stylesheet"][href="{url}"]', {
      alt: title ? 'alternate ' : '',
      url: url.replace(/\"/g, '\\"')
    }));

    basis.doc.head.add(element);

    return makeStyleSheetCompatible(element.sheet || element.styleSheet);
  }

 /**
  * Returns generic stylesheet by it's id.
  * @param {string=} id
  * @param {boolean=} createIfNotExists
  * @return {basis.cssom.StyleSheet}
  */
  function getStyleSheet(id, createIfNotExists){
    if (!id)
      id = 'DefaultGenericStyleSheet';

    if (!cssStyleSheets[id])
      if (createIfNotExists)
        cssStyleSheets[id] = new StyleSheet(addStyleSheet());

    return cssStyleSheets[id];
  }

  //
  // Style mapping
  //

  var styleMapping = {};
  var testElement = dom.createElement('');

  function createStyleMapping(property, names, regSupport, getters){
    getters = getters || {};
    names = names.split(' ');

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
  }

  createStyleMapping('opacity', 'opacity filter', true, {
    filter: function(value){
      return 'alpha(opacity:' + parseInt(value * 100, 10) + ')';
    }
  });
  createStyleMapping('float', 'cssFloat styleFloat');

 /**
  * Apply new style property values for node.
  * @param {string} key Node which style to be changed.
  * @param {*} value Object contains new values for node style properties.
  * @return {object}
  */
  function getStylePropertyMapping(key, value){
    var mapping = styleMapping[key];

    if (key = mapping ? mapping.key : camelize(key.replace(/^-ms-/, 'ms-')))
      return {
        key: key,
        value: mapping && mapping.getter ? mapping.getter(value) : value
      };

    return null;
  }

 /**
  * Apply new style property value for node.
  * @param {Element} node Node which style to be changed.
  * @param {string} property Name of property.
  * @param {string} value Value of property.
  * @return {*} Returns style property value after assignment.
  */
  function setStyleProperty(node, property, value){
    var mapping = getStylePropertyMapping(property, value);

    if (!mapping)
      return;

    var key = mapping.key;
    var imp = !!IMPORTANT_REGEXP.test(value);
    var style = node.style;

    if (imp || isPropertyImportant(style, property))
    {
      mapping.value = mapping.value.replace(IMPORTANT_REGEXP, '');

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

        try {
          style.cssText = style.cssText.replace(new RegExp(rxText, 'i'), newValue);
        } catch(e) {
          ;;;basis.dev.warn('basis.cssom.setStyleProperty: Can\'t set wrong value `' + mapping.value + '` for ' + mapping.key + ' property');
        }
      }
    }
    else
    {
      if (SET_STYLE_EXCEPTION_BUG)
      {
        // IE6-8 throw exception when assign wrong value to style, but standart
        // says just ignore this assignments
        // try/catch is speedless, therefore wrap this statement only for ie
        // it makes code safe and more compatible
        try {
          node.style[mapping.key] = mapping.value;
        } catch(e) {
          ;;;basis.dev.warn('basis.cssom.setStyleProperty: Can\'t set wrong value `' + mapping.value + '` for ' + mapping.key + ' property');
        }
      }
      else
        node.style[mapping.key] = mapping.value;

      return node.style[mapping.key];
    }
  }

 /**
  * Apply new style properties for node.
  * @param {Element} node Node which style to be changed.
  * @param {object} style Object contains new values for node style properties.
  * @return {Element}
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
  * @param {Element} node
  * @param {boolean|string=} display
  * @return {*}
  */
  function display(node, display){
    return setStyleProperty(node, 'display', typeof display == 'string' ? display : (display ? '' : 'none'));
  }

 /**
  * Changes node visibility.
  * @param {Element} node
  * @param {boolean=} visible
  * @return {*}
  */
  function visibility(node, visible){
    return setStyleProperty(node, 'visibility', visible ? '' : 'hidden');
  }


  //
  // classes
  //

 /**
  * @class
  */
  var StyleSheet = Class(null, {
    className: namespace + '.StyleSheet',

   /**
    * Wrapped stylesheet
    * @type {StyleSheet}
    */
    styleSheet: null,

   /**
    * @type {Array.<Rule|RuleSet>}
    */
    rules: null,

   /**
    * @param {StyleSheet} styleSheet
    * @constructor
    */
    init: function(styleSheet){
      this.styleSheet = styleSheet;
      this.rules = [];
    },

   /**
    * @param {string} selector
    * @return {Rule|RuleSet}
    */
    createRule: function(selector){
      var styleSheet = this.styleSheet;
      var index = this.rules.length;

      styleSheet.insertRule(selector + '{}', index);

      var cssRules = arrayFrom(styleSheet.cssRules, index);
      var ruleWrapper = cssRules[1]
        ? new RuleSet(cssRules, this)
        : new Rule(cssRules[0], this);

      this.rules.push.apply(this.rules, ruleWrapper.rules || [ruleWrapper]);

      return ruleWrapper;
    },

   /**
    * @param {Rule|RuleSet} rule
    */
    deleteRule: function(rule){
      if (rule instanceof RuleSet)
        rule.rules.forEach(this.deleteRule, this);
      else
      {
        var ruleIndex = this.rules.indexOf(rule);
        if (ruleIndex != -1)
        {
          this.rules.splice(ruleIndex, 1);
          this.styleSheet.deleteRule(ruleIndex);
        }
      }

      rule.owner = null;
      rule.destroy();
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.rules.forEach(function(item){
        item.destroy();
      });

      this.styleSheet = null;
      this.rules = null;
    }
  });

 /**
  * @class
  */
  var Rule = Class(null, {
    className: namespace + '.Rule',

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
    * @constructor
    */
    init: function(rule, owner){
      this.owner = owner;
      this.rule = rule;
      this.selector = rule.selectorText;
    },

   /**
    * @param {string} property
    * @param {string} value
    */
    setProperty: function(property, value){
      setStyleProperty(this.rule, property, value);
    },

   /**
    * @param {object} style
    */
    setStyle: function(style){
      basis.object.iterate(style, this.setProperty, this);
    },

   /**
    * Removes all style properties
    */
    clear: function(){
      this.rule.style.cssText = '';
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.owner)
        this.owner.deleteRule(this);

      this.owner = null;
      this.rule = null;
    }
  });


  //
  // RuleSet
  //

  function createRuleSetMethod(methodName){
    return function(){
      for (var i = 0, rule; rule = this.rules[i]; i++)
        rule[methodName].apply(rule, arguments);
    };
  }

 /**
  * @class
  */
  var RuleSet = Class(null, {
    className: namespace + '.RuleSet',

   /**
    * @type {Array.<Rule>}
    */
    rules: null,

   /**
    * @param {Array.<Rule>} rules
    * @constructor
    */
    init: function(rules, owner){
      this.owner = owner;
      this.rules = rules.map(function(rule){
        return new Rule(rule, this);
      }, this);
    },

    createRule: function(selector){
      var rule = this.owner.createRule(selector);
      this.rules.push(rule);
      rule.owner = this;
      return rule;
    },

    deleteRule: function(rule){
      var ruleIndex = this.rules.indexOf(rule);
      if (ruleIndex != -1)
      {
        this.rules.splice(ruleIndex, 1);
        this.owner.deleteRule(rule);
      }
    },

    setProperty: createRuleSetMethod('setProperty'),
    setStyle: createRuleSetMethod('setStyle'),
    clear: createRuleSetMethod('clear'),

   /**
    */
    destroy: function(){
      if (this.owner)
        this.owner.deleteRule(this);

      this.owner = null;
      this.rules = null;
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
      if (!element)
        throw namespace + '.classList: Element ' + element + ' not found!';

      this.element = element;
    },

    set_: function(value){
      var className = this.element.className;
      if (typeof className == 'string')
        return this.element.className = value;
      else
        return className.baseVal = value;
    },
    toString: function(){
      var className = this.element.className;
      return typeof className == 'string' ? className : className.baseVal;
    },

    set: function(tokenList){
      this.clear();
      tokenList.trim().split(' ').forEach(this.add, this);
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
      this.set_('');
    },

    contains: function(token){
      return !!this.toString().match(tokenRegExp(token));
    },
    item: function(index){
      return this.toString().trim().split(' ')[index];
    },
    add: function(token){
      var className = this.toString();

      if (!className.match(tokenRegExp(token)))
        this.set_(className + ' ' + token);
    },
    remove: function(token){
      var className = this.toString();
      var newClassName = className.replace(tokenRegExp(token), '');

      if (newClassName != className)
        this.set_(newClassName);
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
      var className = this.classList.toString();
      return className
        ? className.match(prefixRegExp(this.prefix, true))
        : null;
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
  // Make cross-browser classList
  //
  if (CLASSLIST_SUPPORTED)
  {
    var proto = ClassList.prototype;
    basis.object.extend(DOMTokenList.prototype, {
      set: proto.set,
      replace: proto.replace,
      bool: proto.bool,
      clear: function(){
        for (var i = this.length; i > 0;)
          this.remove(this[--i]);
      },
      setPrefixToken: proto.setPrefixToken
    });
    classList = function(element){
      return (typeof element == 'string' ? dom.get(element) : element).classList;
    };
  }
  else
  {
    classList = function(element){
      return new ClassList(typeof element == 'string' ? dom.get(element) : element);
    };
  }

  var classListProxy = function(element, ns){
    return ns
      ? new ClassListNS(ns, classList(element))
      : classList(element);
  };


  //
  // misc
  //

  function createUnitFormatter(unit){
    return function(value){
      return value == 0 || isNaN(value) ? '0' : value + unit;
    };
  }

  //
  // export names
  //

  module.exports = {
    // style interface
    setStyleProperty: setStyleProperty,
    setStyle: setStyle,
    classList: classListProxy,

    // rule and stylesheet interfaces
    uniqueRule: uniqueRule,
    createRule: createRule,
    getStyleSheet: getStyleSheet,
    addStyleSheet: addStyleSheet,

    // classes
    StyleSheet: StyleSheet,
    Rule: Rule,
    RuleSet: RuleSet,

    // node styling
    display: display,
    visibility: visibility,

    // units
    em: createUnitFormatter('em'),
    ex: createUnitFormatter('ex'),
    px: createUnitFormatter('px'),
    percent: createUnitFormatter('%')
  };

