<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

## What

scriptum is a no-frills functional programming library and a learning course based on it.

## Why

scriptum is the attempt to get as close as possible to the functional paradigm by using a multi paradigm language that many developer are familiar with. The main goal is to be language agnostic so that you can transfer the acquired knowldge to your preferred language.

As it turned out all we need to get there is...

* first class functions
* a mechanism to allow expressions to be in weak head normal form

It is remarkable how many purely functional idioms we can express with these two requirements.

## Who

This course addresses both experienced imperative programmers and functional programming novices.

## How

I've chosen Javascript because it is the Lingua Franca of the web most programmers have some experience with. Since it includes first class functions, `Proxy`s and lazy `Object` getter/setter we have all ingredients to transform it into a fully-fledged functional language.

However, Javascript is not a purely functional language hence we will encounter some drawbacks and corresponding techniques to bypass them. These techniques are particularly useful since they allow you to apply functional programming to arbitrary multi-paradigm languages.

The first half of the course will take place in an untyped and yet type directed setting. In the second half we will learn how to express polymorphism with Typescript's structural typing.

## Contribution

Please report an issue if you run across a mistake, ambiguous wording or inconsistent statement in the course. Please let me also know if there is an important subject missing in the chapter pipeline. Your help is much appreciated!

## Status

The scriptum library is still experimental.

## Functional programming course (TOC)

01. [Values, Expressions and Functions](https://github.com/kongware/scriptum/blob/master/ch-1.md)
02. [Managing State in Functional Programming](https://github.com/kongware/scriptum/blob/master/ch-2.md)
03. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/ch-3.md)
04. [Reasonable and Harmful Lambda Abstractions](https://github.com/kongware/scriptum/blob/master/ch-4.md)
05. [Lazy Evaluation on Demand](https://github.com/kongware/scriptum/blob/master/ch-5.md)
06. [Data Modeling with Algebraic Data Types (ADTs)](https://github.com/kongware/scriptum/blob/master/ch-6.md)
07. [Linear Data Flow with Infix Applicators](https://github.com/kongware/scriptum/blob/master/ch-7.md)
08. [From Natural Recursion to Corecursion](https://github.com/kongware/scriptum/blob/master/ch-8.md)
09. [Trading Stack for Heap with Trampolines](https://github.com/kongware/scriptum/blob/master/ch-9.md)
10. Planned: Data Structure Abstraction and Loop Fusion with Transducers (10% done)

* Planned: CPS Transformation for Stack-safe Recursion
* Planned: Lifting Pure Functions with Functors
* Planned: Combine Lifted Functions with Applicatives
* Planned: Combine Kleisli Arrows with Monads
* Planned: Functorial Loop Fusion with Yoneda
* Planned: Respecting the Structure with Natural Transformations
* Planned: Composing Effects with Monad Transformers
* Planned: The Runtime - Edge of the Application
* Planned: Mastering Tree Data Structures
* Planned: Streams: Push/Pull, In-/Finite, Uni-/Multicast, Sync/Async
* Planned: Functional Error Handling and Debugging
* Planned: Safely Using Imperative Iterators
* Planned: Common Typeclasses
* Planned: Common Functional Types and Data Structures
* Planned: Random Access, Single Linked and Difference Lists
* Planned: Generalizing Folds and Unfolds with Recursion Schemes
* Planned: Type Wrappers for Improved Semantics
* Planned: Immutabilty through Persistent Data Structures
* Planned: Mitigating the Need for Mutability
* Planned: From Sharing to Memoization
* Planned: Delimited Continuations
* Planned: Coroutines Backed by Delimited Continuations
* Planned: Functional Iso (Optics)
* Planned: Functional Lenses (Optics)
* Planned: Functional Prism (Optics)
* Planned: Functional Optional (Optics)
* Planned: Functional Traversals (Optics)
* Planned: Functional Getters (Optics)
* Planned: Functional Setters (Optics)
* Planned: Functional Folds (Optics)
* Planned: Encode DSLs with Free and Freer Monads
* Planned: Encode DSLs with Tagless Final Encoding
* Planned: Encode DSLs with ZIO
* Planned: Adapted Hindley-Milner Type Annotations (Type Theory)
* Planned: Nominal and Structural Typing and Polymorphism (Type Theory)
* Planned: Higher Kinded and Higher Rank Types (Type Theory)
* Planned: Functional Programming with Typescript
* Planned: Structuring Large-scale Functional Applications
* Planned: When FP does not save us
* Planned: Functional Reactive Programming
* Planned: Event Sourcing and Stores
* Planned: Conflict-free Replicated Data Types

## Important/controversial issues

### No external dependencies or preprocessors

This course is meant to lower the threshold for imperative programmers and functional novices to become familiar with the paradigm. Consequently the underlying library solely depends on vanilla Javascript without any external dependencies or additional compiling steps.

### No language specific idioms

I want scriptum to be as simple and as general as possible without any Javascript specific idioms. Hence I don't rely on the prototype system and rarely use method chaining.

### Curried functions only

scriptum relies on curried functions. Currying isn't a prerequisite of functional programming but helps simplifying the function interface. However, for performance reasons I will sporadically use local multi-parameter functions in a recursive context, where large amounts of data are processed.

### Mixed Im-/mutability

Javascript's plain old `Object` type along with functional optics leans itself quite naturally to immutability and is hence treated as such. However, `Array`, `Map`, `Set` et al. are designed for a mutable setting. Treating them as immutable leads to rather inefficient code. If you work with scriptum it is your responsibility as a developer to copy such values before performing destructive updates.
