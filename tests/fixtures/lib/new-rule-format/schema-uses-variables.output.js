"use strict";

const SCHEMA_STUFF = {
    enum: ["foo", "bar"]
};

module.exports = {
    meta: {
        docs: {},

        schema: [
            SCHEMA_STUFF
        ]
    },

    create(context) {
        return {
            Program(node) {
                context.report({
                    node,
                    message: "Unexpected use of comma operator."
                });
            }
        };
    }
};
