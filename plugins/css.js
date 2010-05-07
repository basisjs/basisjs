/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    // namespace

    var namespace = 'Basis.CSS.Selector';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Data = Basis.Data;
    var extend = Object.extend;

    //
    // Main part
    //

    /* -------------------------------------------------------------------------- */

    var ParseError = extend(new Error(), {
      name: 'Parse error',
      message: 'Parse error'
    });
    var UnknownPartError = extend(new Error(), {
      name: 'Unknown selector part error',
      message: 'Unknown selector part error'
    });

    /* -------------------------------------------------------------------------- */

    var ELEMENT_NODE = DOM.ELEMENT_NODE;

    function findPrev(node, deep){
      while (node = node.previousSibling)
        if (node.nodeType == ELEMENT_NODE)
          return node;
    };

    function findPrevTagName(node, tagName, deep){
      if (tagName == '*')
        return findPrev(node);

      while (node = node.previousSibling)
      {
        if (node.nodeType == ELEMENT_NODE)
          if (node.tagName == tagName)
            return node;
          else if (!--deep)
            return;
      }
    };

    function findNext(node){
      while (node = node.nextSibling)
        if (node.nodeType == ELEMENT_NODE)
          return node;
    };

    function findNextTagName(node, tagName, deep){
      if (tagName == '*')
        return findNext(node);

      while (node = node.nextSibling)
      {
        if (node.nodeType == ELEMENT_NODE)
          if (node.tagName == tagName)
            return node;
          else if (!--deep)
            return;
      }
    };

    function findParent(node){
      return node.parentNode;
    };

    function findParentTagName(node, tagName, deep, root){
      if (tagName == '*')
        return node.parentNode;

      while ((node = node.parentNode) != root)
      {
        if (node.tagName == tagName)
          return node;
        else if (!--deep)
          return;
      }
    };

    function testXML(){
      var res = document.evaluate("//*", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var result = new Array(res.snapshotLength);
      for (var i = res.snapshotLength - 1; i >= 0; i--)
        result[i] = res.snapshotItem(i);
      return result;
    }

    function createDOMSnapshot(root, useTagName, useClassName){
      var root = root || document;
      var tmp  = (root.all || root.getElementsByTagName('*'));
      useTagName = 1;
      useClassName = 0;

//      alert(document.body.all);
//      var result = new Array();
//      for (var node, i = 0; node = tmp[i]; i++)
//        result[i] = node;

      var parent;
      var snapshot = { 
        id:         -1,
        index:      0,
        element:    document,
        parentNode: null,
        previousSibling: null,
        lastChild:  null,
//        childNodes: [],
        lastIndex:  0,
        tags:       { '*': [] },
        all:        []
      };
      var cursor = snapshot;
      var prevCursor = snapshot;
      var lastNode = document;
      var lastNodeParent;
      var tagName, tags;
      var id = 0;
      for (var node, i = 0; node = tmp[i]; i++)
        if (node.nodeType == ELEMENT_NODE)
        {
          parent = node.parentNode;
          if (lastNodeParent != parent)
            if (lastNode == parent)
              cursor = prevCursor;
            else
            {
              while (cursor.element != parent)
                cursor = cursor.parentNode;
            }

          prevCursor = {
            id:         id,
            index:      cursor.lastIndex++,
            element:    node,
            parentNode: cursor,
            previousSibling: cursor.lastChild,
            lastChild:  null,
            lastIndex:  0
          };

          if (useClassName && (prevCursor.className = node.className) != '')
            prevCursor.className = ' ' + prevCursor.className + ' ';

          if (useTagName)
          {
            tagName = prevCursor.tagName = node.tagName;

            tags = snapshot.tags[tagName];
            if (!tags)
              tags = snapshot.tags[tagName] = new Array();
            tags.push(id);
            snapshot.all.push(prevCursor);
          }

          lastNode = node;
          lastNodeParent = parent;

          if (!cursor.firstChild)
            cursor.firstChild = prevCursor;

          cursor.lastChild   = prevCursor;

          id++;
        }
      return snapshot;
    };

    /* -------------------------------------------------------------------------- */

    var COMBINATOR = {
      // stub combinator
      '*': Function.$self,

      // descendant combinator
      ' ': function(node, root){
        return findParentTagName(node, this.tagName, 0, root);
      },

      // root combinator
      '^': function(node, root){
        return findParent(node) == root && node;
      },

      // child combinator
      '>': function(node, root){
        return findParentTagName(node, this.tagName, 1, root);
      },

      // general sibling combinator
      '~': function(node){
        return findPrevTagName(node, this.tagName, 0);
      },

      // adjacent sibling combinator
      '+': function(node){
        return findPrevTagName(node, this.tagName, 1);
      }
    };

    var Combinator = Class.create(null, {
      className: namespace + '.Combinator',

      tagName:        '*',
      isWide:         false,
      combinatorName: '*',
      combinator:     Function.$false,

      init: function(combinator, tagName){

        if (typeof combinator == 'function')
          this.check = combinator;
        else if (COMBINATOR[combinator])
        {
          this.check = COMBINATOR[combinator];
          this.combinatorName = combinator;
        }

        this.tagName = tagName || '*'; 
        this.isWide = [' ', '~'].has(this.combinatorName);
      },

      toString: function(){ 
        return this.combinatorName == ' ' ? this.combinatorName : ' ' + this.combinatorName + ' ';
      }
    });

    /* -------------------------------------------------------------------------- */

    var SimpleSelectorChecker = {
      // type, id & className
      tagName:  function(tagName){
        return {
          weight: 0,
          testDOM: "node.tagName == '" + tagName + "'",
          testSnapshot: "node.tagName == '" + tagName + "'",
          checkTagName: tagName
        };
      },
      id: function(id){
        return {
          weight: 0,
          testDOM: "node.id == '" + id + "'",
          checkId: id
        };
      },
      className: function(className){
        return {
          weight: 3,
          testDOM: "className.indexOf(' " + className + " ') != -1",
          testSnapshot: "node.className.indexOf(' " + className + " ') != -1",
          checkClassName: true
        };
      },

      // attribute
      attribute: function(name, operator, value){
        var checkClassName = false;
        var checker;

        if (name == 'class')
          name = 'className';
        else
          if (name == 'for')
            name = 'htmlFor';
        switch (operator){
          case '=': 
            if (name == 'id')
              return SimpleSelectorChecker.id.call(this, value);

            checker = 'attrValue == {val}';
          break;
          case '!=': checker = 'attrValue != {val}'; break;
          case '^=': checker = 'attrValue.substr(0, {len}) == {val}'; break;
          case '$=': checker = 'attrValue.substr(-{len}) == {val}'; break;
          case '~=':
            if (name == 'className')
              return SimpleSelectorChecker.className.call(this, value);

            checker = '(" " + attrValue + " ").indexOf(" " + {val} + " ") != -1'; 
          break;
          case '*=': checker = 'attrValue.indexOf({val}) != -1'; break;
          case '|=': checker = 'attrValue == {val} || attrValue.substr(0, {len} + 1) == {val} + "-"'; break;
          default:
            // nothing to do
        };
        return {
          weight: 5,
          testDOM: '(attrValue = node.' + name + ') != ""' + (checker ? ' && (' + checker.format({ val: value.quote(), len: (value || '').length }) + ')' : ''),
          checkClassName: checkClassName
        }
      },

      // pseudo-classes
      ':disabled':         { weight: 4, testDOM: "node.disabled" },
      ':enabled':          { weight: 4, testDOM: "node.disabled == false" },
      ':indeterminate':    { weight: 4, testDOM: "node.indeterminate" },
      ':checked':          { weight: 4, testDOM: "node.checked" },
      ':selected':         { weight: 4, testDOM: "node.selected" },
      ':target':           { weight: 4, testDOM: "(location.hash && (node.id == location.hash.slice(1) || (node.tagName == 'A' && node.name == location.hash.slice(1))))" },

      ':root':             { weight: 6, testDOM: "!findParent(node)", testSnapshot: "!node.parentNode" },
      ':first-child':      { weight: 6, testDOM: "!findPrev(node)", testSnapshot: "!node.previousSibling" },
      ':first-of-type':    { weight: 6, testDOM: "!findPrevTagName(node, node.tagName)" },
      ':last-child':       { weight: 6, testDOM: "!findNext(node)", testSnapshot: "node == node.parentNode.lastChild" },
      ':last-of-type':     { weight: 6, testDOM: "!findNextTagName(node, node.tagName)" },
      ':empty':            { weight: 6, testDOM: "!node.firstChild", testSnapshot: "!node.firstChild" },
      ':only-child':       { weight: 6, testDOM: "(!findPrev(node) && !findNext(node))", testSnapshot: "node.parentNode.firstChild == node.parentNode.lastChild" },
      ':only-of-type':     { weight: 6, testDOM: "(!findPrevTagName(node, node.tagName) && !findNextTagName(node, node.tagName))" },

      // nth- functions
      ':nth-child':        function(condition) { return { weight: 7, checkPosition: true, testDOM: "((DOM.index(node) + 1)" + condition, testSnapshot: "((node.index + 1)" + condition } },
      ':nth-last-child':   function(condition) { return { weight: 7, checkPosition: true, testDOM: "((DOM.lastIndex(node) + 1)" + condition, testSnapshot: "((node.parentNode.lastIndex - node.index + 1)" + condition } },
      ':nth-of-type':      function(condition) { return { weight: 7, checkPosition: true, testDOM: "((DOM.index(node, node.tagName) + 1)" + condition } },
      ':nth-last-of-type': function(condition) { return { weight: 7, checkPosition: true, testDOM: "((DOM.lastIndex(node, node.tagName) + 1)" + condition } },

      // functions
      ':contains': function(text){
        return {
          weight: 8,
          testDOM: '(node.textContent || node.innerText || "").indexOf(' + text.quote() + ') != -1',
          testSnapshot: '(node.element.textContent || node.element.innerText || "").indexOf(' + text.quote() + ') != -1'
        }
      },
      ':not': function(selectorText){ 
        var sel = parse(selectorText);
        return {
          weight: 9, 
          testDOM: "!parse(" + sel.text.quote("'") + ").check(node)",
          testSnapshot: "!parse(" + sel.text.quote("'") + ").check(node.element)"
        }
      }
    };

    /* -------------------------------------------------------------------------- */

    var AbstractSelector = Class.create(null, {
      className: namespace + '.AbstractSelector',

      isValid: true,
      error: '',
      text: '',

      init: function(){
      },
      toString: function(){
        return this.text;
      },
      check: Function.$false,
      nodes: function(){
        return [];
      }
    });

    var SimpleSelector = Class.create(AbstractSelector, {
      className: namespace + '.SimpleSelector',

      nodes: function(element, snapshot){
        if (this.isValid)
        {
          var result;
          if (this.checkId != undefined)
          {
            var node = DOM.get(this.checkId);  // if element check for node is element parent
            return this.check(node) ? [node] : [];
          }
          else
          {
            var snapshot, nodes;
            if (this.checkPosition)
            {
              if (!snapshot)
                snapshot = createDOMSnapshot(element, true, true);

              if (this.checkTagName)
                nodes = snapshot.tags[this.checkTagName].map(function(id){ return this.all[id] }, snapshot);
              else
                nodes = snapshot.all;
              return nodes.filter(this.checkSnapshot);
            }
            else
            {
              //element = element || document;
              /*if (this.checkClassName && element.getElementsByClassName)
              {
                console.log(this.checkTagName, this.checkClassName, this.check.toString());
                m = this.check.toString().match(/className\.indexOf\(["']\s([^'"]+)\s["']\)/);
                ar = element.getElementsByClassName(m[1]);
              }
              else*/
                result = DOM.tag(element, this.checkTagName);
              //result = [];
              //return result.filter(this.check);
              if (!this.simpleCheck)
              {
                for (var i = 0, k = 0, node; node = result[i]; i++)
                  if (this.check(node))
                    result[k++] = node;
                result.length = k;
              }
              return result;
            }
          }
        }
        else
          return [];        
      }
    });

    var Selector = Class.create(AbstractSelector, {
      className: namespace + '.Selector',

      init: function(){
        this.sequence = null;
      },
      check: function(node, root, skipFirst){
        var cursor = this.sequence;

        if (skipFirst)
          cursor = cursor.next;

        while (cursor && node) 
        {
          if (node = cursor.checker.check(node, root))
          {
            if (cursor.isCombinator)
              cursor.__node = node;

            cursor = cursor.next;

            if (!cursor)
              break;

            if (cursor.checker.simpleCheck)
              cursor = cursor.next;
          }
          else 
            if (cursor.back)
            {
              cursor = cursor.back;
              node   = cursor.__node;
            }
        }

        return !cursor;
      },
      checkSnapshot: function(snapshot){
        var cursor = this.sequence;

        if (skipFirst)
          cursor = cursor.next;

        while (cursor && node) 
        {
          if (node = (cursor.checker.checkSnapshot || cursor.checker.check)(node, root))
          {
            if (cursor.checker instanceof Combinator) cursor.__node = node;
            cursor = cursor.next;
          }
          else 
            if (cursor.back)
            {
              node   = cursor.back.__node;
              cursor = cursor.back;
            }
        }

        return cursor == null;
      },
      nodes: function(element){
        if (this.isValid)
        {
          var result = new Array();
          if (this.sequence)
          {
            var snapshot;
/*            if (this.checkPosition)
            {
              snapshot = createDOMSnapshot(element);
              return result;
            }*/

            element = DOM.get(element) || document;
        
            var nodes = this.sequence.checker.nodes(element);
  //          return nodes;

            for (var i = 0; i < nodes.length; i++)
            {
              var node = nodes[i];
              if (this.check(node, element, true))
                result.push(node);
            }
          }

          return result;
        }
        else
          return [];
      }
    });

    var SelectorGroup = Class.create(AbstractSelector, {
      className: namespace + '.SelectorGroup',

      init: function(){
        this.selectors = [];
      },
      nodes: function(element){
        if (this.isValid)
        {
          var result = [], nodes, tags = [];
          for (var i = 0; i < this.selectors.length; i++)
            tags.push(this.selectors[i].checkTagName || '*');

          if (tags.indexOf('*') != -1)
            nodes = DOM.tag('*');
          else
          {
            tags = tags.unique();
            nodes = [];
            for (var i = 0; i < tags.length; i++)
              nodes.push.apply(nodes, DOM.tag(element, tags[i]));
          }

          for (var i = 0, node; node = nodes[i]; i++)
            for (var s = 0, sel; sel = this.selectors[s]; s++)
              if (sel.simpleCheck || sel.check(node))
              {
                result.push(node);
                break;
              }
          return result;
        }
        else
          return [];        
      }
    });

    /* -------------------------------------------------------------------------- */

    var PartRegExp = /\s*([\s\>\+\~\,])\s*|(\*|[a-z][a-z0-9]*)|([\#\.][\-\w]+)|(:[\-\w]+)(\(?)|(\[)|(.)/gi;
                     /*
                        1 combinator || group
                        2 tagName
                        3 #id || .className
                        4 pseudo
                        5 brackets start '('
                        6 attribute start '['
                        7 garbage
                     */
    var NthRegExp   = /^\s*((\d*)n\s*)?(([\+\-])\s*(\d+)\s*)?$|^\s*([\+\-])\s*(\d+)\s*$/i;
    var AttrRegExp  = /^\s*([\-\w]+)\s*(([\!\~\*\^\$\|]?=)\s*([\'\"]?)(.*)\4\s*)?$/i;

    var ParseCache  = {};

    var EXTRACT_CLASS_NAME = { testDOM: '(className = " " + node.className + " ") != "  "', testSnapshot: 'true', weight: 2};
    var EXTRACT_NODE       = { testDOM: 'node', testSnapshot: 'node.element',weight: 1000 };

    function compileSimpleSelector(config){
      var selector = new SimpleSelector();

      selector.checkId        = config.checkId;
      selector.checkClassName = config.checkClassName;
      selector.checkTagName   = config.checkTagName;
      selector.checkPosition  = config.checkPosition;

      selector.simpleCheck    = config.checkTagName && config.length == 1;

      selector.text  = config.text || '*';

      config.push(EXTRACT_NODE);
      if (config.checkClassName)
        config.push(EXTRACT_CLASS_NAME);

      config = config.sortAsObject(Data.getter('weight', Number));
      selector.check = eval('0,function(node){var className, attrValue; return ' + config.map(Data.getter('testDOM')).join(' && ') + '}');
      selector.checkSnapshot = eval('0,function(node){ var className, attrValue; return ' + config.map(Data.getter('testSnapshot')).join(' && ') + '}');
//console.log(selector.text);
//console.log(selector.check.toString());
//console.log(selector.checkSnapshot.toString());

//      console.log(selector.text + '\n' +  selector.check);

      return selector;
    };

    function compileSelector(config){
      if (config.length == 1)
        return config[0];

      var selector = new Selector();
      for (var i = 0, part; part = config[i]; i++)
      {
        selector.sequence = {
          checker: part,
          next:    selector.sequence,
          isCombinator: part instanceof Combinator
        };
        selector.checkPosition |= part.checkPosition;
      }
      selector.text = config.join('');

      var point = null;
      var s = selector.sequence;
        while (s = s.next)
        {
          s.back = point;

          if (s.checker instanceof Combinator)
          {
            if (s.next)
              s.checker.tagName = s.next.checker.checkTagName || '*';
            if (s.checker.isWide)
              point = s;
          }
        }

      return selector;
    };

    function compileSelectorGroup(config){
      //config = config.unique();
      var tmp = {};
      for (var i = 0; i < config.length; i++)
        tmp[config[i].toString()] = config[i];
      var k = 0;
      for (var key in tmp)
        config[k++] = tmp[key];
      config.length = k;

      if (config.length == 1)
        return config[0];

      var selector = new SelectorGroup();
      for (var i = 0; i < config.length; i++)
        selector.selectors.push(config[i]);

      return selector;
    };

    function parse(selectorText){
      selectorText = selectorText.trim();
      if (ParseCache[selectorText])
        return ParseCache[selectorText];

      // ------------------

      var START      = 0x01;
      var COMBINATOR = 0x02;
      var SELECTOR   = 0x04;

      var group = [];
      var selector = [];
      var simpleSelector = [];
      var context = START;

      function findPair(str, start, sym){
        var len = str.length;
        var stack = [sym];
        var ignoreAll = sym == '"' || sym == '\'';
        var ignoreBrackets = ignoreAll || sym == ']';
        for (var i = start; i < len; i++)
        {
          var c = str.charAt(i);
          if (c == sym)
          {
            stack.pop();
            if (!stack.length)
              return i;
            sym = stack[stack.length - 1];
            ignoreAll = sym == '"' || sym == '\'';
            ignoreBrackets = ignoreAll || sym == ']';
            continue;
          }

          if (c == '\\')
            i++;  // ignore next symbol
          else if (!ignoreAll)
          {
            if (!ignoreBrackets && c == '(')
              stack.push(sym = ')');
            else if (c == '[')
              stack.push(sym = ']');
            else if (c == '"')
              stack.push(sym = c);
            else if (c == '\'')
              stack.push(sym = c);
            ignoreAll = sym == '"' || sym == '\'';
            ignoreBrackets = ignoreAll || sym == ']';
          }
        }
        return -1;
      };

      try 
      {
        function add(name, text){
          var checker = SimpleSelectorChecker[name];

          if (!checker)
            throw UnknownPartError;

          simpleSelector.text = (simpleSelector.text || '') + text;

          if (typeof checker == 'function')
            checker = checker.apply(this, Array.from(arguments, 2));

          checker = extend({}, checker);
          if (!checker.testSnapshot)
            checker.testSnapshot = checker.testDOM.replace(/node\./g, 'node.element.');

          simpleSelector.checkId        = (simpleSelector.checkId || false)      || checker.checkId;
          simpleSelector.checkTagName   = (simpleSelector.checkTagName || false) || checker.checkTagName;
          simpleSelector.checkClassName |= checker.checkClassName;
          simpleSelector.checkPosition  |= checker.checkPosition;

          simpleSelector.push(checker);
        };

        PartRegExp.lastIndex = 0;
        while (m = PartRegExp.exec(selectorText))
        {
          pos = PartRegExp.lastIndex;

          // save match string
          var matchText = m[0];

          // combinator found
          var combinator = m[1];
          if (combinator)
          {
            if (context & (START | COMBINATOR))  // combinator or group found at start, or after combinator
              throw ParseError;

            selector.push(compileSimpleSelector(simpleSelector));
            simpleSelector = [];

            if (combinator == ',')
            {
              group.push(compileSelector(selector));
              selector = [];
              context = START;
            }
            else
            {
              selector.push(new Combinator(combinator, simpleSelector.tagName));
              context = COMBINATOR;
            }
            continue;
          }

          // something else (garbage)
          if (m[7])
            throw ParseError;

          // match a selector part
          var tagName   = m[2];
          var classOrId = m[3];
          var pseudo    = m[4];
          var params    = m[5];
          var attribute = m[6];

          if (tagName)
          {
            if (context == SELECTOR)  // tagName must be first
              throw ParseError;

            if (tagName != '*')
            {
              tagName = tagName.toUpperCase();
              add('tagName', tagName, tagName);
            }
          }
          else if (classOrId)
            add(classOrId.charAt(0) == '#' ? 'id' : 'className', classOrId, classOrId.substr(1));
          else
            if (pseudo)
            {
              if (params != '(')
                add(pseudo, pseudo);
              else
              {
                // get params
                var e = findPair(selectorText, pos, ')');
                if (e == -1)
                  throw ParseError;

                params = selectorText.substring(pos, e);

                if (pseudo.substr(0, 5) != ':nth-')
                  add(pseudo, pseudo + '(' + params + ')', params);
                else
                {
                  var nthCondition;

                  var a, b;

                  switch (params)
                  {
                    case 'even': a = 2; b = 0; break;
                    case 'odd':  a = 2; b = 1; break;
                    default:
                      if (m = params.match(NthRegExp))
                      {
                        a = Number(m[2] || 1)
                        b = Number(m[5] || m[7] || 0) * (m[4] == '-' || m[6] == '-' ? -1 : 1)
                      }
                      else
                      {
                        matchText = '';
                        throw ParseError;
                      }

                  }

                  if (a > 1)
                    nthCondition = ' % ' + a + ') == ' + ((a + b) % a);
                  else 
                    if (b > 0) 
                      nthCondition = ' <= ' + b + ')';

                  if (nthCondition)
                    add(pseudo, pseudo + '(' + 
                                         (a ? a + 'n' : '') +       // aN
                                         (a && b > 0 ? '+' : '') +  // +?
                                         (b || '') +                // b
                                         ')', nthCondition);
                }
                pos = e + 1;
              }
            }
            else
              if (attribute == '[')
              {
                var e = findPair(selectorText, pos, ']');
                if (e == -1)
                  throw ParseError;

                attribute = selectorText.substring(pos, e);

                if (m = attribute.match(AttrRegExp)) 
                  add('attribute', '[' + attribute + ']', m[1], m[3], m[5]);
                else
                  throw ParseError;

                pos = e + 1;
              }
              else
                throw ParseError;

          context = SELECTOR;

          PartRegExp.lastIndex = pos;
        }

        if (context & (COMBINATOR | START))
          throw ParseError;

        selector.push(compileSimpleSelector(simpleSelector));
        group.push(compileSelector(selector));
      } catch(e) {
        if (e == ParseError || e == UnknownPartError)
        {
          var line = '';
          for (var i = pos - matchText.length - 1; i >= 0; i--) 
            line += '-';

          throw new Error('Selector:\n    ' + selectorText + '\n    ' + line + '^\n\nError message:\n    ' + (e.message || e));
        }
        else
          throw e;
      }
//      throw new Error(res);
      return ParseCache[selectorText] = compileSelectorGroup(group);
//      console.log({ res: ParseCache[selectorText] = compileSelectorGroup(group) });
    };

    function query(selectorText, element){
      return parse(selectorText).nodes(element);
    };

    //
    // export names
    //

    DOM.query = query;

    Basis.namespace(namespace).extend({
      query: query
    });

  })();
