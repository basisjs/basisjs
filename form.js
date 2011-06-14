/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

   /**
    * @namespace Basis.Controls.Form
    */

    var namespace = 'Basis.Controls.Form';

    // import names

    var Class = Basis.Class;
    var Event = Basis.Event;
    var DOM = Basis.DOM;
    var Template = Basis.Html.Template;
    var Cleaner = Basis.Cleaner;

    var complete = Object.complete;
    var coalesce = Object.coalesce;
    var getter = Function.getter;
    var cssClass = Basis.CSS.cssClass;

    var createBehaviour = Basis.EventObject.createBehaviour; 

    var nsWrappers = DOM.Wrapper;

    var Control = nsWrappers.Control;         
    var HtmlNode = nsWrappers.HtmlNode;        
    var Selection = nsWrappers.Selection;       

    var AbstractProperty = Basis.Data.Property.AbstractProperty;
    var Property = Basis.Data.Property.Property;

    //
    // Main part
    //

    //
    //  Fields
    //

    var Field = Class(HtmlNode, {
      className: namespace + '.Field',

      canHaveChildren: false,

      serializable: true,

      behaviour: {
        select: function(){
          DOM.focus(this.field, true);
        },
        keypress: function(field, event){
          var event = Event(event);
          if (event)
          {
            var key = Event.key(event);
          
            if (key == Event.KEY.ENTER || key == Event.KEY.CTRL_ENTER)
              Event.cancelDefault(event);

            if (((field.nextFieldOnEnter || event.ctrlKey) && key == Event.KEY.ENTER) || key == Event.KEY.CTRL_ENTER)
              field.nextFieldFocus();
            else
              field.setValid();
          }
        },
        enable: function(){
          this.field.removeAttribute('disabled');
          cssClass(this.element).remove('disabled');
        },
        disable: function(){
          this.field.setAttribute('disabled', 'disabled');
          cssClass(this.element).add('disabled');
        },
        blur: function(field, event){
          field.validate(true);
        },
        focus: function(field, event){
          if (field.valid)
            field.setValid();
        }
      },
      
      template: new Template(
        '<div{element|sampleContainer} class="fieldWraper">' +
          '<div class="title">' +
            '<label><span{title}/></label>' +
          '</div>' +
          '<div{fieldContainer|content} class="field"/>' +
        '</div>'
      ),
      tableTemplate: new Template(
        '<tr{element} class="fieldWraper">' +
          '<td class="title">' +
            '<label><span{title}/></label>' +
          '</td>' +
          '<td{sampleContainer} class="field">' +
            '<div{fieldContainer|content} class="field-wraper"/>' +
          '</td>' +
        '</tr>'
      ),

      init: function(config){

        // create field
        if (this.fieldTemplate)
          this.fieldTemplate.createInstance(this);

      	if (this.tableLayout = config.tableLayout)
      	  this.template = this.tableTemplate;
      	  
        this.inherit(config);

        config = config || {};

        this.name = config.name || config.id;
        this.id   = config.id;
            
        if (this.field)
        {
          if (config.name)
            this.field.name = config.name;
          //if (config.id)
          //  this.field.id = config.id;
        }

        if (this.fieldContainer)
          DOM.insert(this.fieldContainer, this.field);
        
        if (this.title)
          DOM.insert(this.title, config.title);

        // attach button
        if (config.button)
        {
          cssClass(this.element).add('have-button');
          this.button = DOM.createElement('BUTTON', config.caption || '...');
          if (config.button.handler) 
            Event.addHandler(this.button, 'click', config.button.handler, this.button);
          DOM.insert(this.field.parentNode, this.button, DOM.INSERT_AFTER, this.field);
        }

        // set events
        this.nextFieldOnEnter = Function.$defined(config.nextFieldOnEnter) ? config.nextFieldOnEnter : true;
        Event.addHandler(this.field, 'keyup',    this.keyup,    this);
        Event.addHandler(this.field, 'keypress', this.keypress, this);
        Event.addHandler(this.field, 'blur',     this.blur,     this);
        Event.addHandler(this.field, 'focus',    this.focus,    this);
        Event.addHandler(this.field, 'change',   this.change,   this);

        // attach validators
        this.validators = new Array();
        if (config.validators)
          //config.validators.forEach(this.attachValidator, this);
          for (var i = 0; i < config.validators.length; i++)
            this.attachValidator(config.validators[i]);

        // set sample
        this.setSample(config.sample);
        
        // set min/max length
        if (config.minLength) this.setMinLength(config.minLength);
        if (config.maxLength) this.setMaxLength(config.maxLength);

        // set value & default value
        if (Function.$defined(config.readOnly))
          this.setReadOnly(config.readOnly);
        if (Function.$defined(config.disabled) && config.disabled)
          this.disable();

        ;;;if (Function.$defined(config.returnValue) && typeof console != 'undefined') console.warn('Field.init: returnValue is deprecated');
        
        // serializable
        if (Function.$defined(config.serializable))
          this.serializable = config.serializable;

        // size
        if (Function.$defined(config.size))
          this.field.size = config.size;

        if (typeof config.value != 'undefined')
        {
          this.defaultValue = config.value;
          this.setDefaultValue();
        }

        return config;
      },
      setReadOnly: function(readOnly){
        if (readOnly)
          this.field.setAttribute('readonly', 'readonly', 0);
        else
          this.field.removeAttribute('readonly', 0);
      },
      setDefaultValue: function(){
        if (typeof this.defaultValue != 'undefined')
        {
          this.setValue(this.defaultValue);
          this.setValid();
        }
      },
      setSample: function(sample){
        if (this.sampleContainer && Function.$defined(sample) && sample != '')
        {
          if (!this.sample)
            DOM.insert(this.sampleContainer, this.sample = DOM.createElement('SPAN.sample', sample));
          else
            DOM.insert(DOM.clear(this.sample), sample);
        }
        else
        {
          if (this.sample)
          {
            DOM.remove(this.sample);
            this.sample = null;
          }
        }
      },
      getValue: function(){
        return this.field.value;
      },
      setValue: function(newValue){
        this.field.value = Function.$defined(newValue) ? newValue : '';
        this.change();
      },
      disable: function(){
        if (!this.disabled)
        {
          this.disabled = true;
          this.dispatch('disable');
        }
      },
      change: function(){
        this.dispatch('change', this);
      },
      setMaxLength: function(len){
        this.maxLength = len;
      },
      setMinLength: function(len){
        this.minLength = len;
      },
      attachValidator: function(validator, validate){
        if (this.validators.add(validator) && validate)
          this.validate();
      },
      detachValidator: function(validator, validate){
        if (this.validators.remove(validator) && validate)
          this.validate();
      },
      keyup: function(event){
        this.dispatch('keyup', this, event);
      },
      keypress: function(event){
        this.dispatch('keypress', this, event);
      },
      blur: function(event){
        this.dispatch('blur', this, event);
      },
      focus: function(event){
        this.dispatch('focus', this, event);
      },
      select: function(){
        this.unselect();
        this.inherit.apply(this, arguments);
      },
      setValid: function(valid, message){
        if (typeof valid == 'boolean')
        {
          cssClass(this.element).bool('invalid', !valid).bool('valid', valid);
          if (message)
            this.element.title = message;
          else
            this.element.removeAttribute('title');
        }
        else
        {
          cssClass(this.element).remove('invalid', 'valid');
          this.element.removeAttribute('title');
        }
        this.valid = valid;
      },
      validate: function(onlyValid){
        var error;
        this.setValid();
        for (var i = 0; i < this.validators.length; i++)
          if (error = this.validators[i](this))
          {
            if (!onlyValid) 
              this.setValid(false, error.message);
            return error;
          }
        if (this.getValue() != '') // && this.validators.length)
          this.setValid(true);
        return;
      },
      nextFieldFocus: function(event){
      /* if (this.nextSibling)
          this.nextSibling.select();
        else
          if (this.parentNode)
            this.parentNode.submit();*/
        var next = DOM.axis(this, DOM.AXIS_FOLLOWING_SIBLING).search(true, 'selectable');
        if (next)
          next.select();
        else
          if (this.parentNode && this.parentNode.submit)
            this.parentNode.submit();
      },
      destroy: function(){
        Event.clearHandlers(this.element);// TODO: remove????
        Event.clearHandlers(this.field);
        if (this.button)
        {
          Event.clearHandlers(this.button);
          delete this.button;
        }
        this.validators.clear();

        this.inherit();

        delete this.sample;
        delete this.sampleContainer;
        delete this.defaultValue;
        delete this.field;
      }
    });
    Field.create = function(fieldType, config){
      var alias = {
        'radiogroup': 'RadioGroup',
        'checkgroup': 'CheckGroup'
      }

      fieldType = alias[fieldType.toLowerCase()] || fieldType.capitalize();

      if (Field[fieldType])
        return new Field[fieldType](config);
      else
        throw new Error('Wrong field type `{0}`'.format(fieldType));
    };

    //
    // Simple fields
    //

    Field.Hidden = Class(Field, {
      className: namespace + '.Field.Hidden',

      selectable: false,
      
      template: new Template(''),
      fieldTemplate: new Template(
        '<input{field|element} type="hidden"/>'
      ),

      init: function(config){
        config.value = coalesce(config.value, '');
        this.inherit(config);
      }
    });

    Field.Text = Class(Field, {
      className: namespace + '.Field.Text',
      
      fieldTemplate: new Template(
        '<input{field|element} type="text"/>'
      ),

      init: function(config){
        if (config.minLength)
        {
          if (!config.validators) config.validators = new Array();
          config.validators.push(Validator.MinLength);
        }
        config.value = coalesce(config.value, '');
        return this.inherit(config);
      },
      setMaxLength: function(len){
        len = len * 1 || 0;
        this.field.setAttribute('maxlength', len, 0);
        this.inherit(len);
      }
    });

    Field.Password = Class(Field.Text, {
      className: namespace + '.Field.Password',

      fieldTemplate: new Template(
        '<input{field|element} type="password"/>'
      )
    });

    Field.File = Class(Field, {
      className: namespace + '.Field.File',

      fieldTemplate: new Template(
        '<input{field|element} type="file"/>'
      ),      

      init: function(config){
        config.value = '';
        this.inherit(config);
      }
    });

    Field.Textarea = Class(Field, {
      className: namespace + '.Field.Textarea',

      fieldTemplate: new Template(
        '<textarea{field|element}/>'
      ),

      init: function(config){
        if (!config.validators)
          config.validators = new Array();
        if (config.minLength)
          config.validators.push(Validator.MinLength);
        if (config.maxLength)
          config.validators.push(Validator.MaxLength);
        config.value = coalesce(config.value, '');
        config.nextFieldOnEnter = false;
        this.counter = DOM.createElement('.counter', Field.LOCALE.Textarea.SYMBOLS_LEFT + ': ', DOM.createText(0));

        config = this.inherit(config);

        Event.addHandler(this.field, 'keyup', this.updateCounter, this);
        Event.addHandler(this.field, 'input', this.updateCounter, this);

        if (window.opera)
        {
          Event.addHandler(this.field, 'focus', function(event){
            this.contentEditable = true;
            this.contentEditable = false;
          }, this.field);
      	}

        return config;
      },
      updateCounter: function(){
        var left = this.maxLength - this.getValue().length;
        this.counter.lastChild.nodeValue = left >= 0 ? left : 0;
      },
      setValue: function(value){
        this.inherit(value);
        this.updateCounter();
      },
      setMaxLength: function(len){
        this.inherit(len);
        if (len)
        {
          this.updateCounter();
          DOM.insert(this.sampleContainer, this.counter);
        }
        else
          DOM.remove(this.counter);
      },
      destroy: function(){
        delete this.counter;
        this.inherit();
      }
    });

    Field.Checkbox = Class(Field, {
      className: namespace + '.Field.Checkbox',

      fieldTemplate: new Template(
        '<input{field|element} type="checkbox"/>'
      ),

      init: function(config){
        config.value = coalesce(config.value, false);
        this.inherit(config);

        if (!this.tableLayout)
        {
          var label = this.element.firstChild.firstChild;
          DOM.remove(this.element.firstChild);
          DOM.insert(this.field.parentNode, label);
          DOM.insert(label, this.field, DOM.INSERT_BEGIN);
        }

                
        /*Event.addHandler(this.element, 'click', function(event){
          if (Event.sender(event) != this.field)
            this.invert();
          else
            Event.kill(event);
        }, this);*/
        
      },
      invert: function(){
        this.setValue(!this.getValue());
      },
      setValue: function(value){
        var state = this.field.checked;
        this.field.checked = !!value;
        if (state != this.field.checked)
          this.change();
      },
      getValue: function(){
        return this.field.checked;
      }
    });

    Field.Label = Class(Field, {
      className: namespace + '.Field.Label',
      
      fieldTemplate: new Template(
        '<div{field|element} class="label">{fieldValueText}</div>'
      ),
      setValue: function(newValue){
        this.inherit(newValue);
        this.fieldValueText.nodeValue = this.field.value;
      }
    });

    //
    // Complex fields
    //

    var ComplexFieldItem = Class(HtmlNode, {
      className: namespace + '.ComplexFieldItem',

      canHaveChildren: false,
      
      valueGetter: getter('value'),
      titleGetter: function(info){ return coalesce(info.title, info.value) },

      init: function(config){
        if (config && typeof config.valueGetter == 'function')
          this.valueGetter = config.valueGetter;
        if (config && typeof config.titleGetter == 'function')
          this.titleGetter = config.titleGetter;

        config = this.inherit(config);

        this.element.node = this;

        return config;
      },
      getTitle: function(){
        return this.titleGetter(this.info, this);
      },
      getValue: function(){
        return this.valueGetter(this.info, this);
      },
      destroy: function(){
        this.element.node = null;
        this.inherit();
      }
    });

    var ComplexField = Class(Field, nsWrappers.HtmlContainer, {
      className: namespace + '.Field.ComplexField',

      canHaveChildren: true,

      childFactory: function(itemConfig){
        var config = {
          valueGetter: this.itemValueGetter,
          titleGetter: this.itemTitleGetter
        };

        if (itemConfig.info || itemConfig.delegate)
          complete(config, itemConfig);
        else
          config.info = itemConfig;

        return new this.childClass(config);
      },

      multipleSelect: false,

      itemValueGetter: getter('value'),
      itemTitleGetter: function(info){ return coalesce(info.title, info.value); },

      init: function(config){

        this.selection = new Selection({ multiple: !!this.multipleSelect });
        this.selection.addHandler({
          change: function(){
            var values = this.selection.getItems().map(getter('getValue()'));
            this.setValue(!this.selection.multiple ? values[0] : values);
          }
        }, this);

        // value & title getters
        if (config.itemValueGetter)
          this.itemValueGetter = getter(config.itemValueGetter);
        if (config.itemTitleGetter)
          this.itemTitleGetter = getter(config.itemTitleGetter);

        config = this.inherit(config);

        // insert items
        if (config.items)
          DOM.insert(this, config.items);

        // store default value
        if (!('value' in config))
          this.defaultValue = this.getValue();

        Cleaner.add(this);

        return config;
      },
      getValue: function(){
        var value = this.selection.getItems().map(getter('getValue()'));
        return !this.selection.multiple ? value[0] : value;
      },
      setValue: function(/* value[] */value){
        var source = this.selection.multiple 
          ? (value instanceof AbstractProperty
              ? Array.from(value.value).map(function(item){ return this.itemValueGetter(item.value) }, this)
              : Array.from(value)
            )
          : [value];

        var selected = {};
        source.forEach(function(key){ this[key] = true }, selected);

        // prevent selection dispatch change event
        var selectedItems = [];
        for (var item = this.firstChild; item; item = item.nextSibling)
          if (selected[item.getValue()])
            selectedItems.push(item);

        this.selection.set(selectedItems);

        this.change();
      },
      destroy: function(){
        this.inherit();

        Cleaner.remove(this);
      }
    });
    delete ComplexField.prototype.template;

    //
    // Radio group
    //

    var RadioGroupItem = Class(ComplexFieldItem, {
      className: namespace + '.Field.RadioGroup.Item',

      behaviour: {
        select: function(){
          this.field.checked = true;
          cssClass(this.element).add('selected');
        },
        unselect: function(){
          this.field.checked = false;
          cssClass(this.element).remove('selected');
        },
        click: function(){
          this.select();
        },
        update: function(item, delta){
          this.field.value = this.valueGetter(item.info, item);
          this.titleText.nodeValue = this.titleGetter(item.info, item);
        }
      },

      template: new Template(
        '<label{element} class="item">' + 
          '<input{field} type="radio" class="radio"/>' +
          '<span{content}>{titleText}</span>' +
        '</label>'
      ),

      init: function(config){
        this.inherit(config);
        this.dispatch('update', this, this.info, this.info, {});
      }
    });

    Field.RadioGroup = Class(ComplexField, {
      className: namespace + '.Field.RadioGroup',

      childClass: RadioGroupItem,

      fieldTemplate: new Template(
        '<div{field|childNodesElement} class="Basis-RadioGroup"></div>'
      ),

      init: function(config){
        this.inherit(config);

        //Event.addHandler(this.childNodesElement, 'click', this.change, this);
        Event.addHandler(this.childNodesElement, 'click', function(event){
          var sender = Event.sender(event);
          var item = sender.tagName == 'LABEL' ? sender : DOM.parent(sender, 'LABEL', 0, this.field);

          if (!item || !item.node) 
            return;

          if (!item.node.isDisabled())
          {
            var self = this;
            setTimeout(function(){
              self.dispatch('click', event, item.node);
              item.node.dispatch('click', event);
            }, 0);
          }

          Event.kill(event);
        }, this);

        return config;
      },
      appendChild: function(newChild){
        if (newChild = this.inherit(newChild, refChild))
          newChild.field.name = this.name;
      },
      insertBefore: function(newChild, refChild){
        if (newChild = this.inherit(newChild, refChild))
          newChild.field.name = this.name;
      }
    });

    //
    // Check Group
    //

   /**
    * @class CheckGroupItem
    */

    var CheckGroupItem = Class(ComplexFieldItem, {
      className: namespace + '.Field.CheckGroup.Item',

      behaviour: {
        select: function(){
          this.inherit();
          this.field.checked = true;
        },
        unselect: function(){
          this.inherit();
          this.field.checked = false;
        },
        click: function(){
          if (this.selected)
            this.unselect();
          else
            this.select(true);
        },
        update: function(item, delta){
          this.field.value = this.valueGetter(item.info, item);
          this.titleText.nodeValue = this.titleGetter(item.info, item);
        }
      },

      template: new Template(
        '<label{element} class="item">' + 
          '<input{field} type="checkbox"/>' +
          '<span{content}>{titleText}</span>' +
        '</label>'
      )
    });

   /**
    * @class Field.CheckGroup
    */

    Field.CheckGroup = Class(ComplexField, {
      className: namespace + '.Field.CheckGroup',

      childClass: CheckGroupItem,

      multipleSelect: true,

      fieldTemplate: new Template(
        '<div{field|childNodesElement} class="Basis-CheckGroup"></div>'
      ),

      init: function(config){
        config = this.inherit(config);

        Event.addHandler(this.childNodesElement, 'click', function(event){
          var sender = Event.sender(event);
          var item = sender.tagName == 'LABEL' ? sender : DOM.parent(sender, 'LABEL', 0, this.field);

          if (!item || !item.node) 
            return;

          if (!item.node.isDisabled())
          {
            var self = this;
            setTimeout(function(){
              self.dispatch('click', event, item.node);
              item.node.dispatch('click', event);
            }, 0);
          }

          Event.kill(event);
        }, this);

        return config;
      }
    });

    //
    // Select
    //

    var SelectItem = Class(ComplexFieldItem, {
      className: namespace + '.Field.Select.Item',

      behaviour: {
        select: function(){
//          if (this.parentNode)
//            this.parentNode.setValue(this.getValue());
        },
        unselect: function(){
//          if (this.parentNode)
//            this.parentNode.setValue();
        },
        update: function(item, delta){
          this.field.value = this.valueGetter(item.info, item);
          this.field.text = this.titleGetter(item.info, item);
        }
      },

      template: new Template(
        '<option{element|field}></option>'
      )
    });


    Field.Select = Class(ComplexField, {
      className: namespace + '.Field.Select',

      childClass: SelectItem,
      
      fieldTemplate: new Template(
        '<select{field|childNodesElement}/>'
      ),

      init: function(config){
        this.inherit(config);

        Event.addHandler(this.field, 'change', this.change, this);
        Event.addHandler(this.field, 'keyup',  this.change, this);
      },
      setValue: function(value){
      	var item = this.childNodes.search(value, 'getValue()');
      	
      	// break recursion
        if (this.field.selectedIndex == Array.lastSearchIndex)
          return;
          
        this.field.selectedIndex = Array.lastSearchIndex;

        // prevent selection dispatch change event 
        this.selection.dispatch = Function.$null;
        if (item)
          this.selection.add([item]);
        else
          this.selection.clear();
        delete this.selection.dispatch;
        clearTimeout(this.selection._fireTimer);
        delete this.selection._fireTimer;
      }
    });

    //
    //  Combobox
    //

    var ComboboxPopupHandler = {
      show: function(){ cssClass(this.field).add('Basis-DropdownList-Opened'); },
      hide: function(){ cssClass(this.field).remove('Basis-DropdownList-Opened'); },
      click: function(event, node){
        var sender = Event.sender(event);
        var item = sender.tagName == 'A' ? sender : DOM.parent(sender, 'A', 0, this.content);

        if (!item || !item.node) 
          return;

        if (!item.node.isDisabled())
        {
          this.hide();

          this.dispatch('click', event, item.node);
          item.node.dispatch('click', event);
        }

        Event.kill(event);
      }
    };

    //
    // Combobox
    //

    var ComboboxItem = Class(ComplexFieldItem, {
      className: namespace + '.Field.Combobox.Item',

      behaviour: {
        click:  function(){
          this.select();
          //if (this.parentNode)
          //  this.parentNode.setValue(this.getValue());
        },
        update: function(item, delta){
          this.titleText.nodeValue = this.titleGetter(item.info, item);
        }
      },

      template: new Template(
        '<a{element} class="item" href="#">{titleText}</a>'
      )
    });

    var ComboboxCaptionHandlers = {
      focus: function(){
        cssClass(this.caption).add('focused');
      },
      blur: function(){
        cssClass(this.caption).remove('focused');
      },/*
      keydown: function(){
        console.log('down', key);
      },*/
      keypress: function(event){
        var key = Event.key(event);
        var cur = this.selection.pick();

        switch (key){
          case Event.KEY.DOWN:
            if (event.altKey)
              return this.popup.visible ? this.hide() : (!this.isDisabled() ? this.show() : null);

            //cur = cur ? cur.nextSibling : this.firstChild;
            cur = DOM.axis(cur ? cur : this.firstChild, DOM.AXIS_FOLLOWING_SIBLING).search(false, 'disabled');
          break;

          case Event.KEY.UP: 
            if (event.altKey)
              return this.popup.visible ? this.hide() : (!this.isDisabled() ? this.show() : null);

            cur = cur ? DOM.axis(cur, DOM.AXIS_PRESCENDING_SIBLING).search(false, 'disabled') : this.firstChild;
          break;

          case Event.KEY.ENTER:
            if (this.popup.visible)
              this.hide();
            return Event.kill(event);
          break;
        }

        if (cur)
          cur.select();
        
        //console.log(key, Event.KEY.ENTER, key == Event.KEY.ENTER)
      }
    };
    
    Field.Combobox = Class(ComplexField, {
      className: namespace + '.Field.Combobox',

      childClass: ComboboxItem,

      behaviour: createBehaviour(Field, {
        disable: function(){
          cssClass(this.field).add('disabled');
        },
        enable: function(){
          cssClass(this.field).remove('disabled');
          if (this.delegate && this.delegate.select)
            this.delegate.select();
        },
        update: function(object, delta){
          this.inherit(object, delta);

          // update title
          var title = coalesce(this.getTitle(), this.getValue(), '');
          this.field.title = 
          this.captionText.nodeValue = this.captionFormater(title, this.getValue());
        }
      }),

      caption: null,
      popup: null,
      property: null,
      
      selectedIndex: -1,

      captionFormater: Function.$self,
      
      fieldTemplate: new Template(
        '<div{field} class="Basis-DropdownList">' +
          '<div class="Basis-DropdownList-Canvas">' +
            '<div class="corner-left-top"/>' +
            '<div class="corner-right-top"/>' +
            '<div class="side-top"/>' +
            '<div class="side-left"/>' +
            '<div class="side-right"/>' +
            '<div class="content"/>' +
            '<div class="corner-left-bottom"/>' +
            '<div class="corner-right-bottom"/>' +
            '<div class="side-bottom"/>' +
          '</div>' +
          '<div class="Basis-DropdownList-Content">' +
            '<a{caption} class="Basis-DropdownList-Caption" href="#">' +
              '<span class="Basis-DropdownList-CaptionText">{captionText}</span>' + 
            '</a>' +
            '<div class="Basis-DropdownList-Trigger"/>' +
          '</div>' +
          '<div{content|childNodesElement} class="Basis-DropdownList-PopupContent"/>' +
        '</div>'
      ),

      init: function(config){
        if (!Basis.Controls.Popup)
          throw new Error('Basis.Controls.Popup required for DropDownList');

        if (config.captionFormater)
          this.captionFormater = config.captionFormater;

        var defaultValue = config.property ? config.property.value : config.value;
        delete config.value;
        //config.value = config.property ? config.property.value : config.value;
        
        var items = config.items;
        delete config.items;

        // create instance of Field
        config = this.inherit(config);

        // create items popup
        this.popup = new Basis.Controls.Popup.Popup(complete({
          cssClassName: 'Basis-DropdownList-Popup',
          autorotate: 1,
          ignoreClickFor: [this.field],
          thread: config.thread,
          content: this.childNodesElement
        }, config.popup));
        this.popup.addHandler(ComboboxPopupHandler, this);
        //this.content = this.childNodesElement = this.popup.content;

        for (var event in ComboboxCaptionHandlers)
          Event.addHandler(this.caption, event, ComboboxCaptionHandlers[event], this);

        if (config.name)
          DOM.insert(this.field, this.hidden = DOM.createElement('INPUT[type=hidden][name={0}]'.format(String(config.name).quote())));
          
        if (items)
          DOM.insert(this, items);

        if (config.property)
        {
          this.property = config.property;
          this.property.addLink(this, this.setValue);
        }

        if (typeof defaultValue != 'undefined')
          this.defaultValue = defaultValue;
        this.setDefaultValue();
        this.dispatch('update', this, this.info);

        // add handlers
        Event.addHandler(this.field, 'click', function(event){
          this.isDisabled() || this.popup.visible ? this.hide() : this.show();
          Event.kill(event);
        }, this);
        /*
        this.addHandler({
          any: function(){
            console.log('combobox event: ', arguments);
          }
        });*/
        //this.dispatch('update', this, this.info);

        return config;
      },
      select: function(){
        this.inherit();
        DOM.focus(this.caption);
      },
      show: function(){ 
        this.popup.show(this.field); 
        this.select();
      },
      hide: function(){
        this.popup.hide();
      },
      getTitle: function(){
        return this.itemTitleGetter(this.info, this.delegate);
      },
      getValue: function(){
        return this.itemValueGetter(this.info, this.delegate);
      },
      setValue: function(value){
        if (value instanceof AbstractProperty)
          value = this.itemValueGetter(value.value);

        if (this.getValue() != value)
        {
          // update value & selection
          var item = this.childNodes.search(value, 'getValue()');
          if (!item || (!item.disabled && this.delegate !== item))
          {
            this.selectedIndex = item ? Array.lastSearchIndex : -1;

            this.setDelegate(item);
            if (item)
              this.selection.set([item]);
            else
              this.selection.clear();

            value = this.getValue();

            if (this.hidden)
              this.hidden.value = value;

            if (this.property)
              this.property.set(value);
          }
          this.dispatch('change');
        }

        return this.getValue();
      },/*
      setIndex: function(index){
        if (this.selectedIndex == index)
          return;

        if (index < 0)
        {
          this.setValue(null);
          return;
        }

        var item = this.childNodes[index];
        if (item)
          this.setValue(item.value);
      },*/
      destroy: function(){

        if (this.property)
        {
          this.property.removeLink(this);
          delete this.property;
        }

        this.popup.destroy();
        delete this.popup;

        this.inherit();
      }
    });

    //
    //  Value validators
    //

    var ValidatorError = Class(null, {
      className: namespace + '.ValidatorError',

      init: function(field, message){
        this.field = field;
        this.message = message;
      }
    });

    var Validator = {
      NO_LOCALE: 'There is no locale for this error',
      RegExp: function(regexp){
        if (regexp.constructor != RegExp)
          regexp = new RegExp(regexp);
        return function(field){
          var value = field.getValue();
          if (value != '' && !value.match(regexp))
            return new ValidatorError(field, Validator.LOCALE.RegExp.WRONG_FORMAT || Validator.NO_LOCALE);
        }
      },
      Required: function(field){
        var value = field.getValue();
        if (Function.$isNull(value) || value == '')
          return new ValidatorError(field, Validator.LOCALE.Required.MUST_BE_FILLED || Validator.NO_LOCALE);
      },
      Number: function(field){
        var value = field.getValue();
        if (isNaN(value))
          return new ValidatorError(field, Validator.LOCALE.Number.WRONG_FORMAT || Validator.NO_LOCALE);
      },
      Currency: function(field){
        var value = field.getValue();
        if (isNaN(value))
          return new ValidatorError(field, Validator.LOCALE.Currency.WRONG_FORMAT || Validator.NO_LOCALE);
        if (value <= 0)
          return new ValidatorError(field, Validator.LOCALE.Currency.MUST_BE_GREATER_ZERO || Validator.NO_LOCALE);
      },
      Email: function(field){
        var value = field.getValue();
        if (value != '' && !value.match(/\s*^[a-z0-9\.\-\_]+\@(([a-z][a-z0-9\-]*\.)+[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})\s*$/i))
          return new ValidatorError(field, Validator.LOCALE.Email.WRONG_FORMAT || Validator.NO_LOCALE);
      },
      Url: function(field){
        var value = field.getValue();
        if (value != '' && !value.match(/^\s*(https?\:\/\/)?((\d{1,3}\.){3}\d{1,3}|([a-zA-Z][a-zA-Z\d\-]+\.)+[a-zA-Z]{2,6})(:\d+)?(\/[^\?]*(\?\S(\=\S*))*(\#\S*)?)?\s*$/i))
          return new ValidatorError(field, Validator.LOCALE.Url.WRONG_FORMAT || Validator.NO_LOCALE);
      },
      MinLength: function(field){
        var value = field.getValue();
        var length = Function.$isNotNull(value.length) ? value.length : String(value).length;
        if (length < field.minLength)
          return new ValidatorError(field, (Validator.LOCALE.MinLength.MUST_BE_LONGER_THAN || Validator.NO_LOCALE).format(field.minLength));
      },
      MaxLength: function(field){
        var value = field.getValue();
        var length = Function.$isNotNull(value.length) ? value.length : String(value).length;
        if (length > field.maxLength)
          return new ValidatorError(field, (Validator.LOCALE.MaxLength.MUST_BE_SHORTER_THAN || Validator.NO_LOCALE).format(field.maxLength));
      }
    };

    //
    // FORM
    //

    var Form = Class(Control, {
      className: namespace + '.Form',
      
      canHaveChildren: false,
      
      template: new Template(
        '<form{element}/>'
      ),

      init: function(config){
        config = this.inherit(complete({ selection: false }, config));

        if (config.target)
          this.element.target = config.target;
          
        if (config.action)
          this.element.action = config.action;
          
        if (config.enctype)
          this.element.enctype = config.enctype;

        Event.addHandler(this.element, 'submit', this.submit, this);
        this.setMethod(config.method);

        this.element.onsubmit = this.submit;
        this.onSubmit = config.onSubmit || Function.$false;

        this.content = new FormContent(complete({ container: this.element, onSubmit: Function.$false }, config));

        return config;
      },
      setData: function(data){
        ;;; if (typeof console != 'undefined') console.warn('Form.setData() method deprecated. Use Form.loadData() instead');
        this.loadData(data);
      },
      loadData: function(data){
        return this.content.loadData(data);
      },
      getFieldByName: function(name){
        return this.content.getFieldByName(name);
      },
      getFieldById: function(id){
        return this.content.getFieldById(id);
      },
      setMethod: function(method){
        this.element.method = method ? method.toUpperCase() : 'POST';
      },
      submit: function(){
        var result = (this.validate() === true) && !this.onSubmit();

        if (result)
          if (this.tagName == 'FORM')
            return false;
          else
            this.element.submit();
        
        return true;  
      },
      setDefaultState: function(){
        ;;; if (typeof console != 'undefined') console.warn('Form.setDefaultState() is deprecated. Use Form.reset() instead');
        return this.content.setDefaultState();
      },
      reset: function(){
        return this.content.reset();
      },
      validate: function(){
        return this.content.validate();
      },
      serialize: function(){
        return this.content.serialize();
      },

      appendChild: function(newChild){
        return this.content.appendChild(newChild);
      },
      removeChild: function(oldChild){
        return this.content.removeChild(oldChild);
      },
      insertBefore: function(newChild, refChild){
        return this.content.insertBefore(newChild, refChild);
      },
      replaceChild: function(newChild, oldChild){
        return this.content.replaceChild(newChild, oldChild);
      },
      clear: function(){
        return this.content.clear();
      },

      destroy: function(){
        this.inherit();
      }
    });

    var FormContent = Class(Control, {
      className: namespace + '.FormContent',
      
      canHaveChildren: true,
      childClass: Field,
      childFactory: function(config){
      	return Field.create(config.type || 'text', complete({ tableLayout: this.tableLayout }, config));
      },

      behaviour: {
        disable: function(){
          for (var field = this.firstChild; field; field = field.nextSibling)
            if (!field.disabled)
              field.dispatch('disable');
        },
        enable: function(){
          for (var field = this.firstChild; field; field = field.nextSibling)
            if (!field.disabled)
              field.dispatch('enable');
        }
      },
      
      template: new Template(
        '<div{element|content|childNodesElement} class="form-content"/>'
      ),
      tableTemplate: new Template(
        '<table{element} class="form-content"><tbody{content|childNodesElement}/></table>'
      ),

      init: function(config){
        if (this.tableLayout = config.tableLayout)
          this.template = this.tableTemplate;/*
          this.element = DOM.createElement('TABLE.form-content', this.content = DOM.createElement('TBODY'));
        else
          this.element = this.content = DOM.createElement('.form-content');
        this.childNodesElement = this.content;*/
      	
        config = this.inherit(config);

        if (config.fields)
          DOM.insert(this, config.fields);

        if (config.onSubmit)
          this.onSubmit = config.onSubmit;

        return config;
      },
      getFieldByName: function(name){
      	return this.childNodes.search(name, 'name');
      },
      getFieldById: function(id){
      	return this.childNodes.search(id, 'id');
      },
      serialize: function(){
        var result = {};
        for (var field = this.firstChild; field; field = field.nextSibling)
        {
          if (field.serializable && field.name)
            result[field.name] = field.getValue();
        }
        return result;
      },
      setData: function(data, withoutValidate){
        ;;; if (typeof console != 'undefined') console.warn('FormContent.setData() method deprecated. Use FormContent.loadData() instead');
        this.loadData(data, withoutValidate);
      },
      loadData: function(data, withoutValidate){
        var names = Object.keys(data);
        for (var field = this.firstChild; field; field = field.nextSibling)
        {
          if (names.indexOf(field.name) != -1)
            field.setValue(data[field.name]);
          else
            field.setDefaultValue();

          field.setValid();  // set undefined valid
        }
        if (!withoutValidate)
          this.validate();
      },
      setDefaultState: function(){
        ;;; if (typeof console != 'undefined') console.warn('FormContent.setDefaultState() is deprecated. Use FormContent.reset() instead');
        this.reset();
      },
      reset: function(){
        for (var field = this.firstChild; field; field = field.nextSibling)
          field.setDefaultValue();
        this.dispatch('reset');
      },
      validate: function(){
        var error, errors = new Array();
        for (var field = this.firstChild; field; field = field.nextSibling)
        {
          if (error = field.validate())
            errors.push(error);
        }
        if (errors.length)
        {
          errors[0].field.select();
          return errors;
        }
        else
          return true;
      },
      submit: function(){
        if (this.parentNode && this.parentNode.submit)
          this.parentNode.submit();
        else
        {
          if (this.validate() === true && this.onSubmit)
            this.onSubmit(this.serialize());
        }
      },
      destroy: function(){
        delete this.onSubmit;

        this.inherit();
      }
    });

    // additional

    var MatchProperty = Class(Property, {
      matchFunction: function(child, reset){
        if (!reset)
        {
          var textNodes = child._m || this.textNodeGetter(child);
          if (textNodes.constructor != Array)
            textNodes = [ textNodes ];

          var hasMatches = false;

          for (var i = 0; i < textNodes.length; i++)
          {                             
            var textNode = textNodes[i];
            if (!textNode)
              continue;

            var hasMatch = false; 
            var p = textNode.nodeValue.split(this.rx);
            if (p.length > 1)
            {
              if (!child._x) 
                child._x = [];
              if (!child._m) 
                child._m = [];

              DOM.replace(
                child._x[i] || textNode,
                child._x[i] = DOM.createElement('SPAN.matched', DOM.wrap(p, this.map))
              );
              child._m[i] = textNode;
              hasMatches = true;
              hasMatch = true;
            }

            if (child._x && child._x[i] && !hasMatch)
            { 
               DOM.replace(child._x[i], child._m[i]);
               child._x[i] = child._m[i];
            }
          }

          return hasMatches;
        }

        if (child._x)
        {
          for (var i = 0; i < child._x.length; i++)
          {                             
            if (child._x[i])
               DOM.replace(child._x[i], child._m[i]);
          }
          delete child._x;
          delete child._m;
        }

        return false;
      },
      changeHandler: function(value){
        this.rx = this.regexpGetter(value);
      },
      init: function(config){
        var startPoints = config.startPoints || '';

        this.node = config.node;
        this.textNodeGetter = getter(config.textNodeGetter || 'titleText');
        this.regexpGetter = typeof config.regexpGetter == 'function'
                              ? config.regexpGetter
                              : function(value){ return new RegExp('(' + startPoints + ')(' + value.forRegExp() + ')', 'i') };
        this.map = {};
        this.map[config.wrapElement || 'SPAN.match'] = function(v, i){ return (i % 3) == 2 };

        this.inherit('', {
          change: this.changeHandler
        }, String.trim);

        if (config.handlers)
          this.addHandler(config.handlers, config.thisObject);
      }
    });

    var NodeMatchHandler = {
      childNodesModified: function(obj, delta){
        /*this.match();*/
        if (delta.inserted)
        {
          for (var i = 0, child; child = delta.inserted[i]; i++)
            this.matchFunction(child, this.value == '');
        }
      }
    }

    var Matcher = Class(MatchProperty, {
      match: function(){
        for(var child = this.node.firstChild; child; child = child.nextSibling)
          this.matchFunction(child, this.value == '');
      },
      changeHandler: function(value){
        this.inherit(value);
        this.match();
      },
      init: function(config){
        this.inherit(config);

        this.node.addHandler(NodeMatchHandler, this);
      }
    });

    var MatchFilter = Class(MatchProperty, {
      changeHandler: function(value){
        this.inherit(value);
        this.node.setMatchFunction(value ? this.matchFunction.bind(this) : null);
      }
    });
    
    var MatchInputHandler = {
      keyup: function(){
        this.matchFilter.set(this.field.value);
      },
      change: function(){
        this.matchFilter.set(this.field.value);
      }
    };

    var MatchInput = Class(HtmlNode, {
      template: new Template(
        '<div{element|content} class="Basis-MatchInput">' +
          '<input{field} type="text"/>' +
        '</div>'
      ),
      matchFilterClass: MatchFilter,
      init: function(config){
        config = this.inherit(config);
        
        this.matchFilter = new this.matchFilterClass(config.matchFilter);
        Event.addHandlers(this.field, MatchInputHandler, this);
        
        return config;
      },
      destroy: function(){
        Event.clearHandlers(this.field);
        this.inhrit();
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Form: Form,
      FormContent: FormContent,
      Field: Field,
      Validator: Validator,
      ValidatorError: ValidatorError,
      ComplexFieldItem: ComplexFieldItem,
      RadioGroupItem: RadioGroupItem,
      CheckGroupItem: CheckGroupItem,
      Combobox: Field.Combobox,
      ComboboxItem: ComboboxItem,
      Matcher: Matcher,
      MatchFilter: MatchFilter,
      MatchInput: MatchInput
    });

  })();
