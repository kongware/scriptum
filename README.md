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

```Javascript
const append = aug(
  "apppend",
  xs => ys => xs.concat(ys)
);

append([1, 2, 3]) ([4, NaN, 5]); // type error
```
### Lambdas

Functions are usually curried, that is declared as sequences of unary anonymous functions. These lambdas are hard to distinguish and thus hard to debug. Guarded functions have always a name. First order function sequences carry the name of its initial function. Higher order function sequences additionally adapt their names to the name of the respective function argument.

```Javascript
const app = aug(
  "app",
  f => x => f(x)
);

const add = aug(
  "add",
  m => n => m + n
);

app(add).name; // app
app(add) (1).name // add
app(add) (1) (2); // 3
```
### Type Logs

scriptum doesn't require explicit type annotations but rather provides a type log for each guarded function. A type log includes the type of each argument passed to the curried function sequence. This way you can verify if an assumed function type matches its real type retrospectively.

If you pass a composite value to a guarded function and the type check yields an invalid type, the type log uses a question mark to indicate this. For instance, if you pass a huge heterogeneous `Array`, the type log will contain an  `[?]` entry. Please understand this as an indication to choose a more appropriate type for the given data.

```Javascript
const app = aug(
  "app",
  f => x => f(x)
);

const add = aug(
  "add",
  m => n => m + n
);

app(add) (1).log; // ["app(λadd)", "app(Number)"]
```
`λ` just indicates that the given argument is a function.

## Typeclasses

Usually the prototype system is used to simulate the typeclass effect in Javascript. scriptum doesn't rely on this for two reasons:

* Native Prototypes

We want to define typeclasses for native types too, however, this would require to modify their prototypes. Modifying native prototypes is considered harmful.

* Subtyping

We want to be able to express typeclass hierarchies without introducing subtype relation. Subtyping is harmful because it entails co-/contra- and invariance and the corresponding effects, which are unintuitive and make it difficult to reason about types.

### Alternative Approach

scriptum uses a global `Map` structure to map types to implementations. Such a typeclass can adopt methods of none, one or several superclasses and hence form a typeclass hierarchy, without establishing any subtype relations.

Here is an example for the `Semigroup` typeclass that has an `append` operator. I use a little wrapper to abstract from the `Semigroup` namespace `Object`:

```Javascript
const append = aug(
  "append",
  x => Semigroup.append(x)
);

append(2) (3); // 5 (monoid under addition assumed)
append("foo") ("bar"); // "foobar"
append([1, 2]) ([3, 4]); // [1, 2, 3, 4]
append(true) (false); flase (monoid under conjunction assumed)
```
For `Number` and `Boolean` exist more than one monoid. You probably need to create a subtype for each monoid, but I haven't made a decision on this yet.

## Linear Data Flow

scriptum introduces a polyvariadic type that allows extensive function composition with a flat syntax:

```Javascript
compN(f1) (f2) (f3) (f4) (f5) (f5).run(x); // creates f1(f2(f3(f4(f5(f6(x))))))
```
Since composition is functorial, this works for all functors and also for applicative and monadic computations.

```Javascript
chainN(f) (m1) (m2) (m3) (m4) (m5).run(x); // creates m1(m2(m3(m4(m5(f) (x) (x)) (x)) (x)) (x)) (x)
```
## Algebraic Data Types

As an language without sum types we need to use an appropriate function encoding to implement them. scriptum uses the less common Scott encoding that relies on explicit recursion and functional pattern matching:

```Javascript
const Type = Tcons => Dcons => {
  const t = new Tcons();
  t.run = cases => Dcons(cases);
  return t;
};

const Option = Type(function Option() {});
const Some = x => Option(o => o.Some(x));
const None = Option(o => o.None);
const runOption = dict => tx => tx.run(dict);

const safeHead = aug(
  "safeHead",
  xs => xs.length === 0
    ? None
    : Some(xs[0])
);

const uc = aug(
  "uc",
  s => s.toUpperCase()
);

const xs = ["foo", "bar", "baz"],
  ys = [];

const x = safeHead(xs), // Some("foo")
  y = safeHead(ys); // None

runOption({Some: uc, None: ""}) (x); // "FOO"
runOption({Some: uc, None: ""}) (y); // ""
```
With Scott encoding we also can express products, sums of products, recursive and even mutual recursive types. If we manipulate them algebraically by obeying mathematical laws, sums of products are also called algebraic data types.

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