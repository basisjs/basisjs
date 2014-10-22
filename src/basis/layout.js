
 /**
  * @namespace basis.layout
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var documentElement = document.documentElement;
  var getComputedStyle = require('basis.dom.computedStyle').get;


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
      if (document.compatMode == 'CSS1Compat')
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
      x: left,
      y: top
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
      top: top + offset.y,
      left: left + offset.x
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
      top: top + offset.y,
      left: left + offset.x,
      right: right + offset.x,
      bottom: bottom + offset.y,
      width: right - left,
      height: bottom - top
    };
  }

  function getViewportRect(element, relElement){
    var point = getTopLeftPoint(element, relElement);
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
    getOffsetParent: getOffsetParent,
    getTopLeftPoint: getTopLeftPoint,
    getBoundingRect: getBoundingRect,
    getViewportRect: getViewportRect
  };
