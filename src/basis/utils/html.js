

  //
  // import names
  //

  var document = global.document;
  var unescapeElement = document.createElement('div');


 /**
  * @func
  */
  function escape(html){
    return document.createElement('div').appendChild(document.createTextNode(html)).parentNode.innerHTML;
  }

 /**
  * @func
  */
  function unescape(escapedHtml){
    unescapeElement.innerHTML = escapedHtml;
    return unescapeElement.firstChild.nodeValue;
  }

 /**
  * @func
  */
  function string2html(text){
    unescapeElement.innerHTML = text;

    var result = document.createDocumentFragment();
    var nodes = basis.array(unescapeElement.childNodes);

    for (var i = 0, node; node = nodes[i]; i++)
      result.appendChild(node);

    return result;
  }


  //
  // export names
  //

  module.exports = {
    escape: escape,
    unescape: unescape,
    string2html: string2html
  };
