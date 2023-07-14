"use strict";

module.exports = function(context) {
    return {
        Program(node) {
            context.report({
                node,
                message: "Unexpected use of comma operator."
            });
        }
    };
};
