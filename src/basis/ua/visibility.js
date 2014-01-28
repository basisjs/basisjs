
  basis.require('basis.event');

 /**
  * @namespace basis.ua.visibility
  */

  var namespace = this.path;


  //
  // Main part
  //

  var document = global.document;


  //
  // Check visibility support and resolve prefix and property name
  //

  var prefixes = ['webkit', 'moz', 'o', 'ms'];
  var prefix = '';
  var visibilityProperty = 'visibilityState';

  while (visibilityProperty && !document[visibilityProperty])
    if (visibilityProperty = prefix = prefixes.pop())
      visibilityProperty += 'VisibilityState';


  //
  // visibility change emiiter
  //

  var listener = new basis.event.Emitter({
    visible: basis.event.create('visible'),
    hidden: basis.event.create('hidden')
  });

  //
  // visibility state getter
  //

  function getState(){
    return document[visibilityProperty] || 'visible';
  }


  //
  // add visibility change handler
  //

  var supported = visibilityProperty != null;
  if (supported)
    document.addEventListener(prefix + 'visibilitychange', function(){
      //
      // document.visibilityState
      //
      // Returns a string denoting the visibility state of the document. Possible values:
      // * visible : the page content may be at least partially visible. In practice this means
      // that the page is the foreground tab of a non-minimized window.
      // * hidden : the page content is not visible to the user. In practice this means that
      // the document is either a background tab or part of a minimized window.
      // * prerender : the page content is being prerendered and is not visible to the user
      // (considered hidden for purposes of document.hidden).  The document may start in this
      // state, but will never transition to it from another value.
      //
      // https://developer.mozilla.org/en-US/docs/DOM/Using_the_Page_Visibility_API#document.visibilityState

      if (getState() == 'visible')
        listener.visible();
      else
        listener.hidden();
    }, false);


  //
  // export names
  //

  module.exports = {
    supported: supported,
    addHandler: listener.addHandler.bind(listener),
    removeHandler: listener.removeHandler.bind(listener),
    getState: getState
  };
