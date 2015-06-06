
 /**
  * @namespace basis.template
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Class = basis.Class;
  var cleaner = basis.cleaner;
  var path = basis.path;
  var consts = require('basis.template.const');
  var DECLARATION_VERSION = require('basis.template.declaration').VERSION;
  var getDeclFromSource = require('basis.template.declaration').getDeclFromSource;
  var makeDeclaration = require('basis.template.declaration').makeDeclaration;
  var store = require('basis.template.store');
  var theme = require('basis.template.theme');
  var getSourceByPath = theme.get;


  //
  // Main part
  //

  var templateList = [];


  //
  // source from script by id
  //

  var sourceByDocumentId = {};

 /**
  * Fetch template source from <script> with given id. Script should
  * has type 'text/basis-template'.
  * @example
  *   <script type="text/basis-template" id="my-template"></script>
  *   ...
  *   resolveSourceByDocumentId('my-template');
  *
  * @param {string} sourceId
  * @return {basis.Resource} virtual resource that contains content of <script>
  */
  function resolveSourceByDocumentId(sourceId){
    var resource = sourceByDocumentId[sourceId];

    if (!resource)
    {
      var host = document.getElementById(sourceId);
      var source = '';

      if (host && host.tagName == 'SCRIPT' && host.type == 'text/basis-template')
        source = host.textContent || host.text;
      /** @cut */ else
      /** @cut */   if (!host)
      /** @cut */     basis.dev.warn('Template script element with id `' + sourceId + '` not found');
      /** @cut */   else
      /** @cut */     basis.dev.warn('Template should be declared in <script type="text/basis-template"> element (id `' + sourceId + '`)');

      resource = sourceByDocumentId[sourceId] = basis.resource.virtual('tmpl', source || '');
      /** @cut */ resource.id = sourceId;
      /** @cut */ resource.url = '<script id="' + sourceId + '"/>';
    }

    return resource;
  }

 /**
  * Resolve source by given reference.
  * @param {string} ref
  * @param {string=} baseURI
  */
  function resolveResource(ref, baseURI){
    // ref ~ "#123"
    if (/^#\d+$/.test(ref))
      return templateList[ref.substr(1)];

    // ref ~ "id:foo"
    if (/^id:/.test(ref))
      return resolveSourceByDocumentId(ref.substr(3));

    // ref ~ "foo.bar.baz"
    if (/^[a-z0-9\.]+$/i.test(ref) && !/\.tmpl$/.test(ref))
      return getSourceByPath(ref);

    // ref ~ "./path/to/file.tmpl"
    return basis.resource(basis.resource.resolveURI(ref, baseURI, '<b:include src=\"{url}\"/>'));
  }


  //
  // Template
  //

 /**
  * Function calls when bb-value template source is changing
  */
  function templateSourceUpdate(){
    if (this.destroyBuilder)
      buildTemplate.call(this);

    var cursor = this;
    while (cursor = cursor.attaches_)
      cursor.handler.call(cursor.context);
  }

 /**
  * Internal function to build declaration by template source,
  * attach it to template and setup synchronization.
  */
  function buildTemplate(){
    // build new declaration
    var declaration = getDeclFromSource(this.source, this.baseURI, false, {
      isolate: this.getIsolatePrefix()
    });

    // make functions and assign to template
    var destroyBuilder = this.destroyBuilder;
    var instances = {};
    var funcs = this.builder(declaration.tokens, instances);
    this.createInstance = funcs.createInstance;
    this.clearInstance = funcs.destroyInstance;
    this.destroyBuilder = funcs.destroy;

    store.add(this.templateId, this, instances);

    // for debug purposes only
    /** @cut */ this.instances_ = instances;
    /** @cut */ this.decl_ = declaration;


    // process dependencies
    var newDeps = declaration.deps;
    var oldDeps = this.deps_;
    this.deps_ = newDeps;

    // detach old deps
    if (oldDeps)
      for (var i = 0, dep; dep = oldDeps[i]; i++)
        dep.bindingBridge.detach(dep, buildTemplate, this);

    // attach new deps
    if (newDeps)
      for (var i = 0, dep; dep = newDeps[i]; i++)
        dep.bindingBridge.attach(dep, buildTemplate, this);


    // apply resources
    // start use new resource list and than stop use old resource list,
    // in this order FOUC is less possible
    var newResources = declaration.resources;
    var oldResources = this.resources;
    this.resources = newResources;

    if (newResources)
      for (var i = 0, url; url = newResources[i]; i++)
      {
        var resource = basis.resource(url).fetch();
        if (typeof resource.startUse == 'function')
          resource.startUse();
      }

    if (oldResources)
      for (var i = 0, url; url = oldResources[i]; i++)
      {
        var resource = basis.resource(url).fetch();
        if (typeof resource.stopUse == 'function')
          resource.stopUse();
      }


    // destroy old instances if any
    if (destroyBuilder)
      destroyBuilder(true);
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
    * @type {string}
    */
    url: '',

   /**
    * @private
    */
    attaches_: null,

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

      this.setSource(source || '');

      this.templateId = templateList.push(this) - 1;
    },

    bindingBridge: {
      attach: function(template, handler, context){
        /** @cut */ var cursor = template;
        /** @cut */ while (cursor = cursor.attaches_)
        /** @cut */   if (cursor.handler === handler && cursor.context === context)
        /** @cut */     basis.dev.warn('basis.template.Template#bindingBridge.attach: duplicate handler & context pair');

        template.attaches_ = {
          handler: handler,
          context: context,
          attaches_: template.attaches_
        };
      },
      detach: function(template, handler, context){
        var cursor = template;
        var prev;

        while (prev = cursor, cursor = cursor.attaches_)
          if (cursor.handler === handler && cursor.context === context)
          {
            prev.attaches_ = cursor.attaches_;
            return;
          }

        /** @cut */ basis.dev.warn('basis.template.Template#bindingBridge.detach: handler & context pair not found, nothing was removed');
      },
      get: function(template){
        var source = template.source;
        return source && source.bindingBridge
          ? source.bindingBridge.get(source)
          : source;
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
    clearInstance: function(/*tmpl*/){
    },

   /**
    * Returns base isolation prefix for template's content. Use it only if template content use <b:isolate>.
    * Template could overload it by `prefix` attribute in <b:isolate> tag.
    * @return {string} Isolation prefix.
    */
    getIsolatePrefix: function(){
      return 'i' + this.templateId + '__';
    },

   /**
    * Set new content source for template.
    * @param {string|bb-value} source New content source for template.
    */
    setSource: function(source){
      var oldSource = this.source;
      if (oldSource != source)
      {
        if (typeof source == 'string')
        {
          var m = source.match(/^([a-z]+):/);
          if (m)
          {
            source = source.substr(m[0].length);

            switch (m[1])
            {
              case 'id':
                // source from script element
                source = resolveSourceByDocumentId(source);
                break;
              case 'path':
                source = getSourceByPath(source);
                break;
              default:
                /** @cut */ basis.dev.warn(namespace + '.Template.setSource: Unknown prefix ' + m[1] + ' for template source was ingnored.');
            }
          }
        }

        if (oldSource && oldSource.bindingBridge)
        {
          this.url = '';
          this.baseURI = '';
          oldSource.bindingBridge.detach(oldSource, templateSourceUpdate, this);
        }

        if (source && source.bindingBridge)
        {
          if (source.url)
          {
            this.url = source.url;
            this.baseURI = path.dirname(source.url) + '/';
          }

          source.bindingBridge.attach(source, templateSourceUpdate, this);
        }

        this.source = source;

        templateSourceUpdate.call(this);
      }
    },

    destroy: function(){
      if (this.destroyBuilder)
      {
        store.remove(this.templateId);
        this.destroyBuilder();
      }

      this.attaches_ = null;
      this.createInstance = null;
      this.resources = null;
      this.source = null;

      /** @cut */ this.instances_ = null;
      /** @cut */ this.decl_ = null;
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
  * @param {string|string[]} events
  * @param {function()} rule
  */
  function switcher(events, rule){
    if (!rule)
    {
      rule = events;
      events = null;
    }

    if (typeof events == 'string')
      events = events.split(/\s+/);

    return new TemplateSwitchConfig({
      rule: rule,
      events: events
    });
  }


  //
  // cleanup on page unload
  //

  cleaner.add({
    destroy: function(){
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
    // const
    DECLARATION_VERSION: DECLARATION_VERSION,

    TYPE_ELEMENT: consts.TYPE_ELEMENT,
    TYPE_ATTRIBUTE: consts.TYPE_ATTRIBUTE,
    TYPE_ATTRIBUTE_CLASS: consts.TYPE_ATTRIBUTE_CLASS,
    TYPE_ATTRIBUTE_STYLE: consts.TYPE_ATTRIBUTE_STYLE,
    TYPE_ATTRIBUTE_EVENT: consts.TYPE_ATTRIBUTE_EVENT,
    TYPE_TEXT: consts.TYPE_TEXT,
    TYPE_COMMENT: consts.TYPE_COMMENT,
    TOKEN_TYPE: consts.TOKEN_TYPE,
    TOKEN_BINDINGS: consts.TOKEN_BINDINGS,
    TOKEN_REFS: consts.TOKEN_REFS,
    ATTR_NAME: consts.ATTR_NAME,
    ATTR_VALUE: consts.ATTR_VALUE,
    ATTR_NAME_BY_TYPE: consts.ATTR_NAME_BY_TYPE,
    CLASS_BINDING_ENUM: consts.CLASS_BINDING_ENUM,
    CLASS_BINDING_BOOL: consts.CLASS_BINDING_BOOL,
    ELEMENT_NAME: consts.ELEMENT_NAME,
    ELEMENT_ATTRS: consts.ELEMENT_ATTRIBUTES_AND_CHILDREN, // for backward capability 2015-04-24
    ELEMENT_ATTRIBUTES_AND_CHILDREN: consts.ELEMENT_ATTRIBUTES_AND_CHILDREN,
    TEXT_VALUE: consts.TEXT_VALUE,
    COMMENT_VALUE: consts.COMMENT_VALUE,

    // classes
    TemplateSwitchConfig: TemplateSwitchConfig,
    TemplateSwitcher: TemplateSwitcher,
    Template: Template,

    switcher: switcher,

    // for debug purposes
    getDeclFromSource: getDeclFromSource,
    makeDeclaration: makeDeclaration,
    resolveResource: resolveResource, // TODO: remove
    // for backward capability
    // TODO: remove
    /** @cut dev mode only */ getDebugInfoById: store.getDebugInfoById,
    /** @cut dev mode only */ getTemplateCount: function(){
    /** @cut dev mode only */   return templateList.length;
    /** @cut dev mode only */ },
    resolveTemplateById: store.resolveTemplateById,
    resolveObjectById: store.resolveObjectById,
    resolveTmplById: store.resolveTmplById,

    // theme
    SourceWrapper: theme.SourceWrapper,
    Theme: theme.Theme,
    theme: theme.theme,
    getThemeList: theme.getThemeList,
    currentTheme: theme.currentTheme,
    setTheme: theme.setTheme,
    onThemeChange: theme.onThemeChange,
    define: theme.define,
    get: theme.get,
    getPathList: theme.getPathList
  };
