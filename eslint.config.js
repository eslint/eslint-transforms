"use strict";

const eslintConfig = require("eslint-config-eslint");
const globals = require("globals");

module.exports = [
    {
        ignores: ["tests/fixtures/"]
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
