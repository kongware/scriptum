## Data Modelling with Algebraic Data Types (GADTs)

I have found it rather hard to get further information about how to model your domain in functional programming than merely the reference to GADTs. This chapter is an attempt to give you a rough idea.

### Data dependencies

As opposed to object oriented programming data and behavior are strictly decoupled in functional programming. We still have to deal with data dependencies. Goal is to make them as explicit as possible:

```javascript
const comp = f => g => x => f(g(x));
const sqr = x => x * x;
const add = x => y => x + y;

const main = comp(sqr) (add(2));

main(3); // 25
```
`comp` establishes a data dependency between `sqr` and the partially applied `add(2)`, in which the former depends on the resulting data of the latter. Strictly speaking it froms a read-after-write data dependency. Since reassignments and mutations are banned in functional programming there are actually no other data dependency forms.

Since all functions are pure the order of evaluation do not have to adhere to the lexical order of expressions but can be altered, parallelized for instance, as long as such optimizations do not interfere with the given data dependencies. Please note that Javascript's interpreter pursues rather limited optimizations since it has to take possible side effects into account.

### Algebraic data types

GADTs are the fundamental mean to construct custom data structures in functional programming. They are composable and may have a recursive definition. It is not a coincidence that both properties, composition and recursion, are also applied to the type level. They are ubiquitous in the functional paradigm. The next sections will introduce the basic GADTs, which can be composed to more complex composite types.

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

TODO: add description

```javascript
const lazyProp = (k, v) => o =>
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = v()},
    configurable: true,
    enumerable: true});

const Lazy = lazy => record(Lazy, lazyProp("lazy", lazy));

// TODO: add example
```
### The algebra of GADTs

So how works the algebra of algebraic data types? We can simply use the algebraic notation for describing data structures constructed by GADTs:

* `+` represents tagged unions
* `*` represents records
* `0` represents the `Void` type
* `1` represents the `Unit` type

Let us express the types defined so far:

```
Bool        = True | False   ~ 1 + 1
Option<a>   = None | Some<a> ~ 1 + a
Point<a, a>                  ~ a * a
```
What these terms represent are the cardinality of each type, that is the number of values each type takes. `Bool` has two inhabitants. `Option` has one inhabitant plus all inhabitants of the type `a`, which still has to be provided. `Point`'s number of possible values is yielded by the product of the inhabitants of `a`.

#### Algebraic laws

Now that we know how to calculate the cardinality of an GADT let us verify that the algebraic laws for addtion and multiplication hold:

```javascript
// 0 + x = x

const Foo = union("Foo");

const Bar = () => Foo("Bar", Void());
const Bat = bat => Foo("Bat", {bat});

Bar(); // type error
Bat(123); // Foo {bat: 123}
```
We can only construct `Foo` values of the `Bat` variant, hence `0 + a = a` holds.

```javascript
// 0 * x = 0

const Foo = bat => record("Foo", {bar: Void(), bat});

Foo(123); // type error
```
We cannot construct a single `Foo` value, hence `0 * a = 0` holds.

### Sums of products

Usually we combine tagged unions and records to define more complex data structures:

```javascript
const List = union("List");

const Nil = List("Nil", {});
const Cons = head => tail => List(Cons, {head, tail});
```
The cardinality of `List` is calculated by `List<a> = 1 + a * List<a>`, that is to say `List` is a sum of product and has a recursive type defintion. Event though we did not use the `record` auxiliary function the `Cons` value constructor expects two arguments and thus forms a product type with two fields. `List` is recursive because `Cons` takes value of type `List` as its second argument.

Here is another example of a sum of product, which represents the boolean operation `(x && y) || x || y`:

```javascript
const These_ = union("These");

const This = _this => These_(This, {this: _this});
const That = that => These_(That, {that});
const Threse = _this => that => These_(These, {this: _this, that});
```
The cardinality of `These<a, b>` is calculated by `These<a, b> = a + b + a * b`.

### From product types to invariants

We have learned so far how we can construct arbitrarily complex data structures by composing sum and product types. Sums are obviously dual to products but when do we choose one over the other? As a rule of thumb we can state:

* if two data components depend on each other a sum type should be used to avoid invariants
* if two data components do not depend on each other a product type should be used to allow all combinations

I am going to demonstrate this using a type that encodes a computation that may yield an error:

```javascript
const Either = union("Either");

const Left = left => Either(Left, {left}); // error case
const Right = right => Either(Right, {right}); // right case

const safeDiv = x => y =>
  y === 0
    ? Left("division by zero")
    : Right(x / y);
    
safeDiv(2) (6); // Either {tag: "Right", right: 3}
safeDiv(2) (0); // Either {tag: "Left", left: "division by zero"}
```
What would happen if we express `Either` as a product type?

```javascript
const Either = left => right => record(Either, {left, right});

const safeDiv = x => y =>
  y === 0
    ? Either("division by zero") (null)
    : Either(null) (x / y);
    
safeDiv(2) (6); // Either {left: null, right: 3}
safeDiv(2) (0); // Either {left: "division by zero", right: null}
```
The hideous `null` values are not the only issue with this code. Since a product type expresses all possible combinations of its fields it does not rule out the invariants of a computation that may fail:

left | right | valid
---- | ----- | ------
string | null | true
null | data | true
string | data | false
null | null | false

The `Left` and `Right` data components depend on each other and thus need to be encoded as a sum type.

### Form product types to type hierarchies

In the previous section we saw that the product encoding needed the `Null` type to fill all of its fields with a value. This points to another issue for languages that supply product types as the only mean to construct data structures.

When we combine product types to get more complex ones we can only add fields. Because of the restriction that we can only expand an idea by adding to it, we are constrained with a top-down design, starting with the most abstract representation of a type we can imagine. This is the basis for modeling data in terms of type hierarchies.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-5.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-7.md)
