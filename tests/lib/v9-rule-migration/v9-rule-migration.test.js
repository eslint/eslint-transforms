/**
 * @fileoverview Tests for v9-rule-migration transform.
 * @author Nitin Kumar
 * MIT License
 */

"use strict";

const path = require("node:path");
const { applyTransform } = require("@hypermod/utils");
const assert = require("node:assert");
const sinon = require("sinon");
const { normalizeLineEndings } = require("../../utils");
const v9MigrationTransform = require("../../../lib/v9-rule-migration/v9-rule-migration");

describe("v9 migration transform", () => {
	it("should migrate deprecated context methods to new properties", async () => {
		const result = await applyTransform(
			v9MigrationTransform,
			`
            module.exports = {
                create(context) {
                    return {
                        Program(node) {
                            const sourceCode = context.getSourceCode();
                            const cwd = context.getCwd();
                            const filename = context.getFilename();
                            const physicalFilename = context.getPhysicalFilename();
                        },

                        FunctionDeclaration(node) {
                            const _sourceCode = context.getSourceCode();
                            const _cwd = context.getCwd();
                            const _filename = context.getFilename();
                            const _physicalFilename = context.getPhysicalFilename();
                        }
                    };
                }
            };
            `,
		);

		assert.strictEqual(
			normalizeLineEndings(result),
			normalizeLineEndings(
				`
            module.exports = {
                create(context) {
                    const physicalFilename = context.physicalFilename ?? context.getPhysicalFilename();
                    const filename = context.filename ?? context.getFilename();
                    const cwd = context.cwd ?? context.getCwd();
                    const sourceCode = context.sourceCode ?? context.getSourceCode();
                    return {
                        Program(node) {},

                        FunctionDeclaration(node) {
                            const _sourceCode = sourceCode;
                            const _cwd = cwd;
                            const _filename = filename;
                            const _physicalFilename = physicalFilename;
                        }
                    };
                }
            };
            `.trim(),
			),
		);
	});

	it("should migrate deprecated context methods to new properties #2", async () => {
		const result = await applyTransform(
			v9MigrationTransform,
			`
            module.exports = {
                create(context) {
                    const sourceCode = context.getSourceCode();
                    const cwd = context.getCwd();
                    const filename = context.getFilename();
                    const physicalFilename = context.getPhysicalFilename();
                    return {
                        Program(node) {},
                    };
                }
            };
            `,
		);

		assert.strictEqual(
			normalizeLineEndings(result),
			normalizeLineEndings(
				`
            module.exports = {
                create(context) {
                    const physicalFilename = context.physicalFilename ?? context.getPhysicalFilename();
                    const filename = context.filename ?? context.getFilename();
                    const cwd = context.cwd ?? context.getCwd();
                    const sourceCode = context.sourceCode ?? context.getSourceCode();
                    return {
                        Program(node) {},
                    };
                }
            };
            `.trim(),
			),
		);
	});

	it("should migrate deprecated context methods to SourceCode", async () => {
		const result = await applyTransform(
			v9MigrationTransform,
			`
            module.exports = {
                create(context) {
                    return {
                        Program(node) {
                            const sourceCodeText = context.getSource();
                            const sourceLines = context.getSourceLines();
                            const allComments = context.getAllComments();
                            const nodeByRangeIndex = context.getNodeByRangeIndex();
                            const commentsBefore = context.getCommentsBefore(nodeOrToken);
                            const commentsAfter = context.getCommentsAfter(nodeOrToken);
                            const commentsInside = context.getCommentsInside(nodeOrToken);
                            const jsDocComment = context.getJSDocComment();
                            const firstToken = context.getFirstToken(node);
                            const firstTokens = context.getFirstTokens(node);
                            const lastToken = context.getLastToken(node);
                            const lastTokens = context.getLastTokens(node);
                            const tokenAfter = context.getTokenAfter(node);
                            const tokenBefore = context.getTokenBefore(node);
                            const tokenByRangeStart = context.getTokenByRangeStart(node);
                            const getTokens = context.getTokens(node);
                            const tokensAfter = context.getTokensAfter(node);
                            const tokensBefore = context.getTokensBefore(node);
                            const tokensBetween = context.getTokensBetween(node);
                            const parserServices = context.parserServices;
                        },

                        FunctionDeclaration(node) {
                            const sourceCodeText = context.getSourceCode().getText();
                            const sourceLines = context.getSourceCode().getLines();
                            const allComments = context.getSourceCode().getAllComments();
                            const nodeByRangeIndex = context.getSourceCode().getNodeByRangeIndex();
                            const commentsBefore = context.getSourceCode().getCommentsBefore(node);
                            const commentsAfter = context.getSourceCode().getCommentsAfter(node);
                            const commentsInside = context.getSourceCode().getCommentsInside(node);
                            const jsDocComment = context.getSourceCode().getJSDocComment();
                            const firstToken = context.getSourceCode().getFirstToken(node);
                            const firstTokens = context.getSourceCode().getFirstTokens(node);
                            const lastToken = context.getSourceCode().getLastToken(node);
                            const lastTokens = context.getSourceCode().getLastTokens(node);
                            const tokenAfter = context.getSourceCode().getTokenAfter(node);
                            const tokenBefore = context.getSourceCode().getTokenBefore(node);
                            const tokenByRangeStart = context.getSourceCode().getTokenByRangeStart(node);
                            const getTokens = context.getSourceCode().getTokens(node);
                            const tokensAfter = context.getSourceCode().getTokensAfter(node);
                            const tokensBefore = context.getSourceCode().getTokensBefore(node);
                            const tokensBetween = context.getSourceCode().getTokensBetween(node);
                            const parserServices = context.getSourceCode().parserServices;
                        },
                    };
                }
            };
            `,
		);

		assert.strictEqual(
			normalizeLineEndings(result),
			normalizeLineEndings(
				`
            module.exports = {
                create(context) {
                    const sourceCode = context.sourceCode ?? context.getSourceCode();
                    return {
                        Program(node) {
                            const sourceCodeText = sourceCode.getText();
                            const sourceLines = sourceCode.getLines();
                            const allComments = sourceCode.getAllComments();
                            const nodeByRangeIndex = sourceCode.getNodeByRangeIndex();
                            const commentsBefore = sourceCode.getCommentsBefore(nodeOrToken);
                            const commentsAfter = sourceCode.getCommentsAfter(nodeOrToken);
                            const commentsInside = sourceCode.getCommentsInside(nodeOrToken);
                            const jsDocComment = sourceCode.getJSDocComment();
                            const firstToken = sourceCode.getFirstToken(node);
                            const firstTokens = sourceCode.getFirstTokens(node);
                            const lastToken = sourceCode.getLastToken(node);
                            const lastTokens = sourceCode.getLastTokens(node);
                            const tokenAfter = sourceCode.getTokenAfter(node);
                            const tokenBefore = sourceCode.getTokenBefore(node);
                            const tokenByRangeStart = sourceCode.getTokenByRangeStart(node);
                            const getTokens = sourceCode.getTokens(node);
                            const tokensAfter = sourceCode.getTokensAfter(node);
                            const tokensBefore = sourceCode.getTokensBefore(node);
                            const tokensBetween = sourceCode.getTokensBetween(node);
                            const parserServices = sourceCode.parserServices;
                        },

                        FunctionDeclaration(node) {
                            const sourceCodeText = sourceCode.getText();
                            const sourceLines = sourceCode.getLines();
                            const allComments = sourceCode.getAllComments();
                            const nodeByRangeIndex = sourceCode.getNodeByRangeIndex();
                            const commentsBefore = sourceCode.getCommentsBefore(node);
                            const commentsAfter = sourceCode.getCommentsAfter(node);
                            const commentsInside = sourceCode.getCommentsInside(node);
                            const jsDocComment = sourceCode.getJSDocComment();
                            const firstToken = sourceCode.getFirstToken(node);
                            const firstTokens = sourceCode.getFirstTokens(node);
                            const lastToken = sourceCode.getLastToken(node);
                            const lastTokens = sourceCode.getLastTokens(node);
                            const tokenAfter = sourceCode.getTokenAfter(node);
                            const tokenBefore = sourceCode.getTokenBefore(node);
                            const tokenByRangeStart = sourceCode.getTokenByRangeStart(node);
                            const getTokens = sourceCode.getTokens(node);
                            const tokensAfter = sourceCode.getTokensAfter(node);
                            const tokensBefore = sourceCode.getTokensBefore(node);
                            const tokensBetween = sourceCode.getTokensBetween(node);
                            const parserServices = sourceCode.parserServices;
                        },
                    };
                }
            };
            `.trim(),
			),
		);
	});

	it("should migrate recently added methods on sourceCode with signature change", async () => {
		const result = await applyTransform(
			v9MigrationTransform,
			`
            module.exports = {
                create(context) {
                    return {
                        Program(node) {
                            const scope = context.getScope();
                            const result = context.markVariableAsUsed("foo");
                            const statements = context.getAncestors().filter(node => node.endsWith("Statement"));
                        },

                        MemberExpression(memberExpressionNode) {
                            const ancestor = context.getAncestors();
                        },

                        FunctionDeclaration(functionDeclarationNode) {
                            const declaredVariables = context.getDeclaredVariables();
                        },
                    };
                }
            };
            `,
		);

		assert.strictEqual(
			normalizeLineEndings(result),
			normalizeLineEndings(
				`
            module.exports = {
                create(context) {
                    const sourceCode = context.sourceCode ?? context.getSourceCode();
                    return {
                        Program(node) {
                            const scope = sourceCode.getScope ? sourceCode.getScope(node) : context.getScope();
                            const result = sourceCode.markVariableAsUsed ? sourceCode.markVariableAsUsed("foo", node) : context.markVariableAsUsed();
                            const statements = (sourceCode.getAncestors ? sourceCode.getAncestors(node) : context.getAncestors()).filter(node => node.endsWith("Statement"));
                        },

                        MemberExpression(memberExpressionNode) {
                            const ancestor = sourceCode.getAncestors ? sourceCode.getAncestors(memberExpressionNode) : context.getAncestors();
                        },

                        FunctionDeclaration(functionDeclarationNode) {
                            const declaredVariables = sourceCode.getDeclaredVariables ? sourceCode.getDeclaredVariables(functionDeclarationNode) : context.getDeclaredVariables();
                        },
                    };
                }
            };
            `.trim(),
			),
		);
	});

	it("should warn about context.getComments()", async () => {
		const spy = sinon.spy(console, "warn");

		await applyTransform(v9MigrationTransform, {
			source: "const comments = context.getComments();",
			path: path.resolve(__dirname, __filename),
		});

		assert.strictEqual(spy.callCount, 1);
		assert.match(
			spy.args[0][0],
			/1:17 The "getComments\(\)" method has been removed. Please use "getCommentsBefore\(\)", "getCommentsAfter\(\)", or "getCommentsInside\(\)" instead/u,
		);

		spy.restore();
	});

	it("should warn about codePath.currentSegments", async () => {
		const spy = sinon.spy(console, "warn");
		const filePath = path.resolve(__dirname, __filename);

		await applyTransform(v9MigrationTransform, {
			path: filePath,
			source: `
                module.exports = {
                    meta: {
                        docs: {},
                        schema: []
                    },
                    create(context) {
                        return {
                            onCodePathStart(codePath, node) {
                                const currentSegments = codePath.currentSegments();
                            },
                            
                            onCodePathEnd(endCodePath, node) {
                                const currentSegments = endCodePath.currentSegments();
                            },
                        };
                    }
                }
                `,
		});

		assert.strictEqual(spy.callCount, 2);
		assert.match(
			spy.args[0][0],
			/10:56 The "CodePath#currentSegments" property has been removed and it can't be migrated automatically/u,
		);
		assert.match(
			spy.args[1][0],
			/14:56 The "CodePath#currentSegments" property has been removed and it can't be migrated automatically/u,
		);

		spy.restore();
	});
});
