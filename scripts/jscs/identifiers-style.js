var assert = require('assert');
var path = require('path');

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
        function isBadName(name){
            if (name === '__extend__' || name === '__resources__' || name === '__namespace_map__')
                return false;
            if (name.toUpperCase() === name)
                return false;
            if (name.replace(/^_{1,2}|_$|^(emit|debug|bind)_/, '').indexOf('_') == -1)
                return false;
            return true;
        }
        //console.log(file);
        //process.exit();

        file.iterateTokensByType('Identifier', function(token){
            if (isBadName(token.value)) {
                errors.add(
                    'All identifiers must be camelCase or camelCase with prefix (emit_, debug_, bind_) or UPPER_CASE',
                    token.loc.start.line,
                    token.loc.start.column
                );
            }
        });
    }

};
