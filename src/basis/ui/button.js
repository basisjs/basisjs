
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/button.html
  * @namespace basis.ui.button
  */

  var namespace = this.path;


  //
  // import names
  //

  var Node = basis.ui.Node;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Button: resource('templates/button/Button.tmpl'),
    ButtonPanel: resource('templates/button/ButtonPanel.tmpl'),
    ButtonGroup: resource('templates/button/ButtonGroup.tmpl')
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
