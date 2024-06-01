"use strict";

const os = require("os");

/**
 * Returns a new string with all the EOL markers from the string passed in
 * replaced with the Operating System specific EOL marker.
 * Useful for guaranteeing two transform outputs have the same EOL marker format.
 * @param {string} input the string which will have its EOL markers replaced
 * @returns {string} a new string with all EOL markers replaced
 * @private
 */
function normalizeLineEndings(input) {
    return input.replace(/(\r\n|\n|\r)/gmu, os.EOL);
}

module.exports = {
    normalizeLineEndings
};
