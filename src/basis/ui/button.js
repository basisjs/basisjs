
 /**
  * @see ./demo/defile/button.html
  * @namespace basis.ui.button
  */

  var namespace = module.namespace;


  //
  // import names
  //

  var Node = require('basis.ui').Node;


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
    caption: '[no caption]',

   /**
    * Set new caption and update binding.
    * @param {string} newCaption
    */
    setCaption: function(newCaption){
      this.caption = newCaption;
      this.updateBind('caption');
    },

   /**
    * Actions on click.
    */
    click: function(){
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
