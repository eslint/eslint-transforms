/**
 * @fileoverview Tests for v9-migration transform.
 * @author Nitin Kumar
 * MIT License
 */

"use strict";

const { applyTransform } = require("@hypermod/utils");
const assert = require("assert");

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
            `.trim()
        );
    });

    it.only("should warn about codePath.currentSegments", async () => {
        await applyTransform(
            v9MigrationTransform,
            `
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
        );

        // assert.strictEqual(
        //     result,
        //     `
        //     const sourceCode = context.sourceCode.getText();
        //     const sourceLines = context.sourceCode.getLines();
        //     const allComments = context.sourceCode.getAllComments();
        //     const nodeByRangeIndex = context.sourceCode.getNodeByRangeIndex();
        //     const commentsBefore = context.sourceCode.getCommentsBefore(nodeOrToken);
        //     const commentsAfter = context.sourceCode.getCommentsAfter(nodeOrToken);
        //     `.trim()
        // );
    });
});
