tests that the transform works when the rule definition is wrapped in a function:

```js
module.exports = doSomething(function(context) {
   return { ... };
});
```