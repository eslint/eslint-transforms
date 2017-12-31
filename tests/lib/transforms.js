/**
 * @fileoverview Tests for new-rule-format transform.
 * @author Vitor Balocco
 * @copyright jQuery Foundation and other contributors, https://jquery.org/
 * MIT License
 */

"use strict";

var jscodeshift = require("jscodeshift");
var fs = require("fs");
var os = require("os");
var path = require("path");
var expect = require("chai").expect;

var fixturesRootPath = path.join(__dirname, "../fixtures/transforms");


/**
 * Returns a new string with all the EOL markers from the string passed in
 * replaced with the Operating System specific EOL marker.
 * Useful for guaranteeing two transform outputs have the same EOL marker format.
 *
 * @param {string} input - the string which will have its EOL markers replaced
 * @returns {string} a new string with all EOL markers replaced
 * @private
 */
function normalizeLineEndngs(input) {
    return input.replace(/(\r\n|\n|\r)/gm, os.EOL);
}

/**
 * Run a transform against a fixture file and compare results with expected output.
 * The fixture file and expected output file should be named in the format
 * `prefix.input.js` and `prefix.output.js` and should be located in the
 * `tests/fixtures/` folder.
 *
 * @param {Function} transform - transform to test against
 * @param {string} transformFixturePrefix - prefix of fixture files
 * @returns {void}
 * @private
 */
function testTransformWithFixture(transform, transformFixturePrefix) {
    var fixtureDir = path.join(fixturesRootPath, transform.name);
    var inputPath = path.join(fixtureDir, transformFixturePrefix + ".input.js");
    var source = fs.readFileSync(inputPath, "utf8");
    var expectedOutput = fs.readFileSync(
      path.join(fixtureDir, transformFixturePrefix + ".output.js"),
      "utf8"
    );

    it("transforms correctly using \"" + transformFixturePrefix + "\" fixture", function() {

        var output = transform.fn(
          { path: inputPath, source: source },
          { jscodeshift: jscodeshift },
          {}
        );

        expect(
            normalizeLineEndngs((output || "").trim())
        ).to.equal(
            normalizeLineEndngs(expectedOutput.trim())
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
 * @param {string[]} fixtures - list of fixture prefixes
 * @returns {void}
 * @private
 */
function testTransformWithFixtures(transform, fixtures) {
    return fixtures.forEach(function(fixture) {
        testTransformWithFixture(transform, fixture);
    });
}

/**
 * Determines if the file name is *.input.js
 *
 * @param {string} name - file name
 * @returns {boolean} - does it match?
 * @private
*/
function inputsFilter(name) {
    return /\.input\.js$/.test(name);
}

/**
 * extracts <test-name> from <test-name>.input.js
 *
 * @param {string} name - file name
 * @returns {string} - the test name
 * @private
 */
function extractTestName(name) {
    return name.split(".").shift();
}


/**
 * Loads the transform module
 *
 * @param {string} name - the transform name
 * @returns {function} - the module
 * @private
 */
function loadTransformFn(name) {
    return require("../../lib/transforms/" + name);
}

/**
 * loads a transform object
 *
 * @param {string} name - the name of the tranform
 * @returns {object} - a transform object ({name, fn})
 * @private
 */
function loadTransform(name) {
    return {
        name: name,
        fn: loadTransformFn(name)
    };
}

/**
 * defines a test suite for a transform
 *
 * @param {object} transform - {name, fn}
 * @returns {void}
 */
function describeTransform(transform) {
    describe(transform.name, function() {
        var fixtureDir = path.join(fixturesRootPath, transform.name);
        var tests = fs
            .readdirSync(fixtureDir)
            .filter(inputsFilter)
            .map(extractTestName);
        testTransformWithFixtures(transform, tests);
    });
}

fs
.readdirSync(fixturesRootPath)
.map(loadTransform)
.forEach(describeTransform);

