"use strict";

/**
 * Rule definition
 * @param {Object} context The rule context object
 * @returns {Object} Rule definition object
 */
module.exports = function(context) {
    return {

        /**
         * Above AST node type
         * @param {Object} node The AST node
         * @returns {void}
         */
        Program(node) {
            context.report({
                node,
                message: "Unexpected use of comma operator."
            });
        }
    };
};

// Above schema
module.exports.schema = [];
