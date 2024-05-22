/**
 * @fileoverview Transform that migrates an ESLint API from v8 to v9
 * Refer to https://github.com/eslint/eslint-transforms/issues/25 for more information
 *
 * @author Nitin Kumar
 */

"use strict";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Formats a message string with ANSI escape codes to display it in yellow with bold styling in the terminal.
 * @param {string} message The message to be formatted.
 * @returns {string} The formatted message string.
 */
function formatBoldYellow(message) {
    return `\u001b[1m\u001b[33m${message}\u001b[39m\u001b[22m`;
}

const contextMethodsToPropertyMapping = {
    getSourceCode: "sourceCode",
    getFilename: "filename",
    getPhysicalFilename: "physicalFilename",
    getCwd: "cwd"
};

const contextToSourceCodeMapping = {
    getSource: "getText",
    getSourceLines: "getLines",
    getAllComments: "getAllComments",
    getNodeByRangeIndex: "getNodeByRangeIndex",
    getComments: "getComments",
    getCommentsBefore: "getCommentsBefore",
    getCommentsAfter: "getCommentsAfter",
    getCommentsInside: "getCommentsInside",
    getJSDocComment: "getJSDocComment",
    getFirstToken: "getFirstToken",
    getFirstTokens: "getFirstTokens",
    getLastToken: "getLastToken",
    getLastTokens: "getLastTokens",
    getTokenAfter: "getTokenAfter",
    getTokenBefore: "getTokenBefore",
    getTokenByRangeStart: "getTokenByRangeStart",
    getTokens: "getTokens",
    getTokensAfter: "getTokensAfter",
    getTokensBefore: "getTokensBefore",
    getTokensBetween: "getTokensBetween",
    parserServices: "parserServices",
    getDeclaredVariables: "getDeclaVariables"
};

//------------------------------------------------------------------------------
// Transform Definition
//------------------------------------------------------------------------------

/**
 * Transforms an ESLint rule from the old format to the new format.
 * @param {Object} fileInfo holds information about the currently processed file.
 * * @param {Object} api holds the jscodeshift API
 * @returns {string} the new source code, after being transformed.
 */

module.exports = function(fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // Update context methods
    // context.getSourceCode() -> context.sourceCode ?? context.getSourceCode()
    root.find(j.CallExpression, {
        callee: {
            object: {
                type: "Identifier",
                name: "context"
            },
            property: {
                type: "Identifier",
                name: name =>
                    Object.keys(contextMethodsToPropertyMapping).includes(name)
            }
        }
    }).replaceWith(({ node }) => {
        const method = node.callee.property.name;
        const args = node.arguments;

        return j.logicalExpression(
            "??",
            j.memberExpression(
                j.identifier("context"),
                j.identifier(contextMethodsToPropertyMapping[method])
            ),
            j.callExpression(
                j.memberExpression(
                    j.identifier("context"),
                    j.identifier(method)
                ),
                [...args]
            )
        );
    });

    // Move context methods to SourceCode
    // context.getSource() -> context.sourceCode.getText()
    root.find(j.MemberExpression, {
        object: {
            type: "Identifier",
            name: "context"
        },
        property: {
            type: "Identifier",
            name: name =>
                Object.keys(contextToSourceCodeMapping).includes(name)
        }
    }).replaceWith(({ node }) => {
        const method = node.property.name;

        if (method === "getComments") {
            // eslint-disable-next-line no-console -- This is an intentional warning message
            console.warn(
                formatBoldYellow(
                    `${fileInfo.path}:${node.loc.start.line}:${node.loc.start.column} The "getComments()" method has been removed. Please use "getCommentsBefore()", "getCommentsAfter()", or "getCommentsInside()" instead. https://eslint.org/docs/latest/use/migrate-to-9.0.0#-removed-sourcecodegetcomments`
                )
            );
            return node;
        }

        node.property.name = contextToSourceCodeMapping[method];
        node.object.name = "context.sourceCode";

        return node;
    });

    // Warn for codePath.currentSegments
    root.find(j.Property, {
        key: {
            type: "Identifier",
            name: name =>
                name === "onCodePathStart" || name === "onCodePathEnd"
        }
    })
        .find(j.MemberExpression, {
            property: {
                type: "Identifier",
                name: "currentSegments"
            }
        })
        .forEach(({ node }) => {
            // eslint-disable-next-line no-console -- This is an intentional warning message
            console.warn(
                formatBoldYellow(
                    `${fileInfo.path}:${node.loc.start.line}:${node.loc.start.column} The "CodePath#currentSegments" property has been removed and it can't be migrated automatically.\nPlease read https://eslint.org/blog/2023/09/preparing-custom-rules-eslint-v9/#codepath%23currentsegments for more information.\n`
                )
            );
        });

    return root.toSource();
};
