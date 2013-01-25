
  var Event = basis.dom.event;
  var DOM = basis.dom;

  var SearchMatchInput = basis.ui.field.MatchInput.subclass({
    matchFilterClass: basis.ui.field.MatchFilter.subclass({
      textNodeGetter: basis.getter('tmpl.title'),
      event_change: function(value, oldValue){
        basis.ui.field.MatchProperty.prototype.event_change.call(this, value, oldValue);

        var fc = value.charAt(0);
        var v = value.substr(1).replace(/./g, function(m){ return '[' + m.toUpperCase() + m.toLowerCase() + ']'; });
        var rx = new RegExp('(^|[^a-zA-Z])([' + fc.toLowerCase() + fc.toUpperCase() +']' + v + ')|([a-z])(' + fc.toUpperCase() + v + ')');
        var textNodeGetter = this.textNodeGetter;
        var wrapMap = this.map;

        wrapMap['SPAN.match'] = function(s, i){ return s && (i % 5 == 2 || i % 5 == 4); };

        this.node.setMatchFunction(value ? function(child, reset){
          if (!reset)
          {
            var textNode = child._m || textNodeGetter(child);
            var p = textNode.nodeValue.split(rx);
            if (p.length > 1)
            {
              DOM.replace(
                child._x || textNode,
                child._x = DOM.createElement('SPAN.matched', DOM.wrap(p, wrapMap))
              );
              child._m = textNode;
              return true;
            }
          }
          
          if (child._x)
          {
            DOM.replace(child._x, child._m);
            delete child._x;
            delete child._m;
          }
          
          return false;
        } : null);

        DOM.get('SidebarContent').scrollTop = 0;
      }
    })
  });


  var searchInput = new SearchMatchInput({
    template: resource('template/searchInput.tmpl'),
    action: {
      clear: function(){
        this.setValue('');
      }
    },
    matchFilter: {
      regexpGetter: function(value){
        return new RegExp('(^|[^a-z])(' + value.forRegExp() + ')', 'i');
      },
      handler: {
        change: function(sender, value){
          searchInput.tmpl.set('empty', !value ? 'empty' : '');
        }
      }
    },
    handler: {
      fieldKeyup: function(sender, event){
        var key = Event.key(event);
        var ctrl = this.matchFilter.node;
        var selected = ctrl.selection.pick();
        
        if ([Event.KEY.UP, Event.KEY.DOWN].has(key))
        {
          var cn = ctrl.childNodes;
          var pos = -1, node;
          
          if (selected && selected.matched)
            pos = cn.indexOf(selected);
          
          if (key == Event.KEY.UP)
            node = cn.lastSearch(true, 'matched', pos == -1 ? cn.length : pos);
          else
            node = cn.search(true, 'matched', pos + 1);

          if (node)
            node.select();
        }
        /*else
          if ([Event.KEY.ENTER, Event.KEY.CTRL_ENTER].has(key))
            if (selected)
              navTree.open(selected.data.fullPath);*/
      },
      fieldKeydown: function(sender, event){
        var key = Event.key(event);
        
        if (key == Event.KEY.ESC)
        {
          searchInput.reset();
        }
        else
        {
          if (!/[a-z\_0-9\x08\x09\x0A\x0D\x23-\x28]/i.test(String.fromCharCode(key)))
            Event.kill(event);
        }
      },
      fieldFocus: function(){
        this.focused = true;
      },
      fieldBlur: function(){
        this.focused = false;
      }
    }
  });


  //
  // exports
  //
  module.exports = searchInput;
