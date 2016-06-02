/* global jest */

"use strict";

jest.autoMockOff();
var defineTest = require("jscodeshift/dist/testUtils").defineTest;

// tests basic functionality of the transform
defineTest(__dirname, "new-rule-format", null, "simple");

// tests that the transform can detect that a rule is fixable
defineTest(__dirname, "new-rule-format", null, "fixable");

// tests that the transform can handle rules that have no schema being exported
defineTest(__dirname, "new-rule-format", null, "no-schema");

// tests that the transform can handle rules that use an identifier for the
// "context" object that is not "context", e.g.:
// customContextName.report({ ... });
defineTest(__dirname, "new-rule-format", null, "custom-identifier-context");

// tests that the transform can handle rules that have a schema definition that
// depends on variables that were declared above it
defineTest(__dirname, "new-rule-format", null, "schema-uses-variables");

// tests that the transform can handle comments in different nodes that will be
// moved around
defineTest(__dirname, "new-rule-format", null, "with-comments");

// tests that the transform doesn't fail if the rule was already in the new format
defineTest(__dirname, "new-rule-format", null, "already-transformed");

// tests that the transform also works when the rule definition is an arrow function
defineTest(__dirname, "new-rule-format", null, "arrow-function");
