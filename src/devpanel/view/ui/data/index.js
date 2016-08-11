var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisUI = inspectBasis.require('basis.ui');

var Value = require('basis.data').Value;
var DataObject = require('basis.data').Object;
var Dataset = require('basis.data').Dataset;

var input = new Value();
var output = new Value();
var instanceMap = {};
var allInstances = new Dataset();
var updateInfoQueue = {};
var updateInfoTimer_ = null;
var deltaUpdated = {};
var deltaDeleted = [];

var config = { instance: null, data: null };
var updateObj = {
  parent: null,
  childIndex: -1,
  satelliteName: null,
  groupNode: null,
  grouping: null,
  role: null
};

function updateInfo(){
  var queue = updateInfoQueue;
  var models = [];

  updateInfoQueue = {};
  updateInfoTimer_ = null;

  //console.log('updateInfo');

  for (var id in queue)
  {
    var instance = instanceMap[id].instance;
    if (instance.firstChild)
      instance.childNodes.forEach(function(child){
        var id = child.basisObjectId;
        if (id in instanceMap)
          queue[id] = true;
      });
  }

  for (var id in queue)
  {
    var model = instanceMap[id];
    var instance = model.instance;
    var parent = instance.parentNode || instance.owner;
    var roleGetter = instance.binding && instance.binding.$role;

    updateObj.parent = parent && parent.basisObjectId;  // reuse updateObj to less GC
    updateObj.groupNode = instance.groupNode && instance.groupNode.basisObjectId;  // reuse updateObj to less GC
    updateObj.grouping = instance.grouping && instance.grouping.basisObjectId;
    updateObj.satelliteName = instance.ownerSatelliteName;
    updateObj.role = roleGetter && typeof roleGetter.getter == 'function' ? roleGetter.getter(instance) : null;

    updateObj.childIndex = !updateObj.satelliteName && parent
      ? parent.childNodes.indexOf(instance)
      : -1;

    if (model.update(updateObj))
      deltaUpdated[id] = model.data;
    models.push(model);
  }

  deltaUpdated = basis.object.values(deltaUpdated);
  if (deltaUpdated.length || deltaDeleted.length)
    output.set({
      type: 'delta',
      updated: deltaUpdated,
      deleted: deltaDeleted
    });

  deltaUpdated = {};
  deltaDeleted = [];

  allInstances.add(models);
}

function processEvent(event){
  var instance = event.instance;
  var id = instance.basisObjectId;

  switch (event.action)
  {
    case 'create':
      // reuse config for less garbage
      config.instance = instance;
      config.data = {
        id: id,
        className: instance.constructor.className || '',
        loc: inspectBasis.dev.getInfo(instance, 'loc') || null,
        parent: null,
        childIndex: -1,
        satelliteName: null,
        groupNode: null,
        grouping: null,
        role: null
      };

      var model = new DataObject(config);

      instanceMap[id] = model;
      deltaUpdated[id] = model.data;

      updateInfoQueue[id] = true;
      if (!updateInfoTimer_)
        updateInfoTimer_ = basis.setImmediate(updateInfo);

      break;

    case 'destroy':
      var model = instanceMap[id];

      delete instanceMap[id];
      delete updateInfoQueue[id];
      delete deltaUpdated[id];
      deltaDeleted.push(id);

      model.instance = null;
      model.destroy();

      break;
  }
}

inspectBasisUI.GroupingNode.prototype.debug_emit =
inspectBasisUI.Node.prototype.debug_emit = function(event){
  var id = event.sender.basisObjectId;

  if (id in instanceMap)
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
  map: instanceMap,
  instances: allInstances,
  input: input,
  output: input
    .link(output, function(payload){
      // init will send the same data, but nothing happen
      this.set(null);
      this.set(payload);
    })
    // use stringify/parse since doesn't group nodes in local mode otherwise
    .as(JSON.stringify)
    .as(JSON.parse),
  init: function(){
    updateInfo();

    return {
      type: 'init',
      instances: basis.object.iterate(instanceMap, function(id, model){
        return model.data;
      })
    };
  }
};
