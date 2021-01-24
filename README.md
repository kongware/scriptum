```
                                88                                                    
                                ""              ,d                                    
                                                88                                    
,adPPYba,  ,adPPYba, 8b,dPPYba, 88 8b,dPPYba, MM88MMM 88       88 88,dPYba,,adPYba,   
I8[    "" a8"     "" 88P'   "Y8 88 88P'    "8a  88    88       88 88P'   "88"    "8a  
 `"Y8ba,  8b         88         88 88       d8  88    88       88 88      88      88  
aa    ]8I "8a,   ,aa 88         88 88b,   ,a8"  88,   "8a,   ,a88 88      88      88  
`"YbbdP"'  `"Ybbd8"' 88         88 88`YbbdP"'   "Y888  `"YbbdP'Y8 88      88      88  
                                   88                                                 
                                   88                                                 
```

# Status: Working on a Hindley-Milner Type Validtor

...to close the gap between dynamically and statically typed languages. This will take a couple of days so please bear with me.

## What

Yet another functional programming lib for Node.js and the browser.

## scriptum Library

scriptum mainly pursues three goals:

* be language agnostic as far as possible
* reduce the potential for bugs
* render code more predictable

First of all, scriptum is the attempt to get as close as possible to the purely functional paradigm using a multi-paradigm language lots of developers are familiar with. By keeping the lib essentially language agnostic you can more easily transfer the acquired knowledge to your preferred language.

Secondly, scriptum ships with a zero-cost extended runtime type checker that reduces the potential of bugs significantly. It is zero-cost, because you can switch it on and off on demand. Moreover, scriptum heavily relies on mutable data structures that provide a safe in-place update interface. This prevents bugs caused by side effects and reduces the potential for race conditions and dead locks when using the event loop in asynchronous computations.

Thirdly, scriptum uses a monad based effect system in order to make effects explicit and thus enable more predictable code. Effects can be composed using monad transformers and there is a variety of predefined transformers available.

Please note that scriptum does not include persistent data strucutres beased on finger trees or hashed array mapped tries for the time being, because it relies upon safe in-place updates instead.

Feature selection:

* less silent errors through more rigorous dynamic type checking (on demand)
  * throws immediately on `undefined`, `NaN` and `invalid Date`
  * throws immediately on implicit type coercions
  * throws immediately on implicit duck typing
  * allows custom type checks
* improved debugging experience along with curried functions
* safe in-place updates (mutations) with the `Mutable` type (affine-like)
* fully-fledged lazy evaluation with the `Thunk` type (allows expressions in WHNF)
* stack-safe recursion through a family of trampolines
  * tail recursion
  * tail recursion modulo cons
  * mutual recursion
  * monadic recursion
* custom record and tagged union types along with a pattern-matching-like experience
* instances of common type classes for various types
  * Functor/Applicative/Monad
  * Monoid
  * Foldable
  * Traversable
  * Comonad
  * Profunctor
  * etc.
* effect composition with `Comp` and common Monad Transformers
* lawful, stack-safe and pure asynchronous computations
  * in sequence with `Task`
  * in parallel with`Parallel`
* lawful and pure synchronous effect computation
  * without sharing of results using `Defer`
  * with sharing of results using `Lazy`
* generalized multi-way (aka rose) trees with a bunch of helpful combinators
* van Laarhoven functional optics
  * `Getter`/`Setter`
  * `Lens`/`LensAt`/`LensOpt`
  * Foldable `Getter`s
  * Traversable `Setter`s
* linear functional data structures
  * Random Access List
  * Difference List
  * Skip List
* non-linear functional data structures
  * Red/Black Tree
  * AVL Tree
  * Finger Tree
  * Trie
  * Rope
* variations of linked lists with tons of helpful combinators
  * Linked List
  * Difference List
  * List Zipper
  * Random Access List
* monadic `Stream` type for uni-/multicast push-based streams
* `Parser` combinators consuming `String` or `Stream`
* functional reactive combinators based on event delegation
  * `Behavior` type
  * `Observer` type
* dynamic code optimization
  * `Yoneda`/`Coyoneda` types
  * `Codensity` monad
* a bunch of common functional types
  * `Reader`
  * `Writer`
  * `State`
  * `ZipList`
  * `Pred`
  * `First`/`Last`
* recursion schemes
  * catamorphism
  * paramorphism
  * anamorphism
  * apomorphism
  * etc.
* purely functional memoization
* navigating through trees with Zippers

## Functional Programming Course - Table of Contents

### Part I (untyped)

01. [Functional Jargon and Programming Experience](https://github.com/kongware/scriptum/blob/master/course/ch-001.md)
02. [Handling State in Functional Programming](https://github.com/kongware/scriptum/blob/master/course/ch-002.md)
03. [Currying, Composition and Point-free Style](https://github.com/kongware/scriptum/blob/master/course/ch-003.md)
04. [Algebraic Structures, Properties and Lambda Abstractions](https://github.com/kongware/scriptum/blob/master/course/ch-004.md)
05. [Data Modeling with Algebraic Data Types (ADTs)](https://github.com/kongware/scriptum/blob/master/course/ch-005.md)
06. [Lazy Evaluation on Demand](https://github.com/kongware/scriptum/blob/master/course/ch-006.md)
07. [Linear Data Flow and Flat Composition Syntax](https://github.com/kongware/scriptum/blob/master/course/ch-007.md)
08. [From Recursion to Corecursion](https://github.com/kongware/scriptum/blob/master/course/ch-008.md)
09. [Trading Stack for Heap with Trampolines](https://github.com/kongware/scriptum/blob/master/course/ch-009.md)
10. [Loop Fusion and Data Source Abstraction with Transducers](https://github.com/kongware/scriptum/blob/master/course/ch-010.md)
11. [Immutability in Languages w/o Purely Functional Data Types](https://github.com/kongware/scriptum/blob/master/course/ch-011.md)
12. [Basics on Type/Kind Systems and Polymorphism](https://github.com/kongware/scriptum/blob/master/course/ch-012.md)
13. [Type class polymorphism through dictionary passing style](https://github.com/kongware/scriptum/blob/master/course/ch-013.md)
14. [Lifting Pure Functions using Functor](https://github.com/kongware/scriptum/blob/master/course/ch-014.md)
15. [Accumulating, Aggregating and Picking with Monoid](https://github.com/kongware/scriptum/blob/master/course/ch-015.md)
16. [Combining Effects with Pure Functions using Applicative](https://github.com/kongware/scriptum/blob/master/course/ch-016.md)
17. [Combining Effects with Actions using Monad](https://github.com/kongware/scriptum/blob/master/course/ch-017.md)
18. Pending: Composing Monadic Effects with Transformers (▓▓▓▓▓▓▓░░░ 70% done)
19. Planned: Descriptions of Computations and the Impure Edge of Your Application (░░░░░░░░░░ 0% done)
19. [Respecting the Structure with Natural Transformations](https://github.com/kongware/scriptum/blob/master/course/ch-019.md) [needs editing]

to be continued...

### Part II (typed)

to be continued...

## Contribution

Please report an issue if you run across a mistake, ambiguous wording or inconsistent statement in the course. Please let me also know if there is an important subject missing in the chapter pipeline. Your help is much appreciated!

## Chapter Pipeline

* Planned: Managing Time-Varying Values in a Functional Fashion
* Planned: All About Continuations (Transformation, Delimited, etc.)
* Planned: Generalizing Folds and Unfolds with Recursion Schemes
* Planned: Functorial Loop Fusion with Co-/Yoneda
* Planned: Extracing values with Comonad
* Planned: Mastering Tree Data Structures
* Planned: Streams: Push/Pull, In-/Finite, Uni-/Multicast, Sync/Async
* Planned: Multi-Parameter Type Classes and Functional Dependencies
* Planned: List-Comprehension and its extension for other data types
* Planned: Defunctionalization Transformation?
* Planned: From Sharing to Memoization
* Planned: Functional Encoded State Machines
* Planned: Functional Error Handling and Debugging
* Planned: From Unit to Property-based Testing
* Planned: Random Access, Single Linked and Difference Lists
* Planned: Functional Iso (Optics)
* Planned: Functional Lenses (Optics)
* Planned: Functional Prism (Optics)
* Planned: Functional Optional (Optics)
* Planned: Functional Traversals (Optics)
* Planned: Functional Getters (Optics)
* Planned: Functional Setters (Optics)
* Planned: Functional Folds (Optics)
* Planned: Extensible Effects with Free Monads (Classic, Codensity, CPS, Reflection)
* Planned: Extensible Effects with Freer Monads
* Planned: Algebraic Effects and Handlers (CPS, Exception/State)
* Planned: Tagless Final Encoding
* Planned: Effect Handling/Composition with the Continuation Monad
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
