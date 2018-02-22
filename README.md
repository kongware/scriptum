<img src="./logo.png" width="366" height="114" alt="scriptum"><br><br><br>

# Status

This repo is experimental and still work in progress.

# What

An uncompromisingly functional library with a focus on types, purity, abstraction and debugging capabilities.

# Why

Currently, functional programming in Javascript is a pain.

# Mission

scriptum encourages you to program in a type-directed style and to consider functional programs as mathematical equations that you can manipulate algebraically. This style facilitates equational reasoning and formal proof.

There is no such thing as an untyped program, except an invalid one!

# Features

## Debugging

scriptum offers a function type proxy that transforms normal functions into guarded functions with additional behavior that is useful for debugging.

### Excluded Types

A guarded function must neither receive nor return a value of type `undefined`/`NaN`. It will throw a type error instead. This applies to deeply nested element values of these types as well.

### Lambdas

Functions are usually curried, that is declared as sequences of unary anonymous functions. These lambdas are hard to distinguish and thus hard to debug. Guarded functions have always a name. First order function sequences carry the name of its initial function. Higher order function sequences additionally adapt their names to the name of the respective function argument.

### Type Logs

scriptum doesn't require explicit type annotations but rather provides a type log for each guarged function. A type log includes the type of each argument passed to the curried function sequence. This way you can verify if an assumed function type matches its real type retrospectively.

If you pass a composite value to a guarded function and the type check yields an invalid type, the type log uses a question mark to indicate this. For instance, if you pass a huge heterogeneous `Array`, the type log will contain an  `[?]` entry. Please understand this as an indication to choose a more appropriate type for the given data.

## Typeclasses

* mapping from types to implementations
* avoids prototype system
* can express typeclass hierarchies

## Linear Data Flow

* polyvariadic function sequences
* flat function compostion
* flat applicative and monadic computations

## Algebraic Data Types

* Scott encoded
* sums of products
* single-constructor types
* recursive and mutual recursive types

# Upcoming Features

* Fold with short circuiting
* Monodial transudcer
* Functional optics
* List comprehension
* Stack-safe recursion
* Indexed ranges
* Memoization
* `Eff`/`Aff` effect types (inspired by purescript)
* `Behavior`/`Event` types and corresponding combinators


# Research

* Coyoneda and Free
* F-Algebras and trees
* Purely functional data types
* Persistant data structures

# API

...