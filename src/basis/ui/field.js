
  basis.require('basis.l10n');
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.data.property');
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
  var l10nToken = basis.l10n.getToken;

  var Property = basis.data.property.Property;
  var Selection = basis.dom.wrapper.Selection;
  var UINode = basis.ui.Node;
  var Popup = basis.ui.popup.Popup;


  //
  // definitions
  //

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

  basis.l10n.createDictionary(namespace, __dirname + 'l10n/field', {
    "symbolsLeft": "Symbols left"
  });

  basis.l10n.createDictionary(namespace + '.validator', __dirname + 'l10n/field', {
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
    validity: VALIDITY_INDETERMINATE,
    error: '',
    example: null,
    focused: false,

    //
    // events
    //

    event_commit: createEvent('commit'),
    event_change: createEvent('change', 'oldValue') && function(oldValue){
      this.writeFieldValue_(this.value);
      events.change.call(this, oldValue);
    },
    event_validityChanged: createEvent('validityChanged', 'oldValidity'),
    event_errorChanged: createEvent('errorChanged'),
    event_exampleChanged: createEvent('exampleChanged'),
    event_descriptionChanged: createEvent('descriptionChanged'),

    event_fieldInput: createEvent('fieldInput', 'event'),
    event_fieldChange: createEvent('fieldChange', 'event'),
    event_fieldKeydown: createEvent('fieldKeydown', 'event'),
    event_fieldKeypress: createEvent('fieldKeypress', 'event'),
    event_fieldKeyup: createEvent('fieldKeyup', 'event') && function(event){
      if (this.nextFieldOnEnter)
      {
        if (event.key == event.KEY.ENTER || event.key == event.KEY.CTRL_ENTER)
        {
          event.preventDefault();
          this.commit();
        }
        else if (event.key != event.KEY.TAB)
          this.setValidity();
      }

      events.fieldKeyup.call(this, event);
    },
    event_fieldFocus: createEvent('fieldFocus', 'event') && function(event){
      this.focused = true;
      /*if (this.validity)
        this.setValidity();*/

      events.fieldFocus.call(this, event);
    },
    event_fieldBlur: createEvent('fieldBlur', 'event') && function(event){
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

    action: 'focus blur change keydown keypress keyup input'.qw().reduce(
      function(res, item){
        var eventName = 'event_field' + item.capitalize();
        res[item] = function(event){
          this.setValue(this.readFieldValue_());
          this[eventName](event);
        };
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
        hook: {
          descriptionChanged: true
        },
        existsIf: function(owner){
          return owner.description;
        },
        instanceOf: UINode.subclass({
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
        this.event_exampleChanged();
      }
    },
    setDescription: function(description){
      if (description != this.description)
      {
        this.description = description;
        this.event_descriptionChanged();
      }
    },

    readFieldValue_: function(){
      return this.getValue();
    },
    writeFieldValue_: function(){},
    getValue: function(){
      return this.value;
    },
    setValue: function(newValue){
      if (this.value != newValue)
      {
        var oldValue = this.value;
        this.value = newValue;
        this.event_change(oldValue);
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
        this.event_validityChanged();
      }

      if (!message || validity != VALIDITY_INVALID)
        message = '';

      if (this.error != message)
      {
        this.error = message;
        this.event_errorChanged();
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
      this.event_commit();
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

    event_minLengthChanged: createEvent('minLengthChanged'),
    event_maxLengthChanged: createEvent('maxLengthChanged'),

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
      return Field.prototype.setValue.call(this, newValue == null ? '' : newValue);
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
        this.event_minLengthChanged();
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
        this.event_maxLengthChanged();
      }
    },

    readFieldValue_: function(){
      return this.tmpl && this.tmpl.field && this.tmpl.field.value;
    }/*,
    writeFieldValue_: function(value){
      if (this.tmpl && this.tmpl.field && this.tmpl.field.value != value)
        this.tmpl.field.value = value;
    }*/
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

    event_symbolsLeftChanged: createEvent('symbolsLeftChanged'),
    event_fieldFocus: !window.opera
      ? TextField.prototype.event_fieldFocus
        // fix opera's bug: when invisible textarea becomes visible and user
        // changes it content, value property returns empty string instead of field value
      : function(event){
          this.contentEditable = true;
          this.contentEditable = false;
          TextField.prototype.event_fieldFocus.call(this, event);
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

    satelliteConfig: {
      counter: {
        hook: {
          maxLengthChanged: true
        },
        existsIf: function(owner){
          return owner.maxLength > 0;
        },
        instanceOf: UINode.subclass({
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

    updateSymbolsLeft: function(){
      var symbolsLeft = this.maxLength ? this.maxLength - this.getValue().length : -1;

      if (symbolsLeft <= 0)
        symbolsLeft = 0;

      if (this.symbolsLeft != symbolsLeft)
      {
        this.symbolsLeft = symbolsLeft;
        this.event_symbolsLeftChanged();
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
    readFieldValue_: function(){
      return this.tmpl && this.tmpl.field && !!this.tmpl.field.checked;
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
          this.select(this.parentNode.multipleSelect);

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
    datasetChanged: function(){
      this.event_change();
    }
  };

 /**
  * @class
  */
  var ComplexField = Class(Field, {
    className: namespace + '.ComplexField',

    childClass: ComplexFieldItem,
    multipleSelect: false,

    init: function(){
      this.selection = new Selection({
        multiple: !!this.multipleSelect,
        handler: {
          context: this,
          callbacks: COMPLEXFIELD_SELECTION_HANDLER
        }
      });

      //inherit
      Field.prototype.init.call(this);
    },
    getValue: function(){
      var value = this.selection.getItems().map(getFieldValue);
      return this.multipleSelect ? value : value[0];
    },
    setValue: function(value/* value[] */){
      var newValues = this.multipleSelect ? arrayFrom(value) : [value];
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

    multipleSelect: true,

    template: templates.CheckGroup,

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

    childClass: {
      className: namespace + '.SelectItem',

      template: templates.SelectItem,
    },

    init: function(){
      ComplexField.prototype.init.call(this);
      this.selection.set([this.childNodes[this.tmpl.field.selectedIndex]]);
    },

    getValue: function(){
      var item = this.childNodes[this.tmpl.field.selectedIndex];
      return item && item.getValue();
    },
    setValue: function(value){
      var item = this.childNodes.search(value, getFieldValue);
      this.selection.set([item]);
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

 /**
  * @class
  */
  var Combobox = ComplexField.subclass({
    className: namespace + '.Combobox',

    childClass: ComboboxItem,
    
    event_change: function(event){
      ComplexField.prototype.event_change.call(this, event);

      var value = this.getValue();

      if (this.property)
        this.property.set(value);
    },

    event_childNodesModified: function(delta){
      ComplexField.prototype.event_childNodesModified.call(this, delta);
      if (this.property)
        this.setValue(this.property.value);
    },

    caption: null,
    popup: null,
    popupClass: Popup.subclass({
      className: namespace + '.ComboboxDropdownList',
      template: templates.ComboboxDropdownList,
      autorotate: 1
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

    satelliteConfig: {
      hiddenField: {
        existsIf: function(owner){
          return owner.name;
        },
        instanceOf: Hidden.subclass({
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

            next = DOM.axis(cur ? cur : this.firstChild, DOM.AXIS_FOLLOWING_SIBLING).search(false, 'disabled');
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

            next = cur ? DOM.axis(cur, DOM.AXIS_PRESCENDING_SIBLING).search(false, 'disabled') : this.firstChild;
          break;
        }

        if (next)
        {
          next.select();
          this.focus();
        }

        this.event_fieldKeyup(event);
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

        this.event_fieldKeydown(event);
      }
    },

    init: function(){

      if (this.property)
        this.value = this.property.value;

      // inherit
      ComplexField.prototype.init.call(this);

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
      this.popup = new this.popupClass(complete({ // FIXME: move to subclass, and connect components in templateSync
        ignoreClickFor: [this.tmpl.field],
        content: this.childNodesElement,
        handler: {
          context: this,
          callbacks: ComboboxPopupHandler
        }
      }, this.popup));

      if (this.property)
        this.property.addLink(this, this.setValue);
    },
    templateSync: function(noRecreate){
      if (this.childNodesElement)
        DOM.remove(this.childNodesElement);

      UINode.prototype.templateSync.call(this, noRecreate);

      if (this.childNodesElement && this.popup)
        DOM.insert(this.popup.tmpl.content, this.childNodesElement);
    },
    show: function(){
      this.popup.show(this.tmpl.field); 
      this.focus();
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
        var item = this.childNodes.search(value, getFieldValue);
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
          textNodes = [ textNodes ];

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

    event_change: function(value, oldValue){
      this.rx = this.regexpGetter(value);

      Property.prototype.event_change.call(this, value, oldValue);
    },

    extendConstructor_: true,

    init: function(){
      var startPoints = this.startPoints || '';

      this.textNodeGetter = getter(this.textNodeGetter || 'tmpl.titleText');

      if (typeof this.regexpGetter != 'function')
        this.regexpGetter = function(value){ 
          return new RegExp('(' + startPoints + ')(' + value.forRegExp() + ')', 'i'); 
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

    event_change: function(value, oldValue){
      MatchProperty.prototype.event_change.call(this, value, oldValue);

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

    event_change: function(value, oldValue){
      MatchProperty.prototype.event_change.call(this, value, oldValue);

      this.node.setMatchFunction(value ? this.matchFunction.bind(this) : null);
    }
  });
  
 /**
  * @class
  */
  var MatchInput = Text.subclass({
    className: namespace + '.MatchInput',

    template: templates.MatchInput,

    matchFilterClass: MatchFilter,

    event_fieldKeyup: function(event){
      Text.prototype.event_fieldKeyup.call(this, event);
      this.matchFilter.set(this.getValue());
    },

    event_change: function(event){
      Text.prototype.event_change.call(this, event);
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

  /** @const */ var REGEXP_EMAIL = /^([a-z0-9\.\-\_]+|[a-z0-9\.\-\_]+\+[a-z0-9\.\-\_]+)\@(([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/i;
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
      };
    },
    Required: function(field){
      var value = field.getValue();
      if (basis.fn.$isNull(value) || value == '')
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
      var length = basis.fn.$isNotNull(value.length) ? value.length : String(value).length;
      if (length < field.minLength)
        return new ValidatorError(field, String(l10nToken(namespace, 'validator', 'minLengthError')).format(field.minLength));
    },
    MaxLength: function(field){
      var value = field.getValue();
      var length = basis.fn.$isNotNull(value.length) ? value.length : String(value).length;
      if (length > field.maxLength)
        return new ValidatorError(field, String(l10nToken(namespace, 'validator', 'maxLengthError')).format(field.maxLength));
    }
  };


  //
  // export names
  //

  var fieldType2Class = {
    'hidden': Hidden,
    'file': File,
    'text': Text,
    'password': Password,
    'textarea': Textarea,
    'checkbox': Checkbox,
    'label': Label,
    'select': Select,
    'combobox': Combobox,
    'radiogroup': RadioGroup,
    'checkgroup': CheckGroup
  };

  module.setWrapper(function(config){
    var fieldType = (config && config.type) || 'text';

    if (fieldType2Class.hasOwnProperty(fieldType))
      return new fieldType2Class[fieldType](config);
    else
      throw 'Unknown field type `{0}`'.format(fieldType);
  });

  module.exports = {
    Validator: Validator,  // deprecated
    validator: Validator,
    ValidatorError: ValidatorError,

    addFieldType: function(type, fieldClass){
      ;;;if (!fieldClass.isSubclassOf(Field)) throw 'basis.ui.field.addFieldType: Class is not a subclass of Field';

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
