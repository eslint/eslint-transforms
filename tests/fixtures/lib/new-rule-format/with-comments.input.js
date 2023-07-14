"use strict";

/**
 * Rule definition
 * @param context
 */
module.exports = function(context) {
    return {

        /**
         * Above AST node type
         * @param node
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
