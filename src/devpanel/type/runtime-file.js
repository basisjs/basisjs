var entity = require('basis.entity');

var File = entity.createType('RuntimeFile', {
  filename: entity.StringId,
  resolved: Boolean
});

module.exports = File;
