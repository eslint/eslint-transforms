"use strict";

module.exports = {
    meta: {
        docs: {}
    },

    create: function(context) {
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
