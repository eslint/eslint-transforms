#!/usr/bin/env node

"use strict";

const execSync = require("node:child_process").execSync;
const path = require("node:path");

const argv = process.argv.slice(2);
const args = argv.slice(1);
const transform = argv[0];

/**
 * Add possible node_modules/.bin paths to env and run the command passed in.
 * @param {string} cmd The command to run
 * @returns {void}
 */
function execWithNodeModules(cmd) {
    const SEPARATOR = process.platform === "win32" ? ";" : ":",
        env = Object.assign({}, process.env);

    env.PATH = [

        // Covers case when npm flattens dependencies and the jscodeshift bin will be directly under the root
        // node_modules folder
        path.resolve("./node_modules/.bin"),

        // Covers case when dependencies are not flattened and the jscodeshift bin can be found under the
        // node_modules folder of our package
        path.resolve(__dirname, "../node_modules/.bin"),
        env.PATH
    ].join(SEPARATOR);

    execSync(cmd, {
        env,
        cwd: process.cwd(),
        stdio: "inherit"
    });
}

execWithNodeModules([
    "jscodeshift",
    "-t",
    path.resolve(__dirname, `../lib/${transform}/${transform}.js`),
    args.join(" ")
].join(" "));
