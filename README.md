<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

Experimental and still work in progress.

## What

A type-directed functional library that adapts well-known functional patterns to untyped Javascript, so that maybe at some point these patterns may become idiomatic for Javascript.

## Mission Statement

scriptum is the endeavour to make functional programming applicable in pratice for people without an PhD in computer science.

## Fundamentals

### Pragmatism over Dogmatism

Javascript lacks a non-trivial type system and all the guarantees that go along with it and it lacks functional data types. As a consequence mutations and reassignments are allowed, as long as they are local, i.e. not observable in the parent scope.

### Convention over Coercion

scriptum relies heavily on coventions and it depends on the will and the discipline of the consumer to adhere to them.

### Expresions over Statements

Expressions are good, because you can compose them and pass them around like data. scriptum provides means to express everything as an expression. However, sometimes algorithms are more comprehensible if you have intermediate values and some structuring conditional statements. If statements are wrapped in functions and are thus local, you shouldn't be ashamed to use them.

### Everything is Curried

scriptum prefers curried to multi-argument functions. This drastically simplifies function or rather partial application. However, as we have `curry` and `uncurry` in our toolset, which renders both forms isomorphic, you can use multi-argument functions when necessary.

### Unions of Records

You should model your business domain in the form of alternatives rather than static hierarchies. Hierarchies only allow to add information when you move from top to bottom. But the real world isn't assambled in such a mechanical way. Alternatives on the other hand are more flexible to represent a chaotic real world as a data structure. In scriptum alternatives are expressed with tagged unions, which may contain other tagged unions or records.

### Directory Passing over Prototypes

scriptum doesn't rely on Javascript's prototype system. As a consequence, scriptum uses directory passing, i.e. typeclasses are passed as normal arguments to functions. As a convetion, typeclass arguments are placed leftmost in the argument list and if the function expects several typeclasses you can bundle them for a multiple argument function call. This is actually the only exception where scriptum allows multiple arguments.

Directory passing is provided to allow for ad-hoc polymorphism in Javascript in a principled manner.

### Effect Handling

scriptum promotes effect handling through monads, monad transformer stacks and tagless final encodings. Impure computations themselves are wrapped in thunks so that their evaluation can be temporally deferred. This way we can sort of separate the pure from the impure part of our program, which is great for equational reasoning of the pure portion.

### Folds over Recursion over Loops

Recursion is a big win compared to imperative loops. However, in Javascript we have neither tail call optimization nor more advanced optimization strategies. So we are stuck with tail recursion implemented through trampolines, which are structurally just loops.

What we want is a mechanism to abstract from direct recursion altogether. scriptum uses folds or more specifically catamorphisms et al. to separate the recursion from our algorithms and domain logic. These folds have to be implemented as a trampoline to each data type, though.

### Loop Fusion over Generators/Iterators

scriptum avoids the use of generators/iterators for most use cases. Instead, it relies on loop fusion either directly with function composition or with the help of the yoneda lemma. Generators/iterators are stateful constructs in Javascript and thus may compromise your pure program with side effects.

### Thunks over Generators/Iteratos

For the same reason scriptum facvors thunks to generators/iterators to obtain lazy evaluation.

# Custom Types

There s a constructor each for union types (`union`) and record types (`struct`). Both merely wrap a value into an plain old Javascript object, which is augmented with some properties useful for reasoning and debugging.

Additionally a `structMemo` is provided to allow for memoized getters.

There are a couple of pre-defined custom types in order to use them with certain typeclass functions.

# Typeclass Functions

typeclass functions are a means to enable ad-how polymorphism in a principled manner in Javascript. Ad-hoc polymorphism simply means that a function can handle different data types as its arguments, as long as these types implement the necessary typeclass functions. In Javascript usually the prototype system is used to render this mechanism implicit. scriptum, however, favors explicit typeclass function passing. While this is more laborious it also makes the respective constraints more obvious and is more powerful than implicit typclasses expressed through the prototype system.

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

scriptum allows for a flat syntax without nested function calls and (almost) without dot-noation:

```Javascript
const inc = x => x + 1,
  sqr = x => x * x;
  
compn(inc) (sqr) (inc) (inc) (inc).runComp(1); // 25
pipen(inc) (inc) (inc) (inc) (sqr).runComp(1); // 25
```
`compn`/`pipen` take an infinite number of functions and build up a growing function composition. Only if you call it by passing an argument to the `runComp`/`runPipe` property, the composition is actually evaluated. scriptum provides this flat syntax combinators for...

* applicative lifting
* monadic lifting
* monadic chains
* kleisli composition
* Lens composition

and a growing number of other useful data types.

## Structural Folding

### Catamorphism

A catamorphism is the generalization of a fold. So what is a fold? In its strict meaning it is a sequential reduction of a collection.  Catamorphisms go beyond folds by representing the notion of destructuring any non-primitive data type. You can think of a catamorphism as an elemination rule of its type, whereas the corresponding constructor is the introduction rule. What makes this distinction hard is that for some data types folds and catamorphisms coincide, whereas for others the catamorphism is more expressive and the fold is merely derived from it.

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

...

## Effect Handling

### Monads

...

### Monad Transformers

...

### Freer Monads

...

### Tagless Final Encoding

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

### Getter/Setter

...

## Persistent Data Structure

...

## Functional Reactive Programming

### Behavior

...

### Events

...

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
