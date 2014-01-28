
  basis.require('basis.l10n');


 /**
  * @namespace basis.template
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var cleaner = basis.cleaner;
  var path = basis.path;
  var arraySearch = basis.array.search;
  var arrayAdd = basis.array.add;
  var arrayRemove = basis.array.remove;


  //
  // Main part
  //

  var templateList = [];
  var tmplFilesMap = {};

  var DECLARATION_VERSION = 2;

  // token types
  /** @const */ var TYPE_ELEMENT = 1;
  /** @const */ var TYPE_ATTRIBUTE = 2;
  /** @const */ var TYPE_ATTRIBUTE_CLASS = 4;
  /** @const */ var TYPE_ATTRIBUTE_STYLE = 5;
  /** @const */ var TYPE_ATTRIBUTE_EVENT = 6;
  /** @const */ var TYPE_TEXT = 3;
  /** @const */ var TYPE_COMMENT = 8;

  // references on fields in declaration
  /** @const */ var TOKEN_TYPE = 0;
  /** @const */ var TOKEN_BINDINGS = 1;
  /** @const */ var TOKEN_REFS = 2;

  /** @const */ var ATTR_NAME = 3;
  /** @const */ var ATTR_VALUE = 4;

  var ATTR_NAME_BY_TYPE = {
    4: 'class',
    5: 'style'
  };
  var ATTR_TYPE_BY_NAME = {
    'class': TYPE_ATTRIBUTE_CLASS,
    'style': TYPE_ATTRIBUTE_STYLE
  };

  /** @const */ var ELEMENT_NAME = 3;
  /** @const */ var ELEMENT_ATTRS = 4;
  /** @const */ var ELEMENT_CHILDS = 5;

  /** @const */ var TEXT_VALUE = 3;
  /** @const */ var COMMENT_VALUE = 3;

  // parsing variables
  var SYNTAX_ERROR = 'Invalid or unsupported syntax';

  // html parsing states
  var TEXT = /((?:.|[\r\n])*?)(\{(?:l10n:([a-zA-Z_][a-zA-Z0-9_\-]*(?:\.[a-zA-Z_][a-zA-Z0-9_\-]*)*(?:\.\{[a-zA-Z_][a-zA-Z0-9_\-]*\})?)\})?|<(\/|!--(\s*\{)?)?|$)/g;
  var TAG_NAME = /([a-z_][a-z0-9\-_]*)(:|\{|\s*(\/?>)?)/ig;
  var ATTRIBUTE_NAME_OR_END = /([a-z_][a-z0-9_\-]*)(:|\{|=|\s*)|(\/?>)/ig;
  var COMMENT = /(.|[\r\n])*?-->/g;
  var CLOSE_TAG = /([a-z_][a-z0-9_\-]*(?::[a-z_][a-z0-9_\-]*)?)>/ig;
  var REFERENCE = /([a-z_][a-z0-9_]*)(\||\}\s*)/ig;
  var ATTRIBUTE_VALUE = /"((?:(\\")|[^"])*?)"\s*/g;
  var BREAK_TAG_PARSE = /^/g;
  var TAG_IGNORE_CONTENT = {
    text: /((?:.|[\r\n])*?)(?:<\/b:text>|$)/g
  };

  var quoteUnescape = /\\"/g;


 /**
  * Parse html into tokens.
  * @param {string} source Source of template
  * @return {Array.<object>}
  */
  var tokenize = function(source){
    var result = [];
    var tagStack = [];
    var lastTag = { childs: result };
    var sourceText;
    var token;
    var bufferPos;
    var startPos;
    var parseTag = false;
    var textStateEndPos = 0;
    var textEndPos;

    var state = TEXT;
    var pos = 0;
    var m;

    source = source.trim();
    /** @cut */ result.warns = [];

    while (pos < source.length || state != TEXT)
    {
      state.lastIndex = pos;
      startPos = pos;

      m = state.exec(source);

      if (!m || m.index !== pos)
      {
        // treat broken comment reference as comment content
        if (state == REFERENCE && token && token.type == TYPE_COMMENT)
        {
          state = COMMENT;
          continue;
        }

        if (parseTag)
          lastTag = tagStack.pop();

        if (token)
          lastTag.childs.pop();

        if (token = lastTag.childs.pop())
        {
          if (token.type == TYPE_TEXT && !token.refs)
            textStateEndPos -= 'len' in token ? token.len : token.value.length;
          else
            lastTag.childs.push(token);
        }

        parseTag = false;
        state = TEXT;
        continue;
      }

      pos = state.lastIndex;

      //stat[state] = (stat[state] || 0) + 1;
      switch (state)
      {
        case TEXT:

          textEndPos = startPos + m[1].length;

          if (textStateEndPos != textEndPos)
          {
            sourceText = textStateEndPos == startPos
              ? m[1]
              : source.substring(textStateEndPos, textEndPos);

            token = sourceText.replace(/\s*(\r\n?|\n\r?)\s*/g, '');

            if (token)
              lastTag.childs.push({
                type: TYPE_TEXT,
                len: sourceText.length,
                value: token
              });
          }

          textStateEndPos = textEndPos;

          if (m[3])
          {
            lastTag.childs.push({
              type: TYPE_TEXT,
              refs: ['l10n:' + m[3]],
              value: '{l10n:' + m[3] + '}'
            });
          }
          else if (m[2] == '{')
          {
            bufferPos = pos - 1;
            lastTag.childs.push(token = {
              type: TYPE_TEXT
            });
            state = REFERENCE;
          }
          else if (m[4])
          {
            if (m[4] == '/')
            {
              token = null;
              state = CLOSE_TAG;
            }
            else //if (m[3] == '!--')
            {
              lastTag.childs.push(token = {
                type: TYPE_COMMENT
              });

              if (m[5])
              {
                bufferPos = pos - m[5].length;
                state = REFERENCE;
              }
              else
              {
                bufferPos = pos;
                state = COMMENT;
              }
            }
          }
          else if (m[2]) // m[2] == '<' open tag
          {
            parseTag = true;
            tagStack.push(lastTag);

            lastTag.childs.push(token = {
              type: TYPE_ELEMENT,
              attrs: [],
              childs: []
            });
            lastTag = token;

            state = TAG_NAME;
          }

          break;

        case CLOSE_TAG:
          if (m[1] !== (lastTag.prefix ? lastTag.prefix + ':' : '') + lastTag.name)
          {
            //throw 'Wrong close tag';
            lastTag.childs.push({
              type: TYPE_TEXT,
              value: '</' + m[0]
            });
          }
          else
            lastTag = tagStack.pop();

          state = TEXT;
          break;

        case TAG_NAME:
        case ATTRIBUTE_NAME_OR_END:
          if (m[2] == ':')
          {
            if (token.prefix)      // prefix was before, break tag parse
              state = BREAK_TAG_PARSE;
            else
              token.prefix = m[1];

            break;
          }

          if (m[1])
          {
            // store name (it may be null when check for attribute and end)
            token.name = m[1];

            // store attribute
            if (token.type == TYPE_ATTRIBUTE)
              lastTag.attrs.push(token);
          }

          if (m[2] == '{')
          {
            if (token.type == TYPE_ELEMENT)
              state = REFERENCE;
            else
              state = BREAK_TAG_PARSE;

            break;
          }

          if (m[3]) // end tag declaration
          {
            parseTag = false;

            if (m[3] == '/>') // otherwise m[3] == '>'
              lastTag = tagStack.pop();
            else
              if (lastTag.prefix == 'b' && lastTag.name in TAG_IGNORE_CONTENT)
              {
                state = TAG_IGNORE_CONTENT[lastTag.name];
                break;
              }

            state = TEXT;
            break;
          }

          if (m[2] == '=') // ATTRIBUTE_NAME_OR_END only
          {
            state = ATTRIBUTE_VALUE;
            break;
          }

          // m[2] == '\s+' next attr, state doesn't change
          token = {
            type: TYPE_ATTRIBUTE
          };
          state = ATTRIBUTE_NAME_OR_END;
          break;

        case COMMENT:
          token.value = source.substring(bufferPos, pos - 3);
          state = TEXT;
          break;

        case REFERENCE:
          // add reference to token list name
          if (token.refs)
            token.refs.push(m[1]);
          else
            token.refs = [m[1]];

          // go next
          if (m[2] != '|') // m[2] == '}\s*'
          {
            if (token.type == TYPE_TEXT)
            {
              pos -= m[2].length - 1;
              token.value = source.substring(bufferPos, pos);
              state = TEXT;
            }
            else if (token.type == TYPE_COMMENT)
            {
              state = COMMENT;
            }
            else if (token.type == TYPE_ATTRIBUTE && source[pos] == '=')
            {
              pos++;
              state = ATTRIBUTE_VALUE;
            }
            else // ATTRIBUTE || ELEMENT
            {
              token = {
                type: TYPE_ATTRIBUTE
              };
              state = ATTRIBUTE_NAME_OR_END;
            }
          }

          // continue to collect references
          break;

        case ATTRIBUTE_VALUE:
          token.value = m[1].replace(quoteUnescape, '"');

          token = {
            type: TYPE_ATTRIBUTE
          };
          state = ATTRIBUTE_NAME_OR_END;

          break;

        case TAG_IGNORE_CONTENT.text:
          lastTag.childs.push({
            type: TYPE_TEXT,
            value: m[1]
          });

          lastTag = tagStack.pop();

          state = TEXT;
          break;

        default:
          throw 'Parser bug'; // Must never to be here; bug in parser otherwise
      }

      if (state == TEXT)
        textStateEndPos = pos;
    }

    if (textStateEndPos != pos)
      lastTag.childs.push({
        type: TYPE_TEXT,
        value: source.substring(textStateEndPos, pos)
      });

    /** @cut */ if (lastTag.name)
    /** @cut */   result.warns.push('No close tag for <' + lastTag.name + '>');
    /** @cut */
    /** @cut */ if (!result.warns.length)
    /** @cut */   delete result.warns;

    result.templateTokens = true;

    return result;
  };


  //
  // Convert tokens to declaration
  //

  var tokenTemplate = {};
  var L10nProxyToken = basis.Token.subclass({
    className: namespace + '.L10nProxyToken',
    token: null,
    url: '',
    init: function(token){
      this.url = token.dictionary.resource.url + ':' + token.name;
      this.token = token;
      this.set();

      token.attach(this.set, this);
    },
    set: function(){
      return basis.Token.prototype.set.call(this,
        this.token.type == 'markup'
          ? processMarkup(this.token.value, this.token.name + '@' + this.token.dictionary.resource.url)
          : ''
      );
    },
    destroy: function(){
      basis.Token.prototype.destroy.call(this);
      this.token = null;
    }
  });

  function processMarkup(value, id){
    // temporary
    return '<span class="basisjs-markup" data-basisjs-l10n="' + id + '">' + String(value) + '</span>';
  }

  function getL10nTemplate(token){
    if (typeof token == 'string')
      token = basis.l10n.token(token);

    if (!token)
      return null;

    var id = token.basisObjectId;
    var template = tokenTemplate[id];

    if (!template)
      template = tokenTemplate[id] = new Template(new L10nProxyToken(token));

    return template;
  }

 /**
  * make compiled version of template
  */
  var makeDeclaration = (function(){

    var IDENT = /^[a-z_][a-z0-9_\-]*$/i;
    var CLASS_ATTR_PARTS = /(\S+)/g;
    var CLASS_ATTR_BINDING = /^([a-z_][a-z0-9_\-]*)?\{((anim:)?[a-z_][a-z0-9_\-]*)\}$/i;
    var STYLE_ATTR_PARTS = /\s*[^:]+?\s*:(?:\(.*?\)|".*?"|'.*?'|[^;]+?)+(?:;|$)/gi;
    var STYLE_PROPERTY = /\s*([^:]+?)\s*:((?:\(.*?\)|".*?"|'.*?'|[^;]+?)+);?$/i;
    var STYLE_ATTR_BINDING = /\{([a-z_][a-z0-9_]*)\}/i;
    var ATTR_BINDING = /\{([a-z_][a-z0-9_]*|l10n:[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)*(?:\.\{[a-z_][a-z0-9_]*\})?)\}/i;
    var NAMED_CHARACTER_REF = /&([a-z]+|#[0-9]+|#x[0-9a-f]{1,4});?/gi;
    var tokenMap = basis.NODE_ENV ? node_require('./template/htmlentity.json') : {};
    var tokenElement = !basis.NODE_ENV ? document.createElement('div') : null;
    var includeStack = [];

    function name(token){
      return (token.prefix ? token.prefix + ':' : '') + token.name;
    }

    function namedCharReplace(m, token){
      if (!tokenMap[token])
      {
        if (token.charAt(0) == '#')
        {
          tokenMap[token] = String.fromCharCode(
            token.charAt(1) == 'x' || token.charAt(1) == 'X'
              ? parseInt(token.substr(2), 16)
              : token.substr(1)
          );
        }
        else
        {
          if (tokenElement)
          {
            tokenElement.innerHTML = m;
            tokenMap[token] = tokenElement.firstChild ? tokenElement.firstChild.nodeValue : m;
          }
        }
      }
      return tokenMap[token] || m;
    }

    function untoken(value){
      return value.replace(NAMED_CHARACTER_REF, namedCharReplace);
    }

    function refList(token){
      var array = token.refs;

      if (!array || !array.length)
        return 0;

      return array;
    }

    function processAttr(name, value){
      function buildExpression(parts){
        var bindName;
        var names = [];
        var expression = [];
        var map = {};

        for (var j = 0; j < parts.length; j++)
          if (j % 2)
          {
            bindName = parts[j];

            if (!map[bindName])
            {
              map[bindName] = names.length;
              names.push(bindName);
            }

            expression.push(map[bindName]);
          }
          else
          {
            if (parts[j])
              expression.push(untoken(parts[j]));
          }

        return [names, expression];
      }

      var bindings = 0;
      var parts;
      var m;

      // other attributes
      if (value)
      {
        switch (name)
        {
          case 'class':
            if (parts = value.match(CLASS_ATTR_PARTS))
            {
              var newValue = [];

              bindings = [];

              for (var j = 0, part; part = parts[j]; j++)
              {
                if (m = part.match(CLASS_ATTR_BINDING))
                  bindings.push([m[1] || '', m[2]]);
                else
                  newValue.push(part);
              }

              // set new value
              value = newValue.join(' ');
            }
            break;

          case 'style':
            var props = [];

            bindings = [];
            if (parts = value.match(STYLE_ATTR_PARTS))
            {
              for (var j = 0, part; part = parts[j]; j++)
              {
                var m = part.match(STYLE_PROPERTY);
                var propertyName = m[1];
                var value = m[2].trim();

                var valueParts = value.split(STYLE_ATTR_BINDING);
                if (valueParts.length > 1)
                {
                  var expr = buildExpression(valueParts);
                  expr.push(propertyName);
                  bindings.push(expr);
                }
                else
                  props.push(propertyName + ': ' + untoken(value));
              }
            }
            else
            {
              /** @cut */ if (/\S/.test(value))
              /** @cut */   basis.dev.warn('Bad value for style attribute (value ignored):', value);
            }

            props.push('');
            value = props.join(';');
            break;

          default:
            parts = value.split(ATTR_BINDING);
            if (parts.length > 1)
              bindings = buildExpression(parts);
            else
              value = untoken(value);
        }
      }

      if (bindings && !bindings.length)
        bindings = 0;

      return {
        binding: bindings,
        value: value,
        type: ATTR_TYPE_BY_NAME[name] || 2
      };
    }

    function attrs(token, declToken, optimizeSize){
      var attrs = token.attrs;
      var result = [];
      var m;

      for (var i = 0, attr; attr = attrs[i]; i++)
      {
        // process special attributes (basis namespace)
        if (attr.prefix == 'b')
        {
          switch (attr.name)
          {
            case 'ref':
              var refs = (attr.value || '').trim().split(/\s+/);
              for (var j = 0; j < refs.length; j++)
                addTokenRef(declToken, refs[j]);
            break;
          }

          continue;
        }

        if (m = attr.name.match(/^event-(.+)$/))
        {
          result.push(m[1] == attr.value ? [TYPE_ATTRIBUTE_EVENT, m[1]] : [TYPE_ATTRIBUTE_EVENT, m[1], attr.value]);
          continue;
        }

        var parsed = processAttr(attr.name, attr.value);
        var item = [
          parsed.type,            // TOKEN_TYPE = 0
          parsed.binding,         // TOKEN_BINDINGS = 1
          refList(attr)           // TOKEN_REFS = 2
        ];

        // ATTR_NAME = 3
        if (parsed.type == 2)
          item.push(name(attr));

        // ATTR_VALUE = 4
        if (parsed.value && (!optimizeSize || !parsed.binding || parsed.type != 2))
          item.push(parsed.value);

        result.push(item);
      }

      return result.length ? result : 0;
    }

    function addTokenRef(token, refName){
      if (!token[TOKEN_REFS])
        token[TOKEN_REFS] = [];

      arrayAdd(token[TOKEN_REFS], refName);

      if (refName != 'element')
        token[TOKEN_BINDINGS] = token[TOKEN_REFS].length == 1 ? refName : 0;
    }

    function removeTokenRef(token, refName){
      var idx = token[TOKEN_REFS].indexOf(refName);
      if (idx != -1)
      {
        var indexBinding = token[TOKEN_BINDINGS] && typeof token[TOKEN_BINDINGS] == 'number';
        token[TOKEN_REFS].splice(idx, 1);

        if (indexBinding)
          if (idx == token[TOKEN_BINDINGS] - 1)
            token[TOKEN_BINDINGS] = refName;

        if (!token[TOKEN_REFS].length)
          token[TOKEN_REFS] = 0;
        else
        {
          if (indexBinding)
            token[TOKEN_BINDINGS] -= idx < (token[TOKEN_BINDINGS] - 1);
        }
      }
    }

    function tokenAttrs(token){
      var result = {};

      if (token.attrs)
        for (var i = 0, attr; attr = token.attrs[i]; i++)
          result[name(attr)] = attr.value;

      return result;
    }

    function addUnique(array, items){
      for (var i = 0; i < items.length; i++)
        arrayAdd(array, items[i]);
    }

    //
    // main function
    //
    function process(tokens, template, options){

      function modifyAttr(token, name, action){
        var attrs = tokenAttrs(token);

        if (name)
          attrs.name = name;

        if (!attrs.name)
        {
          ;;;template.warns.push('Instruction <b:' + token.name + '> has no attribute name');
          return;
        }

        if (!IDENT.test(attrs.name))
        {
          ;;;template.warns.push('Bad attribute name `' + attrs.name + '`');
          return;
        }

        var includedToken = tokenRefMap[attrs.ref || 'element'];
        if (includedToken)
        {
          if (includedToken.token[TOKEN_TYPE] == TYPE_ELEMENT)
          {
            var itAttrs = includedToken.token;
            var itType = ATTR_TYPE_BY_NAME[attrs.name];
            var valueIdx = ATTR_VALUE - !!itType;
            var itAttrToken = itAttrs && arraySearch(itAttrs, attrs.name, function(token){
              return itType ? ATTR_NAME_BY_TYPE[token[TOKEN_TYPE]] : token[ATTR_NAME];
            });

            if (!itAttrToken && action != 'remove')
            {
              itAttrToken = [
                itType || TYPE_ATTRIBUTE,
                0,
                0
              ];
              if (!itType)
                itAttrToken.push(attrs.name);
              itAttrToken.push('');

              if (!itAttrs)
              {
                itAttrs = [];
                includedToken.token.push(itAttrs);
              }

              itAttrs.push(itAttrToken);
            }

            var classOrStyle = attrs.name == 'class' || attrs.name == 'style';
            switch (action){
              case 'set':
                var parsed = processAttr(attrs.name, attrs.value);

                itAttrToken[TOKEN_BINDINGS] = parsed.binding;

                if (!options.optimizeSize || !itAttrToken[TOKEN_BINDINGS] || classOrStyle)
                  itAttrToken[valueIdx] = parsed.value || '';
                else
                  itAttrToken.length = valueIdx;

                if (classOrStyle)
                  if (!itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx])
                  {
                    arrayRemove(itAttrs, itAttrToken);
                    return;
                  }

                break;

              case 'append':
                var parsed = processAttr(attrs.name, attrs.value);

                if (parsed.binding)
                {
                  var attrBindings = itAttrToken[TOKEN_BINDINGS];
                  if (attrBindings)
                  {
                    if (attrs.name == 'style')
                    {
                      var filter = {};

                      for (var i = 0, newBinding; newBinding = parsed.binding[i]; i++)
                        filter[newBinding[2]] = true;

                      for (var i = 0, k = 0, oldBinding; oldBinding = attrBindings[i]; i++)
                        if (!filter[oldBinding[2]])
                          attrBindings[k++] = oldBinding;

                      attrBindings.length = k;
                    }

                    attrBindings.push.apply(attrBindings, parsed.binding);
                  }
                  else
                    itAttrToken[TOKEN_BINDINGS] = parsed.binding;
                }

                if (parsed.value)
                  itAttrToken[valueIdx] += (itAttrToken[valueIdx] && attrs.name == 'class' ? ' ' : '') + parsed.value;

                if (classOrStyle)
                  if (!itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx])
                  {
                    arrayRemove(itAttrs, itAttrToken);
                    return;
                  }

                break;

              case 'remove':
                if (itAttrToken)
                  arrayRemove(itAttrs, itAttrToken);

                break;
            }
          }
          else
          {
            ;;;template.warns.push('Attribute modificator is not reference to element token (reference name: ' + (attrs.ref || 'element') + ')');
          }
        }
      }

      var result = [];

      for (var i = 0, token, item; token = tokens[i]; i++)
      {
        var refs = refList(token);
        var bindings = refs && refs.length == 1 ? refs[0] : 0;

        switch (token.type)
        {
          case TYPE_ELEMENT:
            // special elements (basis namespace)
            if (token.prefix == 'b')
            {
              var elAttrs = tokenAttrs(token);

              switch (token.name)
              {
                case 'resource':
                case 'style':
                  if (elAttrs.src)
                    template.resources.push(path.resolve(template.baseURI + elAttrs.src));
                break;

                case 'l10n':
                  /** @cut */ if (template.l10nResolved)
                  /** @cut */   template.warns.push('<b:l10n> must be declared before any `l10n:` token (instruction ignored)');

                  if (elAttrs.src)
                    template.dictURI = path.relative(basis.path.baseURI, template.baseURI + elAttrs.src);
                break;

                case 'define':
                  if ('name' in elAttrs && !template.defines[elAttrs.name])
                  {
                    switch (elAttrs.type)
                    {
                      case 'bool':
                        template.defines[elAttrs.name] = [elAttrs['default'] == 'true' ? 1 : 0];
                        break;
                      case 'enum':
                        var values = elAttrs.values ? elAttrs.values.trim().split(' ') : [];
                        template.defines[elAttrs.name] = [values.indexOf(elAttrs['default']) + 1, values];
                        break;
                      /** @cut */ default:
                      /** @cut */  template.warns.push('Bad define type `' + elAttrs.type + '` for ' + elAttrs.name);
                    }
                  }
                break;

                case 'text':
                  var text = token.childs[0];
                  tokens[i--] = basis.object.extend(text, {
                    refs: (elAttrs.ref || '').trim().split(/\s+/),
                    value: 'notrim' in elAttrs ? text.value : text.value.replace(/^\s*[\r\n]+|[\r\n]\s*$/g, '')
                  });
                break;

                case 'include':
                  var templateSrc = elAttrs.src;
                  if (templateSrc)
                  {
                    var isTemplateRef = /^#\d+$/.test(templateSrc);
                    var url = isTemplateRef ? templateSrc.substr(1) : templateSrc;
                    var resource;

                    if (isTemplateRef)
                      resource = templateList[url];
                    else if (/^[a-z0-9\.]+$/i.test(url) && !/\.tmpl$/.test(url))
                      resource = getSourceByPath(url);
                    else
                      resource = basis.resource(path.resolve(template.baseURI + url));

                    if (!resource)
                    {
                      /** @cut */ template.warns.push('<b:include src="' + templateSrc + '"> is not resolved, instruction ignored');
                      /** @cut */ basis.dev.warn('<b:include src="' + templateSrc + '"> is not resolved, instruction ignored');
                      continue;
                    }

                    if (includeStack.indexOf(resource) == -1) // prevent recursion
                    {
                      var decl;

                      arrayAdd(template.deps, resource);

                      // prevent recursion
                      includeStack.push(resource);

                      if (isTemplateRef)
                      {
                        // source wrapper
                        if (resource.source.bindingBridge)
                          arrayAdd(template.deps, resource.source);

                        decl = getDeclFromSource(resource.source, resource.baseURI, true, options);
                      }
                      else
                      {
                        decl = getDeclFromSource(resource, resource.url ? path.dirname(resource.url) + '/' : '', true, options);
                      }

                      // prevent recursion
                      includeStack.pop();

                      if (decl.resources && 'no-style' in elAttrs == false)
                        addUnique(template.resources, decl.resources);

                      if (decl.deps)
                        addUnique(template.deps, decl.deps);

                      /** @cut */ if (decl.l10n)
                      /** @cut */   addUnique(template.l10n, decl.l10n);

                      var tokenRefMap = normalizeRefs(decl.tokens);
                      var instructions = (token.childs || []).slice();

                      if (elAttrs['class'])
                        instructions.push({
                          type: TYPE_ELEMENT,
                          prefix: 'b',
                          name: 'append-class',
                          attrs: [
                            {
                              type: TYPE_ATTRIBUTE,
                              name: 'value',
                              value: elAttrs['class']
                            }
                          ]
                        });

                      if (elAttrs.id)
                        instructions.push({
                          type: TYPE_ELEMENT,
                          prefix: 'b',
                          name: 'set-attr',
                          attrs: [
                            {
                              type: TYPE_ATTRIBUTE,
                              name: 'name',
                              value: 'id'
                            },
                            {
                              type: TYPE_ATTRIBUTE,
                              name: 'value',
                              value: elAttrs.id
                            }
                          ]
                        });

                      if (elAttrs.ref)
                        if (tokenRefMap.element)
                          elAttrs.ref.trim().split(/\s+/).map(function(refName){
                            addTokenRef(tokenRefMap.element.token, refName);
                          });

                      for (var j = 0, child; child = instructions[j]; j++)
                      {
                        // process special elements (basis namespace)
                        if (child.type == TYPE_ELEMENT && child.prefix == 'b')
                        {
                          switch (child.name)
                          {
                            case 'replace':
                            case 'remove':
                            case 'before':
                            case 'after':
                              var replaceOrRemove = child.name == 'replace' || child.name == 'remove';
                              var childAttrs = tokenAttrs(child);
                              var ref = 'ref' in childAttrs || !replaceOrRemove ? childAttrs.ref : 'element';
                              var tokenRef = ref && tokenRefMap[ref];

                              //if (!tokenRef)

                              if (tokenRef)
                              {
                                var pos = tokenRef.owner.indexOf(tokenRef.token);
                                if (pos != -1)
                                {
                                  var args = [pos + (child.name == 'after'), replaceOrRemove];

                                  if (child.name != 'remove')
                                    args = args.concat(process(child.childs, template, options) || []);

                                  tokenRef.owner.splice.apply(tokenRef.owner, args);
                                }
                              }
                              break;

                            case 'prepend':
                            case 'append':
                              var childAttrs = tokenAttrs(child);
                              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                              var tokenRef = ref && tokenRefMap[ref];
                              var token = tokenRef && tokenRef.token;

                              if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
                              {
                                var childs = process(child.childs, template, options) || [];

                                if (child.name == 'prepend')
                                  token.splice.apply(token, [ELEMENT_ATTRS, 0].concat(childs));
                                else
                                  token.push.apply(token, childs);
                              }
                              break;

                            case 'attr':
                            case 'set-attr':
                              modifyAttr(child, false, 'set');
                              break;

                            case 'append-attr':
                              modifyAttr(child, false, 'append');
                              break;

                            case 'remove-attr':
                              modifyAttr(child, false, 'remove');
                              break;

                            case 'class':
                            case 'append-class':
                              modifyAttr(child, 'class', 'append');
                              break;

                            case 'set-class':
                              modifyAttr(child, 'class', 'set');
                              break;

                            case 'remove-class':
                              modifyAttr(child, 'class', 'remove');
                              break;

                            case 'add-ref':
                              var childAttrs = tokenAttrs(child);
                              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                              var tokenRef = ref && tokenRefMap[ref];
                              var token = tokenRef && tokenRef.token;

                              if (token && childAttrs.name)
                                addTokenRef(token, childAttrs.name);
                              break;

                            case 'remove-ref':
                              var childAttrs = tokenAttrs(child);
                              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                              var tokenRef = ref && tokenRefMap[ref];
                              var token = tokenRef && tokenRef.token;

                              if (token)
                                removeTokenRef(token, childAttrs.name || childAttrs.ref);
                              break;

                            default:
                              ;;;template.warns.push('Unknown instruction tag <b:' + child.name + '>');
                          }
                        }
                        else
                          decl.tokens.push.apply(decl.tokens, process([child], template, options) || []);
                      }

                      if (tokenRefMap.element)
                        removeTokenRef(tokenRefMap.element.token, 'element');

                      //resources.push.apply(resources, tokens.resources);
                      result.push.apply(result, decl.tokens);
                    }
                    else
                    {
                      /** @cut */ var stack = includeStack.slice(includeStack.indexOf(resource) || 0).concat(resource).map(function(res){
                      /** @cut */   if (res instanceof Template)
                      /** @cut */     res = res.source;
                      /** @cut */   if (res instanceof L10nProxyToken)
                      /** @cut */     return '{l10n:' + res.token.name + '@' + res.token.dictionary.resource.url + '}';
                      /** @cut */   return res.url || '[inline template]';
                      /** @cut */ });
                      /** @cut */ template.warns.push('Recursion: ', stack.join(' -> '));
                      /** @cut */ basis.dev.warn('Recursion in template ' + (template.sourceUrl || '[inline template]') + ': ', stack.join(' -> '));
                    }
                  }

                break;
              }

              // don't add to declaration
              continue;
            }

            item = [
              1,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              name(token)              // ELEMENT_NAME = 3
            ]
            item.push.apply(item, attrs(token, item, options.optimizeSize) || []);
            item.push.apply(item, process(token.childs, template, options) || []);

            break;

          case TYPE_TEXT:
            if (refs && refs.length == 2 && arraySearch(refs, 'element'))
              bindings = refs[+!refs.lastSearchIndex]; // get first one reference but not `element`

            // process l10n
            if (bindings)
            {
              var l10nBinding = absl10n(bindings, template.dictURI);  // l10n:foo.bar.{binding}@dict/path/to.l10n
              var parts = l10nBinding.split(/[:@\{]/);

              // if prefix is l10n: and token has no value bindings
              if (parts[0] == 'l10n' && parts.length == 3)
              {
                // check for dictionary
                if (!parts[2])
                {
                  // reset binding with no dictionary
                  arrayRemove(refs, bindings);
                  if (refs.length == 0)
                    refs = null;
                  bindings = 0;
                  token.value = token.value.replace(/\}$/, '@undefined}');
                }
                else
                {
                  var l10nId = parts.slice(1).join('@');
                  var l10nToken = basis.l10n.token(l10nId);
                  var l10nTemplate = getL10nTemplate(l10nToken);

                  template.l10nResolved = true;

                  if (l10nTemplate && l10nToken.type == 'markup')
                  {
                    tokens[i--] = tokenize('<b:include src="#' + l10nTemplate.templateId + '"/>')[0];
                    continue;
                  }
                  /** @cut for token type change in dev mode */
                  /** @cut */ else
                  /** @cut */   arrayAdd(template.l10n, l10nId);
                }
              }
            }

            item = [
              3,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs                     // TOKEN_REFS = 2
            ];

            // TEXT_VALUE = 3
            if (!refs || token.value != '{' + refs.join('|') + '}')
              item.push(untoken(token.value));

            break;

          case TYPE_COMMENT:
            if (options.optimizeSize && !bindings && !refs)
              continue;

            item = [
              8,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs                     // TOKEN_REFS = 2
            ];

            // COMMENT_VALUE = 3
            if (!options.optimizeSize)
              if (!refs || token.value != '{' + refs.join('|') + '}')
                item.push(untoken(token.value));

            break;
        }

        while (item[item.length - 1] === 0)
          item.pop();

        result.push(item);
      }


      return result.length ? result : 0;
    }

    function absl10n(value, dictURI){
      if (typeof value != 'string')
        return value;

      var parts = value.split(':');
      if (parts.length == 2 && parts[0] == 'l10n' && parts[1].indexOf('@') == -1)
        parts[1] = parts[1] + '@' + dictURI;

      return parts.join(':');
    }

    function normalizeRefs(tokens, dictURI, map, stIdx){
      if (!map)
        map = {};

      for (var i = stIdx || 0, token; token = tokens[i]; i++)
      {
        if (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT)
          continue;

        var refs = token[TOKEN_REFS];

        if (refs)
        {
          for (var j = refs.length - 1, refName; refName = refs[j]; j--)
          {
            if (refName.indexOf(':') != -1)
            {
              removeTokenRef(token, refName);
              continue;
            }

            if (map[refName])
              removeTokenRef(map[refName].token, refName);

            if (token[TOKEN_BINDINGS] == refName)
              token[TOKEN_BINDINGS] = j + 1;

            map[refName] = {
              owner: tokens,
              token: token
            };
          }
        }

        switch (token[TOKEN_TYPE])
        {
          case TYPE_TEXT:
            token[TOKEN_BINDINGS] = absl10n(token[TOKEN_BINDINGS], dictURI);
            break;

          case TYPE_ATTRIBUTE:
            if (token[TOKEN_BINDINGS])
            {
              var array = token[TOKEN_BINDINGS][0];
              for (var j = 0; j < array.length; j++)
                array[j] = absl10n(array[j], dictURI);
            }
            break;

          case TYPE_ELEMENT:
            normalizeRefs(token, dictURI, map, ELEMENT_ATTRS);
            break;
        }
      }

      return map;
    }

    function applyDefines(tokens, template, options, stIdx){
      var unpredictable = 0;

      for (var i = stIdx || 0, token; token = tokens[i]; i++)
      {
        if (token[TOKEN_TYPE] == TYPE_ELEMENT)
          unpredictable += applyDefines(token, template, options, ELEMENT_ATTRS);

        if (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_CLASS || (token[TOKEN_TYPE] == TYPE_ATTRIBUTE && token[ATTR_NAME] == 'class'))
        {
          var bindings = token[TOKEN_BINDINGS];
          var valueIdx = ATTR_VALUE - (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_CLASS);

          if (bindings)
          {
            var newAttrValue = (token[valueIdx] || '').trim().split(' ');

            for (var k = 0, bind; bind = bindings[k]; k++)
            {
              if (bind.length > 2)  // bind already processed
                continue;

              var bindName = bind[1].split(':').pop();
              var bindDef = template.defines[bindName];

              if (bindDef)
              {
                bind.push.apply(bind, bindDef);
                bindDef.used = true;

                if (bindDef[0])
                {
                  if (bindDef.length == 1) // bool
                    arrayAdd(newAttrValue, bind[0] + bindName);
                  else                     // enum
                    arrayAdd(newAttrValue, bind[0] + bindDef[1][bindDef[0] - 1]);
                }
              }
              else
              {
                ;;;template.warns.push('Unpredictable value `' + bindName + '` in class binding: ' + bind[0] + '{' + bind[1] + '}');
                unpredictable++;
              }
            }

            token[valueIdx] = newAttrValue.join(' ');
            if (options.optimizeSize && !token[valueIdx])
              token.length = valueIdx;
          }
        }
      }

      return unpredictable;
    }

    return function makeDeclaration(source, baseURI, options, sourceUrl){
      options = options || {};
      var warns = [];
      ;;;var source_;

      // result object
      var result = {
        sourceUrl: sourceUrl,
        baseURI: baseURI || '',
        tokens: null,
        resources: [],
        deps: [],
        /** @cut for token type change in dev mode */ l10n: [],
        defines: {},
        unpredictable: true,
        warns: warns
      };

      // resolve l10n dictionary url
      result.dictURI = sourceUrl ? basis.path.relative(basis.path.baseURI, result.baseURI + basis.path.basename(sourceUrl, basis.path.extname(sourceUrl)) + '.l10n') : baseURI || '';

      if (!source.templateTokens)
      {
        ;;;source_ = source;
        source = tokenize(String(source));
      }
      else
      {
        // add tokenizer warnings if any
        if (source.warns)
          warns.push.apply(warns, source.warns);
      }

      // main task
      result.tokens = process(source, result, options);

      // there must be at least one token in result
      if (!result.tokens)
        result.tokens = [[3, 0, 0, '']];

      // store source for debug
      /** @cut */ if (source_)
      /** @cut */   result.tokens.source_ = source_;

      // normalize refs
      addTokenRef(result.tokens[0], 'element');
      normalizeRefs(result.tokens, result.dictURI);

      // deal with defines
      result.unpredictable = !!applyDefines(result.tokens, result, options);

      /** @cut */ for (var key in result.defines)
      /** @cut */   if (!result.defines[key].used)
      /** @cut */     warns.push('Unused define for ' + key);

      // delete unnecessary keys
      delete result.defines;
      delete result.l10nResolved;

      if (!warns.length)
        result.warns = false;

      return result;
    };
  })();

  //
  //
  //

  var usableResources = {
    '.css': true
  };

  function startUseResource(uri){
    if (usableResources[path.extname(uri)])
      basis.resource(uri)().startUse();
  }

  function stopUseResource(uri){
    if (usableResources[path.extname(uri)])
      basis.resource(uri)().stopUse();
  }



 /**
  * @func
  */
  function templateSourceUpdate(){
    if (this.destroyBuilder)
      buildTemplate.call(this);

    for (var i = 0, attach; attach = this.attaches_[i]; i++)
      attach.handler.call(attach.context);
  }

  function cloneDecl(array){
    var result = [];

    /** @cut */ if (array.source_)
    /** @cut */   result.source_ = array.source_;

    for (var i = 0; i < array.length; i++)
      result.push(
        Array.isArray(array[i])
          ? cloneDecl(array[i])
          : array[i]
      );

    return result;
  }

 /**
  * @param {*} source
  * @param {string=} baseURI
  * @param {boolean=} clone
  * @param {object=} options
  */
  function getDeclFromSource(source, baseURI, clone, options){
    var result = source;
    var sourceUrl;

    if (typeof result == 'function')
    {
      baseURI = 'baseURI' in source ? source.baseURI : baseURI;
      sourceUrl = 'url' in source ? source.url : sourceUrl;
      result = result();
    }

    if (result instanceof basis.Token)
    {
      baseURI = 'baseURI' in source ? source.baseURI : baseURI;
      sourceUrl = 'url' in source ? source.url : sourceUrl;
      result = result.get();
    }

    if (Array.isArray(result))
    {
      if (clone)
        result = cloneDecl(result);

      result = {
        tokens: result
      };
    }
    else
    {
      if (typeof result != 'object' || !Array.isArray(result.tokens))
        result = String(result);
    }

    if (typeof result == 'string')
      result = makeDeclaration(result, baseURI, options, sourceUrl);

    return result;
  }


  /** @cut for token type change in dev mode */
  /** @cut */ function l10nHandler(value){
  /** @cut */   if (this.type != 'markup' && this.token.type == 'markup')
  /** @cut */   {
  /** @cut */     //console.log('rebuild!!!', this.token.name);
  /** @cut */     buildTemplate.call(this.template);
  /** @cut */   }
  /** @cut */ }

 /**
  * @func
  */
  function buildTemplate(){
    var decl = getDeclFromSource(this.source, this.baseURI);
    var destroyBuilder = this.destroyBuilder;
    var funcs = this.builder(decl.tokens, this);  // makeFunctions
    var deps = this.deps_;

    /** @cut for token type change in dev mode */
    /** @cut */ var l10n = this.l10n_;

    // detach old deps
    if (deps)
    {
      this.deps_ = null;
      for (var i = 0, dep; dep = deps[i]; i++)
        dep.bindingBridge.detach(dep, buildTemplate, this);
    }

    /** @cut for token type change in dev mode */
    /** @cut */ if (l10n)
    /** @cut */   for (var i = 0, item; item = l10n[i]; i++)
    /** @cut */     item.token.bindingBridge.detach(item.token, l10nHandler, item);


    // attach new deps
    if (decl.deps && decl.deps.length)
    {
      deps = decl.deps;
      this.deps_ = deps;
      for (var i = 0, dep; dep = deps[i]; i++)
        dep.bindingBridge.attach(dep, buildTemplate, this);
    }

    /** @cut for token type change in dev mode */
    /** @cut */ if (decl.l10n)
    /** @cut */ {
    /** @cut */   l10n = decl.l10n;
    /** @cut */   this.l10n_ = {};
    /** @cut */   for (var i = 0, key; key = l10n[i]; i++)
    /** @cut */   {
    /** @cut */     var l10nToken = basis.l10n.token(key);
    /** @cut */     l10nToken.bindingBridge.attach(l10nToken, l10nHandler, this.l10n_[key] = {
    /** @cut */       template: this,
    /** @cut */       token: l10nToken,
    /** @cut */       type: l10nToken.type
    /** @cut */     });
    /** @cut */   }
    /** @cut */ }

    // apply new values
    this.createInstance = funcs.createInstance;
    this.clearInstance = funcs.destroyInstance;
    this.getBinding = function(){
      return { names: funcs.keys };
    };
    this.destroyBuilder = funcs.destroy;

    ;;;this.instances_ = funcs.instances_;
    ;;;this.decl_ = decl;

    // apply resources
    var declResources = decl.resources && decl.resources.length > 0 ? decl.resources : null;

    if (declResources)
      for (var i = 0, res; res = declResources[i]; i++)
        startUseResource(res);

    if (this.resources)
      for (var i = 0, res; res = this.resources[i]; i++)
        stopUseResource(res);

    this.resources = declResources;

    // destroy old builder instance if exists
    if (destroyBuilder)
      destroyBuilder(true);
  }


  //
  // source from script by id
  //

  function sourceById(sourceId){
    var host = document.getElementById(sourceId);

    if (host && host.tagName == 'SCRIPT')
    {
      if (host.type == 'text/basis-template')
        return host.textContent || host.text;

      ;;;basis.dev.warn('Template script element with wrong type', host.type);

      return '';
    }

    ;;;basis.dev.warn('Template script element with id `' + sourceId + '` not found');

    return '';
  }

  function resolveSourceById(sourceId){
    return function(){
      return sourceById(sourceId);
    };
  }

 /**
  * Creates DOM structure template from marked HTML. Use {basis.template.html.Template#createInstance}
  * method to apply template to object. It creates clone of DOM structure and adds
  * links into object to pointed parts of structure.
  *
  * To remove links to DOM structure from object use {basis.template.html.Template#clearInstance}
  * method.
  * @example
  *   // create a template
  *   var template = new basis.template.html.Template(
  *     '<li class="listitem item-{num}" title="Item #{num}: {title}">' +
  *       '<a href="{url}">{title}</a>' +
  *       '<span class="description">{description}</span>' +
  *     '</li>'
  *   );
  *
  *   // create list container
  *   var list = document.createElement('ul');
  *
  *   // create 10 DOM elements using template
  *   for (var i = 0; i < 10; i++)
  *   {
  *     var tmpl = template.createInstance();
  *     tmpl.set('num', i);
  *     tmpl.set('url', '/foo/bar.html');
  *     tmpl.set('title, 'some title');
  *     tmpl.set('description', 'description text');
  *     list.appendChild(tmpl.element);
  *   }
  *
  * @class
  */
  var Template = Class(null, {
    className: namespace + '.Template',

    __extend__: function(value){
      if (value instanceof Template)
        return value;

      if (value instanceof TemplateSwitchConfig)
        return new TemplateSwitcher(value);

      return new Template(value);
    },

   /**
    * Template source
    * @type {string|function|Array}
    */
    source: '',

   /**
    * Base url for nested resources.
    * @type {string}
    */
    baseURI: '',

   /**
    * @param {string|function()|Array} source Template source code that will be parsed
    * into DOM structure prototype. Parsing will be done on first {basis.Html.Template#createInstance}
    * or {basis.Html.Template#getBinding} call. If function passed it be called and it's result will be
    * used as template source code. If array passed that it treats as token list.
    * @constructor
    */
    init: function(source){
      if (templateList.length == 4096)
        throw 'Too many templates (maximum 4096)';

      this.attaches_ = [];
      this.setSource(source || '');

      this.templateId = templateList.push(this) - 1;
    },

    bindingBridge: {
      attach: function(template, handler, context){
        for (var i = 0, listener; listener = template.attaches_[i]; i++)
          if (listener.handler == handler && listener.context == context)
            return;

        template.attaches_.push({
          handler: handler,
          context: context
        });
      },
      detach: function(template, handler, context){
        for (var i = 0, listener; listener = template.attaches_[i]; i++)
          if (listener.handler == handler && listener.context == context)
          {
            template.attaches_.splice(i, 1);
            return;
          }
      },
      get: function(){
      }
    },

   /**
    * Create DOM structure and return object with references for it's nodes.
    * @param {object=} object Object which templateAction method will be called on events.
    * @param {function=} actionCallback
    * @param {function=} updateCallback
    * @param {object=} bindings
    * @param {object=} bindingInterface Object like { attach: function(object, handler, context), detach: function(object, handler, context) }
    * @return {object}
    */
    createInstance: function(object, actionCallback, updateCallback, bindings, bindingInterface){
      buildTemplate.call(this);
      return this.createInstance(object, actionCallback, updateCallback, bindings, bindingInterface);
    },

   /**
    * Remove reference from DOM structure
    * @param {object=} tmpl Storage of DOM references.
    */
    clearInstance: function(tmpl){
    },

    getBinding: function(bindings){
      buildTemplate.call(this);
      return this.getBinding(bindings);
    },

    setSource: function(source){
      var oldSource = this.source;
      if (oldSource != source)
      {
        if (typeof source == 'string')
        {
          var m = source.match(/^([a-z]+):/);
          if (m)
          {
            var prefix = m[1];

            source = source.substr(m[0].length);

            switch (prefix)
            {
              case 'file':
                source = basis.resource(source);
                break;
              case 'id':
                // source from script element
                source = resolveSourceById(source);
                break;
              case 'tokens':
                source = basis.string.toObject(source);
                source.isDecl = true;
                break;
              case 'raw':
                //source = source;
                break;
              case 'path':
                source = getSourceByPath(source);
                break;
              default:
                ;;;basis.dev.warn(namespace + '.Template.setSource: Unknown prefix ' + prefix + ' for template source was ingnored.');
            }
          }
        }

        if (oldSource && oldSource.bindingBridge)
        {
          var tmplList = oldSource.url && tmplFilesMap[oldSource.url];
          if (tmplList)
          {
            arrayRemove(tmplList, this);
            if (!tmplList.length)
              delete tmplFilesMap[oldSource.url];
          }

          this.baseURI = '';
          this.source.bindingBridge.detach(oldSource, templateSourceUpdate, this);
        }

        if (source && source.bindingBridge)
        {
          if (source.url)
          {
            this.baseURI = path.dirname(source.url) + '/';
            if (!tmplFilesMap[source.url])
              tmplFilesMap[source.url] = [];
            arrayAdd(tmplFilesMap[source.url], this);
          }

          source.bindingBridge.attach(source, templateSourceUpdate, this);
        }

        this.source = source;

        templateSourceUpdate.call(this);
      }
    },

    destroy: function(){
      if (this.destroyBuilder)
        this.destroyBuilder();

      this.attaches_ = null;
      this.createInstance = null;
      this.getBinding = null;
      this.resources = null;
      this.source = null;

      ;;;this.instances_ = null;
      ;;;this.decl_ = null;
    }
  });



// template: basis.template.wrapper(
//   '<b:class value="..."/>'
// )

// var TemplateWrapper = Class(Template, {
//   source_: '',
//   template: null,
//   init: function(source, template){
//     Template.prototype.init.call(this);
//     this.setTemplate(template);
//   },
//   setTemplate: function(template){
//     if (this.template !== template)
//       this.template = template;
//       this.setSource(??)
//   },
//   setSource: function(source){
//     if (this.source_ != source)
//     {
//       var newSource =
//         '<b:include src="#' + this.template.templateId + '">' +
//           source +
//         '</b:include>';

//       Template.prototype.setSource.call(this, newSource);
//     }
//   }
// });


 /**
  * @class
  */
  var TemplateSwitchConfig = function(config){
    basis.object.extend(this, config);
  };


 /**
  * @class
  */
  var TemplateSwitcher = basis.Class(null, {
    className: namespace + '.TemplateSwitcher',

    ruleRet_: null,
    templates_: null,

    templateClass: Template,
    ruleEvents: null,
    rule: String,  // return empty string as template source

    init: function(config){
      this.ruleRet_ = [];
      this.templates_ = [];
      this.rule = config.rule;

      var events = config.events;
      if (events && events.length)
      {
        this.ruleEvents = {};
        for (var i = 0, eventName; eventName = events[i]; i++)
          this.ruleEvents[eventName] = true;
      }

      cleaner.add(this);
    },
    resolve: function(object){
      var ret = this.rule(object);
      var idx = this.ruleRet_.indexOf(ret);

      if (idx == -1)
      {
        this.ruleRet_.push(ret);
        idx = this.templates_.push(new this.templateClass(ret)) - 1;
      }

      return this.templates_[idx];
    },
    destroy: function(){
      this.rule = null;
      this.templates_ = null;
      this.ruleRet_ = null;
    }
  });


 /**
  * Helper to create TemplateSwitchConfig instance
  */
  function switcher(events, rule){
    var args = basis.array(arguments);
    var rule = args.pop();

    return new TemplateSwitchConfig({
      rule: rule,
      events: args.join(' ').trim().split(/\s+/)
    });
  }


  //
  // Theme
  //

 /**
  * @class
  */
  var Theme = Class(null, {
    className: namespace + '.Theme',
    get: getSourceByPath
  });


 /**
  * @class
  */
  var SourceWrapper = Class(basis.Token, {
    className: namespace + '.SourceWrapper',

   /**
    * Template source name.
    * @type {string}
    */
    path: '',

   /**
    * Url of wrapped content, if exists.
    * @type {string}
    */
    url: '',

   /**
    * Base URI of wrapped content, if exists.
    * @type {string}
    */
    baseURI: '',

   /**
    * @constructor
    * @param {*} value
    * @param {string} path
    */
    init: function(value, path){
      this.path = path;
      basis.Token.prototype.init.call(this, '');
    },

   /**
    * @inheritDocs
    */
    get: function(){
      return this.value && this.value.bindingBridge
        ? this.value.bindingBridge.get(this.value)
        : this.value;
    },

   /**
    * @inheritDocs
    */
    set: function(){
      var content = getThemeSource(currentThemeName, this.path);

      if (this.value != content)
      {
        if (this.value && this.value.bindingBridge)
          this.value.bindingBridge.detach(this.value, SourceWrapper.prototype.apply, this);

        this.value = content;
        this.url = (content && content.url) || '';
        this.baseURI = (typeof content == 'object' || typeof content == 'function') && 'baseURI' in content ? content.baseURI : path.dirname(this.url) + '/';

        if (this.value && this.value.bindingBridge)
          this.value.bindingBridge.attach(this.value, SourceWrapper.prototype.apply, this);

        this.apply();
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.url = null;
      this.baseURI = null;

      if (this.value && this.value.bindingBridge)
        this.value.bindingBridge.detach(this.value, this.apply, this);

      basis.Token.prototype.destroy.call(this);
    }
  });


  function getSourceByPath(){
    var path = basis.array(arguments).join('.');
    var source = sourceByPath[path];

    if (!source)
    {
      source = new SourceWrapper('', path);
      sourceByPath[path] = source;
    }

    return source;
  }

  function normalize(list){
    var used = {};
    var result = [];

    for (var i = 0; i < list.length; i++)
      if (!used[list[i]])
      {
        used[list[i]] = true;
        result.push(list[i]);
      }

    return result;
  }

  function extendFallback(themeName, list){
    var result = [];
    result.source = normalize(list).join('/');

    // map for used themes
    var used = {
      base: true
    };

    for (var i = 0; i < list.length; i++)
    {
      var name = list[i] || 'base';

      // skip if theme already processed
      if (name == themeName || used[name])
        continue;

      // get or create theme
      var theme = getTheme(name);

      // mark theme as used (theme could be only once in list)
      // and add to lists
      used[name] = true;
      result.push(name);

      // add theme fallback list
      list.splice.apply(list, [i + 1, 0].concat(themes[name].fallback));
    }

    // special cases:
    // - theme itself must be the first in source list and not in fallback list
    // - base theme must be the last for both lists
    result.unshift(themeName);
    if (themeName != 'base')
      result.push('base');

    result.value = result.join('/');

    return result;
  }

  function getThemeSource(name, path){
    var sourceList = themes[name].sourcesList;

    for (var i = 0, map; map = sourceList[i]; i++)
      if (map.hasOwnProperty(path))
        return map[path];

    return '';
  }

  function themeHasEffect(themeName){
    return themes[currentThemeName].fallback.indexOf(themeName) != -1;
  }

  function syncCurrentThemePath(path){
    getSourceByPath(path).set();
  }

  function syncCurrentTheme(changed){
    ;;;basis.dev.log('re-apply templates');

    for (var path in sourceByPath)
      syncCurrentThemePath(path);
  }

  function getTheme(name){
    if (!name)
      name = 'base';

    if (themes[name])
      return themes[name].theme;

    if (!/^([a-z0-9\_\-]+)$/.test(name))
      throw 'Bad name for theme - ' + name;

    var sources = {};
    var sourceList = [sources];
    var themeInterface = new Theme();

    themes[name] = {
      theme: themeInterface,
      sources: sources,
      sourcesList: sourceList,
      fallback: []
    };

    // closure methods

    var addSource = function(path, source){
      if (path in sources == false)
      {
        sources[path] = source;

        if (themeHasEffect(name))
          syncCurrentThemePath(path);
      }
      /** @cut */ else
      /** @cut */   basis.dev.warn('Template path `' + path + '` is already defined for theme `' + name + '` (definition ignored).');

      return getSourceByPath(path);
    };

    basis.object.extend(themeInterface, {
      name: name,
      fallback: function(value){
        if (themeInterface !== baseTheme && arguments.length > 0)
        {
          var newFallback = typeof value == 'string' ? value.split('/') : [];

          // process new fallback
          var changed = {};
          newFallback = extendFallback(name, newFallback);
          if (themes[name].fallback.source != newFallback.source)
          {
            themes[name].fallback.source = newFallback.source;
            ;;;basis.dev.log('fallback changed');
            for (var themeName in themes)
            {
              var curFallback = themes[themeName].fallback;
              var newFallback = extendFallback(themeName, (curFallback.source || '').split('/'));
              if (newFallback.value != curFallback.value)
              {
                changed[themeName] = true;
                themes[themeName].fallback = newFallback;

                var sourceList = themes[themeName].sourcesList;
                sourceList.length = newFallback.length;
                for (var i = 0; i < sourceList.length; i++)
                  sourceList[i] = themes[newFallback[i]].sources;
              }
            }
          }

          // re-compure fallback for dependant themes
          var currentFallback = themes[currentThemeName].fallback;
          for (var themeName in changed)
          {
            if (themeHasEffect(themeName))
            {
              syncCurrentTheme();
              break;
            }
          }
        }

        var result = themes[name].fallback.slice(1); // skip theme itself
        result.source = themes[name].fallback.source;
        return result;
      },
      define: function(what, wherewith){
        if (typeof what == 'function')
          what = what();

        if (typeof what == 'string')
        {
          if (typeof wherewith == 'object')
          {
            // define(namespace, dictionary): object
            // what -> path
            // wherewith -> dictionary

            var namespace = what;
            var dictionary = wherewith;
            var result = {};

            for (var key in dictionary)
              if (dictionary.hasOwnProperty(key))
                result[key] = addSource(namespace + '.' + key, dictionary[key]);

            return result;
          }
          else
          {
            if (arguments.length == 1)
            {
              // define(path): Template  === getTempalteByPath(path)

              return getSourceByPath(what);
            }
            else
            {
              // define(path, source): Template
              // what -> path
              // wherewith -> source

              return addSource(what, wherewith);
            }
          }
        }
        else
        {
          if (typeof what == 'object')
          {
            // define(dictionary): Theme
            var dictionary = what;

            for (var path in dictionary)
              if (dictionary.hasOwnProperty(path))
                addSource(path, dictionary[path]);

            return themeInterface;
          }
          else
          {
            ;;;basis.dev.warn('Wrong first argument for basis.template.Theme#define');
          }
        }
      },
      apply: function(){
        if (name != currentThemeName)
        {
          currentThemeName = name;
          syncCurrentTheme();

          for (var i = 0, handler; handler = themeChangeHandlers[i]; i++)
            handler.fn.call(handler.context, name);

          ;;;basis.dev.info('Template theme switched to `' + name + '`');
        }
        return themeInterface;
      },
      getSource: function(withFallback){
        return withFallback ? getThemeSource(name, path) : sources[path];
      },
      drop: function(path){
        if (sources.hasOwnProperty(path))
        {
          delete sources[path];
          if (themeHasEffect(name))
            syncCurrentThemePath(path);
        }
      }
    });

    themes[name].fallback = extendFallback(name, []);
    sourceList.push(themes['base'].sources);

    return themeInterface;
  }

  var themes = {};
  var sourceByPath = {};
  var baseTheme = getTheme();
  var currentThemeName = 'base';
  var themeChangeHandlers = [];

  function onThemeChange(fn, context, fire){
    themeChangeHandlers.push({
      fn: fn,
      context: context
    });

    if (fire)
      fn.call(context, currentThemeName);
  }


  //
  // cleanup on page unload
  //

  cleaner.add({
    destroy: function(){
      // clear themes
      for (var path in sourceByPath)
        sourceByPath[path].destroy();

      themes = null;
      sourceByPath = null;

      // clear templates
      for (var i = 0, template; template = templateList[i]; i++)
        template.destroy();

      templateList = null;
    }
  });


  //
  // export names
  //

  module.exports = {
    DECLARATION_VERSION: DECLARATION_VERSION,
    // const
    TYPE_ELEMENT: TYPE_ELEMENT,
    TYPE_ATTRIBUTE: TYPE_ATTRIBUTE,
    TYPE_ATTRIBUTE_CLASS: TYPE_ATTRIBUTE_CLASS,
    TYPE_ATTRIBUTE_STYLE: TYPE_ATTRIBUTE_STYLE,
    TYPE_ATTRIBUTE_EVENT: TYPE_ATTRIBUTE_EVENT,
    TYPE_TEXT: TYPE_TEXT,
    TYPE_COMMENT: TYPE_COMMENT,

    TOKEN_TYPE: TOKEN_TYPE,
    TOKEN_BINDINGS: TOKEN_BINDINGS,
    TOKEN_REFS: TOKEN_REFS,

    ATTR_NAME: ATTR_NAME,
    ATTR_VALUE: ATTR_VALUE,
    ATTR_NAME_BY_TYPE: ATTR_NAME_BY_TYPE,

    ELEMENT_NAME: ELEMENT_NAME,
    ELEMENT_ATTRS: ELEMENT_ATTRS,
    ELEMENT_CHILDS: ELEMENT_CHILDS,

    TEXT_VALUE: TEXT_VALUE,
    COMMENT_VALUE: COMMENT_VALUE,

    // classes
    L10nProxyToken: L10nProxyToken,
    TemplateSwitchConfig: TemplateSwitchConfig,
    TemplateSwitcher: TemplateSwitcher,
    Template: Template,
    SourceWrapper: SourceWrapper,

    switcher: switcher,

    // for debug purposes
    tokenize: tokenize,
    getDeclFromSource: getDeclFromSource,
    makeDeclaration: makeDeclaration,
    getL10nTemplate: getL10nTemplate,

    // theme
    Theme: Theme,
    theme: getTheme,
    getThemeList: function(){
      return basis.object.keys(themes);
    },
    currentTheme: function(){
      return themes[currentThemeName].theme;
    },
    setTheme: function(name){
      return getTheme(name).apply();
    },
    onThemeChange: onThemeChange,

    define: baseTheme.define,

    get: getSourceByPath,
    getPathList: function(){
      return basis.object.keys(sourceByPath);
    }
  };
