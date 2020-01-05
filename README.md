<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

## What

scriptum is a no-frills functional language based on Javascript accompanied by an online course to learn the functional paradigm.

## Why

scriptum is designed in a way to facilitate learning functional programming. It is shipped with a comprehensive online course, which is for the time being only available through a series of written posts. Accompanying video lectures are already planned though.

## Status

still experimental

However, I have been using scriptum in production for several months now. It is not bullet proofed yet but has reached a quite stable state.

## Functional programming course (TOC)

The FP course addresses both purely functional programming idioms and scriptum specific approaches. The latter is only used when specific properties of Javascript like its strict evaluation strategy, mutable data types or missing tail call optimization stops us from pursuing the purely functional approach.

1. [Values, Expressions and Functions](https://github.com/kongware/scriptum/blob/master/ch-1.md)
2. [Managing State](https://github.com/kongware/scriptum/blob/master/ch-2.md)
3. Upcoming: Composition, Currying and Point-free Style <br/>
?. Upcoming: Recursion, Optimizations and Trampolining <br/>
?. Upcoming: Abstract from Recursion <br/>
?. Upcoming: Avoid Nesting through Variadic Interfaces <br/>
?. Upcoming: Local Continuation Passing Style <br/>
?. Upcoming: Lazy Evaluation in a Strict Environment <br/>
?. Upcoming: The Runtime - Edge of the Application <br/>
?. Upcoming: How Haskell Differs <br/>
?. Upcoming: Functional Debugging <br/>
?. Upcoming: Functional Error Handling <br/>
?. Upcoming: Functional Naming Convention <br/>
?. Upcoming: Explicit Ad-hoc Polymorphism <br/>
?. Upcoming: Loop Fusion through Transducers <br/>
?. Upcoming: Almost Pattern Matching <br/>
?. Upcoming: Adapted Hindley-Milner Type Annotations <br/>
?. Upcoming: Tagged Unions of Records <br/>
?. Upcoming: Effects Encoded as Values <br/>
?. Upcoming: Composing Effects <br/>
?. Upcoming: CPS Transformations <br/>
?. Upcoming: Delimited Continuations <br/>
?. Upcoming: Immutabilty through Persistent Data Structures <br/>
?. Upcoming: Data and Event Streams <br/>
?. Upcoming: Functor Typeclass <br/>
?. Upcoming: Applicative Functor Typeclass <br/>
?. Upcoming: Monad Typeclass <br/>
?. Upcoming: Monad Transformers <br/>
?. Upcoming: A Bunch of other Typeclasses <br/>
?. Upcoming: A Bunch of Functional Types <br/>
?. Upcoming: Functional Optics <br/>
?. Upcoming: Recursion Schemes <br/>
?. Upcoming: Free and Freer Monads <br/>
?. Upcoming: When FP does not save us

## Controversial issues

### No static typing

scriptum is based on Javascript, not Typescript. Abandoning a static type system was actually the toughest choice I had to make. Static typing is not a prerequisite yet an important aspect of functional programming. But it is also a source of tremendous complexity because it introduces an additional layer of indirection, scatters type annotations throughout the code and thus impedes learning the underlying functional idioms.

A reasonable compromise that scriptum pursues is to annotate functions with types in comment format. This way the understanding of types and there interaction with the term level can evolve without mingling code and type annotations and without introducing a proper type level.

### No prototype system and method chaining

I want scriptum to be as simple and as general as possible without any distractions. The prototype system and method chaining are both specific to Javascript and not necessary for functional programming. Hence I don’t use them.

By giving up both features we lose the following two abilities:

associate object types with methods
create flat, sequential method chains

Luckily both can be replaced through functional techniques. I will introduce them in subsequent lessons.

### Curried functions only

Curried functions are not a prerequisite for functional programming. However they simplify the function interface by abstracting over arity: Every function unexceptionally expects a single argument.

You could argue that the curry/uncurry combinators trivially transform a curried function into its multi-argument form and vice versa, because they constitute their isomorphism. Having these combinators scattered throughout your code is tedious and distracting though. Let’s adhere to the one argument per function rule to make our lives easer.

### Lazy evaluation on demand

scriptum pursues a strict evaluation strategy as does Javascript. There are two distinct types that enable lazy evaluation through explicit thunks though. I will introduce them in subsequent lessons.

### Immutability as the default

scriptum assumes immutable data. However, Javascript offers a mutable environment meant for imperative algorithms. Hence we relax the just given rule by allowing local mutations inside function bodies.

Beyond that scriptum supplies both various techniques to avoid mutations and a persistent data structure based on hashed array mapped tries. So we have a rich toolset at hand to handle immutability quite well.
