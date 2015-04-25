basis.ready(function(){
  var Node = basis.require('basis.ui').Node;
  var highlight = basis.require('basis.utils.highlight');

  new Node({
    container: document.body,
    template: basis.resource('../res/template/demo-page.tmpl'),
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
        satelliteClass: Node,
        config: function(){
          return {
            sourceVisible: new basis.Token(false),
            template: basis.resource('../res/template/source.tmpl'),
            binding: {
              code: 'code',
              sourceVisible: 'sourceVisible'
            },
            action: {
              toggleCode: function(){
                this.sourceVisible.set(!this.sourceVisible.value);

                if (!this.code)
                {
                  highlight.useStyle();
                  this.code = highlight.highlight(
                    document.getElementById('demo-javascript').innerHTML,
                    'js'
                  );
                  this.updateBind('code');
                }
              }
            }
          };
        }
      }
    }
  });
});
