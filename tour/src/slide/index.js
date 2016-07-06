var l10n = require('basis.l10n');
var router = require('basis.router');
var count = require('basis.data.index').count;
var Node = require('basis.ui').Node;
var Slide = require('app.type').Slide;

var view = new Node({
  autoDelegate: true,

  template: resource('./template/view.tmpl'),
  binding: {
    viewer: 'satellite:',
    title: 'data:',
    num: 'data:',
    slideCount: count(Slide.all),
    description: {
      events: 'update',
      getter: function(node){
        return node.data.id
          ? l10n.dictionary('./slide/' + node.data.id + '/description.l10n').token('text')
          : null;
      }
    }
  },
  action: {
    toc: function(){
      router.navigate('');
    },
    prev: function(){
      var prev = this.data.prev;
      router.navigate(prev ? prev.data.id : '');
    },
    next: function(){
      var next = this.data.next;
      router.navigate(next ? next.data.id : '');
    }
  },

  satellite: {
    viewer: {
      delegate: basis.fn.$self,
      instance: resource('./viewer/index.js')
    }
  }
});

module.exports = view;
