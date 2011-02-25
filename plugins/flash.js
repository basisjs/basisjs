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

    var namespace = 'Basis.Flash';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;

    //
    // Main part
    //

    var isIE = Basis.Browser.is('ie');

    var SWFObject = Class(null, {
      className: namespace + '.SWFObject',
      init: function(attributes, params){
        // Cleanup classid
        delete attributes.classid;

        if (isIE)
        {
          // Move data from params to attributes
          params.movie = attributes.data;
          delete attributes.data;

          // Create element
          var tmp = DOM.createElement('');
          tmp.innerHTML =
            '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' + Object.iterate(attributes, String.format, '{0}="{1}"').join(' ') + '>' + 
              Object.iterate(params, String.format, '<param name="{0}" value="{1}">').join('') +
            '</object>';

          // Extract relevant node
          this.element = tmp.firstChild;

          if (!this.element.id)
            this.element.id = this.element.uniqueID;
        }
        else
        {
          // Cleanup
          delete params.movie;

          // Add parameters
          DOM.insert(this.element = DOM.createElement('OBJECT[type="application/x-shockwave-flash"]' + Object.iterate(attributes, String.format, '[{0}="{1}"]').join('')),
            Object.iterate(params, function(key, value){
              return DOM.createElement('PARAM[name={0}][value={1}]'.format(key, String(value).quote()));
            })
          );
          /*
          attributes.src = attributes.data;
          delete attributes.data;
          this.element = DOM.createElement('EMBED[type="application/x-shockwave-flash"]'
            + Hash(attributes).toArray().map(String.format, '[{key}="{value}"]').join('')
            + Hash(params).toArray().map(String.format, '[{key}="{value}"]').join('')
          );
          */

          //alert(this.element.innerHTML);
        }
      }
    });

    var SWFElement = Class(null, {
      className: namespace + '.SWFElement',
      init: function(movieURL, params, variables, attributes){
        this.inherit();

        // Generates attributes for flash movie
        var attributes = Object.complete({
          data: movieURL
        }, attributes);

        // Work on param copy
        var params = Object.extend({}, params);

        // Copy over variables (into params)
        if (variables)
          params.flashvars = Object.iterate(variables, String.format, '{0}={1}').join('&');

        // Finally create the SWF
        this.swf = new SWFObject(attributes, params);

        // Objects do not allow styling well. We create a DIV wrapper around.
        this.element = DOM.createElement("", this.swf.element);
      },
      alive: function(container){
        if (isIE && DOM.parentOf(document.documentElement, this.element))
        {
          var vars = Array.from(this.swf.element.childNodes).map(function(e){ return e.outerHTML }).join(''); //.search('flashvars', 'name').value;
          //alert('>' + this.swf.element.innerHTML);
          //alert(this.element.innerHTML.replace(/(<param[^>]+>)+/gi, vars));
          this.element.innerHTML = this.element.innerHTML.replace(/(<param[^>]+>)+/gi, vars);
          this.swf.element = window[this.swf.element.id];
          //DOM.insert(DOM.clear(this.swf.element), vars);
//*/
        }
      },
      callMethod: function(method /* params */){
        if (DOM.parentOf(document.documentElement, this.element))
        {
          var func = new Function('swf', 'a', 'b', 'c', 'return swf.element.' + method + '(' + ['a','b','c'].splice(0, arguments.length - 1) + ')');
          return func(this.swf, arguments[1], arguments[2], arguments[3]);
          //this.swf.element[method].apply(this.swf.element, Array.from(arguments, 1));
        }
        else
        {
          ;;; if (typeof console != 'undefined') console.log('Method call is not allowed while SWF is not into document.');
        }
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      SWFElement: SWFElement,
      SWFObject: SWFObject
    });

  })();
