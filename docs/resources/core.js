(function(){

 /**
  * @namespace
  */

  var namespace = 'BasisDoc.Core';

  // import names

  var getter = Function.getter;

  var nsData = basis.data;
  var nsWrappers = basis.dom.wrapper;
  var nsEntity = basis.entity;
  var nsAjax = basis.net.ajax;

  var TimeEventManager = basis.TimeEventManager;

  // main part

  var urlResolver_ = document.createElement('A');

  function resolveUrl(value){
    urlResolver_.href = value.replace(/^\.\//, '../');
    return urlResolver_.href;
  }


  var JsDocLinkEntity = new nsEntity.EntityType({
    name: 'JsDocLinkEntity',
    fields: {
      url: nsEntity.StringId,
      title: function(value){ return value != null ? String(value) : null; }
    }
  });

  var JsDocLinkEntity_init_ = JsDocLinkEntity.entityType.entityClass.prototype.init;
  JsDocLinkEntity.entityType.entityClass.prototype.init = function(){
    JsDocLinkEntity_init_.apply(this, arguments);
    resourceLoader.addResource(this.data.url, 'link');
  };


  var JsDocEntity = new nsEntity.EntityType({
    name: 'JsDocEntity',
    fields: {
      path: nsEntity.StringId,
      file: String,
      line: Number,
      text: String,
      context: String,
      tags: Function.$self
    }
  });

  var JsDocConfigOption = new nsEntity.EntityType({
    fields: {
      path: nsEntity.StringId,
      constructorPath: String,
      name: String,
      type: String,
      description: String
    }
  });

  var awaitingUpdateQueue = {};

  function fetchInheritedJsDocs(path, entity){
    var fullPath = path;
    var objData = map[fullPath];
    if (/class|property|method/.test(objData.kind))
    {
      var postPath = objData.kind == 'class' ? '' : '.prototype.' + objData.title;
      var inheritance = getInheritance(objData.kind == 'class' ? objData.obj : map[objData.path.replace(/.prototype$/, '')].obj, objData.kind == 'class' ? null : objData.title);
      for (var i = inheritance.length, inherit; inherit = inheritance[--i];)
      {
        //console.log(inherit.cls.className + postFix);
        var inheritedEntity = JsDocEntity.get(inherit.cls.className + postPath);
        if (inheritedEntity && inheritedEntity.data.text)
        {
          entity.set('text', inheritedEntity.data.text);
          return true;
        }
      }
      //console.log(inheritance);
    }
  }
  
  function processAwaitingJsDocs(){
    var keys = Object.keys(awaitingUpdateQueue);
    for (var k = 0; k < keys.length; k++)
    {
      var fullPath = keys[k];
      var awaitingEntity = awaitingUpdateQueue[fullPath];
      if (fetchInheritedJsDocs(fullPath, awaitingEntity))
        delete awaitingUpdateQueue[fullPath];
    }
  }

  function parseJsDocText(text){
    var parts = text.split(/\s*\@([a-z]+)[\t ]*/i);
    var tags = {};
    parts.unshift('description');
    for (var i = 0, key; key = parts[i]; i += 2)
    {
      var value = parts[i + 1];
      if (key == 'param' || key == 'config')
      {
        if (!tags[key])
          tags[key] = {};

        var p = value.match(/^\s*\{([^\}]+)\}\s+(\S+)(?:\s+((?:.|[\r\n])+))?/i);
        if (!p)
        {
          if (typeof console != 'undefined')
            console.warn('jsdoc parse error: ', value, text);
        }
        else
        {
          tags[key][p[2]] = {
            type: p[1],
            description: p[3]
          };

          if (key == 'config')
          {
            JsDocConfigOption({
              path: this.data.path + ':' + p[2],
              type: p[1],
              description: p[3] || ''
            });
          }
        }
      }
      else if (key == 'see' || key == 'link')
      {
        if (!tags[key])
          tags[key] = [];

        tags[key].push(value);
      }
      else if (/returns?/.test(key))
      {
        key = 'returns';
        if (!tags[key])
          tags[key] = {};
        var p = value.match(/^\s*\{([^\}]+)\}(?:\s+(.+))?/i);
        if (!p)
        {
          if (typeof console != 'undefined')
            console.warn('jsdoc parse error: ', this.data.path, value, p);
        }
        else
        {
          tags[key] = {
            type: p[1],
            description: p[2]
          };
        }
      }
      else
        tags[key] = value;
    }

    delete tags.inheritDoc;
    if (tags.description.trim() == '')
      delete tags.description;

    this.set('tags', Object.keys(tags).length ? tags : null);
  }

  JsDocEntity.entityType.entityClass.extend({
    event_update: function(object, delta){
      nsData.DataObject.prototype.event_update.call(this, object, delta);
      if (this.subscriberCount && 'text' in delta)
      {
        var self = this;
        setTimeout(function(){
          self.parseText(self.data.text);
        }, 0);
      }
    },
    event_subscribersChanged: function(){
      if (this.subscriberCount && this.data.text)
      {
        var self = this;
        //debugger;
        setTimeout(function(){
          self.parseText(self.data.text);
        }, 0);
      }
    },
    parseText: function(text){
      if (this.parsedText_ != text)
      {
        this.parsedText_ = text;
        parseJsDocText.call(this, text);
      }
    }
  });

  //jsDocs = {};

  //
  // Analize object structure
  //

  map = {};
  mapDO = {};
  var members = {};
  var searchIndex = {};
  var searchValues = [];
  rootClasses = {};

  var walkThroughCount = 0;
  var clsSeed = 1;
  
  clsList = [{
    docsUid_: 0,
    docsLevel_: 0,
    docsProto_: {}
  }];

  function getClassDocsProtoDescr(cls){
    if (!cls)
      return clsList[0];

    if (!cls.docsProto_)
    {
      var superDescr = getClassDocsProtoDescr(cls.superClass_);
      var Proto = Function();
      Proto.prototype = superDescr.docsProto_;
      cls.docsUid_ = clsSeed++;
      cls.docsProto_ = new Proto;
      cls.docsSuperUid_ = superDescr.docsUid_;
      cls.docsLevel_ = superDescr.docsLevel_ + 1;
      clsList.push(cls);
    }

    return cls;
  }

  function walk(ctx){
    var scope = ctx.scope;
    var path = ctx.path || '';
    var context = ctx.context;
    var deep = 1 + (ctx.deep || 0);
    var ns = ctx.namespace || '';

    if (deep > 8)
      return window.console && console.log(path);

    members[path] = new Array();

    // new
    var isPrototype = context == 'prototype';
    if (isPrototype)
    {
      var clsPath = path.replace(/\.prototype$/, '');
      var cls = map[clsPath] && map[clsPath].obj;
      var clsProtoDescr = getClassDocsProtoDescr(cls);
      var clsProto = cls.docsProto_;
      var superClsPrototype = cls && cls.superClass_ && cls.superClass_.prototype;
    }

    var keys = context == 'namespace' ? scope.names() : scope;
    for (var key in keys)
    {
      // ignore for private names
      if (/_$/.test(key))
        continue;

      var obj = scope[key];
      
      if (   (key == 'constructor')
          || (key == 'prototype')
          //|| (key == 'init' && context == 'prototype')
          || (key == 'className' && context == 'class')
          || (key == 'subclass' && context == 'class')
          || (key == 'toString' && (Object.prototype.toString === obj || basis.Class.BaseClass.prototype.toString === obj)))
        continue;

      walkThroughCount++;

      var fullPath = path ? (path + '.' + key) : key;
      var title = key;
      var kind;
      var tag;

      if (map[fullPath])
      {
        console.log('double scan: ', fullPath);
        continue;
      }

      if (typeof obj == 'function')
      {
        if (basis.namespaces_[fullPath])
        {
          kind = 'namespace';
        }
        else
        {
          var isClass = basis.Class.isClass(obj);
          if (isPrototype)
          {
            if (isClass)   // for properties which contains ref for class
              kind = 'property';
            else
            {
              var m = title.match(/^event_(.+)/);
              if (m)
              {
                kind = 'event';
                title = m[1];
              }
              else
                kind = 'method';
            }
          }
          else
          {
            kind = isClass ? 'class' : 'function';

            if (context == 'class' && kind == 'function')
              if (obj === Function.prototype[key] || obj === basis.Class.BaseClass[key])
                continue;
          }
        }
      }
      else
      {
        if (isPrototype)
          kind = 'property';
        else
          if (obj && (obj == document || (obj.ownerDocument && obj.ownerDocument == document)))
            kind = 'htmlElement';
          else
            kind = /[^A-Z0-9\_]/.test(key) ? 'object' : 'constant';
      };

      var data = map[fullPath] = {
        //isClassMember: context == 'class',
        path: path,
        fullPath: fullPath,
        key: key,
        title: title,
        kind: kind,
        obj: obj,
        members: []
      };

      if (isPrototype)
      {
        if (superClsPrototype && key in superClsPrototype)
          tag = obj !== superClsPrototype[key] ? 'override' : null;
        else
          tag = 'implement';

        if (tag)
        {
          clsProto[key] = {
            key: key,
            cls: cls,
            obj: data,
            tag: tag
          };
        }
      }
      
      var dataObject = mapDO[fullPath] = new nsData.DataObject({
        data: data
      });
      members[path].push(dataObject);

      if (/^(function|class|constant|namespace)$/.test(kind))
      {
        if (!searchIndex[fullPath])
        {
          searchIndex[fullPath] = data;
          searchValues.push(data);
        }
      }

      // go deeper
      switch (kind)
      {
        case 'class':
          data.namespace = ns;

          /*if (obj.classMap_)
          {
            //if (window.console) console.log('>>', fullPath);
          }
          else
            obj.classMap_ = {
              childNodes: []
            };

          if (!obj.classMap_.data)
          {
            obj.classMap_.data = { path: fullPath, title: fullPath, obj: obj };
            if (obj.superClass_)
            {
              if (!obj.superClass_.classMap_)
              {
                //if (window.console) console.log('!', fullPath);
                obj.superClass_.classMap_ = { childNodes: [obj.classMap_] };
              }
              else
              {
                obj.superClass_.classMap_.childNodes.push(obj.classMap_);
              }
            }
            else
              rootClasses[fullPath] = obj;
          }*/

          //walk(obj, fullPath, kind, d + 1, ns);
          walk({
            scope: obj,
            path: fullPath,
            context: 'class',
            deep: deep,
            namespace: ns
          });
          //walk(obj.prototype, fullPath + '.prototype', 'prototype', d + 1, ns);
          walk({
            scope: obj.prototype,
            path: fullPath + '.prototype',
            context: 'prototype',
            deep: deep,
            namespace: ns
          });

        break;
        case 'namespace':
          //walk(obj, fullPath, kind, d + 1, fullPath);
          walk({
            scope: obj,
            path: fullPath,
            context: 'namespace',
            deep: deep,
            namespace: fullPath
          });

        break;
        case 'object':
          if (obj && typeof obj == 'object')
          {
            //walk(obj, fullPath, kind, d + 1, ns);
            walk({
              scope: obj,
              path: fullPath,
              context: 'object',
              deep: deep,
              namespace: ns
            });
          }
        break;
      }
    }
  }

  var buildin = {
    'Object': Object,
    'String': String,
    'Number': Number,
    'Date': Date,
    'Array': Array,
    'Function': Function,
    'Boolean': Boolean
  };

  var walkStartTime = Date.now();
  walk({
    scope: buildin,
    context: 'object'
  });  // buildin, '', 'object'

  Object.iterate(buildin, function(name, value){
    value.className = name;
    walk(value, name, 'class');
    walk(value.prototype, name + '.prototype', 'prototype');
  });

  basis.namespaces_['basis'] = basis;
  //walk(basis.namespaces_, '', 'object',0);
  walk({
    scope: basis.namespaces_,
    context: 'object'
  });
  if (typeof console != 'undefined') console.log(Date.now() - walkStartTime, '/', walkThroughCount);

  //
  // --------------------------------
  //

  function getFunctionDescription(func){
    if (typeof func == 'function' && func.className && func.prototype && typeof func.prototype.init == 'function')
      func = func.prototype.init;

    if (func.basisDocFD_)
      return func.basisDocFD_;

    var m = func.toString().match(/^\s*function(\s+\S+)?\s*\((\s*(?:\S+|\/\*[^*]+\*\/)(\s*(?:,\s*\S+|\/\*[^*]+\*\/))*\s*)?\)/);
    if (!m)
      console.log('Function parse error: ' + func.toString());

    var name = String(m[1] || 'anonymous').trim();
    var args = String(m[2] || '').replace(/\s*\,\s*/g, ', ');

    return func.basisDocFD_ = {
      name: name,
      args: args,
      fullname: name + args.quote('(')
    };
  }

  function getMembers(path){
    return members[path];
  }

  function getInheritance(cls, key){
    var result = new Array();
    var cursor = cls;

    while (cursor)
    {
      result.unshift({ cls: cursor, obj: cursor, present: !key });
      cursor = cursor.superClass_;
    }

    if (key && result.length)
    {
      var value;
      var presentCount = 0;
      for (var i = 0; i < result.length; i++)
      {
        var proto = result[i].cls.prototype;
        var present = key in proto && proto[key] !== value;
        result[i].present = present; 
        if (present)
          result[i].tag = presentCount++ ? 'override' : 'implement';
        value = proto[key];
      }
    }

    return result;
  }

  var sourceParser = {
    'jsdoc': function(resource){

      function createJsDocEntity(source, path){
        var text = source.replace(/(^|\*)\s+\@/, '@').replace(/(^|\n+)\s*\*/g, '\n').trimLeft();
        //if (path == 'basis.dom') debugger;
        //console.log(path);
        var e = JsDocEntity({
          path: path,
          text: text,
          file: resource.url,
          line: line + 1 + lineFix
        });
        //jsDocs[e.data.path] = e.data.text;
      }

      var parts = resource.text.replace(/\r\n|\n\r|\r/g, '\n').replace(/\/\*+\//g, '').split(/(?:\/\*\*((?:.|\n)+?)\*\/)/);
      var ns = '';
      var isClass;
      var clsPrefix = '';
      var skipDeclaration = false;
      var line = 0;
      var lineFix;

      parts.reduce(function(jsdoc, code, idx){
        lineFix = 0;
        if (idx % 2)
        {
          if (code.match(/@annotation/))
          {
            skipDeclaration = true;
          }
          else
          {
            jsdoc.push(code);
            var m = code.match(/@namespace\s+(\S+)/);
            if (m)
            {
              ns = m[1];
              createJsDocEntity(code, ns);
              skipDeclaration = true;
            }
            isClass = !!code.match(/@class/);
            if (isClass)
              clsPrefix = '';
          }
        }
        else
        {
          if (!skipDeclaration && idx)
          {
            var m = code.match(/^([\s\n]*)(var\s+|function\s+)?([a-z0-9\_\$\.]+)/i);
            if (m)
            {
              var name = m[3];

              lineFix = (m[1].match(/\n/g) || []).length;
              createJsDocEntity(jsdoc[jsdoc.length - 1], ns + '.' + (clsPrefix ? clsPrefix + '.prototype.' : '') + name);
              
              if (isClass)
                clsPrefix = name;
              else
                if (m[2])
                {
                  clsPrefix = '';
                }
            }
          }
          skipDeclaration = false;
        }

        line += (code.match(/\n/g) || []).length;

        return jsdoc;
      }, []);

      processAwaitingJsDocs();
    },
    'link': function(resource){
      var title = resource.text.match(/<title>(.+?)<\/title>/i);
      JsDocLinkEntity({
        title: title[1] || null,
        url: resource.url
      });
    }
  };

  var RESOURCE_ATTEMPT_LOAD = 1;
  var resourceLoader = {
    queue: [],
    loaded: {},
    curResource: null,
    transport: Function.lazyInit(function(){
      var transport = new nsAjax.Transport();

      transport.addHandler({
        failure: function(){
          var curResource = this.curResource;
          if (++curResource.attemptCount < RESOURCE_ATTEMPT_LOAD)
            this.queue.push(curResource);
        },
        success: function(req){
          var curResource = this.curResource;
          curResource.text = req.responseText;
          sourceParser[curResource.kind](curResource);
        },
        complete: function(req){
          this.curResource = null;
          TimeEventManager.add(this, 'load', Date.now() + 5);
        }
      }, resourceLoader);

      return transport;
    }),
    addResource: function(url, kind){
      urlResolver_.href = url;
      url = urlResolver_.href;
      if (!this.loaded[url])
      {
        this.queue.push({
          url: url,
          kind: kind,
          attemptCount: 0
        });

        TimeEventManager.add(resourceLoader, 'load', Date.now());
      }
    },
    load: function(){
      if (this.curResource)
        return;

      this.curResource = this.queue.shift();

      if (this.curResource)
      {
        this.transport().request(this.curResource.url);
      }
    }
  };

  basis.namespace(namespace).extend({
    JsDocEntity: JsDocEntity,
    JsDocLinkEntity: JsDocLinkEntity,
    JsDocConfigOption: JsDocConfigOption,

    resolveUrl: resolveUrl,

    buildin: buildin,
    getFunctionDescription: getFunctionDescription,
    getMembers: getMembers,
    getInheritance: getInheritance,
    loadResource: resourceLoader.addResource.bind(resourceLoader),

    Search: {
      index: searchIndex,
      values: searchValues
    }
  });

})();