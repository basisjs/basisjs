var arrayAdd = basis.array.add;
var utils = require('../utils.js');
var getTokenName = utils.getTokenName;
var getTokenAttrs = utils.getTokenAttrs;
var refList = require('../refs.js').refList;
var bindingList = utils.bindingList;
var attrUtils = require('../attr.js');
var applyAttrs = attrUtils.applyAttrs;
var TYPE_ELEMENT = require('../../const.js').TYPE_ELEMENT;


// Example: <b:svg src="..." use="#symbol-{id}" .../>
// process `use` attribute ---> xlink:href="#symbol-{id}"
module.exports = function(template, options, token, result){
  var attrs = getTokenAttrs(token);
  var svgAttributes = [];
  var svgUse = [
    TYPE_ELEMENT,
    0,
    0,
    'svg:use'
  ];
  var svgElement = [
    TYPE_ELEMENT,
    bindingList(token),
    refList(token),
    'svg:svg',
    svgUse
  ];


  for (var key in attrs)
  {
    var attrToken = attrs[key];

    switch (getTokenName(attrToken))
    {
      case 'src':
        if (!attrToken.value)
        {
          /** @cut */ utils.addTemplateWarn(template, options, 'Value for `src` attribute should be specified', attrToken.loc);
          continue;
        }

        var svgUrl = basis.resource.resolveURI(attrToken.value, template.baseURI, '<b:' + token.name + ' src=\"{url}\"/>');
        arrayAdd(template.deps, basis.resource.buildCloak(svgUrl));
        template.resources.push({
          type: 'svg',
          url: svgUrl
        });
        break;

      case 'use':
        applyAttrs(template, options, svgUse, [
          basis.object.merge(attrToken, {
            prefix: 'xlink',
            name: 'href'
          })
        ]);
        break;

      default:
        svgAttributes.push(attrToken);
    }
  }

  result.push(applyAttrs(template, options, svgElement, svgAttributes));
};
