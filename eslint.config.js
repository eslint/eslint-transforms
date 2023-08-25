"use strict";

const eslintConfigESLintCJS = require("eslint-config-eslint/cjs");
const globals = require("globals");

module.exports = [
    {
        ignores: ["tests/fixtures/"]
    },
    ...eslintConfigESLintCJS,
    {
        files: ["tests/**/*"],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
];
