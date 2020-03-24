## Lazy Evaluation on Demand

Lazy evaluation means that expressions are evaluated

* only when needed
* just enough
* only once

The next sections will discuss each point in detail.

#### Normal order evaluation

Applicative order is the common evaluation strategy of imperative and multi-paradigm languages. It evaluates all subexpressions passed to a function as its arguments right before the function is called.

Normal order evaluation passes argument subexpressions to functions as they are and proceeds with their evaluation only if the results are actually needed within the function body:

```javascript
// hypothetical normal evaluation order in Javascript

const add = x => y => x + y;

const foo = add(2 + 3) (4 * 5); // A
                ^^^^^   ^^^^^ subexpressions
const main = foo + 0; // B
```
With normal evaluation order both subexpressions are not evaluated but passed to `add` as is (line `A`). However, in line `B` the evaluation is forced, because the result of the addition is needed. Let us further look into the evaluation process:

```javascript
foo + 0

// first add's body is inlined with the unevaluated arguments

((2 + 3) + (4 * 5)) + 0

// then the resulting expression is further reduced to normal form

(5 + 20) + 0
25 + 0
25 // normal form
```
#### Weak Head Normal Form (WHNF)

Lazy evaluation also means to evaluate subexpressions just enough, that is to pause evaluation as early as possible. An expression need not to be further reduced when the outermost level is a lambda abstraction. Such an expression is in WHNF, that is it may contain unevaluated subexpressions referred to as thunks. Taking the above example the add function call is in WHNF:

```javascript
// hypothetical WHNF in Javascript

// WHNF

add(2 + 3) (4 * 5)
add(2 + 3)

// not in WHNF

add(2 + 3) (4 * 5) + 1
```
The expression in the last line is not in WHNF, because the outermost level is not a lambda abstraction but the `+` operator with two operands. Hence the expressions require further reduction. Since the `+` operator eagerly requires both operands to be fully evaluated the preceding `add` function call is forced to normal form.

#### Sharing

Lazy evaluation would be very inefficient if it had to evaluate the same subexpression each time it occurs in a function body. For that reason the result of once evaluated subexpressions is stored and shared within the same scope:

```javascript
const foo = x => [
  x + x,
  x - x,
  x * x];
  
foo(2 + 3);
```
The invocation of `foo` triggers the evaluation of `2 + 3` only once, even though it is used six times.

### Lambda abstractions

As we have seen lazyness defers the evaluation of subexpressions. When we squint hard enough this also applies to ordinary functions, because they are only evaluated when the required arguments are provided. This inherently lazy behavior allows us to partially apply them:

```javascript
const add = x => y => x + y,
  add2 = add(2);
```
#### Function composition

Pursuing this perspective function composition can be regarded as lazy argument evaluation:

```javascript
const comp f => g =>
  x => f(g(x));
//       ^^^^ only evaluated when x is provided
```
#### Continuation passing style

Can we defer the function composition even further?

```javascript
const compk = f => g => x => k =>
  k(f(g(x)));
//  ^^^^^^^ deferring effect
  
const inc = x => x + 1;

const sqr = x => x * x;

const id = x => x;

const main = compk(
  sqr) (inc) (4);

// main is still unevaluated

main(id); // 25
```
[run code](https://repl.it/repls/AppropriateBestObjectmodel)

With CPS we are able to compose arbitrarily complex compositions of deferred function call trees.

### Description of code

What does this inherently lazy behavior of functions buy us? Instead of writing expressions and statements that are immediately evaluated up to their normal form we are able to express descriptions of code whose evaluation time is totally up to us. Taking back control over the evaluation time is a big deal.

Imagine impure code that will perform side effects immediately during its evaluation. If we merely describe such code the description itself can remain pure and the effects can be deferred to the edge of the program. Keeping most parts of our code pure is a very desirable property, because it reduces the mental load to reason about it.

### Nullary functions and real thunks

Javascript pursues an eager evaluation strategy and thus lacks lazy evaluation. Usually people fall back to nullary functions to obtain  similar behavior:

```javascript
const comp = f => g => x =>
  () => f(g(x));
```
Nullary functions are also referred to as thunks in Javascript. They are infectious, that is other functions have to be aware of and handle them appropriately. Can we render lazy evaluated code less laborious? `Proxy` to the rescue:

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

    if (k === Symbol.toPrimitive)
      return () => this.memo;

    else if (k === "valueOf")
      return () => this.memo;

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

Please note that this is the example from the beginning of this chapter. It seems to behave the same way as in a lazy evaluated language like Haskell. This is huge! However, before we get too excited let us verify whether we meet all three requirements of lazy evaluation, namely normal order, WHNF and sharing:

```javascript
const log = x =>
  (console.log("evaluating x to", x), x);

const add = x => y =>
  thunk(() => log(x + y));

const mul = x => y =>
  thunk(() => x * y);

const foo = x => [
  x + x, // x is needed to process the operation
  x - x,
  mul(x) (x)]; // the result of the multiplication is not needed yet
  
const main = foo(add(2) (3)); // logs "evaluating x to 5" only once and yields [10, 0, thunk]

main.map(x => -x); // forces evaluation of the thunk and yields [-10, -0, -25]
```
[run code](https://repl.it/repls/EasygoingUnhealthyAttribute)

`foo` evaluates its argument only when needed after the actual function invocation, i.e. it pursues normal evaluation order. `main` is in WHNF, because it contains an unevaluated thunk. `foo` evaluates its argument `x` only once and shares the result throughout its scope. We are dealing indeed with proper lazy evaluation.

Mimicking lazy evaluation is not an end in itself though. How can we benefit from this in practice?

#### Guarded recursion for free

Guarded recursion is a consequence of lazy evaluation. It breaks the evaluation after an expression is reduced to WHNF and is thus stack safe, provided the binary operator is non-strict in its second argument:

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

const add = x => y => x + y;

const xs = Array(1e4).fill(0).map((_, i) => i + 1);

const main = foldr(cons) ([]) (xs); // stack safe due to WHNF

const main2 = foldr(add) ([]) (xs); // exhausts the stack

take(3) (main); // [1, 2, 3]
```
[run code](https://repl.it/repls/ShadowyFlimsySmalltalk)

`main2` is not stack safe because `add` is eager in both of its arguments.

#### Infinite recursion

We can define a recursive algorithm that is reduced until the outmost level hits WHNF. At this point the evaluation stops, which allows us to express infinite recursion that does not exhaust the stack:

```javascript
const fix = f => thunk(() => f(fix(f))); // stack safe infinite recursion

const fact = fix(go => n =>
  n === 0
    ? 1
    : n * go(n - 1));
    
fact(5); // 120
```
[run code](https://repl.it/repls/MurkyDetailedAutosketch)

#### Value recursion

Value recursion is infinite by design and thus requires the ability to encode WHNF:

```javascript
const fibs = [0, [1, thunk(() => {
  const next = ([x, [y, ys]]) =>
    [x + y, thunk(() => next([y, ys]))];

  return next(fibs);
})]];

fibs[1] [1] [1] [1] [1] [1] [1] [1] [1] [1] [0]; // 55
```
[run code](https://repl.it/repls/WiltedDarkseagreenCoolingfan)

#### Forcing evaluation

The mechanism I demonstrated in this chapter is based on creating explicit thunks and thus results in lazy evaluation on demand. The default evaluation strategy is still strict. Yet there might be some situations where we want both, lazy and eager evaluation on a case-by-case basis. The following combinator enables to programmatically convert a lazy function into a strict one:

```javascript
const strict = thunk =>
  thunk.valueOf();
```
[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-4.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-6.md)
