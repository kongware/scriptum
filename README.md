<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

This repo is experimental and still work in progress.

## What

A gentle and type-directed functional library with a focus on purity, abstraction and patterns.

## Why

scriptum is an attempt to leverage the potential of dynamically typed functional programming with Javascript.

## Mission

scriptum encourages you to program in a type-directed manner and to consider functional programs as mathematical equations that you can manipulate algebraically. This style facilitates equational reasoning and formal proof.

## Lessons Learned

1. Embrace Javascript's dynamically typed nature instead of fighting it
2. Translate idioms from statically typed language so that they adapt to Javascript and not vice versa
3. Guide programmers through conventions, not coercion

# Type System

It requires great mastery to develop a type system that is sound and expressive at the same time. Usually the type system is designed first and the language build around it. Doing it the other way around is often a futile endeavor. scriptum utilizes types extensivley, but only to help the programmer develop a mental model of their program's underlying data types. In a dynamically typed environment you need to fill in for the compiler anyway and scriptum helps you accomplish this task.

## Introspection

I tried to achieve more type safety in Javascript by introspection and `Proxy` virtualization, several times. And failed. The problem is that such meta programming introduces another level of indirection to your code, without yielding a sound type system. Even with a lot of runtime introspection you will inevitably end up stepping through your code line by line with a debugger at some point. By then at the latest the curse of this additional complexity will haunt you and render the debugging process extremely cumbersome.

# Coding by Convention

scriptum comprises a couple of conventions instead of enforced idioms:

* Use mostly pure functions and wrap impure code in the appropriate types
* Model your data with tagges unions rather than hierarchies
* Treat your tagged unions as algebraic data types
* Treat data as immutable but don't be ashamed of local mutations
* Use tail recursion instead of loops
* Utilize persistant data structures and structural sharing
* Avoid Javascript's prototype system
* Curry your functions and avoid optional parameters
* Encode binary functions in infix position to improve readability
* Use Lisp style indentations to structure nested function calls

# Extended Types

## Algebraic Data Types

The following predefined types are function encoded and simulate algebraic data types. scriptum uses the less known Scott encoding:

* All (monoid under conjunction)
* Any (monoid under disjunction)
* Char (single character)
* Behavior (continuous time series value)
* Comparator (ordering value)
* Cont (delimited continuation)
* Eff (effectful synchronous computation)
* Either (convergent computation)
* Endo (endomorphism)
* Event (discrete time series value)
* Except (first class exception)
* First (monoid)
* Id (effectless computation)
* Last (monoid)
* Lazy (lazy evaluation - type synonym of Eff)
* List (undeterministic computation)
* Max (monoid)
* Min (monoid)
* Memoize (memoziation)
* Option (short curcuiting)
* Product (monoid under multiplication)
* Reader (compuation depending on a shared read-only environment)
* Ref (referential identity)
* State (computation depending on shared state)
* Stream (data stream)
* Sum (monoid under addition)
* Task (effectful asynchronous computation)
* Tree/Forest (schematic multi-way tree implementation)
* Unique (unique value)
* Valid (validation)
* Writer (computation depending on a shared write-only environment)

## Subtyping

For tuples and records I decided to rely on subtyping, since the exotic behavior of their native super types is desired:

* Record
* Tuple

This is the only place where scriptum resorts to subtype polymorphism.

# Custom Types

scriptum provides the `Data` and `Type` constructors to express your own algebraic data types:

* `Data` creates single data constructor ADTs
* `Type` creates multple data constructor ADTs

The simplest ADT includes a single data constructor and one field:

```Javascript
const Foo = Data("Foo")
  (Foo => x => Foo(k => k(x)));

const foo = Foo("bar"); // Foo {runFoo: f, ...}
foo.runFoo(x => x); // "bar"
```
The first argument `"Foo"` determines the name of the type constructor. The second argument is a function, whose first argument serves as the data constructor, which finally constructs a value. Since there is only a single data constructor, data and type constructor have the same name.

The next example shows a single data constructor with several fields, also known as a product type. Please note that a consumer must pass a continuation to consume the fields:

```Javascript
const Bar = Data("Bar")
  (Bar => x => y => z => Bar(k => k(x) (y) (z)));

const bar = Bar(2) ("foo") (true);
bar.runBar(x => y => z => y); // "foo"
```
However, the represantation of the fields is totally up to you. You can use a curried or multi-argument continuation (`k => k(x, y, z))`), an ordinary `Object` or just an `Array`.

Let's define a more complex ADT with two data constructors, also known as sum types:

```Javascript
const Option = Type("Option");

const None = Option("None")
  (o => o.None);

const Some = x =>
  Option("Some") (o => o.Some(x));
  
const runOption = dict => tx =>
  tx.runOption(dict);

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
runOption({Some: uc}) (x); // type error
runOption({Some: uc, None: "", Foo: x => x}) (x); // type error
```
You can also compose sums of products:

```Javascript
const List = Type("List");

const Cons = x => tx =>
  List("Cons") (cases => cases.Cons(x) (tx)));

const Nil = List("Nil")
  (cases => cases.Nil);
```
The `Cons` data constructor has two fields and hence is a product type. Additionally, `Cons` takes a `List<a>` as its second argument, that is to say it is a recursive type. Here is a mutual recursive type declaration:

```Javascript
const Tree = Data("Tree")
  (Tree => x => forest => Tree(k => k(x) (forest)));

const Forest = Data("Forest")
  (Forest => (...trees) => Forest(k => k(trees)));
```
# Overloading / Typeclasses

Function overloading is a way to enable ad-hoc polymorphism in dynamically typed languages. scriptum uses a port of Clojure's multimethods. Ad-hoc polymorphism defines type equivalence for certain behavior. As opposed to typeclasses this approach doesn't allow return type and (non-functional) value polymorphism. scriptum tries to simulate parts of these properties with tagged functions (see code example).

scriptum will ultimately support the following typeclasses:

* Alternative
* Apply
* Applicative
* Alt
* Bifunctor
* Bounded
* Chain
* ChainRec
* Comonad
* Contravariant
* Deserialize
* Enum
* Eq
* Extend
* Filterable
* Foldable
* Functor
* Group
* Monad
* Monoid
* Ord
* Plus
* Profunctor
* Semigroup
* Serialize
* Setoid
* Traversable
* Unfoldable

Overloaded functions are open, that is you can always add function instances to handle your own types accordingly.

Let's define the overloaded `append` and `empty` functions to simulate the Monoid typeclass:

```Javascript
const {appendAdd, appendLookup, append} = overload2("append", dispatcher);

appendAdd("String", s => t => `${s}${t}`);
appendAdd("Sum", n => m => Sum(n + m));
appendAdd("All", b => c => All(b.valueOf() && c.valueOf()));
appendAdd("Array", xs => ys => Arr(xs.concat(ys)));

const {emptyAdd, empty} = overload("empty", get("name"));

emptyAdd("String", "");
emptyAdd("Sum", Sum(0));
emptyAdd("All", All(true));
emptyAdd("Array", []);

append("foo") ("bar"); // "foobar"
append(Sum(2)) (Sum(3)); // Sum<5>
append(All(true)) (All(false)); // All<false>
append(Arr([1,2])) (Arr([3,4])); // [1,2,3,4]

append("foo") (empty); // "foo"
append(Sum(2)) (empty); // Sum<2>
append(All(true)) (empty); // All<false>
append(Arr([1,2])) (empty); // [1,2]
```
`empty` is a tagged function and simulates value polymorphism in the context of overloaded binary functions.

# Recursion

## Stack-Safety

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
## Tail Recursion Modulo Cons

What enables Tail Recursion Modulo Cons in Javascript is a thunk in Weak Head Normal Form. An expression in weak head normal form has been evaluated to the outermost data constructor, but contains sub-expressions that may not have been fully evaluated. In Javascript only thunks can prevent sub-expressions from being immediately evaluated. More on this in section "Lazy Evaluation/Lazy Getters".

## Schemes

Recursion schemes are patterns to factor recursion out of your data types. More on this soon.

# Currying

scriptum relies on function in curried form. For non-commutative binary functions both possible parameter orders are usually provided to avoid argument flipping and thus reduce runtime costs:

```Javascript
// divide
const div = m => n =>
  m / n;
  
// divide flipped
const divf = n => m =>
  m / n;
```
## Dual Monoid

Instead of a dual Monoid scriptum ships with an overloaded `append` and `prepend` function respectively.

# Immutability

Unfortunatelly, Javascript offers neither on the language level. You can construct your own data types with this qualities, but this renders your code incompatible with much of Javascript's ecosystem. For this reason scriptum embraces local mutations to avoid performance penalties due to repetitive copying of large data structures.

## Persistent Data Structures

scriptum will provide its own persistent data structures and means to convert them to built-in types.

# Lazy Evaluation

There are a couple of tools in Javascript that we can utilize to obtain the lazy evaluation effect.

## ETA Expansion

ETA expansion just means adding (unnecessary) abstaction over a function:

```Javascript
const fix = f => x => f(fix(f)) (x);
//               ^              ^^^

const fact = fix(
  f => n => (n === 0) ? 1 : n * f(n - 1)); // stack safe

fact(10); // 3628800
```
## Function Composition

While composition is known to produce point-free code its ability to obtain the lazy evaluated argument effect is more important in strictly evaluated languages.

```Javascript
comp = f => g => x => f(g(x));
//                      ^^^^
```
## Lazy Getters

Lazy getters allow us to partially construct `Object`s and defer the evaluation of certain properties until they are actually needed. Getters are transparent during property access. In fact, they are the only lazy property of Javascript on the language level.

```Javascript
const cons = (head, tail) => ({head, tail});

let list;

for (let i = 1e5; i > 0; i--)
  list = cons(i, list);

const take = n => ({head, tail}) =>
  head === undefined || n === 0
    ? {}
    : {head, get tail() {return take(n - 1) (tail)}};
//           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ not yet evaluated sub-expression
```
## Deferred Type

Finally, the `Defer` algebraic data type allos us to use normal-order evaluation whereever we need it:

```Javascript
const Defer = Data("Defer")
  (Defer => thunk => Defer(thunk));

Defer.map = f => tx => Defer(() => f(tx.runDefer()));
Defer.ap = af => ax => Defer(() => af.runDefer() (ax.runDefer()));

const add = m => n => m + n;
const sqr = n => Defer(() => n * n);

const z = Defer.ap(
  Defer.map(add)
    (sqr(5)))
      (sqr(5));

// nothing has been evaluated up to this point

z.runDefer(); // 50
```
We can define and handle infinite streams like in lazy evaluated languages:

```Javascript
// we can express infinite streams like in Haskell

const repeat = x => Defer(() => [x, repeat(x)]);


Defer.map(
  ([head, tail]) => [sqr(head), tail])
    (repeat(5))
      .runDefer(); // [25, Defer]
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
# Functional Reactive Programming

scriptum distinguishes two types of time series values: `Behavior` and `Event`.

## Behavior

`Behavior`s are continuous time series values, that is they always have a value. They are pull based and the underlying DOM events are eagerly registered as soon as you pass an initial value.

```Javascript
// Behavior instance

const ButtonPressed = initialState => {
  let state = initialState;

  const cancelDown = subscribe({
    target: document,
    type: "mousedown",
    listener: _ => state = true,
    options: {capture: true}
  });

  const cancelUp = subscribe({
    target: document,
    type: "mouseup",
    listener: _ => state = false,
    options: {capture: true}
  });

  return Object.assign(
    Behavior((k, e) => k(state)),
    {cancel: () => (cancelDown(), cancelUp())}
  );
};

// register Behavior

const buttonPressed = ButtonPressed(false);

// access the Behavior's value

buttonPressed.runBehavior(console.log);

// cancel the Behavior

buttonPressed.cancel();
```
The `Behavior` type is still experimental and may change in the future.

## Event

`Event`s are discrete time series values, that is they occasionally have a value. They are push based and the underlying DOM events are lazily registered only when you call the `runEvent` method.

```Javascript
// Event instance

const mouseCoords = Event((k, e) => subscribe({
  target: document,
  type: "mousemove",
  listener: event => k({x: event.screenX, y: event.screenY}),
  options: {capture: true}
}));

// register Event and access event stream

const cancel = mouseCoords.runEvent(console.log);

// cancel the Event

cancel();
```
The `Event` type is still experimental and may change in the future.

## Reactive Principles

scriptum follows the following reative principles:

* Only the program may manipulate the output display, never the user
* User input is presented in the form of events
* GUI elements generate events only in response to user input, never in response to program output

## Reactive Combinators

scriptum will provide a suit of combinators that renders template engines unnecessary and facilitate the work with various DOM APIs.

## Incremental DOM Updates

Instead of relying on virtual dom implementations scriptum favours incremental functions that patch DOM updates incrementally. Building specific incremental functions for a particular use case isn't that hard. The challenge consists rather in generalizing these functions so that they can be reused for different tasks. This is ongoing work.

# TODO

- [ ] Extend Monoid by `mconcat`?
- [ ] Add `Eff` instance for Monoid
- [ ] Add monoid instance for Ord<k> => Set<k>
- [ ] Add monoid instance for Ord<k, v> => Map<k, v>
- [ ] Note that there is no Monoid instance for Either
- [ ] Unit tests
- [ ] API documentation

# Upcoming Features

* Various type classes
* Fold with short circuiting
* Monodial transudcer
* Monad transformers
* Functional optics
* Contravariant predicates/comparisons
* Zippers
* List comprehension
* Stack-safe recursion
* Indexed ranges
* Comonads
* Cata-, ana-, apo- and hylomorphisms

# Research

* Coyoneda and Free
* State Machines (DFA, NFA, NFA-to-DFA transformer)
* Trees (Multi-way, Binary Search, Heap, Red-Black, Finger, AVL, Trie)
* Graphs
* Lists (Random Access List, Catenable List)
* Double Generalized Queues (Deque)

# API

Until there is a wiki you can inspect the unit tests to get a notion for use cases and application of various combinators.