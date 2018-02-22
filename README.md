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

* provides type logs for partially applied functions
* excludes undefined/NaN
* facilitates lambda debugging
* warns of ill-typed data structures

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