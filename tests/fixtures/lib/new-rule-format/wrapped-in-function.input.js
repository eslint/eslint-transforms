"use strict";

const doSomething = require("");

module.exports = doSomething(context => ({
    Program(node) {
        context.report({
            node,
            message: "Unexpected use of comma operator."
        });
    }
}));

module.exports.schema = [];
