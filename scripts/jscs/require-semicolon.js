var assert = require('assert');

/**
 * Returns true if token is punctuator
 *
 * @param {Object} token
 * @param {String} punctuator
 * @returns {Boolean}
 */
function tokenIsPunctuator(token, punctuator) {
    return token && token.type === 'Punctuator' && token.value === punctuator;
};

module.exports = function() {};
module.exports.prototype = {

    configure: function(requireSemicolon) {
        assert(
            typeof requireSemicolon === 'boolean',
            'requireSemicolon option requires boolean value'
        );
        assert(
            requireSemicolon === true,
            'requireSemicolon option requires true value or should be removed'
        );
    },

    getOptionName: function() {
        return 'requireSemicolon';
    },

    check: function(file, errors) {
        var tokens = file.getTokens();

        // main job
        file.iterateNodesByType([
            'VariableDeclaration',
            'ExpressionStatement',
            'DoWhileStatement',
            'ReturnStatement',
            'ThrowStatement',
            'BreakStatement',
            'ContinueStatement',
            'DebuggerStatement'
        ], function(node) {
            // ignore variable declaration inside for and for-in
            if (node.type === 'VariableDeclaration') {
                if ((node.parentNode.type === 'ForInStatement' && node.parentNode.left === node) ||
                    (node.parentNode.type === 'ForStatement' && node.parentNode.init === node)) {
                    return;
                }
            }

            // search for last token inside node
            var token = file.getLastNodeToken(node);

            // check token is semicolon
            if (!token || token.type !== 'Punctuator' || token.value !== ';') {
                errors.add(
                    'Missing semicolon after statement',
                    (token || node).loc.end
                );
            }
        });
    }

};
