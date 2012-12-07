
 /**
  * @namespace basis.date
  */

  var namespace = this.path;


  //
  // import names
  //

  var getter = Function.getter;


  //
  // main part
  //

  // CONST
  var MONTH_DAY_COUNT = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var monthNumToAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  var dayNumToAbbr = ["mon", "tue", "wed", "thr", "fri", "sat", "sun"];

  var DIFF_BASE = {
    day: 24 * 3600 * 1000,
    hour: 3600 * 1000,
    minute: 60 * 1000,
    second: 1000
  };

  var PART_ERROR = 'Unknown date part: ';
  var DATE_PART = 'year month day hour minute second millisecond'.qw();

  var GETTER = {};
  var SETTER = {};

  Object.iterate({
    year: 'FullYear',
    month: 'Month',
    day: 'Date',
    hour: 'Hours',
    minute: 'Minutes',
    second: 'Seconds',
    millisecond: 'Milliseconds'
  }, function(key, value){
    GETTER[key] = getter('get' + value + '()');
    SETTER[key] = new Function('d,v', 'd.set' + value + '(v)');
  });

  var FORMAT = {
    y: getter('getFullYear().toString().substr(2)'),               // %y - year in YY
    Y: getter('getFullYear()'),                                    // %Y - year in YYYY
    d: getter('getDate()'),                                        // %d - day (1..31)
    D: getter('getDate()', '{0:02}'),                              // %D - day (01..31)
    m: getter('getMonth() + 1'),                                   // %m - month (1..12)
    M: getter('getMonth() + 1', '{0:02}'),                         // %M - month (01..12)
    h: getter('getHours()'),                                       // %h - hours (0..23)
    H: getter('getHours()', '{0:02}'),                             // %H - hours (00..23)
    i: getter('getHours() % 12 || 12', '{0:02}'),                  // %i - hours (01..12)
    p: getter('getHours() > 12', { 'true': 'pm', 'false': 'am' }), // %p - am or pm
    P: getter('getHours() > 12', { 'true': 'PM', 'false': 'AM' }), // %p - AM or PM
    I: getter('getMinutes()', '{0:02}'),                           // %I - minutes (00..59)
    s: getter('getSeconds()'),                                     // %s - seconds (0..59)
    S: getter('getSeconds()', '{0:02}'),                           // %S - seconds (00..59)
    z: getter('getMilliseconds()'),                                // %z - milliseconds (0..999)
    Z: getter('getMilliseconds()', '{0:03}')                       // %Z - milliseconds (000..999)
  };

  var reISOFormat = /^(\d{1,4})-(\d\d?)-(\d\d?)(?:[T ](\d\d?):(\d\d?):(\d\d?)(?:\.(\d{1,3}))?)?$/;
  var reFormat = /%([ymdhiszp])/ig;
  var reIsoStringSplit = /\D/;

  // functions

  function isLeapYear(year){
    return !!(!(year % 400) || ((year % 100) && !(year % 4)));
  }

  function getMonthDayCount(month, year){
    return month == 1 ? 28 + isLeapYear(year) : MONTH_DAY_COUNT[month];
  }

  function dateFormat(date, format){
    return format.replace(reFormat, function(m, part){
      return FORMAT[part](date);
    });
  }

  // Date prototype extension

  Object.extend(Date.prototype, {
    isLeapYear: function(){
      return isLeapYear(this.getFullYear());
    },
    getMonthDayCount: function(){
      return getMonthDayCount(this.getMonth(), this.getFullYear());
    },
    add: function(part, value){
      var getter = GETTER[part];

      if (!getter)
        throw new Error(PART_ERROR + part);

      var day;
      if (part == 'year' || part == 'month')
      {
        day = this.getDate();
        if (day > 28)
          this.setDate(1);
      }

      SETTER[part](this, getter(this) + value);

      if (day > 28)
      {
        var monthDayCount = this.getMonthDayCount();
        /*if (day > monthDayCount)
          this.setDate(monthDayCount);*/
        this.setDate(Math.min(day, monthDayCount));
      }

      return this;
    },
    diff: function(part, date){
      if (part == 'year' || part == 'month')
      {
        var dir = Number(this) - Number(date) > 0 ? -1 : 1;
        var left = dir > 0 ? this : date;
        var right = dir > 0 ? date : this;

        var ly = left.getFullYear();
        var ry = right.getFullYear();
        var ydiff = ry - ly;

        if (part == 'year')
          return dir * ydiff;

        var lm = left.getMonth();
        var rm = right.getMonth();
        var mdiff = ydiff ? ((ydiff > 1 ? (ydiff - 1) * 12 : 0) + (12 - 1 - lm) + (rm + 1)) : rm - lm;

        return dir * mdiff;
      }
      else
      {
        var diff = Math.floor((date - this)/DIFF_BASE[part]);
        return diff + Number(GETTER[part](new Date(date - diff * DIFF_BASE[part])) - GETTER[part](this) != 0);
      }
    },
    set: function(part, value){
      var setter = SETTER[part];

      if (!setter)
        throw new Error(PART_ERROR + part);

      var day;
      if (part == 'year' || part == 'month')
      {
        day = this.getDate();
        if (day > 28)
          this.setDate(1);
      }

      setter(this, value);

      if (day > 28)
      {
        var monthDayCount = this.getMonthDayCount();
        //if (day > monthDayCount)
        this.setDate(Math.min(day, monthDayCount));
      }

      return this;
    },
    get: function(part){
      if (GETTER[part])
        return GETTER[part](this);

      throw new Error(PART_ERROR + part);
    },
    toISODateString: function(){
      return dateFormat(this, '%Y-%M-%D');
    },
    toISOTimeString: function(){
      return dateFormat(this, '%H:%I:%S.%Z');
    },
    fromDate: function(date){
      if (date instanceof Date)
      {
        this.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        this.setTime(date.getTime());
      }

      return this;
    },
    toFormat: function(format){
      return dateFormat(this, format);
    }
  });

  var _native_toISOString = Date.prototype.toISOString;
  if (_native_toISOString && (new Date).toISOString().match(/Z/i))
  {
    Date.prototype.toISOString = function(){
      return _native_toISOString.call(this).replace(/Z/i, '');
    };
  }

  Object.complete(Date.prototype, {
    // implemented in ECMAScript5
    // TODO: check for time zone
    toISOString: function(){
      return this.toISODateString() + 'T' + this.toISOTimeString();
    },
    fromISOString: function(datetime){
      var m = String(datetime).match(reISOFormat);
      if (!m)
        throw new Error('Value of date isn\'t in ISO format: ' + datetime);

      m[2] -= 1; // substract 1 for monthes
      for (var i = 0, part; part = DATE_PART[i]; i++)
        this.set(part, m[i + 1] || 0);

      return this;
    }
  });

  // extend Date

  function fastDateParse(y, m, d, h, i, s, ms){
    return new Date(y, m - 1, d, h || 0, i || 0, s || 0, ms || 0);
  }
  function fromISOString(isoString){
    return isoString ? fastDateParse.apply(null, String(isoString).split(reIsoStringSplit)) : null;
  }

  Date.fromISOString = function(){
    ;;; if (typeof console != 'undefined') console.warn('Date.fromISOString is deprecated, use basis.date.fromISOString instead');
    return (Date.fromISOString = fromISOString).apply(this, arguments);
  };


  //
  // export names
  //

  module.exports = {
    monthNumToAbbr: monthNumToAbbr,
    dayNumToAbbr: dayNumToAbbr,

    isLeapYear: isLeapYear,
    getMonthDayCount: getMonthDayCount,

    format: dateFormat,
    fromISOString: fromISOString
  };
