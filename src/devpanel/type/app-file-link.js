var AppProfile = require('./app-profile.js');
var entity = require('basis.entity');

var FileLink = entity.createType('AppFileLink', {
  from: entity.StringId,
  to: entity.StringId
});

AppProfile.linkDataset('links', FileLink.all, function(links){
  return links.map(function(link){
    return {
      from: link[0],
      to: link[1]
    };
  });
});

module.exports = FileLink;
