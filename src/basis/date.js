
 /**
  * @namespace basis.date
  */

  var namespace = this.path;


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
      return date['get' + name]()
    };
    SETTER[key] = function(date, value){
      return date['set' + name](value);
    };
  });

  function lead2(num){
    return num < 10 ? '0' + num : num;
  }

  function lead3(num){
    return num < 100 ? '0' + lead2(num) : num;
  }  

  var reISOFormat = /^(\d{1,4})-(\d\d?)-(\d\d?)(?:[T ](\d\d?):(\d\d?):(\d\d?)(?:\.(\d+))?)?$/;
  var reFormat = /%([yYdDmMhHipPIsSzZ])/g;
  var reIsoStringSplit = /\D/;
  var reIsoTimezoneDesignator = /(.{10,})([\-\+]\d{1,2}):?(\d{1,2})?$/;

  // functions

  function isLeapYear(year){
    return !!(!(year % 400) || ((year % 100) && !(year % 4)));
  }

  function getMonthDayCount(month, year){
    return month == 1 ? 28 + isLeapYear(year) : MONTH_DAY_COUNT[month];
  }

  function dateFormat(date, format, useUTC){
    var local = function(m, part){
      switch (part)
      {
        case 'y': return String(date.getFullYear()).substr(2);      // %y - year in YY
        case 'Y': return date.getFullYear();                        // %Y - year in YYYY
        case 'd': return date.getDate();                            // %d - day (1..31)
        case 'D': return lead2(date.getDate());                     // %D - day (01..31)
        case 'm': return date.getMonth() + 1;                       // %m - month (1..12)
        case 'M': return lead2(date.getMonth() + 1);                // %M - month (01..12)
        case 'h': return date.getHours();                           // %h - hours (0..23)
        case 'H': return lead2(date.getHours());                    // %H - hours (00..23)
        case 'i': return lead2(date.getHours() % 12 || 12);         // %i - hours (01..12)
        case 'p': return date.getHours() > 12 ? 'pm' : 'am';        // %p - am or pm
        case 'P': return date.getHours() > 12 ? 'PM' : 'AM';        // %p - AM or PM
        case 'I': return lead2(date.getMinutes());                  // %I - minutes (00..59)
        case 's': return date.getSeconds();                         // %s - seconds (0..59)
        case 'S': return lead2(date.getSeconds());                  // %S - seconds (00..59)
        case 'z': return date.getMilliseconds();                    // %z - milliseconds (0..999)
        case 'Z': return lead3(date.getMilliseconds());             // %Z - milliseconds (000..999)
      }
    };
    var utc = function(m, part){
      switch (part)
      {
        case 'y': return String(date.getUTCFullYear()).substr(2);      // %y - year in YY
        case 'Y': return date.getUTCFullYear();                        // %Y - year in YYYY
        case 'd': return date.getUTCDate();                            // %d - day (1..31)
        case 'D': return lead2(date.getUTCDate());                     // %D - day (01..31)
        case 'm': return date.getUTCMonth() + 1;                       // %m - month (1..12)
        case 'M': return lead2(date.getUTCMonth() + 1);                // %M - month (01..12)
        case 'h': return date.getUTCHours();                           // %h - hours (0..23)
        case 'H': return lead2(date.getUTCHours());                    // %H - hours (00..23)
        case 'i': return lead2(date.getUTCHours() % 12 || 12);         // %i - hours (01..12)
        case 'p': return date.getUTCHours() > 12 ? 'pm' : 'am';        // %p - am or pm
        case 'P': return date.getUTCHours() > 12 ? 'PM' : 'AM';        // %p - AM or PM
        case 'I': return lead2(date.getUTCMinutes());                  // %I - minutes (00..59)
        case 's': return date.getUTCSeconds();                         // %s - seconds (0..59)
        case 'S': return lead2(date.getUTCSeconds());                  // %S - seconds (00..59)
        case 'z': return date.getUTCMilliseconds();                    // %z - milliseconds (0..999)
        case 'Z': return lead3(date.getUTCMilliseconds());             // %Z - milliseconds (000..999)
      }
    }

    return format.replace(reFormat, useUTC ? utc : local);
  }

  // Date prototype extension

  basis.object.extend(Date.prototype, {
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
      return dateFormat(this, '%Y-%M-%D', true);
    },
    toISOTimeString: function(){
      return dateFormat(this, '%H:%I:%S.%Z', true);
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

  basis.object.complete(Date.prototype, {
    // implemented in ECMAScript5
    // TODO: check for time zone
    toISOString: function(){
      return this.toISODateString() + 'T' + this.toISOTimeString() + 'Z';
    },
    fromISOString: function(isoDateString){
      return this.fromDate(fromISOString(isoDateString));
    }
  });

  // extend Date
  var fromISOString = (function(){
    function fastDateParse(y, m, d, h, i, s, ms){
      return new Date(y, m - 1, d, h || 0, (i || 0) - tz, s || 0, ms ? ms.substr(0, 3) : 0);
    }

    var tzoffset = (new Date).getTimezoneOffset();
    var tz;

    return function(isoDateString){
      return fastDateParse.apply(
        tz = tzoffset,
        String(isoDateString || '')
          .replace(reIsoTimezoneDesignator, function(m, pre, h, i){
            tz += i ? h * 60 + i * 1 : h * 1;
            return pre;
          })
          .split(reIsoStringSplit)
      );
    }
  })();


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
