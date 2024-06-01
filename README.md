# ESLint Transforms

A collection of jscodeshift transforms to help upgrade ESLint rules to new versions of [ESLint](https://github.com/eslint/eslint).
Supports [Node.js](https://nodejs.org) version 4 or above.

## Installation

You can install the ESLint transforms tool using [npm](https://npmjs.com):

```
$ npm install eslint-transforms --save-dev
```

## Usage

```
$ eslint-transforms <transform-name> <path>
```

Where:

`transform-name` - Name of the transform you want to run (e.g. `new-rule-format`). See the [transforms](#transforms) section below for a list of available transforms.

`path` - Files or directory to transform.

For more information on jscodeshift, check their official [docs](https://github.com/facebook/jscodeshift).

## Transforms

### new-rule-format

**Please note**: The transform will not work for rules that use ES6 modules syntax.

Transform that migrates an ESLint rule definition from the old format:

```javascript
module.exports = function(context) { ... }
```

to the new format, introduced in ESLint 2.10.0:

```javascript
module.exports = {
 meta: {
     docs: {},
     schema: []
 },
 create: function(context) { ... }
};
```

### v9-rule-migration

Transform that migrates an ESLint rule definition from the old Rule API:

```javascript
module.exports = {
    create(context) {
        return {
            Program(node) {
                const sourceCode = context.getSourceCode();
                const cwd = context.getCwd();
                const filename = context.getFilename();
                const physicalFilename = context.getPhysicalFilename();
                const sourceCodeText = context.getSource();
                const sourceLines = context.getSourceLines();
                const allComments = context.getAllComments();
                const nodeByRangeIndex = context.getNodeByRangeIndex();
                const commentsBefore = context.getCommentsBefore(node);
                const commentsAfter = context.getCommentsAfter(node);
                const commentsInside = context.getCommentsInside(node);
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
        };
    },
};
```

to the new [Rule API introduced in ESLint 9.0.0](https://eslint.org/blog/2023/09/preparing-custom-rules-eslint-v9/):

```javascript
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
        };
    },
};
```
