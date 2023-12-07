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

* persistent data structures based on 2-3 trees
* lazy evaluation with implicit/explicit thunks
* principled, purely functional async computation (serial/parallel)
* stack safe recursion (tail recursion, modulo cons, monad recursion)
* product and variant types
* simple pattern matching
* various type class implementations for native `Iterator`
* purely functional data streams as iterator alternative
* reactive programming with event streams and behaviors
* linked lists, non-empty list, difference list
* `DequeMap`, a doubly-ended queue based on a native map
* `MultiMap` to encode 1:m key/value relations
* lots of predefined type class definitions
* lots of predefined polymorphic functions
* extensive monad and monad transformer machinery
* dynamic functorial fusion using yoneda
* static loop fusion using transducers
* flat composition syntax using `infix`
* functional optics
* parser combinators
* functor composition
* let expressions
* delimited continuations
* and much more..

## Status

_unstable_

Obsolete projects:

* [in-depth functional programming course](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/course/ch-001.md)
* [higher-rank/kinded runtime type validator source code](https://github.com/kongware/scriptum/blob/master/src/validator.js)
* [higher-rank/kinded runtime type validator manpage](https://github.com/kongware/scriptum/blob/7172eb77cbd494938eb3ded6ab402ee81bd23555/validator.md)

## Future Studies

- [ ] probabilistic data structures
- [ ] separation of command and query model + event sourcing (CQRS/ES)
- [ ] software transaction memory (STM) 
- [ ] strong eventual consistency (CRDTs)
- [ ] distributed applications
