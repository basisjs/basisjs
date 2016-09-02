var AppProfile = require('./app-profile.js');
var entity = require('basis.entity');

var FileLink = entity.createType('AppFileLink', {
  from: entity.StringId,
  to: entity.StringId
});

AppProfile.linkDataset('links', FileLink.all, function(links){
  return links.map(function(link){
    return {
      from: basis.path.resolve('/', link[0]),
      to: basis.path.resolve('/', link[1])
    };
  });
});

module.exports = FileLink;
