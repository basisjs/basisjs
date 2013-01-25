
  basis.require('basis.event');
  basis.require('basis.date');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.data.property');
  basis.require('basis.ui');
  basis.require('basis.l10n');


 /**
  * @see ./demo/defile/calendar.html
  * @namespace basis.ui.calendar
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var arrayFrom = basis.array.from;
  var getter = basis.getter;
  var createEvent = basis.event.create;
  var l10nToken = basis.l10n.getToken;

  var Property = basis.data.property.Property;
  var UINode = basis.ui.Node;


  //
  // main part
  //

  var YEAR = 'year';
  var MONTH = 'month';
  var DAY = 'day';
  var HOUR = 'hour';
  var FORWARD = true;
  var BACKWARD = false;

  var monthNumToRef = basis.date.monthNumToAbbr;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Calendar: resource('templates/calendar/Calendar.tmpl'),
    Section: resource('templates/calendar/Section.tmpl'),
    SectionMonth: resource('templates/calendar/SectionMonth.tmpl'),
    Node: resource('templates/calendar/Node.tmpl')
  });

  basis.l10n.createDictionary(namespace, __dirname + 'l10n/calendar', {
    "quarter": "Quarter",
    "today": "Today",
    "selected": "Selected"
  });

  basis.l10n.createDictionary(namespace + '.month', __dirname + 'l10n/calendar', {
    "jan": "January",
    "feb": "February",
    "mar": "March",
    "apr": "April",
    "may": "May",
    "jun": "June",
    "jul": "July",
    "aug": "August",
    "sep": "September",
    "oct": "October",
    "nov": "November",
    "dec": "December"
  });

  basis.l10n.createDictionary(namespace + '.monthShort', __dirname + 'l10n/calendar', {
    "jan": "Jan",
    "feb": "Feb",
    "mar": "Mar",
    "apr": "Apr",
    "may": "May",
    "jun": "Jun",
    "jul": "Jul",
    "aug": "Aug",
    "sep": "Sep",
    "oct": "Oct",
    "nov": "Nov",
    "dec": "Dec"
  });

  basis.l10n.createDictionary(namespace + '.day', __dirname + 'l10n/calendar', {
    "mon": "Monday",
    "tue": "Tuesday",
    "wed": "Wednesday",
    "thr": "Thursday",
    "fri": "Friday",
    "sat": "Saturday",
    "sun": "Sunday"
  });

  basis.l10n.createDictionary(namespace + '.day2', __dirname + 'l10n/calendar', {
    "mon": "Mo",
    "tue": "Tu",
    "wed": "We",
    "thr": "Th",
    "fri": "Fr",
    "sat": "Sa",
    "sun": "Su"
  });

  basis.l10n.createDictionary(namespace + '.day3', __dirname + 'l10n/calendar', {
    "mon": "Mon",
    "tue": "Tue",
    "wed": "Wed",
    "thr": "Thr",
    "fri": "Fri",
    "sat": "Sat",
    "sun": "Sun"
  });

  //
  // Tools
  //

  function unpackDate(date){
    return {
      hour:  date.getHours(),
      day:   date.getDate() - 1,
      month: date.getMonth(),
      year:  date.getFullYear()
    };
  }

  function binarySearchIntervalPos(arr, value){
    if (!arr.length)  // empty array check
      return -1;

    var pos, compareValue;
    var l = 0;
    var r = arr.length;
    var lv, rv;

    // binary search
    do
    {
      compareValue = arr[pos = (l + r) >> 1];
      if (value < (lv = compareValue.periodStart))
        r = pos - 1;
      else
        if (value > (rv = compareValue.periodEnd))
          l = pos + 1;
        else
          return value >= lv && value <= rv ? pos : -1;
    }
    while (l <= r);

    return -1;
  }

  //
  //  days bit mask
  //

  var DAY_COUNT_MASK = {};
  var MAX_DAY_MASK   = 0x7FFFFFFF;  // 2^31

  (function(){
    var i = 32;
    var mask = MAX_DAY_MASK;
    while (--i)
    {
      DAY_COUNT_MASK[i] = mask;
      mask >>= 1;
    }
  })();

  //
  //  period titles
  //

  var PERIOD_TITLE = {
    century: function(period){
      return period.periodStart.getFullYear() + ' - ' + period.periodEnd.getFullYear();
    },
    decade: function(period){
      return period.periodStart.getFullYear() + ' - ' + period.periodEnd.getFullYear();
    },
    year: function(period){
      return period.periodStart.getFullYear();
    },
    quarter: function(period){
      return l10nToken(namespace, 'quarter');
      //return LOCALE('QUARTER').toLowerCase().format(1 + period.periodStart.getMonth().base(3)/3);
    },
    month: function(period){
      return l10nToken(namespace, 'monthShort', monthNumToRef[period.periodStart.getMonth()]);
      //return LOCALE('MONTH').SHORT[period.periodStart.getMonth()].toLowerCase();
    },
    day: function(period){
      return period.periodStart.getDate();
    }
  };

  //
  //  period getter
  //

  var PERIOD = {
    century: [YEAR,  100, 0, 0, 100, 0, 0],
    decade:  [YEAR,  10, 0, 0, 10, 0, 0],
    year:    [YEAR,  1, 0, 0, 1, 0, 0],
    quarter: [MONTH, 1, 3, 0, 0, 3, 0],
    month:   [MONTH, 1, 1, 0, 0, 1, 0],
    day:     [DAY,   1, 1, 1, 0, 0, 1]
  };

  function getPeriod(periodName, date){
    var result = {};
    var mod = PERIOD[periodName];
    if (mod)
    {
      var y = date.getFullYear();
      var m = date.getMonth();
      var d = date.getDate();

      y = y - y % mod[1];
      m = mod[2] ? m - m % mod[2] : 0;
      d = mod[3] ? d : 1;

      result.periodStart = new Date(y, m, d);
      result.periodEnd = new Date(new Date(y + mod[4], m + mod[5], d + mod[6]) - 1);
    }
    else
    {
      result.periodStart = new Date(date);
      result.periodEnd = new Date(date);
    }

    return result;
  }


  //
  // SECTIONS
  //

 /**
  * @class
  */
  var CalendarNode = Class(UINode, {
    className: namespace + '.Calendar.Node',

    childClass: null,

    periodStart: null,
    periodEnd: null,

    event_periodChanged: createEvent('periodChanged'),
    event_select: function(){
      UINode.prototype.event_select.call(this);

      DOM.focus(this.element);
    },

    template: templates.Node,
    binding: {
      nodePeriodName: 'nodePeriodName',
      title: {
        events: 'periodChanged',
        getter: function(node){
          return PERIOD_TITLE[node.nodePeriodName](node);
        }
      },
      before: {
        events: 'periodChanged',
        getter: function(node){
          return node.parentNode && node.periodStart < node.parentNode.periodStart
            ? 'before'
            : '';
        }
      },
      after: {
        events: 'periodChanged',
        getter: function(node){
          return node.parentNode && node.periodEnd > node.parentNode.periodEnd
            ? 'after'
            : '';
        }
      }
    },
    action: {
      click: function(event){
        var calendar = this.parentNode && this.parentNode.parentNode;
        if (calendar && !this.isDisabled())
          calendar.templateAction('click', event, this);
      }
    },

    setPeriod: function(period, selectedDate, rebuild){
      if (rebuild || (this.periodStart - period.periodStart || this.periodEnd - period.periodEnd))
      {
        this.periodStart = period.periodStart;
        this.periodEnd = period.periodEnd;

        // FIXME: shouldn't access to parent
        var calendar = this.parentNode && this.parentNode.parentNode;
        if (calendar)
        {
          if (calendar.isPeriodEnabled(this.periodStart, this.periodEnd))
            this.enable();
          else
            this.disable();
        }

        if (selectedDate)
        {
          if (selectedDate >= this.periodStart && selectedDate <= this.periodEnd)
            this.select();
          else
            this.unselect();
        }

        this.event_periodChanged();
      }
    }
  });

  function getPeriods(){
    // update nodes
    var nodePeriod = getPeriod(this.nodePeriodName, new Date(this.periodStart).add(this.nodePeriodUnit, -this.nodePeriodUnitCount * (this.getInitOffset(this.periodStart) || 0)));
    var result = [];

    for (var i = 0; i < this.nodeCount; i++)
    {
      result.push(nodePeriod);

      // move to next period
      nodePeriod = getPeriod(this.nodePeriodName, new Date(nodePeriod.periodStart).add(this.nodePeriodUnit, this.nodePeriodUnitCount));
    }

    return result;
  }

 /**
  * @class
  */
  var CalendarSection = Class(UINode, {
    className: namespace + '.CalendarSection',

    event_periodChanged: createEvent('periodChanged'),
    event_selectedDateChanged: createEvent('selectedDateChanged'),

    template: templates.Section,

    binding: {
      sectionName: 'sectionName',
      title: {
        events: 'periodChanged',
        getter: function(node){
          return node.getTitle(node.periodStart) || '-';
        }
      },
      tabTitle: {
        events: 'selectedDateChanged',
        getter: function(node){
          return node.getTabTitle(node.selectedDate) || '-';
        }
      }
    },

    childClass: CalendarNode,

    // dates

    minDate: null,
    maxDate: null,

    periodStart: null,
    periodEnd: null,
    setPeriod: function(period, rebuild){
      if (rebuild || (this.periodStart - period.periodStart || this.periodEnd - period.periodEnd))
      {
        var oldPeriodStart = this.periodStart;
        var oldPeriodEnd = this.periodEnd;

        this.periodStart = period.periodStart;
        this.periodEnd = period.periodEnd;

        var periods = getPeriods.call(this);

        this.minDate = periods[0].periodStart;
        this.maxDate = periods[periods.length - 1].periodEnd;

        if (this.firstChild)
          for (var i = 0, child; child = this.childNodes[i]; i++)
            child.setPeriod(periods[i], this.selectedDate, rebuild);

        this.event_periodChanged(oldPeriodStart, oldPeriodEnd);
      }
    },

    selectedDate: null,
    setSelectedDate: function(date){
      if (this.selectedDate - date)
      {
        var oldSelectedDate = this.selectedDate;
        this.selectedDate = date;

        var node = this.getNodeByDate(this.selectedDate);
        if (node)
          node.select();
        else
        {
          if (this.selectedDate /*&& this.minDate <= this.selectedDate && this.selectedDate <= this.maxDate*/)
            this.setViewDate(this.selectedDate);
          else
            this.selection.clear();
        }

        this.event_selectedDateChanged(oldSelectedDate);
      }
    },

    // period

    isPrevPeriodEnabled: true,
    isNextPeriodEnabled: true,

    periodName: 'period',

    // nodes properties

    nodeCount: 12,
    nodePeriodName: '-',
    nodePeriodUnit: '-',
    nodePeriodUnitCount: 1,

    selection: true,

    init: function(){
      var selectedDate = this.selectedDate || new Date;
      this.selectedDate = null;

      this.setViewDate(selectedDate);

      this.childNodes = getPeriods.call(this).map(function(period){
        return {
          nodePeriodName: this.nodePeriodName,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd
        };
      }, this);

      UINode.prototype.init.call(this);

      this.setSelectedDate(selectedDate);

      // FIXME: remove when possible; it is a hack, because tabElement will be placed aside of this.tmpl.element
      Event.addHandler(this.tmpl.tabElement, 'click', this.select.bind(this, false));
    },

    getTitle: function(){},
    getTabTitle: function(){},

    // nodes methods

    getNodeByDate: function(date){
      if (date && this.periodStart <= date && date <= this.periodEnd)
      {
        var pos = binarySearchIntervalPos(this.childNodes, date);
        if (pos != -1)
          return this.childNodes[pos];
      }

      return null;
    },

    prevPeriod: function(){
      if (this.isPrevPeriodEnabled)
        this.setPeriod(getPeriod(this.periodName, new Date(+this.periodStart - 1)));
    },

    nextPeriod: function(){
      if (this.isNextPeriodEnabled)
        this.setPeriod(getPeriod(this.periodName, new Date(+this.periodEnd + 1)));
    },

    setViewDate: function(date){
      this.setPeriod(getPeriod(this.periodName, date));
    },

    rebuild: function(){
      this.setPeriod(getPeriod(this.periodName, this.selectedDate), true);
    },

    // bild methods
    getInitOffset: function(){}
  });

 /**
  * @class
  */
  CalendarSection.Month = Class(CalendarSection, {
    className: namespace + '.CalendarSection.Month',

    sectionName: 'Month',
    periodName: MONTH,

    nodeCount: 6 * 7,       // 6 weeks
    nodePeriodName: DAY,
    nodePeriodUnit: DAY,

    getTabTitle: function(node){
      return node.getDate();
    },
    getInitOffset: function(date){
      return 1 + (new Date(date).set(DAY, 1).getDay() + 5) % 7;
    },

    template: templates.SectionMonth,
    binding: {
      year: {
        events: 'periodChanged',
        getter: function(node){
          return node.periodStart.getFullYear();
        }
      },
      title: {
        events: 'periodChanged',
        getter: function(node){
          return l10nToken(namespace, 'month', monthNumToRef[node.periodStart.getMonth()]);
        }
      }
    }
  });

 /**
  * @class
  */
  CalendarSection.Year = Class(CalendarSection, {
    className:  namespace + '.CalendarSection.Year',

    sectionName: 'Year',
    periodName: YEAR,

    nodePeriodName: MONTH,
    nodePeriodUnit: MONTH,

    getTabTitle: function(node){
      return l10nToken(namespace, 'month', monthNumToRef[node.getMonth()]);
    },
    getTitle: function(node){
      return node.getFullYear();
    }
  });

 /**
  * @class
  */
  CalendarSection.YearDecade = Class(CalendarSection, {
    className: namespace + '.CalendarSection.YearDecade',

    sectionName: 'YearDecade',
    periodName: 'decade',

    nodePeriodName: YEAR,
    nodePeriodUnit: YEAR,

    getInitOffset: function(){
      return 1;
    },
    getTabTitle: function(node){
      return node.getFullYear();
    },
    getTitle: function(periodStart){
      return periodStart.getFullYear() + ' - ' + this.periodEnd.getFullYear();
    }
  });

 /**
  * @class
  */
  CalendarSection.Century = Class(CalendarSection, {
    className: namespace + '.CalendarSection.Century',

    sectionName: 'Century',
    periodName: 'century',

    nodePeriodName: 'decade',
    nodePeriodUnit: YEAR,
    nodePeriodUnitCount: 10,

    getTabTitle: function(date){
      if (date)
      {
        var year = date.getFullYear();
        var start = year - year % 10;
        return start + '-' + (Number(start.toString().substr(-2)) + 9).lead(2);
      }
    },

    getInitOffset: function(){
      return 1;
    }
  });

 /**
  * @class
  */
  CalendarSection.YearQuarters = Class(CalendarSection, {
    className: namespace + '.CalendarSection.YearQuarter',

    sectionName: 'YearQuarter',
    periodName: YEAR,

    nodeCount: 4,
    nodePeriodName: 'quarter',
    nodePeriodUnit: MONTH,
    nodePeriodUnitCount: 3
  });

 /**
  * @class
  */
  CalendarSection.Quarter = Class(CalendarSection, {
    className: namespace + '.CalendarSection.Quarter',

    sectionName: 'Quarter',
    periodName: 'quarter',

    nodeCount: 3,
    nodePeriodName: MONTH,
    nodePeriodUnit: MONTH,

    binding: {
      title: {
        events: 'periodChanged',
        getter: function(){
          return l10nToken(namespace, 'quarter');
        }
      }
    }
/*
    getTitle: function(periodStart){
      return [Math.floor(1 + periodStart.getMonth().base(3)/3), LOCALE('QUARTER').toLowerCase(), periodStart.getFullYear()].join(' ');
    }*/
  });

  //
  // Calendar
  //

 /**
  * @class
  */
  var Calendar = Class(UINode, {
    className: namespace + '.Calendar',

    event_change: createEvent('change'),

    selection: true,
    childClass: CalendarSection,
    childFactory: function(){},

    template: templates.Calendar,
    binding: {
      today: function(){
        return new Date().toFormat("%D.%M.%Y");
      }
    },
    action: {
      moveNext: function(){
        this.selection.pick().nextPeriod();
      },
      movePrev: function(){
        this.selection.pick().prevPeriod();
      },
      selectToday: function(){
        this.selectedDate.set(new Date());
      }
    },

    event_childNodesModified: function(delta){
      if (delta.inserted)
        for (var i = 0, section; section = delta.inserted[i++];)
        {
          section.setViewDate(this.date.value);
          this.selectedDate.addLink(section, section.setSelectedDate);
        }

      if (delta.deleted)
        for (var i = 0, section; section = delta.deleted[i++];)
          this.selectedDate.removeLink(section, section.setSelectedDate);

      UINode.prototype.event_childNodesModified.call(this, delta);

      DOM.insert(
        DOM.clear(this.tmpl.sectionTabs),
        this.childNodes.map(getter('tmpl.tabElement'))
      );

      if (this.selection && !this.selection.itemCount && this.firstChild)
        this.firstChild.select();
    },
    templateAction: function(actionName, event, node){
      UINode.prototype.templateAction.call(this, actionName, event);

      if (node instanceof CalendarNode)
      {
        var newDate = node.periodStart;
        var activeSection = this.selection.pick();
        this.selectedDate.set(new Date(this.selectedDate.value).add(activeSection.nodePeriodUnit, this.selectedDate.value.diff(activeSection.nodePeriodUnit, newDate)));
        this.nextSection(BACKWARD);
      }
    },

    date: null,

    // enable/disable periods
    minDate: null,
    maxDate: null,
    map: null,
    periodEnableByDefault: true,   // default state of periods: 1 = enabled, 0 = disabled

    sections: ['Month', /*'Quarter', 'YearQuarters', */'Year', 'YearDecade'/*, 'Century'*/],

   /**
    * @constructor
    */
    init: function(){
      // dates
      var now = new Date();

      this.selectedDate = new Property(new Date(this.date || now));
      this.date = new Property(new Date(this.date || now));

      // inherit
      UINode.prototype.init.call(this);

      // min/max dates

      // insert sections
      if (this.sections)
        DOM.insert(this, this.sections.map(function(sectionClass){
          return new CalendarSection[sectionClass]({
            selectedDate: this.selectedDate.value
          });
        }, this));
    },

    setMinDate: function(date){
      if (this.minDate != date)
      {
        this.minDate = date;
        for (var i = 0, section; section = this.childNodes[i]; i++)
          section.rebuild();
      }
    },
    setMaxDate: function(date){
      if (this.maxDate != date)
      {
        this.maxDate = date;
        for (var i = 0, section; section = this.childNodes[i]; i++)
          section.rebuild();
      }
    },

    // section navigate
    setSection: function(sectionName){
      var section = this.childNodes.search('sectionName', sectionName);
      if (section)
        section.select();
    },
    nextSection: function(forward){
      var activeSection = this.selection.pick();
      var section = forward ? activeSection.nextSibling : activeSection.previousSibling;
      if (section)
      {
        section.select();
        section.setViewDate(this.selectedDate.value);
      }
      else
      {
        if (!forward)
          this.event_change();
      }
    },

    // date change
    selectDate: function(date){
      if (date - this.date.value != 0)  // test for date equal
        this.date.set(date);
    },

    //
    // period methods
    //

    getNextPeriod: function(date, forward){
      // check for period is enabled
      if (!this.isNextPeriodEnabled(date, forward))
        return false;

      if (this.map)
      {
        var offset = forward ? 1 : -1;
        var startMark = forward ? 'start' : 'till';
        var endMark = forward ? 'till' : 'start';
        var cursor = (new Date(date)).add('millisecond', offset);
        var map = this.map[this.periodEnableByDefault ? 'disabled' : 'enabled'];

        if (map)
        {
          // init period
          var period = getPeriod(YEAR, cursor);

          // if current year selected, get a part of period
          if (period.periodEnd.getFullYear() == cursor.getFullYear())
            period[startMark] = cursor;

          // search for enable year
          while (!this.isPeriodEnabled(period.periodStart, period.periodEnd))
            period = getPeriod(YEAR, cursor.add(YEAR, offset));

          // enabled year found, search for enabled month - it's situate between period.periodStart and period.periodEnd
          period[endMark] = getPeriod(MONTH, period[startMark])[endMark];
          while (!this.isPeriodEnabled(period.periodStart, period.periodEnd))
            period = getPeriod(MONTH, cursor.add(MONTH, offset));

          // enabled month found, search for day
          var s = unpackDate(period[startMark]);
          var t = unpackDate(period[endMark]);
          var month = map[t.year] && map[t.year][t.month];

          // month check out
          if (month)
          {
            if (this.periodEnableByDefault)
            {
              var mask  = DAY_COUNT_MASK[period.periodEnd.getMonthDayCount()];
              month = month & mask ^ mask;  // bit inverse
            }

            // search for first not zero bit
            for (var i = s.day; i != t.day + offset; i += offset)
              if (month >> i & 1)
              {
                // date found
                cursor = new Date(s.year, s.month, i + 1);
                break;
              }
          }
          else
            // month may be null: this case possible in 'enabled' default state only,
            // when no disabled days in month or description of month omited.
            // This case means that we could return day of period.periodEnd

            return getPeriod(DAY, period[startMark]);
        }
      }

      return getPeriod(DAY, cursor);
    },

    isNextPeriodEnabled: function(date, forward){
      // check for min date
      if (!forward && this.minDate && this.minDate > date)
        return false;

      // check for max date
      if ( forward && this.maxDate && this.maxDate < date)
        return false;

      // check for map
      if (this.map)
      {
        if (this.periodEnableByDefault)
        {
          if (!forward && this.minDate)
            return this.isPeriodEnabled(this.minDate, date);

          if ( forward && this.maxDate)
            return this.isPeriodEnabled(date, this.maxDate);
        }
        else
        {
          var offset = forward ? 1 : -1;
          var curYear = date.getFullYear();
          var firstDate = (new Date(date)).add('millisecond', offset);
          var firstYear = firstDate.getFullYear();
          var years = Object.keys(this.map.enable).filter(function(year){ return offset * year >= offset * firstYear; });
          var yearCount = years.length;

          if (yearCount)
          {
            years = years.sort(function(a, b){
              return offset * (a > b) || -offset * (a < b);
            });

            for (var i = 0; i < yearCount; i++)
            {
              var period = getPeriod(YEAR, new Date(years[i], 0));
              if (this.isPeriodEnabled(
                     forward && years[i] == curYear ? firstDate : period.periodStart,
                    !forward && years[i] == curYear ? firstDate : period.periodEnd
                 ))
                return true;
            }
          }

          return false;
        }
      }
      return true;
    },

    isPeriodEnabled: function(periodStart, periodEnd){

      function checkMapDays(mode, month, sday, tday){
        var result;
        if (!mode)
          // first month:  check only for last days
          result = month >> sday;
        else if (mode == 1)
          // last month:   check only for first days
          result = month & DAY_COUNT_MASK[tday + 1]; // MAX_DAY_MASK >> 31 - tday
        else
          // middle month: check full month
          result = month;
        return result;
      }

      // check for min/max dates
      if (this.minDate && this.minDate > periodEnd)
        return false;

      if (this.maxDate && this.maxDate < periodStart)
        return false;

      // check for map
      var map = this.map && this.map[this.periodEnableByDefault ? 'disabled' : 'enabled'];
      if (map)
      {
        var s = unpackDate(periodStart);
        var e = unpackDate(periodEnd);

        var year, month, mask;
        var monthIndex = s.month;

        var cursor = new Date(s.year, s.month);
        var monthMark = 11 - s.month;
        var monthCount = (monthMark + 1) + (e.year - s.year - 1) * 12 + (e.month + 1) - 1; // month count - 1

        if (this.periodEnableByDefault)
        {
          //
          // check for exception: one month/one day
          //
          if (monthCount == 0)
          {
            // check for day period
            return !(year  = map[s.year])     // full year enabled, return true
                   ||
                   !(month = year[s.month])   // full month enabled, return true
                   ||
                   (((month ^ MAX_DAY_MASK) >> s.day) & DAY_COUNT_MASK[e.day - s.day + 1]);  // MAX_DAY_MASK >> 31 - (t.day - s.day + 1)
          }

          //
          // regular block: some monthes
          //
          for (var i = 0; i <= monthCount; i++)
          {
            // select year if necessary
            if (!i || (monthMark == i % 12))
            {
              year = map[cursor.getFullYear()];
              if (!year)
                return true; // all year enabled
            }

            // select month
            month = year[monthIndex = cursor.getMonth()];
            if (!month)
              return true;   // all month enabled

            // check for not disabled days
            mask = DAY_COUNT_MASK[cursor.getMonthDayCount()];
            if (checkMapDays(i/monthCount, month & mask ^ mask, s.day, e.day))
              return true;

            // move to next month
            cursor.setMonth(monthIndex + 1);
          }
          // there all dates in period is disabled, period is disable
          return false;
        }
        else
        {
          //
          // check for exception: one month/one day
          //
          if (monthCount == 0)
            // check for day period
            return (year  = map[s.year])      // year absent return false
                   &&
                   (month = year[s.month])    // month absent return false
                   &&
                   ((month >> s.day) & DAY_COUNT_MASK[e.day - s.day + 1]);  // MAX_DAY_MASK >> 31 - (t.day - s.day + 1)

          //
          // regular block: some monthes
          //
          for (var i = 0; i <= monthCount; i++)
          {
            // select year if necessary
            if (!i || (monthMark == i % 12) || !year)
            {
              year = map[cursor.getFullYear()];
              if (!year)
              {
                // move to next year
                i += 12;
                cursor.setMonth(monthIndex + 12);
                continue;
              }
            }

            // check for enabled days
            month = year[monthIndex = cursor.getMonth()];
            if (month && checkMapDays(i/monthCount, month, s.day, e.day))
              return true;

            // move to next month
            cursor.setMonth(monthIndex + 1);
          }
          // there no enabled dates in period, period is disable
          return false;
        }
      }

      return true;
    },

    // destruction

    destroy: function(){
      UINode.prototype.destroy.call(this);

      this.date.destroy();
    }
  });


  //
  // export names
  //

  module.exports = {
    Calendar: Calendar,
    CalendarSection: CalendarSection
  };
