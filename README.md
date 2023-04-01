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

[scriptum](https://github.com/kongware/scriptum/blob/master/scriptum.js), a functional standard library featuring

* stack-safe tail recursion, tail recursion modulo cons, monad recursion, mutual recursion
* persistent data structures `Iarray`/`Iobject`/`Imap`/`Iset` based on nested object types
* ad-hoc lazy evaluation with implicit thunks (`() => expr` that behave like `expr`)
* purely functional asynchronous computations in serial/parallel
* extensive monad and monad transformer machinery
* native `Iterator` as Functor/Applicative/Monad
* purely functional data streams as iterator alternative
* reactive programming with event streams and behaviors
* linked lists, non-empty list, difference list
* function-encoded sum and product types
* lots of predefined type class definitions
* lots of predefined polymorphic functions
* dynamic functorial fusion using yoneda
* static loop fusion using transducers
* flat composition syntax using `infix`
* simple pattern matching
* functional optics
* parser combinators
* functor composition
* let expressions
* delimited continuations
* r/b-tree implementation
* n-ary tree handling

## Status

_unstable_

While concepts and functional idioms are mature most function implementations are not tested yet and implementation details might be affected by future code revisions.

Previous projects:

* [in-depth functional programming course](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/course/ch-001.md)
* [higher-rank/kinded runtime type validator source code](https://github.com/kongware/scriptum/blob/master/src/validator.js)
* [higher-rank/kinded runtime type validator manpage](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/validator.md)

## Future Studies

- [ ] probabilistic data structures
- [ ] separation of command and query model + event sourcing (CQRS/ES)
- [ ] software transaction memory (STM) 
- [ ] strong eventual consistency (CRDTs)
- [ ] distributed applications
