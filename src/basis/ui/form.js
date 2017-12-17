
 /**
  * @see ./demo/defile/form.html
  * @namespace basis.ui.form
  */

  var namespace = 'basis.ui.form';


  //
  // import names
  //

  var field = require('./field.js');
  var basisEvent = require('../event.js');
  var createEvent = basisEvent.create;
  var Node = require('../ui.js').Node;


  //
  // definitions
  //

  var templates = require('../template.js').define(namespace, {
    Form: resource('./templates/form/Form.tmpl'),
    FormContent: resource('./templates/form/FormContent.tmpl')
  });


 /**
  * @class
  */
  var FormContent = Node.subclass({
    className: namespace + '.FormContent',

    template: templates.FormContent,

    childClass: field.Field,
    childFactory: field.create,

    listen: {
      childNode: {
        commit: function(field){
          while (field = field.nextSibling)
            if (field.focusable && !field.isDisabled())
              return field.focus(true);

          this.submit();
        }
      }
    },

    emit_reset: createEvent('reset'),

    onSubmit: basis.fn.$false,

    focusFirstNonEmpty: true,
    focus: function(select){
      for (var i = 0, field; field = this.childNodes[i]; i++)
        if (field.focusable && (!this.focusFirstNonEmpty || !field.getValue() || !field.getValue().length))
        {
          field.focus(select);
          return;
        }
    },

    loadData: function(data, noValidate){
      for (var i = 0, field; field = this.childNodes[i]; i++)
      {
        if (field.name in data)
        {
          field.setValue(data[field.name]);
          field.setValidity();  // set undefined validity
        }
        else
        {
          field.reset();
        }
      }

      if (!noValidate)
        this.validate();
    },
    reset: function(){
      for (var i = 0, field; field = this.childNodes[i]; i++)
        field.reset();

      this.emit_reset();
    },
    validate: function(){
      var errors = [];
      var error;

      for (var i = 0, field; field = this.childNodes[i]; i++)
        if (error = field.validate())
          errors.push(error);

      if (errors.length)
      {
        errors[0].field.focus();
        return errors;
      }

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

    formTarget: '',
    formAction: '',
    formEnctype: '',
    formMethod: 'POST',

    template: templates.Form,

    binding: {
      target: 'formTarget',
      action: 'formAction',
      enctype: 'formEnctype',
      method: 'formMethod'
    },

    action: {
      submit: function(){
        this.submit();
      },
      validate: function(event){
        if (this.validate() !== true)
          event.preventDefault();
      }
    },

    submit: function(){
      if (this.onSubmit)
        this.onSubmit(this.serialize());

      if (this.tmpl && this.tmpl.form)
        this.tmpl.form.submit();
    }
  });


  //
  // export names
  //

  module.exports = {
    FormContent: FormContent,
    Form: Form
  };
