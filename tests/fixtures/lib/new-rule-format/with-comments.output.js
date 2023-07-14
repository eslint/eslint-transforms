"use strict";

/**
 * Rule definition
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
             * @param node
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
