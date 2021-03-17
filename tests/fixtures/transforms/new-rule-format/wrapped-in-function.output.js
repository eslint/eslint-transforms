"use strict";

var doSomething = require("doSomething");

module.exports = {
    meta: {
        docs: {},
        schema: []
    },

    create: doSomething(function(context) {
        return {
            Program: function(node) {
                context.report({
                    node: node,
                    message: "Unexpected use of comma operator."
                });
            }
        };
    })
};
