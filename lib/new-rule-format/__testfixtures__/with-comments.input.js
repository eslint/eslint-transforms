/* eslint-disable valid-jsdoc */

"use strict";

/**
 * Rule definition
 */
module.exports = function(context) {
    return {
        /**
         * Above AST node type
         */
        Program: function(node) {
            context.report({
                node: node,
                message: "Unexpected use of comma operator."
            });
        }
    };
};

// Above schema
module.exports.schema = [];
