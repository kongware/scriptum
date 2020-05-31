<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

## What

scriptum is a no-frills functional programming library and a learning course based on it.

## Why

scriptum is the attempt to get as close as possible to the functional paradigm by using a multi paradigm language that many developer are familiar with. The main goal is to be language agnostic so that you can transfer the acquired knowledge to your preferred language.

As it turns out all we need to get there...

* are first class functions
* is a mechanism to allow expressions to be in weak head normal form

It is remarkable how many purely functional idioms we can express with these two requirements.

## Who

This course addresses both functional programming novices and experienced imperative programmers.

## How

I am not going to get particularly academic. There won't be equational reasoning, mathematical proofs or cryptic symbols from intuitionistic logic. There are plenty of outstanding academic papers out there, which do that already. Instead, I will attempt to let you develop an intuition by natural language, type annotations and code examples. Natural language need not necessarily mean to use fuzzy metaphors. Natural language can be surprisingly accurate.

Functional programming comes from math, renders certain aspects of your code explicit and favors a high level of abstraction and generalization. These are the reasons why the paradigm seems to be more complex and strict at the beginning. However, you will soon realize that we constantly use a set of recurring patterns and idioms and their mechanics are always the same no matter what context you work in. At a certain point you can put them together almost blindly and it just works as expected.

The 1st part of the course will be kept in an untyped and yet type directed setting. This way we can focus on the functional idioms without being distracted from a type machinery. In the 2nd part we will learn about parametric and ad-hoc polymorphism, higher kinded and higher ranked types and how we can express them with Typescript's structural type system.

## Contribution

Please report an issue if you run across a mistake, ambiguous wording or inconsistent statement in the course. Please let me also know if there is an important subject missing in the chapter pipeline. Your help is much appreciated!

## Status

The chapters of this online course are under continuous change as my knowledge and experience grows. The scriptum library is still experimental and not meant for production code.

## Functional programming course (TOC)

### Part I (untyped)

01. [Values, Expressions and Functions](https://github.com/kongware/scriptum/blob/master/ch-1.md)
02. [Managing State in Functional Programming](https://github.com/kongware/scriptum/blob/master/ch-2.md)
03. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/ch-3.md)
04. [Principled and Unprincipled Abstractions](https://github.com/kongware/scriptum/blob/master/ch-4.md)
05. [Lazy Evaluation on Demand](https://github.com/kongware/scriptum/blob/master/ch-5.md)
06. [Data Modeling with Algebraic Data Types (ADTs)](https://github.com/kongware/scriptum/blob/master/ch-6.md)
07. [Linear Data Flow and Flat Composition Syntax](https://github.com/kongware/scriptum/blob/master/ch-7.md)
08. [From Natural Recursion to Corecursion](https://github.com/kongware/scriptum/blob/master/ch-8.md)
09. [Trading Stack for Heap with Trampolines](https://github.com/kongware/scriptum/blob/master/ch-9.md)
10. [Loop Fusion and Data Source Abstraction with Transducers](https://github.com/kongware/scriptum/blob/master/ch-10.md)
11. [Immutability in Languages w/o Purely Functional Data Types](https://github.com/kongware/scriptum/blob/master/ch-11.md)
12. [A Little Type Theory](https://github.com/kongware/scriptum/blob/master/ch-12.md)
13. [Type class polymorphism through dictionary passing style](https://github.com/kongware/scriptum/blob/master/ch-13.md)
14. [Lifting Pure Functions using Functor](https://github.com/kongware/scriptum/blob/master/ch-14.md) (under revision)
15. [Accumulating, Aggregating and Picking with Monoid](https://github.com/kongware/scriptum/blob/master/ch-15.md)
16. Planned: Statically Combining Contexts with a Pure Function using Applicative (▓▓▓▓▓▓▓▓▓░ 90% done)
17. Planned: Dynamically Combining Contexts with a Kleisi Arrow using Monad
18. [Respecting the Structure with Natural Transformations](https://github.com/kongware/scriptum/blob/master/ch-18.md) (needs revision)

* Planned: Composing Effects with Monad Transformers
* Planned: The Runtime - Edge of the Application
* Planned: CPS Transformation for Stack-safe Recursion
* Planned: Delimited Continuations and Coroutines
* Planned: Functorial Loop Fusion with Co-/Yoneda
* Planned: Mastering Tree Data Structures
* Planned: Streams: Push/Pull, In-/Finite, Uni-/Multicast, Sync/Async
* Planned: Functional Error Handling and Debugging
* Planned: Safely Using Imperative Iterators
* Planned: Multi-Parameter Type Classes and Functional Dependencies
* Planned: List-Comprehension and its extension for other data types
* Planned: Random Access, Single Linked and Difference Lists
* Planned: Generalizing Folds and Unfolds with Recursion Schemes
* Planned: From Sharing to Memoization
* Planned: State Machines
* Planned: Functional Iso (Optics)
* Planned: Functional Lenses (Optics)
* Planned: Functional Prism (Optics)
* Planned: Functional Optional (Optics)
* Planned: Functional Traversals (Optics)
* Planned: Functional Getters (Optics)
* Planned: Functional Setters (Optics)
* Planned: Functional Folds (Optics)
* Planned: Free Monads: Normal-Style, CPS, Codensity, Reflection
* Planned: Freer Monads and Extensible Effects
* Planned: Structuring Large-Scale Functional Applications
* Planned: When FP does not save us
* Planned: Incremental computing
* Planned: Functional Reactive Programming
* Planned: Event Sourcing and Stores
* Planned: Conflict-free Replicated Data Types
* Planned: Common Type Class: `Alt<T>`
* Planned: Common Type Class: `Alternative<T>`
* Planned: Common Type Class: `Applicative<F>`
* Planned: Common Type Class: `Apply<F>`
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
* Planned: Common Functional Type: `Either<A, B>`
* Planned: Common Functional Type: `Endo<A>`
* Planned: Common Functional Type: `Equiv<F>`
* Planned: Common Functional Type: `First<A>`
* Planned: Common Functional Type: `Id<A>`
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
* Planned: Common Functional Type: `Stream<A>`
* Planned: Common Functional Type: `Sum<A>`
* Planned: Common Functional Type: `Task<F>`
* Planned: Common Functional Type: `These<A, B>`
* Planned: Common Functional Type: `Triple<A, B, C>`

## Important/controversial issues

### No external dependencies or preprocessors

This course is meant to lower the threshold for imperative programmers and functional novices to become familiar with the paradigm. Consequently the underlying library solely depends on vanilla Javascript without any external dependencies or additional compiling steps.

### No language specific idioms

I want scriptum to be as simple and as general as possible without any Javascript specific idioms. Hence I don't rely on the prototype system and rarely use method chaining.

### Curried functions only

scriptum relies on curried functions. Currying isn't a prerequisite of functional programming but helps simplifying the function interface. However, for performance reasons I will sporadically use local multi-parameter functions in a recursive context, where large amounts of data are processed.

### Mixed Im-/mutability

Javascript's plain old `Object` type along with functional optics leans itself quite naturally to immutability and is hence treated as such. However, `Array`, `Map`, `Set` et al. are designed for a mutable setting. Treat them as immutable leads to rather inefficient code. If you work with scriptum it is your responsibility as a developer to copy such values before performing destructive updates.
