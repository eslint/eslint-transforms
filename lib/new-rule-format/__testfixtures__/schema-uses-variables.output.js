"use strict";

var SCHEMA_STUFF = {
    enum: ["foo", "bar"]
};

module.exports = {
    meta: {
        docs: {},

        schema: [
            SCHEMA_STUFF
        ]
    },

    create: function(context) {
        return {
            Program: function(node) {
                context.report({
                    node,
                    message: "Unexpected use of comma operator."
                });
            }
        };
    }
};
