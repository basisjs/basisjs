
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
  // main part
  //

 /**
  * @class
  */
  var Button = Node.subclass({
    className: namespace + '.Button',

    // template, binding & action
    template: module.template('Button'),
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

    template: module.template('ButtonPanel'),

    childClass: Button,

    grouping: {}, // use grouping by default
    groupingClass: {
      className: namespace + '.ButtonGroupingNode',

      rule: function(button){
        return button.groupId || button.basisObjectId;
      },

      childClass: {
        className: namespace + '.ButtonGroup',
        template: module.template('ButtonGroup')
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    Button: Button,
    ButtonPanel: ButtonPanel
  };
