<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

This repo is experimental and still work in progress.

# What

A type-directed functional library with a focus on purity, abstraction and a mature debugging toolset.

# Why

Replacing short-term dynamic type convenience by long-term stability.

# Mission

scriptum encourages you to program in a type-directed style and to consider functional programs as mathematical equations that you can manipulate algebraically. This style facilitates equational reasoning and formal proof.

There is no such thing as an untyped program, except an invalid one!

# Import

Just import scriptum's default export:

```Javascript
import $ from "./scriptum.js";
```
`$` is now both a special operator and namespace for all of scriptum's combinators and functions.

# Features

## Debugging

At its core scriptum offers a special `$` operator that transforms normal functions into guarded ones. Guarded functions have additional behavior that is useful for debugging, as we will see in the subsequent paragraphs.

You can easily augment curried functions sequences:

```Javascript
const comp = $(
  "comp",
  f => g => x => f(g(x))
);
```

Or multi-argument functions:

```Javascript
const add = $(
  "add",
  (m, n) => m + n
);
```

Or variadic ones:

```Javascript
const sum = $(
  "sum",
  (...ns) => ns.reduce((acc, n) => acc + n, 0);
);
```
To safe the cost of function augmentation at runtime you can disable this feature for production environments by simply setting the `augmented` flag to `false`.

### Type Invalidation

A guarded function must neither receive nor return a value of type `undefined`/`NaN`:

```Javascript
const append = $(
  "append",
  xs => ys => xs.concat(ys)
);

append([{foo: 1}, {foo: 2}])
  ([{foo: NaN}, {foo: 4}]); // type error
```
As you can see this applies to arbitrarily nested values too.

### Anonymous Functions

In the functional paradigm functions are usually curried, that is declared as sequences of unary anonymous functions. These lambdas are hard to distinguish and thus hard to debug. Guarded functions have always a name.

A first order function sequence carries the name of its initial function:

```Javascript
const add = $(
  "add",
  m => n => m + n
);

add(2).name; // add
```
A higher order function sequence additionally adapts its name to the name of the repsective function argument:

```Javascript
const comp = $(
  "comp",
  f => g => x => f(g(x))
);

const add = $(
  "add",
  m => n => m + n
);

const inc = $(
  "inc",
  n => n + 1
);

comp(add) (inc).name; // comp
comp(add) (inc) (2).name; // add
```
Since scriptum's augmentation feature can be disabled you must not create dependencies on the `name` property, which, by the way, you should never do, because depending on function names is metaprogramming.

### Type Logs

scriptum doesn't require explicit type annotations but rather provides a type log for each guarded function. A type log includes the type of each argument passed to the curried function sequence. This way you can verify if an assumed function type matches its real type retrospectively.

```Javascript
const comp = $(
  "comp",
  f => g => x => f(g(x))
);

const add = $(
  "add",
  m => n => m + n
);

const inc = $(
  "inc",
  n => n + 1
);

comp(add) (inc) (2).log; // ["comp(λadd)", "comp(λinc)", "comp(Number)"]
```
`λ` just indicates that the given argument is a function.

If you pass a composite value to a guarded function and the type check yields an improper type, the type log uses a question mark to highlight this improper usage:

```Javascript
const append = $(
  "append",
  xs => ys => xs.concat(ys)
);
  
const inc = $(
  "inc",
  n => n + 1
);

const xs = Array(100)
  .fill(0)
  .concat("foo");

append(xs).log; // ["append([?])"]

map(inc) (append(xs) (ys)); // type error
```
`xs` is a heterogeneous `Array` that will produce a `NaN` the next time you map over it, for instance. For this reason please consider `[?]` as an indicator that your code is more likely to break.

## Typeclasses

scriptum obtains the typeclass effect by using a global `Map` structure instead of the prototype system. This design decision was made mostly because we want to declare instances of native types as well without modifying built-in prototypes. To actually use a typeclass you must create a corresponding type dictionary:

```Javascript
// create a type dictionary

const Monoid = typeDict("Monoid");

// deconstruct accessors for convenience

const {append, empty} = Monoid;

// use of the ad-hoc polymorphic functions

append(2) (3); // 5
append([1,2]) ([3,4]); // [1,2,3,4]

empty(5); // 0
empty([1, 2, 3, 4]); // []
```
## Linear Data Flow

scriptum introduces a polyvariadic type that allows extensive function composition with a flat syntax. Here is a contrieved example:

```Javascript
const f = compN(inc)
  (inc)
  (inc)
  (inc)
  (inc); // constructs x => inc(inc(inc(inc(inc(x)))))

f.run(0); // 5
```
Since composition is a functorial computation on the function type, this works for all functors and also for applicative and monadic computations:

```Javascript
const m = chainN(inc)
  (add)
  (add)
  (add)
  (add); // creates x => add(add(add(add(inc(x)) (x)) (x)) (x)) (x)
 
m.run(2); // 2 + 1 + 2 + 2 + 2 + 2 = 11
```
## Stack-Safe Recursion

Although specified in Ecmascript 6 most Javascript engines doesn't ship with tail call optimization (TCO) to allow stack-safe recursive algorithms. For this reason scriptum supplies clojure's `loop`/`recur` construct to transform recursive functions into their non-recursive counterparts:

```Javascript
const loop = f => {
  let acc = f();

  while (acc && acc.type === recur)
    acc = f (...acc.args);

  return acc;
}

const recur = (...args) =>
  ({type: recur, args});

const repeat = n_ => f_ => x_ =>
  loop ((n = n_, f = f_, x = x_) => n === 0
    ? x
    : recur (n - 1, f, f(x)));

const inc = n =>
  n + 1;

repeat(1e6) (inc) (0); // 1000000
```
## Custom Types

### Algebraic Data Types

As an language without sum types we need to use an appropriate function encoding to implement them. scriptum uses the less common Scott encoding that relies on explicit recursion and functional pattern matching:

```Javascript
const Type = Tcons => (tag, Dcons) => {
  const t = new Tcons();
  t.run = cases => Dcons(cases);
  t.tag = tag;
  return t;
};

const Option = Type(function Option() {});
const Some = x => Option("Some", o => o.Some(x));
const None = Option("None", o => o.None);
const runOption = dict => tx => tx.run(dict);

const safeHead = 
  xs => xs.length === 0
    ? None
    : Some(xs[0]);

const uc = s =>
  s.toUpperCase();

const xs = ["foo", "bar", "baz"],
  ys = [];

const x = safeHead(xs), // Some("foo")
  y = safeHead(ys); // None

runOption({Some: uc, None: ""}) (x); // "FOO"
runOption({Some: uc, None: ""}) (y); // ""
```
With Scott encoding we also can express products, sums of products, recursive and even mutual recursive types. If we manipulate them algebraically by obeying mathematical laws, sums of products are also called algebraic data types.

### Function Encodings

As for ADTs scriptum uses a function encoding to define common primitives, but without the additional plumbing ADTs require. The following primitives are available:

* Char
* Float
* Int
* Tuple
* Record

# Upcoming Features

* Fold with short circuiting
* Monodial transudcer
* Functional optics
* List comprehension
* Stack-safe recursion
* Indexed ranges
* Memoization
* `Eff`/`Aff` effect types (inspired by purescript)
* `Behavior`/`Event` types and corresponding combinators
* Purely functional data types

# Research

* Coyoneda and Free
* F-Algebras and trees
* Persistant data structures

# API

...