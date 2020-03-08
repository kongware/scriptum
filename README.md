<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

## What

scriptum is a no-frills functional programming library and a detailed course based on this library.

## Why

scriptum is the attempt to get as close as possible to the functional paradigm by using a multi paradigm language that many developer are familiar with. The main goal is to be language agnostic so that you can transfer the acquired knowldge to your preferred language.

As it turned out all we need to get there is...

* first class functions
* a mechanism to allow expressions to be in weak head normal form

It is remarkable how many purely functional idioms we can express with these two.

## Who

This course addresses both experienced imperative programmers and functional programming novices.

## How

I've chosen Javascript because it is the Lingua Franca of the web most programmers have some experience with. Since it includes first class functions and lazy `Object` getter/setter we have all ingredients to transform it into a fully-fledged functional language.

However, Javascript is not a purely functional language hence we will encounter some drawbacks and corresponding techniques to bypass them. These techniques are particularly useful since they allow you to apply functional programming to arbitrary multi-paradigm languages.

The first half of the course will take place in an untyped and yet type directed setting. In the second half we will learn how to express polymorphism with Typescript's structural typing.

## Contribution

Please report an issue if you run across a mistake, ambiguous wording or inconsistent statement in the course. Please let me also know if there is an important subject missing in the chapter pipeline. Your help is much appreciated!

## Status

The scriptum library is still experimental.

## Functional programming course (TOC)

1. [Values, Expressions and Functions](https://github.com/kongware/scriptum/blob/master/ch-1.md)
2. [Managing State in Functional Programming](https://github.com/kongware/scriptum/blob/master/ch-2.md)
3. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/ch-3.md)
4. [Reasonable and Harmful Lambda Abstractions](https://github.com/kongware/scriptum/blob/master/ch-4.md)
5. Upcoming: Lazy Evaluation and WHNF in a Strictly Evaluated Setting (0% done)
6. Upcoming: GADTs, Functional Data Modelling and Data Dependencies (0% done)
7. Upcoming: Effects Encoded as Values (0% done)
8. [Linear Data Flow with Infix Applicators](https://github.com/kongware/scriptum/blob/master/ch-8.md)
9. [From Natural Recursion to Corecursion](https://github.com/kongware/scriptum/blob/master/ch-9.md)

* Planned: CPS-Transformation and Local Continuation Passing Style <br/>
* Planned: Random Access, Single Linked and Difference Lists <br/>
* Planned: Loop Fusion through Transducers <br/>
* Planned: Streams: Push/Pull, In-/Finite, Uni-/Multicast, Sync/Async <br/>
* Planned: Mastering Tree Data Structures <br/>
* Planned: Generalizing Folds and Unfolds with Recursion Schemes <br/>
* Planned: Functional Error Handling and Debugging <br/>
* Planned: Safly Using Imperative Iterators <br/>
* Planned: Foldable and Unfoldable Typeclasses <br/>
* Planned: Functor Typeclass <br/>
* Planned: Applicative Functor Typeclass <br/>
* Planned: Monad Typeclass <br/>
* Planned: The Most Common Typeclasses <br/>
* Planned: The Most Common Functional Types <br/>
* Planned: Composing Effects with Monad Transformers<br/>
* Planned: The Runtime - Edge of the Application <br/>
* Planned: Type Wrappers for Improved Semantics<br/>
* Planned: Immutabilty through Persistent Data Structures <br/>
* Planned: Alleviating the Need for Mutability <br/>
* Planned: From Sharing to Memoization <br/>
* Planned: Delimited Continuations <br/>
* Planned: Coroutines Backed by Delimited Continuations <br/>
* Planned: Almost Pattern Matching through Unification <br/>
* Planned: Functional Iso (Optics) <br/>
* Planned: Functional Lenses (Optics) <br/>
* Planned: Functional Prism (Optics) <br/>
* Planned: Functional Optional (Optics) <br/>
* Planned: Functional Traversals (Optics) <br/>
* Planned: Functional Getters (Optics) <br/>
* Planned: Functional Setters (Optics) <br/>
* Planned: Functional Folds (Optics) <br/>
* Planned: Encode DSLs with Free and Freer Monads <br/>
* Planned: Encode DSLs with Tagless Final Encoding <br/>
* Planned: Encode DSLs with ZIO <br/>
* Planned: Adapted Hindley-Milner Type Annotations (Type Theory) <br/>
* Planned: Nominal and Structural Typing and Polymorphism (Type Theory)<br/>
* Planned: Higher Kinded and Higher Rank Types (Type Theory)<br/>
* Planned: Functional Programming with Typescript <br/>
* Planned: Structuring Large-scale Functional Applications
* Planned: When FP does not save us

## Important/controversial issues

### No external dependencies or preprocessors

This course is meant to lower the threshold for imperative programmers and functional novices to become familiar with the paradigm. Consequently the underlying library solely depends on vanilla Javascript without any external dependencies or additional compiling steps.

### No language specific idioms

I want scriptum to be as simple and as general as possible without any Javascript specific idioms. Hence I don't rely on the prototype system and rarely use method chaining.

### Curried functions only

scriptum relies on curried functions. Currying isn't a prerequisite of functional programming but helps simplifying the function interface. However, for performance reasons I will sporadically use local multi-parameter functions in a recursive context, where large amounts of data are processed.

### Mixed Im-/mutability

Javascript's plain old `Object` type along with functional optics leans itself quite naturally to immutability and is hence treated as such. However, `Array`, `Map`, `Set` et al. are designed for a mutable setting. Treating them as immutable leads to rather inefficient code. If you work with scriptum it is your responsibility as a developer to copy such values before performing destructive updates.
