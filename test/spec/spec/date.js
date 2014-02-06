module.exports = {
  name: 'basis.date',

  init: function(){
    basis.require('basis.date');

    function toUTC(date){
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return date;
    }
  },

  test: [
    {
      name: 'isLeapYear()',
      test: function(){
        this.is(true, basis.date.isLeapYear(new Date(2004, 1)));
        this.is(true, basis.date.isLeapYear(new Date(2000, 1)));
        this.is(true, basis.date.isLeapYear(new Date(1996, 1)));
        this.is(true, basis.date.isLeapYear(new Date(1600, 1)));
        this.is(true, basis.date.isLeapYear(new Date(2400, 1)));

        this.is(false, basis.date.isLeapYear(new Date(1995, 1)));
        this.is(false, basis.date.isLeapYear(new Date(1997, 1)));
        this.is(false, basis.date.isLeapYear(new Date(1998, 1)));
        this.is(false, basis.date.isLeapYear(new Date(1999, 1)));
        this.is(false, basis.date.isLeapYear(new Date(1900, 1)));
        this.is(false, basis.date.isLeapYear(new Date(2100, 1)));
        this.is(false, basis.date.isLeapYear(new Date(2500, 1)));
      }
    },
    {
      name: 'getMonthDayCount()',
      test: function(){
        var d = new Date(2007, 0);
        this.is(31, d.getMonthDayCount());
        var d = new Date(2007, 1);
        this.is(28, d.getMonthDayCount());
        var d = new Date(2007, 2);
        this.is(31, d.getMonthDayCount());
        var d = new Date(2007, 3);
        this.is(30, d.getMonthDayCount());
        var d = new Date(2007, 4);
        this.is(31, d.getMonthDayCount());
        var d = new Date(2007, 5);
        this.is(30, d.getMonthDayCount());
        var d = new Date(2007, 6);
        this.is(31, d.getMonthDayCount());
        var d = new Date(2007, 7);
        this.is(31, d.getMonthDayCount());
        var d = new Date(2007, 8);
        this.is(30, d.getMonthDayCount());
        var d = new Date(2007, 9);
        this.is(31, d.getMonthDayCount());
        var d = new Date(2007, 10);
        this.is(30, d.getMonthDayCount());
        var d = new Date(2007, 11);
        this.is(31, d.getMonthDayCount());

        var d = new Date(2008, 1);
        this.is(29, d.getMonthDayCount());

        var d = new Date(2000, 1);
        this.is(29, d.getMonthDayCount());

        var d = new Date(2100, 1);
        this.is(28, d.getMonthDayCount());

        var d = new Date(2400, 1);
        this.is(29, d.getMonthDayCount());
      }
    },
    {
      name: 'diff()',
      test: function(){
        var d = new Date(2000, 0, 1);
        this.is(0, basis.date.diff(d, 'year', new Date(2000, 0, 1)));
        this.is(0, basis.date.diff(d, 'month', new Date(2000, 0, 1)));
        this.is(0, basis.date.diff(d, 'day', new Date(2000, 0, 1)));
        this.is(0, basis.date.diff(d, 'hour', new Date(2000, 0, 1)));
        this.is(0, basis.date.diff(d, 'minute', new Date(2000, 0, 1)));
        this.is(0, basis.date.diff(d, 'second', new Date(2000, 0, 1)));

        this.is(0, basis.date.diff(d, 'year', new Date(2000, 5, 14)));
        this.is(1, basis.date.diff(d, 'year', new Date(2001, 0, 1)));
        this.is(2, basis.date.diff(d, 'year', new Date(2002, 0, 1)));
        this.is(2, basis.date.diff(d, 'year', new Date(2002, 11, 31)));
        this.is(102, basis.date.diff(d, 'year', new Date(2102, 11, 31)));
        this.is(-1, basis.date.diff(d, 'year', new Date(1999, 0, 1)));
        this.is(-2, basis.date.diff(d, 'year', new Date(1998, 0, 1)));
        this.is(-2, basis.date.diff(d, 'year', new Date(1998, 11, 31)));
        this.is(-102, basis.date.diff(d, 'year', new Date(1898, 11, 31)));

        this.is(0, basis.date.diff(d, 'month', new Date(2000, 0, 2)));
        this.is(1, basis.date.diff(d, 'month', new Date(2000, 1, 1)));
        this.is(1, basis.date.diff(d, 'month', new Date(2000, 1, 28)));
        this.is(17, basis.date.diff(d, 'month', new Date(2001, 5, 15)));
        this.is(125, basis.date.diff(d, 'month', new Date(2010, 5, 15)));
        this.is(-1, basis.date.diff(d, 'month', new Date(1999, 11, 31)));
        this.is(-1, basis.date.diff(d, 'month', new Date(1999, 11, 1)));
        this.is(-3, basis.date.diff(d, 'month', new Date(1999, 9, 15)));
        this.is(-123, basis.date.diff(d, 'month', new Date(1989, 9, 15)));

        this.is(0, basis.date.diff(d, 'day', new Date(2000, 0, 1, 23, 59, 59)));
        this.is(1, basis.date.diff(d, 'day', new Date(2000, 0, 2)));
        this.is(30, basis.date.diff(d, 'day', new Date(2000, 0, 31)));
        this.is(31, basis.date.diff(d, 'day', new Date(2000, 1, 1)));
        this.is(366, basis.date.diff(d, 'day', new Date(2001, 0, 1)));
        this.is(366 + 365, basis.date.diff(d, 'day', new Date(2002, 0, 1)));
        this.is(366 + 365 + 31, basis.date.diff(d, 'day', new Date(2002, 1, 1)));
        this.is(-1, basis.date.diff(d, 'day', new Date(1999, 11, 31, 23, 59, 59)));
        this.is(-31, basis.date.diff(d, 'day', new Date(1999, 11, 1)));
        this.is(-31 - 365, basis.date.diff(d, 'day', new Date(1998, 11, 1)));
        this.is(-31 - 365 - 16, basis.date.diff(d, 'day', new Date(1998, 10, 15)));

        this.is(0, basis.date.diff(d, 'hour', new Date(2000, 0, 1, 0, 59, 59)));
        this.is(1, basis.date.diff(d, 'hour', new Date(2000, 0, 1, 1, 0, 0)));
        this.is(1, basis.date.diff(d, 'hour', new Date(2000, 0, 1, 1, 59, 59)));
        this.is(24, basis.date.diff(d, 'hour', new Date(2000, 0, 2)));
        this.is(366 * 24, basis.date.diff(d, 'hour', new Date(2001, 0, 1, 0, 59, 59)));
        this.is(-1, basis.date.diff(d, 'hour', new Date(1999, 11, 31, 23, 59, 59)));
        this.is(-1 * 24 * 31, basis.date.diff(d, 'hour', new Date(1999, 11, 1, 0, 0, 0)));
        this.is(-(365 * 10 + 2 + 31) * 24, basis.date.diff(d, 'hour', new Date(1989, 11, 1, 0, 0, 0)));

        this.is(59, basis.date.diff(d, 'minute', new Date(2000, 0, 1, 0, 59, 59)));
        this.is(60, basis.date.diff(d, 'minute', new Date(2000, 0, 1, 1, 0, 0)));
        this.is(60 + 59, basis.date.diff(d, 'minute', new Date(2000, 0, 1, 1, 59, 59)));
        this.is(24 * 60, basis.date.diff(d, 'minute', new Date(2000, 0, 2)));
        this.is(366 * 24 * 60 + 59, basis.date.diff(d, 'minute', new Date(2001, 0, 1, 0, 59, 59)));
        this.is(-1, basis.date.diff(d, 'minute', new Date(1999, 11, 31, 23, 59, 59)));
        this.is(-1 * 24 * 31 * 60, basis.date.diff(d, 'minute', new Date(1999, 11, 1, 0, 0, 0)));
        this.is(-(365 * 10 + 2 + 31) * 24 * 60, basis.date.diff(d, 'minute', new Date(1989, 11, 1, 0, 0, 0)));

        this.is(59 * 60 + 59, basis.date.diff(d, 'second', new Date(2000, 0, 1, 0, 59, 59)));
        this.is(60 * 60, basis.date.diff(d, 'second', new Date(2000, 0, 1, 1, 0, 0)));
        this.is((60 + 59) * 60 + 59, basis.date.diff(d, 'second', new Date(2000, 0, 1, 1, 59, 59)));
        this.is(24 * 60 * 60, basis.date.diff(d, 'second', new Date(2000, 0, 2)));
        this.is((366 * 24 * 60 + 59) * 60 + 59, basis.date.diff(d, 'second', new Date(2001, 0, 1, 0, 59, 59)));
        this.is(-1, basis.date.diff(d, 'second', new Date(1999, 11, 31, 23, 59, 59)));
        this.is(-1 * 24 * 31 * 60 * 60, basis.date.diff(d, 'second', new Date(1999, 11, 1, 0, 0, 0)));
        this.is(-(365 * 10 + 2 + 31) * 24 * 60 * 60, basis.date.diff(d, 'second', new Date(1989, 11, 1, 0, 0, 0)));
      }
    },
    {
      name: 'toISODateString()',
      test: function(){
        // Date constructor creates date instances in local time, but toISOString returns in UTC timezone,
        // so we need convert date to UTC before get ISO string
        var d = toUTC(new Date(2007, 5, 20));
        this.is('2007-06-20', basis.date.toISODateString(d));

        var d = toUTC(new Date(2007, 0, 1));
        this.is('2007-01-01', basis.date.toISODateString(d));
      }
    },
    {
      name: 'toISOString()',
      test: function(){
        // Date constructor creates date instances in local time, but toISOString returns in UTC timezone,
        // so we need convert date to UTC before get ISO string
        this.is('2007-01-01T00:00:00.000Z', basis.date.toISOString(toUTC(new Date(2007, 0, 1))));
        this.is('2007-01-01T01:02:03.000Z', basis.date.toISOString(toUTC(new Date(2007, 0, 1, 1, 2, 3))));
        this.is('2007-01-01T01:02:03.123Z', basis.date.toISOString(toUTC(new Date(2007, 0, 1, 1, 2, 3, 123))));
        this.is('2008-01-01T01:02:03.123Z', basis.date.toISOString(toUTC(new Date(2007, 12, 1, 1, 2, 3, 123))));

        this.is('2007-01-01T00:00:00.000Z', toUTC(new Date(2007, 0, 1)).toISOString());
        this.is('2007-01-01T01:02:03.000Z', toUTC(new Date(2007, 0, 1, 1, 2, 3)).toISOString());
        this.is('2007-01-01T01:02:03.123Z', toUTC(new Date(2007, 0, 1, 1, 2, 3, 123)).toISOString());
        this.is('2008-01-01T01:02:03.123Z', toUTC(new Date(2007, 12, 1, 1, 2, 3, 123)).toISOString());
      }
    },
    {
      name: 'fromISOString()',
      test: function(){
        //this.is(toUTC(new Date(2007, 0, 1)), new Date('2007-01-01'));
        this.is(toUTC(new Date(2007, 0, 1)), basis.date.fromISOString('2007-01-01'));
        this.is(toUTC(new Date(2007, 0, 1)), basis.date.fromISOString('2007-01-01T00:00:00'));
        this.is(toUTC(new Date(2007, 0, 1)), basis.date.fromISOString('2007-01-01T00:00:00.000'));
        this.is(toUTC(new Date(2007, 0, 1)), basis.date.fromISOString('2007-01-01 00:00:00'));
        this.is(toUTC(new Date(2007, 0, 1)), basis.date.fromISOString('2007-01-01 00:00:00.000'));
        this.is(toUTC(new Date(2007, 0, 1, 1, 2, 3)), basis.date.fromISOString('2007-01-01 01:02:03'));
        this.is(toUTC(new Date(2007, 0, 1, 1, 2, 3)), basis.date.fromISOString('2007-1-1 1:2:3'));
        this.is(toUTC(new Date(7, 0, 1, 1, 2, 3)), basis.date.fromISOString('07-1-1 1:2:3'));
        this.is(toUTC(new Date(2007, 0, 1, 23, 59, 59)), basis.date.fromISOString('2007-01-01 23:59:59'));
      }
    },
    {
      name: 'fromISOString() <-> toISOString()',
      test: function(){
        this.is('2007-01-01', basis.date.toISODateString(basis.date.fromISOString('2007-01-01')));
        this.is('2007-01-01T01:02:03.123Z', basis.date.toISOString(basis.date.fromISOString('2007-01-01T01:02:03.123Z')));

        var d = new Date();
        var isoStr = basis.date.toISOString(d);
        var d2 = new Date();
        d2.setHours(d2.getHours() + 1);
        this.is(false, d2 - d == 0); // should be false, it diff date time

        var d2 = basis.date.fromISOString(isoStr);
        this.is(isoStr, d2.toISOString());
        this.is(true, d2 - d == 0);
      }
    }
  ]
};
