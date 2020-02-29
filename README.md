<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

## What

scriptum is both a no-frills functional programming library and a comprehensive online course that builds upon this library.

## Why

scriptum is designed to come as close as possible to the purely functional paradigm in order to facilitate the learning process. Goal is to be language agnostic so that you can transfer your new knowldge to your preferred functional or multi-paradigm language. 

## How

I chose Javascript because it is the Lingua Franca of the web most programmers have some experience with. Since it includes first class functions and function literals we have all ingredients necessary to master the functional paradigm.

However, Javascript is not a purely functional language hence we will encounter some drawbacks and techniques to bypass them. These techniques are rather useful since they allow you to apply functional programming to any multi-paradigm language.

Roughly the first third of the course is addressed to functional programming novices and forgos static typing in order to lower the mental load. In the more advanced chapters we will switch to Typescript.

## Status

The scriptum library is still experimental.

## Functional programming course (TOC)

1. [Values, Expressions and Functions](https://github.com/kongware/scriptum/blob/master/ch-1.md)
2. [Managing State in Functional Programming](https://github.com/kongware/scriptum/blob/master/ch-2.md)
3. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/ch-3.md)
4. [Reasonable and Harmful Lambda Abstractions](https://github.com/kongware/scriptum/blob/master/ch-4.md)
5. [Linear Data Flow with Infix Applicators](https://github.com/kongware/scriptum/blob/master/ch-5.md)
6. Upcoming: From Tail Recursion over Trampolining to Corecursion (60% done)

* Planned: Functional Data Modelling, Data Flow and Dependencies<br/>
* Planned: Explicit Ad-hoc Polymorphism <br/>
* Planned: Random Access, Single Linked and Difference Lists <br/>
* Planned: Loop Fusion through Transducers <br/>
* Planned: CPS-Transformation and Local Continuation Passing Style <br/>
* Planned: Abstract from Recursion with Recursion Schemes <br/>
* Planned: Trees in-depth <br/>
* Planned: Functional Error Handling and Debugging <br/>
* Planned: Working properly with imperative iterators <br/>
* Planned: Functor Typeclass <br/>
* Planned: Applicative Functor Typeclass <br/>
* Planned: Monad Typeclass <br/>
* Planned: Lazy Evaluation in a Strict Environment <br/>
* Planned: Corecursion and codata <br/>
* Planned: Push and Pull Streams <br/>
* Planned: The Runtime - Edge of the Application <br/>
* Planned: Adapted Hindley-Milner Type Annotations <br/>
* Planned: Parametric, Ad-hoc and Row Polymorphism <br/>
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

### No Preprocessors or other language extensions

This course is meant to be about vanilla Javascript. I will not use any preprocessors or language extensions like macros.

### No prototype system and method chaining

I want scriptum to be as simple and as general as possible without any distractions. The prototype system and method chaining are both specific to Javascript and not necessary for functional programming. Hence I don’t use them.

By giving up both features we lose the following two abilities:

* associate object types with methods
* create flat, sequential method chains

Luckily both can be replaced through functional techniques. I will introduce them in subsequent chapters of these course.

### Curried functions only

Curried functions are not a prerequisite for functional programming. However they simplify the function interface by abstracting over arity: Every function unexceptionally expects a single argument.

You could argue that the curry/uncurry combinators trivially transform a curried function into its multi-argument form and vice versa, because they constitute their isomorphism. Having these combinators scattered throughout your code is tedious and distracting though. Let’s adhere to the one argument per function rule to make our lives easer.

### Lazy evaluation on demand

scriptum pursues a strict evaluation strategy as does Javascript. There are two distinct types that enable lazy evaluation through explicit thunks though. I will introduce them in subsequent chapters.

### Immutability as the default

scriptum assumes immutable data. However, Javascript offers a mutable environment meant for imperative algorithms. Hence we relax the just given rule by allowing local mutations inside function bodies.

Beyond that scriptum supplies both various techniques to avoid mutations and a persistent data structure based on hashed array mapped tries. So we have a rich toolset at hand to handle immutability quite well.
