/**
 * Transform that migrates an ESLint rule definitions from the old format:
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
 *
 * @param {Object} fileInfo - holds information about the currently processed file.
 * @param {Object} api - exposes the jscodeshift api.
 * @returns {string} the new source code, after being transformed.
 */
export default function(fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // If there's already a module.exports.meta property, don't do anything and return
    const isAlreadyInNewFormat = root
        .find(j.Property)
        .filter(node => node.value.key.name === "meta" &&
                            node.parent.value.type === "ObjectExpression" &&
                            node.parent.parent.value.type === "AssignmentExpression" &&
                            node.parent.parent.value.left.type === "MemberExpression" &&
                            node.parent.parent.value.left.object.name === "module" &&
                            node.parent.parent.value.left.property.name === "exports")
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
    const isFunctionOrArrowFunctionExpression = node => {
        return node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression";
    };

    // for most plugins, the old format should be:
    // module.exports = function(context) { ... }
    // but maybe some plugins are using a diferent variable name instead of `context`
    const identifierNameForContextObject = root
        .find(j.AssignmentExpression)
        .filter(node => node.value.left.type === "MemberExpression" &&
                            node.value.left.property.name === "exports" &&
                            node.value.left.object.name === "module" &&
                            isFunctionOrArrowFunctionExpression(node.value.right))
        .get().value.right.params[0].name;


    // If the rule has a call for context.report and a property `fix` is being passed in,
    // then we consider that the rule is fixable:
    // context.report({
    //     ...
    //     fix: function() { ... }
    // });
    const isRuleFixable = root
        .find(j.Identifier)
        .filter(node => node.value.name === "fix" &&
                            node.parent.value.type === "Property" &&
                            node.parent.parent.parent.value.type === "CallExpression" &&
                            node.parent.parent.parent.value.callee.type === "MemberExpression" &&
                            node.parent.parent.parent.value.callee.object.name === identifierNameForContextObject &&
                            node.parent.parent.parent.value.callee.property.name === "report")
        .size() > 0;

    const createMetaObjectExpression = (schemaNode, schemaNodeComments) => {
        const properties = [
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
            const schemaNodeProperty = j.property("init", j.identifier("schema"), schemaNode);
            // Restore comments that were removed when the old format node was removed
            schemaNodeProperty.comments = schemaNodeComments;
            properties.push(schemaNodeProperty);
        }

        return j.objectExpression(properties);
    };

    const createExportsExpression = (ruleDefinitionNode, ruleDefinitionNodeComments, schemaNode, schemaNodeComments) => {
        const exportsExpression = j.expressionStatement(
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
    };

    // Find the schema definition, which will be in the format:
    // module.exports.schema = [ ... ];
    let schemaNode;
    let schemaNodeComments;
    root.find(j.AssignmentExpression)
        .filter(node => node.value.left.type === "MemberExpression" &&
                            node.value.left.property.name === "schema" &&
                            node.value.left.object.type === "MemberExpression" &&
                            node.value.left.object.object.name === "module" &&
                            node.value.left.object.property.name === "exports")
        // store a reference to it so we can re-construct it in the new format later
        .forEach(node => {
            schemaNode = node.value.right;
            // Store the comments too so we can attach it again later
            schemaNodeComments = node.parent.value.leadingComments;
        })
        .remove();

    // Find the rule definition, which will be in the format:
    // module.exports = function(context) { ... };
    let ruleDefinitionNode;
    let ruleDefinitionNodeComments;
    root.find(j.AssignmentExpression)
        .filter(node => node.value.left.type === "MemberExpression" &&
                            node.value.left.property.name === "exports" &&
                            node.value.left.object.name === "module" &&
                            isFunctionOrArrowFunctionExpression(node.value.right))
        // store a reference to it so we can re-construct it in the new format later
        .forEach(node => {
            ruleDefinitionNode = node.value.right;
            // Store the comments too so we can attach it again later
            ruleDefinitionNodeComments = node.parent.value.leadingComments;
        })
        .remove();

    // Insert the rule definition in the new format at the end of the file
    const newFormat = createExportsExpression(
        ruleDefinitionNode,
        ruleDefinitionNodeComments,
        schemaNode,
        schemaNodeComments
    );
    root.find(j.Program).get().value.body.push(newFormat);

    return root.toSource();
}
