"use strict";

/**
 * Rule definition
 * @returns {Object} Rule definition object
 */
module.exports = {
    meta: {
        docs: {},

        // Above schema
        schema: []
    },

    create(context) {
        return {

            /**
             * Above AST node type
             * @param {Object} node The AST node being checked
             * @returns {void}
             */
            Program(node) {
                context.report({
                    node,
                    message: "Unexpected use of comma operator."
                });
            }
        };
    }
};
