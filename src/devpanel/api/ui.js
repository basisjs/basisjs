var basisData = require('basis.data');
var DataObject = basisData.Object;
var Dataset = basisData.Dataset;

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisUI = inspectBasis.require('basis.ui');

var instances = {};
var updateInfoQueue = {};
var updateInfoTimer_ = null;

var config = { data: null };
var updateObj = { parent: null, satelliteName: null, groupNode: null, grouping: null };

var allInstances = new Dataset();

function updateInfo(){
  var queue = updateInfoQueue;
  var models = [];

  updateInfoQueue = {};
  updateInfoTimer_ = null;

  //console.log('updateInfo');

  for (var id in queue)
  {
    var instance = instances[id].data.instance;
    if (instance.firstChild)
      instance.childNodes.forEach(function(child){
        var id = child.basisObjectId;
        if (id in instances)
          queue[id] = true;
      });
  }

  for (var id in queue)
  {
    var model = instances[id];
    var instance = model.data.instance;
    var parent = instance.parentNode || instance.owner;

    updateObj.parent = parent && parent.basisObjectId;  // reuse updateObj to less GC
    updateObj.groupNode = instance.groupNode && instance.groupNode.basisObjectId;  // reuse updateObj to less GC
    updateObj.grouping = instance.grouping && instance.grouping.basisObjectId;
    updateObj.satelliteName = instance.ownerSatelliteName;

    instances[id].update(updateObj);
    models.push(model);
  }

  allInstances.add(models);
}

function processEvent(event){
  var instance = event.instance;
  var id = instance.basisObjectId;
  switch (event.action)
  {
    case 'create':
      //console.log('create', id);

      // reuse config for less garbage
      config.data = {
        id: id,
        instance: instance,
        parent: null
      };

      instances[id] = new DataObject(config);

      updateInfoQueue[id] = true;
      if (!updateInfoTimer_)
        updateInfoTimer_ = basis.setImmediate(updateInfo);

      break;

    case 'destroy':
      //console.log('destroy', id);

      var model = instances[id];
      delete instances[id];
      delete updateInfoQueue[id];
      model.destroy();

      break;
  }
}

inspectBasisUI.GroupingNode.prototype.debug_emit =
inspectBasisUI.Node.prototype.debug_emit = function(event){
  var id = event.sender.basisObjectId;

  if (id in instances)
    updateInfoQueue[id] = true;

  if (!updateInfoTimer_)
    updateInfoTimer_ = basis.setImmediate(updateInfo);
};

inspectBasisUI.debug_notifier.attach(processEvent);
inspectBasisUI.debug_getInstances().map(function(instance){
  processEvent({
    action: 'create',
    instance: instance
  });
});

module.exports = {
  instanceMap: instances,
  instances: allInstances
};
