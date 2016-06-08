#!/usr/bin/env node

"use strict";

var nodeCLI = require("shelljs-nodecli");

var argv = process.argv.slice(2);
var args = argv.slice(1);
var transform = argv[0];

nodeCLI.exec(
    "jscodeshift",
    "-t", "./lib/" + transform + "/" + transform + ".js",
    args.join(" ")
);
