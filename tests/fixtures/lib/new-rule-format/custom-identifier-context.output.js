"use strict";

module.exports = {
    meta: {
        docs: {},
        fixable: "code",
        schema: []
    },

    create(foo) {
        return {
            Program(node) {
                foo.report({
                    node,
                    message: "Unexpected use of comma operator.",
                    fix() {}
                });
            }
        };
    }
};
