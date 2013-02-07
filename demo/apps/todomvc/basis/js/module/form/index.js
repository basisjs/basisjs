
  basis.require('basis.ui');
  basis.require('app.type');

  module.exports = new basis.ui.Node({
    template: resource('template/form.tmpl'),
    action: {
      create: function(event){
        if (event.key != event.KEY.ENTER)
          return;

        var value = event.sender.value.trim();
        if (value)
        {
          event.sender.value = '';
          app.type.Todo({
            title: value
          });
        }
      }
    }
  });