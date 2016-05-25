/**
* Returns delta object
* @param {Array.<basis.data.Object>} inserted
* @param {Array.<basis.data.Object>} deleted
* @return {object|boolean}
*/
module.exports = function getDelta(inserted, deleted){
  var delta = {};
  var result;

  if (inserted && inserted.length)
    result = delta.inserted = inserted;

  if (deleted && deleted.length)
    result = delta.deleted = deleted;

  if (result)
    return delta;
};
