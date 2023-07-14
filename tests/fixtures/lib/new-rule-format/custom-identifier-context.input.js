"use strict";

module.exports = function(foo) {
    return {
        Program(node) {
            foo.report({
                node,
                message: "Unexpected use of comma operator.",
                fix() {}
            });
        }
    };
};

module.exports.schema = [];
