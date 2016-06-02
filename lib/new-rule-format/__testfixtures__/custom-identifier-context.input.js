"use strict";

module.exports = function(foo) {
    return {
        Program: function(node) {
            foo.report({
                node: node,
                message: "Unexpected use of comma operator.",
                fix: function() {}
            });
        }
    };
};

module.exports.schema = [];
