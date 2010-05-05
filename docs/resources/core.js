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
      tags: Function.$self
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

        if (/class|property|method/.test(objInfo.kind))
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
          if (key == 'param')
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
          else
          if (key == 'returns')
          {
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
          else
            tags[key] = value;
        }
        this.set('tags', tags);
      }
      return res;
    }
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
  function walk(scope, path, context, d){
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
        if (obj.classMap_)
        {
          if (window.console) console.log('>>', objPath);
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
            if (window.console) console.log('!', objPath);
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
        walk(obj, objPath, kind, d+1);
      }
      
      if (kind == 'object' && typeof obj == 'object')
      {
        walk(obj, objPath, kind, d+1);
      }

      if (kind == 'class')
      {
        walk(obj, objPath, kind, d+1);
        walk(obj.prototype, objPath + '.prototype', 'prototype', d+1);
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

  Basis.namespace(namespace).extend({
    JsDocEntity: JsDocEntity,
    processAwaitingJsDocs: processAwaitingJsDocs,
    walk: walk,
    getFunctionDescription: getFunctionDescription,
    getMembers: getMembers,
    getInheritance: getInheritance
  });

})();