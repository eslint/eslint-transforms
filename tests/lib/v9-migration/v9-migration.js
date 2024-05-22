/**
 * @fileoverview Tests for v9-migration transform.
 * @author Nitin Kumar
 * MIT License
 */

"use strict";

const path = require("path");
const { applyTransform } = require("@hypermod/utils");
const assert = require("assert");
const sinon = require("sinon");
const v9MigrationTransform = require("../../../lib/v9-migration/v9-migration");

describe("v9 migration transform", () => {
    it("should migrate deprecated context methods to new properties", async () => {
        const result = await applyTransform(
            v9MigrationTransform,
            `
            const sourceCode = context.getSourceCode();
            const cwd = context.getCwd();
            const filename = context.getFilename();
            const physicalFilename = context.getPhysicalFilename();
            `
        );

        assert.strictEqual(
            result,
            `
            const sourceCode = context.sourceCode ?? context.getSourceCode();
            const cwd = context.cwd ?? context.getCwd();
            const filename = context.filename ?? context.getFilename();
            const physicalFilename = context.physicalFilename ?? context.getPhysicalFilename();
            `.trim()
        );
    });

    it("should migrate deprecated context methods to SourceCode", async () => {
        const result = await applyTransform(
            v9MigrationTransform,
            `
            const sourceCode = context.getSource();
            const sourceLines = context.getSourceLines();
            const allComments = context.getAllComments();
            const nodeByRangeIndex = context.getNodeByRangeIndex();
            const commentsBefore = context.getCommentsBefore(nodeOrToken);
            const commentsAfter = context.getCommentsAfter(nodeOrToken);
            const commentsInside = context.getCommentsInside(nodeOrToken);
            `
        );

        assert.strictEqual(
            result,
            `
            const sourceCode = context.sourceCode.getText();
            const sourceLines = context.sourceCode.getLines();
            const allComments = context.sourceCode.getAllComments();
            const nodeByRangeIndex = context.sourceCode.getNodeByRangeIndex();
            const commentsBefore = context.sourceCode.getCommentsBefore(nodeOrToken);
            const commentsAfter = context.sourceCode.getCommentsAfter(nodeOrToken);
            const commentsInside = context.sourceCode.getCommentsInside(nodeOrToken);
            `.trim()
        );
    });

    it("should warn about context.getComments()", async () => {
        const spy = sinon.spy(console, "warn");

        await applyTransform(
            v9MigrationTransform,
            {
                source: "const comments = context.getComments();",
                path: path.resolve(__dirname, __filename)
            }
        );

        assert.strictEqual(spy.callCount, 1);
        assert.match(
            spy.args[0][0],
            /1:17 The "getComments\(\)" method has been removed. Please use "getCommentsBefore\(\)", "getCommentsAfter\(\)", or "getCommentsInside\(\)" instead/u
        );

        spy.restore();
    });

    it("should warn about codePath.currentSegments", async () => {
        const spy = sinon.spy(console, "warn");
        const filePath = path.resolve(__dirname, __filename);

        await applyTransform(
            v9MigrationTransform,
            {
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
                `
            }
        );

        assert.strictEqual(spy.callCount, 2);
        assert.match(
            spy.args[0][0],
            /10:56 The "CodePath#currentSegments" property has been removed and it can't be migrated automatically/u
        );
        assert.match(
            spy.args[1][0],
            /14:56 The "CodePath#currentSegments" property has been removed and it can't be migrated automatically/u
        );

        spy.restore();
    });
});
