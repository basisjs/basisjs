
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.ui');
  basis.require('basis.ui.field');


 /**
  * @see ./demo/defile/form.html
  * @namespace basis.ui.form
  */

  var namespace = this.path;


  //
  // import names
  //

  var DOM = basis.dom;
  var domEvent = basis.dom.event;
  var field = basis.ui.field;

  var createEvent = basis.event.create;
  var events = basis.event.events;

  var UINode = basis.ui.Node;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Form: resource('templates/form/Form.tmpl'),
    FormContent: resource('templates/form/FormContent.tmpl')
  });


 /**
  * @class
  */
  var FormContent = UINode.subclass({
    className: namespace + '.FormContent',
    
    template: templates.FormContent,

    childClass: field.Field,
    childFactory: field,

    listen: {
      childNode: {
        commit: function(field){
          var next = DOM.axis(field, DOM.AXIS_FOLLOWING_SIBLING).search(true, 'focusable');

          if (next)
            next.focus(true);
          else
            this.submit();
        }
      }
    },

    event_reset: createEvent('reset'),

    onSubmit: basis.fn.$false,

   /**
    * @deprecated
    */
    getFieldByName: function(name){
      ;;;basis.dev.warn('basis.ui.form.FormContent#getFieldByName is deprecated, use getChildByName method istead');
      return this.getChildByName(name);
    },
   /**
    * @deprecated
    */
    getFieldById: function(id){
      ;;;basis.dev.warn('basis.ui.form.FormContent#getFieldById is deprecated, use getChild method istead');
      return this.getChild(id, 'id');
    },

    loadData: function(data, noValidate){
      var names = basis.object.keys(data);

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

      this.event_reset();
    },
    validate: function(){
      var errors = [];
      var error;

      for (var field = this.firstChild; field; field = field.nextSibling)
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
          domEvent.cancelDefault(event);
      }
    },

    submit: function(){
      if (this.onSubmit)
        this.onSubmit(this.serialize());

      if (this.tmpl.form)
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
