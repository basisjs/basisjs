
  basis.ready(function(){
    basis.require('basis.dom');
    basis.require('basis.ui');
    basis.require('basis.format.highlight');

    new basis.ui.Node({
      container: document.body,
      content: basis.dom.get('demo-container'),
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
            return !!basis.dom.get('demo-javascript');
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
                    this.code = basis.format.highlight(basis.dom.get('demo-javascript').innerHTML, 'js');
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

    /*if (/google/.test(location.host))
      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
       (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ga);
      })();*/
  });

  /*var _gaq = _gaq || [];
  _gaq.push(
    ['siteTracker._setAccount', 'UA-18071-1'],
    ['siteTracker._trackPageview']
  );
 
  _gaq.push(
    ['projectTracker._setAccount', 'UA-16275563-1'],
    ['projectTracker._trackPageview']
  );*/