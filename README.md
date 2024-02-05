```
      ___           ___           ___                        ___          ___           ___           ___     
     /\  \         /\  \         /\  \          ___         /\  \        /\  \         /\__\         /\__\    
    /::\  \       /::\  \       /::\  \        /\  \       /::\  \       \:\  \       /:/  /        /::|  |   
   /:/\ \  \     /:/\:\  \     /:/\:\  \       \:\  \     /:/\:\  \       \:\  \     /:/  /        /:|:|  |   
  _\:\~\ \  \   /:/  \:\  \   /::\~\:\  \      /::\__\   /::\~\:\  \      /::\  \   /:/  /  ___   /:/|:|__|__ 
 /\ \:\ \ \__\ /:/__/ \:\__\ /:/\:\ \:\__\  __/:/\/__/  /:/\:\ \:\__\    /:/\:\__\ /:/__/  /\__\ /:/ |::::\__\
 \:\ \:\ \/__/ \:\  \  \/__/ \/_|::\/:/  / /\/:/  /    /:/  \:\/:/  /   /:/  \/__/ \:\  \ /:/  / \/__/~~/:/  /
  \:\ \:\__\    \:\  \          |:|::/  /  \::/__/    /:/  / \::/  /   /:/  /       \:\  /:/  /        /:/  / 
   \:\/:/  /     \:\  \         |:|\/__/    \:\__\   /:/  /   \/__/   /:/  /         \:\/:/  /        /:/  /  
    \::/  /       \:\__\        |:|  |       \/__/   \/__/            \/__/           \::/  /        /:/  /   
     \/__/         \/__/         \|__|                                                 \/__/         \/__/    
```                                   


# Functional Programming Unorthodoxly Adjusted to Client-/Server-side Javascript

[scriptum](https://github.com/kongware/scriptum/blob/master/scriptum.js), a functional standard library.

There are three categories of effects:

* mutations
* input/output
* control flow

scriptum handles these three categories using the following concepts:

* tree-based persistent data structures (mutations)
* continuation types optimized for serial/parallel asynchronous processing (I/O)
* continuation type optimized for synchronous processing (control flow)

Since I/O is asynchronous in Javascript/Node.js, the first iteration of the event loop is pure in terms of interacting with the real world. It is thus possible in the context of the event loop to implement the pure core imperative shell design pattern provided the following two requirements are met by asynchronous types:

* they are lazy
* they are stateless

While the native `Promise` type misses both criteria, scriptum's `Serial` and `Parallel` type are compliant.

Control flow comprises the following instances:

* short circuiting
* indeterminism (0..n iterations of evaluation)

Features:

* persistent data structures based on 2-3 trees
* lazy evaluation with implicit/explicit thunks
* principled, purely functional async computation (serial/parallel)
* stack safe recursion (tail recursion, modulo cons, monad recursion)
* reification control flow using CPS and the `Cont` type
* product and variant types
* simple pattern matching
* functional `Iterator` machinery
* functional iterator type idempotent in its `next` method
* reactive programming with event streams and behaviors
* `DequeMap`, a doubly-ended queue based on a native map
* `MultiMap` to encode 1:m key/value relations
* lots of predefined type class definitions
* lots of predefined polymorphic functions
* lots of functor, applicative and monad definitions
* dynamic functorial fusion using yoneda
* static loop fusion using transducers
* flat composition syntax using `infix`
* memoization of recursive functions
* functional optics
* parser combinators
* functor composition
* let expressions
* delimited continuations
* coroutines
* tracked functions
* and much more..

## Status

_unstable_

Obsolete projects:

* [in-depth functional programming course](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/course/ch-001.md)
* [higher-rank/kinded runtime type validator source code](https://github.com/kongware/scriptum/blob/master/src/validator.js)
* [higher-rank/kinded runtime type validator manpage](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/validator.md)

## Future Studies

- [ ] probabilistic data structures
- [ ] fuzzy logic and encoding uncertainty
- [ ] separation of command and query model + event sourcing (CQRS/ES)
- [ ] software transaction memory (STM) 
- [ ] strong eventual consistency (CRDTs)
- [ ] distributed applications
