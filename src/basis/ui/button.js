
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/button.html
  * @namespace basis.ui.button
  */

  var namespace = this.path;


  //
  // import names
  //

  var UINode = basis.ui.Node;


  //
  // main part
  //

 /**
  * @class
  */
  var Button = UINode.subclass({
    className: namespace + '.Button',

   /**
    * Button caption text.
    * @type {string}
    */
    caption: '[no caption]',

   /**
    * @inheritDoc
    */
    template: resource('templates/button/Button.tmpl'),

   /**
    * @inheritDoc
    */
    binding: {
      caption: 'caption'
    },

   /**
    * @inheritDoc
    */
    action: {
      click: function(event){
        if (!this.isDisabled())
          this.click();
      }
    },

   /**
    * Actions on click.
    */
    click: Function(),

   /**
    * Set new caption and update binding.
    * @param {string} newCaption
    */
    setCaption: function(newCaption){
      this.caption = newCaption;
      this.updateBind('caption');
    }
  });


 /**
  * @class
  */
  var ButtonPanel = UINode.subclass({
    className: namespace + '.ButtonPanel',

    template: resource('templates/button/ButtonPanel.tmpl'),

    childClass: Button,

    groupingClass: {
      className: namespace + '.ButtonGroupingNode',

      groupGetter: function(button){
        return button.groupId || button.eventObjectId;
      },

      childClass: {
        className: namespace + '.ButtonPartitionNode',

        template: resource('templates/button/ButtonGroup.tmpl')
      }
    },

    grouping: {}, // use grouping by default

   /**
    * Fetch button by name.
    * @param {string} name Name value of button.
    * @return {basis.ui.button.Button}
    */
    getButtonByName: function(name){
      return this.getChildByName(name);
    }
  });


  //
  // export names
  //

  module.exports = {
    Button: Button,
    ButtonPanel: ButtonPanel
  };
