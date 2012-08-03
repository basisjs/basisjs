/*
  Basis javascript library 
  http://code.google.com/p/basis-js/
 
  @copyright
  Copyright (c) 2006-2012 Roman Dvornov.
 
  @license
  GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
*/

  basis.require('basis.event');
  basis.require('basis.dom');
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

  var createEvent = basis.event.create;
  var events = basis.event.events;

  var UINode = basis.ui.Node;
  var field = basis.ui.field;


 /**
  * @class
  */
  var FormContent = UINode.subclass({
    className: namespace + '.FormContent',
    
    childClass: field.Field,
    childFactory: function(config){
      return field(config);
    },

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

    onSubmit: Function.$false,

    event_reset: createEvent('reset'),
    
    template: resource('templates/form/FormContent.tmpl'),

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
        errors[0].field.focus();
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

    method: 'POST',
    
    template: resource('templates/form/Form.tmpl'),

    binding: {
      target: 'target || ""',
      action: 'action || ""',
      enctype: 'enctype || ""',
      method: 'method || ""'
    },

    action: {
      submit: function(){
        this.submit();
      }
    },

    init: function(){
      FormContent.prototype.init.call(this);
      this.formElement.onsubmit = this.submit;
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
  // export names
  //

  module.exports = {
    FormContent: FormContent,
    Form: Form
  };
