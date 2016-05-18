"use strict";

module.exports = {
    meta: {
        docs: {},
        fixable: "code",
        schema: []
    },

    create: function(context) {
        return {
            Program: function(node) {
                context.report({
                    node,
                    message: "Unexpected use of comma operator.",
                    fix: function() {}
                });
            }
        };
    }
};
