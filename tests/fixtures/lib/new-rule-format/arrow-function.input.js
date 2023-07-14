/* eslint-env es6 */
"use strict";

module.exports = context => ({
    Program(node) {
        context.report({
            node,
            message: "Unexpected use of comma operator."
        });
    }
});

module.exports.schema = [];
