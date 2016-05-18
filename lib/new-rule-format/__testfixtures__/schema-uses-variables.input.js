"use strict";

module.exports = function(context) {
    return {
        Program: function(node) {
            context.report({
                node,
                message: "Unexpected use of comma operator."
            });
        }
    };
};

var SCHEMA_STUFF = {
    enum: ["foo", "bar"]
};

module.exports.schema = [
    SCHEMA_STUFF
];
