<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

This repo is experimental and still work in progress.

# What

A type-directed functional library with a focus on purity, abstraction and a mature debugging toolset.

# Why

Replacing short-term dynamic type convenience by long-term stability.

# Mission

scriptum encourages you to program in a type-directed style and to consider functional programs as mathematical equations that you can manipulate algebraically. This style facilitates equational reasoning and formal proof.

# Import

Just import scriptum's default export:

```Javascript
import $ from "./scriptum.js";
```
`$` is now both a special operator and namespace for all of scriptum's combinators and functions.

# Features

## Debugging

At its core scriptum offers a special `$` operator that transforms normal functions into guarded ones. Guarded functions have additional behavior that is useful for debugging, as we will see in the subsequent paragraphs.

You can easily guard curried functions sequences:

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
  "...sum",
  (...ns) => ns.reduce((acc, n) => acc + n, 0);
);
```
To safe the cost of function guarding at runtime you can disable this feature for production environments by simply setting the `guarded` flag to `false`.

### Type Invalidation

A guarded function must neither receive nor return a value of type `undefined`/`NaN`/`Infinity`:

```Javascript
const append = $(
  "append",
  xs => ys => xs.concat(ys)
);

append([{foo: 1}, {foo: 2}])
  ([{foo: NaN}, {foo: 4}]); // type error
```
As you can see this applies to arbitrarily nested values too.

### Strict Arity

scriptum enforces strict function call arity:

```Javascript
const add = $(
  "add",
  (m, n) => m + n
);

add(2); // type error
add(2, 3); // 5
add(2, 3, 4); // type error
```
If you want to declare variadic functions you can bypass strict arity checking by prefixing `...` to the function name:

```Javascript
const sum = $(
  "...sum",
  (...ns) => ns.reduce((acc, n) => acc + n, 0);
);

sum(); // 0
sum(2); // 2
sum(2, 3); // 5
```
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
Since scriptum's guarding feature can be disabled you must not create dependencies on the `name` property, which, by the way, you should never do, because depending on function names is metaprogramming.

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

## Extended Types

scriptum introduces a couple of new data types using various techniques. The next paragraphs are going to list and briefly describe them and demonstrate two of their key characteristics that are rather uncommon for untyped Javascript.

### Subtyping

The following extended types are subtypes that inherit exotic behavior from their native prototypes. They are constructed by smart constrcutors:

* Char
* Int
* Rec (record)
* Tup (tuple)

### Proxying

The following extended types appear to Javascript's runtime type system like the corresponding native types but contain augmented behavior through `Proxy`s. In this way we can save conversion effort:

* Arr (homogeneous `Array`)
* _Map (homogeneous `Map`)
* _Set (homogeneous `Set`)

### Function Encoding

The following extended types are function encoded and simulate algebraic data types. scriptum uses the less known Scott encoding:

* Const (constant computation)
* Cont (continuation)
* DCont (delimited continuation)
* Defer (deferred computation)
* Eff (effectful computation)
* Either (convergent computation)
* Err (computation that may throw an error)
* Id (effectless computation)
* List (undeterministic computation)
* Option (computation that may fail silently)
* Reader (computations that shares global constants)
* State (computations that share global state)
* Unique (computation that produces a unique value)
* Writer (computations that share a global log)

### Type Coersion

When an extended type is implicitly converted, it throws a type error:

```Javascript
const t = Tup(1, "foo");
t + ""; // type error
```

Explicit type conversions are allowed, though:

```Javascript
const t = Tup(1, "foo");
t.toString() + ""; // "1,foo"
```
### Restricted Mutability

Extended types are either immutable

```Javascript
const t = Tup(1, "foo");

t[0] = 2; // type error
delete t[0]; // type error
t[2] = true; // type error
```
or restrictedly mutable:

```Javascript
const xs = Arr([1, 2, 3]);

xs[0] = 0; // OK
xs[3] = 4; // OK

xs[0] = "0"; // type error
xs[3] = "4"; // type error
xs[10] = 4; // type error (index gap)

delete xs[2]; // OK
delete xs[0]; // type error (index gap)
```
## Custom Types

You can create your own algebraic data types with both the `Type` and the `Data` constructor. While the former can express sums of products the latter can only express single constructor/field types. Here is an example of the built-in `Option` ADT:

```Javascript
const Option = Type(function Option() {});
const Some = x => Option("Some", o => o.Some(x));
const None = Option("None", o => o.None);
const runOption = dict => tx => tx.runOption(dict);

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
With Scott encoded tagged unions we can also express products, sums of products, recursive and even mutual recursive types. If we treat and manipulate them algebraically by obeying some mathematical laws, they are also called algebraic data types.

## Handling Effects

scriptum's stategy to handle effects in a safer manner comprises two approaches:

* defer effectful computations at the last possible moment
* wrap each individual effect into its own type

The first approach separates impure from pure computations and the second makes them explicit. As functional programmers we want to construct these lazy evaluated, effectful computations from smaller ones, that is we need means to compose them. Fortunately, we have functors, applicatives and monads in our toolset, which are a perferct match for this job.

There is a special effect type `Eff` to interact with the real world like the `Console` or the `DOM`. I am not sure yet how to handle asynchronous I/O, though. I will either use a CPS transformer along with an error monad or a particular type `Aff` specifically for asynchronous effects.

Here is a contrieved example for a synchronous real world interaction:

```Javascript
const append = s => t =>
  s.concat(t);

const id = x => x;

const prompt = Eff(() => window.prompt());

const tx = ap(
  map(append) (prompt))
    (prompt);
    
// run the effectul computation

runEff(id) (tx);
```
The computation collects two user inputs and concatenates them. The program remains pure until the effectful portion is actually run.

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

# Upcoming Features

* Fold with short circuiting
* Monodial transudcer
* Monad transformers
* Functional optics
* List comprehension
* Stack-safe recursion
* Indexed ranges
* Memoization
* `Eff`/`Aff` effect types (inspired by purescript)
* `Behavior`/`Event` types and corresponding combinators
* Purely functional data types
* Cata-, ana- and hylomorphisms

# Todo

* [ ] add license
* [ ] add package.json
* [ ] add `List` type
* [ ] implement general Trie functionality from which persistant types can be derived

# Research

* Coyoneda and Free
* Comonads
* Trees (Red-Black Tree, Finger Tree, AVL-Trees, Patricia Tree, Radix Tree, Tries)
* Lists (Random Access List, Catenable List)
* Double Generalized Queues (Deque)

# API

...