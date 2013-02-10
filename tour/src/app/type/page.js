
basis.require('basis.entity');


//
// main part
//

var Page = new basis.entity.EntityType({
  name: 'Page',
  fields: {
    filename: basis.entity.StringId,
    html: String,
    title: basis.entity.CalculateField('filename', 'html', function(filename, html){
      var m = html.match(/<h1>((?:[\r\n]|.)*)<\/h1>/);
      return m ? m[1] : filename;
    }),
    code: basis.entity.CalculateField('html', function(html){
      var m = html.match(/<pre id="sourceCode">((?:[\r\n]|.)*)<\/pre>/);
      return m ? m[1] : '';
    }),
    description: String
  }
});

Page.entityType.entityClass.extend({
  state: basis.data.STATE.UNDEFINED,
  syncAction: function(){
    var content = basis.resource('page/' + this.data.filename).fetch();
    this.set('html', content);
  }
});
 
Page.all.setSyncAction(function(){
  this.sync(basis.resource('page/index.json').fetch());
});


//
// export names
//

module.exports = Page;
