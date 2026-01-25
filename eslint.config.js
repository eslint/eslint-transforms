"use strict";

const { defineConfig, globalIgnores } = require("eslint/config");
const eslintConfigESLintCJS = require("eslint-config-eslint/cjs");
const globals = require("globals");

module.exports = defineConfig([
    globalIgnores(["tests/fixtures/"]),
    eslintConfigESLintCJS,
    {
        files: ["tests/**/*"],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
]);
