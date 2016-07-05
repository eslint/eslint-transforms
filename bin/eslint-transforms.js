#!/usr/bin/env node

"use strict";

var nodeCLI = require("shelljs-nodecli");
var path = require("path");

var argv = process.argv.slice(2);
var args = argv.slice(1);
var transform = argv[0];

nodeCLI.exec(
    "jscodeshift",
    "-t", path.resolve(__dirname, "../lib/" + transform + "/" + transform + ".js"),
    args.join(" ")
);
