/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    // namespace

    var namespace = 'Basis.Controls.Calendar';

    // import names

    var Class = Basis.Class;
    var Event = Basis.Event;
    var DOM = Basis.DOM;
    var Data = Basis.Data;
    var Template = Basis.Html.Template;

    var cssClass = Basis.CSS.cssClass;

    var nsWrapers = DOM.Wrapers;
    var Property = nsWrapers.Property;

    //
    // CONST
    //

    var YEAR  = 'year';
    var MONTH = 'month';
    var DAY   = 'day';
    var HOUR  = 'hour';
    var FORWARD  = true;
    var BACKWARD = false;

    // locale

    var LOCALE = function(section){
      var locale = Basis.Locale['Controls.Calendar'];
      return locale ? locale[section] : section;
    };

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
      century: function(period){ return period.periodStart.getFullYear() + ' - ' + period.periodEnd.getFullYear() },
      decade:  function(period){ return period.periodStart.getFullYear() + ' - ' + period.periodEnd.getFullYear() },
      year:    function(period){ return period.periodStart.getFullYear() },
      quarter: function(period){ return LOCALE('QUARTER').toLowerCase().format(1 + period.periodStart.getMonth().base(3)/3) },
      month:   function(period){ return LOCALE('MONTH').SHORT[period.periodStart.getMonth()].toLowerCase() }, 
      day:     function(period){ return period.periodStart.getDate() }
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
        result.periodStart = new Date(result.periodEnd = new Date(date));

      return result;
    }


    //
    // SECTIONS
    //

    var CalendarNode = Class(nsWrapers.HtmlNode, {
      className: namespace + '.Calendar.Node',

      canHaveChildren: false,
      template: new Template(
        '<a{element|content} class="Basis-Calendar-Node" href="#move:down">{title|-}</a>'
      ),

      behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
        select: function(){
          this.inherit();

          DOM.focus(this.element);
        },
        update: function(object, newInfo, oldInfo, delta){
          this.inherit(object, newInfo, oldInfo, delta);

          if ('periodStart' in delta || 'periodEnd' in delta)
          {
            this.title.nodeValue = PERIOD_TITLE[this.nodePeriodName](newInfo);

            /*
            if (this.document.isPeriodEnabled(newInfo.periodStart, newInfo.periodEnd))
            {
              this.enable();

              //console.log(this.document.viewDate.value, newInfo.periodStart, newInfo.periodEnd, newInfo.periodStart <= this.document.viewDate.value && this.document.viewDate.value <= newInfo.periodEnd);
              if (newInfo.periodStart <= this.document.selectedDate.value && this.document.selectedDate.value <= newInfo.periodEnd)
                this.select();
              else
                this.unselect();
            }
            else
            {
              this.disable();
            }*/

            if (this.parentNode)
            {
              cssClass(this.element)
                .bool('before', newInfo.periodStart < this.parentNode.info.periodStart)
                .bool('after', newInfo.periodEnd > this.parentNode.info.periodEnd);
            }
          }
        }
      }),

      init: function(nodePeriodName){
        this.nodePeriodName = nodePeriodName;

        config = this.inherit({});

        cssClass(this.element).add(nodePeriodName);

        return config;
      }
    });

    var CalendarSection = Class(nsWrapers.HtmlNode, {
      className: namespace + '.Calendar.Section',

      childClass: CalendarNode,
      childFactory: function(config){ return new CalendarNode(config) },
      template: new Template(
        '<div{element|selectedElement} class="Basis-Calendar-Section">' +
          '<div class="Basis-Calendar-SectionTitle">{titleText}</div>' +
          '<div{content|childNodesElement} class="Basis-Calendar-SectionContent"/>' +
        '</div>'
      ),

      behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
        select: function(){
          this.inherit();
          cssClass(this.titleElement).add('selected');
        },
        unselect: function(){
          this.inherit();
          cssClass(this.titleElement).remove('selected');
        },
        update: function(object, newInfo, oldInfo, delta){
          this.inherit(object, newInfo, oldInfo, delta);

          if ('periodStart' in delta || 'periodEnd' in delta)
          {
            this.setTitle();

            // update nodes
            var nodePeriod = getPeriod(this.nodePeriodName, new Date(newInfo.periodStart).add(this.nodePeriodUnit, -this.nodePeriodUnitCount * (this.getInitOffset(newInfo.periodStart) || 0)));
            this.minDate = nodePeriod.periodStart;

            for (var node = this.firstChild; node; node = node.nextSibling)
            {
              // update node
              node.update(nodePeriod);

              // move to next period
              nodePeriod = getPeriod(this.nodePeriodName, new Date(nodePeriod.periodStart).add(this.nodePeriodUnit, this.nodePeriodUnitCount));
            }

            this.maxDate = nodePeriod.periodEnd;

            /*
            var doc = this.document;
            this.isPrevPeriodEnabled = doc.isNextPeriodEnabled(this.minDate, BACKWARD);
            this.isNextPeriodEnabled = doc.isNextPeriodEnabled(this.maxDate, FORWARD);

            cssClass(doc.prev).bool('disabled', !this.isPrevPeriodEnabled);
            cssClass(doc.next).bool('disabled', !this.isNextPeriodEnabled);*/
          }

          this.tabTitleText.nodeValue = this.getTabTitle(this.info.selectedDate) || '-';

          var node = this.getNodeByDate(this.info.selectedDate);
          if (node)
            node.select();
          else
            this.selection.clear();
        }
      }),

      // dates

      minDate: new Date(),
      maxDate: new Date(),/*
      periodStart: new Date(),
      periodEnd: new Date(),*/

      // period

      isPrevPeriodEnabled: true,
      isNextPeriodEnabled: true,

      periodName: 'period',

      // nodes properties

      nodeCount: 12,
      nodePeriodName: '-',
      nodePeriodUnit: '-',
      nodePeriodUnitCount: 1,

      init: function(config){
        this.selection = new nsWrapers.Selection();

        this.titleElement = DOM.createElement({
          description: '.Basis-Calendar-SectionTab',
          click: new Event.Handler(this.select, this)
        }, this.tabTitleText = DOM.createText(''));

        config = this.inherit(config);

        cssClass(this.element).add('Basis-Calendar-Section-' + this.sectionName);

        //for (var i = 0; i < this.nodeCount; i++)
        //  this.appendChild(new CalendarNode(this.nodePeriodName, i));
        DOM.insert(this, [this.nodePeriodName].repeat(this.nodeCount));

        if (config.viewDate)
          this.setViewDate(config.viewDate);
        if (config.selectedDate)
          this.update({ selectedDate: config.selectedDate });

        return config;
      },

      getTitle: function(){  },
      getTabTitle: function(){ return '1' },
      setTitle: function(){
        if (!this.info.periodStart)
          return;

        this.titleText.nodeValue = this.getTitle(this.info.periodStart) || '-';
        /*if (this.document)
          this.document.title.set(this.getTitle() || PERIOD_TITLE[this.periodName](this.info));*/
      },

      // nodes methods

      getNodeByDate: function(date){
        if (date && this.info.periodStart <= date && date <= this.info.periodEnd)
        {
          var pos = this.childNodes.binarySearchInterval(date, 'info.periodStart', 'info.periodEnd');
          if (pos != -1)
            return this.childNodes[pos];
        }

        return null;
      },

      nextPeriod: function(forward){
        var allowed = forward ? this.isNextPeriodEnabled : this.isPrevPeriodEnabled;
        if (allowed)
        {
          //var period = this.document.getNextPeriod(forward ? this.info.periodEnd : this.info.periodStart, forward);
          //period = getPeriod(this.periodName, new Date(forward ? this.info.periodStart - 1 : this.info.periodEnd + 1));
          //console.log(this.info.periodEnd, new Date(forward ? Number(this.info.periodEnd) + 1 : this.info.periodStart - 1));
          this.update(getPeriod(this.periodName, new Date(forward ? Number(this.info.periodEnd) + 1 : Number(this.info.periodStart) - 1)));
        }
      },

      setViewDate: function(date){
        this.update(getPeriod(this.periodName, date));
      },

      // bild methods
      getInitOffset: Function.$null
    });


    CalendarSection.Month = Class(CalendarSection, {
      className: namespace + '.Section.Month',

      sectionName: 'Month',
      periodName: MONTH,

      template: new Template(Function.lazyInit(function(){
        return '<div{element|selectedElement} class="Basis-Calendar-Section">' +
          '<div class="Basis-Calendar-SectionTitle">{titleText}</div>' +
          '<div{content|childNodesElement} class="Basis-Calendar-SectionContent">' +
            '<div class="week_days">' +
              LOCALE('DAY').SHORT2.map(String.format, '<span>{0}</span>').join('') +
            '</div>' +
          '</div>' +
        '</div>'
      })),

      nodeCount: 6 * 7,       // 6 weeks
      nodePeriodName: DAY,
      nodePeriodUnit: DAY,

      getTabTitle: Data.getter('getDate()'),
      getTitle: function(){
        return LOCALE('MONTH').FULL[this.info.periodStart.getMonth()] + ' ' + this.info.periodStart.getFullYear();
      },
      getInitOffset: function(date){
        return 1 + (new Date(date).set(DAY, 1).getDay() + 5) % 7;
      }
    });

    CalendarSection.Year = Class(CalendarSection, {
      className:  namespace + '.Section.Year',

      sectionName: 'Year',
      periodName: YEAR,

      nodePeriodName: MONTH,
      nodePeriodUnit: MONTH,

      init: function(config){
        config = this.inherit(config);

        /*for (var node = this.firstChild, i = 0; node; node = node.nextSibling, i++)
          node.setTitle(LOCALE('MONTH').SHORT[i].toLowerCase());*/

        return config;
      },
      getTabTitle: Data.getter('getMonth()', function(key){ return LOCALE('MONTH').FULL[key] }),
      getTitle: Data.getter('getFullYear()')
    });

    CalendarSection.YearDecade = Class(CalendarSection, {
      className: namespace + '.Section.YearDecade',

      sectionName: 'YearDecade',
      periodName: 'decade',

      nodePeriodName: YEAR,
      nodePeriodUnit: YEAR,

      getInitOffset: function(){
        return 1;
      },
      getTabTitle: Data.getter('getFullYear()'),
      getTitle: function(){
        return this.info.periodStart.getFullYear() + ' - ' + this.info.periodEnd.getFullYear();
      }
    });

    CalendarSection.Century = Class(CalendarSection, {
      className: namespace + '.Section.Century',

      sectionName: 'Century',
      periodName: 'century',

      nodePeriodName: 'decade',
      nodePeriodUnit: YEAR,
      nodePeriodUnitCount: 10,

      getInitOffset: function(){
        return 1;
      }
    });

    CalendarSection.YearQuarters = Class(CalendarSection, {
      className: namespace + '.Section.YearQuarter',

      sectionName: 'YearQuarter',
      periodName: YEAR,

      nodeCount: 4,
      nodePeriodName: 'quarter',
      nodePeriodUnit: MONTH,
      nodePeriodUnitCount: 3/*,

      init: function(config){
        config = this.inherit(config);

        for (var node = this.firstChild, i = 1; node; node = node.nextSibling, i++)
          node.setTitle(i + ' ' + LOCALE('QUARTER').toLowerCase());

        return config;
      }*/
    });

    CalendarSection.Quarter = Class(CalendarSection, {
      className: namespace + '.Section.Quarter',

      sectionName: 'Quarter',
      periodName: 'quarter',

      nodeCount: 3,
      nodePeriodName: MONTH,
      nodePeriodUnit: MONTH,

      getTitle: function(){
        return [Math.floor(1 + date.getMonth().base(3)/3), LOCALE('QUARTER').toLowerCase(), date.getFullYear()].join(' ');
      }
    });

    //
    // Calendar
    //

    var Calendar = Class(nsWrapers.HtmlControl, {
      className: namespace + '.Calendar',

      canHaveChildren: true,
      childClass: CalendarSection,
      childFactory: function(name){
        return new CalendarSection[name]({
          viewDate: this.date.value,
          selectedDate: this.selectedDate.value
        });
      },

      template: new Template(Function.lazyInit(function(){
        return '<div{element} class="Basis-Calendar">' +
          '<div{headerElement} class="Basis-Calendar-Header">' +
            /*'<a{prev} href="#move:prev" class="Basis-Calendar-MovePrevButton">' +
              '<span>\u2039</span><span class="over"></span>' +
            '</a>' +
            '<a{next} href="#move:next" class="Basis-Calendar-MoveNextButton">' +
              '<span>\u203A</span><span class="over"></span>' +
            '</a>' +*/
            '<div{sectionTabs} class="Basis-Calendar-SectionTabs">{titleText}</div>' +
            //'<a href="#move:up" class="Basis-Calendar-Title">{titleText}</a>' +
          '</div>' +
          '<div class="Basis-Calendar-Body">' +
            '<a{prev} href="#move:prev" class="Basis-Calendar-ButtonPrevPeriod">' +
              '<span>\u2039</span><span class="over"></span>' +
            '</a>' +
            '<a{next} href="#move:next" class="Basis-Calendar-ButtonNextPeriod">' +
              '<span>\u203A</span><span class="over"></span>' +
            '</a>' +
            '<div{content|childNodesElement} class="Basis-Calendar-Content"/>' +
          '</div>' +
          '<div{footerElement} class="Basis-Calendar-Footer">' +
            '<div class="today">' +
              '<label>' + LOCALE('TODAY') + ':</label>' +
              '<a href="#select:today" class="value">{todayText}</a>' +
            '</div>' +
          '</div>' +
        '</div>'
      })),

      behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlControl, {
        childNodesModified: function(){
          this.childNodes.forEach(function(n){n.setTitle()});
          DOM.insert(DOM.clear(this.sectionTabs), this.childNodes.map(Data.getter('titleElement')));
        },
        click: function(event, node){
          
          if (node instanceof CalendarNode)
          {
            var newDate = node.info.periodStart;
            this.selectedDate.set(new Date(this.selectedDate.value).add(this.activeSection.nodePeriodName, this.selectedDate.value.diff(this.activeSection.nodePeriodName, newDate)));
            this.nextSection(BACKWARD);
          }
          else
          {
            var sender = Event.sender(event);
            
            if (!DOM.is(sender, 'A'))
              sender = DOM.parent(sender, 'A', 0, this.element);

            if (sender && sender.hash)
            {
              if (!cssClass(sender).has('disabled'))
                switch (sender.hash.substr(1))
                {
                  case 'select:today':
                    this.selectedDate.set(new Date());
                  break;
                  case 'select:current':
                    this.selectDate(this.date.value);
                  break;
                  case 'move:prev':
                    this.nextPeriod(BACKWARD);
                  break;
                  case 'move:next':
                    this.nextPeriod(FORWARD);
                  break;
                  case 'move:up':
                    this.nextSection(FORWARD);
                  break;
                }
            }
          }

          Event.kill(event);
        }
      }),

      // enable/disable periods
      minDate: null,
      maxDate: null,
      map: {},
      periodEnableByDefault: true,   // default state of periods: 1 = enabled, 0 = disabled

      // constructor
      init: function(config){
        // create control (setup selection)
        config = this.inherit(Object.complete({
          selection: {
            handlersContext: this,
            handlers: {
              change: function(){
                var section = this.selection.items.first();
                this.activeSection = section;
                if (section)
                {
                  //DOM.insert(this.childNodesElement, section.element);
                  section.update({ selectedDate: this.selectedDate.value });
                }
              }
            }
          }
        }, config));

        // dates

        this.todayDate = new Property(new Date());
        this.date = new Property(new Date(config.date || new Date()));
        this.selectedDate = new Property(new Date(config.date || new Date()));

        this.selectedDate.addHandler({
          change: function(value){
            for (var section = this.firstChild; section; section = section.nextSibling)
              section.update({ selectedDate: value });
          }
        }, this);

        /*this.selectedDate.addHandler({
          change: function(value){
            var section = this.selection.items.first();
            if (section)
              section.setSelectedDate(value);
          }
        }, this);*/

        // Generate HTML structure

        this.todayDate.addLink(this.todayText, null, Data.getter("toFormat('%D.%M.%Y')"));

        // min/max dates

        if (config.minDate)
          this.minDate = config.minDate;

        if (config.maxDate)
          this.maxDate = config.maxDate;

        // default state & map

        if (config.map)
          this.map = config.map;

        if (config.defaultState)
          this.periodEnableByDefault = config.defaultState == 'enabled';

        // insert sections
        DOM.insert(this, config.sections || ['Month', /*'Quarter', 'YearQuarters', */'Year', 'YearDecade'/*, 'Century'*/]);

        // add event handler
        this.addEventListener('click');

        // init state
        // this.selection.add(this.firstChild);
        if (this.firstChild)
          this.firstChild.select();

        /*
        var self = this;
        new Basis.DragDrop.DragDropElement({
          element: this.content,
          handlers: {
            start: function(cfg){
              //console.log('start', cfg.deltaX, arguments);
              cfg.element = self.activeSection.content.cloneNode(true);
              cfg.sign = 0;
              DOM.css(cfg.element, { position: 'absolute', width: '100%', zIndex: 10 });
              DOM.insert(self.activeSection.content.parentNode, cfg.element, DOM.INSERT_BEFORE, self.activeSection.content);
            },
            move: function(cfg){
              if (cfg.deltaX.sign() != cfg.sign)
              {
                var diff = 2 - Math.abs(cfg.sign + cfg.deltaX.sign());
                while (diff--)
                  self.nextPeriod(cfg.sign > cfg.deltaX.sign());
                cfg.sign = cfg.deltaX.sign();
              }

              var width = cfg.element.offsetWidth;
              var dx = Math.abs(cfg.deltaX);
              if (dx > width)
                return this.stop();

              DOM.css(cfg.element, {
                left: (cfg.l = cfg.deltaX) + 'px',
                opacity: cfg.o = 1//dx > width/2 ? 2 * (width - dx)/width : 1
              });
              //DOM.css(self.activeSection.content, {
              //  opacity: dx > width/3 ? (3 * dx - width)/(2*width) : 0
              //});
            },
            over: function(cfg){
              var width = cfg.element.offsetWidth;
              
              //DOM.remove(cfg.element);

              var t = new Basis.Animation.Thread({ duration: 250 * (1 - Math.abs(cfg.l)/width) });
              var m = new Basis.Animation.Modificator(t, function(value){ DOM.css(cfg.element, { left: value + 'px' }) }, cfg.l, width * cfg.deltaX.sign());
              //var m = new Basis.Animation.Modificator(t, function(value){ DOM.css(cfg.element, { opacity: value }) }, cfg.o, 0);
              t.start();

              //if (Math.abs(cfg.deltaX) > width/2)
              //  self.nextPeriod(cfg.deltaX < 0);
              
              //console.log('over', arguments)
            }
          }
        })*/
      },

      // section navigate
      setSection: function(sectionName){
        var section = this.childNodes.search('sectionName', sectionName);
        if (section)
          section.select();
      },
      nextSection: function(forward){
        var section = forward ? this.activeSection.nextSibling : this.activeSection.previousSibling;
        if (section)
        {
          section.select();
          section.setViewDate(this.selectedDate.value);
        }
        else
          !forward && this.dispatch('change');
      },
      nextPeriod: function(forward){
        this.activeSection.nextPeriod(forward);
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
            var offset    = forward ? 1 : -1;

            var curYear   = date.getFullYear();
            var firstDate = (new Date(date)).add('millisecond', offset);
            var firstYear = firstDate.getFullYear();
            var years     = Object.keys(this.map.enable).filter(function(year){ return offset * year >= offset * firstYear });
            var yearCount = years.length;

            if (yearCount)
            {
              years = years.sort(function(a, b){ return offset * (a > b) || -offset * (a < b) });

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

          var cursor     = new Date(s.year, s.month);
          var monthMark  = 11 - s.month;
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
        this.inherit();

        this.date.destroy();
        this.todayDate.destroy();
      }

    });

    //
    //  export names
    //

    Basis.namespace(namespace).extend({
      Calendar: Calendar,
      CalendarSection: CalendarSection
    });

  })();
