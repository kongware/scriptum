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

## Pluggable Debugging

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
  "apppend",
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

Usually the prototype system is used to simulate the typeclass effect in Javascript. scriptum doesn't rely on this mechanism for two reasons:

* Native Prototypes

It should be possible to define typeclasses for native types without modifying their prototypes, because such procedure is considered harmful.

* Subtyping

It should be possible to form typeclass hierchies without introducing subtype relations, because co-, contra- and invariance and their corresponding effects are not desired.

### Alternative Approach

scriptum uses a global `Map` structure to map types to implementations. Such a typeclass can adopt methods of none, one or several superclasses by mixins and thus doesn't establish subtype relations.

Here is an example of how to declare the `Monoid` typeclass and its superclass `Semigroup` from scratch. Please note that these typeclasses are predefined in scriptum:

```Javascript
// namespaces

const Num = {
  append: m => n => m + n, // assumed monoid under addition
  empty: 0
  // ...
};

const Arr = {
  append: xs => ys => xs.concat(ys),
  empty: []
  // ...
};

// set typeclass instances

setInstance("Semigroup", "Number") ({append: Num.append});
setInstance("Semigroup", "Array") ({append: Arr.append});

setSubInstance("Semigroup") ("Monoid", "Number") ({empty: Num.empty});
setSubInstance("Semigroup") ("Monoid", "Array") ({empty: Arr.empty});

// create accessor functions

const Semigroup = createAccessors("Semigroup");
const Monoid = createAccessors("Monoid");

// declare polymorphic functions

const append = x => Monoid.append(x);
const empty = x => Monoid.empty(x);

// here we go!

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