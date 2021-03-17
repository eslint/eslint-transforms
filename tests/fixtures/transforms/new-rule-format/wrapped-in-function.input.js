"use strict";

var doSomething = require("doSomething");

module.exports = doSomething(function(context) {
    return {
        Program: function(node) {
            context.report({
                node: node,
                message: "Unexpected use of comma operator."
            });
        }
    };
});

module.exports.schema = [];
