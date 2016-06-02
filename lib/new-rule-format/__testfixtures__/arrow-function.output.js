/* eslint-env es6 */
"use strict";

module.exports = {
    meta: {
        docs: {},
        schema: []
    },

    create: context => {
        return {
            Program: function(node) {
                context.report({
                    node: node,
                    message: "Unexpected use of comma operator."
                });
            }
        };
    }
};
