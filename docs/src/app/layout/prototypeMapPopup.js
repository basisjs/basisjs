
  var classList = require('basis.cssom').classList;
  var Node = require('basis.ui').Node;
  var MatchInput = require('basis.ui.field').MatchInput;
  var Balloon = require('basis.ui.popup').Balloon;
  var targetContent = resource('./targetContent.js');
  var viewPrototype = require('./views/prototype/prototype.js');
  var prototypeDataset = viewPrototype.getChildNodesDataset();


  var prototypeMapPopupMatchInput = new MatchInput({
    emit_fieldKeyup: function(event){
      this.constructor.prototype.emit_fieldKeyup.call(this, event);

      var selected = prototypeMapPopup.selection.pick();
      switch (event.key)
      {
        case event.KEY.UP:
          prototypeMapPopup.selection.set([selected && selected.previousSibling || prototypeMapPopup.lastChild]);
          break;
        case event.KEY.DOWN:
          prototypeMapPopup.selection.set([selected && selected.nextSibling || prototypeMapPopup.firstChild]);
          break;
        case event.KEY.ENTER:
          if (selected)
            selected.templateAction('scrollTo');
          break;
      }
    },
    matchFilter: {
      node: prototypeMapPopupPanel,
      textNodeGetter: basis.getter('tmpl.key')
    }
  });

  var prototypeMapPopupPanel = new Node({
    template: resource('./template/prototypeMapPopupPanel.tmpl'),
    binding: {
      matchInput: prototypeMapPopupMatchInput
    },

    sorting: basis.getter('data.title'),
    grouping: basis.object.slice(viewPrototype.grouping, ['rule', 'sorting', 'childClass']),
    childClass: Node.subclass({
      template: resource('./template/prototypeMapPopupPanelItem.tmpl'),

      binding: {
        key: 'data:',
        unmatched: ['match unmatch', function(node){
          return !node.matched;
        }]
      },

      action: {
        scrollTo: function(){
          var element = this.delegate.element;
          targetContent().scrollTo(element);

          classList(element).add('highlight');
          basis.nextTick(function(){
            classList(element).remove('highlight');
          });

          prototypeMapPopup.hide();
        }
      }
    })
  });

  var prototypeMapPopup = new Balloon({
    template: '<b:include src="basis.ui.popup.Balloon" id="PrototypeMapPopup"/>',

    dir: 'center bottom center top',

    selection: true,
    childNodes: prototypeMapPopupPanel,

    handler: {
      beforeShow: function(){
        prototypeMapPopupPanel.setDataSource(prototypeDataset);
      },
      show: function(){
        prototypeMapPopupMatchInput.focus();
      },
      hide: function(){
        prototypeMapPopupPanel.setDataSource();
        prototypeMapPopupMatchInput.setValue();
      }
    }
  });

  //
  // exports
  //
  module.exports = prototypeMapPopup;
