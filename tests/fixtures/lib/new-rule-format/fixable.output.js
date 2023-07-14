"use strict";

module.exports = {
    meta: {
        docs: {},
        fixable: "code",
        schema: []
    },

    create(context) {
        return {
            Program(node) {
                context.report({
                    node,
                    message: "Unexpected use of comma operator.",
                    fix() {}
                });
            }
        };
    }
};
