
 /**
  * @namespace basis.layout
  */

  var document = global.document;
  var documentElement = document.documentElement;
  var getComputedStyle = require('./dom/computedStyle.js').get;
  var standartsMode = document.compatMode == 'CSS1Compat';


  //
  // Main part
  //

  function getOffsetParent(node){
    var offsetParent = node.offsetParent || documentElement;

    while (offsetParent && offsetParent !== documentElement && getComputedStyle(offsetParent, 'position') == 'static')
      offsetParent = offsetParent.offsetParent;

    return offsetParent || documentElement;
  }

  function getOffset(element){
    var top = 0;
    var left = 0;

    if (element && element.getBoundingClientRect)
    {
      // offset relative to element
      var relRect = element.getBoundingClientRect();

      top = -relRect.top;
      left = -relRect.left;
    }
    else
    {
      // offset relative to page
      if (standartsMode)
      {
        top = global.pageYOffset || documentElement.scrollTop;
        left = global.pageXOffset || documentElement.scrollLeft;
      }
      else
      {
        // IE6 and quirk mode
        var body = document.body;
        if (element !== body)
        {
          top = body.scrollTop - body.clientTop;
          left = body.scrollLeft - body.clientLeft;
        }
      }
    }

    return {
      left: left,
      top: top
    };
  }

  function getTopLeftPoint(element, relElement){
    var left = 0;
    var top = 0;
    var offset = getOffset(relElement);

    if (element && element.getBoundingClientRect)
    {
      var box = element.getBoundingClientRect();

      top = box.top;
      left = box.left;
    }

    return {
      top: top + offset.top,
      left: left + offset.left
    };
  }

  function getBoundingRect(element, relElement){
    var top = 0;
    var left = 0;
    var right = 0;
    var bottom = 0;
    var offset = getOffset(relElement);

    if (element && element.getBoundingClientRect)
    {
      var rect = element.getBoundingClientRect();

      top = rect.top;
      left = rect.left;
      right = rect.right;
      bottom = rect.bottom;
    }

    return {
      top: top + offset.top,
      left: left + offset.left,
      right: right + offset.left,
      bottom: bottom + offset.top,
      width: right - left,
      height: bottom - top
    };
  }

  function getViewportRect(element, relElement){
    var topViewport = standartsMode ? document.documentElement : document.body;
    var point = element === topViewport && !relElement ? getOffset() : getTopLeftPoint(element, relElement);
    var top = point.top;
    var left = point.left;
    var width;
    var height;

    if (!element || element === global)
    {
      width = global.innerWidth || 0;
      height = global.innerHeight || 0;
    }
    else
    {
      top += element.clientTop;
      left += element.clientLeft;
      width = element.clientWidth;
      height = element.clientHeight;
    }

    return {
      top: top,
      left: left,
      right: left + width,
      bottom: top + height,
      width: width,
      height: height
    };
  }


  //
  // export names
  //

  module.exports = {
    getOffset: getOffset,
    getOffsetParent: getOffsetParent,
    getTopLeftPoint: getTopLeftPoint,
    getBoundingRect: getBoundingRect,
    getViewportRect: getViewportRect
  };
