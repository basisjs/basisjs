basis.require('basis.dom.wrapper');

var Node = basis.dom.wrapper.Node;

function getGroups(node, withNull){
  var res = basis.array.from(node.grouping.childNodes);
  if (withNull)
    res.unshift(node.grouping.nullGroup);
  return res;
}

function checkOrder(nodes, host){
  var sortingValue = host.sorting;
  var desc = host.sortingDesc;

  for (var i = 0; i < nodes.length; i++)
    if (nodes[i].sortingValue !== (sortingValue(nodes[i]) || 0))
      return 'Bad sortingValue';

  if (!desc)
  {
    for (var i = 0; i < nodes.length - 1; i++)
      if (nodes[i].sortingValue > nodes[i + 1].sortingValue)
        return 'Wrong order';
  }
  else
  {
    for (var i = 0; i < nodes.length - 1; i++)
      if (nodes[i].sortingValue < nodes[i + 1].sortingValue)
        return 'Wrong order';
  }
}

function checkNode(node){
  var res;

  if (node.childNodes)
  {
    var childCount = node.childNodes.length;

    if (node.firstChild !== (node.childNodes[0] || null))
      return 'Wrong firstChild ref';
    if (node.lastChild !== (node.childNodes[childCount - 1] || null))
      return 'Wrong lastChild ref';

    for (var i = 0; i < childCount; i++)
    {
      var child = node.childNodes[i];

      if (child.parentNode !== node)
        return 'child #' + i + ' has wrong parentNode ref';

      if (i > 0)
      {
        if (child.previousSibling !== node.childNodes[i - 1])
        {
          return 'child #' + i + ' has wrong previousSibling ref';
        }
      }
      else
      {
        if (child.previousSibling !== null)
          return 'child #' + i + ' has wrong previousSibling ref, should be a null';
      }

      if (i < childCount - 1)
      {
        if (child.nextSibling !== node.childNodes[i + 1])
          return 'child #' + i + ' has wrong nextSibling ref';
      }
      else
      {
        if (child.nextSibling !== null)
          return 'child #' + i + ' has wrong nextSibling ref, should be a null';
      }
      //if (child.document != node.document)
      //  return 'child #' + i + ' has wrong document ref';
    }

    if (node.sorting !== basis.fn.nullGetter)
    {
      if (node.grouping)
      {
        var groups = getGroups(node, true);
        for (var i = 0; i < groups.length; i++)
          if (res = checkOrder(groups[i].nodes, node))
            return 'Sorting in group: ' + res;
      }
      else
        if (res = checkOrder(node.childNodes, node))
          return 'Sorting: ' + res;
    }

    if (node.grouping)
    {
      if (res = checkNode(node.grouping))
        return res;

      var groups = getGroups(node, true);
      for (var i = 0; i < groups.length; i++)
      {
        if (res = checkNode(groups[i]))
          return 'group #' + i + ': ' + res;
      }

      for (var i = 0, k = 0, group; group = groups[i++];)
        for (var j = 0, groupNode; groupNode = group.nodes[j++];)
          if (node.childNodes[k++] !== groupNode)
            return 'Wrong order: childs not reflect groups order';

      if (k != childCount)
      {
        return 'Count of child in groups (' + k + ') is not equal to child count (' + childCount + ')';
      }

      var childNodes = basis.array.from(node.childNodes);

      // check for child groupNode reference
      for (var i = 0, child; child = node.childNodes[i++];)
        if (node.grouping.getGroupNode(child, true) !== child.groupNode)
          return 'child node has wrong groupNode ref';

      // after getGroupNode node.childNodes and groups should not be changed
      var currentGroups = getGroups(node, true);

      if (childCount !== node.childNodes.length)
        return 'childNodes broken after getGroupNode for childs';
      if (currentGroups.length !== groups.length)
        return 'groups broken after getGroupNode for childs';

      for (var i = 0; i < childNodes.length; i++)
        if (childNodes[i] !== node.childNodes[i])
          return 'childNodes broken after getGroupNode for childs';

      for (var i = 0; i < groups.length; i++)
        if (groups[i] !== currentGroups[i])
          return 'groups broken after getGroupNode for childs';
    }
    else
    {
      for (var i = 0, child; child = node.childNodes[i++];)
        if (child.groupNode !== null)
          return 'child node has wrong groupNode ref, should be a null';
    }
  }
  else
  {
    if (node.firstChild !== null)
      return 'Wrong firstChild ref';
    if (node.lastChild !== null)
      return 'Wrong lastChild ref';
  }

  if (node.dataSource !== null && node.dataSource instanceof basis.data.AbstractDataset === false)
    return 'dataSource has wrong value (should be null or instance of basis.data.AbstractDataset)';

  if (node.dataSource)
  {
    if (node.dataSource.itemCount !== node.childNodes.length)
      return 'child node count (' + node.childNodes.length + ') is not equal to dataset item count (' + node.dataSource.itemCount + ')';

    for (var i = 0, child; child = node.childNodes[i]; i++)
    {
      if (!child.delegate)
        return 'child #' + i + ' has not delegate to dataSource member';

      if (!node.dataSource.has(child.delegate))
        return 'child #' + i + ' delegate not found in dataSource';
    }
  }

  if (node instanceof basis.dom.wrapper.GroupingNode)
  {
    if (node.owner && node.owner.grouping !== node)
        return 'wrong GroupingNode.owner ref';
  }

  if (node instanceof basis.dom.wrapper.PartitionNode)
  {
    if (!node.nodes)
      return 'PartitionNode has no child nodes';

    var nodeCount = node.nodes.length;

    if (nodeCount)
    {
      if (node.first !== node.nodes[0])
        return 'wrong PartitionNode.first ref';

      if (node.last !== node.nodes[nodeCount - 1])
        return 'wrong PartitionNode.last ref';

      var hostNode = node.first.parentNode;
      var childNodesIndex = hostNode.childNodes.indexOf(node.first);

      for (var i = 0; i < node.nodes.length; i++)
        if (node.nodes[i] !== hostNode.childNodes[childNodesIndex + i])
          return 'wrong PartitionNode.nodes order';
    }
    else
    {
      if (node.first !== null)
        return 'wrong PartitionNode.first ref, should be a null';

      if (node.last !== null)
        return 'wrong PartitionNode.last ref, should be a null';
    }
  }

  if (node.owner)
  {
    if (node.owner instanceof basis.dom.wrapper.AbstractNode == false)
      return 'owner has bad type (should be an basis.dom.wrapper.AbstractNode instance)';
    if (node.ownerSatelliteName)
    {
      if (node.owner.satellite[node.ownerSatelliteName] !== node)
        return 'bad value for ownerSatelliteName property, owner has no satellite with that name - `' + node.ownerSatelliteName + '`';
    }
  }
  else
  {
    if (node.ownerSatelliteName)
      return 'node should not has value for ownerSatelliteName property with no owner';
  }

  if (node.satellite)
  {
    for (var name in node.satellite)
      if (name != '__auto__')
      {
        var satellite = node.satellite[name];

        if (satellite instanceof basis.dom.wrapper.AbstractNode == false)
          return 'satellite `' + name + '` has bad type (should be an basis.dom.wrapper.AbstractNode instance)';

        if (satellite.owner !== node)
          return 'satellite `' + name + '` has wrong owner reference';

        if (satellite.ownerSatelliteName !== name)
          return 'satellite `' + name + '` has bad value for ownerSatelliteName property';
      }
  }

  return false;
}

module.exports = {
  getGroups: getGroups,
  checkNode: checkNode
};
