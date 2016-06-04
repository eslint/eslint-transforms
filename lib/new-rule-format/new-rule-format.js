/**
 * @fileoverview Transform that migrates an ESLint rule definitions from the old format:
 *
 * ```
 * module.exports = function(context) { ... }
 * ```
 *
 * to the new format:
 *
 * ```
 * module.exports = {
 *     meta: {
 *         docs: {},
 *         schema: []
 *     },
 *     create: function(context) { ... }
 * };
 * ```
 * @author Vitor Balocco
 * @copyright jQuery Foundation and other contributors, https://jquery.org/
 * MIT License
 */

"use strict";

/**
 * @param {Object} fileInfo - holds information about the currently processed file.
 * @param {Object} api - exposes the jscodeshift api.
 * @returns {String} the new source code, after being transformed.
 */
module.exports = function(fileInfo, api) {
    var j = api.jscodeshift;
    var root = j(fileInfo.source);

    // If there's already a module.exports.meta property, don't do anything and return
    var isAlreadyInNewFormat = root
        .find(j.Property)
        .filter(function(node) {
            return (
                node.value.key.name === "meta" &&
                node.parent.value.type === "ObjectExpression" &&
                node.parent.parent.value.type === "AssignmentExpression" &&
                node.parent.parent.value.left.type === "MemberExpression" &&
                node.parent.parent.value.left.object.name === "module" &&
                node.parent.parent.value.left.property.name === "exports"
            );
        })
        .size() > 0;
    if (isAlreadyInNewFormat) {
        return root.toSource();
    }

    /**
     * Checks if the node passed is a function expression or an arrow function expression
     *
     * @param {Object} node - node to check
     * @returns {Boolean} - `true` if node is a function or arrow function expression
     */
    function isFunctionOrArrowFunctionExpression(node) {
        return node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression";
    }

    /**
     * Checks if the node passed can be an "old format" rule definition
     *
     * @param {Object} node - node to check
     * @returns {Boolean} - `true` if node looks like an "old format" rule definition
     */
    function isOldFormatRuleDefinition(node) {
        return isFunctionOrArrowFunctionExpression(node) || node.type === "CallExpression";
    }

    /**
     * Returns the node in the source that is the rule definition in the old format
     *
     * @returns {Object} node - rule definition expression node
     */
    function getOldFormatRuleDefinition() {
        return root
            .find(j.AssignmentExpression)
            .filter(function(node) {
                return (
                    node.value.left.type === "MemberExpression" &&
                    node.value.left.property.name === "exports" &&
                    node.value.left.object.name === "module" &&
                    isOldFormatRuleDefinition(node.value.right)
                );
            });
    }

    // for most plugins, the old format should be:
    // module.exports = function(context) { ... }
    // but maybe some plugins are using a diferent variable name instead of `context`
    var ruleDefinitionExpression = getOldFormatRuleDefinition().get().value.right;
    var identifierNameForContextObject = "context";
    if (ruleDefinitionExpression.params && ruleDefinitionExpression.params.length > 0) {
        identifierNameForContextObject = ruleDefinitionExpression.params[0].name;
    }

    // If the rule has a call for context.report and a property `fix` is being passed in,
    // then we consider that the rule is fixable:
    // context.report({
    //     ...
    //     fix: function() { ... }
    // });
    var isRuleFixable = root
        .find(j.Identifier)
        .filter(function(node) {
            return (
                node.value.name === "fix" &&
                node.parent.value.type === "Property" &&
                node.parent.parent.parent.value.type === "CallExpression" &&
                node.parent.parent.parent.value.callee.type === "MemberExpression" &&
                node.parent.parent.parent.value.callee.object.name === identifierNameForContextObject &&
                node.parent.parent.parent.value.callee.property.name === "report"
            );
        })
        .size() > 0;

    /**
     * Creates the object expression node that will be the `meta` property of this rule
     *
     * @param {Object} schemaNode - node that was the schema definition in the old rule format
     * @param {Object} schemaNodeComments - comments that were above the old schema node
     * @returns {Object} ObjectExpression node
     */
    function createMetaObjectExpression(schemaNode, schemaNodeComments) {
        var properties = [
            // For docs, create just an empty object
            j.property("init", j.identifier("docs"), j.objectExpression([]))
        ];

        if (isRuleFixable) {
            properties.push(
                j.property("init", j.identifier("fixable"), j.literal("code"))
            );
        }

        // The schema definition may not exist in some plugins
        if (schemaNode) {
            var schemaNodeProperty = j.property("init", j.identifier("schema"), schemaNode);
            // Restore comments that were removed when the old format node was removed
            schemaNodeProperty.comments = schemaNodeComments;
            properties.push(schemaNodeProperty);
        }

        return j.objectExpression(properties);
    }

    /**
     * Creates the `exports` expression that wil contain the rule definition in the new format
     *
     * @param {Object} ruleDefinitionNode - node that was the rule definition in the old rule format
     * @param {Object} ruleDefinitionNodeComments - comments that were above the old schema rule definition
     * @param {Object} schemaNode - node that was the schema definition in the old rule format
     * @param {Object} schemaNodeComments - comments that were above the old schema node
     * @returns {Object} ExpressionStatement
     */
    function createExportsExpression(ruleDefinitionNode, ruleDefinitionNodeComments, schemaNode, schemaNodeComments) {
        var exportsExpression = j.expressionStatement(
            j.assignmentExpression(
                    "=",
                    j.memberExpression(j.identifier("module"), j.identifier("exports"), false),
                    j.objectExpression([
                        j.property("init", j.identifier("meta"), createMetaObjectExpression(schemaNode, schemaNodeComments)),
                        j.property("init", j.identifier("create"), ruleDefinitionNode)
                    ])
            )
        );

        // Restore comments that were removed when the old format node was removed
        exportsExpression.comments = ruleDefinitionNodeComments;

        return exportsExpression;
    }

    // Find the schema definition, which will be in the format:
    // module.exports.schema = [ ... ];
    var schemaNode;
    var schemaNodeComments;
    root.find(j.AssignmentExpression)
        .filter(function(node) {
            return (
                node.value.left.type === "MemberExpression" &&
                node.value.left.property.name === "schema" &&
                node.value.left.object.type === "MemberExpression" &&
                node.value.left.object.object.name === "module" &&
                node.value.left.object.property.name === "exports"
            );
        })
        // store a reference to it so we can re-construct it in the new format later
        .forEach(function(node) {
            schemaNode = node.value.right;
            // Store the comments too so we can attach it again later
            schemaNodeComments = node.parent.value.leadingComments;
        })
        .remove();

    // Find the rule definition, which will be in the format:
    // module.exports = function(context) { ... };
    var ruleDefinitionNode = getOldFormatRuleDefinition().get().value.right;
    var ruleDefinitionNodeComments = getOldFormatRuleDefinition().get().parent.value.leadingComments;
    getOldFormatRuleDefinition().remove();

    // Insert the rule definition in the new format at the end of the file
    var newFormat = createExportsExpression(
        ruleDefinitionNode,
        ruleDefinitionNodeComments,
        schemaNode,
        schemaNodeComments
    );
    root.find(j.Program).get().value.body.push(newFormat);

    return root.toSource();
};
