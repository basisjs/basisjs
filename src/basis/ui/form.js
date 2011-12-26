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

basis.require('basis.html');
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.dom.wrapper');
basis.require('basis.data');
basis.require('basis.data.property');
basis.require('basis.cssom');
basis.require('basis.ui');
basis.require('basis.ui.popup');

!function(basis){

  'use strict';

 /**
  * @see ./demo/defile/form.html
  * @namespace basis.ui.form
  */

  var namespace = 'basis.ui.form';

  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;
  var Template = basis.html.Template;
  var Cleaner = basis.Cleaner;

  var complete = Object.complete;
  var coalesce = Object.coalesce;
  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var AbstractProperty = basis.data.property.AbstractProperty;
  var Property = basis.data.property.Property;
  var EventObject = basis.EventObject;

  var Selection = basis.dom.wrapper.Selection;
  var UIControl = basis.ui.Control;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var Popup = basis.ui.popup.Popup;

  var createEvent = EventObject.createEvent;


  //
  // main part
  //

  var baseFieldTemplate = new Template(
    '<div{selected|sampleContainer} class="Basis-Field">' +
      '<div class="Basis-Field-Title">' +
        '<label>' +
          '<span{title}>{titleText}</span>' +
        '</label>' +
      '</div>' +
      '<div{content} class="Basis-Field-Container">' +
        '<!-- {fieldPlace} -->' +
      '</div>' +
    '</div>'
  );

  function createFieldTemplate(template, injection){
    return new Template(template.source.replace('<!-- {fieldPlace} -->', injection));
  }

  //
  //  Fields
  //

 /**
  * Base class for all form field classes
  * @class
  */
  var Field = UINode.subclass({
    className: namespace + '.Field',

    canHaveChildren: false,
    template: baseFieldTemplate,

    nextFieldOnEnter: true,
    serializable: true,

    event_select: function(){
      DOM.focus(this.tmpl.field, true);

      UINode.prototype.event_select.call(this);
    },
    event_enable: function(){
      this.tmpl.field.removeAttribute('disabled');

      UINode.prototype.event_enable.call(this);
    },
    event_disable: function(){
      this.tmpl.field.setAttribute('disabled', 'disabled');

      UINode.prototype.event_disable.call(this);
    },
    event_input: createEvent('input', 'event'),
    event_change: createEvent('change','event'),
    event_keydown: createEvent('keydown', 'event'),
    event_keypress: createEvent('keypress', 'event'),
    event_keyup: createEvent('keyup', 'event') && function(event){
      if (this.nextFieldOnEnter)
        if ([Event.KEY.ENTER, Event.KEY.CTRL_ENTER].has(Event.key(event)))
        {
          Event.cancelDefault(event);
          this.nextFieldFocus();
        }
        else
          this.setValid();

      EventObject.event.keyup.call(this, event);
    },
    event_focus: createEvent('focus', 'event') && function(event){
      if (this.valid)
        this.setValid();

      EventObject.event.focus.call(this, event);
    },
    event_blur: createEvent('blur', 'event') && function(event){
      this.validate(true);

      EventObject.event.blur.call(this, event);
    },

    init: function(config){
      UINode.prototype.init.call(this, config);

      this.name = this.name || '';

      if (this.tmpl.titleText)
        this.tmpl.titleText.nodeValue = this.title || '';

      // attach button
      /*if (this.button)
      {
        classList(this.element).add('have-button');
        this.button = DOM.createElement('BUTTON', config.caption || '...');
        if (config.button.handler) 
          Event.addHandler(this.button, 'click', config.button.handler, this.button);
        DOM.insert(this.tmpl.field.parentNode, this.button, DOM.INSERT_AFTER, this.tmpl.field);
      }*/

      // set events
      if (this.tmpl.field)
      {
        Event.addHandler(this.tmpl.field, 'keydown',  this.keydown,  this);
        Event.addHandler(this.tmpl.field, 'keyup',    this.keyup,    this);
        Event.addHandler(this.tmpl.field, 'keypress', this.keypress, this);
        Event.addHandler(this.tmpl.field, 'blur',     this.blur,     this);
        Event.addHandler(this.tmpl.field, 'focus',    this.focus,    this);
        Event.addHandler(this.tmpl.field, 'change',   this.change,   this);
        Event.addHandler(this.tmpl.field, 'input',    this.input,    this);

        if (this.name)
          this.tmpl.field.name = this.name;

        if (this.size)
          this.tmpl.field.size = this.size;
      }

      if (!this.validators)
        this.validators = [];

      // set sample
      this.setSample(this.sample);
      
      // set min/max length
      if (this.minLength)
        this.setMinLength(this.minLength);
      if (this.maxLength)
        this.setMaxLength(this.maxLength);

      // set value & default value
      if (this.readOnly)
        this.setReadOnly(this.readOnly);
      
      //if (this.disabled)
      //  this.disable();
      
      if (this.defaultValue !== this.value)
      {
        this.defaultValue = this.value;
        this.setDefaultValue();
      }
    },
    setReadOnly: function(readOnly){
      if (readOnly)
        this.tmpl.field.setAttribute('readonly', 'readonly', 0);
      else
        this.tmpl.field.removeAttribute('readonly', 0);
    },
    setDefaultValue: function(){
      this.setValue(this.defaultValue);
      this.setValid();
    },
    setSample: function(sample){
      if (this.tmpl.sampleContainer && sample)
      {
        if (!this.sampleElement)
          DOM.insert(this.tmpl.sampleContainer, this.sampleElement = DOM.createElement('SPAN.Basis-Field-Sample', sample));
        else
          DOM.insert(DOM.clear(this.sampleElement), sample);
      }
      else
      {
        if (this.sampleElement)
        {
          DOM.remove(this.sampleElement);
          this.sampleElement = null;
        }
      }
    },
    getValue: function(){
      return this.tmpl.field.value;
    },
    setValue: function(newValue){
      newValue = newValue || '';
      if (this.tmpl.field.value != newValue)
      {
        this.tmpl.field.value = newValue;
        this.event_change();
      }
    },
    /*disable: function(){
      if (!this.disabled)
      {
        this.disabled = true;
        this.event_disable();
      }
    },*/
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
    change: function(event){
      this.event_change(event);
    },
    input: function(event){
      this.event_input(event);
    },
    keydown: function(event){
      this.event_keydown(event);
    },
    keyup: function(event){
      this.event_keyup(event);
    },
    keypress: function(event){
      this.event_keypress(event);
    },
    blur: function(event){
      this.event_blur(event);
    },
    focus: function(event){
      this.event_focus(event);
    },
    select: function(){
      this.unselect();
      UINode.prototype.select.apply(this, arguments);
    },
    setValid: function(valid, message){
      var clsList = classList(this.element);

      if (typeof valid == 'boolean')
      {
        clsList.bool('invalid', !valid)
        clsList.bool('valid', valid);
        if (message)
          this.element.title = message;
        else
          this.element.removeAttribute('title');
      }
      else
      {
        clsList.remove('invalid');
        clsList.remove('valid');
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
      var next = DOM.axis(this, DOM.AXIS_FOLLOWING_SIBLING).search(true, 'selectable');

      if (next)
        next.select();
      else
        if (this.parentNode && this.parentNode.submit)
          this.parentNode.submit();
    },
    destroy: function(){
      Event.clearHandlers(this.element);// TODO: remove????
      if (this.tmpl.field)
        Event.clearHandlers(this.tmpl.field);

      if (this.button)
      {
        Event.clearHandlers(this.button);
        delete this.button;
      }
      this.validators.clear();

      UINode.prototype.destroy.call(this);

      delete this.sampleElement;
      delete this.sampleContainer;
      delete this.defaultValue;
      //delete this.field;
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

 /**
  * @class
  */
  Field.Hidden = Field.subclass({
    className: namespace + '.Field.Hidden',

    selectable: false,

    template:
      '<input{field} type="hidden" />'
  });


 /**
  * @class
  */
  Field.Text = Field.subclass({
    className: namespace + '.Field.Text',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="text" />'
    ),

    init: function(config){
      Field.prototype.init.call(this, config);

      if (this.minLength)
        this.attachValidator(Validator.MinLength);

      if (this.autocomplete)
        this.tmpl.field.setAttribute('autocomplete', this.autocomplete);
    },
    setMaxLength: function(len){
      this.tmpl.field.setAttribute('maxlength', len, 0);

      Field.prototype.setMaxLength.call(this, len);
    }
  });


  /**
  * @class
  */
  Field.Password = Field.Text.subclass({
    className: namespace + '.Field.Password',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="password" />'
    )
  });


 /**
  * @class
  */
  Field.File = Field.subclass({
    className: namespace + '.Field.File',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="file" />'
    )
  });


 /**
  * @class
  */
  Field.Textarea = Field.subclass({
    className: namespace + '.Field.Textarea',

    nextFieldOnEnter: false,

    template: createFieldTemplate(baseFieldTemplate,
      '<textarea{field} />'
    ),

    init: function(config){
      //this.value = this.value || '';
      this.counter = DOM.createElement('.counter', Field.LOCALE.Textarea.SYMBOLS_LEFT + ': ', DOM.createText(0));

      //inherit
      Field.prototype.init.call(this, config);

      if (this.minLength)
        this.attachValidator(Validator.MinLength);

      if (this.maxLength)
        this.attachValidator(Validator.MaxLength);

      Event.addHandler(this.tmpl.field, 'keyup', this.updateCounter, this);
      Event.addHandler(this.tmpl.field, 'input', this.updateCounter, this);

      if (window.opera)
      {
        Event.addHandler(this.tmpl.field, 'focus', function(event){
          this.contentEditable = true;
          this.contentEditable = false;
        });
      }
    },
    updateCounter: function(){
      var left = this.maxLength - this.getValue().length;
      this.counter.lastChild.nodeValue = left >= 0 ? left : 0;
    },
    setValue: function(value){
      Field.prototype.setValue.call(this, value);
      this.updateCounter();
    },
    setMaxLength: function(len){
      Field.prototype.setMaxLength.call(this, len);

      if (len)
      {
        this.updateCounter();
        DOM.insert(this.tmpl.sampleContainer, this.counter);
      }
      else
        DOM.remove(this.counter);
    },
    destroy: function(){
      delete this.counter;

      Field.prototype.destroy.call(this);
    }
  });


  /**
  * @class
  */
  Field.Checkbox = Field.subclass({
    className: namespace + '.Field.Checkbox',

    value: false,

    template:
      '<div class="Basis-Field Basis-Field-Checkbox">' +
        '<div{content} class="Basis-Field-Container">' +
          '<label>' +
            '<input{field} type="checkbox" />' +
            '<span>{titleText}</span>' +
          '</label>' +
        '</div>' +
      '</div>',

    /*init: function(config){
      this.value = this.value || false;

      //inherit
      Field.prototype.init.call(this, config);
    },*/
    invert: function(){
      this.setValue(!this.getValue());
    },
    setValue: function(value){
      var state = this.tmpl.field.checked;
      this.tmpl.field.checked = !!value;

      if (state != this.tmpl.field.checked)
        this.event_change();
    },
    getValue: function(){
      return this.tmpl.field.checked;
    }
  });


  /**
  * @class
  */
  Field.Label = Field.subclass({
    className: namespace + '.Field.Label',
    cssClassName: 'Basis-Field-Label',

    template: createFieldTemplate(baseFieldTemplate,
      '<label{field}>{fieldValueText}</label>'
    ),
    valueGetter: Function.$self,
    event_change: function(){
      Field.prototype.event_change.apply(this, arguments);
      this.tmpl.fieldValueText.nodeValue = this.valueGetter(this.getValue());
    }
    /*setValue: function(newValue){
      Field.prototype.setValue.call(this, newValue);
      this.tmpl.fieldValueText.nodeValue = this.tmpl.field.value;
    }*/
  });


  //
  // Complex fields
  //

  var ComplexFieldItem = UINode.subclass({
    className: namespace + '.ComplexField.Item',

    canHaveChildren: false,

    titleGetter: function(item){
      return item.title || item.getValue();
    },
    valueGetter: getter('value'),

    getTitle: function(){
      return this.titleGetter(this);
    },
    getValue: function(){
      return this.valueGetter(this);
    }
  });

  var COMPLEXFIELD_SELECTION_HANDLER = {
    datasetChanged: function(){
      this.event_change();
    }
  }

 /**
  * @class
  */
  var ComplexField = Class(Field, UIContainer, {
    className: namespace + '.Field.ComplexField',
    childClass: ComplexFieldItem,

    template: Field.prototype.template,

    /*childFactory: function(itemConfig){
      var config = {
        //valueGetter: this.itemValueGetter,
        //titleGetter: this.itemTitleGetter
      };

      if (itemConfig.data || itemConfig.delegate)
        complete(config, itemConfig);
      else
        config.data = itemConfig;

      return new this.childClass(config);
    },*/

    multipleSelect: false,

    //itemValueGetter: getter('value'),
    //itemTitleGetter: function(data){ return data.title || data.value; },

    init: function(config){

      this.selection = new Selection({
        multiple: !!this.multipleSelect
      });
      this.selection.addHandler(COMPLEXFIELD_SELECTION_HANDLER, this);

      //inherit
      Field.prototype.init.call(this, config);

      Cleaner.add(this);
    },
    getValue: function(){
      var value = this.selection.getItems().map(getter('getValue()'));
      return !this.selection.multiple ? value[0] : value;
    },
    setValue: function(value/* value[] */){
      var source = this.multipleSelect ? Array.from(value) : [value];

      /*var source = this.selection.multiple 
        ? (value instanceof AbstractProperty
            ? Array.from(value.value).map(function(item){ return this.itemValueGetter(item.value) }, this)
            : Array.from(value)
          )
        : [value];*/

      var selected = {};
      source.forEach(function(key){ selected[key] = true });

      // prevent selection dispatch change event
      var selectedItems = [];
      for (var item = this.firstChild; item; item = item.nextSibling)
        if (selected[item.getValue()])
          selectedItems.push(item);

      this.selection.set(selectedItems);
    },
    destroy: function(){
      Field.prototype.destroy.call(this);

      Cleaner.remove(this);
    }
  });
  
  ComplexField.Item = ComplexFieldItem;

  //
  // Radio group
  //

 /**
  * @class
  */
  var RadioGroupItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.RadioGroup.Item',

    event_select: function(){
      this.tmpl.field.checked = true;
      ComplexFieldItem.prototype.event_select.call(this);

      //classList(this.element).add('selected');
    },
    event_unselect: function(){
      this.tmpl.field.checked = false;
      ComplexFieldItem.prototype.event_unselect.call(this);
      //classList(this.element).remove('selected');
    },
    event_enable: function(){
      this.tmpl.field.removeAttribute('disabled');

      UINode.prototype.event_enable.call(this);
    },
    event_disable: function(){
      this.tmpl.field.setAttribute('disabled', 'disabled');

      UINode.prototype.event_disable.call(this);
    },

    template:
      '<label class="Basis-RadioGroup-Item" event-click="select">' + 
        '<input{field} type="radio" class="radio"/>' +
        '<span{content}>{titleText}</span>' +
      '</label>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);

      tmpl.field.value = this.getValue();
      tmpl.titleText.nodeValue = this.getTitle();
    },

    action: {
      select: function(event){
        if (!this.isDisabled())
          this.select();
      }
    }
  });


 /**
  * @class
  */
  Field.RadioGroup = ComplexField.subclass({
    className: namespace + '.Field.RadioGroup',

    childClass: RadioGroupItem,

    template: createFieldTemplate(baseFieldTemplate,
      '<div{field|childNodesElement} class="Basis-RadioGroup"></div>'
    ),

    childFactory: function(config){
      var child = ComplexField.prototype.childFactory.call(this, config);

      if (this.name)
        child.tmpl.field.name = this.name;

      return child;
    }
  });

  Field.RadioGroup.Item = RadioGroupItem;


  //
  // Check Group
  //

 /**
  * @class
  */
  var CheckGroupItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.CheckGroup.Item',

    event_select: function(){
      this.tmpl.field.checked = true;
      ComplexFieldItem.prototype.event_select.call(this);
    },
    event_unselect: function(){
      this.tmpl.field.checked = false;
      ComplexFieldItem.prototype.event_unselect.call(this);
    },
    event_enable: function(){
      this.tmpl.field.removeAttribute('disabled');

      UINode.prototype.event_enable.call(this);
    },
    event_disable: function(){
      this.tmpl.field.setAttribute('disabled', 'disabled');

      UINode.prototype.event_disable.call(this);
    },

    template:
      '<label event-click="click">' + 
        '<input{field} type="checkbox"/>' +
        '<span{content}>{titleText}</span>' +
      '</label>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);

      this.tmpl.field.value = this.getValue();
      this.tmpl.titleText.nodeValue = this.getTitle();
    },

    action: {
      click: function(event){
        if (!this.isDisabled())
        {
          this.select(this.parentNode.multipleSelect);

          if (Event.sender(event).tagName != 'INPUT')
            Event.kill(event);
        }
      }
    }
  });


 /**
  * @class
  */
  Field.CheckGroup = ComplexField.subclass({
    className: namespace + '.Field.CheckGroup',

    childClass: CheckGroupItem,

    multipleSelect: true,

    template: createFieldTemplate(baseFieldTemplate,
      '<div{field|childNodesElement} class="Basis-CheckGroup"></div>'
    )
  });

  Field.CheckGroup.Item = CheckGroupItem;

  //
  // Select
  //

  var SelectItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.Select.Item',

    event_select: function(){
      if (this.parentNode)
        this.parentNode.setValue(this.getValue());
    },
    event_unselect: function(){
      if (this.parentNode)
        this.parentNode.setValue();
    },

    template:
      '<option{field}>{titleText}</option>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);

      tmpl.field.value = this.getValue();
      tmpl.field.text = this.getTitle();
    }
  });


 /**
  * @class
  */
  Field.Select = ComplexField.subclass({
    className: namespace + '.Field.Select',

    childClass: SelectItem,
    
    template: createFieldTemplate(baseFieldTemplate,
      '<select{field|childNodesElement} />'
    ),

    event_keyup: function(object, event){
      this.change();

      ComplexField.prototype.event_keyup.call(this, object, event);
    },

    setValue: function(value){
      var item = this.childNodes.search(value, 'getValue()');

      if (item)
        this.selection.set([item]);
      else
        this.selection.clear();
    }
  });

  Field.Select.Item = SelectItem;

  //
  //  Combobox
  //

  var ComboboxPopupHandler = {
    show: function(){
      classList(this.tmpl.field).add('Basis-DropdownList-Opened'); 
    },
    hide: function(){
      classList(this.tmpl.field).remove('Basis-DropdownList-Opened'); 
    }
  };

  //
  // Combobox
  //

  var ComboboxItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.Combobox.Item',

    //titleGetter: Function.getter('data.title'),
    //valueGetter: Function.getter('data.value'),

    template:
      '<div class="Basis-Combobox-Item" event-click="click">{titleText}</div>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);
      tmpl.titleText.nodeValue = this.getTitle();
    },

    action: {
      click: function(event){
        if (!this.isDisabled())
        {
          this.select();

          if (this.parentNode)
            this.parentNode.hide();

          Event.kill(event);
        }
      }
    }
  });

  var ComboboxCaptionHandlers = {
    /*blur: function(){
      this.hide();
    },*/
    keyup: function(event){
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
      }

      if (cur)
      {
        cur.select();
        DOM.focus(this.tmpl.field);
      }
    },
    keydown: function(event){
      var key = Event.key(event);
      if (key == Event.KEY.DOWN || key == Event.KEY.UP)
      {
        Event.kill(event);
      }
      else if (key == Event.KEY.ENTER)
      {
        if (this.popup.visible)
          this.hide();

        Event.kill(event);
      }
    }
  };
  
  Field.Combobox = ComplexField.subclass({
    className: namespace + '.Field.Combobox',

    childClass: ComboboxItem,

    event_enable: function(){
      if (this.delegate && this.delegate.select)
        this.delegate.select();

      ComplexField.prototype.event_enable.call(this);
    },
    /*event_update: function(object, delta){
      ComplexField.prototype.event_update.call(this, object, delta);
      // update title
      var title = this.getTitle() || this.getValue() || '';

      this.tmpl.field.title = 
      this.tmpl.captionText.nodeValue = this.captionFormater(title, this.getValue());
    },*/
    event_change: function(){
      ComplexField.prototype.event_change.call(this);

      var value = this.getValue();

      if (this.property)
        this.property.set(value);

      if (this.hidden)
        this.hidden.value = value;

      if (this.satellite)
        this.satellite.captionItem.setDelegate(this.selection.pick());
    },
    //}),

    caption: null,
    popup: null,
    property: null,

    template: createFieldTemplate(baseFieldTemplate,
      '<span{field} class="Basis-DropdownList" event-click="click" tabindex="0">' +
        '<span class="Basis-DropdownList-Caption"><!--{captionItem}--></span>' +
        '<span class="Basis-DropdownList-Trigger"/>' +
      '</span>' +
      '<div{content|childNodesElement} class="Basis-DropdownList-PopupContent" />'
    ),

    action: {
      click: function(event){
        if (this.isDisabled() || this.popup.visible)
          this.hide();
        else
          this.show({});

        Event.kill(event);
      }
    },

    init: function(config){
      if (!basis.ui.popup)
        throw new Error('basis.ui.popup required for DropDownList');

      if (this.property)
        this.value = this.property.value;

      this.satelliteConfig = UIContainer.prototype.satelliteConfig.__extend__({
        captionItem: {
          instanceOf: this.childClass,
          delegate: getter('selection.pick()'),
          config: {
            getTitle: function(){
              return this.delegate && this.delegate.getTitle();
            },
            getValue: function(){
              return this.delegate && this.delegate.getValue();
            },
            handler: {
              delegateChanged: function(){
                this.event_update(this, {});
              }
            }
          }
        }
      });

      // inherit
      ComplexField.prototype.init.call(this, config);

      this.satellite.captionItem.setDelegate(this.selection.pick());

      Event.addHandlers(this.tmpl.field, ComboboxCaptionHandlers, this);

      if (this.name)
        DOM.insert(this.tmpl.field, this.hidden = DOM.createElement('INPUT[type=hidden][name={0}]'.format(String(this.name).quote())));

      // create items popup
      this.popup = new Popup(complete({
        cssClassName: 'Basis-DropdownList-Popup',
        autorotate: 1,
        ignoreClickFor: [this.tmpl.field],
        thread: this.thread,
        content: this.childNodesElement,
        handler: ComboboxPopupHandler,
        handlerContext: this
      }, this.popup));

      if (this.property)
        this.property.addLink(this, this.setValue);
    },
    /*select: function(){
      ComplexField.prototype.select.call(this);
      DOM.focus(this.tmpl.field);
    },*/
    show: function(){
      this.popup.show(this.tmpl.field); 
      this.select();
    },
    hide: function(){
      this.popup.hide();
    },
    getTitle: function(){
      var selected = this.selection.pick();
      return selected && selected.getTitle();
    },
    getValue: function(){
      var selected = this.selection.pick();
      return selected && selected.getValue();
    },
    setValue: function(value){
      /*if (value instanceof AbstractProperty)
        value = this.itemValueGetter(value.value);*/
      if (this.getValue() != value)
      {
        // update value & selection
        var item = this.childNodes.search(value, 'getValue()');
        if (item && !item.isDisabled())
          this.selection.set([item]);
        else
          this.selection.clear();

      }
    },
    destroy: function(){

      if (this.property)
      {
        this.property.removeLink(this);
        this.property = null;
      }

      this.popup.destroy();
      this.popup = null;

      ComplexField.prototype.destroy.call(this);
    }
  });

  Field.Combobox.Item = ComboboxItem;

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
      var value = field.getValue().trim();
      if (value != '' && !value.match(/^[a-z0-9\.\-\_]+\@(([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/i))
        return new ValidatorError(field, Validator.LOCALE.Email.WRONG_FORMAT || Validator.NO_LOCALE);
    },
    Url: function(field){
      var value = field.getValue().trim();
      if (value != '' && !value.match(/^(https?\:\/\/)?((\d{1,3}\.){3}\d{1,3}|([a-zA-Z][a-zA-Z\d\-]+\.)+[a-zA-Z]{2,6})(:\d+)?(\/[^\?]*(\?\S(\=\S*))*(\#\S*)?)?$/i))
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

 /**
  * @class
  */
  var FormContent = UIControl.subclass({
    className: namespace + '.FormContent',
    
    canHaveChildren: true,
    childClass: Field,
    childFactory: function(config){
      return Field.create(config.type || 'text', config);
    },

    onSubmit: Function.$false,

    event_reset: createEvent('reset'),
    event_disable: function(){
      for (var field = this.firstChild; field; field = field.nextSibling)
        if (!field.disabled)
          field.event_disable();

       UIControl.prototype.event_disable.call(this);
    },
    event_enable: function(){
      for (var field = this.firstChild; field; field = field.nextSibling)
        if (!field.disabled)
          field.event_enable();

      UIControl.prototype.event_enable.call(this);
    },
    
    template:
      '<div class="Basis-FormContent" />',

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
      this.event_reset();
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
      if (this.validate() === true && this.onSubmit)
        this.onSubmit(this.serialize());
    }
  });

 /**
  * @class
  */
  var Form = FormContent.subclass({
    className: namespace + '.Form',
    
    template:
      '<form{formElement} class="Basis-Form">' +
        '<div{content|childNodesElement} class="Basis-FormContent" />' +
      '</form>',

    method: 'POST',

    init: function(config){
      this.selection = false;

      UIControl.prototype.init.call(this, config);

      if (this.target)
        this.formElement.target = this.target;

      if (this.action)
        this.formElement.action = this.action;

      if (this.enctype)
        this.formElement.enctype = this.enctype;

      Event.addHandler(this.formElement, 'submit', this.submit, this);

      this.formElement.onsubmit = this.submit;

      this.setMethod(this.method);
    },
    setMethod: function(method){
      this.formElement.method = method ? method.toUpperCase() : 'POST';
    },
    submit: function(){
      var result = (this.validate() === true) && !this.onSubmit();

      if (result)
        if (this.tagName == 'FORM')
          return false;
        else
          this.formElement.submit();

      return true;
    }
  });

  // additional

 /**
  * @class
  */
  var MatchProperty = Property.subclass({
    className: namespace + '.MatchProperty',

    matchFunction: function(child, reset){
      if (!reset)
      {
        var textNodes = child._original || this.textNodeGetter(child);

        if (!Array.isArray(textNodes))
          textNodes = [ textNodes ];

        child._original = textNodes;

        var matchCount = 0;

        for (var i = textNodes.length; i --> 0;)
        {
          var textNode = textNodes[i];

          if (!textNode)
            continue;

          var p = textNode.nodeValue.split(this.rx);
          if (p.length > 1)
          {
            if (!child._replaced) 
              child._replaced = {};

            DOM.replace(
              child._replaced[i] || textNode,
              child._replaced[i] = DOM.createElement('SPAN.matched', DOM.wrap(p, this.map))
            );

            matchCount++;
          }
          else
            if (child._replaced && child._replaced[i])
            { 
               DOM.replace(child._replaced[i], textNode);
               delete child._replaced[i];
            }
        }

        return matchCount > 0;
      }

      if (child._replaced)
      {
        for (var key in child._replaced)
          DOM.replace(child._replaced[key], child._original[key]);

        delete child._replaced;
        delete child._original;
      }

      return false;
    },

    event_change: function(value, oldValue){
      this.rx = this.regexpGetter(value);

      Property.prototype.event_change.call(this, value, oldValue);
    },

    extendConstructor_: true,

    init: function(config){
      var startPoints = this.startPoints || '';

      this.textNodeGetter = getter(this.textNodeGetter || 'tmpl.titleText');

      if (typeof this.regexpGetter != 'function')
        this.regexpGetter = function(value){ 
          return new RegExp('(' + startPoints + ')(' + value.forRegExp() + ')', 'i') 
        };

      this.map = {};
      this.map[this.wrapElement || 'SPAN.match'] = function(v, i){ return (i % 3) == 2 };

      Property.prototype.init.call(this, '', this.handlers, String.trim);

      /*if (this.handlers)
        this.addHandler(this.handlers);*/
    }
  });

  var NodeMatchHandler = {
    childNodesModified: function(object, delta){
      delta.inserted && delta.inserted.forEach(function(child){
        this.matchFunction(child, this.value == '');
      }, this);
    }
  }

 /**
  * @class
  */
  var Matcher = MatchProperty.subclass({
    className: namespace + '.Matcher',

    event_change: function(value, oldValue){
      MatchProperty.prototype.event_change.call(this, value, oldValue);

      this.match();
    },

    init: function(config){
      MatchProperty.prototype.init.call(this, config);

      this.node.addHandler(NodeMatchHandler, this);
    },

    match: function(){
      this.node.childNodes.forEach(function(child){
        this.matchFunction(child, this.value == '');
      }, this);
    }
  });

 /**
  * @class
  */
  var MatchFilter = MatchProperty.subclass({
    className: namespace + '.MatchFilter',

    event_change: function(value, oldValue){
      MatchProperty.prototype.event_change.call(this, value, oldValue);

      this.node.setMatchFunction(value ? this.matchFunction.bind(this) : null);
    }
  });
  
 /**
  * @class
  */
  var MatchInput = Field.Text.subclass({
    className: namespace + '.MatchInput',
    cssClassName: 'Basis-MatchInput',

    matchFilterClass: MatchFilter,

    event_keyup: function(event){
      this.matchFilter.set(this.tmpl.field.value);

      Field.Text.prototype.event_keyup.call(this, event);
    },

    event_change: function(event){
      this.matchFilter.set(this.tmpl.field.value);

      Field.Text.prototype.event_change.call(this, event);
    },

    init: function(config){
      Field.Text.prototype.init.call(this, config);

      this.matchFilter = new this.matchFilterClass(this.matchFilter);
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    createFieldTemplate: function(template){
      return createFieldTemplate(baseFieldTemplate, template)
    },
    FormContent: FormContent,
    Form: Form,
    Field: Field,
    Validator: Validator,
    ValidatorError: ValidatorError,
    RadioGroup: Field.RadioGroup,
    CheckGroup: Field.CheckGroup,
    Combobox: Field.Combobox,
    ComplexField: ComplexField,
    Matcher: Matcher,
    MatchFilter: MatchFilter,
    MatchInput: MatchInput
  });

}(basis);
