```
      ___           ___           ___                       ___           ___           ___           ___     
     /\  \         /\  \         /\  \          ___        /\  \         /\  \         /\__\         /\__\    
    /::\  \       /::\  \       /::\  \        /\  \      /::\  \        \:\  \       /:/  /        /::|  |   
   /:/\ \  \     /:/\:\  \     /:/\:\  \       \:\  \    /:/\:\  \        \:\  \     /:/  /        /:|:|  |   
  _\:\~\ \  \   /:/  \:\  \   /::\~\:\  \      /::\__\  /::\~\:\  \       /::\  \   /:/  /  ___   /:/|:|__|__ 
 /\ \:\ \ \__\ /:/__/ \:\__\ /:/\:\ \:\__\  __/:/\/__/ /:/\:\ \:\__\     /:/\:\__\ /:/__/  /\__\ /:/ |::::\__\
 \:\ \:\ \/__/ \:\  \  \/__/ \/_|::\/:/  / /\/:/  /    \/__\:\/:/  /    /:/  \/__/ \:\  \ /:/  / \/__/~~/:/  /
  \:\ \:\__\    \:\  \          |:|::/  /  \::/__/          \::/  /    /:/  /       \:\  /:/  /        /:/  / 
   \:\/:/  /     \:\  \         |:|\/__/    \:\__\           \/__/     \/__/         \:\/:/  /        /:/  /  
    \::/  /       \:\__\        |:|  |       \/__/                                    \::/  /        /:/  /   
     \/__/         \/__/         \|__|                                                 \/__/         \/__/    
```                                   


# Haskell-style Functional Programming Adapted to Client-/Server-side Javascript

Previous projects:

* [in-depth functional programming course](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/course/ch-001.md)
* [higher-rank/kinded runtime type validator source code](https://github.com/kongware/scriptum/blob/master/src/validator.js)
* [higher-rank/kinded runtime type validator manpage](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/validator.md)

Current Project:

[scriptum](https://github.com/kongware/scriptum/blob/master/scriptum.js) is a functional programming lib featuring

* ad-hoc lazy evaluation with implicit thunks (based on `Proxy` type)
* principled deferred/lazy evaluation (`Defer`/`Lazy`)
* stack-safe tail recursion, tail recursion modulo cons, monad recursion, mutual recursion
* persistent data structures `Iarray`/`Iobject`/`Imap`/`Iset` based on nested object types
* flat composition syntax through infix operators
* simple, function-encoded sum/product types
* principled, pure asynchronous computations in serial/parallel
* functional I/O handling (pure core/impure shell)
* lots of predefined type class definitions
* lots of predefined polymorphic functions
* lots of monad machinery
* lots of lazys iterator combinators
* static loop fusion with transducers
* dynamic functorial fusion using yoneda
* let expressions
* linked lists, non-empty list, difference list, list zipper
* catamorpisms and other recursion schemes for many data types
* data streams, event streams, behaviors
* functional optics
* parser combinators
* functor composition
* delimited continuations
* n-ary tree handling

## Status

_unstable_

While concepts and functional idioms are mature most function implementations are not tested yet and implementation details might be affected by future code revisions.

## Future Studies

- [ ] probabilistic data structures
- [ ] software transaction memory (STM) and distributed applications
- [ ] separation of command and query model + event sourcing (CQRS/ES)
- [ ] strong eventual consistency (CRDTs)
