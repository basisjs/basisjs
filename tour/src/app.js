
  basis.require('basis.app');
  basis.require('basis.ui');


  var prevCode = '';
  var view;
  module.exports = basis.app({
    init: function(){
      view = new basis.ui.Node({
        template: resource('app/template/layout.tmpl'),
        binding: {
          toc: resource('module/toc/index.js').fetch()
        },
        action: {
          runCode: function(event){
            var value = event.sender.value;

            try {
              new Function(value);
            } catch(e) {
              return;
            }

            if (prevCode != value)
            {
              //prevCode = value;
              this.tmpl.launcher.src = this.tmpl.launcher.src;
            }
          }
        },

        active: true,
        handler: {
          update: function(sender, delta){
            //if ('content' in delta)
              this.tmpl.editor.value = this.data.code || '';
          }
        }
      });
      return view.element;
    }
  });

  module.exports.selectPage = function(page){
    view.setDelegate(page);
  }

  global.launcherCallback = function(){
    var sourceCodeNode = document.getElementById('code-editor');
    return prevCode = sourceCodeNode ? sourceCodeNode.value : 'document.write("Source code not found")';
  }