/**
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom');
basis.require('basis.template');

(function(basis, global){

  'use strict';

 /**
  * @namespace basis.html
  */

  var namespace = 'basis.html';


  //
  // import names
  //

  var document = global.document;
  var dom = basis.dom;


  var Template = basis.template.Template;


 /**
  * @func
  */
  function escape(html){
    return dom.createElement('div', dom.createText(html)).innerHTML;
  }

 /**
  * @func
  */
  var unescapeElement = document.createElement('div');
  function unescape(escapedHtml){
    unescapeElement.innerHTML = escapedHtml;
    return unescapeElement.firstChild.nodeValue;
  }

 /**
  * @func
  */
  function string2Html(text){
    unescapeElement.innerHTML = text;
    return dom.createFragment.apply(null, Array.from(unescapeElement.childNodes));
  }


  //
  // export names
  //

  return basis.namespace(namespace).extend({
    Template: Template,
    escape: escape,
    unescape: unescape,
    string2Html: string2Html
  });

})(basis, this);
