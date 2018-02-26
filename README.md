<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

This repo is experimental and still work in progress.

# What

A type-directed functional library with a focus on types, purity, abstraction and debugging capabilities.

# Why

Currently, functional programming in Javascript is a pain.

# Mission

scriptum encourages you to program in a type-directed style and to consider functional programs as mathematical equations that you can manipulate algebraically. This style facilitates equational reasoning and formal proof.

There is no such thing as an untyped program, except an invalid one!

# Features

## Debugging Toolset

scriptum offers a function type proxy that transforms normal functions into guarded functions with additional behavior that is useful for debugging. Just use the `Aug` constructor to create such augmented functions:

```Javascript
const comp = Aug(
  "comp",
  f => g => x => f(g(x))
);
```
To safe the cost of function augmentation at runtime you can disable this feature for production environments by simply switching the `augmented` flag to `false`.

### Excluded Types

A guarded function must neither receive nor return a value of type `undefined`/`NaN`. It will throw a type error instead. This applies to deeply nested element values of these types as well.

```Javascript
const append = Aug(
  "append",
  xs => ys => xs.concat(ys)
);

append([1, 2, 3]) ([4, NaN, 5]); // type error
```
### Lambdas

Functions are usually curried, that is declared as sequences of unary anonymous functions. These lambdas are hard to distinguish and thus hard to debug. Guarded functions have always a name. First order function sequences carry the name of its initial function. Higher order function sequences additionally adapt their names to the name of the respective function argument.

```Javascript
const comp = Aug(
  "comp",
  f => g => x => f(g(x))
);

const add = Aug(
  "add",
  m => n => m + n
);

const inc = Aug(
  "inc",
  n => n + 1
);

comp(add) (inc).name; // comp
comp(add) (inc) (2).name; // add
comp(add) (inc) (2) (3) // 6
```
Since scriptum's augmentation feature can be disabled you must not create dependencies on the `name` property, which, by the way, you should never do, because depending on function names is metaprogramming.

### Type Logs

scriptum doesn't require explicit type annotations but rather provides a type log for each guarded function. A type log includes the type of each argument passed to the curried function sequence. This way you can verify if an assumed function type matches its real type retrospectively.

If you pass a composite value to a guarded function and the type check yields an invalid type, the type log uses a question mark to indicate this. For instance, if you pass a huge heterogeneous `Array`, the type log will contain an  `[?]` entry. Please understand this as an indication to choose a more appropriate type for the given data.

```Javascript
const comp = Aug(
  "comp",
  f => g => x => f(g(x))
);

const add = Aug(
  "add",
  m => n => m + n
);

const inc = Aug(
  "inc",
  n => n + 1
);

comp(add) (inc) (2).log; // ["comp(λadd)", "comp(λinc)", "comp(Number)"]
```
`λ` just indicates that the given argument is a function.

## Typeclasses

scriptum obtains the typeclass effect by using a global `Map` structure instead of the prototype system. This design decision was made mostly because we want to declare instances of native types as well without modifying built-in prototypes. To actually use a type class you must create a corresponding type dictionary:

```Javascript
// create a type dictionary

Monoid = typeDict("Monoid");

// deconstruct accessors for convenience

const {append, empty} = Monoid;

// use of the polymorphic functions

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
## Algebraic Data Types

As an language without sum types we need to use an appropriate function encoding to implement them. scriptum uses the less common Scott encoding that relies on explicit recursion and functional pattern matching:

```Javascript
const Type = Tcons => Dcons => {
  const t = new Tcons();
  t.run = cases => Dcons(cases);
  return t;
};

const Option = Type(function Option() {});
const Some = x => Option(o => o.Some(x));
const None = Option(o => o.None);
const runOption = dict => tx => tx.run(dict);

const safeHead = Aug(
  "safeHead",
  xs => xs.length === 0
    ? None
    : Some(xs[0])
);

const uc = Aug(
  "uc",
  s => s.toUpperCase()
);

const xs = ["foo", "bar", "baz"],
  ys = [];

const x = safeHead(xs), // Some("foo")
  y = safeHead(ys); // None

runOption({Some: uc, None: ""}) (x); // "FOO"
runOption({Some: uc, None: ""}) (y); // ""
```
With Scott encoding we also can express products, sums of products, recursive and even mutual recursive types. If we manipulate them algebraically by obeying mathematical laws, sums of products are also called algebraic data types.

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


# Research

* Coyoneda and Free
* F-Algebras and trees
* Purely functional data types
* Persistant data structures

# API

...