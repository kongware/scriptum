<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

## What

scriptum is both a no-frills functional programming library and a comprehensive online course that builds upon this library.

## Why

scriptum is designed to come as close as possible to the purely functional paradigm in order to facilitate the learning process. Goal is to be language agnostic so that you can transfer your new knowldge to your preferred functional or multi-paradigm language. 

## Who

This course addresses both experienced imperative programmers who want to explore the functional paradigm and functional programming novices who want to delve deeper into the functional way of reasoning.

## How

I chose Javascript because it is the Lingua Franca of the web most programmers have some experience with. Since it includes first class functions and function literals we have all ingredients necessary to master the functional paradigm.

However, Javascript is not a purely functional language hence we will encounter some drawbacks and techniques to bypass them. These techniques are rather useful since they allow you to apply functional programming to any multi-paradigm language.

Roughly the first third of the course is addressed to functional programming novices and forgos static typing in order to lower the mental load. In the more advanced chapters we will switch to Typescript.

## Contribution

Please report an issue if you find a mistake, ambiguous wording or inconsistent statements in the course. And please let me know if there is an important subject missing in the chapter pipeline. Your help is much appreciated!

## Status

The scriptum library is still experimental.

## Functional programming course (TOC)

1. [Values, Expressions and Functions](https://github.com/kongware/scriptum/blob/master/ch-1.md)
2. [Managing State in Functional Programming](https://github.com/kongware/scriptum/blob/master/ch-2.md)
3. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/ch-3.md)
4. [Reasonable and Harmful Lambda Abstractions](https://github.com/kongware/scriptum/blob/master/ch-4.md)
5. [Linear Data Flow with Infix Applicators](https://github.com/kongware/scriptum/blob/master/ch-5.md)
6. [From Natural Recursion to Corecursion](https://github.com/kongware/scriptum/blob/master/ch-6.md)
6. Upcoming: Functional Data Modelling and Data Dependencies (0% done)

* Planned: Nominal and Structural Typing of Polymorphic Types<br/>
* Planned: Random Access, Single Linked and Difference Lists <br/>
* Planned: Loop Fusion through Transducers <br/>
* Planned: Generalizing Folds and Unfolds with Recursion Schemes <br/>
* Planned: CPS-Transformation and Local Continuation Passing Style <br/>
* Planned: Trees in-depth <br/>
* Planned: Functional Error Handling and Debugging <br/>
* Planned: Working Correctly with imperative iterators <br/>
* Planned: Functor Typeclass <br/>
* Planned: Applicative Functor Typeclass <br/>
* Planned: Monad Typeclass <br/>
* Planned: Lazy Evaluation in a Strict Environment <br/>
* Planned: Corecursion and codata <br/>
* Planned: Push and Pull Streams <br/>
* Planned: The Runtime - Edge of the Application <br/>
* Planned: Adapted Hindley-Milner Type Annotations <br/>
* Planned: Higher-Kinded and Higher-Rank Types with Typescript <br/>
* Planned: Type Wrappers for Improved Semantics<br/>
* Planned: Effects Encoded as Values <br/>
* Planned: Composing Effects with Monad Transformers<br/>
* Planned: Immutabilty through Persistent Data Structures <br/>
* Planned: Alleviating the Need for Mutability <br/>
* Planned: From Sharing to Memoization <br/>
* Planned: Delimited Continuations <br/>
* Planned: Coroutines Backed by Delimited Continuations <br/>
* Planned: Persistent Iterators and Generators<br/>
* Planned: Almost Pattern Matching through Unification <br/>
* Planned: The Most Common Typeclasses <br/>
* Planned: The Most Common Functional Types <br/>
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
* Planned: Structuring Large-scale Functional Applications
* Planned: When FP does not save us

## Important/controversial issues

### No Preprocessors or external dependencies

This course is meant to lower the threshold for imperative programmers and functional novices to become familiar with the paradigm. Consequently this course and the underlying library solely depend on vanilla Javascript without any external dependencies or additional compiling steps.

### No language specific idioms

I want scriptum to be as simple and as general as possible without any Javascript specific idioms. Hence I won't use the prototype system and method chaining only in rare cases. All we need for functional programming are first class functions, which are pure and a bunch of object wrappers to mimic types.

### Curried functions only

scriptum relies on curried functions. They are not a prerequisite of functional programming but help simplifying the function interface. For performance reasons I will sporadically use local multi-parameter functions in a recursive context, where large amounts of data are processed.

### Mixed Im-/mutability

Javascript's plain old `Object` type lends itself to immutability and is treated as such by scriptum. However, `Array`, `Map`, `Set` et al. are designed for a mutable setting. Treating them as immutable leads to extremely inefficient code. As a result scriptum treats them as mutable. It is the responsibility of the programmer to copy them prior to destructive updates.
