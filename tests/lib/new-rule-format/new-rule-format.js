/**
 * @fileoverview Tests for new-rule-format transform.
 * @author Vitor Balocco
 * @copyright jQuery Foundation and other contributors, https://jquery.org/
 * MIT License
 */

"use strict";

var jscodeshift = require("jscodeshift");
var fs = require("fs");
var path = require("path");
var expect = require("chai").expect;

var newRuleFormatTransform = require("../../../lib/new-rule-format/new-rule-format");

/**
 * Run a transform against a fixture file and compare results with expected output.
 * The fixture file and expected output file should be named in the format
 * `prefix.input.js` and `prefix.output.js` and should be located in the
 * `tests/fixtures/` folder.
 *
 * @param {Function} transform - transform to test against
 * @param {String} transformFixturePrefix - prefix of fixture files
 * @returns {void}
 */
function testTransformWithFixture(transform, transformFixturePrefix) {
    var fixtureDir = path.join(__dirname, "../../fixtures/lib/new-rule-format");
    var inputPath = path.join(fixtureDir, transformFixturePrefix + ".input.js");
    var source = fs.readFileSync(inputPath, "utf8");
    var expectedOutput = fs.readFileSync(
      path.join(fixtureDir, transformFixturePrefix + ".output.js"),
      "utf8"
    );

    var output = transform(
      { path: inputPath, source: source },
      { jscodeshift: jscodeshift },
      {}
    );

    it("transforms correctly using \"" + transformFixturePrefix + "\" fixture", function() {
        expect(
            (output || "").trim()
        ).to.equal(
            expectedOutput.trim()
        );
    });
}

/**
 * For each item in the `fixtures` array, runs the transform and compares the
 * results with the expected output.
 * The fixture file and expected output file should be named in the format
 * `prefix.input.js` and `prefix.output.js` and should be located in the
 * `tests/fixtures/` folder.
 *
 * @param {Function} transform - transform to test against
 * @param {String[]} fixtures - list of fixture prefixes
 * @returns {void}
 */
function testTransformWithFixtures(transform, fixtures) {
    return fixtures.forEach(function(fixture) {
        testTransformWithFixture(transform, fixture);
    });
}

describe("New Rule Format transform", function() {
    testTransformWithFixtures(newRuleFormatTransform, [
        // tests basic functionality of the transform
        "simple",

        // tests that the transform can detect that a rule is fixable
        "fixable",

        // tests that the transform can handle rules that have no schema being exported
        "no-schema",

        // tests that the transform can handle rules that use an identifier for the
        // "context" object that is not "context", e.g.:
        // customContextName.report({ ... });
        "custom-identifier-context",

        // tests that the transform can handle rules that have a schema definition that
        // depends on variables that were declared above it
        "schema-uses-variables",

        // tests that the transform can handle comments in different nodes that will be
        // moved around
        "with-comments",

        // tests that the transform doesn't fail if the rule was already in the new format
        "already-transformed",

        // tests that the transform also works when the rule definition is an arrow function
        "arrow-function"
    ]);
});
