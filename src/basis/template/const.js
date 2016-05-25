var MARKER = 'basisTemplateId_' + basis.genUID();

// token types
/** @const */ var TYPE_ELEMENT = 1;
/** @const */ var TYPE_ATTRIBUTE = 2;
/** @const */ var TYPE_ATTRIBUTE_CLASS = 4;
/** @const */ var TYPE_ATTRIBUTE_STYLE = 5;
/** @const */ var TYPE_ATTRIBUTE_EVENT = 6;
/** @const */ var TYPE_TEXT = 3;
/** @const */ var TYPE_COMMENT = 8;

// references on fields in declaration
/** @const */ var TOKEN_TYPE = 0;
/** @const */ var TOKEN_BINDINGS = 1;
/** @const */ var TOKEN_REFS = 2;

/** @const */ var ATTR_NAME = 3;
/** @const */ var ATTR_VALUE = 4;

var ATTR_NAME_BY_TYPE = {
  4: 'class',
  5: 'style'
};
var ATTR_TYPE_BY_NAME = {
  'class': TYPE_ATTRIBUTE_CLASS,
  'style': TYPE_ATTRIBUTE_STYLE
};
var ATTR_VALUE_INDEX = {
  2: ATTR_VALUE,
  4: ATTR_VALUE - 1,
  5: ATTR_VALUE - 1,
  6: 2
};

/** @const */ var ELEMENT_NAME = 3;
/** @const */ var ELEMENT_ATTRIBUTES_AND_CHILDREN = 4;

/** @const */ var TEXT_VALUE = 3;
/** @const */ var COMMENT_VALUE = 3;

var CLASS_BINDING_ENUM = 1;
var CLASS_BINDING_BOOL = 2;
var CLASS_BINDING_INVERT = 3;
var CLASS_BINDING_EQUAL = 4;
var CLASS_BINDING_NOTEQUAL = 5;

// test for browser (IE) normalize text nodes during cloning
var document = global.document;
var CLONE_NORMALIZATION_TEXT_BUG = !document ? true : (function(){
  var element = document.createElement('div');
  element.appendChild(document.createTextNode('a'));
  element.appendChild(document.createTextNode('a'));
  return element.cloneNode(true).childNodes.length == 1;
})();


//
// export
//

module.exports = {
  MARKER: MARKER,

  TYPE_ELEMENT: TYPE_ELEMENT,
  TYPE_ATTRIBUTE: TYPE_ATTRIBUTE,
  TYPE_ATTRIBUTE_CLASS: TYPE_ATTRIBUTE_CLASS,
  TYPE_ATTRIBUTE_STYLE: TYPE_ATTRIBUTE_STYLE,
  TYPE_ATTRIBUTE_EVENT: TYPE_ATTRIBUTE_EVENT,
  TYPE_TEXT: TYPE_TEXT,
  TYPE_COMMENT: TYPE_COMMENT,
  TOKEN_TYPE: TOKEN_TYPE,
  TOKEN_BINDINGS: TOKEN_BINDINGS,
  TOKEN_REFS: TOKEN_REFS,
  ATTR_NAME: ATTR_NAME,
  ATTR_VALUE: ATTR_VALUE,
  ATTR_NAME_BY_TYPE: ATTR_NAME_BY_TYPE,
  ATTR_TYPE_BY_NAME: ATTR_TYPE_BY_NAME,
  ATTR_VALUE_INDEX: ATTR_VALUE_INDEX,
  ELEMENT_NAME: ELEMENT_NAME,
  ELEMENT_ATTRIBUTES_AND_CHILDREN: ELEMENT_ATTRIBUTES_AND_CHILDREN,
  TEXT_VALUE: TEXT_VALUE,
  COMMENT_VALUE: COMMENT_VALUE,

  CLASS_BINDING_ENUM: CLASS_BINDING_ENUM,
  CLASS_BINDING_BOOL: CLASS_BINDING_BOOL,
  CLASS_BINDING_INVERT: CLASS_BINDING_INVERT,
  CLASS_BINDING_EQUAL: CLASS_BINDING_EQUAL,
  CLASS_BINDING_NOTEQUAL: CLASS_BINDING_NOTEQUAL,

  CLONE_NORMALIZATION_TEXT_BUG: CLONE_NORMALIZATION_TEXT_BUG
};
