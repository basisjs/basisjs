var Node = require('basis.ui').Node;
var fileApi = require('api').ns('file');

function escapeHtml(str){
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

function colorizeFragment(color, str){
  if (!str)
    return '';

  str = str.replace(/</g, '&lt;');

  return color
    ? '<span style="background: ' + color + '">' + str + '</span>'
    : str;
}

module.exports = Node.subclass({
  autoDelegate: true,
  handler: {
    update: function(sender, delta){
      if ('sourceTree' in delta)
        this.setChildNodes(this.data.sourceTree);
    }
  },

  template: resource('./source/main.tmpl'),
  binding: {
    compiledSource: 'data:source'
  },

  childClass: {
    childClass: basis.Class.SELF,
    template: resource('./source/template.tmpl'),
    binding: {
      url: 'data:',
      caption: {
        events: 'update',
        getter: function(node){
          return node.data.url || '[inline]';
        }
      },
      content: function(node){
        var content = node.data.content;
        var markup = node.data.markup;
        var offset = 0;
        var res = '';

        for (var i = 0, range; range = markup[i]; i++)
        {
          if (range[0] !== offset)
            res += content.substring(offset, range[0]);

          if (range[0] !== range[1])
            res += colorizeFragment(range[2], content.substring(range[0], range[1]));
          else
            res += '<span style="background-color: ' + range[2] + '" class="warning" title="' + escapeHtml(range[3]) + '" event-click="openFile" data-loc="' + escapeHtml(range[4]) + '"></span>';

          offset = range[1];
        }

        return res + content.substring(offset);
      },
      warningCount: 'data:warnings.length'
    },
    action: {
      openFile: function(e){
        var loc = e.sender.getAttribute('data-loc');
        if (loc)
          fileApi.open(loc);
      }
    }
  }
});
