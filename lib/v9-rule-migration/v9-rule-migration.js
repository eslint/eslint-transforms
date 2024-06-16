/**
 * @fileoverview Transform that migrates an ESLint API from v8 to v9
 * Refer to https://github.com/eslint/eslint-transforms/issues/25 for more information
 *
 * @author Nitin Kumar
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
const path = require("node:path");

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
    getScope: "getScope",
    getAncestors: "getAncestors",
    getDeclaredVariables: "getDeclaredVariables",
    markVariableAsUsed: "markVariableAsUsed",
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
    parserServices: "parserServices"
};

const METHODS_WITH_SIGNATURE_CHANGE = new Set([
    "getScope",
    "getAncestors",
    "markVariableAsUsed",
    "getDeclaredVariables"
]);

/**
 * Returns the parent ObjectMethod node
 * @param {Node} nodePath The nodePath of the current node
 * @returns {Node} The parent ObjectMethod node
 */
function getParentObjectMethod(nodePath) {
    if (!nodePath) {
        return null;
    }

    const node = nodePath.node;

    if (node.type && node.type === "Property" && node.method) {
        return node;
    }

    return getParentObjectMethod(nodePath.parentPath);
}

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
    const USED_CONTEXT_METHODS = new Set();

    /**
     * Adds a variable declaration for the context method immediately inside the create() method
     * @param {string} methodName The name of the context method
     * @param {Array} args The arguments to be passed to the context method
     * @returns {void}
     */
    function addContextMethodVariableDeclaration(methodName, args = []) {
        if (USED_CONTEXT_METHODS.has(methodName)) {
            return;
        }

        root.find(j.Property, {
            key: { name: "create" }
        }).replaceWith(({ node: createNode }) => {
            const contextMethodDeclaration = j.variableDeclaration("const", [
                j.variableDeclarator(
                    j.identifier(contextMethodsToPropertyMapping[methodName]),
                    j.logicalExpression(
                        "??",
                        j.memberExpression(
                            j.identifier("context"),
                            j.identifier(
                                contextMethodsToPropertyMapping[methodName]
                            )
                        ),
                        j.callExpression(
                            j.memberExpression(
                                j.identifier("context"),
                                j.identifier(methodName)
                            ),
                            [...args]
                        )
                    )
                )
            ]);

            // Insert the sourceCodeDeclaration at the beginning of the create() method
            createNode.value.body.body.unshift(contextMethodDeclaration);
            USED_CONTEXT_METHODS.add(methodName);

            return createNode;
        });
    }

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

        addContextMethodVariableDeclaration(method, args);

        // If the method is already declared as a variable in the create() method
        // Replace all instances of context methods with corresponding variable
        if (USED_CONTEXT_METHODS.has(method)) {
            return j.identifier(contextMethodsToPropertyMapping[method]);
        }

        // Otherwise, create a variable declaration for the method
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
                args
            )
        );
    });

    // Remove the variable declarations which have value same as the declaration
    // const sourceCode = sourceCode -> Remove
    root.find(j.VariableDeclaration, {
        declarations: [
            {
                type: "VariableDeclarator",
                id: {
                    type: "Identifier",
                    name: name =>
                        Object.values(contextMethodsToPropertyMapping).includes(
                            name
                        )
                },
                init: {
                    type: "Identifier"
                }
            }
        ]
    })
        .filter(
            ({ node }) =>
                node.declarations[0].id.name === node.declarations[0].init.name
        )
        .remove();

    // Move context methods to SourceCode
    // context.getSource() -> sourceCode.getText()
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            object: {
                type: "Identifier",
                name: "context"
            },
            property: {
                type: "Identifier",
                name: name =>
                    Object.keys(contextToSourceCodeMapping).includes(name)
            }
        }
    }).replaceWith(nodePath => {
        const node = nodePath.node;
        const method = node.callee.property.name;
        const args = node.arguments;

        if (method === "getComments") {
            // eslint-disable-next-line no-console -- This is an intentional warning message
            console.warn(
                formatBoldYellow(
                    `${path.relative(process.cwd(), fileInfo.path)}:${
                        node.loc.start.line
                    }:${
                        node.loc.start.column
                    } The "getComments()" method has been removed. Please use "getCommentsBefore()", "getCommentsAfter()", or "getCommentsInside()" instead. https://eslint.org/docs/latest/use/migrate-to-9.0.0#-removed-sourcecodegetcomments`
                )
            );
            return node;
        }

        // Add variable declaration for the method if not already added
        addContextMethodVariableDeclaration("getSourceCode");

        if (METHODS_WITH_SIGNATURE_CHANGE.has(method)) {
            const parentObjectMethodNode = getParentObjectMethod(nodePath);
            const parentObjectMethodParamName =
                parentObjectMethodNode &&
                parentObjectMethodNode.value.params[0].name;

            // Return the node as is if the method is called with an argument
            // context.getScope(node) -> sourceCode.getScope  ? sourceCode.getScope(node) : context.getScope();
            return j.conditionalExpression(
                j.memberExpression(
                    j.identifier("sourceCode"),
                    j.identifier(contextToSourceCodeMapping[method])
                ),
                j.callExpression(
                    j.memberExpression(
                        j.identifier("sourceCode"),
                        j.identifier(contextToSourceCodeMapping[method])
                    ),
                    parentObjectMethodParamName
                        ? [...args, j.identifier(parentObjectMethodParamName)]
                        : args
                ),
                j.callExpression(
                    j.memberExpression(
                        j.identifier("context"),
                        j.identifier(method)
                    ),
                    []
                )
            );
        }

        node.callee.property.name = contextToSourceCodeMapping[method];
        node.callee.object.name = "sourceCode";

        return node;
    });

    // Migrate context.parserServices to sourceCode.parserServices
    root.find(j.MemberExpression, {
        object: {
            type: "Identifier",
            name: "context"
        },
        property: {
            type: "Identifier",
            name: "parserServices"
        }
    }).replaceWith(({ node }) => {
        node.object.name = "sourceCode";
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
                    `${path.relative(process.cwd(), fileInfo.path)}:${
                        node.loc.start.line
                    }:${
                        node.loc.start.column
                    } The "CodePath#currentSegments" property has been removed and it can't be migrated automatically.\nPlease read https://eslint.org/blog/2023/09/preparing-custom-rules-eslint-v9/#codepath%23currentsegments for more information.\n`
                )
            );
        });

    return root.toSource();
};
