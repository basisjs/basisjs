module.exports = {
  name: 'Calendar',

  init: function(){
    basis.require('basis.ui.calendar');

    basis.ui.calendar.CalendarSection.TestSectionMonth = basis.ui.calendar.CalendarSection.Month.subclass({
      childClass: {
        template: '<div><span class="{before} {after}"/></div>'
      }
    })
  },
  test: [{
    name: 'Test CalendarNode styles are applied',

    test: function(){
      var calendar = new basis.ui.calendar.Calendar({
        sections: ['TestSectionMonth'],
        date: new Date(2014, 4, 1)
      });

      var month = calendar.firstChild;
      var day = month.firstChild;

      assert(/before/.test(day.element.innerHTML) == true);

      day.updateBind('before');
      assert(/before/.test(day.element.innerHTML) == true);
    }
  }]
};