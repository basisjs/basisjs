basis.ready(function(){
  var Node = basis.require('basis.ui').Node;
  var highlight = basis.require('basis.utils.highlight');

  var mainView = new Node({
    container: document.body,
    template: basis.resource('../res/demo.tmpl'),
    binding: {
      title: function(){
        return document.title;
      },
      content: function(){
        return document.getElementById('demo-container');
      },
      sourceCode: 'satellite:'
    },
    satellite: {
      sourceCode: {
        existsIf: function(){
          return !!document.getElementById('demo-javascript');
        },
        instanceOf: Node,
        config: function(){
          return {
            template: basis.resource('../res/sourceCode.tmpl'),
            action: {
              toggleCode: function(){
                this.sourceVisible = !this.sourceVisible;

                if (!this.code)
                {
                  highlight.useStyle();
                  this.code = highlight.highlight(document.getElementById('demo-javascript').innerHTML, 'js');
                  this.updateBind('code');
                }

                this.updateBind('sourceVisible');
                this.updateBind('toggleText');
              }
            },
            sourceVisible: false,
            binding: {
              code: 'code',
              sourceVisible: function(node){
                return node.sourceVisible ? 'sourceVisible' : '';
              },
              toggleText: function(node){
                return node.sourceVisible ? 'Hide source code' : 'Show source code';
              }
            }
          };
        }
      }
    }
  });
});
