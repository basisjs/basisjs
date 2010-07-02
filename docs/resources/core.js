(function(){

  var namespace = 'BasisDoc.Core';

  var Data = Basis.Data;
  var nsEntity = Basis.Entity;

  var JsDocEntity = new nsEntity.EntityType({
    name: 'JsDocEntity',
    id: 'path',
    fields: {
      path: String,
      text: String,
      context: String,
      tags: Function.$self
    }
  });
  var JsDocLinkEntity_UrlResolver = document.createElement('A');
  var JsDocLinkEntity = new nsEntity.EntityType({
    name: 'JsDocLinkEntity',
    id: 'url',
    fields: {
      url: function(value){
        if (value)
        {
          JsDocLinkEntity_UrlResolver.href = value.replace(/^\.\//, '../');
          return JsDocLinkEntity_UrlResolver.href;
        }
        else
          return value;
      },
      title: function(value){ return value != null ? String(value) : null; }
    }
  });

  awaitingForUpdate = {};

  function fetchInheritedJsDocs(path, entity){
    var objPath = path;
    var objInfo = map[objPath];
    if (/class|property|method/.test(objInfo.kind))
    {
      var postPath = objInfo.kind == 'class' ? '' : '.prototype.' + objInfo.title;
      var inheritance = getInheritance(objInfo.kind == 'class' ? objInfo.obj : map[objInfo.path.replace(/.prototype$/, '')].obj, objInfo.kind == 'class' ? null : objInfo.title);
      for (var i = inheritance.length, inherit; inherit = inheritance[--i];)
      {
        //console.log(inherit.cls.className + postFix);
        var inheritedEntity = JsDocEntity.get(inherit.cls.className + postPath);
        if (inheritedEntity && inheritedEntity.value.text)
        {
          entity.set('text', inheritedEntity.value.text);
          return true;
        }
      }
      //console.log(inheritance);
    }
  }
  
  function processAwaitingJsDocs(){
    var keys = Object.keys(awaitingForUpdate);
    for (var k = 0; k < keys.length; k++)
    {
      var objPath = keys[k];
      var awaitingEntity = awaitingForUpdate[objPath];
      if (fetchInheritedJsDocs(objPath, awaitingEntity))
        delete awaitingForUpdate[objPath];
    }
  }

  JsDocEntity.entityType.entityClass.extend({
    init: function(){
      this.inherit.apply(this, arguments);
      if (this.value.text == '')
      {
        var objPath = this.value.path;
        var objInfo = map[objPath];

        if (objInfo && /class|property|method/.test(objInfo.kind))
        {
          if (!fetchInheritedJsDocs(objPath, this))
          {
            awaitingForUpdate[this.value.path] = this;
          }
        }
      }
    },
    set: function(key, value){
      var res = this.inherit.apply(this, arguments);
      if (res && res.key == 'text')
      {
        var parts = this.value.text.split(/\s*\@([a-z]+)\s*/i);
        var tags = {};
        parts.unshift('description');
        for (var i = 0, key; key = parts[i]; i += 2)
        {
          var value = parts[i + 1];
          if (key == 'param' || key == 'config')
          {
            if (!tags[key])
              tags[key] = {};
            var p = value.match(/^\s*\{([^\}]+)\}\s+(\S+)(?:\s+(.+))?/i);
            if (!p)
            {
              if (typeof console != 'undefined')
                console.warn('jsdoc parse error: ', value, p);
            }
            else
            {
              tags[key][p[2]] = {
                type: p[1],
                description: p[3]
              };
            }
          }
          else if (key == 'link')
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
                console.warn('jsdoc parse error: ', this.value.path, value, p);
            }
            else
            {
              tags[key] = {
                type: p[1],
                description: p[2]
              };
            }
          }
          /*else if (key == 'type')
          {
            var typ = value.match(/\{([^}]+)\}/)[1];
            var ref = map[typ];
            if (ref && ref.kind == 'class')
            {
              var obj = map[this.value.path];
              var objHolder = map[this.value.path.replace(/\.prototype\.[a-z0-9\_]+$/i, '')];
              //if (/childClass/.test(this.value.path)) debugger;
              if (obj && obj.kind == 'property')
              {
                console.log(this.value.path + ': ' + objHolder.objPath + ' -' + obj.title + '-> ' + ref.objPath);
              }
            }
            tags[key] = value;
          }*/
          else
            tags[key] = value;
        }

        delete tags.inheritDoc;
        if (tags.description.trim() == '')
          delete tags.description;

        this.set('tags', Object.keys(tags).length ? tags : null);
      }
      return res;
    }
  });

  JsDocLinkEntity.entityType.entityClass.extend({
    set: function(){
      var res = this.inherit.apply(this, arguments);
      if (res && res.key == 'url')
      {
        resourceLoader.addResource(this.value.url, 'link');
      }
    },
  });

  jsDocs = {};

  map = {};
  charMap = {};
  members = {};
  asd = [];
  searchIndex = {};
  searchValues = [];
  rootClasses = {};

  cnt = 0;
  function walk(scope, path, context, d, ns){
    if (d > 8)
      return window.console && console.log(path);

    members[path] = new Array();

    var keys = context == 'namespace' ? scope.names() : scope;
    for (var key in keys)
    {
      // ignore for private names
      var lastChar = key.charAt(key.length - 1);
      if (lastChar == '_')
        continue;

      var obj = scope[key];
      
      if (   (key == 'constructor')
          || (key == 'prototype')
          || (key == 'init' && context == 'prototype')
          || (key == 'className' && context == 'class')
          || (key == 'toString' && (Object.prototype.toString === obj || Basis.Class.BaseClass.prototype.toString === obj)))
        continue;

      cnt++;

      var objPath = path ? (path + '.' + key) : key;
      var kind;

      if (map[objPath])
        continue;

      switch (typeof obj){
        case 'function':
          if (Basis.namespaces_[objPath])
            kind = 'namespace';
          else
          {
            if (context == 'prototype')
            {
              if (obj.className)
                kind = 'property';
              else
                kind = 'method';
            }
            else
              if (obj.className)
                kind = 'class';
              else
                kind = 'function';
          }
        break;
        default:
          if (context == 'prototype')
            kind = 'property';
          else
            if (obj && (obj == document || (obj.ownerDocument && obj.ownerDocument == document)))
              kind = 'htmlElement';
            else
              kind = key.match(/[^A-Z0-9\_]/) ? 'object' : 'constant';
      };

      if (context == 'class' && kind == 'function')
        if (obj === Function.prototype[key] || obj === Basis.Class.BaseClass[key])
          continue;

      var firstChar = key.charAt(0).toLowerCase();
      if (!charMap[firstChar])
        charMap[firstChar] = [];

      var info = map[objPath] = {
        isClassMember: context == 'class',
        path: path,
        objPath: objPath,
        title: key,
        kind: kind,
        obj: obj
      };

      if (kind == 'function' || kind == 'class' || kind == 'constant' || kind == 'namespace')
      {
        if (!searchIndex[objPath])
        {
          searchIndex[objPath] = info;
          searchValues.push(info);
        }
      }

      members[path].push(info);
      charMap[firstChar].push(info);

      if (kind == 'class')
      {
        info.namespace = ns;

        if (obj.classMap_)
        {
          //if (window.console) console.log('>>', objPath);
        }
        else
          obj.classMap_ = {
            childNodes: []
          };

        if (!obj.classMap_.info)
        {
          obj.classMap_.info = { path: objPath, title: objPath, obj: obj };
          if (obj.superClass_)
          {
            if (!obj.superClass_.classMap_)
            {
              //if (window.console) console.log('!', objPath);
              obj.superClass_.classMap_ = { childNodes: [obj.classMap_] };
            }
            else
            {
              obj.superClass_.classMap_.childNodes.push(obj.classMap_);
            }
          }
          else
            rootClasses[objPath] = obj;
          asd.push(objPath);
        }  
      }

      if (kind == 'namespace')
      {
        walk(obj, objPath, kind, d+1, objPath);
      }
      
      if (kind == 'object' && typeof obj == 'object')
      {
        walk(obj, objPath, kind, d+1, ns);
      }

      if (kind == 'class')
      {
        walk(obj, objPath, kind, d+1, ns);
        walk(obj.prototype, objPath + '.prototype', 'prototype', d+1, ns);
      }
    }
  }

  function getFunctionDescription(func){
    if (typeof func == 'function' && func.className && func.prototype && typeof func.prototype.init == 'function')
      func = func.prototype.init;

    var m = func.toString().match(/^\s*function(\s+\S+)?\s*\((\s*(?:\S+|\/\*[^*]+\*\/)(\s*(?:,\s*\S+|\/\*[^*]+\*\/))*\s*)?\)/);
    if (!m)
      console.log('Function parse error: ' + func.toString());

    var result = {
      name: String(m[1] || 'anonymous').trim(),
      args: String(m[2] || '').replace(/\s*\,\s*/g, ', ')
    };

    result.fullname = result.name + result.args.quote('(');
    
    return result;
  }

  function getMembers(path){
    return (members[path] || []).map(Data.wrapper('info'));
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

  var sourceKindParser = {
    'jsdoc': function parseSource(resource){

      function createJsDocEntity(source, path){
        text = source.replace(/(^|[\r\n]+)\s*\*[\t ]*/g, '\n').trimLeft();
        var e = JsDocEntity({
          path: path,
          text: text
        });
        jsDocs[e.value.path] = e.value.text;
      }

      var parts = resource.text.replace(/\/\*+\//g, '').split(/(?:\/\*\*((?:.|[\r\n])+?)\*\/)/m);
      var ns = '';
      var isClass;
      var clsPrefix = '';

      parts.reduce(function(jsdoc, code, idx){
        if (idx % 2)
        {
          jsdoc.push(code);
          var m = code.match(/@namespace\s+(\S+)/);
          if (m)
          {
            ns = m[1];
            createJsDocEntity(code, ns);
          }
          var m = code.match(/@class/);
          isClass = !!m;
          if (isClass)
            clsPrefix = '';
        }
        else
          if (idx)
          {
            var m = code.match(/\s*(var\s+)?(function\s+)?([a-z0-9\_\$]+)/i);
            if (m)
            {
                //console.log(m);
                //console.log(ns, clsPrefix, isClass);
              //console.log(m[1], jsdoc.last());
              createJsDocEntity(jsdoc.last(), ns + '.' + (clsPrefix ? clsPrefix + '.prototype.' : '') + m[3]);
              
              if (isClass)
                clsPrefix = m[3];
              else
                if (m[1] || m[2])
                {
                  clsPrefix = '';
                }
            }
          }
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
      //console.log('Link loaded: ', resource.text.length);
    }
  };

  var resourceLoader = {
    queue: [],
    loaded: {},
    curResource: null,
    urlResolver: document.createElement('A'),
    transport: new Basis.Ajax.Transport({
      callback: {
        failure: function(){
          resourceLoader.curResource.attemptCount++;
          if (resourceLoader.curResource.attemptCount < 3)
            resourceLoader.queue.push(resourceLoader.curResource);
        },
        complete: function(req){
          var res = resourceLoader.curResource;
          res.text = req.responseText;
          sourceKindParser[res.kind](res);

          resourceLoader.curResource = null;

          setTimeout(function(){
            resourceLoader.load();
          }, 5);
        }
      }
    }),
    addResource: function(url, kind){
      this.urlResolver.href = url;
      url = this.urlResolver.href;
      if (!this.loaded[url])
      {
        this.queue.push({
          url: url,
          kind: kind,
          attemptCount: 0
        });

        this.load();
      }
    },
    load: function(){
      if (this.curResource)
        return;

      this.curResource = this.queue.shift();

      if (this.curResource)
        this.transport.request(this.curResource.url);
    }

  };

  Basis.namespace(namespace).extend({
    JsDocEntity: JsDocEntity,
    JsDocLinkEntity: JsDocLinkEntity,
    processAwaitingJsDocs: processAwaitingJsDocs,
    walk: walk,
    getFunctionDescription: getFunctionDescription,
    getMembers: getMembers,
    getInheritance: getInheritance,
    loadResource: resourceLoader.addResource.bind(resourceLoader)
  });

})();