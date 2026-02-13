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
 */

"use strict";

const j = require("jscodeshift");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Returns `true` if the rule is already in the new format
 * @param {Object} rootNode where to look for the rule definition
 * @returns {boolean} `true` if rule is already in the new format
 */
function isAlreadyInNewFormat(rootNode) {
	// If there's already a module.exports.meta property, we assume the rule
	// is already in the new format.
	return (
		rootNode
			.find(j.Property)
			.filter(
				node =>
					node.value.key.name === "meta" &&
					node.parent.value.type === "ObjectExpression" &&
					node.parent.parent.value.type === "AssignmentExpression" &&
					node.parent.parent.value.left.type === "MemberExpression" &&
					node.parent.parent.value.left.object.name === "module" &&
					node.parent.parent.value.left.property.name === "exports",
			)
			.size() > 0
	);
}

/**
 * Checks if the node passed is a function expression or an arrow function expression
 * @param {Object} node node to check
 * @returns {boolean} - `true` if node is a function or arrow function expression
 */
function isFunctionOrArrowFunctionExpression(node) {
	return (
		node.type === "FunctionExpression" ||
		node.type === "ArrowFunctionExpression"
	);
}

/**
 * Checks if the node passed can be an "old format" rule definition
 * @param {Object} node node to check
 * @returns {boolean} - `true` if node looks like an "old format" rule definition
 */
function isOldFormatRuleDefinition(node) {
	return (
		isFunctionOrArrowFunctionExpression(node) ||
		node.type === "CallExpression"
	);
}

/**
 * Returns the node in `rootNode` that is the rule definition in the old format,
 * which will be in the format:
 * module.exports = function(context) { ... };
 * @param {Object} rootNode where to look for the rule definition node
 * @returns {Object} node - rule definition expression node
 */
function getOldFormatRuleDefinition(rootNode) {
	return rootNode
		.find(j.AssignmentExpression)
		.filter(
			node =>
				node.value.left.type === "MemberExpression" &&
				node.value.left.property.name === "exports" &&
				node.value.left.object.name === "module" &&
				isOldFormatRuleDefinition(node.value.right),
		);
}

/**
 * Returns the node in `rootNode` that is the schema definition in the old format,
 * which will be in the format:
 * module.exports.schema = [ ... ];
 * @param {Object} rootNode where to look for the rule definition node
 * @returns {Object} node - rule definition expression node
 */
function getOldFormatSchemaDefinition(rootNode) {
	return rootNode
		.find(j.AssignmentExpression)
		.filter(
			node =>
				node.value.left.type === "MemberExpression" &&
				node.value.left.property.name === "schema" &&
				node.value.left.object.type === "MemberExpression" &&
				node.value.left.object.object.name === "module" &&
				node.value.left.object.property.name === "exports",
		);
}

/**
 * Creates the object expression node that will be the `meta` property of this rule
 * @param {Object} schemaNode node that was the schema definition in the old rule format
 * @param {Object} schemaNodeComments comments that were above the old schema node
 * @param {boolean} isRuleFixable `true` if the rule is fixable
 * @returns {Object} ObjectExpression node
 */
function createMetaObjectExpression(
	schemaNode,
	schemaNodeComments,
	isRuleFixable,
) {
	const properties = [
		// For docs, create just an empty object
		j.property("init", j.identifier("docs"), j.objectExpression([])),
	];

	if (isRuleFixable) {
		properties.push(
			j.property("init", j.identifier("fixable"), j.literal("code")),
		);
	}

	// The schema definition may not exist in some plugins
	if (schemaNode) {
		const schemaNodeProperty = j.property(
			"init",
			j.identifier("schema"),
			schemaNode,
		);

		// Restore comments that were removed when the old format node was removed
		schemaNodeProperty.comments = schemaNodeComments;
		properties.push(schemaNodeProperty);
	}

	return j.objectExpression(properties);
}

/**
 * Creates the `exports` expression that wil contain the rule definition in the new format
 * @param {Object} ruleDefinitionNode node that was the rule definition in the old rule format
 * @param {Object} ruleDefinitionNodeComments comments that were above the old schema rule definition
 * @param {Object} ruleMetaDefinitionNode node that will be the meta definition expression
 * @returns {Object} ExpressionStatement
 */
function createExportsExpression(
	ruleDefinitionNode,
	ruleDefinitionNodeComments,
	ruleMetaDefinitionNode,
) {
	const exportsExpression = j.expressionStatement(
		j.assignmentExpression(
			"=",
			j.memberExpression(
				j.identifier("module"),
				j.identifier("exports"),
				false,
			),
			j.objectExpression([
				j.property(
					"init",
					j.identifier("meta"),
					ruleMetaDefinitionNode,
				),
				j.property("init", j.identifier("create"), ruleDefinitionNode),
			]),
		),
	);

	// Restore comments that were removed when the old format node was removed
	exportsExpression.comments = ruleDefinitionNodeComments;

	return exportsExpression;
}

//------------------------------------------------------------------------------
// Transform Definition
//------------------------------------------------------------------------------

/**
 * Transforms an ESLint rule from the old format to the new format.
 * @param {Object} fileInfo holds information about the currently processed file.
 * @returns {string} the new source code, after being transformed.
 */
module.exports = function (fileInfo) {
	const root = j(fileInfo.source);

	if (isAlreadyInNewFormat(root)) {
		// don't do anything and return
		return root.toSource();
	}

	// for most plugins, the old format should be:
	// module.exports = function(context) { ... }
	// but maybe some plugins are using a diferent variable name instead of `context`
	const ruleDefinitionExpression =
		getOldFormatRuleDefinition(root).get().value.right;
	let identifierNameForContextObject = "context";

	if (
		ruleDefinitionExpression.params &&
		ruleDefinitionExpression.params.length > 0
	) {
		identifierNameForContextObject =
			ruleDefinitionExpression.params[0].name;
	}

	// If the rule has a call for context.report and a property `fix` is being passed in,
	// then we consider that the rule is fixable:
	// context.report({
	//     ...
	//     fix: function() { ... }
	// });
	const isRuleFixable =
		root
			.find(j.Identifier)
			.filter(
				node =>
					node.value.name === "fix" &&
					node.parent.value.type === "Property" &&
					node.parent.parent.parent.value.type === "CallExpression" &&
					node.parent.parent.parent.value.callee.type ===
						"MemberExpression" &&
					node.parent.parent.parent.value.callee.object.name ===
						identifierNameForContextObject &&
					node.parent.parent.parent.value.callee.property.name ===
						"report",
			)
			.size() > 0;

	const oldFormatSchemaDefinition = getOldFormatSchemaDefinition(root);
	let schemaNode, schemaNodeComments;

	// The schema definition may not exist in some plugins
	if (oldFormatSchemaDefinition.size() > 0) {
		schemaNode = getOldFormatSchemaDefinition(root).get().value.right;

		// Store the comments too so we can attach it again later
		schemaNodeComments =
			getOldFormatSchemaDefinition(root).get().parent.value
				.leadingComments;
		getOldFormatSchemaDefinition(root).remove();
	}

	const ruleDefinitionNode =
		getOldFormatRuleDefinition(root).get().value.right;

	// Store the comments too so we can attach it again later
	const ruleDefinitionNodeComments =
		getOldFormatRuleDefinition(root).get().parent.value.leadingComments;

	getOldFormatRuleDefinition(root).remove();

	// Insert the rule definition in the new format at the end of the file
	const newFormat = createExportsExpression(
		ruleDefinitionNode,
		ruleDefinitionNodeComments,
		createMetaObjectExpression(
			schemaNode,
			schemaNodeComments,
			isRuleFixable,
		),
	);

	root.find(j.Program).get().value.body.push(newFormat);
	return root.toSource();
};
