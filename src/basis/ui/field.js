
  basis.require('basis.l10n');
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.data.value');
  basis.require('basis.ui');
  basis.require('basis.ui.popup');


 /**
  * @see ./demo/defile/form.html
  * @namespace basis.ui.field
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;

  var complete = basis.object.complete;
  var getter = basis.getter;
  var arrayFrom = basis.array.from;
  var createEvent = basis.event.create;
  var events = basis.event.events;
  var l10nToken = basis.l10n.token;

  var Property = basis.data.value.Property;
  var Selection = basis.dom.wrapper.Selection;
  var UINode = basis.ui.Node;
  var Popup = basis.ui.popup.Popup;


  //
  // definitions
  //

  var dict = basis.l10n.dictionary(__filename);

  var templates = basis.template.define(namespace, {
    Example: resource('templates/field/Example.tmpl'),
    Description: resource('templates/field/Description.tmpl'),
    Counter: resource('templates/field/Counter.tmpl'),

    Field: resource('templates/field/Field.tmpl'),
    File: resource('templates/field/File.tmpl'),
    Hidden: resource('templates/field/Hidden.tmpl'),
    Text: resource('templates/field/Text.tmpl'),
    Password: resource('templates/field/Password.tmpl'),
    Textarea: resource('templates/field/Textarea.tmpl'),
    Checkbox: resource('templates/field/Checkbox.tmpl'),
    Label: resource('templates/field/Label.tmpl'),

    RadioGroup: resource('templates/field/RadioGroup.tmpl'),
    RadioGroupItem: resource('templates/field/RadioGroupItem.tmpl'),

    CheckGroup: resource('templates/field/CheckGroup.tmpl'),
    CheckGroupItem: resource('templates/field/CheckGroupItem.tmpl'),

    Select: resource('templates/field/Select.tmpl'),
    SelectItem: resource('templates/field/SelectItem.tmpl'),

    Combobox: resource('templates/field/Combobox.tmpl'),
    ComboboxItem: resource('templates/field/ComboboxItem.tmpl'),
    ComboboxDropdownList: resource('templates/field/ComboboxDropdownList.tmpl'),

    MatchInput: resource('templates/field/MatchInput.tmpl')
  });

  basis.template.define(namespace + '.native', {
    text: resource('templates/field/native-type-text.tmpl'),
    password: resource('templates/field/native-type-password.tmpl'),
    textarea: resource('templates/field/native-type-textarea.tmpl'),
    checkbox: resource('templates/field/native-type-checkbox.tmpl'),
    radio: resource('templates/field/native-type-radio.tmpl'),
    select: resource('templates/field/native-type-select.tmpl'),
    file: resource('templates/field/native-type-file.tmpl')
  });


  //
  // main part
  //

  /** @const */ var VALIDITY_INDETERMINATE = 'indeterminate';
  /** @const */ var VALIDITY_VALID = 'valid';
  /** @const */ var VALIDITY_INVALID = 'invalid';

  function getFieldValue(field){
    return field.getValue();
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

    //
    // properties
    //

    childClass: null,

    nextFieldOnEnter: true,
    serializable: true,

    name: '',
    title: '',
    validators: null,
    validity: VALIDITY_INDETERMINATE,
    error: '',
    example: null,
    focused: false,
    defaultValue: undefined,
    value: undefined,

    /**
    * Identify field can have focus. Useful when search for next/previous node to focus.
    * @type {boolean}
    */
    focusable: true,

    //
    // events
    //

    emit_commit: createEvent('commit'),
    emit_change: createEvent('change', 'oldValue'),
    emit_validityChanged: createEvent('validityChanged', 'oldValidity'),
    emit_errorChanged: createEvent('errorChanged'),
    emit_exampleChanged: createEvent('exampleChanged'),
    emit_descriptionChanged: createEvent('descriptionChanged'),

    emit_fieldInput: createEvent('fieldInput', 'event'),
    emit_fieldChange: createEvent('fieldChange', 'event'),
    emit_fieldKeydown: createEvent('fieldKeydown', 'event'),
    emit_fieldKeypress: createEvent('fieldKeypress', 'event'),
    emit_fieldKeyup: createEvent('fieldKeyup', 'event') && function(event){
      if (this.nextFieldOnEnter)
      {
        if (event.key == event.KEY.ENTER || event.key == event.KEY.CTRL_ENTER)
        {
          event.preventDefault();
          this.commit();
        }
        else
        {
          if (event.key != event.KEY.TAB)
            this.setValidity();
        }
      }

      events.fieldKeyup.call(this, event);
    },
    emit_fieldFocus: createEvent('fieldFocus', 'event') && function(event){
      this.focused = true;
      /*if (this.validity)
        this.setValidity();*/

      events.fieldFocus.call(this, event);
    },
    emit_fieldBlur: createEvent('fieldBlur', 'event') && function(event){
      this.validate(true);
      this.focused = false;

      events.fieldBlur.call(this, event);
    },

    //
    // template
    //

    template: templates.Field,
    binding: {
      focused: {
        events: 'fieldFocus fieldBlur',
        getter: function(node){
          return node.focused ? 'focused' : '';
        }
      },
      name: 'name',
      titleText: 'title',
      value: {
        events: 'change',
        getter: function(node){
          return node.getValue();
        }
      },
      defaultValue: {
        getter: 'defaultValue'
      },
      validity: {
        events: 'validityChanged',
        getter: 'validity'
      },
      error: {
        events: 'errorChanged',
        getter: 'error'
      },
      example: 'satellite:',
      description: 'satellite:'
    },

    action: 'focus blur change keydown keypress keyup input'.split(' ').reduce(
      function(res, item){
        var eventName = 'emit_field' + basis.string.capitalize(item);
        res[item] = function(event){
          this.syncFieldValue_();
          this[eventName](event);
        };
        return res;
      },
      {}
    ),

    satellite: {
      example: {
        events: 'exampleChanged',
        existsIf: function(owner){
          return owner.example;
        },
        instanceOf: UINode.subclass({
          className: namespace + '.Example',
          template: templates.Example,
          binding: {
            example: 'owner.example'
          },
          listen: {
            owner: {
              exampleChanged: function(){
                this.updateBind('example');
              }
            }
          }
        })
      },
      description: {
        events: 'descriptionChanged',
        existsIf: function(owner){
          return owner.description;
        },
        instanceOf: UINode.subclass({
          className: namespace + '.Description',
          template: templates.Description,
          binding: {
            description: 'owner.description'
          },
          listen: {
            owner: {
              descriptionChanged: function(){
                this.updateBind('description');
              }
            }
          }
        })
      }
    },

    //
    // methods
    //

    init: function(){
      this.validators = arrayFrom(this.validators);

      if (typeof this.defaultValue == 'undefined')
        this.defaultValue = this.value;

      UINode.prototype.init.call(this);

      if (this.value)
        this.setValue(this.value);
    },

    setExample: function(example){
      if (example != this.example)
      {
        this.example = example;
        this.emit_exampleChanged();
      }
    },
    setDescription: function(description){
      if (description != this.description)
      {
        this.description = description;
        this.emit_descriptionChanged();
      }
    },

    syncFieldValue_: function(){
      this.setValue(this.getValue());
    },
    getValue: function(){
      return this.value;
    },
    setValue: function(newValue){
      if (this.value !== newValue)
      {
        var oldValue = this.value;
        this.value = newValue;
        this.emit_change(oldValue);
      }
    },
    reset: function(){
      this.setValue(this.defaultValue);
      this.setValidity();
    },

    attachValidator: function(validator, validate){
      if (basis.array.add(this.validators, validator) && validate)
        this.validate();
    },
    detachValidator: function(validator, validate){
      if (basis.array.remove(this.validators, validator) && validate)
        this.validate();
    },
    setValidity: function(validity, message){
      if (!validity)
        validity = VALIDITY_INDETERMINATE;

      if (this.validity !== validity)
      {
        this.validity = validity;
        this.emit_validityChanged();
      }

      if (!message || validity != VALIDITY_INVALID)
        message = '';

      if (this.error != message)
      {
        this.error = message;
        this.emit_errorChanged();
      }
    },
    validate: function(onlyValid){
      var error;

      this.setValidity();
      for (var i = 0; i < this.validators.length; i++)
        if (error = this.validators[i](this))
        {
          if (!onlyValid)
            this.setValidity(VALIDITY_INVALID, error.message);

          return error;
        }

      if (this.getValue() != '')
        this.setValidity(VALIDITY_VALID);
    },

    commit: function(){
      this.emit_commit();
    },

    destroy: function(){
      this.validators = null;
      this.error = null;
      this.example = null;

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // Simple fields
  //

 /**
  * @class
  */
  var File = Field.subclass({
    className: namespace + '.File',

    template: templates.File
  });

 /**
  * @class
  */
  var TextField = Field.subclass({
    className: namespace + '.TextField',

    emit_minLengthChanged: createEvent('minLengthChanged'),
    emit_maxLengthChanged: createEvent('maxLengthChanged'),

    defaultValue: '',
    readOnly: false,
    minLength: 0,
    maxLength: 0,
    autocomplete: '',
    placeholder: '',

    binding: {
      minlength: {
        events: 'minLengthChanged',
        getter: function(field){
          return field.minLength > 0 ? field.minLength : '';
        }
      },
      maxlength: {
        events: 'maxLengthChanged',
        getter: function(field){
          return field.maxLength > 0 ? field.maxLength : '';
        }
      },
      readonly: function(node){
        return node.readOnly ? 'readonly' : '';
      },
      autocomplete: 'autocomplete',
      placeholder: 'placeholder'
    },

    init: function(){
      if (typeof this.value == 'undefined')
        this.value = '';

      Field.prototype.init.call(this);

      var minLength = this.minLength;
      delete this.minLength;
      this.setMinLength(minLength);

      var maxLength = this.maxLength;
      delete this.maxLength;
      this.setMaxLength(maxLength);
    },
    setValue: function(newValue){
      return Field.prototype.setValue.call(this, newValue == null ? '' : String(newValue));
    },
    setReadOnly: function(readOnly){
      this.readOnly = !!readOnly;
      this.updateBind('readonly');
    },
    setMinLength: function(len){
      len = Math.max(parseInt(len, 10) || 0, 0);

      if (this.minLength != len)
      {
        if (!this.minLength ^ !len)
        {
          if (len)
            this.attachValidator(Validator.MinLength);
          else
            this.detachValidator(Validator.MinLength);
        }

        this.minLength = len;
        this.emit_minLengthChanged();
      }
    },
    setMaxLength: function(len){
      len = Math.max(parseInt(len, 10) || 0, 0);

      if (this.maxLength != len)
      {
        if (!this.maxLength ^ !len)
        {
          if (len)
            this.attachValidator(Validator.MaxLength);
          else
            this.detachValidator(Validator.MaxLength);
        }

        this.maxLength = len;
        this.emit_maxLengthChanged();
      }
    },

    syncFieldValue_: function(){
      if (this.tmpl && this.tmpl.field)
        this.setValue(this.tmpl.field.value);
    }
  });

 /**
  * @class
  */
  var Hidden = TextField.subclass({
    className: namespace + '.Hidden',

    focusable: false,

    template: templates.Hidden
  });

 /**
  * @class
  */
  var Text = TextField.subclass({
    className: namespace + '.Text',

    template: templates.Text
  });


  /**
  * @class
  */
  var Password = TextField.subclass({
    className: namespace + '.Password',

    template: templates.Password
  });


 /**
  * @class
  */
  var Textarea = TextField.subclass({
    className: namespace + '.Textarea',

    nextFieldOnEnter: false,
    symbolsLeft: 0,

    emit_symbolsLeftChanged: createEvent('symbolsLeftChanged'),
    emit_fieldFocus: !window.opera
      ? TextField.prototype.emit_fieldFocus
        // fix opera's bug: when invisible textarea becomes visible and user
        // changes it content, value property returns empty string instead of field value
      : function(event){
          this.contentEditable = true;
          this.contentEditable = false;
          TextField.prototype.emit_fieldFocus.call(this, event);
        },

    template: templates.Textarea,

    binding: {
      availChars: {
        events: 'symbolsLeftChanged',
        getter: 'symbolsLeft'
      },
      counter: 'satellite:'
    },

    action: {
      updateSymbolsLeft: function(){
        this.updateSymbolsLeft();
      }
    },

    satellite: {
      counter: {
        events: 'maxLengthChanged',
        existsIf: function(owner){
          return owner.maxLength > 0;
        },
        instanceOf: UINode.subclass({
          className: namespace + '.Counter',

          template: templates.Counter,
          binding: {
            availChars: function(node){
              return node.owner.symbolsLeft;
            }
          },

          listen: {
            owner: {
              symbolsLeftChanged: function(){
                this.updateBind('availChars');
              }
            }
          }
        })
      }
    },

    init: function(){
      TextField.prototype.init.call(this);
      this.updateSymbolsLeft();
    },

    updateSymbolsLeft: function(){
      var symbolsLeft = this.maxLength ? this.maxLength - this.getValue().length : -1;

      if (symbolsLeft <= 0)
        symbolsLeft = 0;

      if (this.symbolsLeft != symbolsLeft)
      {
        this.symbolsLeft = symbolsLeft;
        this.emit_symbolsLeftChanged();
      }
    }
  });


  /**
  * @class
  */
  var Checkbox = Field.subclass({
    className: namespace + '.Checkbox',

    value: false,

    template: templates.Checkbox,

    binding: {
      checked: {
        events: 'change',
        getter: function(field){
          return field.value ? 'checked' : '';
        }
      }
    },

    toggle: function(){
      this.setValue(!this.getValue());
    },
    setValue: function(value){
      return Field.prototype.setValue.call(this, !!value);
    },
    syncFieldValue_: function(){
      if (this.tmpl && this.tmpl.field)
        this.setValue(!!this.tmpl.field.checked);
    }
  });


  /**
  * @class
  */
  var Label = Field.subclass({
    className: namespace + '.Label',

    focusable: false,

    template: templates.Label
  });


  //
  // Complex fields
  //

 /**
  * @class
  */
  var ComplexFieldItem = UINode.subclass({
    className: namespace + '.ComplexFieldItem',

    childClass: null,
    name: '',

    binding: {
      name: 'name',
      title: function(node){
        return node.getTitle();
      },
      value: function(node){
        return node.getValue();
      },
      checked: {
        events: 'select unselect',
        getter: function(item){
          return item.selected ? 'checked' : '';
        }
      }
    },

    action: {
      select: function(event){
        if (!this.isDisabled())
        {
          this.select(this.contextSelection ? this.contextSelection.multiple : false);

          if (event.sender.tagName != 'INPUT')
            event.die();
        }
      }
    },

    titleGetter: basis.getter(function(item){
      return item.title || item.getValue();
    }),
    valueGetter: getter('value'),

    getTitle: function(){
      return this.titleGetter(this);
    },
    getValue: function(){
      return this.valueGetter(this);
    },

    setName: function(name){
      if (this.name != name)
      {
        this.name = name;
        this.updateBind('name');
      }
    }
  });

  var COMPLEXFIELD_SELECTION_HANDLER = {
    itemsChanged: function(){
      this.emit_change();
    }
  };

 /**
  * @class
  */
  var ComplexField = Class(Field, {
    className: namespace + '.ComplexField',

    childClass: ComplexFieldItem,

    selection: {
      multiple: false
    },
    binding: {
      multiple: function(node){
        return node.selection.multiple;
      }
    },
    listen: {
      selection: {
        itemsChanged: function(){
          this.emit_change();
        }
      }
    },

    getValue: function(){
      var value = this.selection.getItems().map(getFieldValue);
      return this.selection.multiple ? value : value[0];
    },
    setValue: function(value){
      var selected;

      if (this.selection.multiple)
        selected = this.childNodes.filter(function(item){
          return this.indexOf(item.getValue()) != -1;
        }, arrayFrom(value));
      else
        selected = [basis.array.search(this.childNodes, value, getFieldValue)];

      this.selection.set(selected);
    }
  });


  //
  // Radio group
  //

 /**
  * @class
  */
  var RadioGroup = ComplexField.subclass({
    className: namespace + '.RadioGroup',

    template: templates.RadioGroup,

    childClass: {
      className: namespace + '.RadioGroupItem',

      template: templates.RadioGroupItem
    }
  });


  //
  // Check Group
  //

 /**
  * @class
  */
  var CheckGroup = ComplexField.subclass({
    className: namespace + '.CheckGroup',

    template: templates.CheckGroup,

    selection: {
      multiple: true
    },

    childClass: {
      className: namespace + '.CheckGroupItem',

      template: templates.CheckGroupItem
    }
  });


  //
  // Select
  //

 /**
  * @class
  */
  var Select = ComplexField.subclass({
    className: namespace + '.Select',

    template: templates.Select,

    syncFieldValue_: function(){
      if (this.tmpl && this.tmpl.field)
      {
        var selected;

        if (this.selection.multiple && this.tmpl.field.selectedIndex != -1)
          selected = this.childNodes.filter(function(item){
            return item.tmpl && item.tmpl.field && item.tmpl.field.selected;
          });
        else
          selected = [this.childNodes[this.tmpl.field.selectedIndex]];

        this.selection.set(selected);
      }
    },

    childClass: {
      className: namespace + '.SelectItem',

      template: templates.SelectItem
    }
  });


  //
  //  Combobox
  //

  var ComboboxPopupHandler = {
    show: function(){
      this.updateBind('opened');
    },
    hide: function(){
      this.updateBind('opened');
    }
  };

 /**
  * @class
  */
  var ComboboxItem = ComplexFieldItem.subclass({
    className: namespace + '.ComboboxItem',

    template: templates.ComboboxItem,

    binding: {
      title: function(node){
        return node.getTitle() || '\xA0';
      }
    },

    action: {
      select: function(event){
        if (!this.isDisabled())
        {
          this.select();

          if (this.parentNode)
            this.parentNode.hide();

          event.die();
        }
      }
    }
  });

  var COMBOBOX_SELECTION_HANDLER = {
    itemsChanged: function(selection){
      this.setDelegate(selection.pick());
    }
  }

 /**
  * @class
  */
  var Combobox = ComplexField.subclass({
    className: namespace + '.Combobox',

    childClass: ComboboxItem,

    emit_change: function(event){
      ComplexField.prototype.emit_change.call(this, event);

      var value = this.getValue();

      if (this.property)
        this.property.set(value);
    },

    emit_childNodesModified: function(delta){
      ComplexField.prototype.emit_childNodesModified.call(this, delta);
      if (this.property)
        this.setValue(this.property.value);
    },

    caption: null,
    popup: null,
    popupClass: Popup.subclass({
      className: namespace + '.ComboboxDropdownList',
      template: templates.ComboboxDropdownList,
      autorotate: 1,
      templateSync: function(){
        Popup.prototype.templateSync.call(this);

        if (this.owner && this.owner.childNodesElement)
          DOM.insert(this.tmpl.content || this.element, this.owner.childNodesElement);
      }
    }),
    property: null,

    template: templates.Combobox,

    binding: {
      captionItem: 'satellite:',
      hiddenField: 'satellite:',
      opened: function(node){
        return node.popup.visible ? 'opened' : '';
      }
    },

    satellite: {
      hiddenField: {
        existsIf: function(owner){
          return owner.name;
        },
        instanceOf: Hidden.subclass({
          className: namespace + '.ComboboxHidden',
          getValue: function(){
            return this.owner.getValue();
          },
          listen: {
            owner: {
              change: function(){
                this.updateBind('value');
              }
            }
          }
        }),
        config: function(owner){
          return {
            name: owner.name,
            value: owner.getValue()
          };
        }
      }
    },

    action: {
      togglePopup: function(){
        if (this.isDisabled() || this.popup.visible)
          this.hide();
        else
          this.show();
      },
      keyup: function(event){
        var cur = this.selection.pick();
        var next;

        switch (event.key)
        {
          case event.KEY.DOWN:
            if (event.altKey)
            {
              if (this.popup.visible)
                this.hide();
              else
                if (!this.isDisabled())
                  this.show();
              return;
            }

            next = basis.array.search(DOM.axis(cur || this.firstChild, DOM.AXIS_FOLLOWING_SIBLING), false, 'disabled');
          break;

          case event.KEY.UP:
            if (event.altKey)
            {
              if (this.popup.visible)
                this.hide();
              else
                if (!this.isDisabled())
                  this.show();
              return;
            }

            next = basis.array.search(DOM.axis(cur || this.lastChild, DOM.AXIS_PRECEDING_SIBLING), false, 'disabled');
          break;
        }

        if (next)
        {
          next.select();
          this.focus();
        }

        this.emit_fieldKeyup(event);
      },
      keydown: function(event){
        switch (event.key)
        {
          case event.KEY.DOWN:
          case event.KEY.UP:
            event.die();

            break;
          case event.KEY.ENTER:
            if (this.popup.visible)
              this.hide();

            event.die();
            break;
        }

        this.emit_fieldKeydown(event);
      }
    },

    init: function(){

      if (this.property)
        this.value = this.property.value;

      // inherit
      ComplexField.prototype.init.call(this);

      this.setSatellite('captionItem', new this.childClass({
        delegate: this.selection.pick(),
        owner: this,
        getTitle: function(){
          return this.owner.getTitle();
        },
        getValue: function(){
          return this.owner.getValue();
        },
        handler: {
          delegateChanged: function(){
            this.updateBind('title');
          }
        }
      }));
      this.selection.addHandler(COMBOBOX_SELECTION_HANDLER, this.satellite.captionItem);

      // create items popup
      this.popup = new this.popupClass(complete({ // FIXME: move to subclass, and connect components in templateSync
        content: this.childNodesElement,
        handler: {
          context: this,
          callbacks: ComboboxPopupHandler
        }
      }, this.popup));

      if (this.property)
        this.property.link(this, this.setValue);
    },
    templateSync: function(){
      UINode.prototype.templateSync.call(this);

      if (this.childNodesElement && this.popup)
        DOM.insert(this.popup.tmpl.content || this.popup.element, this.childNodesElement);

      this.popup.ignoreClickFor = [this.tmpl.field];
    },
    show: function(){
      if (this.tmpl)
      {
        this.popup.show(this.tmpl.field);
        this.focus();
      }
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
      if (this.getValue() !== value)
      {
        // update value & selection
        var item = basis.array.search(this.childNodes, value, getFieldValue);
        if (item && !item.isDisabled())
          this.selection.set([item]);
        else
          this.selection.clear();
      }
    },
    destroy: function(){
      if (this.property)
      {
        this.property.unlink(this);
        this.property = null;
      }

      this.popup.destroy();
      this.popup = null;

      this.satellite.captionItem.setDelegate();
      this.selection.removeHandler(COMBOBOX_SELECTION_HANDLER, this.satellite.captionItem);
      this.setSatellite('captionItem', null);

      ComplexField.prototype.destroy.call(this);
    }
  });


  //
  // Filter
  //

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
          textNodes = [textNodes];

        child._original = textNodes;

        var matchCount = 0;

        for (var i = textNodes.length; i-- > 0;)
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

    emit_change: function(oldValue){
      this.rx = this.regexpGetter(this.value);

      Property.prototype.emit_change.call(this, oldValue);
    },

    extendConstructor_: true,

    init: function(){
      var startPoints = this.startPoints || '';

      this.textNodeGetter = getter(this.textNodeGetter || 'tmpl.titleText');

      if (typeof this.regexpGetter != 'function')
        this.regexpGetter = function(value){
          return new RegExp('(' + startPoints + ')(' + basis.string.forRegExp(value) + ')', 'i');
        };

      this.map = {};
      this.map[this.wrapElement || 'SPAN.match'] = function(v, i){
        return (i % 3) == 2;
      };

      Property.prototype.init.call(this, '', this.handlers, String.trim);
    }
  });

  var NodeMatchHandler = {
    childNodesModified: function(object, delta){
      delta.inserted && delta.inserted.forEach(function(child){
        this.matchFunction(child, this.value == '');
      }, this);
    }
  };

 /**
  * @class
  */
  var Matcher = MatchProperty.subclass({
    className: namespace + '.Matcher',

    emit_change: function(oldValue){
      MatchProperty.prototype.emit_change.call(this, oldValue);

      this.applyMatch();
    },

    init: function(){
      MatchProperty.prototype.init.call(this);

      this.node.addHandler(NodeMatchHandler, this);
    },

    applyMatch: function(){
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

    emit_change: function(oldValue){
      MatchProperty.prototype.emit_change.call(this, oldValue);

      this.node.setMatchFunction(this.value ? this.matchFunction.bind(this) : null);
    }
  });

 /**
  * @class
  */
  var MatchInput = Text.subclass({
    className: namespace + '.MatchInput',

    template: templates.MatchInput,

    matchFilterClass: MatchFilter,

    emit_fieldKeyup: function(event){
      Text.prototype.emit_fieldKeyup.call(this, event);
      this.matchFilter.set(this.getValue());
    },

    emit_change: function(event){
      Text.prototype.emit_change.call(this, event);
      this.matchFilter.set(this.getValue());
    },

    init: function(){
      Text.prototype.init.call(this);
      this.matchFilter = new this.matchFilterClass(this.matchFilter);
    }
  });


  //
  // Validators
  //

  /** @const */ var REGEXP_EMAIL = /^([a-z0-9а-яА-ЯёЁ\.\-\_]+|[a-z0-9а-яА-ЯёЁ\.\-\_]+\+[a-z0-9а-яА-ЯёЁ\.\-\_]+)\@(([a-z0-9а-яА-ЯёЁ][a-z0-9а-яА-ЯёЁ\-]*\.)+[a-zа-яА-ЯёЁ]{2,6}|(\d{1,3}\.){3}\d{1,3})$/i;
  /** @const */ var REGEXP_URL = /^(https?\:\/\/)?((\d{1,3}\.){3}\d{1,3}|([a-zA-Zа-яА-ЯёЁ][a-zA-Zа-яА-ЯёЁ\d\-]+\.)+[a-zA-Zа-яА-ЯёЁ]{2,6})(:\d+)?(\/[^\?]*(\?\S(\=\S*))*(\#\S*)?)?$/i;

 /**
  * @class
  */
  var ValidatorError = Class(null, {
    className: namespace + '.ValidatorError',

    init: function(field, message){
      this.field = field;
      this.message = String(message);
    }
  });

  var Validator = {
    RegExp: function(regexp){
      if (regexp.constructor != RegExp)
        regexp = new RegExp(regexp);

      return function(field){
        var value = String(field.getValue());
        if (value != '' && !value.match(regexp))
          return new ValidatorError(field, dict.token('validator.regExpWrongFormat'));
      };
    },
    Required: function(field){
      var value = field.getValue();
      if (basis.fn.$isNull(value) || value == '')
        return new ValidatorError(field, dict.token('validator.required'));
    },
    Number: function(field){
      var value = field.getValue();
      if (isNaN(value))
        return new ValidatorError(field, dict.token('validator.numberWrongFormat'));
    },
    Currency: function(field){
      var value = field.getValue();
      if (isNaN(value))
        return new ValidatorError(field, dict.token('validator.currencyWrongFormat'));
      if (value <= 0)
        return new ValidatorError(field, dict.token('validator.currencyMustBeGreaterZero'));
    },
    Email: function(field){
      var value = String(field.getValue()).trim();
      if (value != '' && !value.match(REGEXP_EMAIL))
        return new ValidatorError(field, dict.token('validator.emailWrongFormat'));
    },
    Url: function(field){
      var value = String(field.getValue()).trim();
      if (value != '' && !value.match(REGEXP_URL))
        return new ValidatorError(field, dict.token('validator.urlWrongFormat'));
    },
    MinLength: function(field){
      var value = field.getValue();
      var length = basis.fn.$isNotNull(value.length) ? value.length : String(value).length;
      if (value && length < field.minLength)
        return new ValidatorError(field, basis.string.format(String(dict.token('validator.minLengthError')), field.minLength));
    },
    MaxLength: function(field){
      var value = field.getValue();
      var length = basis.fn.$isNotNull(value.length) ? value.length : String(value).length;
      if (length > field.maxLength)
        return new ValidatorError(field, basis.string.format(String(dict.token('validator.maxLengthError')), field.maxLength));
    }
  };


  //
  // export names
  //

  var fieldType2Class = {
    hidden: Hidden,
    file: File,
    text: Text,
    password: Password,
    textarea: Textarea,
    checkbox: Checkbox,
    label: Label,
    select: Select,
    combobox: Combobox,
    radiogroup: RadioGroup,
    checkgroup: CheckGroup
  };

  function createField(config){
    var fieldType = (config && config.type) || 'text';

    if (fieldType2Class.hasOwnProperty(fieldType))
      return new fieldType2Class[fieldType](config);
    else
      throw 'Unknown field type `' + fieldType + '`';
  }


  //
  // export names
  //

  module.exports = {
    validator: Validator,
    ValidatorError: ValidatorError,

    create: createField,
    addFieldType: function(type, fieldClass){
      if (!fieldClass.isSubclassOf(Field))
        throw 'basis.ui.field.addFieldType: fieldClass is not a subclass of Field (ignored)';

      fieldType2Class[type] = fieldClass;
    },

    Field: Field,
    Hidden: Hidden,
    File: File,
    TextField: TextField,
    Text: Text,
    Password: Password,
    Textarea: Textarea,
    Checkbox: Checkbox,
    Label: Label,

    ComplexFieldItem: ComplexFieldItem,
    ComplexField: ComplexField,
    Select: Select,
    RadioGroup: RadioGroup,
    CheckGroup: CheckGroup,
    Combobox: Combobox,

    Matcher: Matcher,
    MatchProperty: MatchProperty,
    MatchFilter: MatchFilter,
    MatchInput: MatchInput
  };
