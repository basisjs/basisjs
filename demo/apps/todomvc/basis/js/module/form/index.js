require('basis.ui');

//
// Import names
//

var Todo = require('app.type').Todo;


//
// Main view
//

module.exports = new basis.ui.Node({
  template: resource('template/form.tmpl'),
  action: {
    create: function(event){
      // do action only when enter key pressed
      if (event.key != event.KEY.ENTER)
        return;

      // read input value and trim it
      var value = event.sender.value.trim();

      // check is there non empty string
      if (value)
      {
        // clear input
        event.sender.value = '';

        // create new todo
        Todo({
          title: value
        });
      }
    }
  }
});
