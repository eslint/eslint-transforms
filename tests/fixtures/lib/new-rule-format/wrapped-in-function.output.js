"use strict";

const doSomething = require("");

module.exports = {
    meta: {
        docs: {},
        schema: []
    },

    create: doSomething(context => ({
        Program(node) {
            context.report({
                node,
                message: "Unexpected use of comma operator."
            });
        }
    }))
};
