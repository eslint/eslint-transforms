# ESLint Transforms

A collection of jscodeshift transforms to help upgrade ESLint rules to new versions of [ESLint](https://github.com/eslint/eslint).

## Installation

You can install the ESLint transforms tool using [npm](https://npmjs.com):

```
$ npm install eslint-transforms --save-dev
```

## Usage

```
$ eslint-transforms <transform-name> <path>
```

or

```
$ npm run <transform-name> -- <path>
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
