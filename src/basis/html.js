
  basis.require('basis.dom');
  basis.require('basis.template');


 /**
  * @namespace basis.html
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var dom = basis.dom;
  var arrayFrom = basis.array.from;

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
    return dom.createFragment.apply(null, arrayFrom(unescapeElement.childNodes));
  }


  //
  // export names
  //

  module.exports = {
    Template: Template,
    escape: escape,
    unescape: unescape,
    string2Html: string2Html
  };
