
 /**
  * @namespace basis.date
  */

  var namespace = this.path;


  //
  // main part
  //

  var ISO_FORMAT = '%Y-%M-%D' + 'T' + '%H:%I:%S.%Z' + 'Z';
  var reISOFormat = /^(\d{1,4})-(\d\d?)-(\d\d?)(?:[T ](\d\d?):(\d\d?):(\d\d?)(?:\.(\d+))?)?$/;
  var reFormat = /%([yYdDmMhHipPIsSzZ])/g;
  var reIsoStringSplit = /\D/;
  var reIsoTimezoneDesignator = /(.{10,})([\-\+]\d{1,2}):?(\d{1,2})?$/;

  var MONTH_DAY_COUNT = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var monthNumToAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var dayNumToAbbr = ['mon', 'tue', 'wed', 'thr', 'fri', 'sat', 'sun'];

  var DIFF_BASE = {
    day: 24 * 3600 * 1000,
    hour: 3600 * 1000,
    minute: 60 * 1000,
    second: 1000
  };

  var DATE_PART = 'year month day hour minute second millisecond'.split(' ');

  var GETTER = {};
  var SETTER = {};

  basis.object.iterate({
    year: 'FullYear',
    month: 'Month',
    day: 'Date',
    hour: 'Hours',
    minute: 'Minutes',
    second: 'Seconds',
    millisecond: 'Milliseconds'
  }, function(key, name){
    GETTER[key] = function(date){
      return date['get' + name]();
    };
    SETTER[key] = function(date, value){
      return date['set' + name](value);
    };
  });


  // functions

  function lead2(num){
    return num < 10 ? '0' + num : num;
  }

  function lead3(num){
    return num < 100 ? '0' + lead2(num) : num;
  }

  function isLeapYear(value){
    if (value instanceof Date)
      value = value.getFullYear();

    return !!(!(value % 400) || ((value % 100) && !(value % 4)));
  }

  function getMonthDayCount(dateOrMonth, year){
    var month;

    if (dateOrMonth instanceof Date)
    {
      year = dateOrMonth.getFullYear();
      month = dateOrMonth.getMonth();
    }
    else
    {
      month = dateOrMonth - 1;
    }

    return month == 1 ? 28 + isLeapYear(year) : MONTH_DAY_COUNT[month];
  }

  function dateFormat(date, format, useUTC){
    var result = '';

    for (var i = 0, chr, val; i < format.length; i++)
    {
      chr = format.charAt(i);
      if (chr == '%')
        switch (chr = format.charAt(++i))
        {
          case 'y': // %y - year as YY
            result += String(useUTC ? date.getUTCFullYear() : date.getFullYear()).substr(2);
            break;

          case 'Y': // %Y - year as YYYY
            result += useUTC ? date.getUTCFullYear() : date.getFullYear();
            break;

          case 'd': // %d - day (1..31)
            result += useUTC ? date.getUTCDate() : date.getDate();
            break;

          case 'D': // %D - day (01..31)
            result += lead2(useUTC ? date.getUTCDate() : date.getDate());
            break;

          case 'm': // %m - month (1..12)
            result += useUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1;
            break;

          case 'M': // %M - month (01..12)
            result += lead2(useUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1);
            break;

          case 'h': // %h - hours (0..23)
            result += useUTC ? date.getUTCHours() : date.getHours();
            break;

          case 'H': // %H - hours (00..23)
            result += lead2(useUTC ? date.getUTCHours() : date.getHours());
            break;

          case 'i': // %i - hours (01..12)
            result += lead2((useUTC ? date.getUTCHours() : date.getHours()) % 12 || 12);
            break;

          case 'p': // %p - am or pm
            result += (useUTC ? date.getUTCHours() : date.getHours()) > 12 ? 'pm' : 'am';
            break;

          case 'P': // %p - AM or PM
            result += (useUTC ? date.getUTCHours() : date.getHours()) > 12 ? 'PM' : 'AM';
            break;

          case 'I': // %I - minutes (00..59)
            result += lead2(useUTC ? date.getUTCMinutes() : date.getMinutes());
            break;

          case 's': // %s - seconds (0..59)
            result += useUTC ? date.getUTCSeconds() : date.getSeconds();
            break;

          case 'S': // %S - seconds (00..59)
            result += lead2(useUTC ? date.getUTCSeconds() : date.getSeconds());
            break;

          case 'z': // %z - milliseconds (0..999)
            result += useUTC ? date.getUTCMilliseconds() : date.getMilliseconds();
            break;

          case 'Z': // %Z - milliseconds (000..999)
            result += lead3(useUTC ? date.getUTCMilliseconds() : date.getMilliseconds());
            break;

          case '%':
            result += '%';
            i--;
            break;

          default:
            result += '%' + chr;
        }
      else
        result += chr;
    }

    return result;
  }

  var fromISOString = (function(){
    function fastDateParse(y, m, d, h, i, s, ms){
      var date = new Date(y, m - 1, d, h || 0, 0, s || 0, ms ? ms.substr(0, 3) : 0);
      date.setMinutes((i || 0) - tz - date.getTimezoneOffset());
      return date;
    }

    var tz;
    return function(isoDateString){
      tz = 0;
      return fastDateParse.apply(
        null,
        String(isoDateString || '')
          .replace(reIsoTimezoneDesignator, function(m, pre, h, i){
            tz = i ? h * 60 + i * 1 : h * 1;
            return pre;
          })
          .split(reIsoStringSplit)
      );
    };
  })();

  function toISOString(this_){
    return dateFormat(this_, ISO_FORMAT, true);
  }

  function toISODateString(this_){
    return dateFormat(this_, '%Y-%M-%D', true);
  }

  function toISOTimeString(this_){
    return dateFormat(this_, '%H:%I:%S.%Z', true);
  }


  //
  // Date functions
  //

  function add(this_, part, value){
    var getter = GETTER[part];

    if (!getter)
    {
      /** @cut */ basis.dev.warn('basis.date.add: Unknown date part `' + part + '`, date not changed');
      return this_;
    }

    var day;
    if (part == 'year' || part == 'month')
    {
      day = this_.getDate();
      if (day > 28)
        this_.setDate(1);
    }

    SETTER[part](this_, getter(this_) + value);

    if (day > 28)
    {
      var monthDayCount = getMonthDayCount(this_);
      this_.setDate(Math.min(day, monthDayCount));
    }

    return this_;
  }

  function diff(this_, part, date){
    if (part == 'year' || part == 'month')
    {
      var dir = Number(this_) - Number(date) > 0 ? -1 : 1;
      var left = dir > 0 ? this_ : date;
      var right = dir > 0 ? date : this_;

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
      var diff = Math.floor((date - this_) / DIFF_BASE[part]);
      return diff + Number(GETTER[part](new Date(date - diff * DIFF_BASE[part])) - GETTER[part](this_) != 0);
    }
  }

  function set(this_, part, value){
    var setter = SETTER[part];

    if (!setter)
    {
      /** @cut */ basis.dev.warn('basis.date.set: Unknown date part `' + part + '`, date not changed');
      return this_;
    }

    var day;
    if (part == 'year' || part == 'month')
    {
      day = this_.getDate();
      if (day > 28)
        this_.setDate(1);
    }

    setter(this_, value);

    if (day > 28)
    {
      var monthDayCount = getMonthDayCount(this_);
      this_.setDate(Math.min(day, monthDayCount));
    }

    return this_;
  }

  function get(this_, part){
    if (GETTER[part])
      return GETTER[part](this_);

    /** @cut */ basis.dev.warn('basis.date.get: Unknown date part `' + part + '`');
  }

  function fromDate(this_, date){
    if (date instanceof Date)
    {
      this_.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      this_.setTime(date.getTime());
    }

    return this_;
  }

  //
  // Complete Date prototype by ECMAScript5 methods
  //

  basis.object.complete(Date.prototype, {
    // TODO: check for time zone
    toISOString: function(){
      return toISOString(this);
    },
    toJSON: function(){
      return this.toISOString();
    }
  });


  //
  // export names
  //

  module.exports = {
    monthNumToAbbr: monthNumToAbbr,
    dayNumToAbbr: dayNumToAbbr,

    fromISOString: fromISOString,

    format: dateFormat,
    toISOString: toISOString,
    toISODateString: toISODateString,
    toISOTimeString: toISOTimeString,

    isLeapYear: isLeapYear,
    getMonthDayCount: getMonthDayCount,
    add: add,
    set: set,
    get: get,
    diff: diff,
    fromDate: fromDate
  };
