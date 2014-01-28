basis.ready(function(){
  basis.require('basis.ui');
  basis.require('basis.utils.highlight');

  new basis.ui.Node({
    container: document.body,
    content: document.getElementById('demo-container'),
    template: basis.resource('../res/demo.tmpl'),
    binding: {
      sourceCode: 'satellite:',
      title: function(){
        return document.title;
      }
    },
    satellite: {
      sourceCode: {
        existsIf: function(){
          return !!document.getElementById('demo-javascript');
        },
        instanceOf: basis.ui.Node,
        config: function(){
          return {
            template: basis.resource('../res/sourceCode.tmpl'),
            action: {
              toggleCode: function(){
                this.sourceVisible = !this.sourceVisible;

                if (!this.code)
                {
                  basis.utils.highlight.useStyle();
                  this.code = basis.utils.highlight.highlight(document.getElementById('demo-javascript').innerHTML, 'js');
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
          }
        }
      }
    }
  });
});
