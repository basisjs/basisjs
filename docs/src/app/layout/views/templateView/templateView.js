
  var View = require('app.ext.view').View;
  var ViewOptions = require('app.ext.view').ViewOptions;
  var TemplatePanel = require('./templatePanel.js');
  var Template = require('basis.template.html').Template;

  function hasTemplate(node){
    return node.data.obj &&
           node.data.obj.prototype &&
           node.data.obj.prototype.template instanceof Template;
  }

  //
  // exports
  //
  module.exports = new View({
    title: 'Template',
    viewHeader: 'Template',
    isAcceptableObject: function(data){
      return hasTemplate({ data: data });
    },

    template: resource('./template/templateView.tmpl'),
    binding: {
      template: 'satellite:'
    },

    satellite: {
      viewOptions: {
        instance: ViewOptions,
        config: function(owner){
          return {
            title: 'References',
            showMode: '',

            template: resource('./template/viewOptionList.tmpl'),
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
        instance: TemplatePanel
      }
    }
  });
