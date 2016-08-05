function up(data, upNode){
  if (upNode && upNode.element)
    data.input.set(upNode.element);
}

module.exports = require('api').define('template', {
  select: function(data){
    return function(id){
      var selectNodeById = data.output.value.selectNodeById;
      if (typeof selectNodeById == 'function')
        selectNodeById(id);
    };
  },
  upParent: function(data, inspectBasis){
    var inspectBasisGroupingNode = inspectBasis.require('basis.dom.wrapper').GroupingNode;

    return function(){
      var object = data.output.value.object;
      if (object && object.parentNode)
      {
        var upNode = object.parentNode;

        if (upNode instanceof inspectBasisGroupingNode)
          upNode = upNode.owner;

        up(data, upNode);
      }
    };
  },
  upOwner: function(data){
    return function(){
      var object = data.output.value.object;
      if (object && object.owner)
        up(data, object.owner);
    };
  },
  upGroup: function(data){
    return function(){
      var object = data.output.value.object;
      if (object && object.groupNode)
        up(data,object.groupNode);
    };
  },
  dropTarget: function(data){
    return function(){
      data.input.set();
    };
  },
  logInfo: function(data, inspectBasis){
    var inspectBasisTemplate = inspectBasis.require('basis.template');

    return function(){
      var object = data.output.value.object;
      var debugInfo = null;
      var values = null;

      if (data.input.value)
      {
        var info = inspectBasisTemplate.resolveTemplateInfoByNode(data.input.value);
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
    };
  }
});
