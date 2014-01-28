
  basis.require('app.ext.view');
  //basis.require('app.views.templateView.templatePanel');

  var TemplatePanel = resource('templatePanel.js')();

  var classList = basis.cssom.classList;
  var Template = basis.template.html.Template;

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

    satellite: {
      viewOptions: {
        instanceOf: app.ext.view.ViewOptions,
        config: function(owner){
          return {
            title: 'References',
            showMode: '',

            template: resource('template/viewOptionList.tmpl'),
            binding: {
              show: function(node){
                return node.showMode;
              }
            },
            listen: {
              selection: {
                itemsChanged: function(selection){
                  var item = selection.pick();
                  if (item)
                  {
                    this.showMode = item.showMode;
                    this.updateBind('show');
                  }
                }
              }
            },
            childNodes: [
              {
                title: 'Schematic',
                showMode: 'references'
              },
              {
                title: 'Highlight',
                showMode: 'realReferences',
                selected: true
              },
              {
                title: 'Hide',
                showMode: ''
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
