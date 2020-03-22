## Functional Data Modelling with Algebraic Data Types

The way data is modeled in functional programming is a source of confusion for many object oriented programmer, because familiar concepts like inheritance or dependency injection are (mostly) orthogonal to the functional paradigm. This chapter illustrates the functional approach.

### Data and functional dependencies

While data and behavior is strictly decoupled in functional programming, we still have to deal with data and functional dependencies:

```javascript
const sqr = x => x * x;
const len = xs => xs.length;

const main = s => sqr(len(s));

main("hallo"); // 25
```
`main` is functional dependent from `len` and `sqr`. Whithin `main` a data dependency between `len` and `sqr` is established, in which the former depends on the resulting data of the latter. Usually we encode functional dependency dynamically through higher order functions:

```javascript
const comp = f => g => x => f(g(x));
const sqr = x => x * x;
const len = xs => xs.length;

const main = comp(sqr) (len);

main("hallo"); // 25
```
Now `comp` dynamically establishes a data dependency between both passed function arguments. To be precise it froms a read-after-write data dependency. Since reassignments and mutations are banned in functional programming there are actually no other data dependency forms.

If functional dependent functions like `main` from the first or `comp` from the second example only depend on pure functions they are also pure provided they do not themselves perform visible side effects. The order of evaluation of such code can be altered, parallelized for instance, as long as this optimization does not interfere with the given data dependencies.

Please note that the Javascript interpreter pursues a rather fixed, sequential evaluation order, which is consistent with the lexical occurrence of expressions and statements, because each these code entities may include side effects.

#### Dependency injection

The functional paradigm does not have a notion of dependency injection in the original object oriented sense. However, it achieves a similar effect by relying on higher order functions, currying and partial application.

### General Algebraic Data Types (GADT)

Algebraic data types can be combined out of simpler existing types to form more complex composite types. It is not an coincidence that this resembles function composition. Composition is ubiquitous in the functional paradigm. What kind of GADTs can be distinguished?

#### Sum types

A sum type, also known as tagged union, can have various shapes called variants. I use the `union` auxiliary function to create values of that type:

```javascript
const union = type => (tag, o) =>
  (o.type = type, o.tag = tag.name || tag, o);

const Bool = union("Bool"); // type constructor

// value constructor

const True = Bool("True", {});
const False = Bool("False", {});
```
`Bool` can either be `True` or `False`. It is inhabited by two possible values. We can alternatively use the algebraic notation `1 + 1` to represent it.

```javascript
const Option = union("Option"); // type constructor

// value constructors

const None = Option("None", {});
const Some = some => Option(Some, {some});
```
`Option` can either be `None` or `Some<a>`. This corresponding algebraic notation is `1 + a`. `None` is a nullary value constructor whereas `Some` is a unary one. The cardinality of a type thus depends on the arity of the involved value constructors.

#### Product types

A product type has only one shape and contains several data fields. I use the `record` auxiliary function to create values of this type:

```javascript
const record = (type, o) =>
  (o.type = type.name || type, o);

const Point = x => y => record(Point, {x, y});

Point(1) (2); // Point {x: 1, y, 2}
```
`Point<a, a>` contains two fields. The corresponding algebraic notation is `a * a`, i.e. its cardinality is calculated from the product of these fields.

#### Unit type

The `Unit` type has exactly one value and thus correspond to the number `1` in algebraic notation.

```javascript
const Unit = record("Unit", {});
```
Javascript's native unit-like type is `null` or `undefined`.

#### Void type

The `Void` type has no value and thus correspond to the number `0` in algebraic notation. We cannot express such a type in Javascipt, therefore I mimic it with a nullary function:

```javascript
const Void = () => record(
  "Void", throw new TypeError("uninhabited"));
```
#### Does the algebra hold?

We have represented GADTs in algebraic notation, but do the corresponding laws hold? Let us examine two of them:

```javascript
// 0 + x = x

const Foo = union("Foo");

// A Bar value cannot be constructed, because this variant of Foo has no values
// const Bar = Foo("Bar", Void());

const Bat = bat => Foo("Bat", {bat});
Bat(123); // Foo {bat: 123}
```
We can only construct `Foo` values of the `Bat` variant, hence `0 + a = a` holds.

```javascript
// 0 * x = 0

const Foo = bat => record("Foo", {bar: Void(), bat});

// A Foo value cannot be constructed, because Foo's first field has no values
// Foo(123);
```
We cannot construct a single `Foo` value, hence `0 * a = 0` holds.

### Pattern matching

Pattern matching is essentially an unification algorithm and must be implemented on the language level to properly and efficiently work with all types of that language. Javascript does not ship with pattern matching. We will use the following auxiliary function for tagged unions as a construct remotely similar to it:

```javascript
const match = (type, tx, o) =>
  tx.type !== type
    ? _throw(new UnionError("invalid type"))
    : o[tx.tag] (tx);
    
const Option = union("Option");

const None = Option("None", {});
const Some = some => Option(Some, {some});

const option = none => some => tx =>
  match("Option", tx, {
    None: _ => none,
    Some: ({some: x}) => some(x)
  });

const main = option(0) (x => x * x);

main(None); // 0
main(Some(5)); // 25
```
[run code](https://repl.it/repls/BogusFullButtons)

### Modeling alternatives of hierarchies

GADTs are extremely expressive because you can compose them to arbitrarily complex composite types. Simply put you can imagine such composite types as sums of products:

```javascript
const List = union("List");

const Nil = List("Nil", {});
const Cons = head => tail => List(Cons, {head, tail});
```
The `List` type is a tagged union with two interesting traits. Even though we do not use the `record` auxiliary function `Cons` is a product type, because the value constructor expects more than one argument. Additionally `Cons` takes another `List` as its second argument, i.e. `List` has a recursive type definition. `List` is a sum of product written as `List = 0 + a * List` in algebraic notation.

What basic idea do sum and product type each embody? Simply put, the former encodes alternatives and the latter hierarchies. Let us demonstrate that on an simple example:

```javascript

```

* products encode hierarchies
* sums encode alternatives
* sums of products
* demonstrate using the name example

### Lazy properties
