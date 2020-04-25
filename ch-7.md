**[EDITOR'S NOTE: THIS CHAPTER IS UNDER CONSTRUCTION]**

## Linear Data Flow w/o Method Chaining

There are two ways to obtain method chaining in Javascript, either by relying on the prototype system

```javascript
class List {
  constructor(head, tail) { /* method body */ }
  map(f) { /* method body */ }
}

const tx = new List(1, new List(2, new List(3, null)));

// List {head: 4, tail: List {head: 9, tail: List {head: 16, tail: null}}}
tx.map(x => x + 1)
  .map(x => x * x);
```
[run code](https://repl.it/repls/CheapTurquoiseUnit)

or by utilizing plain old Javascript object factories

```javascript
const List = head => tail => ({
  head,
  tail,
  map: f => { /* function body */ }
});

const tx = List(1) (List(2) (List(3) (null)));

// List {head: 4, tail: List {head: 9, tail: List {head: 16, tail: null}}}
tx.map(x => x + 1)
  .map(x => x * x);
```
[run code](https://repl.it/repls/RegalTriflingFactor)

While the prototype system is rather specific to Javascript and has its very own limitations, object factories are quite inefficient, especially when you have to deal with types that contain larger number of attached functions. In this chapter we will therefore examine a purely functional approach to maintain a linear data flow and flat composition syntax.

### Prefix notation

Functions are written in prefix notation in Javascript, i.e. the name comes first and then the arguments. Prefix notation leads to nested functions calls, which resemble Lisp's s-expressions:

```Javascript
const sub = x => y => x - y;

sub(
  sub(
    sub(
      sub(1) (2)) (3)) (4)) (5); // -13
```
We can avoid nesting by using natve operators instead, which are written in infix notation:

```Javascript
1 - 2 - 3 - 4 - 5; // -13
```
Operators affect the evaluation order through their predefined precedence and associativity. Subtraction for instance has a higher precedence than multiplication

```Javascript
1 + 2 * 3;   // 7 (predefined precedence)
(1 + 2) * 3; // 9 (enforced precedence)
```
and is left-associative

```Javascript
1 - 2 - 3 - 4 - 5;         // -13 (predefined associativity)
(1 - (2 - (3 - (4 - 5)))); // 3 (enforced right associativity)
```
Unfortunately, we cannot define custom infix operators in Javascript. All we can do is define functional counterparts of the built-in operators and use them in prefix position.

### Avoid nesting with functorial applicators

Since function application is not associative, there are two ways to call a sequence of binary functions:

```javascript
f(g(x) (y)) (z); // left-associative ((x ? y) ? z)
f(x) (g(y) (z)); // right-associative (x ? (y ? z))
```

We can encode both patterns in a couple of arity aware combinators:

```javascript
const infix2 = (x, f) => (y, g) => z =>
  g(f(x) (y)) (z);

const infixr2 = (x, f) => (y, g) => z =>
  f(x) (g(y) (z));

const infix3 = (w, f) => (x, g) => (y, h) => z =>
  h(g(f(w) (x)) (y)) (z);

const infixr3 = (w, f) => (x, g) => (y, h) => z =>
  f(w) (g(x) (h(y) (z)));

// ...
```
An array based variadic combinator complements these applicators:

```javascript
const infixn = pairs => z => {
  const go = (f, i) =>
    i === pairs.length
      ? f
      : go(pairs[i] [1] (f(pairs[i] [0])), i + 1);

  return pairs.length === 0
    ? z
    : go(pairs[0] [1] (pairs[0] [0]), 1) (z);
};

const infixnr = pairs => z => {
  const go = (f, i) =>
    i === pairs.length
      ? f(z)
      : f(go(pairs[i] [1] (pairs[i] [0]), i + 1));

  return pairs.length === 0
    ? z
    : go(pairs[0] [1] (pairs[0] [0]), 1);
};
```
Let us apply an applicator to illistrate their handling:

```javascript
const sub = x => y => x - y;

infix4(1, sub) (2, sub) (3, sub) (4, sub) (5); // -13

infixr4(1, sub) (2, sub) (3, sub) (4, sub) (5); // 3
```
[run code](https://repl.it/repls/CapitalSociableUser)

The next a bit more complex example builds a large function composition:

```javascript
const infix4 = (v, f) => (w, g) => (x, h) => (y, i) => z =>
  i(h(g(f(v) (w)) (x)) (y)) (z);

const comp = f => g => x => f(g(x));
const pipe = g => f => x => f(g(x));

const inc = x => x + 1;
const sqr = x => x * x;

infix4(inc, comp) (inc, comp) (inc, comp) (inc, comp) (sqr) (1); // 5

infix4(inc, pipe) (inc, pipe) (inc, pipe) (inc, pipe) (sqr) (1); // 25
```
[run code](https://repl.it/repls/ElaboratePunctualScan)

As opposed to to the first order function example we need to provide the reverse function composition combinator `pipe` to retrieve a right-associative composition. Additionally we can witness how general and expressive these applicator approch is by applying higher order functions.

### Avoid nesting with kleisli applicators

The functional paradigm has another major kind of composition, where functions not just return a value, but a value wrapped in an some structure. They have the following type annotated with Typescript: `<T, A>(x: A) => T<A>`, wehre `T` denotes the structure.`Such functions are called kleisli arrows and we will investigate these arrows in a subsequent chapter of this course. In this chapter we are content with a simplified example, which serves our purpose:

```javascript
const kleisli4 = chain => fm => gm => hm => im => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);

const kleislir4 = chain => im => hm => gm => fm => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);

const chain = mx => fm =>
  mx.length === 0
    ? []
    : fm(mx[0]);

const inc_ = x => [x + 1];
const sqr_ = x => [x * x];

kleisli4(chain) (sqr_) (inc_) (inc_) (inc_) (1);  // [4]

kleislir4(chain) (sqr_) (inc_) (inc_) (inc_) (1); // [16]
```
[run code](https://repl.it/repls/OilyMelodicSquare)

As with functorial applicators kleisli applicators are arity aware and there exist a left- and a right-associative variadic implementation based on arrays.

Kleisli composition has an interesting property. It can short circuit the entire composition:

```javascript
const kleisli4 = chain => fm => gm => hm => im => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);

const kleislir4 = chain => im => hm => gm => fm => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);

const chain = mx => fm =>
  mx.length === 0
    ? []
    : fm(log(mx[0]));
//       ^^^ A

const log = x => (console.log(x), x);
const inc_ = x => [x + 1];
const noop_ = x => [];
const sqr_ = x => [x * x];

kleisli4(chain) (noop_) (inc_) (inc_) (sqr_) (1); // logs nothing and yields []
```
[run code](https://repl.it/repls/SuperWrathfulScales)

In line `A` each invocation of `chain` is logged, but since the first element of the composition is an empty array (`noop_`) the computation is short circuited and `chain` is never called. As you can see the semantics of a kleisli composition depends on the `chain` combinator it is applied to.

### Avoid nesting with monadic applicators

You most certainly have heard about monads, even though they have not yet been covered in this course. Monads rely on kleisli arrows but instead of composing two arrows they bind a pure value wrapped in some structure to a single kleisi arrow, which creates a new value in the same structure. Let us save the theory for a later chapter and look into an example of a monadic applicator in action:

```javascript
// TODO
```
[run code](https://repl.it/repls/MustyRoyalFrontend)
