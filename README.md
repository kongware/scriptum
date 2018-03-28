<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

This repo is experimental and still work in progress.

## What

A type-directed functional library with a focus on purity, abstraction and a mature debugging toolset.

## Why

scriptum is the attempt to reconcile programming in an dynamically typed environment with the requirements of modern software development like correctness, predictability and resuablility.

## Mission

scriptum encourages you to program in a type-directed style and to consider functional programs as mathematical equations that you can manipulate algebraically. This style facilitates equational reasoning and formal proof.

# Debugging

scriptum provides a special `$` operator that transforms normal functions into guarded ones. Guarded functions have additional behavior that is useful for debugging, as we will see in the subsequent paragraphs. Please note that `$` also serves as a library namespace.

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
To safe the cost of function guardance at runtime you can disable this feature for production environments by simply setting the `GUARDED` flag to `false`.

## Type Invalidation

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

## Strict Arity

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
If you want to declare variadic functions you can bypass strict arity checking by prefixing the function name with `...`:

```Javascript
const sum = $(
  "...sum",
  (...ns) => ns.reduce((acc, n) => acc + n, 0);
);

sum(); // 0
sum(2); // 2
sum(2, 3); // 5
```
## Anonymous Functions

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
Since scriptum's function guarding can be disabled you must not create dependencies on the `name` property, which is best practice anyway.

## Type Logs

scriptum doesn't require explicit type annotations but rather provides a type log for each guarded function. A type log includes the type of each argument passed to the curried function sequence. This way you can retrospectively verify if an assumed function type matches its real type.

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

If you pass a composite value to a guarded function and the type check recognizes an improper use of that type, it uses a question mark within the type signature to highlight this misuse:

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
`xs` is a heterogeneous `Array` that will produce a `NaN` the next time you map over it, for instance. Consider type signatures like `[?]` as an indicator that your code is more likely to break.

## Shortcommings

At first scriptum establishes another level of indirection around every guarded function. When you debug your code you have to go through some extra steps, which makes the process somewhat more laborious. On the other hand, the additional guarantees and debug information should outweigh these extra effort by far, in particular for larger projects. Additionally, scriptum guides you through the step-by-step debug process by indicating which expressions can be skipped.

# Extended Types

scriptum introduces a couple of new data types using various techniques. The next paragraphs are going to list and briefly describe them. Additionally, some characteristics of these extended types that are rather uncommon for untyped Javascript are illustrated.

## Subtyping

The following extended types are subtypes that inherit exotic behavior from their native prototypes. They are constructed by smart constrcutors:

* Char
* Int
* Rec (record)
* Tup (tuple)

## Proxying

The following extended types appear to Javascript's runtime type system like the corresponding native types but contain augmented behavior through `Proxy`s. In this way we can save conversion effort:

* Arr (homogeneous `Array`)
* _Map (homogeneous `Map`)
* _Set (homogeneous `Set`)

## Function Encoding

The following extended types are function encoded and simulate algebraic data types. scriptum uses the less known Scott encoding:

* Behavior (continuous time series value)
* Comparator (ordering value)
* Cont (delimited continuation)
* Eff (effectful synchronous computation)
* Either (convergent computation)
* Except (first class exception)
* Id (effectless computation)
* Lazy (lazy evaluation - type synonym of Eff)
* List (undeterministic computation)
* Memoize (memoziation)
* Option (short curcuiting)
* Reader (compuation depending on a shared read-only environment)
* State (computation depending on shared state)
* Stream (discrete time series value)
* Task (effectful asynchronous computation)
* Tree/Forest (schematic multi-way tree implementation)
* Unique (unique value)
* Valid (validation)
* Writer (computation depending on a shared write-only environment)

## Type Coersion

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
## Restricted Mutability

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
# Custom Types

You can create your own algebraic data types with both the `Type` and the arity-dependent `Data` constructors. The `Type` constrcutor can define tagged unions:

```Javascript
const Option = Type("Option");
const Some = x => Option("Some", x) (o => o.Some(x));
const None = Option("None") (o => o.None);
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
To provide additional debug information for custom types you have to pass the respective tag and all arguments to the type constructor (`Option("Some", x)`/`Option("None")`).

The `Data` constrcutor can define a single data constructor with one field:

```Javascript
const Reader = Data("Reader") (Reader => f => Reader(f));
```
Please note that the first argument of the passed function argument is always the data constructor itself (`Reader => f => Reader(f)`).

Accordingly, the `Data2` constructor can define a single data constructor with two fields:

```Javascript
const Tree = Data("Node") (Node => x => children => Node(x) (children));
```
The underlying encoding is called Scott and based on higher order functions. We can consider these custom types as algebraic data types provided we manually obey the relevant algebraic laws.

# Effect Handling

scriptum's stategy to handle effects in a safer manner comprises two approaches:

* defer effectful computations at the last possible moment
* wrap synchrnous and asynchronous effects respectively into its own, distinct types

The first approach separates impure from pure computations and the second makes them explicit. As functional programmers we want to construct these lazy evaluated, effectful computations from smaller ones, that is we need means to compose them. Fortunately, we have functors, applicatives and monads in our toolset, which are a perferct match for this job.

## Synchronous

There is a special effect type `Eff` to synchronously interact with the real world like the `Console` or the `DOM`. scriptum subsumes the following effects  under `Eff`:

* Console IO
* DOM IO
* Exceptions
* Local storage
* Random number generation
* Reference identity
* Time related

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

## Asynchronous

Asynchronous effects, that is to say mostly IO are handled with the `Task` type, which is based on the continuation monad along with an `Either`-like type. Here is a first sketch of its use, but keep in mind that the code and the API is still under heavy construction and probably will change in future versions:

```Javascript
// pseudo asynchronous fetch function

const fetch = id => (e, k) => {
  const id_ = setTimeout(s => {
    if (id === 1) k({value: 5});
    else e(Error("unknown id"));
  }, 0, id);

  return () => clearTimeout(id_);
}

// transform it into an action that returns a Task

const fetchT = url =>
  Task((k, e) => fetch(url) (e, k));

// define mappings without acutally running them

const task1 = map(comp(inc) (get("value")))
  (fetchT(1));

const task2 = map(comp(inc) (get("value")))
  (fetchT(2));

// run the tasks

const cancel = task1.runTask(console.log, console.error); // A

task1.runTask(console.log, console.error); // B

cancel(); // C

task2.runTask(console.log, console.error); // D

// A logs nothing
// B logs 6
// D logs Error "unknown id"
```
* Until `runTask` is called the first time the program remains pure (A)
* Since a `Task` has no state it can be run multiple times (B)
* Because a `Task` is unicast it can be cancled without causing side effects (C)
* If a `Task` is rejected due to an error the computation can be recovered (D)

There is an applicative and monadic instance, of course, so that you can chain multiple asynchronous effects sequencially.

## Promise Interop

There will probably be a `Deferred` type that "lazy promises" and is still fully compatible, that is you can utilize the extensive `Promise` infrastructure including `async`/`await`:

```Javascript
class Deferred {
  constructor() {
    this.promise = new Promise((r, e) => {
      // arrows use this of their surrounding scope
      this.resolve = r;
      this.reject = e;
    });

    this.then = this.promise.then.bind(this.promise);
    this.catch = this.promise.catch.bind(this.promise);
    this.finally = this.promise.finally.bind(this.promise);
  }
}
```
# Typeclasses

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
# Linear Data Flow

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
# Stack-Safe Recursion

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
# Import

Just import scriptum's default export:

```Javascript
import $ from "./scriptum.js";
```
`$` is now both a special operator and namespace for all of scriptum's combinators and functions.

# Upcoming Features

* Several type classes
* Fold with short circuiting
* Monodial transudcer
* Monad transformers
* Functional optics
* Zippers
* List comprehension
* Stack-safe recursion
* Indexed ranges
* Memoization as a type
* `Behavior`/`Event` types and corresponding combinators
* Cata-, ana- and hylomorphisms

# Research

* Coyoneda and Free
* Trees (BST, Heaps, Red-Black, Finger, AVL, Tries)
* Graphs
* Lists (Random Access List, Catenable List)
* Double Generalized Queues (Deque)

# API

Until there is a wiki you can inspect the unit tests to get a notion for use cases and application of various combinators.