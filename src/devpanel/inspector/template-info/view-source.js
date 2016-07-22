var Node = require('basis.ui').Node;
var fileAPI = require('../../api/file.js');
var source = new basis.Token('');

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

var view = new Node({
  template: resource('./template/source/main.tmpl'),
  binding: {
    code: source
  },
  childClass: {
    childClass: basis.Class.SELF,
    template: resource('./template/source/template.tmpl'),
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
          fileAPI.openFile(loc);
      }
    }
  },
  show: function(data){
    data = JSON.parse(data);
    source.set(data.source);
    this.setChildNodes(data.tree);
  }
});

module.exports = view;
