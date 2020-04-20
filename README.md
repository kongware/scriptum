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

I've chosen Javascript because it is the Lingua Franca of the internet most programmers are familiar with. Since it includes first class functions, `Proxy`s and lazy `Object` getter/setter we have all ingredients to transform it into a fully-fledged functional language.

In order to achieve that we have to make some effort though. We will explore techniques to alleviate some of the shortcomings that Javascript has with regard to FP. This effort is totally worth it, because you will be able to adapt these techniques to other multi-paradigm languages that suffer from similar issues and thus apply the functional idiom to a wider range of languages.

The 1st part of the course will be kept in an untyped and yet type directed setting. This way we can focus on the functional idioms without being distracted from a type machinery. In the 2nd part we will learn about parametric and ad-hoc polymorphism, higher kinded and higher ranked types and how we can express them with Typescript's structural type system.

## Contribution

Please report an issue if you run across a mistake, ambiguous wording or inconsistent statement in the course. Please let me also know if there is an important subject missing in the chapter pipeline. Your help is much appreciated!

## Status

The scriptum library is still experimental.

## Functional programming course (TOC)

### Part I (untyped)

01. [Values, Expressions and Functions](https://github.com/kongware/scriptum/blob/master/ch-1.md)
02. [Managing State in Functional Programming](https://github.com/kongware/scriptum/blob/master/ch-2.md) (UPDATED VERSION)
03. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/ch-3.md)
04. [Reasonable and Harmful Lambda Abstractions](https://github.com/kongware/scriptum/blob/master/ch-4.md)
05. [Lazy Evaluation on Demand](https://github.com/kongware/scriptum/blob/master/ch-5.md)
06. [Data Modeling with Algebraic Data Types (ADTs)](https://github.com/kongware/scriptum/blob/master/ch-6.md)
07. [Linear Data Flow with Infix Applicators](https://github.com/kongware/scriptum/blob/master/ch-7.md)
08. [From Natural Recursion to Corecursion](https://github.com/kongware/scriptum/blob/master/ch-8.md)
09. [Trading Stack for Heap with Trampolines](https://github.com/kongware/scriptum/blob/master/ch-9.md)
10. [Loop Fusion and Data Source Abstraction with Transducers](https://github.com/kongware/scriptum/blob/master/ch-10.md)
11. [Immutability in Languages w/o Purely Functional Data Types](https://github.com/kongware/scriptum/blob/master/ch-11.md)
12. [A Little Type Theory](https://github.com/kongware/scriptum/blob/master/ch-12.md)
13. Planned: Lifting Pure Functions with Functors (20% done)

* Planned: Respecting the Structure with Natural Transformations
* Planned: Combine Lifted Functions with Applicatives
* Planned: Combine Kleisli Arrows with Monads
* Planned: Composing Effects with Monad Transformers
* Planned: The Runtime - Edge of the Application
* Planned: CPS Transformation for Stack-safe Recursion
* Planned: Functorial Loop Fusion with Co-/Yoneda
* Planned: Mastering Tree Data Structures
* Planned: Streams: Push/Pull, In-/Finite, Uni-/Multicast, Sync/Async
* Planned: Functional Error Handling and Debugging
* Planned: Safely Using Imperative Iterators
* Planned: Common Typeclasses
* Planned: Common Functional Types and Data Structures
* Planned: Random Access, Single Linked and Difference Lists
* Planned: Generalizing Folds and Unfolds with Recursion Schemes
* Planned: Type Wrappers for Improved Semantics
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
