[Editor's note: Under construction]

### Functional Programming Library Documentation

`_let`

Declares a local binding by taking one or several (expensive) expressions and a multi argument function and feeds the expression results to the latter. This is especially helpful, if you need the result in the following computation more than once but don't want to leak the intermediate values into the global scope:

```javascript
_let(3 * 3)
  .in(fun(
    n => n + n,
    "Number => Number")); // 18
```
