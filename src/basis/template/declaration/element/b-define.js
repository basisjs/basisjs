var hasOwnProperty = Object.prototype.hasOwnProperty;
var arrayAdd = basis.array.add;
var consts = require('../../const.js');
var utils = require('../utils.js');
var getTokenAttrValues = utils.getTokenAttrValues;
var CLASS_BINDING_BOOL = consts.CLASS_BINDING_BOOL;
var CLASS_BINDING_INVERT = consts.CLASS_BINDING_INVERT;
var CLASS_BINDING_ENUM = consts.CLASS_BINDING_ENUM;

function addStateInfo(template, name, type, value){
  if (!hasOwnProperty.call(template.states, name))
    template.states[name] = {};

  var info = template.states[name];
  var isArray = Array.isArray(value);

  if (!hasOwnProperty.call(info, type) || !isArray)
    info[type] = isArray ? basis.array(value) : value;
  else
    value.forEach(function(item){
      arrayAdd(info[type], item);
    });
}

module.exports = function(template, options, token){
  var elAttrs = getTokenAttrValues(token);
  /** @cut */ var elAttrs_ = utils.getTokenAttrs(token);

  /** @cut */ if ('name' in elAttrs == false)
  /** @cut */   utils.addTemplateWarn(template, options, '<b:define> has no `name` attribute', token.loc);
  /** @cut */ if ('type' in elAttrs == false)
  /** @cut */   utils.addTemplateWarn(template, options, '<b:define> has no `type` attribute', token.loc);
  /** @cut */ if (hasOwnProperty.call(options.defines, elAttrs.name))
  /** @cut */   utils.addTemplateWarn(template, options, '<b:define> with name `' + elAttrs.name + '` is already defined', token.loc);

  if ('name' in elAttrs && 'type' in elAttrs && !hasOwnProperty.call(options.defines, elAttrs.name))
  {
    var bindingName = elAttrs.from || elAttrs.name;
    var defineName = elAttrs.name;
    var define = false;
    var defaultIndex;
    var values;

    switch (elAttrs.type)
    {
      case 'bool':
        define = [
          bindingName,
          CLASS_BINDING_BOOL,
          defineName,
          elAttrs['default'] == 'true' ? 1 : 0
        ];

        /** @cut */ addStateInfo(template, bindingName, 'bool', true);

        /** @cut */ if ('default' in elAttrs && !elAttrs['default'])
        /** @cut */   utils.addTemplateWarn(template, options, 'Bool <b:define> has no value as default (value ignored)', elAttrs_['default'] && elAttrs_['default'].loc);

        break;

      case 'invert':
        define = [
          bindingName,
          CLASS_BINDING_INVERT,
          defineName,
          !elAttrs['default'] || elAttrs['default'] == 'true' ? 1 : 0
        ];

        /** @cut */ addStateInfo(template, bindingName, 'invert', false);

        /** @cut */ if ('default' in elAttrs && !elAttrs['default'])
        /** @cut */   utils.addTemplateWarn(template, options, 'Invert <b:define> has no value as default (value ignored)', elAttrs_['default'] && elAttrs_['default'].loc);

        break;

      case 'enum':
        if ('values' in elAttrs == false)
        {
          /** @cut */ utils.addTemplateWarn(template, options, 'Enum <b:define> has no `values` attribute', token.loc);
          break;
        }

        values = (elAttrs.values || '').trim();

        if (!values)
        {
          /** @cut */ utils.addTemplateWarn(template, options, 'Enum <b:define> has no variants (`values` attribute is empty)', elAttrs_.values && elAttrs_.values.loc);
          break;
        }

        values = values.split(/\s+/);
        defaultIndex = values.indexOf(elAttrs['default']);

        /** @cut */ if ('default' in elAttrs && defaultIndex == -1)
        /** @cut */   utils.addTemplateWarn(template, options, 'Enum <b:define> has bad value as default (value ignored)', elAttrs_['default'] && elAttrs_['default'].loc);

        define = [
          bindingName,
          CLASS_BINDING_ENUM,
          defineName,
          defaultIndex + 1,
          values
        ];

        /** @cut */ addStateInfo(template, bindingName, 'enum', values);

        break;

      /** @cut */ default:
      /** @cut */   utils.addTemplateWarn(template, options, 'Bad type in <b:define> for `' + defineName + '`: ' + elAttrs.type, elAttrs_.type && elAttrs_.type.valueLoc);
    }

    if (define)
    {
      /** @cut */ utils.addTokenLocation(template, options, define, token);
      options.defines[defineName] = define;
    }
  }
};
