
  var classList = basis.cssom.classList;

  var viewPrototype = basis.resource('app/views/prototype/prototype.js');
  var targetContent = basis.resource('app/layout/targetContent.js');
  
  var prototypeDataset = new basis.dom.wrapper.ChildNodesDataset({ sourceNode: viewPrototype() });
  var prototypeMapPopup = new basis.ui.popup.Balloon({
    id: 'PrototypeMapPopup',
    dir: 'center bottom center top',
    selection: {},
    childClass: basis.ui.Node.subclass({
      template: resource('template/prototypeMapItem.tmpl'),

      binding: {
        key: 'data:'
      },

      action: {
        scrollTo: function(event){
          var element = this.delegate.element;
          targetContent().scrollTo(element);
          this.parentNode.hide();
          classList(element).add('highlight');
          setTimeout(function(){ classList(element).remove('highlight'); });
        }
      }
    }),
    sorting: Function.getter('data.title'),
    grouping: Object.slice(viewPrototype().grouping, 'groupGetter sorting childClass'.qw()),
    event_beforeShow: function(){
      this.constructor.prototype.event_beforeShow.call(this);
      this.setDataSource(prototypeDataset);
    },
    event_show: function(){
      this.constructor.prototype.event_show.call(this);
      prototypeMapPopupMatchInput.select();
    },
    event_hide: function(){
      this.constructor.prototype.event_hide.call(this);
      this.setDataSource();
      prototypeMapPopupMatchInput.setValue();
    }
  });

  var prototypeMapPopupMatchInput = new basis.ui.field.MatchInput({
    event_keyup: function(event){
      this.constructor.prototype.event_keyup.call(this, event);

      var selected = prototypeMapPopup.selection.pick();
      switch (Event.key(event)){
        case Event.KEY.UP: 
          prototypeMapPopup.selection.set([selected && selected.previousSibling || prototypeMapPopup.lastChild]);
        break;
        case Event.KEY.DOWN: 
          prototypeMapPopup.selection.set([selected && selected.nextSibling || prototypeMapPopup.firstChild]);
        break;
        case Event.KEY.ENTER: 
          if (selected)
            selected.templateAction('scrollTo');
        break;
      }
    },
    matchFilter: {
      node: prototypeMapPopup,
      textNodeGetter: Function.getter('tmpl.this_data_title')
    }
  });
  basis.dom.insert(prototypeMapPopup.tmpl.content.parentNode, prototypeMapPopupMatchInput.element, basis.dom.INSERT_BEGIN);

  //
  // exports
  //
  module.exports = prototypeMapPopup;
