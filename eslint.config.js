"use strict";

const eslintConfigESLintCJS = require("eslint-config-eslint/cjs");
const eslintConfigESLintFormatting = require("eslint-config-eslint/formatting");
const globals = require("globals");

module.exports = [
    {
        ignores: ["tests/fixtures/"]
    },
    ...eslintConfigESLintCJS,
    eslintConfigESLintFormatting,
    {
        files: ["tests/**/*"],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
];
