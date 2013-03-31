basis.ready(function(){
  basis.require('basis.ui');
  basis.require('basis.format.highlight');

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
    satelliteConfig: {
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
                  this.code = basis.format.highlight(document.getElementById('demo-javascript').innerHTML, 'js');
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
