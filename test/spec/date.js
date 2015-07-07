module.exports = {
  name: 'basis.date',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var isLeapYear = basis.require('basis.date').isLeapYear;
    var getMonthDayCount = basis.require('basis.date').getMonthDayCount;
    var diff = basis.require('basis.date').diff;
    var fromISOString = basis.require('basis.date').fromISOString;
    var toISOString = basis.require('basis.date').toISOString;
    var toISODateString = basis.require('basis.date').toISODateString;

    function toUTC(date){
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return date;
    }
  },

  test: [
    {
      name: 'isLeapYear()',
      test: function(){
        assert(isLeapYear(new Date(2004, 1)) === true);
        assert(isLeapYear(new Date(2000, 1)) === true);
        assert(isLeapYear(new Date(1996, 1)) === true);
        assert(isLeapYear(new Date(1600, 1)) === true);
        assert(isLeapYear(new Date(2400, 1)) === true);

        assert(isLeapYear(new Date(1995, 1)) === false);
        assert(isLeapYear(new Date(1997, 1)) === false);
        assert(isLeapYear(new Date(1998, 1)) === false);
        assert(isLeapYear(new Date(1999, 1)) === false);
        assert(isLeapYear(new Date(1900, 1)) === false);
        assert(isLeapYear(new Date(2100, 1)) === false);
        assert(isLeapYear(new Date(2500, 1)) === false);
      }
    },
    {
      name: 'getMonthDayCount()',
      test: function(){
        assert(getMonthDayCount(new Date(2007, 0)) === 31);
        assert(getMonthDayCount(new Date(2007, 1)) === 28);
        assert(getMonthDayCount(new Date(2007, 2)) === 31);
        assert(getMonthDayCount(new Date(2007, 3)) === 30);
        assert(getMonthDayCount(new Date(2007, 4)) === 31);
        assert(getMonthDayCount(new Date(2007, 5)) === 30);
        assert(getMonthDayCount(new Date(2007, 6)) === 31);
        assert(getMonthDayCount(new Date(2007, 7)) === 31);
        assert(getMonthDayCount(new Date(2007, 8)) === 30);
        assert(getMonthDayCount(new Date(2007, 9)) === 31);
        assert(getMonthDayCount(new Date(2007, 10)) === 30);
        assert(getMonthDayCount(new Date(2007, 11)) === 31);
        assert(getMonthDayCount(new Date(2008, 1)) === 29);
        assert(getMonthDayCount(new Date(2000, 1)) === 29);
        assert(getMonthDayCount(new Date(2100, 1)) === 28);
        assert(getMonthDayCount(new Date(2400, 1)) === 29);
      }
    },
    {
      name: 'diff()',
      test: function(){
        var d = new Date(2000, 0, 1);
        assert(diff(d, 'year',   new Date(2000, 0, 1)) === 0);
        assert(diff(d, 'month',  new Date(2000, 0, 1)) === 0);
        assert(diff(d, 'day',    new Date(2000, 0, 1)) === 0);
        assert(diff(d, 'hour',   new Date(2000, 0, 1)) === 0);
        assert(diff(d, 'minute', new Date(2000, 0, 1)) === 0);
        assert(diff(d, 'second', new Date(2000, 0, 1)) === 0);

        assert(diff(d, 'year', new Date(2000, 5, 14)) === 0);
        assert(diff(d, 'year', new Date(2001, 0, 1)) === 1);
        assert(diff(d, 'year', new Date(2002, 0, 1)) === 2);
        assert(diff(d, 'year', new Date(2002, 11, 31)) === 2);
        assert(diff(d, 'year', new Date(2102, 11, 31)) === 102);
        assert(diff(d, 'year', new Date(1999, 0, 1)) === -1);
        assert(diff(d, 'year', new Date(1998, 0, 1)) === -2);
        assert(diff(d, 'year', new Date(1998, 11, 31)) === -2);
        assert(diff(d, 'year', new Date(1898, 11, 31)) === -102);

        assert(diff(d, 'month', new Date(2000, 0, 2)) === 0);
        assert(diff(d, 'month', new Date(2000, 1, 1)) === 1);
        assert(diff(d, 'month', new Date(2000, 1, 28)) === 1);
        assert(diff(d, 'month', new Date(2001, 5, 15)) === 17);
        assert(diff(d, 'month', new Date(2010, 5, 15)) === 125);
        assert(diff(d, 'month', new Date(1999, 11, 31)) === -1);
        assert(diff(d, 'month', new Date(1999, 11, 1)) === -1);
        assert(diff(d, 'month', new Date(1999, 9, 15)) === -3);
        assert(diff(d, 'month', new Date(1989, 9, 15)) === -123);

        assert(diff(d, 'day', new Date(2000, 0, 1, 23, 59, 59)) === 0);
        assert(diff(d, 'day', new Date(2000, 0, 2)) === 1);
        assert(diff(d, 'day', new Date(2000, 0, 31)) === 30);
        assert(diff(d, 'day', new Date(2000, 1, 1)) === 31);
        assert(diff(d, 'day', new Date(2001, 0, 1)) === 366);
        assert(diff(d, 'day', new Date(2002, 0, 1)) === 366 + 365);
        assert(diff(d, 'day', new Date(2002, 1, 1)) === 366 + 365 + 31);
        assert(diff(d, 'day', new Date(1999, 11, 31, 23, 59, 59)) === -1);
        assert(diff(d, 'day', new Date(1999, 11, 1)) === -31);
        assert(diff(d, 'day', new Date(1998, 11, 1)) === -31 - 365);
        assert(diff(d, 'day', new Date(1998, 10, 15)) === -31 - 365 - 16);

        assert(diff(d, 'hour', new Date(2000, 0, 1, 0, 59, 59)) === 0);
        assert(diff(d, 'hour', new Date(2000, 0, 1, 1, 0, 0)) === 1);
        assert(diff(d, 'hour', new Date(2000, 0, 1, 1, 59, 59)) === 1);
        assert(diff(d, 'hour', new Date(2000, 0, 2)) === 24);
        assert(diff(d, 'hour', new Date(2001, 0, 1, 0, 59, 59)) === 366 * 24);
        assert(diff(d, 'hour', new Date(1999, 11, 31, 23, 59, 59)) === -1);
        assert(diff(d, 'hour', new Date(1999, 11, 1, 0, 0, 0)) === -1 * 24 * 31);
        assert(diff(d, 'hour', new Date(1989, 11, 1, 0, 0, 0)) === -(365 * 10 + 2 + 31) * 24);

        assert(diff(d, 'minute', new Date(2000, 0, 1, 0, 59, 59)) === 59);
        assert(diff(d, 'minute', new Date(2000, 0, 1, 1, 0, 0)) === 60);
        assert(diff(d, 'minute', new Date(2000, 0, 1, 1, 59, 59)) === 60 + 59);
        assert(diff(d, 'minute', new Date(2000, 0, 2)) === 24 * 60);
        assert(diff(d, 'minute', new Date(2001, 0, 1, 0, 59, 59)) === 366 * 24 * 60 + 59);
        assert(diff(d, 'minute', new Date(1999, 11, 31, 23, 59, 59)) === -1);
        assert(diff(d, 'minute', new Date(1999, 11, 1, 0, 0, 0)) === -1 * 24 * 31 * 60);
        assert(diff(d, 'minute', new Date(1989, 11, 1, 0, 0, 0)) === -(365 * 10 + 2 + 31) * 24 * 60);

        assert(diff(d, 'second', new Date(2000, 0, 1, 0, 59, 59)) === 59 * 60 + 59);
        assert(diff(d, 'second', new Date(2000, 0, 1, 1, 0, 0)) === 60 * 60);
        assert(diff(d, 'second', new Date(2000, 0, 1, 1, 59, 59)) === (60 + 59) * 60 + 59);
        assert(diff(d, 'second', new Date(2000, 0, 2)) === 24 * 60 * 60);
        assert(diff(d, 'second', new Date(2001, 0, 1, 0, 59, 59)) === (366 * 24 * 60 + 59) * 60 + 59);
        assert(diff(d, 'second', new Date(1999, 11, 31, 23, 59, 59)) === -1);
        assert(diff(d, 'second', new Date(1999, 11, 1, 0, 0, 0)) === -1 * 24 * 31 * 60 * 60);
        assert(diff(d, 'second', new Date(1989, 11, 1, 0, 0, 0)) === -(365 * 10 + 2 + 31) * 24 * 60 * 60);
      }
    },
    {
      name: 'toISODateString()',
      test: function(){
        // Date constructor creates date instances in local time, but toISOString returns in UTC timezone,
        // so we need convert date to UTC before get ISO string
        var d = toUTC(new Date(2007, 5, 20));
        assert('2007-06-20', toISODateString(d));

        var d = toUTC(new Date(2007, 0, 1));
        assert('2007-01-01', toISODateString(d));
      }
    },
    {
      name: 'toISOString()',
      test: function(){
        // Date constructor creates date instances in local time, but toISOString returns in UTC timezone,
        // so we need convert date to UTC before get ISO string
        assert(toISOString(toUTC(new Date(2007, 0, 1))) === '2007-01-01T00:00:00.000Z');
        assert(toISOString(toUTC(new Date(2007, 0, 1, 1, 2, 3))) === '2007-01-01T01:02:03.000Z');
        assert(toISOString(toUTC(new Date(2007, 0, 1, 1, 2, 3, 123))) === '2007-01-01T01:02:03.123Z');
        assert(toISOString(toUTC(new Date(2007, 12, 1, 1, 2, 3, 123))) === '2008-01-01T01:02:03.123Z');

        assert(toUTC(new Date(2007, 0, 1)).toISOString() === '2007-01-01T00:00:00.000Z');
        assert(toUTC(new Date(2007, 0, 1, 1, 2, 3)).toISOString() === '2007-01-01T01:02:03.000Z');
        assert(toUTC(new Date(2007, 0, 1, 1, 2, 3, 123)).toISOString() === '2007-01-01T01:02:03.123Z');
        assert(toUTC(new Date(2007, 12, 1, 1, 2, 3, 123)).toISOString() === '2008-01-01T01:02:03.123Z');
      }
    },
    {
      name: 'fromISOString()',
      test: function(){
        //assert(toUTC(new Date(2007, 0, 1)), new Date('2007-01-01'));
        assert(toUTC(new Date(2007, 0, 1)), fromISOString('2007-01-01'));
        assert(toUTC(new Date(2007, 0, 1)), fromISOString('2007-01-01T00:00:00'));
        assert(toUTC(new Date(2007, 0, 1)), fromISOString('2007-01-01T00:00:00.000'));
        assert(toUTC(new Date(2007, 0, 1)), fromISOString('2007-01-01 00:00:00'));
        assert(toUTC(new Date(2007, 0, 1)), fromISOString('2007-01-01 00:00:00.000'));
        assert(toUTC(new Date(2007, 0, 1, 1, 2, 3)), fromISOString('2007-01-01 01:02:03'));
        assert(toUTC(new Date(2007, 0, 1, 1, 2, 3)), fromISOString('2007-1-1 1:2:3'));
        assert(toUTC(new Date(7, 0, 1, 1, 2, 3)), fromISOString('07-1-1 1:2:3'));
        assert(toUTC(new Date(2007, 0, 1, 23, 59, 59)), fromISOString('2007-01-01 23:59:59Z'));
        assert(toUTC(new Date(2007, 0, 1, 22, 59, 59)), fromISOString('2007-01-01 23:59:59+01:00'));
        assert(toUTC(new Date(2007, 0, 2, 0, 59, 59)), fromISOString('2007-01-01 23:59:59-01:00'));
      }
    },
    {
      name: 'fromISOString() <-> toISOString()',
      test: function(){
        assert(toISODateString(fromISOString('2007-01-01')) === '2007-01-01');
        assert(toISOString(fromISOString('2007-01-01T01:02:03.123Z')) === '2007-01-01T01:02:03.123Z');

        var d = new Date();
        var isoStr = toISOString(d);
        var d2 = new Date();
        d2.setHours(d2.getHours() + 1);
        assert(d2 - d !== 0); // should be false, it diff date time

        var d2 = fromISOString(isoStr);
        assert(isoStr, d2.toISOString());
        assert(d2 - d === 0);
      }
    }
  ]
};
