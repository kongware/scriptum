## Lazy Evaluation and WHNF in a Strictly Evaluated Setting

Lazy evaluation in the strict sense means that expressions are only evaluated

* when needed
* just enough
* once

The next sections will discuss each point in detail. Please note that we will later on also look at lazyness from a different angle and discuss it in a broader, less technical sense.

#### Normal order

Applicative order is the common evaluation strategie of imperative and multi-paradigm languages. It evaluates all subexpressions passed to a function as its arguments right before the function is called.

Normal order evaluaton passes argument subexpressions to functions as they are and proceeds with their evaluation only if the resuts are actually needed within the function body:

```javascript
const add = x => y => x + y;

const foo = add(2 + 3) (4 * 5); // A
                ^^^^^   ^^^^^
const main = foo + 0; // B
```
With normal evaluation order both subexpressions are not evaluated but passed to `add` as is (line `A`). However, in line `B` the evaluation is forced, because the result of the addition is needed. Let us further look into the evaluation process:

```javascript
// hypothetical normal evaluation order in Javascript

foo + 0

// first add's body is inlined with the unevaluated arguments

((2 + 3) + (4 * 5)) + 0

// then the resulting expression is further reduced to normal form

(5 + 20) + 0
25 + 0
25 // normal form
```
#### Weak Head Normal Form (WHNF)

Lazy evaluation also means to evaluate subexpressions just enough, that is to pause evaluation as early as possible. The evaluation can be paused when an expression has been evaluated to the outermost lambda abstraction. Such an expression in WHNF may contain unevaluated subexpressions. Taking the above example the add function call is in WHNF:

```javascript
// hypothetical WHNF in Javascript

// WHNF

add(2 + 3) (4 * 5)
add(2 + 3)

// not in WHNF

add(2 + 3) (4 * 5) + 1
```
The expression in the last line is not in WHNF, because the outermost level is not a lambda abstraction but the `+` operator with two operands. Hence, the expressions requires further evaluation. Since the `+ 1` part forces the full evaluation of the preceding function call, the expression is evaluated to normal form instead of WHNF.

#### Sharing

Lazy evaluation would be very inefficient if it had to evaluate the same subexpression each time it occurs in a function body. For that reason the result of once evaluated subexpressions is stored and shared within the same scope:

```javascript
const foo = x => [
  x + x,
  x - x,
  x * x];
  
foo(2 + 3); // A
```
As soon as the evaluation is forced the subexpression `2 + 3` is evaluated once and than shared inside `foo`.

### Lambda abstractions

When we talk about lazy evaluation in a broader sense then functions can be regarded as inherently lazy, because they are only evaluated when needed, namely when the required arguments are provided:

```javascript
const add = x => y => x + y,
  add2 = add(2);
```
#### Function composition

Pursuing this perspective function composition allows lazy evaluated arguments:

```javascript
const comp f => g =>
  x => f(g(x));
//       ^^^^  
```
`f`'s argument `g(x)` is only evaluated when `x` is provided.

#### Continuation passing style

Can we render function composition even more lazy?

```javascript
const compk = f => g => x => k =>
  k(f(g(x)));
  
const inc = x => x + 1;

const sqr = x => x * x;

const id = x => x;

const main = compk(
  sqr) (inc) (4);

// main is still unevaluated

main(id); // 25
```
[run code](https://repl.it/repls/AppropriateBestObjectmodel)

With CPS we are able to compose arbitrarily complex compositions of deferred function calls.

### Description of expressions

What are the practical implications of this sort of lazyness? Instead of writing expressions that are immediately evaluated up to their normal form we write description of expressions whose time of evaluation is totally up to us. Taking over control of when an expression is evaluated is a big deal. Imagine the code we describe is impure and will thus perform side effects once actually run. Since our description itself remains pure we are now able to defer these effects as long as possible. Keeping most parts of our code pure is a very desirable property, because it reduce the mental load to reason about it.

### Nullary functions and real thunks

Javascript pursues an eager evaluation strategy and thus lacks lazy evaluation in the strict sense, namely normal order, WHNF and sharing. Usually people use nullary functions to create a similar effect:

```javascript
const comp = f => g => x =>
  () => f(g(x));
```
This functions without arguments are also referred to as thunks in Javascript. Nullary functions are infectious, that is other functions have to be aware of and handle them appropriately. Can we do better? `Proxy` to the rescue:

```javascript
// simplified version

class ProxyHandler {
  constructor(f) {
    this.f = f;
    this.memo = undefined;
  }

  get(g, k) {
    if (this.memo === undefined)
      this.memo = g();

    if (typeof this.memo[k] === "function")
      return this.memo[k].bind(this.memo);

    else return this.memo[k];
  }
}

const thunk = f =>
  new Proxy(f, new ProxyHandler(f));
  
const log = x =>
  (console.log("log", x), x);

const add = x => y =>
  thunk(() => log(x + y));

const mul = x => y =>
  thunk(() => log(x * y));

const main = add(add(2) (3)) (mul(4) (5)); // WHNF
//               ^^^^^^^^^^   ^^^^^^^^^^^ not immediately evaluated

// nothing logged yet!

main + 0; // logs 5, 20, 25 and yields 25
```
[run code](https://repl.it/repls/FarawayImmediateSyntax)

This is the example from the beginning and it seems to behave in the same way as in a lazy evaluated language like Haskell. This is huge! However, before we get too excited let us verify how solid this approach is. As you can see we can mimic normal evaluation order and expressions in WHNF. Real lazy evaluation requires sharing. Can we deliver?

```javascript
const add = x => y =>
  thunk(() => log(x + y));

const foo = x => [
  x + x,
//^ at this point the thunk x is once evaluated and shared afterwards
  x - x,
  x * x];
  
foo(add(2) (3)); // logs 5 once and yields [10, 0, 25]
```
[run code](https://repl.it/repls/EasygoingUnhealthyAttribute)

The result of evaluating the thunk is shared indeed! Mimicking lazy evaluation is not an end in itself though. In which scenarios we can benefit from this evaluation strategy?

#### Guarded recursion for free

```javascript
const foldr = f => acc => ([x, ...xs]) =>
  x === undefined
    ? acc
    : f(x) (thunk(() => foldr(f) (acc) (xs))); // guarded recursion

const take = n => xs => {
  const go = (acc, [y, ys]) =>
    y === undefined || acc.length === n
      ? acc
      : go(arrAppend(acc) ([y]), ys);

  return go([], xs);
};

const arrAppend = xs => ys =>
  (xs.push.apply(xs, ys), xs);

const cons = head => tail => [head, tail];

const xs = [1, 2, 3, 4, 5];

const main = foldr(cons) ([]) (xs); // WHNF

take(3) (main); // [1, 2, 3]
```
[run code](https://repl.it/repls/ShadowyFlimsySmalltalk)

#### Infinite recursion

#### Value recursion

#### Forcing evaluation
