<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

Experimental and still work in progress.

This lib is based on my work, i.e. I am confident that it will be bullet proofed at some point.

## What

A type-directed functional library that adapts well-known functional patterns to untyped Javascript, so that these patterns may become idiomatic for Javascript at some point.

## Mission Statementit 

scriptum is the endeavour to make functional programming applicable in Javascript in pratice for normal people.

## Fundamentals

### Pragmatism over Dogmatism

Javascript lacks a non-trivial type system and all the guarantees that go along with it and it lacks functional data types. As a consequence mutations and reassignments are allowed and sometimes even necessary, as long as they remain local, i.e. are not observable in the parent scope.

### Convention over Coercion

scriptum relies heavily on coventions and on the willingness and discipline of consumers to adhere to them.

### Expressions over Statements

Expressions are good, because you can compose them and pass them around like data. scriptum provides means to express almost everything as an expression. However, sometimes algorithms are more comprehensible if you assign intermediate values to variables or arrange conditional branches with `if`/`elese` and `switch`. So whenever you feel the need to decompose your complex function compositions you don't need to be ashamed of it.

### Everything is Curried

scriptum prefers curried to multi-argument functions. This drastically simplifies function application and partial application in particular. However, we can isomorphically transform curried to uncurried functions by applying the `curry`/`uncurry` combinators. So there is no harm to use both forms.

### Unions of Records

You should consider modelling your business domain in the form of alternatives rather than hierarchies. The latter only allow to add information when you move from top to bottom. But the real world isn't assambled in such a schematic way. Alternatives on the other hand are way more flexible to represent a chaotic world as a data structure. In scriptum alternatives are expressed with tagged unions, which may contain other tagged unions or records.

### Directory Passing over Prototypes

scriptum doesn't rely on Javascript's prototype system but allows for ad-hoc polymorphism through directory passing, i.e. typeclasses are passed as common arguments to functions. As a convetion, typeclass arguments are always placed leftmost in the argument list and if the function expects several typeclasses you can bundle them by a multiple argument function call.

You may interject that Javascript naturally contains ad-hoc polymorphism, since it is untyped. This is true, but it is an unprincipled sort of polymorphism and doesn't guide you during coding.

### Effect Handling

scriptum promotes effect handling through monads, monad transformer stacks and tagless final encodings. Impure computations themselves are wrapped in functions or thunks so that their evaluation can be temporally deferred. This way we can separate the pure from the impure part of our program, which enables equational reasoning for the pure parts.

### Folds over Recursion over Loops

Recursion is a big win compared to imperative loops. However, in Javascript we have neither tail call optimization nor more advanced optimization strategies. So we are stuck with tail recursion implemented through trampolines, which are structurally just loops.

What we want is a mechanism to abstract from direct recursion altogether. scriptum uses recursion schemes (catamorphism et al.) to separate the recursion from the algorithms and domain logic. These schemes have to be implemented as trampolines for each data type though, to avoid stack overflows and improve performance.

### Loop Fusion over Generators/Iterators

scriptum avoids the use of generators/iterators for most use cases. Instead, it relies on loop fusion either directly through function composition or with the yoneda lemma type. Generators/iterators are stateful constructs in Javascript and thus may compromise your pure program with unwanted side effects.

### Explicit Thunks over Generators/Iterators

The same reason not to use generators/iterators applies to lazy evaluation. scriptum facilitates the use of explicit thunks inestead. Thunks are ultra fast and have a less clunky interface.

# Naming Convetions

## Function Names

The following rules apply to function names:

* a name with an `f`-postfix denotes a function with its arguments flipped: `const subf = y => x => x - y`
* a name with an `x`-postfix denotes a destructive function, i.e. one that performs mutations visible in the parent scope
* a name with an `var`-prefix denotes most likely a variadic one

## Variable Names

* `f`/`g` denotes pure functions
* `x`/`y` denotes a value of arbitrary type
* `tx`/`ty`/... denotes a value wrapped in a type without specifying any constraints like monadic, applicative, functorial etc.
* `tf`/`tg` denotes a function wrapped in a type
* `ts` denotes an array of values wrapped in a type
* `mx`/`my` denotes a value wrapped in a monadic type
* `ax`/`ay` denotes a value wrapped in a applicative type
* `fm`/`gm` denotes a monadic action, i.e. a function that returns a monad
* `ix`/`iy` denotes a stream of values generated by an iterator

## Underscore

* the prefix-underscore is used to avoid naming claches with reserved names.
* the postfix-underscore denotes a slightly modified variant of an already existing one

# New Types

There s a constructor each for union types (`union`) and record types (`struct`). Both merely wrap a value into an plain old Javascript `Object`, which is augmented with some properties useful for reasoning and debugging.

Additionally a `structMemo` is provided to allow for memoized values.

There are a couple of pre-defined common types and typeclass function instances to use them polymorphically.

# Typeclass Functions

typeclass functions are a means to enable ad-how polymorphism in a principled manner in Javascript. Ad-hoc polymorphism simply means that a function can handle different data types as its arguments, as long as these types implement the necessary typeclass functions. In Javascript usually the prototype system is used to render this mechanism implicit. scriptum, however, favors explicit typeclass function passing. While this is more laborious it makes the respective constraints explicit and thus more clearly.

Typeclass constraints of ad-hoc polymorphic functions are always defined as the leftmost formal parameter and the corresponding arguments are passed as a single type dictionary, unless there is only one constraint, then you can just pass the plain function:

```Javascript
const arrFoldMap = foldMap({arrFold, arrAppend, arrEmpty})`;
```
As with any plain old Javascript `Object` the property order doesn't matter.

Here is a list of typeclasses scriptum does or will provide the necessary functions for:

* Alt
* Applicative
* Bifunctor
* Bounded
* Clonable
* Comonad
* Contravariant
* Enum
* Filterable
* Foldable
* Functor
* Ix
* Monad
* MonadRec
* Monoid
* Ord
* Plus
* Profunctor
* Read
* Semigroup
* Serializable
* Deserializable
* Setoid
* Show
* Traversable
* Unfoldable

# Advanced Topics

## Avoid Nesting

scriptum allows for a flat composition syntax without nested function calls and (almost) without dot-notation:

```Javascript
const inc = x => x + 1,
  sqr = x => x * x;
  
varComp(inc) (sqr) (inc) (inc) (inc).runVarComp(1); // 25
varPipe(inc) (inc) (inc) (inc) (sqr).runVarComp(1); // 25
```
`varComp`/`varPipe` lazily take an infinite number of functions and compose them. Only when you invoke the `runVarComp` property, the composition is actually evaluated. scriptum provides such combinators specialized for...

* function composition
* applicative lifting
* monadic lifting
* monadic chains
* kleisli composition
* optical composition

and probably others in the future. Here is another example for applicative lifting:

```Javascript
const add = x => y => x + y;

varLiftA(add) (Some(2)) (Some(3)); // Some(5)
varLiftA(add) (None) (Some(3)); // None
```
Additionally, you can easily create your own variadic functions by using the `varArgs` combinator:

```Javascript
const varArgs = f => {
  const go = args =>
    Object.defineProperties(
      arg => go(args.concat(arg)), {
        "runVarArgs": {get: function() {return f(args)}},
        [TYPE]: {value: "VarArgs"}
      });

  return go([]);
};

const add = x => y => x + y;

const sum = ns =>
  ns.reduce((acc, n) => acc + n, 0);

const varSum = varArgs(sum);

varSum(1) (2) (3) (4).runVarArgs // 10
```
## Structural Folding

### Catamorphism et al.

For some datatypes a catamorphism is a generalization of a fold/reduction (e.g. trees). For others both coincide (e.g. `Array`). And yet others don't have a fold at all (e.g. `Option`). 

For any non-primitive type the associated catamorphism is the dual of the constructor. The constructor defines the introduction rule, whereas the catamorphism defines the elimination rule. Hence catamorphisms represent the notion of destructuring data types.

scriptum implements catamorphisms as trampolines to obtain stack safety. Here is an example for the `Array` type, where catamorphism and fold coincide:

```Javascript
const add = x => y => x + y,
  mul = x => y => x * y,
  sum = arrFold(add) (0),
  prod = arrFold(mul) (1);

sum([1,2,3,4,5]); // 15
prod([1,2,3,4,5]); // 120
```
There is also a fold with short circuit semantics:

```Javascript
const lte = y => x => x <= y;

const addWhile = p => x => y =>
  p(x + y)
    ? Done(x + y)
    : Loop(x);

arrFoldWhile(addWhile(lte(9))) (0) ([1,2,3,4,5]); // 6
```
`arrFoldWhile` takes an algebra that determines the short circuit behavior of the fold. It uses the `Step` union type to indicate either another iteration (`Loop`) or short circuiting (`Done`).

Maybe you've noticed that the given examples are based on a left associative fold. Even though left and right folds are isomorphic by `flip`/`Array.prototype.reverse`, scriptum provides a distinct implementation of a right associative fold mainly for performance reasons. As opposed to Haskell's `foldr` it is strictly evaluated though.

More folds will follow:

* Paramorphism (fold with current state of the context)
* Hylomorphism (unfold composed with fold)
* Zygomorphism (one fold depending on another - semi-mutual recursive)
* Mutumorphism (mutual recursive fold - mutual recursive)
* Histomorphism (fold with access to all previous intermediate results)

### Anamorphism et al.

Anamorphisms are the dual of catamorphisms. You start with a seed value and apply the coalgebra to the seed and then iteratively to the result of the previous application, while all intermediate results are stored in a structure:

```Javascript
const nextLetter = c =>
  String.fromCharCode (c.charCodeAt (0) + 1)

const main = arrUnfold(c =>
  c > "z"
    ? None
    : Some([c, nextLetter(c)]));

main("a"); // ["a", "b", "c", "d", "e", ...]
```
More unfolds will follow:

* Apomorphism (unfold with early termination)
* Futumorphism (unfold with access to values still to be computed)

## Tail and Mutual Recursion with Trampolines

### Direct Recursion in Tail Position

scriptum uses a Javascript port of clojure's `loop`/`recur` combinators as a trampoline:

```Javascript
const loop = f => {
  let step = f();

  while (step && step.type === recur)
    step = f(...step.args);

  return step;
};

const recur = (...args) =>
  ({type: recur, args});
```
Now we don't have to bother with stack overflows any longer but can utilize recursion when we see fit:

```Javascript
const stackSafeFold = f => acc_ => xs =>
  loop((acc = acc_, i = 0) =>
    i === xs.length
      ? acc
      : f(acc) (xs[i]) (acc_ => recur(acc_, i + 1)));

const xs = Array(1e6)
  .fill(0)
  .map((x, i) => i);
  
const stackSafeSum = stackSafeFold(x => y => k => x < Infinity ? k(x + y) : x) (0);

stackSafeSum(xs); // 499999500000
```
This works, because `stackSafeFold` implements direct recursion in tail position.

### Indirect Recursion in Tail Position

For mutual recursion we need a more complex trampoline:

```Javascript
const tramp = f => (...args) => {
  let step = f(...args);

  while (step && step.type === recur) {
    let [f, ...args_] = step.args;
    step = f(...args_);
  }

  return step;
};

const recur = (...args) =>
  ({type: recur, args});
```
Now we can express mutual recursion in a stack-safe manner too:

```Javascript
const even = n =>
  n === 0
    ? true
    : recur(odd, n - 1);

const odd = n =>
  n === 0
    ? false
    : recur(even, n - 1);

trampoline(even) (1e6 + 1)); // false
```
As you can see the trampoline API leaks on the calling site and there is nothing we can do about it. Stac-safe mutual recursion is a big win though, especially when you have to deal with data types that are defined in terms of each other.

## Transducer

...

## Functional Optics

### Lense

...

### Prism

...

### Fold

...

### Traversal

...

## Effect Handling

### Monads

...

### Monad Transformers

...

### Tagless Final Encoding

...

### Freer Monads

...

## Asynchronous Computations

...

## Lazy Evaluation

### Functions

Functions generalize expressions by substituting subexpressions with arguments. As an effect such generalized expressions are only evaluated when all arguments are provided. While this is a simple form of lazy evaluation, the passed arguments are strictly evaluated.

### ETA Abstraction

In a strictly evaluated language like Javascript ETA abstraction is a way to add some extra lazyness to expressions:

```Javascript
const fold = f => acc => xs =>
  xs.reduce((acc_, x) => f(acc_) (x), acc);
  
const sum = fold(xs => y =>
  (xs.push(y + xs[xs.length - 1]), xs)) ([0]);

const sumEta = xs =>
  fold(ys => y => (ys.push(y + ys[ys.length - 1]), ys)) ([0]) (xs);

sum([1,2,3]); // [1,3,6]
sum([1,2,3]); // [1,3,6,7,9,12]

sumEta([1,2,3]); // [1,3,6]
sumEta([1,2,3]); // [1,3,6]
```
### Function Composition

From another perspective you can think of a function composition as a function `f` that takes an argument `g`, which is stuck in another function `x => f(g(x))` and thus only evaluated if the final argument is passed:

```Javascript
const comp = f => g => (x => f(g(x))); // redundant parenthesis to illustrate the idea
```
In lazily evaluated languages with call by need or call by name evaluation strategy such lazily evaluated arguments are the default.

### Continuation Passing Style

We can go beyond lazyness through function composition by encoding functions in continuation passing style:

```Javascript
const inck = x => k => k(x + 1),
  id = x => x;

const mapk = f => xs => k => {
  const go = (acc, i) =>
    i === xs.length
    ? acc
    : f(xs[i]) (x => go(acc.concat(x), i + 1));
  
  return k(go([], 0));
};

const main = mapk(inck) ([1,2,3]); // still lazy

main(id); // [2,3,4]
```
With CPS we can define lazily evaluated function call trees. However, CPS encodings get also quickly convoluted. We can probably ease the pain by abstracting from CPS with the continuation monad. I need to do more research on this promissing topic.

### Generators

Generators are the most natural form of expressing lazy evaluation in Javascript and the most harmful as well: They are stateful - not by design but by desicion. scriptum tries to avoid generators as often as possible. However, if we need lazyness inside imperative statements like `if`/`else` conditions or `while` loops we need to fall back to them, as there is no other way to suspend these strictly evaluated structures.

### Explicit Thunks

There may be some rare cases where we need explicit thunks to stop an expression from being immediately evaluated. This is another topic I need to examine in depth.

For the time being scriptum offers two distinct types for non-strictly evaluated expressions.

#### Non-Memoized Thunks with `Defer`

`Defer` wraps an expression in a thunk and evaluates it on each call:

```Javascript
const deferredExp = Defer(() => (console.log("evaluate..."), 5 * 5));

deferredExp.runDefer(); // evaluate...25
deferredExp.runDefer(); // evaluate...25
```
#### Memoized Thunks with `Lazy`

`Layz` wraps an expression in a thunk and evaluates it only once:

```Javascript
const lazyExp = Lazy(() => (console.log("evaluate..."), 5 * 5));

lazyExp.runLazy; // evaluate...25
lazyExp.runLazy; // 25
```
### Getters/Setters

Getters and setters are just thunks (and functions) and inherit their lazy traits. Why do they have their own section then? Because they allow us to introduce lazyness into Javascript without altering the calling side, because they are treated as normal properties:

```Javascript
const cons = (head, tail) => ({head, tail});

const list = cons(1, cons(2, cons(3, cons(4, cons(5, null)))));

const take = n =>
  n === 0
    ? xs => null
    : xs => xs && {
      head: xs.head,
      get tail() {
          delete this.tail;
          return this.tail = take(n - 1) (xs.tail);
      }
};

take(3)(list); // stack safe
```
although `take` isn't tail recursive it is stack safe no matter how long the list is. Lazy getters give us tail call optimization modulo cons for free!

scriptum utilizes lazy getters to allow for a simple yet concise form of pattern matching on tagged unions:

```Javascript
const match = ({[TYPE]: type, [TAG]: tag}, o) =>
  o.type !== type ? _throw(new UnionError("invalid type"))
    : !(tag in o) ? _throw(new UnionError("invalid tag"))
    : o[tag];
    
const optCata = none => some => tx =>
  match(tx, {
    type: "Option",
    None: none,
    get Some() {return some(tx.runOption)}
  });
```
## Delimited Continuations

...

## Persistent Data Structures

...

### Hash Array Mapped Trie (HAMT)

...

## Functional Reactive Programming

### Behavior

...

### Events

...

# Language Conflicts

## `Object.assign`

`Object.assign` calls every getter/setter strictly during copying. This is undesired if you rely on their lazy evaluation semantics. scriptum comes with the `objUnion`/`objUnionx` combinator pair that replace the method adequately without notable performance penalty.

# TODO

- [ ] how to lift a semigroup into Option forming a monoid?
- [ ] how to create a monoid under Applicative?
- [ ] how to create a monoid under Alternative?
- [ ] add functional optics (Iso, Fold, Traversal)
- [ ] add array morphisms: ana/apo/hylo/zygo/mutu/histo/futu (not joking :)
- [ ] add common transducer
- [ ] add persistent data structure by hash array mapped trie (HAMT)
- [ ] add List/Catenable List/Random Access List
- [ ] add Rose Trees
- [ ] add Zipper data type
- [ ] add useful Comonads
- [ ] add Monad Transformers
- [ ] add Yoneda/Coyoneda
- [ ] add Reference Type (value objects)
- [ ] add Cont Monad + delimited continuations (shift/reset)
- [ ] add arrApConst
- [ ] add mapAccum
- [ ] replace `Object.assign` with `objUnion`/`objUnionx` (due to getter/setter issue)
