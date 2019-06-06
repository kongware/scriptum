<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

Experimental and still work in progress.

This lib is based on my work, i.e. I am confident that it will be bullet proofed at some point.

## What

A type-directed functional library that adapts well-known functional patterns to untyped Javascript, so that these patterns may become idiomatic for Javascript at some point.

## Mission Statement

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

* a name with an f-postfix denotes a function with its arguments flipped: `const subf = y => x => x - y`
* a name with an x-postfix denotes a destructive function, i.e. one that performs mutations visible in the parent scope

## Variable Names

* `f`/`g` denotes pure functions
* `x`/`y` denotes a value of arbitrary type
* `tx`/`ty`/... denotes a value wrapped in a type without specifying any constraints like monadic, applicative, functorial etc.
* `tf`/`tg` denotes a function wrapped in a type
* `ts` denotes an array of values wrapped in a type
* `mx`/`mx` denotes a value wrapped in a monadic type
* `ax`/`ax` denotes a value wrapped in a applicative type
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

typeclass functions are a means to enable ad-how polymorphism in a principled manner in Javascript. Ad-hoc polymorphism simply means that a function can handle different data types as its arguments, as long as these types implement the necessary typeclass functions. In Javascript usually the prototype system is used to render this mechanism implicit. scriptum, however, favors explicit typeclass function passing. While this is more laborious it makes the respective constraints explicit, which is mostly better than implicit.

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

and probably others in the future.

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

### Catamorphism

For some datatypes a catamorphism is a generalization of a fold/reduction (e.g. trees). For others both coincide (e.g. `Array`). And yet others don't have a fold at all (e.g. `Option`). 

For any non-primitive type the associated catamorphism is the dual of the constructor. The constructor defines the introduction rule, whereas the catamorphism defines the elimination rule. Hence catamorphisms represent the notion of destructuring data types.

scriptum implements catamorphisms as trampolines to obtain stack safety. Here is an example for the `Array` type, where catamorphism and fold coincide:

```Javascript
const arrFold = alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++)
    acc = alg(acc) (xs[i], i);

  return acc;
};

const add = x => y => x + y;

arrFold(add) (0) ([1,2,3,4,5]); // 15
```
The second argument takes two arguments as the original `Array.prototype.reduce` does. This is a bit sloppy, but well, as I said there is no reason to be dogmatic - this is still untyped Javascript.

There is also a fold with short circuit semantics:

```Javascript
const arrFoldWhile = alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++) {
    acc = alg(acc) (xs[i], i);
    if (acc && acc[TAG] === "Done") break;
  }

  return acc.runStep;
};

const lte = y => x => x <= y;

const addWhile = p => x => y =>
  p(x + y)
    ? Done(x + y)
    : Loop(x);

arrFoldWhile(addWhile(lte(9))) (0) ([1,2,3,4,5]); // 6
```
`arrFoldWhile` takes an algebra that determines the short circuit behavior of the fold. It uses the `Step` union type to indicate either another iteration (`Loop`) or short circuiting (`Done`).

Maybe you've noticed that the given examples are based on a left fold, i.e. a left associactive one. Even though left and right folds are isomorphic by `flip`/`Array.prototype.reverse`, scriptum provides a distinct implementation of a right associative fold mainly for performance reasons.

### Paramorphism

...

### Anamorphism

...

### Apomorphism

...

### Hylomorphism

...

### Zygomorphism

...

### Mutumorphism

...

### Histomorphism

...

### Futumorphism

...

## Tail and Mutual Recursion with Trampolines

...

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

...

### ETA Conversion

...

### Function Composition

...

### Explicit Thunks

...

### Getters/Setters

...

## Persistent Data Structures

...

## Functional Reactive Programming

### Behavior

...

### Events

...

# Language Conflicts

## `Object.assign`

`Object.assign` calls every getter/setter strictly during copying. This is bad if you rely on their lazy evaluation property. There are a few combinators that replace the function adequately without notable performance penaalty.

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
