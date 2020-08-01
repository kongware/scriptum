<img src="./scriptum.png" alt="scriptum"><br>

## What

A no-frills functional programming course based on the Javascript scriptum library.

The first part of the course is untyped to avoid the additional complexity of a type system and to reveal the underlying algorithms. Type systems are important though. For this reason the second part takes place in a typed setting. I will use both Typescript and a type validator based on an extended version of the Hindley Milner type system including higher-kinded types, higher-rank types and row polymorphism.

## Status

The chapters of this online course are under continuous change as my knowledge and experience grows. The scriptum library is still experimental and not meant for production code.

## Table of Contents

### Part I (untyped)

01. [Functional Jargon and Programming Experience](https://github.com/kongware/scriptum/blob/master/course/ch-001.md)
02. [Handling State in Functional Programming](https://github.com/kongware/scriptum/blob/master/course/ch-002.md)
03. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/course/ch-003.md)
04. [Lawful and Lawless Abstractions](https://github.com/kongware/scriptum/blob/master/course/ch-004.md) [under edit]
05. [Data Modeling with Algebraic Data Types (ADTs)](https://github.com/kongware/scriptum/blob/master/course/ch-005.md) ✎
06. [Lazy Evaluation on Demand](https://github.com/kongware/scriptum/blob/master/course/ch-006.md)
07. [Linear Data Flow and Flat Composition Syntax](https://github.com/kongware/scriptum/blob/master/course/ch-007.md)
08. [From Recursion to Corecursion](https://github.com/kongware/scriptum/blob/master/course/ch-008.md)
09. [Trading Stack for Heap with Trampolines](https://github.com/kongware/scriptum/blob/master/course/ch-009.md)
10. [Loop Fusion and Data Source Abstraction with Transducers](https://github.com/kongware/scriptum/blob/master/course/ch-010.md)
11. [Immutability in Languages w/o Purely Functional Data Types](https://github.com/kongware/scriptum/blob/master/course/ch-011.md)
12. [Basics on Type/Kind Systems and Polymorphism](https://github.com/kongware/scriptum/blob/master/course/ch-012.md) ✎
13. [Type class polymorphism through dictionary passing style](https://github.com/kongware/scriptum/blob/master/course/ch-013.md)
14. [Lifting Pure Functions using Functor](https://github.com/kongware/scriptum/blob/master/course/ch-014.md)
15. [Accumulating, Aggregating and Picking with Monoid](https://github.com/kongware/scriptum/blob/master/course/ch-015.md)
16. [Combining Effects with Pure Functions using Applicative](https://github.com/kongware/scriptum/blob/master/course/ch-016.md)
17. [Combining Effects with Actions using Monad](https://github.com/kongware/scriptum/blob/master/course/ch-017.md)
18. Planned: Composing Different Effects with Monad Transformers (▓▓▓░░░░░░░ 30% done)
19. Planned: The Main Function - Impure Edge of your Porgram (░░░░░░░░░░ 0% done)
19. [Respecting the Structure with Natural Transformations](https://github.com/kongware/scriptum/blob/master/course/ch-019.md) [needs editing]


### Part II (typed)

to be continued...

## Why

Functional programming comes from math and thus has the most sound theoretically foundation of all paradigms. While mathematical reasoning is hard and non-intuitive at first it leads to sounder programs in the long term. The usual learning experience is to never look back.

## Who

You do not need a mathematical or PLT background to follow this course.

## How

scriptum is the attempt to get as close as possible to the functional paradigm using a multi paradigm language that many developer are familiar with. The main goal is to be language agnostic so that you can transfer the acquired knowledge to your preferred language.

As it turns out all we need to get there...

* are first class functions
* is a mechanism to allow expressions to be in weak head normal form

It is remarkable how many purely functional idioms we can express with only these two requirements at hand.

## Contribution

Please report an issue if you run across a mistake, ambiguous wording or inconsistent statement in the course. Please let me also know if there is an important subject missing in the chapter pipeline. Your help is much appreciated!

## Controversial decisions

### No external dependencies or preprocessors

This course is meant to lower the threshold for imperative programmers and functional novices to become familiar with the paradigm. Consequently the underlying library solely depends on vanilla Javascript without any external dependencies or additional compiling steps.

### No language specific idioms

I want scriptum to be as simple and as general as possible without any Javascript specific idioms. Hence I don't rely on the prototype system and rarely use method chaining.

### Curried functions only

scriptum relies on curried functions. Currying isn't a prerequisite of functional programming but helps simplifying the function interface. However, for performance reasons I will sporadically use local multi-parameter functions in a recursive context, where large amounts of data are processed.

### Mixed Im-/mutability

Javascript's plain old `Object` type along with functional optics leans itself quite naturally to immutability and is hence treated as such. However, `Array`, `Map`, `Set` et al. are designed for a mutable setting. Treat them as immutable leads to rather inefficient code. If you work with scriptum it is your responsibility as a developer to copy such values before performing destructive updates.

## TODO

* Planned: Functorial Loop Fusion with Co-/Yoneda
* Planned: Generalizing Folds and Unfolds with Recursion Schemes
* Planned: Managing Time-Varying Values in a Functional Fashion
* Planned: Extracing values with Comonad
* Planned: The Runtime - Outer Rim of your Application
* Planned: All About Continuations (Transformation, Delimited, etc.)
* Planned: From Sharing to Memoization
* Planned: Functional Encoded State Machines
* Planned: Mastering Tree Data Structures
* Planned: Streams: Push/Pull, In-/Finite, Uni-/Multicast, Sync/Async
* Planned: Functional Error Handling and Debugging
* Planned: From Unit- to Property-based Testing
* Planned: Multi-Parameter Type Classes and Functional Dependencies
* Planned: List-Comprehension and its extension for other data types
* Planned: Random Access, Single Linked and Difference Lists
* Planned: Functional Iso (Optics)
* Planned: Functional Lenses (Optics)
* Planned: Functional Prism (Optics)
* Planned: Functional Optional (Optics)
* Planned: Functional Traversals (Optics)
* Planned: Functional Getters (Optics)
* Planned: Functional Setters (Optics)
* Planned: Functional Folds (Optics)
* Planned: Free Monads - Normal Style, Codensity, CPS (Church encoded), Reflection
* Planned: Freer Monads and Extensible Effects
* Planned: Tagless Final Encoding
* Planned: Functional Architectures
* Planned: Type-Directed Programming
* Planned: When FP does not save us
* Planned: Incremental computing
* Planned: Functional Reactive Programming
* Planned: Event Sourcing and Stores
* Planned: Conflict-free Replicated Data Types
* Planned: Common Type Class: `Alt<T>`
* Planned: Common Type Class: `Alternative<T>`
* Planned: Common Type Class: `Applicative<F>`
* Planned: Common Type Class: `Apply<F>`
* Planned: Common Type Class: `Behavior<A, E>`
* Planned: Common Type Class: `Bifunctor<T>`
* Planned: Common Type Class: `Bounded<T>`
* Planned: Common Type Class: `Category<T>`
* Planned: Common Type Class: `Chain<T>`
* Planned: Common Type Class: `Clonable<T>`
* Planned: Common Type Class: `Comonad<W>`
* Planned: Common Type Class: `Contravariant<T>`
* Planned: Common Type Class: `Distributive<F>`
* Planned: Common Type Class: `Enum<T>`
* Planned: Common Type Class: `Extend<W>`
* Planned: Common Type Class: `Foldable<T>`
* Planned: Common Type Class: `Functor<F>`
* Planned: Common Type Class: `Filterable<T>`
* Planned: Common Type Class: `Functor<F>`
* Planned: Common Type Class: `Group<T>`
* Planned: Common Type Class: `Ix<T>`
* Planned: Common Type Class: `IxMonad<M>`
* Planned: Common Type Class: `Monad<M>`
* Planned: Common Type Class: `Monoid<M>`
* Planned: Common Type Class: `Observable<A, E>`
* Planned: Common Type Class: `Ord<T>`
* Planned: Common Type Class: `Partial<T>`
* Planned: Common Type Class: `Plus<T>`
* Planned: Common Type Class: `Profunctor<T>`
* Planned: Common Type Class: `Representable<F>`
* Planned: Common Type Class: `Semigroup<T>`
* Planned: Common Type Class: `Semigroupoid<T>`
* Planned: Common Type Class: `Serializable<T>`
* Planned: Common Type Class: `Setoid<T>`
* Planned: Common Type Class: `Traversable<T>`
* Planned: Common Type Class: `Unfoldable<T>`
* Planned: Common Type Class: `Unserializable<T>`
* Planned: Common Functional Type: `All`
* Planned: Common Functional Type: `Any`
* Planned: Common Functional Type: `Comparator`
* Planned: Common Functional Type: `Compare<A>`
* Planned: Common Functional Type: `Compose<F, G, A>`
* Planned: Common Functional Type: `Const<A, B>`
* Planned: Common Functional Type: `Cont<K>`
* Planned: Common Functional Type: `Contrvaraint<F>`
* Planned: Common Functional Type: `Effect<A>`
* Planned: Common Functional Type: `Either<A, B>`
* Planned: Common Functional Type: `Endo<A>`
* Planned: Common Functional Type: `Equiv<F>`
* Planned: Common Functional Type: `First<A>`
* Planned: Common Functional Type: `Id<A>`
* Planned: Common Functional Type: `Invariant<F>`
* Planned: Common Functional Type: `Last<A>`
* Planned: Common Functional Type: `Lazy<F>`
* Planned: Common Functional Type: `List<A>`
* Planned: Common Functional Type: `Max<A>`
* Planned: Common Functional Type: `Min<A>`
* Planned: Common Functional Type: `Option<A>`
* Planned: Common Functional Type: `Pair<A, B>`
* Planned: Common Functional Type: `Parallel<F>`
* Planned: Common Functional Type: `Pred<A>`
* Planned: Common Functional Type: `Product<A>`
* Planned: Common Functional Type: `Record<R>`
* Planned: Common Functional Type: `Ref<A>`
* Planned: Common Functional Type: `ST<S, A>`
* Planned: Common Functional Type: `Stream<A>`
* Planned: Common Functional Type: `Sum<A>`
* Planned: Common Functional Type: `Task<F>`
* Planned: Common Functional Type: `These<A, B>`
* Planned: Common Functional Type: `Triple<A, B, C>`
* Planned: Common Functional Type: `Validate<E, A>`
* Planned: Common Functional Type: `ValueObj<K, V>`
