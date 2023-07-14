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

const SCHEMA_STUFF = {
    enum: ["foo", "bar"]
};

module.exports.schema = [
    SCHEMA_STUFF
];
