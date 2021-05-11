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
                                   
**[Status: work in progress]**

# Gradual Typed Functional Programming with Javascript

scriptum consists of two parts:

* a runtime type validator
* a typed standard library

Just like Typescript scriptum enables gradual typing in Javascript but with a radically different approach. While Typescript targets the object oriented aspects of Javascript, scriptum embraces its functional capabilities.

## Runtime Type Validator

Usually the type system is designed first and the rest of the language around it. However, with Javascript we are stuck with an untyped language. Adding a type system with hindsight is a Sisyphean task as you can observe with Typescript.

scriptum partially bypasses this problem by implementing only a part of a traditional type checker: It checks applications but no definitions, i.e. there is no automatic inference from terms to types but terms have to be annotated explicitly.

Explicit annotations sounds laborious. How can we reduce them? If we validate types at runtime we can resort to Javascript's introspection means. This at least frees us from explicitly typing non-functional terms. Furthermore, if we have access to an extensive typed functional library, we only have to annotate our own combinators. This is what scriptum offers.

The type validator is based on the Hindley-Milner type system extended by higher-kinded/rank types and row polymorphism. Do not be scared by the type theory lingo. This introduction explains these concepts in Layman's terms together with practical examples.

## Standard Functional Library

The standard library ships with a great variety of typed functional combinators most functional programmers are accustomed to. Additionally it supplies basic tools that enable programmers to address problems in a purely functional manner, like...

* stack-safe sync/async recursion
* persistent data structures
* local mutation without sharing
* effect handling and composition
* expressions in weak head normal form

We will deepen these concepts in the course of this introduction.

## Type Representation

The type validator operates at runtime and thus can represent types as first class `String`s. Here is our first simple type:

```javascript
"String => Number"
```

This is just a string, i.e. we can assign it to a variable, pass it around or manipulate it with Javascript's string operations.

If you have a more complex type you can add newlines and indentations to render it more readable:

```javascript
`{
   foo: String => Number,·
   bar: Map<String, Number>,·
   baz: [String, Number]
 }`
```

Please note that all spaces/tabs and newlines are erased automatically. Use the `·` symbol to denote a protected space.

## Associate Types with Functions

We need the `fun` operator to associate a type with a function:

```javascript
const length = fun(s => s.length, "String => Number");

length("Dijkstra"); // 8
length([1, 2, 3]); // type error
```

`fun` takes the function and a type and returns a typed version of the supplied function.

There are no corresponding operators for native data types like `Array` or `Object`. You can create data or request it from an external source as usual, but you might have to prepare it before it passes the type validator (see line `B`):

```javascript
const append = fun(xs => ys => xs.concat(ys), "[Number] => [Number] => [Number]");

const xs = [1, 2],
  ys = ["1", 2],
  zs = [3, 4];

append(xs) (zs); // [1, 2, 3, 4]
append(ys); // type error (A)
append(ys.map(Number)) (zs); // [1, 2, 3, 4] (B)
```
As opposed to static type checking type errors are usually only thrown after a function is applied. However, frequently partial application is sufficient to trigger an error (see line `A`).

## Downside of the approach

The attentive reader has probably already anticipated the decisive downside of the validator approach: There is no type inference and thus no guarantee that an associated type matches its term:

```javascript
const length = fun(s => s.length, "Number => String"); // accepted
length("Dijkstra"); // type error
```

This is a severe downside and I do not even try to sugarcoat it. Please keep in mind that scriptum only promises _gradual_ typing. Other approaches entail different tradeoffs. I am still convinced that gradual typing is the most natural approach to type Javascript and that the advantages outweigh the disadvantages.

By the way, in most cases you can tell from the type error message if there is a mismatch between type annotation and function term. We will cover some cases in this introducation to gain a better intuition for this issue.

## Performance Impact and Memory Footprint

The type validator proceeds in an on-demand mode. All you need to do is to switch the `CHECK` flag:

```javascript
const CHECK = true;
```

In a common setting it is active during development stage and deactivated as soon as the code is operational. Performance penalty and memory footprint of the deactivated validator are negligible.

## Function Type

### Curried Functions

Curried functions are the first choice of the functional programmer, because they greatly simplify the function interface. Typing them with scriptum is easy:

```javascript
const add = fun(m => n => m + n, "Number => Number => Number");

add(2) (3); // 5
add("2"); // type error
```

### Imperative Functions

Javascript supports multi-argument and variadic functions as well as thunks and so does scriptum.

#### Multi-argument

While the type validator allows multi-argument functions, it is strict in the number supplied arguments:

```javascript
const add = fun((m, n) => m + n, "Number, Number => Number");

add(2, 3); // 5
add(2, "3"); // type error
add(2, 3, 4); // type error
```

#### Variadic

Variadic functions can be defined in two forms, either with a single variadic parameter or with several parameters with a closing variadic one:

```javascript
const sum = fun((...ns) => ns.reduce(n + acc, 0), "..[Number] => Number");

const showSum = fun(
  caption, (...ns) => `${caption}: ${ns.reduce(n + acc, 0)}`,
  "String, ..[Number] => String");

sum(1, 2, 3); // 6
sum(); // 0
sum(1, "2", 3); // type error
showSum("total", 1, 2, 3); // "total: 6"
```

Unlike in Javascript variadic arguments must be homogeneous in their type, because they yield an typed array.

#### Thunks

Thunks, or nullary functions are important in an eagerly evaluated language like Javascript, because it provides a means to prevent evaluation until needed:

```javascript
const lazyAdd = fun(x => y => () => x + y, "Number => Number => _ => Number");

const thunk = lazyAdd(2) (3);
thunk(); // 5
thunk(4); // type error
```

Please note that it is not permitted to pass a redundant argument to a thunk.

## Generics

scriptum excels in handling generics also known as polymorphic types:

```javascript
const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");

const length = fun(s => s.length, "String => Number");
const sqr = fun(n => n * n, "Number => Number");

comp(sqr) (length) ("Curie"); // 25
comp(length) (sqr); // type error
```

Let us have a closer look at what is happening here. During the application of the first function argument the type variables `b` and `c` are instantiated with and substituted by the types of the supplied function, namely `Number`. The same happens when the second argument is passed:

```javascript
comp(sqr) (length) ("Curie");

(b => c) => (a => b) => a => c // apply "Number => Number"
b ~ Number
c ~ Number

(a => Number) => a => Number // apply "String => Number"
a ~ String

String => Number // apply a String

Number
```

`comp` is a parametric polymorphic type, that is it treats every value uniformly regardless of its type. Unknown types are represented by type variables and are resolved during unification.

Unification is a powerful concept that also covers cases where the provided function argument is itself polymorphic. Here is a contrived example merely for deomnstration purposes:

```javascript
const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");

const id = fun(x => x, "d => d");

comp(id);

(b => c) => (a => b) => a => c // apply "d => d"
d ~ b
d ~ c
b ~ c // transitive property

(a => b) => a => b
```

scriptum goes beyond normal genrics by supporting higher-kinded and higher-rank generics. You will learn about these techniques in subsequent sections of this introduction.

## Tracking Types

Beside checking whether types and terms match a decisive task of the type validator is to assist programmers in tracking types:

```javascript
const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");

comp(comp) (comp), // A
comp(comp(comp)) (comp); // A
```

Without manually unifiying the types it is impossible to infer them in lines `A`. Fortunately the type validator has already done the heavy lifting. You can retrieve the current type using the `ANNO` property:

```javascript
comp(comp) (comp) [ANNO] // (b => c) => (d => a => b) => d => a => c
comp(comp(comp)) (comp) [ANNO] // (b => c) => (a => b) => (e => a) => e => c
```

From here on applying the function is easy. Let us pick the first one and see its type in motion:

```javascript
const repeat = fun(s => n => s.repeat(n), "String => Number => String");

const foldl = fun(
  f => acc => xs => xs.reduce((acc, x) => f(acc, x), acc),
  "(b, a => b) => b => [a] => b");

const add = fun((m, n) => m + n, "Number, Number => Number");

comp(comp) (comp) (repeat) [ANNO] // (d => a => Number) => d => a => String
comp(comp) (comp) (repeat) (foldl(add)) [ANNO] // Number => [Number] => String
comp(comp) (comp) (repeat) (foldl(add)) (0) [ANNO] // [Number] => String
comp(comp) (comp) (repeat) (foldl(add)) (0) ([1, 2, 3]) // "******"
```

The type validator has guided us through the application of a complex combinator. This kind of assistance is also incredible helpful when you are in the middle of a transformation of a complex composite data structure.

## Gradual Typing

We already learned that variadic arguments yield a homogeneous array. So how can the following function be typed:

```javascript
const _let = (f, ...args) => f(...args);

const collectConsonants = s => s.match(/[^aeiou]/g),
  collectVowels = s => s.match(/[aeiou]/g);
  
_let((name, consonants, vowels) =>
  `${name} includes ${consonants.length} consonants and ${vowels.length} vowels,`
    + ` namely ${consonants.join(", ")} and ${vowels.join(", ")}`,
  name = "Papastathopoulos",
  collectConsonants(name),
  collectVowels(name));
  
  // "Papastathopoulos includes 9 consonants and 7 vowels, namely P, p, s, t, t, h, p, l, s and a, a, a, o, o, u, o"
```

`_let` facilitates local bindings in Javascript. Unlike the native `let` declarartion it is a first class expression and unlike an IIFE it renders the function invocation explicit. `_let` is useful whenever the result of an evaluation is needed multiple times. Unfortunately, we cannot type it with the means of the type validator.

At this point gradual typing comes into play. We do not actually need to type the function itself, but only the function argument it receives:

```javascript
_let(fun((name, consonants, vowels) =>
  `${name} includes ${consonants.length} consonants and ${vowels.length} vowels,`
    + ` namely ${consonants.join(", ")} and ${vowels.join(", ")}`,
  "String, [String], [String] => String"),
  name = "Papastathopoulos",
  collectConsonants(name),
  collectVowels(name));
  
  // "Papastathopoulos includes 9 consonants and 7 vowels, namely P, p, s, t, t, h, p, l, s and a, a, a, o, o, u, o"
```

Usually we would type `collectConsonants` and `collectVowels` as well, but I leave that out for the sake of simplicity. This is almost the implementation in the standard library, only with the minor difference that the latter enforces the function argument `f` to be typed.

## Structural Typing

scriptum's type validator supports structural typing along with the native `Object` type. Javascript objects are treated as an unordered map of key/value pairs. Here is a rather limited property accessor:

```javascript
const prop = fun(k => o => o[k], "{name: String, age: Number} => a");

const o1 = {name: "Fassbender", age: 43},
  o2 = {age: 43, name: "Fassbender"},
  o3 = {name: "Mulligan", age: 35, profession: "actress"};
  o4 = {name: "Tawny Port", age: 20};

prop("name") (o1); // "Fassbender"
prop("age") (o2); // 43
prop("gender") (o1); // type error
prop("name") (o3); // type error
prop("name") (o4); // "Tawny Port"
```
`prop` is not that useful for two reasons:

* it only works with a specific object type
* it still does not prevent you from invoking it with a semantically different object

The type validator is accompanied by two extensions to address both these shortcomings.

### Combined structural/nominal typing

If we combine both structural and nominal typing, more rigid strucural types can be obtained that rule out the semantics issue:

```javascript
const Actor = fun(
  function Actor(name, age) {
    this.name = name;
    this.age = age;
  },
  "String, Number => Foo {name: String, age: Number}");

const props = fun(k => o => o[k], "Actor {name: String, age: Number} => a");

const o1 = new Actor("Fassbender", 43),
  o2 = {name: "Tawny Port", age: 20};

prop("name") (o1); // Fassbender
prop("name") (o2); // type error
```

### Row Types

If we introduce a row variable that gets substituted with the non-matching properties, a more flexible structural type can be obtained that allows the processing of object intersetions:

```javascript
const props = fun(k => o => o[k], "String => {name: String | r} => a");

const compareName = fun(
  o => p => o.name === p.name,
  "{name: String} => {name: String} => Boolean");

const o1 = {name: "Fassbender", age: 43},
  o2 = {name: "Mulligan", age: 35, profession: "actress"},
  o3 = {name: "Ernie", age: 52, pronouns: "they/them"};

prop("name") (o1); // Fassbender
prop("name") (o2); // Mulligan
compareName(o2) (o3); // type error
```

In order to understand why the third invocation is rejected by the validator, we must realize which row type `r` is instantiated with. The first argument `o1` demands `r` to be `age: Number, profession: String`. `o2`, however, expects `r` to be `age: Number, pronouns: String`, which evidently does not match. Row types simulate subtyping of structura types without information loss.

Please note that `r` and `a` from the above example might resemble each other but are nothing alike. The former is a row variable whereas the latter is a universally quantified type variable.

### Object type concatenation

Types are encoded as first class `String`s in scriptum, i.e. you can just concatenate them with Javascript's `String` and `Array` methods. This is helpful to keep your type definitions DRY.

### Subtyping

scriptum avoids subtype polymorphism, because I do not want to mix the functional paradigm with the idea of class hierarchies. If you feel the need to rely on classes, Typescript is probably a more suitable alternative.

## Built-in Primitives

scriptum does support the following primitives, which are all created by type constants (nullary constructors):

* `BigInt`
* `Boolean`
* `Number`
* `null`
* `String`
* `Symbol`

We have already used them in examples throughout this introduciton, hence I spare another one.

### `undefined`/`NaN`/`Infinity`

Although `undefined` clearly indicates a type error, Javascript silently accepts such values. scriptum addresses this questionable design decision by throwing an error when a function returns a an undefined value. `undefined` arguments are legitimate though, because they allow the necessary flexibility:

```javascript
const prop = fun(o => k => o[k], "{name: String, age: Number} => String => a"),
  o = {name: "Binoche", age: 57};

const lazyExp = fun(() => 2 * 3, "_ => Number");

prop(o) ("name"); // "Binoche"
prop(o) ("foo"); // type error

lazyExp(); // 6 (A)
```

Please note that `lazyExp()` implicitly passes `undefined` (see line `A`).

For the time being `NaN` and `Infinity` are treated as type errors just like `undefined`. This is most likely to change.

## Built-in Exotic Object Types

### `Array`

Arrays must be homogeneous in their element type, as soon as they are passed to a function:

```javascript
const arrAppend = fun(
  xs => ys => xs.concat(ys),
  "[a] => [a] => [a]");
  
const xs = [1, 2],
  ys = [3, 4],
  zs = [5, "6"];

arrAppend(xs) (ys) [ANNO]; // [Number]
arrAppend(xs) (zs); // type error
```

Please note that `[a]` denotes Javasript's imperative `Array` type, not a single linked list most functional programmers are familiar with. scriptum also includes a traditional `List` type, which is encoded as an algebraic data type.

#### `NEArray`

The non-empty array is a subclass of `Array` and has the same traits, except for the non-empty constraint and a slightly different notation:

```javascript
const neaAppend = fun(
  xs => ys => xs.concat(ys),
  "[1a] => [1a] => [1a]");
  
const xs = new NEArray.fromArr([1, 2]),
  ys = NEArray.fromArr([3, 4]),
  zs = NEArray.fromArr([]);

neaAppend(xs) (ys) [ANNO]; // [1Number]
neaAppend(xs) (zs); // type error
```

The digit `1` indicates that `NEArray`s must at least include one value. Please note that it is possible to create empty `NEArray`s, because otherwise we could not apply the native Array methods. As soon as you apply such an illtyped value to a function an error is raised. It is a necessary tradeoff.

### `Date`

### `Error`

### `Generator`/`Iterator`

### `Map`

### `Promise`

### `RegExp`

### `Set`

### `Tuple` Type

Tuples are a subclass of `Array` and are not extensible:

```javascript
const tupMap = fun(
  f => ([x, y, z]) => new Tuple(x, y, f(z)),
  "(c => d) => [a, b, c] => [a, b, d]");

const toUC = fun(s => s.toUpperCase(), "String => String"),
  r = tupMap(toUC) (new Tuple(123, true, "abc")); // [123, true, "ABC"]
  
r[ANNO]; // [Number, Boolean, String]
```

Tuples must at least comprise 2 fields, because `[a]` denotes an `Array`. There might be a switch to Javascript's new native tuple type, provided it offers the required flexibility.

### Typed arrays

### `WeakMap`

### `WeakRef`

### `WeakSet`

## Higher-order Generics

Higher-order generics better known as higher-kinded types allow the type constructor itself to be polymorphic. It gives you finer-grained control over the arity of type constructors. This is useful to define more general types like monoids, functors et al. Unfortunately we have yet to discuss higher-kinded types and type classes before we can encode them, hence we stick with a more simple example for now:

```javascript
const mapAnno = "(a => b) => f<a> => f<b>";

const arrMap = fun(f => xs => xs.map(x => f(x)), mapAnno);
const funMap = fun(f => g => x => f(g(x)), mapAnno);
const tupMap = fun(f => ([x, y, z]) => new Tuple(x, y, f(z)), mapAnno);
const numMap = fun(f => n => f(n), mapAnno);

const inc = fun(x => x + 1, "Number => Number");
const toUC = fun(s => s.toUpperCase(), "String => String");

arrMap(inc) ([1, 2, 3]); // [2, 3, 4]
funMap(inc) (inc) (1); // 3
tupMap(toUC) (new Tuple(1, true, "foo")); // [1, true, "FOO"]
numMap(inc) (1); // type error
```

`mapAnno` expects a function `a => b` and an unary type constructor `f<a>` to produce an `f<b>`. The array type constructor satisfies the latter, because it requires a single type parameter to construct `[a]` values. Functions and 3-tuples on the other hand expect more than one type parameter to construct values of type `a => b` and `[a, b, c]` respectively. This still works, because functions are only mappable in their result type `b` and 3-tuples only in their last field `c`.

Numbers, however, are not mappable, because their type constructor takes no arguments at all. It is a nullary constructor or type constant. Hence the type error.

## Higher-rank Generics

Higher-rank generics better known as higher-rank types encode the idea of first class polymorphic functions. Usually, when a polymorphic function `foo` is applied to a polymorphic function argument `f`, the caller of `foo` decides upfront what specific type `f` is instantiated with. This mechanism limits the types we can express:

```javascript
const foo = fun(
  f => x => y => new Tuple(f(x), f(y)),
  "(a => b) => c => d => [c, d]");
  
const id = fun(x => x, "a => a");

foo(id) (123) ("abc"); // type error
```

The type error is caused by the unification process. The type variable `a` in the function parameter `(a => a)` is instantiated with the type of `foo`'s second argument, namely `Number`. The last argument is of type `String` though and the validator's attempt to instantiate `a` accordingly fails, because a type variable cannot be instantiated with two different types at the same time.

The only way to get this to work is to defer the instantiation of `a` by letting `foo` decide for each invocation which specific type `(a => a)` has. If the function argument is still polymorphic when it is passed to `foo`, then it needs to be first class and that is exactly what higher-rank types enable:

```javascript
const foo = fun(
  f => x => y => new Tuple(f(x), f(y)),
  "(^a. a => a) => a => b => [a, b]");
  
const id = fun(x => x, "a => a");

foo(id) (123) ("abc"); // [123, "abc"]
```

The caret symbol at the beginning of the annotation denotes the higher-rank part of the type. I intentionally obfuscated the annotation to draw the attention to the type variable names. Even though `a` in the first and the second parameter seem to be the same, both are distinct type variables. The instantiation of the first variable with a specific type does not affect the second one and vice versa.

Higher-rank types are astonishingly limiting, because they impose on the caller to supply a fully polymorphic function, which behaves uniformly for every type instance:

```javascript
const length = fun(o => o.length, "{length: Number | r} => Number");
foo(length); // type error
```

`length` breaches this contract, becuse it does not behave uniformly for every type instance. As a matter of fact it only behaves as intended for values of type `{length: Number | r}`. If we can only pass fully polymorphic functions to a higher-rank type than these functions are quite limited in what they are able to do, because they know absolutely nothing about their arguments and what values they possibly might contain.

Surprisingly this very limitation turns out to be very helpful to express a couple of fundamental functional idioms as you will see in the following setions.

### Algebraic Data types

Algebraic data types are a means to construct complex, composite data types that go beyond hierarchic product types. Since ADTs are covered in their own major section here is only a brief preview to demonstrate the expressivness of higher-rank types. The following ADT encodes a type that acts similar to `null` in imperative languages, only more reliable:

```javascript
const Option = type("(^r. r => (a => r) => r) => Option<a>");

const Some = fun(x => Option(none => some => some(x)), "a => Option<a>");
const None = Option(none => some => none);

const repeat = fun(s => n => s.repeat(n), "String => Number => String")

const x = Some(3),
  y = None;

x.run("?") (repeat("*")); // "***"
y.run("?") (repeat("*")); // "?"
```

When `Some` creates a value of type `Option<a>`, the specific type of `a` is already determined, but the resolution of the type `r` of the result value is is deferred until the ADT is actually consumed.

### Value-level type classes

Type classes are a type system feature that became popular by Haskell. scriptum defines them entirely on the value level, i.e. solely with functions and values using higher-rank types. Here is the monad type class together with its `Option` instance:

```javascript
const Monad = type(`
  (^a, b. {
    of: (a => m<a>),·
    chain: (m<a> => (a => m<a>) => m<b>)
  }) => Monad<m>`);

// option instance

const optChain = fun(
  mx => fm => mx.run(mx) (fm),
  "Option<a> => (a => Option<a>) => Option<b>");

const MonadOpt = Monad({of: Some, chain: optChain}); // Monad<Option>

const safeInc = fun(x => Some(x + 1), "Number => Number),
  id = fun(x => x, "a => a");

const x = MonadOpt.chain(Some(3)) (safeInc),
  y = MonadOpt.chain(None) (safeInc);

x.run(0) (id); // 4
y.run(0) (id); // 0
```

A type class knows upfront which type constructor it is instantiated from, but it does only know a single thing about the involved type parameters, namely how many there at least are. This is possible, because the type parameters are denoted as higher-rank.

#### Mix and match type class operations

#### Type class hierarchies

### Explicit type equalaty hints

Let us revisit the initial example of the higher-rank types section. There is an issue I have kept secret so far:

```javascript
const foo = fun(
  f => x => y => new Tuple(f(x), f(y)),
  "(^a. a => a) => b => c => [b, c]");
  
const id = fun(x => x, "a => a");

foo(id) (123) ("abc"); // [123, "abc"]
```

As I have already mentioned the type validator only checks applications, not definition. Consequently, it cannot infer which type variable of the function argument `(a => a)` needs to be unified with. Is it `a ~ b` or `a ~ c` or both? From the term it is obvious that both unifications are necessary and that is what we have to tell the validator through explicit type equality hints:

```javascript
const foo = fun(
  f => x => y => new Tuple(f(x), f(y)),
  "(^a. a => a) => b => c => [b, c]",
  "a ~ b, a ~ c");
```

Please note that the tilde symbol denotes type equaltiy and that the LHS always has to be a higher-rank type.

I do not have enough experience yet to assess the implications of this shortcoming. Both algebraic data types and type classes seem not to be affected in principle. Nevertheless, it should be possible to automatically predict some of these cases, if a type variable is completely disconnected from the rest of the annotation and issue a warning.

## Algebraic Data Types

### Product types

### Sum types

### Nullary constructors

## Recursive Types

### Mutual recursice types

## Phantom Types

## Polymorphic Recursion
