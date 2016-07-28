module.exports = function createLocalAPI(data, inspectBasis){
  var inspectBasisTemplate = inspectBasis.require('basis.template');
  var inspectBasisGroupingNode = inspectBasis.require('basis.dom.wrapper').GroupingNode;
  var fileAPI = require('../../api/file.js');

  function up(upNode){
    if (upNode && upNode.element)
      data.input.set(upNode.element);
  }

  return {
    init: function(){
      // nothing to do
    },
    openFile: function(loc){
      fileAPI.openFile(loc);
    },
    select: function(id){
      var selectNodeById = data.output.value.selectNodeById;
      if (typeof selectNodeById == 'function')
        selectNodeById(id);
    },
    upParent: function(){
      var object = data.output.value.object;
      if (object && object.parentNode)
      {
        var upNode = object.parentNode;

        if (upNode instanceof inspectBasisGroupingNode)
          upNode = upNode.owner;

        up(upNode);
      }
    },
    upOwner: function(){
      var object = data.output.value.object;
      if (object && object.owner)
        up(object.owner);
    },
    upGroup: function(){
      var object = data.output.value.object;
      if (object && object.groupNode)
        up(object.groupNode);
    },
    dropTarget: function(){
      data.input.set();
    },
    logInfo: function(){
      var object = data.output.value.object;
      var debugInfo = null;
      var values = null;

      if (data.input.value)
      {
        var info = inspectBasisTemplate.resolveInfoByNode(data.input.value);
        var objectBinding = object ? object.binding : {};

        debugInfo = info.debug || null;

        if (debugInfo)
          values = debugInfo.values || null;

        if (values)
          values = basis.object.slice(values, basis.object.keys(objectBinding));
      }

      global.$basisjsInfo = {
        object: object,
        template: {
          debugInfo: debugInfo,
          declaration: data.output.value.decl || '<no info>',
          values: values
        }
      };
      console.log(global.$basisjsInfo);
    }
  };
};
