<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

This repo is experimental and still work in progress.

## What

A type-directed functional library with a focus on purity, abstraction and a mature debugging toolset.

## Why

scriptum is an attempt to reconcile Javascript's dynamical type convenience with the type safety of statically typed languages.

## Why not just Flowtype?

Haskell is a purely functional language designed around a parametric, bounded and higher kinded polymorphic type system. Still the language comes along with dozens of extensions for its type machinery: FlexibleContexts, FunctionalDependencies, GADTs, KindSignatures, MultiParamTypeClasses, RankNTypes, ScopedTypeVariables, TypeFamilies, etc. This is for a good reason: A good type system must be advanced enough so that it does not exclude too many useful programs, because it is not expressive enough.

Javascript isn't designed around a type system and it is imposible to build one retrospectively. Such an attempt will always result in poor soundness and code littered with awkward type annotations. You cannot patch a type system. But that is exactly what Flowtype is trying to do. Sure, you can type simple functions and data structures. However, as soon as you try to type highly generalized functional idioms it looks like this:

```Javascript
class HKT<F, A> {}

interface Functor<F> {
  map<A, B>(f: (a: A) => B, fa: HKT<F, A>): HKT<F, B>
}
```
Instances of this functor class must implement weird getter and setter functions to get the value in and out of the functor respectively. Read the [full story](https://medium.com/@gcanti/higher-kinded-types-in-flow-275b657992b7). If you want static type guarantees, rather use an appropriate language that compiles to Javascript.

## Mission

scriptum encourages you to program in a type-directed manner and to consider functional programs as mathematical equations that you can manipulate algebraically. This style facilitates equational reasoning and formal proof.

# Debugging

scriptum tries to avoid imposing explicit type annotations on the programmer. Instead of knowing the types upfront it provides as much debugging information as possible in hindsight.

The `$` function object is both scriptum's namespace and its core debugging operator. It transforms normal functions into guarded ones. Guarded functions have additional behavior that makes them more type-safe and easer to debug.

With the `$` operator you can guard curried, multi-argument and polyvariadic functions:

```Javascript
// curried function

const comp = $(
  "comp",
  f => g => x =>
    f(g(x)));

// multi-argument function

const add = $(
  "add",
  (m, n) =>
    m + n);

// variadic function

const sum = $(
  "...sum",
  (...ns) =>
    ns.reduce((acc, n) =>
      acc + n, 0));
```
Function guarding is only useful during the development stage. To safe runtime costs for production environments you can deactivate this feature by setting the `GUARDED` flag to `false`.

## Type Invalidation

A guarded function must neither receive nor return a value of type `undefined`/`NaN`/`Infinity`:

```Javascript
const append = $(
  "append",
  xs => ys =>
    xs.concat(ys));

append([{foo: 1}, {foo: 2}])
  ([{foo: NaN}, {foo: 4}]); // type error
```
As you can see this applies to arbitrarily nested values too.

## Strict Arity

Guarded functions enforce a strict function call arity:

```Javascript
const add = $(
  "add",
  (m, n) =>
    m + n);

add(2); // type error
add(2, 3); // 5
add(2, 3, 4); // type error
```
Please note that variadic functions come along with a less strict guarantee:

```Javascript
const sum = $(
  "...sum",
  n => (...ns) =>
    ns.reduce((acc, m) =>
      acc + m, n));

sum(1) (); // 1
sum(1) (2); // 3
sum(1) (2, 3); // 6
sum() (2); // type error
sum(1, 2) (3, 4); // 8 - ouch!
```
The reason for this lies in sriptum's inability to distinguish variadic from deterministic arguments.

## Anonymous Functions

The functional paradigm leads to partially applied curried functions scattered throughout your code base. These lambdas are hard to distinguish and thus hard to debug. With guarded functions you can always access function names via the console. Guarded functions are virtualized by `Proxy`s where the `[[ProxyHandler]]` internal slot holds a name property with the respective function name.

First order function sequences inherit the name of their initial function:

```Javascript
const add = $(
  "add",
  m => n =>
    m + n);

add(2); // [[ProxyHandler]] contains name: "add"
```
Higher order function sequences additionally adapt their name to the last function returned:

```Javascript
const comp = $(
  "comp",
  f => g => x =>
    f(g(x)));

const add = $(
  "add",
  m => n =>
    m + n);

const inc = $(
  "inc",
  n => n + 1);

comp(add) (inc); // [[ProxyHandler]] contains name: "comp"
comp(add) (inc) (2); // [[ProxyHandler]] contains name: "add"
```
## Type Logs

scriptum provides a type log for each guarded function:

```Javascript
const comp = $(
  "comp",
  f => g => x =>
    f(g(x)));

const add = $(
  "add",
  m => n =>
    m + n);

const inc = $(
  "inc",
  n => n + 1);

comp(add) (inc) (2).log; // ["comp(λadd)", "comp(λinc)", "comp(Number)"]
```
`λ` just indicates that the given argument is a possibly anonymous function.

If a function call results in a non-functional return value it isn't logged and hence you cannot introspect it as described above. In scriptum jargon this is a final function call. In order to log final function calls scriptum maintains a global type log that usually contains the last ten complete function calls including the final calls.

## Type Misuse

If you pass a composite value to a guarded function and the type check recognizes misuse of that type, it uses a question mark within the type signature to indicate the incorrect usage:

```Javascript
const append = $(
  "append",
  xs => ys =>
    xs.concat(ys));
  
const inc = $(
  "inc",
  n => n + 1);

const xs = Array(100)
  .fill(0)
  .concat("foo");

append(xs).log; // ["append([?])"]

map(inc) (append(xs) (ys)); // type error
```
`xs` is a heterogeneous `Array` that could potentially cause an error in the future. Consider type signatures like `[?]` as an indicator that your code is more likely to break.

## Trade-off

At first glance scriptum's guarded functions just establish another level of indirection. When you debug your code you have to go through some extra steps, which makes the process somewhat more laborious. For larger projects the additional type-safety and debug information should outweigh these indirection by far. Apart from that, scriptum guides you through the step-by-step debugging process by indicating which lines can be skipped.

# Extended Types

scriptum introduces a couple of new data types using various techniques. The next paragraphs are going to list and briefly describe them. Additionally, some characteristics of these extended types that are rather uncommon for untyped Javascript are illustrated.

## Subtyping

The following extended types are subtypes that inherit exotic behavior from their native prototypes. They are created by smart constrcutors:

* All
* Any
* Char
* Int
* Product
* Rec (record)
* Sum
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
* Event (discrete time series value)
* Except (first class exception)
* Id (effectless computation)
* Lazy (lazy evaluation - type synonym of Eff)
* List (undeterministic computation)
* Memoize (memoziation)
* Option (short curcuiting)
* Reader (compuation depending on a shared read-only environment)
* Ref (referential identity)
* State (computation depending on shared state)
* Stream (data stream)
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

scriptum provides algebraic data types as the preferred path to create your own types. With ADTs you can express both product and sum types as well as recursive types.

Since there is no native support for ADTs scriptum uses a function encoding to express them. ADTs are immutable and the wrapped value can only be accessed through a continuation. A continuation is just a closure that expects a function and calls this function argument with one or more free varibales. Btw., calling these custom types algebraic data types is a bit daring in Javascript. In fact, they only become algebraic if we follow the corresponding algebraic rules.

There are two functions to define ADTs in scriptum:
* `Data` for single data constructor ADTs
* `Type` for multple data constructor ADTs

The simplest ADT includes a single data constructor and one field:

```Javascript
const Foo = Data("Foo")
  (Foo => x => Foo(k => k(x)));

const foo = Foo("bar"); // Foo {runFoo: f, ...}
foo.runFoo(x => x); // "bar"
```
The first argument `"Foo"` determines the name of the type constructor. The second argument is a function, whose first argument serves as the data constructor, which finally constructs a value. Since there is only a single data constructor, data and type constructor have the same name.

The next example is a single data constructor with several fields, also known as a product type. Now it becomes apparent why continuations are used as getters - only contuinuations can handle several values:

```Javascript
const Bar = Data("Bar")
  (Bar => x => y => z => Bar(k => k(x) (y) (z)));

const bar = Bar(2) ("foo") (true);
bar.runBar(x => y => z => y); // "foo"
```
It is totally up to you if you declare a curried or multi-argument getter (`k => k(x, y, z))`). If the free variable is an `Object`, you can even utilize destructuring assignemnt.

This expressiveness comes at a price, though. The types of both examples above are `Foo<λrunFoo>` and `Bar<λrunBar>` respectively. Maybe you would have expected `Foo<Number>` and `Bar<Number, String, Boolean>`. The reaosn for this lies in the incapability of `Foo` and `Bar` to see the arguments of their preceding functions. Javascript's type system is simply too primitive to infer function types. There is no escape.

Let's define a more complex ADT with two data constructors, also known as sum types:

```Javascript
const Option = Type("Option", "None", "Some");

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
As you can see you have to pass the tags `"None"`/`"Some"` twice, first to the `Option` type constructor and later to the value constructors. This is necessary so that scriptum can ensure that all cases are covered.

You can also compose sums and products to get sums of products:

```Javascript
const List = Type("List", "Cons", "Nil");

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
# Overloading

scriptum ports Clojure's multimethods to realize overloading at runtime and thus bypasses Javascript's prototype system. As a result there is no need to alter built-in prototypes anymore. Runtime overloading provides similar properties as typeclasses in statically typed languages. However, there are crucial differences:

* multimethods introspect the types of values whereas typeclasses work soleley with types
* multimethods introduce runtime costs whereas typeclasses are ereased at runtime

The consequence of the former is that overloading through multimethods doesn't work on return types.

I am going to use the term typeclass from here on anyway, because scriptum uses multimethods to mimic them. The following typeclasses are or will be supported in future versions:

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
* Read
* Semigroup
* Show
* Setoid
* Traversable

Overloaded functions are open, that is you can always add function instances to handle your own types accordingly.

Let's define the overloaded `append` and `empty` functions to simulate the Monoid typeclass:

```Javascript
const {appendAdd, append} = overload("append", toTypeTag);

appendAdd("String", s => t => `${s}${t}`);
appendAdd("Number", n => m => n + m);
appendAdd("All", b => c => b && c);
appendAdd("Array", xs => ys => xs.concat(ys));

const {emptyAdd, empty} = overload("empty", get("name"));

emptyAdd("String", "");
emptyAdd("Number", 0);
emptyAdd("Array", []);

append(2) (3); // 5
append("foo") ("bar"); // "foobar"
append([1,2]) ([3,4]); // [1,2,3,4]

empty(String); // ""
empty(Number); // 0
empty(Array); // []
```
`empty` demonstrates the lack of return type polymorphism: We have to pass the type (or its constructor) explicitly.

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

## DOM Handling

I think most UIs doesn't require virtual dom. DOM manipulation is better done with a bunch of specialized DOM combinators, which encapsulate quirks of the DOM API and maintain composability. Together with the `Event` and `Behavior` type and unidirectional data flow scriptum offers a basic but powerful toolset to build responsive views. I will provide the most important DOM combinators soon.

Unidirectional data flow results in the following principles:

* Only the program may manipulate the output display, never the user
* User input is presented in the form of events
* GUI elements generate events only in response to user input, never in response to program output

# TODO

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
* Trees (Multi-way, Binary Search, Heap, Red-Black, Finger, AVL, Trie)
* Graphs
* Lists (Random Access List, Catenable List)
* Double Generalized Queues (Deque)

# API

Until there is a wiki you can inspect the unit tests to get a notion for use cases and application of various combinators.