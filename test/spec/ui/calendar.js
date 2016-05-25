module.exports = {
  name: 'Calendar',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var Calendar = basis.require('basis.ui.calendar').Calendar;
    var CalendarSection = basis.require('basis.ui.calendar').CalendarSection;
  },

  test: [
    {
      name: 'CalendarNode',
      test: [
        {
          name: 'before binding should work on init',
          test: function(){
            var calendar = new Calendar({
              date: new Date(2014, 4, 1),
              childNodes: [
                new CalendarSection.Month({
                  childClass: {
                    template: '<div><span class="{before}"/></div>'
                  }
                })
              ]
            });
            var day = calendar.firstChild.firstChild;

            assert(/before/.test(day.element.innerHTML) == true);

            day.updateBind('before');
            assert(/before/.test(day.element.innerHTML) == true);
          }
        },
        {
          name: 'after binding should work on init',
          test: function(){
            var calendar = new Calendar({
              date: new Date(2014, 4, 1),
              childNodes: [
                new CalendarSection.Month({
                  childClass: {
                    template: '<div><span class="{after}"/></div>'
                  }
                })
              ]
            });
            var day = calendar.firstChild.lastChild;

            assert(/after/.test(day.element.innerHTML) == true);

            day.updateBind('after');
            assert(/after/.test(day.element.innerHTML) == true);
          }
        },
        {
          name: 'disabled binding should work on init',
          test: function(){
            var calendar = new Calendar({
              date: new Date(2014, 4, 1),
              minDate: new Date(2014, 4, 1),
              childNodes: [
                new CalendarSection.Month({
                  childClass: {
                    template: '<div><span class="{disabled}"/></div>'
                  }
                })
              ]
            });
            var day = calendar.firstChild.firstChild;

            assert(/disabled/.test(day.element.innerHTML) == true);

            day.updateBind('disabled');
            assert(/disabled/.test(day.element.innerHTML) == true);
          }
        }
      ]
    }
  ]
};
