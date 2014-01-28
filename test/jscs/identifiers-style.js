var assert = require('assert');

module.exports = function(){};

module.exports.prototype = {

    configure: function(basisIdentifiersStyle){
        assert(
            typeof basisIdentifiersStyle === 'boolean',
            'basisIdentifiersStyle option requires boolean value'
        );
        assert(
            basisIdentifiersStyle === true,
            'basisIdentifiersStyle option requires true value or should be removed'
        );
    },

    getOptionName: function(){
        return 'basisIdentifiersStyle';
    },

    check: function(file, errors){
        file.iterateTokensByType('Identifier', function(token){
            var value = token.value;
            if (value.replace(/^_+|_+$|^(emit|debug|bind)_/g, '').indexOf('_') > -1 &&
                value.toUpperCase() !== value) {
                errors.add(
                    'All identifiers must be camelCase or camelCase with prefix (emit_, debug_, bind_) or UPPER_CASE',
                    token.loc.start.line,
                    token.loc.start.column
                );
            }
        });
    }

};
