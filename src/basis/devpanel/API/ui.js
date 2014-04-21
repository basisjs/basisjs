basis.require('basis.ui');

var instances = {};
var rootInstances = {};
var updateInfoQueue = {};
var updateInfoTrigger = (new basis.Token).deferred();

function updateInfo(instance){
  var queue = updateInfoQueue;
  updateInfoQueue = {};
  console.log('updateInfo');
  for (var id in queue)
  {
    var instance = instances[id];
    if (!instance.parentNode && !instance.owner)
      rootInstances[id] = instance;
    else
      delete rootInstances[id];
  }
}

function processEvent(event){
  var instance = event.instance;
  var id = instance.basisObjectId;
  switch (event.action)
  {
    case 'create':
      console.log('create', instance.basisObjectId);

      instances[id] = instance;
      updateInfoQueue[id] = true;
      updateInfoTrigger.set(instance);

      break;

    case 'destroy':
      console.log('destroy', id);

      delete instances[id];
      delete rootInstances[id];
      delete updateInfoQueue[id];

      break;
  }
}

basis.ui.debug_getInstances().map(function(instance){
  processEvent({
    action: 'create',
    instance: instance
  });
});
basis.ui.debug_notifier.attach(processEvent);
updateInfoTrigger.attach(updateInfo);

window.rootInstances = rootInstances;
