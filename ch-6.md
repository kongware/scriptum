## Data Modelling with Algebraic Data Types (GADTs)

I have found it rather hard to get further information about how to model your domain in functional programming than merely the reference to GADTs. This chapter is an attempt to give you a rough idea.

### GADTs

Algebraic data types are composable and may have a recursive definition. It is not a coincidence that both properties, composition and recursion, are also applied to the type level. They are ubiquitous in the functional paradigm. The next sections will introduce the basic GADTs, which can be composed to more complex composite types.

### Sum types

A sum type - also known as tagged union - can have alternative shapes called variants where only one variant can exist at a time. There is the `union` auxiliary function to easily create tagged unions:

```javascript
const union = type => (tag, o) =>
  (o.type = type, o.tag = tag.name || tag, o);

const Bool = union("Bool"); // type constructor

// value constructor

const False = Bool("False", {});
const True = Bool("True", {});

False; // Bool {tag: "False"}
True; // Bool {tag: "True"}
```
The `Bool` type can either be `True` or `False`.

```javascript
const Option = union("Option"); // type constructor

// value constructors

const None = Option("None", {});
const Some = some => Option(Some, {some});

None; // Option {tag: "None"}
Some(5); // Option {tag: "Some", some: 5}
```
`Option` can either be `None` or `Some<a>`. It is a more robust alternative for Javascript's `Null` type.

#### Pattern matching

Functions that expect tagged unions must always consider all possible cases in order to work reliably. Pattern matching is a unification algorithm with some extras on the language level that guarantees case exhaustiveness. Unfortunately Javascript does not ship with pattern matching, hence we have to resort to simple folds, which each encode the elimination rule of its tagged union. The `match` auxiliary function aliviates the definition of such folds:

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

`match` only works with tagged unions and it does not prevent us from supplying non-exhaustive patterns. It is the best we can get in Javascript though.

### Product types

A product type has only one shape but can contain several data fields. There is the `record` auxiliary function to easily create product types of various fields:

```javascript
const record = (type, o) =>
  (o.type = type.name || type, o);

const Point = x => y => record(Point, {x, y});

Point(1) (2); // Point {x: 1, y, 2}
```
`Point<a, a>` contains two fields with values of the same type.

### Void type

The `Void` type has no inhabitant, i.e. it has no value. We cannot express such a type in Javascipt, therefore I mimic it with a nullary function that once called immediately throws an error:

```javascript
const Void = () => record(
  "Void", throw new TypeError("uninhabited"));
```
`Void` has not many uses cases but it is useful to explain the algebra of GADTs, which is going to happen in a later section in this chapter.

### Unit type

The `Unit` type has exactly one inhabitant, namely itself:

```javascript
const Unit = record("Unit", {});
```
Javascript's native unit types are `null` and `undefined`.

### Lazy types

### The algebra of GADTs

So where is the algebra of GADTs? We can simply use algebraic notation for describing data structures constructed by GADTs:

* `+` represents tagged unions
* `*` represents records
* `0` represents the `Void` type
* `1` represents the `Unit` type

```javascript
False; //
```
### From product types to hierarchical data and invariants

### Sums of products
