// all templates map
var templates = {};


//
// add/remove functions
//

function add(id, template, instances){
  templates[id] = {
    template: template,
    instances: instances
  };
}

function remove(id){
  delete templates[id];
}


//
// resolve functions
//

function resolveInstanceById(refId){
  var templateId = refId & 0xFFF;
  var instanceId = refId >> 12;
  var templateInfo = templates[templateId];

  return templateInfo && templateInfo.instances[instanceId];
}

function resolveInfoById(refId){
  var templateId = refId & 0xFFF;
  var instanceId = refId >> 12;
  var templateInfo = templates[templateId];
  var instanceInfo = templateInfo && templateInfo.instances[instanceId];

  if (instanceInfo)
    return {
      /** @cut */ debug: instanceInfo.debug ? instanceInfo.debug() : null,
      id: refId,
      template: templateInfo.template,
      context: instanceInfo.context,
      tmpl: instanceInfo.tmpl
    };
}

function resolveTemplateById(refId){
  var templateId = refId & 0xFFF;
  var templateInfo = templates[templateId];

  return templateInfo && templateInfo.template;
}

function resolveObjectById(refId){
  var instanceInfo = resolveInstanceById(refId);

  return instanceInfo && instanceInfo.context;
}

function resolveTmplById(refId){
  var instanceInfo = resolveInstanceById(refId);

  return instanceInfo && instanceInfo.tmpl;
}

function resolveActionById(refId){
  var instanceInfo = resolveInstanceById(refId);

  return instanceInfo && {
    context: instanceInfo.context,
    action: instanceInfo.action
  };
}

/** @cut */ function getDebugInfoById(refId){
/** @cut */   var instanceInfo = resolveInstanceById(refId);
/** @cut */
/** @cut */   return instanceInfo && instanceInfo.debug && instanceInfo.debug();
/** @cut */ }


module.exports = {
  /** @cut using only in dev mode */ getDebugInfoById: getDebugInfoById,

  add: add,
  remove: remove,

  resolveInfoById: resolveInfoById,
  resolveTemplateById: resolveTemplateById,
  resolveObjectById: resolveObjectById,
  resolveTmplById: resolveTmplById,
  resolveActionById: resolveActionById
};
