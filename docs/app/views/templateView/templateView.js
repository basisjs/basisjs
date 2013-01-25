
  basis.require('app.ext.view');
  //basis.require('app.views.templateView.templatePanel');

  var TemplatePanel = resource('templatePanel.js')();

  var classList = basis.cssom.classList;
  var Template = basis.html.Template;

  function hasTemplate(node){
    return node.data.obj && node.data.obj.prototype && node.data.obj.prototype.template instanceof Template;
  }

  //
  // exports
  //
  module.exports = new app.ext.view.View({
    title: 'Template',
    viewHeader: 'Template',
    isAcceptableObject: function(data){
      return hasTemplate({ data: data });
    },

    template: resource('template/templateView.tmpl'),

    binding: {
      template: 'satellite:'
    },

    satelliteConfig: {
      viewOptions: {
        instanceOf: app.ext.view.ViewOptions,
        config: function(owner){
          var contentClassList = classList(owner.tmpl.content, 'show');

          return {
            title: 'References',
            childNodes: [
              {
                title: 'Schematic',
                onselect: function(){
                  contentClassList.set('references');
                }
              },
              {
                title: 'Highlight',
                selected: true,
                onselect: function(){
                  contentClassList.set('realReferences');
                }
              },
              {
                title: 'Hide',
                onselect: function(){
                  contentClassList.clear();
                }
              }
            ]
          };
        }
      },
      template: {
        existsIf: hasTemplate,
        delegate: basis.fn.$self,
        instanceOf: TemplatePanel
      }
    }
  });
