"use strict";

const { defineConfig, globalIgnores } = require("eslint/config");
const eslintConfigESLintCJS = require("eslint-config-eslint/cjs");
const eslintConfigESLintFormatting = require("eslint-config-eslint/formatting");
const globals = require("globals");

module.exports = defineConfig([
    globalIgnores(["tests/fixtures/"]),
    eslintConfigESLintCJS,
    eslintConfigESLintFormatting,
    {
        files: ["tests/**/*"],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
]);
