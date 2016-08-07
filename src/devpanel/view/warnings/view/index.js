var STATE = require('basis.data').STATE;
var DataObject = require('basis.data').Object;
var Node = require('basis.ui').Node;
var KeyObjectMap = require('basis.data').KeyObjectMap;
var Split = require('basis.data.dataset').Split;
var Filter = require('basis.data.dataset').Filter;
var count = require('basis.data.index').count;
var Warning = require('type').Warning;
var fileApi = require('api').ns('file');
var view;

var warningsByType = new Split({
  source: Warning.all,
  rule: function(item){
    return basis.path.extname(item.data.file);
  }
});

var fatalWarnings = new Filter({
  source: Warning.all,
  rule: 'data.fatal'
});

var StatItem = Node.subclass({
  template: resource('./template/stat-item.tmpl'),
  binding: {
    caption: {
      events: 'update',
      getter: function(node){
        return node.data.title ? node.data.title.replace('.', '') : 'other';
      }
    },
    count: {
      events: 'delegateChanged',
      getter: function(node){
        return count(node.delegate);
      }
    }
  }
});

var stat = new Node({
  template: resource('./template/stat.tmpl'),
  binding: {
    total: 'satellite:',
    fatal: 'satellite:',
    hasWarnings: {
      events: 'update',
      getter: function(node){
        return node.data.total > 0;
      }
    }
  },
  dataSource: warningsByType,
  childClass: StatItem,
  sorting: 'data.title',
  selection: true,
  data: {
    total: count(Warning.all),
    fatal: count(fatalWarnings)
  },
  satellite: {
    total: {
      delegate: basis.fn.$self,
      instance: StatItem.subclass({
        dataset: Warning.all,
        binding: {
          caption: basis.fn.$const('Total'),
          count: 'data:total'
        }
      })
    },
    fatal: {
      existsIf: function(owner){
        return owner.data.fatal;
      },
      delegate: basis.fn.$self,
      instance: StatItem.subclass({
        dataset: fatalWarnings,
        binding: {
          caption: basis.fn.$const('Fatal'),
          count: 'data:fatal',
          fatal: basis.fn.$true
        }
      })
    }
  }
});
StatItem.prototype.contextSelection = stat.selection;
stat.satellite.total.select();
stat.selection.addHandler({
  datasetChanged: function(selection){
    var selected = selection.pick();
    if (selected)
      view.setDataSource(selected.dataset || selected.delegate);
    else
      selection.set([stat.satellite.total]);
  }
});

Warning.all.addHandler({
  itemsChanged: function(){
    stat.update({
      total: Warning.all.itemCount
    });
  }
});
fatalWarnings.addHandler({
  itemsChanged: function(){
    stat.update({
      fatal: fatalWarnings.itemCount
    });
  }
});

function processMessage(node){
  var bracketContent = [];
  var parts = node.data.message
    .replace(/\(.+?\)/g, function(m){
      bracketContent.push(m);
      return '\x00';
    })
    .split(/(\S:\s+)/);

  return {
    main: parts.slice(0, 2).join('').replace(/\x00/g, function(){
      return bracketContent.pop();
    }),
    details: parts.slice(parts.length > 1 ? 2 : 1).join('').replace(/\x00/g, function(){
      return bracketContent.pop();
    })
  };
}

var groupMap = new KeyObjectMap({
  keyGetter: function(item){
    return [item.data.file || '', item.data.originator || ''].join('\x00');
  },
  create: function(id, item){
    return new DataObject({
      data: {
        id: id,
        file: item.data.file,
        originator: item.data.originator
      }
    });
  }
});

module.exports = Node.subclass({
  container: document.body,
  active: true,
  dataSource: Warning.all,

  template: resource('./template/view.tmpl'),
  binding: {
    stat: stat,
    isOk: {
      events: 'childNodesModified childNodesStateChanged',
      getter: function(node){
        return !node.firstChild && node.childNodesState == STATE.READY;
      }
    }
  },

  grouping: {
    groupGetter: function(child){
      return groupMap.resolve(child);
    },
    sorting: 'data.id || "-"',
    childClass: {
      template: resource('./template/group-by-originator.tmpl'),
      binding: {
        title: function(node){
          var filename = node.data.originator;
          return filename || '[no file]';
        },
        hasFilename: function(node){
          var filename = node.data.originator;
          return filename ? 'hasFilename' : '';
        }/*,
        isolated: {
          events: 'childNodesModified',
          getter: function(node){
            return node.nodes && node.nodes.length ? node.nodes[0].data.isolate : false;
          }
        }*/
      },
      action: {
        open: function(){
          if (this.data.id)
            fileApi.open(this.data.originator);
        }
      }
    },
    grouping: {
      groupGetter: function(child){
        return child.data.file;
      },
      sorting: 'data.title || "-"',
      childClass: {
        template: resource('./template/group.tmpl'),
        binding: {
          title: function(node){
            var filename = node.data.id;
            return filename || '[no file]';
          },
          hasFilename: function(node){
            var filename = node.data.id;
            return filename ? 'hasFilename' : '';
          }
        },
        action: {
          open: function(){
            if (this.data.id)
              fileApi.open(this.data.id);
          }
        }
      }
    }
  },
  childClass: {
    collapsed: true,

    template: resource('./template/warning.tmpl'),
    binding: {
      fatal: 'data:',
      file: 'data:',
      message: 'data:',
      messageStart: function(node){
        return processMessage(node).main;
      },
      messageDetails: function(node){
        return processMessage(node).details;
      },
      linkOnStart: function(node){
        return Boolean(!processMessage(node).details && node.data.loc && node.data.loc[0]);
      },
      theme: 'data:theme',
      loc: function(node){
        return node.data.loc && node.data.loc[0];
      },
      locShort: function(node){
        var loc = node.data.loc && node.data.loc[0];
        if (loc)
        {
          var parts = loc.split(':');

          if (parts[0] == node.data.file)
            parts[0] = '';
          else
            parts[0] = basis.path.basename(parts[0]);

          return parts.join(':');
        }
      },
      isolated: 'data:isolate',
      collapsed: 'collapsed'
    },
    action: {
      openLoc: function(){
        var loc = this.data.loc && this.data.loc[0];
        if (loc)
          fileApi.open(loc);
      },
      expand: function(){
        this.collapsed = false;
        this.updateBind('collapsed');
      }
    },
    childClass: {
      template: resource('./template/warning-loc.tmpl'),
      binding: {
        loc: 'loc',
        locShort: function(node){
          var loc = node.loc;
          if (loc)
          {
            var parts = loc.split(':');

            if (parts[0] == node.file)
              parts[0] = '';
            else
              parts[0] = basis.path.basename(parts[0]);

            return parts.join(':');
          }
        }
      },
      action: {
        openLoc: function(){
          var loc = this.loc;
          if (loc)
            fileApi.open(loc);
        }
      }
    },
    handler: {
      update: function(){
        this.syncLocList();
      }
    },
    syncLocList: function(){
      var loc = this.data.loc;
      var file = this.data.file;
      if (loc && loc.length > 1)
        this.setChildNodes(loc.slice(1).map(function(item){
          return { loc: item, file: file };
        }));
    },
    init: function(){
      Node.prototype.init.call(this);
      view = this;
      this.syncLocList();
    }
  }
});
