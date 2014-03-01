
  var document = global.document;
  var computedStyle;

  if ('getComputedStyle' in global)
  {
    // Gecko's getComputedStyle returns computed values for top/bottom/left/right/height/width, but
    // according to W3C spec getComputedStyle should returns used values.
    //
    // https://developer.mozilla.org/en/DOM/window.getComputedStyle:
    //   The returned object actually represents the CSS 2.1 used values, not the computed values.
    //   Originally, CSS 2.0 defined the computed values to be the "ready to be used" values of properties
    //   after cascading and inheritance, but CSS 2.1 redefined computed values as pre-layout, and used
    //   values as post-layout. The getComputedStyle function returns the old meaning of computed values,
    //   now called used values. There is no DOM API to get CSS 2.1 computed values.
    //
    // This workaround helps fetch used values instead of computed.
    var GETCOMPUTEDSTYLE_BUGGY = {
      top: true,
      bottom: true,
      left: true,
      right: true,
      height: true,
      width: true
    };

    // test for computedStyle is buggy, run once on first computedStyle invoke
    var testForBuggyProperties = basis.fn.runOnce(function(){
      var testElement = document.createElement('div');
      testElement.setAttribute('style', 'position:absolute;top:auto!important');
      basis.doc.body.add(testElement);

      if (global.getComputedStyle(testElement).top == 'auto')
        GETCOMPUTEDSTYLE_BUGGY = {};

      basis.doc.remove(testElement);
    });

    // getComputedStyle function using W3C spec
    computedStyle = function(element, styleProp){
      var style = global.getComputedStyle(element);
      var res;

      if (style)
      {
        if (styleProp in GETCOMPUTEDSTYLE_BUGGY)
          testForBuggyProperties();

        if (GETCOMPUTEDSTYLE_BUGGY[styleProp] && style.position != 'static')
        {
          var display = element.style.display;
          element.style.display = 'none';
          res = style.getPropertyValue(styleProp);
          element.style.display = display;
        }
        else
        {
          res = style.getPropertyValue(styleProp);
        }

        return res;
      }
    };
  }
  else
  {
    var VALUE_UNIT = /^-?(\d*\.)?\d+([a-z]+|%)?$/i;
    var IS_PIXEL = /\dpx$/i;

    // css value to pixel convertor
    var getPixelValue = function(element, value){
      if (IS_PIXEL.test(value))
        return parseInt(value, 10) + 'px';

      // The awesome hack by Dean Edwards
      // @see http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

      var style = element.style;
      var runtimeStyle = element.runtimeStyle;

      var left = style.left;
      var runtimeLeft = runtimeStyle.left;

      // set new values
      runtimeStyle.left = element.currentStyle.left;
      style.left = value || 0;

      // fetch new value
      value = style.pixelLeft;

      // restore values
      style.left = left;
      runtimeStyle.left = runtimeLeft;

      // return value in pixels
      return value + 'px';
    };

    // getComputedStyle function for non-W3C spec browsers (Internet Explorer 6-8)
    computedStyle = function(element, styleProp){
      var style = element.currentStyle;

      if (style)
      {
        var value = style[styleProp == 'float' ? 'styleFloat' : basis.string.camelize(styleProp)];
        var unit = (value || '').match(VALUE_UNIT);

        if (unit && unit[2] && unit[2] != 'px')
          value = getPixelValue(element, value);

        return value;
      }
    };
  }

  module.exports = {
    get: computedStyle
  };
