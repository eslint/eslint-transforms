"use strict";

module.exports = {
    meta: {
        docs: {},
        fixable: "code",
        schema: []
    },

    create: function(foo) {
        return {
            Program: function(node) {
                foo.report({
                    node,
                    message: "Unexpected use of comma operator.",
                    fix: function() {}
                });
            }
        };
    }
};
