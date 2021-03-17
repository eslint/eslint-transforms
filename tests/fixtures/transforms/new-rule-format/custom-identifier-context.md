tests that the transform can handle rules that use an identifier for the "context" object that is not "context", e.g.:

```js
customContextName.report({ ... });
```