/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  basis.require('basis.l10n');
  basis.require('basis.event');
  basis.require('basis.html');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.cssom');
  basis.require('basis.ui');
  basis.require('basis.ui.popup');


 /**
  * @see ./demo/defile/form.html
  * @namespace basis.ui.form
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;
  var Template = basis.template.Template;

  var complete = Object.complete;
  var coalesce = Object.coalesce;
  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var createEvent = basis.event.create;
  var events = basis.event.events;

  var AbstractProperty = basis.data.property.AbstractProperty;
  var Property = basis.data.property.Property;

  var Selection = basis.dom.wrapper.Selection;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var Popup = basis.ui.popup.Popup;


  //
  // Localization
  //

  var l10nToken = basis.l10n.getToken;

  basis.l10n.createDictionary(namespace, __dirname + 'l10n/form', {
    "symbolsLeft": "Symbols left"
  });

  basis.l10n.createDictionary(namespace + '.validator', __dirname + 'l10n/form', {
    "regExpWrongFormat": "The value has wrong format.",
    "required": "The field is required and must have a value.",
    "numberWrongFormat": "The value has wrong format of number.",
    "currencyWrongFormat": "The value has wrong format of currency.",
    "currencyMustBeGreaterZero": "The value must be greater than zero.",
    "emailWrongFormat": "The value has a wrong format of e-mail.",
    "urlWrongFormat": "The value has a wrong format of URL.",
    "minLengthError": "The value must be longer than {0} symbols.",
    "maxLengthError": "The value must be shorter than {0} symbols."
  });


  //
  // main part
  //

  /** @const */ var VALIDITY_INDETERMINATE = 'indeterminate';
  /** @const */ var VALIDITY_VALID = 'valid';
  /** @const */ var VALIDITY_INVALID = 'invalid';

  var baseFieldTemplate = new Template(
    '<div{sampleContainer} class="Basis-Field {selected} {disabled} {validity}" title="{error}">' +
      '<div class="Basis-Field-Title">' +
        '<label>' +
          '<span{title}>{titleText}</span>' +
        '</label>' +
      '</div>' +
      '<div{content} class="Basis-Field-Container">' +
        '<!--{fieldPlace}-->' +
      '</div>' +
      '<!--{example}-->' +
    '</div>'
  );

  function createFieldTemplate(template, injection){
    return new Template(template.source.replace('<!--{fieldPlace}-->', injection));
  }


  //
  // Validators
  //

  /** @const */ var REGEXP_EMAIL = /^[a-z0-9\.\-\_]+\@(([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/i;
  /** @const */ var REGEXP_URL = /^(https?\:\/\/)?((\d{1,3}\.){3}\d{1,3}|([a-zA-Z][a-zA-Z\d\-]+\.)+[a-zA-Z]{2,6})(:\d+)?(\/[^\?]*(\?\S(\=\S*))*(\#\S*)?)?$/i;

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
        var value = field.getValue();
        if (value != '' && !value.match(regexp))
          return new ValidatorError(field, l10nToken(namespace, 'validator', 'regExpWrongFormat'));
      }
    },
    Required: function(field){
      var value = field.getValue();
      if (Function.$isNull(value) || value == '')
        return new ValidatorError(field, l10nToken(namespace, 'validator', 'required'));
    },
    Number: function(field){
      var value = field.getValue();
      if (isNaN(value))
        return new ValidatorError(field, l10nToken(namespace, 'validator', 'numberWrongFormat'));
    },
    Currency: function(field){
      var value = field.getValue();
      if (isNaN(value))
        return new ValidatorError(field, l10nToken(namespace, 'validator', 'currencyWrongFormat'));
      if (value <= 0)
        return new ValidatorError(field, l10nToken(namespace, 'validator', 'currencyMustBeGreaterZero'));
    },
    Email: function(field){
      var value = field.getValue().trim();
      if (value != '' && !value.match(REGEXP_EMAIL))
        return new ValidatorError(field, l10nToken(namespace, 'validator', 'emailWrongFormat'));
    },
    Url: function(field){
      var value = field.getValue().trim();
      if (value != '' && !value.match(REGEXP_URL))
        return new ValidatorError(field, l10nToken(namespace, 'validator', 'urlWrongFormat'));
    },
    MinLength: function(field){
      var value = field.getValue();
      var length = Function.$isNotNull(value.length) ? value.length : String(value).length;
      if (length < field.minLength)
        return new ValidatorError(field, String(l10nToken(namespace, 'validator', 'minLengthError')).format(field.minLength));
    },
    MaxLength: function(field){
      var value = field.getValue();
      var length = Function.$isNotNull(value.length) ? value.length : String(value).length;
      if (length > field.maxLength)
        return new ValidatorError(field, String(l10nToken(namespace, 'validator', 'maxLengthError')).format(field.maxLength));
    }
  };


  //
  //  Fields
  //

 /**
  * Base class for all form field classes
  * @class
  */
  var Field = UIContainer.subclass({
    className: namespace + '.Field',

    //
    // properties
    //

    childClass: null,
    name: '',

    nextFieldOnEnter: true,
    serializable: true,

    validity: VALIDITY_INDETERMINATE,
    error: '',
    example: null,

    //
    // events
    //

    event_select: function(){
      DOM.focus(this.tmpl.field, true);
      UINode.prototype.event_select.call(this, this);
    },
    event_commit: createEvent('commit', 'sender'),

    event_input: createEvent('input', 'sender', 'event'),
    event_change: createEvent('change', 'sender', 'event'),
    event_keydown: createEvent('keydown', 'sender', 'event'),
    event_keypress: createEvent('keypress', 'sender', 'event'),
    event_keyup: createEvent('keyup', 'sender', 'event') && function(sender, event){
      if (this.nextFieldOnEnter)
      {
        var keyCode = Event.key(event);
        if (keyCode == Event.KEY.ENTER || keyCode == Event.KEY.CTRL_ENTER)
        {
          Event.cancelDefault(event);
          this.commit();
        }
        else
          this.setValidity();
      }

      events.keyup.call(this, sender, event);
    },
    event_focus: createEvent('focus', 'sender', 'event') && function(sender, event){
      if (this.validity)
        this.setValidity();

      events.focus.call(this, sender, event);
    },
    event_blur: createEvent('blur', 'sender', 'event') && function(sender, event){
      this.validate(true);

      events.blur.call(this, sender, event);
    },

    event_validityChanged: createEvent('validityChanged', 'sender', 'oldValidity'),
    event_errorChanged: createEvent('errorChanged', 'sender'),
    event_exampleChanged: createEvent('exampleChanged', 'sender'),

    //
    // template
    //

    template: baseFieldTemplate,
    binding: {
      name: 'name || ""',
      titleText: 'title || ""',
      value: {
        events: 'change',
        getter: 'getValue()'
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
      example: 'satellite:'
    },

    action: 'focus blur change keydown keypress keyup input'.qw().reduce(
      function(res, item){
        res[item] = new Function('event', 'this.event_' + item + '(this, event)');
        return res;
      },
      {}
    ),

    satelliteConfig: {
      example: {
        hook: {
          exampleChanged: true
        },
        existsIf: function(owner){
          return owner.example;
        },
        instanceOf: UINode.subclass({
          template: '<span class="Basis-Field-Sample">{example}</span>',
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
      }
    },

    //
    // methods
    //

    init: function(config){
      this.name = this.name || '';
      this.validators = Array.from(this.validators);

      if (typeof this.defaultValue == 'undefined')
        this.defaultValue = this.value;

      UIContainer.prototype.init.call(this, config);
    },

    setExample: function(example){
      if (example != this.example)
      {
        this.example = example;
        this.event_exampleChanged(this);
      }
    },

    getValue: function(){
      return this.value;
    },
    setValue: function(newValue){
      if (this.value != newValue)
      {
        var oldValue = this.value;
        this.value = newValue;
        this.event_change(this, oldValue);
      }
    },
    reset: function(){
      this.setValue(this.defaultValue);
      this.setValidity();
    },

    attachValidator: function(validator, validate){
      if (this.validators.add(validator) && validate)
        this.validate();
    },
    detachValidator: function(validator, validate){
      if (this.validators.remove(validator) && validate)
        this.validate();
    },
    setValidity: function(validity, message){
      if (!validity)
        validity = VALIDITY_INDETERMINATE;

      if (this.validity !== validity)
      {
        this.validity = validity;
        this.event_validityChanged(this);
      }

      if (!message || validity != VALIDITY_INVALID)
        message = '';

      if (this.error != message)
      {
        this.error = message;
        this.event_errorChanged(this);
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

    select: function(){
      this.unselect();
      UINode.prototype.select.apply(this, arguments);
    },
    commit: function(){
      this.event_commit(this);
    },

    destroy: function(){
      this.validators = null;
      this.error = null;
      this.example = null;

      UINode.prototype.destroy.call(this);
    }
  });

  Field.create = function(fieldType, config){
    var alias = {
      'radiogroup': 'RadioGroup',
      'checkgroup': 'CheckGroup'
    };

    fieldType = alias[fieldType.toLowerCase()] || fieldType.capitalize();

    if (Field[fieldType])
      return new Field[fieldType](config);
    else
      throw new Error('Unknown field type `{0}`'.format(fieldType));
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
      '<input{field} type="hidden" value="{value}"/>'
  });


  var TextField = Field.subclass({
    className: namespace + '.TextField',

    event_minLengthChanged: createEvent('minLengthChanged', 'sender'),
    event_maxLengthChanged: createEvent('maxLengthChanged', 'sender'),

    readOnly: false,
    minLength: 0,
    maxLength: 0,

    binding: {
      minlength: {
        events: 'minLengthChanged',
        getter: function(field){
          return field.minLength > 0 ? field.minLength : "";
        }
      },
      maxlength: {
        events: 'maxLengthChanged',
        getter: function(field){
          return field.maxLength > 0 ? field.maxLength : "";
        }
      },
      readonly: function(node){
        return node.readOnly ? 'readonly' : ""
      },
      autocomplete: 'autocomplete || ""'
    },

    init: function(config){
      if (typeof this.value == 'undefined')
        this.value = '';

      Field.prototype.init.call(this, config);

      this.setMinLength(this.minLength);
      this.setMaxLength(this.maxLength);
    },
    setReadOnly: function(readOnly){
      this.readOnly = !!readonly;
      this.updateBind('readonly');
    },
    setMinLength: function(len){
      len = Math.min(parseInt(len) || 0, 0);

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
        this.event_minLengthChanged(this);
      }
    },
    setMaxLength: function(len){
      len = Math.min(parseInt(len) || 0, 0);

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
        this.event_maxLengthChanged(this);
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
        this.event_change(this);
      }
    }
  });

 /**
  * @class
  */
  Field.Text = TextField.subclass({
    className: namespace + '.Field.Text',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="text" class="native-type-text"' +
        ' name="{name}"' +
        ' value="{defaultValue}"' +
        ' readonly="{readonly}"' +
        ' disabled="{disabled}"' +
        ' maxlength="{maxlength}"' +
        ' autocomplete="{autocomplete}"' +
        ' event-keydown="keydown"' +
        ' event-keyup="keyup"' +
        ' event-keypress="keypress"' +
        ' event-focus="focus"' +
        ' event-blur="blur"' +
        ' event-change="change"' +
        ' event-input="input"' +
      '/>'
    ),

    binding: {
      autocomplete: 'autocomplete || ""'
    }
  });


  /**
  * @class
  */
  Field.Password = TextField.subclass({
    className: namespace + '.Field.Password',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="password" class="native-type-password"' +
        ' name="{name}"' +
        ' readonly="{readonly}"' +
        ' disabled="{disabled}"' +
        ' maxlength="{maxlength}"' +
        ' event-keydown="keydown"' +
        ' event-keyup="keyup"' +
        ' event-keypress="keypress"' +
        ' event-focus="focus"' +
        ' event-blur="blur"' +
        ' event-change="change"' +
        ' event-input="input"' +
      '/>'
    )
  });


 /**
  * @class
  */
  Field.File = Field.subclass({
    className: namespace + '.Field.File',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="file" class="native-type-file"' +
        ' name="{name}"' +
        ' disabled="{disabled}"' +
      '/>'
    )
  });


 /**
  * @class
  */
  Field.Textarea = TextField.subclass({
    className: namespace + '.Field.Textarea',

    nextFieldOnEnter: false,
    symbolsLeft: 0,

    event_symbolsLeftChanged: createEvent('symbolsLeftChanged', 'sender'),
    event_focus: !window.opera
      ? TextField.prototype.event_focus
        // fix opera's bug: when invisible textarea becomes visible and user
        // changes it content, value property returns empty string instead value in field
      : function(sender, event){
          this.contentEditable = true;
          this.contentEditable = false;
          TextField.prototype.event_focus.call(this, sender, event);
        },

    template: createFieldTemplate(baseFieldTemplate,
      '<textarea{field}' +
        ' name="{name}"' +
        ' readonly="{readonly}"' +
        ' disabled="{disabled}"' +
        ' event-keydown="keydown"' +
        ' event-keyup="keyup updateSymbolsLeft"' +
        ' event-keypress="keypress"' +
        ' event-focus="focus"' +
        ' event-blur="blur"' +
        ' event-change="change updateSymbolsLeft"' +
        ' event-input="input updateSymbolsLeft"' +
      '/>' +
      '<!--{counter}-->'
    ),

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

    satelliteConfig: {
      counter: {
        hook: {
          maxLengthChanged: true
        },
        existsIf: function(owner){
          return owner.maxLength > 0;
        },
        instanceOf: UINode.subclass({
          template:
            '<div class="counter">' +
              '{l10n:basis.ui.form.symbolsLeft}: {availChars}' +
            '</div>',

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

    updateSymbolsLeft: function(){
      var symbolsLeft = this.maxLength ? this.maxLength - this.getValue().length : -1;

      if (symbolsLeft <= 0)
        symbolsLeft = 0;

      if (this.symbolsLeft != symbolsLeft)
      {
        this.symbolsLeft = symbolsLeft;
        this.event_symbolsLeftChanged(this);
      }
    }
  });


  /**
  * @class
  */
  Field.Checkbox = Field.subclass({
    className: namespace + '.Field.Checkbox',

    value: false,

    template:
      '<div class="Basis-Field Basis-Field-Checkbox {selected} {disabled} {validity}">' +
        '<div{content} class="Basis-Field-Container">' +
          '<label>' +
            '<input{field} type="checkbox" class="native-type-checkbox"' +
              ' checked="{checked}"' +
              ' event-focus="focus"' +
              ' event-blur="blur"' +
              ' event-change="change"' +
            '/>' +
            '<span>{titleText}</span>' +
          '</label>' +
        '</div>' +
      '</div>',

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
      value = !!value;
      if (this.value != value)
      {
        this.value = value;
        this.event_change(this);
      }
    },
    getValue: function(){
      return !!this.tmpl.field.checked;
    }
  });


  /**
  * @class
  */
  Field.Label = Field.subclass({
    className: namespace + '.Field.Label',
    cssClassName: 'Basis-Field-Label',

    template: createFieldTemplate(baseFieldTemplate,
      '<label{field}>{value}</label>'
    )
  });


  //
  // Complex fields
  //

  var ComplexFieldItem = UINode.subclass({
    className: namespace + '.ComplexField.Item',

    childClass: null,
    name: '',

    binding: {
      name: 'name',
      title: 'getTitle()',
      value: 'getValue()',
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
          this.select(true);

          if (Event.sender(event).tagName != 'INPUT')
            Event.kill(event);
        }
      }
    },

    titleGetter: function(item){
      return item.title || item.getValue();
    },
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
    datasetChanged: function(){
      this.event_change(this);
    }
  }

 /**
  * @class
  */
  var ComplexField = Class(Field, {
    className: namespace + '.Field.ComplexField',

    childClass: ComplexFieldItem,
    multipleSelect: false,

    init: function(config){
      this.selection = new Selection({
        multiple: !!this.multipleSelect,
        handler: COMPLEXFIELD_SELECTION_HANDLER,
        handlerContext: this
      });

      //inherit
      Field.prototype.init.call(this, config);
    },
    getValue: function(){
      var value = this.selection.getItems().map(getter('getValue()'));
      return this.multipleSelect ? value : value[0];
    },
    setValue: function(value/* value[] */){
      var newValues = this.multipleSelect ? Array.from(value) : [value];
      var selectedItems = [];

      for (var item = this.firstChild; item; item = item.nextSibling)
        if (newValues.indexOf(item.getValue()) != -1)
          selectedItems.push(item);

      this.selection.set(selectedItems);
    }
  });


  //
  // Radio group
  //

 /**
  * @class
  */
  Field.RadioGroup = ComplexField.subclass({
    className: namespace + '.Field.RadioGroup',

    template: createFieldTemplate(baseFieldTemplate,
      '<div{field|childNodesElement} class="Basis-RadioGroup"></div>'
    ),

    childClass: {
      className: namespace + '.Field.RadioGroup.Item',

      template:
        '<label class="Basis-RadioGroup-Item {selected} {disabled}" event-click="select">' + 
          '<input{field} type="radio" class="native-type-radio"' +
            ' name="{name}"' +
            ' value="{value}"' +
            ' disabled="{disabled}"' +
            ' checked="{checked}"' +
            ' event-focus="focus"' +
            ' event-blur="blur"' +
          '/>' +
          '<span{content}>{title}</span>' +
        '</label>'
    }
  });


  //
  // Check Group
  //

 /**
  * @class
  */
  Field.CheckGroup = ComplexField.subclass({
    className: namespace + '.Field.CheckGroup',

    multipleSelect: true,

    template: createFieldTemplate(baseFieldTemplate,
      '<div{field|childNodesElement} class="Basis-CheckGroup"></div>'
    ),

    childClass: {
      className: namespace + '.Field.CheckGroup.Item',

      template:
        '<label class="Basis-CheckGroup-Item {selected} {disabled}" event-click="select">' + 
          '<input{field} type="checkbox" class="native-type-checkbox"' +
            ' name="{name}"' +
            ' value="{value}"' +
            ' disabled="{disabled}"' +
            ' checked="{checked}"' +
            ' event-focus="focus"' +
            ' event-blur="blur"' +
          '/>' +
          '<span{content}>{title}</span>' +
        '</label>'
    }
  });


  //
  // Select
  //

 /**
  * @class
  */
  Field.Select = ComplexField.subclass({
    className: namespace + '.Field.Select',

    template: createFieldTemplate(baseFieldTemplate,
      '<select{field|childNodesElement} class="Basis-Select {disabled} {validity}"' +
        ' name="{name}"' +
        ' disabled="{disabled}"' +
        ' event-change="change"' +
        ' event-keyup="keyup"' +
        ' event-keypress="keypress"' +
        ' event-keydown="keydown"' +
        ' event-focus="focus"' +
        ' event-blur="blur"' +
      '/>'
    ),

    childClass: {
      className: namespace + '.Field.Select.Item',

      template:
        '<option{field} class="Basis-Select-Item" selected="{selected}" value="{value}">{title}</option>'
    },

    getValue: function(){
      var item = this.childNodes[this.tmpl.field.selectedIndex];
      return item && item.getValue();
    },
    setValue: function(value){
      var item = this.childNodes.search(value, 'getValue()');
      this.tmpl.field.selectedIndex = item ? this.childNodes.indexOf(item) : -1;
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
    className: namespace + '.Field.Combobox.Item',

    template:
      '<div class="Basis-Combobox-Item {selected} {disabled}" event-click="select">{title}</div>',

    action: {
      select: function(event){
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

 /**
  * @class
  */
  Field.Combobox = ComplexField.subclass({
    className: namespace + '.Field.Combobox',

    childClass: ComboboxItem,
    
    event_change: function(sender, event){
      ComplexField.prototype.event_change.call(this, sender, event);

      var value = this.getValue();

      if (this.property)
        this.property.set(value);
    },

    caption: null,
    popup: null,
    property: null,

    template: createFieldTemplate(baseFieldTemplate,
      '<span{field} class="Basis-DropdownList Basis-DropdownList-{opened}"' +
        ' event-click="togglePopup"' +
        ' event-keyup="keyup"' +
        ' event-keydown="keydown"' +
        ' event-keypressed="keypressed"' +
        ' event-focus="focus"' +
        ' event-blur="blur"' +
        ' tabindex="0"' +
        '>' +
        '<span class="Basis-DropdownList-Caption"><!--{captionItem}--></span>' +
        '<span class="Basis-DropdownList-Trigger"/>' +
        '<!--{hiddenField}-->' +
      '</span>' +
      '<div{content|childNodesElement} class="Basis-DropdownList-PopupContent" />'
    ),

    binding: {
      captionItem: 'satellite:',
      hiddenField: 'satellite:',
      opened: function(node){
        return node.popup.visible ? 'opened' : '';
      }
    },

    satelliteConfig: {
      hiddenField: {
        existsIf: function(owner){
          return owner.name;
        },
        instanceOf: Field.Hidden.subclass({
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
          }
        }
      }
    },

    action: {
      togglePopup: function(event){
        if (this.isDisabled() || this.popup.visible)
          this.hide();
        else
          this.show();
      },
      keyup: function(event){
        var cur = this.selection.pick();
        var next;

        switch (Event.key(event))
        {
          case Event.KEY.DOWN:
            if (event.altKey)
              return this.popup.visible ? this.hide() : (!this.isDisabled() ? this.show() : null);

            next = DOM.axis(cur ? cur : this.firstChild, DOM.AXIS_FOLLOWING_SIBLING).search(false, 'disabled');
          break;

          case Event.KEY.UP: 
            if (event.altKey)
              return this.popup.visible ? this.hide() : (!this.isDisabled() ? this.show() : null);

            next = cur ? DOM.axis(cur, DOM.AXIS_PRESCENDING_SIBLING).search(false, 'disabled') : this.firstChild;
          break;
        }

        if (next)
        {
          next.select();
          DOM.focus(this.tmpl.field);
        }

        this.event_keyup(this, event);
      },
      keydown: function(event){
        switch (Event.key(event))
        {
          case Event.KEY.DOWN:
          case Event.KEY.UP:
            Event.kill(event);

            break;
          case Event.KEY.ENTER:
            if (this.popup.visible)
              this.hide();

            Event.kill(event);

            break;
        }

        this.event_keydown(this, event);
      }
    },

    init: function(config){
      if (!basis.ui.popup)
        throw new Error('basis.ui.popup required for DropDownList');

      if (this.property)
        this.value = this.property.value;

      // inherit
      ComplexField.prototype.init.call(this, config);

      var captionItem = new this.childClass({
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
      });
      this.setSatellite('captionItem', captionItem);
      this.selection.addHandler({
        datasetChanged: function(){
          captionItem.setDelegate(this.pick());
        }
      });

      // create items popup
      this.popup = new Popup(complete({
        cssClassName: 'Basis-DropdownList-Popup',
        autorotate: 1,
        ignoreClickFor: [this.tmpl.field],
        content: this.childNodesElement,
        handler: ComboboxPopupHandler,
        handlerContext: this
      }, this.popup));

      if (this.property)
        this.property.addLink(this, this.setValue);
    },
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




  //
  // FORM
  //

 /**
  * @class
  */
  var FormContent = UIContainer.subclass({
    className: namespace + '.FormContent',
    
    selection: true,
    childClass: Field,
    childFactory: function(config){
      return Field.create(config.type || 'text', config);
    },

    listen: {
      childNode: {
        commit: function(field){
          var next = DOM.axis(field, DOM.AXIS_FOLLOWING_SIBLING).search(true, 'selectable');

          if (next)
            next.select();
          else
            this.submit();
        }
      }
    },

    onSubmit: Function.$false,

    event_reset: createEvent('reset', 'sender'),
    
    template:
      '<div class="Basis-FormContent {selected} {disabled}" />',

    getFieldByName: function(name){
      return this.childNodes.search(name, 'name');
    },
    getFieldById: function(id){
      return this.childNodes.search(id, 'id');
    },
    loadData: function(data, noValidate){
      var names = Object.keys(data);

      for (var field = this.firstChild; field; field = field.nextSibling)
      {
        if (names.indexOf(field.name) != -1)
          field.setValue(data[field.name]);
        else
          field.reset();

        field.setValidity();  // set undefined validity
      }

      if (!noValidate)
        this.validate();
    },
    reset: function(){
      for (var field = this.firstChild; field; field = field.nextSibling)
        field.reset();

      this.event_reset(this);
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
    serialize: function(){
      return this.childNodes.reduce(function(result, field){
        if (field.serializable && field.name)
          result[field.name] = field.getValue();

        return result;
      }, {});
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
      '<form{formElement} class="Basis-Form {selected} {disabled}">' +
        '<div{content|childNodesElement} class="Basis-FormContent" />' +
      '</form>',

    method: 'POST',

    init: function(config){
      this.selection = false;

      UIContainer.prototype.init.call(this, config);

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


  //
  // additional
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

      this.applyMatch();
    },

    init: function(config){
      MatchProperty.prototype.init.call(this, config);

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

    event_keyup: function(sender, event){
      this.matchFilter.set(this.tmpl.field.value);

      Field.Text.prototype.event_keyup.call(this, sender, event);
    },

    event_change: function(sender, event){
      this.matchFilter.set(this.tmpl.field.value);

      Field.Text.prototype.event_change.call(this, sender, event);
    },

    init: function(config){
      Field.Text.prototype.init.call(this, config);

      this.matchFilter = new this.matchFilterClass(this.matchFilter);
    }
  });


  //
  // export names
  //

  module.exports = {
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
    MatchProperty: MatchProperty,
    MatchFilter: MatchFilter,
    MatchInput: MatchInput
  };
