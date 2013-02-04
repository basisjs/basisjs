
basis.require('basis.entity');


//
// main part
//

var Page = new basis.entity.EntityType({
  name: 'Page',
  fields: {
    filename: basis.entity.StringId,
    title: String,
    code: String,
    description: String
  }
});

 
Page.all.setSyncAction(function(){
  this.sync(basis.resource('page/index.json').fetch());
});


//
// export names
//

module.exports = Page;
