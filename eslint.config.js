"use strict";

const eslintConfig = require("eslint-config-eslint");
const globals = require("globals");

module.exports = [
    {
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },
    ...eslintConfig,
    {
        files: ["tests/**/*"],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
];
