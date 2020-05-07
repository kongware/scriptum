## Linear Data Flow w/o Method Chaining

**[EDITOR'S NOTE: THIS CHAPTER NEEDS REVISION]**

There are two ways to obtain method chaining in Javascript, either by relying on the [prototype system](https://repl.it/repls/CheapTurquoiseUnit) or by utilizing plain old Javascript [object factories](https://repl.it/repls/RegalTriflingFactor).

While the former is specific to Javascript and is rather limited, object factories are quite inefficient, especially when you have to deal with types that are assoicated with a larger number of functions. In this chapter we will therefore examine a purely functional approach to maintain a linear data flow and flat composition syntax.

### Prefix notation and S-expressions

Functions are written in prefix notation in Javascript, i.e. the name comes first and is followed by the argument list. Prefix notation leads to nested functions calls, which resemble Lisp's S-expressions:

```Javascript
const sub = x => y => x - y;

sub(
  sub(
    sub(
      sub(1) (2)) (3)) (4)) (5); // -13
```
We can avoid nested syntax by using native operators instead, which are written in infix position:

```Javascript
1 - 2 - 3 - 4 - 5; // -13
```
The evaluation order of expressions with infix operators is determined by their precedence and associativity. Subtraction, for instance, has a higher precedence than multiplication

```Javascript
1 + 2 * 3;   // 7 (predefined precedence)
(1 + 2) * 3; // 9 (enforced precedence)
```
and is left-associative

```Javascript
1 - 2 - 3 - 4 - 5;         // -13 (predefined associativity)
(1 - (2 - (3 - (4 - 5)))); // 3 (enforced right associativity)
```
Unfortunately, we cannot define custom infix operators in Javascript. All we have left is to mimic operators with custom functions and use them in prefix position. Are we stuck with nested S-expressions as soon as we rely on functions?

### Abstract from nesting with infix applicators

Since function application is not associative, there are two ways to compose binary functions:

```javascript
f(g(x) (y)) (z); // left-associative ((x ? y) ? z)
f(x) (g(y) (z)); // right-associative (x ? (y ? z))
```
We can encode both patterns with a couple of arity aware combinators:

```javascript
const infix4 = (v, f) => (w, g) => (x, h) => (y, i) => z =>
  i(h(g(f(v) (w)) (x)) (y)) (z);

const infixr4 = (v, f) => (w, g) => (x, h) => (y, i) => z =>
  f(v) (g(w) (h(x) (i(y) (z))));
```
And this is how we apply them:

```javascript
const sub = x => y => x - y;

infix4(1, sub) (2, sub) (3, sub) (4, sub) (5); // -13

infixr4(1, sub) (2, sub) (3, sub) (4, sub) (5); // 3
```
[run code](https://repl.it/repls/CapitalSociableUser)

By currying the last argument of the infix applicator we can compose it.

The next somewhat more complex example builds a large function composition. The applicator approach is evidently expressive enough to be applied to higher-order functions, which extends the field of application tremendously:

```javascript
const comp = f => g => x => f(g(x));
const pipe = g => f => x => f(g(x));

const inc = x => x + 1;
const sqr = x => x * x;

infix4(inc, comp) (inc, comp) (inc, comp) (inc, comp) (sqr) (1); // 5

infix4(inc, pipe) (inc, pipe) (inc, pipe) (inc, pipe) (sqr) (1); // 25
```
[run code](https://repl.it/repls/ElaboratePunctualScan)

As opposed to to the first order example we can simply replace the composition combinator to switch between left- and right-associative composition.

### Avoid nesting with kleisli applicators

The functional paradigm has another major kind of composition, where functions not just return a value, but a value wrapped in an some structure. These functions have the following type annotated using Typescript: `<T, A>(x: A) => T<A>`, where `T` denotes the aforementioned structure. Such functions are called kleisli arrows and we will investigate them in a subsequent chapter of this course. For the time being we are content with a simplified example that serves our purpose:

```javascript
const compk4 = chain => im => hm => gm => fm => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);

const pipek4 = chain => fm => gm => hm => im => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);

const chain = mx => fm =>
  mx.length === 0
    ? [] // indicates the absence of any value
    : fm(mx[0]);

const inc_ = x => [x + 1];
const sqr_ = x => [x * x];

compk4(chain) (sqr_) (inc_) (inc_) (inc_) (1); // [16]

pipek4(chain) (sqr_) (inc_) (inc_) (inc_) (1); // [4]
```
[run code](https://repl.it/repls/OilyMelodicSquare)

As with functorial applicators kleisli applicators are arity aware. Since it is a form of composition there are combinators for processing right to left and vice versa.

Kleisli composition has an additional property compared to normal function composition. It has short circuit semantics:

```javascript
const inc_ = x => [x + 1];
const noop_ = x => [];
const sqr_ = x => [x * x];

const chain = mx => fm =>
  mx.length === 0
    ? [] // indicates the absence of any value
    : fm(log(mx[0]));
//       ^^^ A

compk4(chain) (noop_) (inc_) (inc_) (sqr_) (1); // logs 1, 2, 3 and yields []

pipek4(chain) (noop_) (inc_) (inc_) (sqr_) (1); // logs nothing and yields []
```
[run code](https://repl.it/repls/SuperWrathfulScales)

In line `A` each invocation of `chain` is logged. Since the `compk4` composition is evaluated from right to left it processes all functions up to `noop_` and hence logs `1, 2, 3` before it short circuits. `pipek4` on the other hand logs nothing, because the first function to be processed is `noop_` and triggers the short circuit. As you can see the semantics of a kleisli composition depends on the `chain` combinator it is applied to.

### Avoid nesting with monadic applicators

You most certainly have heard about monads, even though they have not yet been covered in this course. Monads rely on kleisli arrows but instead of composing arrows they bind a pure value wrapped in some structure to a single kleisli arrow, which creates a new value in the same structure. Let us save the theory for a later chapter and look into an example of a monadic applicator in action:

```javascript
const chainn = chain => ms => fm => {
  const go = (gm, i) =>
    i === ms.length
      ? gm
      : chain(ms[i]) (x => go(gm(x), i + 1));

  return go(fm, 0);
};

const chain = mx => fm =>
  mx.length === 0
    ? [] // indicates the absence of any value
    : fm(mx[0]);

chainn(chain) ([[1], [2], [3], [4], [5]])
  (v => w => x => y => z => [v - w - x - y - z]); // [-13]
```
[run code](https://repl.it/repls/MustyRoyalFrontend)

Just like kleisli composition it is possible to short circuit the chained computation:

```javascript
const chainn = chain => ms => fm => {
  const go = (gm, i) =>
    i === ms.length
      ? gm
      : chain(ms[i]) (x => go(gm(x), i + 1));

  return go(fm, 0);
};

const chain = mx => fm =>
  mx.length === 0
    ? [] // indicates the absence of any value
    : fm(log(mx[0]));
//       ^^^ logs with every invocation

log = x => (console.log(x), x);

chainn(chain) ([[1], [], [3], [4], [5]])
  (v => w => x => y => z => [v - w - x - y - z]); // logs 1 and yields []
```
[run code](https://repl.it/repls/CourageousHatefulExecutable)

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-6.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-8.md)
