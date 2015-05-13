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

function resolveTemplateById(refId){
  var templateId = refId & 0xFFF;
  var object = templates[templateId];

  return object && object.template;
}

function resolveInstanceById(refId){
  var templateId = refId & 0xFFF;
  var instanceId = refId >> 12;
  var object = templates[templateId];

  return object && object.instances[instanceId];
}

function resolveObjectById(refId){
  var templateRef = resolveInstanceById(refId);

  return templateRef && templateRef.context;
}

function resolveTmplById(refId){
  var templateRef = resolveInstanceById(refId);

  return templateRef && templateRef.tmpl;
}

function resolveActionById(refId){
  var templateRef = resolveInstanceById(refId);

  return templateRef && {
    context: templateRef.context,
    action: templateRef.action
  };
}

/** @cut */ function getDebugInfoById(refId){
/** @cut */   var templateRef = resolveInstanceById(refId);
/** @cut */
/** @cut */   return templateRef && templateRef.debug && templateRef.debug();
/** @cut */ }


module.exports = {
  /** @cut using only in dev mode */ getDebugInfoById: getDebugInfoById,

  add: add,
  remove: remove,

  resolveActionById: resolveActionById,
  resolveTemplateById: resolveTemplateById,
  resolveObjectById: resolveObjectById,
  resolveTmplById: resolveTmplById
};
