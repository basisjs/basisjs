
 /**
  * @see ./demo/defile/button.html
  * @namespace basis.ui.button
  */

  var namespace = 'basis.ui.button';


  //
  // import names
  //

  var Node = require('basis.ui').Node;
  var resolveValue = require('basis.data').resolveValue;


  //
  // definitions
  //

  var templates = require('basis.template').define(namespace, {
    Button: resource('./templates/button/Button.tmpl'),
    ButtonPanel: resource('./templates/button/ButtonPanel.tmpl'),
    ButtonGroup: resource('./templates/button/ButtonGroup.tmpl')
  });


  //
  // main part
  //

 /**
  * @class
  */
  var Button = Node.subclass({
    className: namespace + '.Button',

    // template, binding & action
    template: templates.Button,
    binding: {
      caption: 'caption'
    },
    action: {
      click: function(){
        if (!this.isDisabled())
          this.click();
      }
    },

   /**
    * Button caption text.
    * @type {string}
    */
    caption: '',
    captionRA_: null,

   /**
    * Set new caption and update binding.
    * @param {string} caption
    */
    setCaption: function(caption){
      caption = resolveValue(this, this.setCaption, caption, 'captionRA_');

      if (this.caption != caption)
      {
        this.caption = caption;

        // for backward capability
        if (this.tmpl)
          this.updateBind('caption');
      }
    },

   /**
    * Actions on click.
    */
    click: function(){
      // nothing to do
    },

    init: function(){
      Node.prototype.init.call(this);

      this.setCaption(this.caption || '\xA0');
    },

    destroy: function(){
      if (this.captionRA_)
        resolveValue(this, null, null, 'captionRA_');

      Node.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var ButtonPanel = Node.subclass({
    className: namespace + '.ButtonPanel',

    template: templates.ButtonPanel,

    childClass: Button,

    groupingClass: {
      className: namespace + '.ButtonGroupingNode',

      rule: function(button){
        return button.groupId || button.basisObjectId;
      },

      childClass: {
        className: namespace + '.ButtonGroup',

        template: templates.ButtonGroup
      }
    },

    grouping: {} // use grouping by default
  });


  //
  // export names
  //

  module.exports = {
    Button: Button,
    ButtonPanel: ButtonPanel
  };
