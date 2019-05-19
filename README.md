<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

Experimental.

## What

A type-directed functional library that adapts well-known functional patterns to untyped Javascript, so that maybe at some point these patterns may become idiomatic for Javascript.

## Mission Statement

scriptum is the endeavour to make functional programming applicable in pratice for people without an PhD in computer science.

## Fundamentals

### Pragmatism over Dogmatism

Javascript lacks a non-trivial type system and all the guarantees that go along with it and it lacks functional data types. As a consequence mutations and reassignments are allowed, as long as they are local, i.e. not observable in the parent scope.

### Convention over Coercion

scriptum relies heavily on coventions and it depends on the will and the discipline of the consumer to adhere to them.

### Everything is Curried

scriptum doesn't include multi-argument functions. Every function is curried. This drastically simplifies function or rather partial application. If you need a multi argument function use tuples instead.

### Unions of Structs

You should model your business domain in the form of alternatives rather than static hierarchies. Hierarchies only allow to add information when you move from top to bottom. But the real world isn't assambled in such a mechanical way. Alternatives on the other hand are more flexible to represent a chaotic real world as a data structure. In scriptum alternatives are expressed with tagged unions, which may contain other tagged unions or structures (record types).

### Expresions over Statements

Expressions are good, because you can compose them and pass them around like data. scriptum provides means to express everything as an expression. However, sometimes algorithms are more comprehensible if you have intermediate values and some structuring conditional statements. If statements are wrapped in functions and are thus local, you shouldn't be ashamed to use them.

### Defer impure computations

If you wrap an impure expression into a function, you can not only generalize its use but also defer its evaluation. When you cannot further generalize a computation, i.e. you cannot abstract further arguments, then you still can wrap it in a thunk.

scriptum uses thunks to defer the evaluation of impure computations. Thunks are pretty ugly though and we don't want them to fly around throughout our codebase. For that reason scriptum ships with an appropriate data type, which coincidentally implements the functor, applicative and monad typeclass.

### Folds over Recursion over Loops

Recursion is a big win compared to imperative loops. However, in Javascript we have neither tail call optimization nor more advanced optimization strategies. So we are stuck with tail recursion implemented through trampolines, which are structurally just loops.

What we want is a mechanism to abstract from direct recursion altogether. scriptum uses folds or more specifically catamorphisms et al. to separate the recursion from our algorithms and domain logic. These folds have to be implemented as a trampoline to each data type, though.

### Loop Fusion over Generators/Iteratos

scriptum avoids the use of generators/iterators for most use cases. Instead, it relies on loop fusion either directly with function composition or with the help of the yoneda lemma. Generators/iterators are stateful constructs in Javascript and thus may compromise your pure program with side effects.

### Thunks over Generators/Iteratos

For the same reason scriptum facvors thunks to generators/iterators to obtain lazy evaluation.

### Directory Passing over Prototypes

scriptum doesn't rely on Javascript's prototype system. As a consequence, scriptum uses directory passing, i.e. typeclasses are passed as normal arguments to functions. As a convetion, typeclass arguments are placed leftmost in the argument list and if the function expects several typeclasses you can bundle them for a multiple argument function call. This is actually the only exception where scriptum allows multiple arguments.

By the way, if you want method chaining you can do it without being ashamed, as long it depends on object factories.

### Monadic Task over Promises

`Promise`s are a strangly implemented and harmful data type. However, they are omnipresent and the foundation of even more harmful syntax like `async`/`await`. So it isn't easy to escape them.

scriptum ships with an alternative monadic type for asynchronous computations called `Task` and means for `Promise` compliance, i.e. converting between `Promise` and `Task`.

# Custom Types

...

# Typeclasses

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

...

# Advanced Topics

## Avoiding Parenthesis

...

## Tail and Mutual Recursion

...

## Lazy Evaluation

### Functions

### ETA Conversion

### Function Composition

### Explicit Thunks

...

## Yoneda Lemma

...

## Transducer

...

## Monad Transformer

...

## Functional Optics

...

## Persistent Data Structure

...

## Effect Handling

...

## Monad Transformers vs. Freer Monads vs. Tagless Final Encoding

...

## Functional Reactive Programming

### Behavior

### Events

...
