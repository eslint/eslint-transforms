"use strict";

module.exports = context => {
    return {
        Program: function(node) {
            context.report({
                node,
                message: "Unexpected use of comma operator."
            });
        }
    };
};

module.exports.schema = [];
