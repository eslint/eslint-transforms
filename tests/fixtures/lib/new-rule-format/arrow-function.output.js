/* eslint-env es6 -- for test */
"use strict";

module.exports = {
    meta: {
        docs: {},
        schema: []
    },

    create(context) {
        return {
            Program(node) {
                context.report({
                    node,
                    message: "Unexpected use of comma operator."
                });
            }
        };
    }
};
