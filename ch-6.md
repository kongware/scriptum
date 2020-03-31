## Data Modeling with Algebraic Data Types (ADTs)

Modeling a domain in functional programming means to compose simple types to arbitrarily complex composite ones, while these types have their foundation in math. The goal of this chapter is to give you a first impression of this procedure.

### Data and function dependencies

As opposed to object oriented programming data and behavior are strictly decoupled in functional programming. What we have to deal with are data and function dependencies though:

```javascript
const comp = f => g => x => f(g(x));

const arrMap = f => xs =>
  xs.map(f);
  
const arrFilter = p => xs =>
  xs.filter(p);

const arrDedupe = xs => {
  const s = new Set(); // A

  return arrFilter(x => { // A
    return s.has(x)
      ? null
      : (s.add(x), x);
  }) (xs);
};

const toUC = s => s.toUpperCase();

const shout = s => s + "!";

const xs = ["foo", "bar", "bar", "bat", "foo", "BAT"];

const main = comp( // B
  arrMap(comp(shout) (toUC))) // C
    (arrDedupe);

main(xs); // ["FOO!", "BAR!", "BAT!", "BAT!"]
```
[run code](https://repl.it/repls/JointFullValue)

`arrDedupe` has static function dependencies on `arrFilter` and the `Set` constructor (lines `A`). The function composition in line `B` however creates a data dependency of the form `arrMap >> toUC >> shout >> arrDedupe`, where each function depends on the result of its predecessor. The functional programming style tends to make such data dependencies more explicit.

In line `C` there is another function dependency between `arrMap` and a function composition. As opposed to the static function dependency in lines `A` this is a dynamic one. Since almost all functions in the functional paradigm are global this is all we need to obtain dependency injection. Static function dependencies are not bad, but dynamic ones lead to more general, more expressive solutions:

```javascript
const arrDedupeBy = f => xs => {
  const s = new Set();

  return arrFilter(x => {
    const r = f(x);
    
    return s.has(r)
      ? null
      : (s.add(r), x);
  }) (xs);
};

const xs = ["foo", "bar", "bar", "bat", "foo", "BAT"];

const main = comp(
  arrMap(comp(shout) (toUC)))
    (arrDedupeBy(toUC));

main(xs); // ["FOO!", "BAR!", "BAT!"]
```
[run code](https://repl.it/repls/DeliriousLuckySoftwareengineer)

Since all functions are pure in functional programming the order of evaluation do not have to adhere to the lexical order of expressions but can be optimized, as long as such optimizations do not interfere with the given data dependencies. Please note that Javascript is not a purely functional language. Every expression may include side effects and thus the order of evaluation is rather strict.

### Algebraic data types

ADTs are the fundamental means to construct custom data structures in functional programming. They are composable and may have a recursive definition. The next sections will introduce the basic ADTs and their mathematical foundation.

#### Sum types

A sum type, also known as tagged union, can have alternative shapes called variants, where only one variant can exist at a time. There is the `union` auxiliary function to easily create tagged unions:

```javascript
const union = type => (tag, o) =>
  (o[type] = type, o.tag = tag.name || tag, o);

const Bool = union("Bool"); // type constructor

// value constructor

const False = Bool("False", {});
const True = Bool("True", {});

False; // {Bool: true, tag: "False"}
True; // {Bool: true, tag: "True"}
```
The `Bool` type can either be `True` or `False`. Please note that the `Bool` property is needed, because we will use Typescript to type our code in more advanced chapters. Typesript is based on structural typing though, which is a rather weak form of typing. In order to render each type structural unique, they have to carry a corresponding type property around.

Here is another tagged union, which comprises the variants `None` and `Some<a>`. It is a less error prone alternative to Javascript's `Null` type:

```javascript
const Option = union("Option"); // type constructor

// value constructors

const None = Option("None", {});
const Some = some => Option(Some, {some});

None; // {Option: true, tag: "None"}
Some(5); // {Option: true, tag: "Some", some: 5}
```
#### Product types

A product type has only one shape but can contain several data fields, which are independent of each other. There is the `record` auxiliary function to easily create product types of various fields:

```javascript
const record = (type, o) =>
  (o.type = type.name || type, o);

const Point = x => y => record(Point, {x, y});

Point(1) (2); // {Point: true, x: 1, y, 2}
```
`Point<a, a>` contains two fields with values of the same type.

#### Void type

The `Void` type has no inhabitants, i.e. it has no value. We cannot express such a type in Javascipt, therefore I mimic it with a nullary function that once called immediately throws an error:

```javascript
const Void = () => record(
  "Void", throw new TypeError("uninhabited"));
```
As far as I know `Void` has not many uses cases on its own. However, it is useful to explain the algebra of ADTs, hence I introduce it here.

#### Unit type

The `Unit` type has exactly one inhabitant, namely itself:

```javascript
const Unit = record("Unit", {});
```
Javascript's native unit types are `null` and `undefined`.

#### The algebra of ADTs

What exactly is the algebra of algebraic data types? Well, we can use algebraic notation for describing data structures constructed by ADTs:

* `+` represents tagged unions
* `*` represents records
* `0` represents the `Void` type
* `1` represents the `Unit` type

Let us express the types defined so far using this notation:

```
Bool        = True | False   ~ 1 + 1
Option<a>   = None | Some<a> ~ 1 + a
Point<a, a>                  ~ a * a
```
What these terms represent are the cardinality of each type, that is the number of possible values a type can take. `Bool` has two inhabitants. `Option` has one inhabitant plus the inhabitants of type `a`. `Point`'s number of possible values is the product of the inhabitants of `a` multiplied by itself.

Now it is obvious that sum and product types got their name by the operation that determines their cardinality.

#### Algebraic laws

Do the algebraic laws for addition and multiplication hold for ADTs?

```javascript
// 0 + x = x

const Foo = union("Foo");

const Bar = () => Foo("Bar", Void());
const Bat = bat => Foo("Bat", {bat});

Bar(); // type error
Bat(123); // Foo {bat: 123}
```
We can only construct `Foo` values of the `Bat` variant, hence `0 + a = a` applies.

```javascript
// 0 * x = 0

const Foo = bat => record("Foo", {bar: Void(), bat});

Foo(123); // type error
```
We cannot construct a single `Foo` value, hence `0 * a = 0` applies. I leave it as an exercise to the reader to see that the other laws hold as well.

### When to use sums and when to use products?

Sums are dual to products but when do we choose one over the other? We can state the following as a rule of thumb:

* if two data components depend on each other a sum type should be used to avoid invalid states
* if two data components do not depend on each other a product type should be used to allow all combinations

A computation that may fail can either yield a result value or an error message. Both data components depend on each other, because there are several invalid combinations:

left | right | valid
---- | ----- | ------
string | null | true
null | data | true
string | data | false
null | null | false

We rule out these invalid states by encoding such a computation with sum types:

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
Now only valid combinations of the involved data components are possible.

The data fields of the following data type on the other hand are completely independent of each other, hence we encode them with a product type:

```javascript
const Time = h => m => s => record(Time, {h, m, s});

Time(11) (59) (59); // {Time: true, h: 11, m: 59, s: 59}
```
All combinations of hours, minutes and seconds are valid. The number of possible combinations is only limited by the product of the three data fields `Time<Nat, Nat, Nat> ~ Nat * Nat * Nat`.

### Sums of products

Simply put the composition of sum and product types usually results in a sums of products shape. The `List` type is a simple example of such a sum of product, which has additionally a recursive type definition: 

```javascript
const List = union("List");

const Nil = List("Nil", {});
const Cons = head => tail => List(Cons, {head, tail});

const listFold = f => acc => {
  const go = tx =>
    match(tx, {
      Nil: _ => acc,
      Cons: ({head, tail}) => f(head) (go(tail))
    });

  return go;
};

const listSum = listFold(x => acc => x + acc) (0);

const tx = Cons(1) (Cons(2) (Cons(3) (Nil)));

listSum(tx); // 6
```
[run code](https://repl.it/repls/TerribleRoughSorting)

Even though we do not use the `record` auxiliary function `List` includes a product type, because the `Cons` data constructor expects more than a single argument. The cardinality of `List` is calculated by `List<a> ~ 1 + a * List<a>`. It has a recursive definition, because `Cons` second argument `tail` is of type `List`.

Here is another more complex example of a sum of product, which represents an either or both operation:

```javascript
const These_ = union("These");

const This = _this => These_(This, {this: _this});
const That = that => These_(That, {that});
const These = _this => that => These_(These, {this: _this, that});

const arrAlign = f => xs => ys => {
  const go = (acc, i) => {
    if (i >= xs.length && i >= ys.length)
      return acc;

    else if (i >= ys.length)
      return go(arrSnoc(acc) (f(This(xs[i]))), i + 1);

    else if (i >= xs.length)
      return go(arrSnoc(acc) (f(That(ys[i]))), i + 1);

    else
      return go(arrSnoc(acc) (f(These(xs[i]) (ys[i]))), i + 1);
  };

  return go([], 0);
};

const liftAlign = align => f => x => y =>
  align(tx =>
    match(tx, {
      This: ({this: x_}) => f(x_) (y),
      That: ({that: y_}) => f(x) (y_),
      These: ({this: x_, that: y_}) => f(x_) (y_)
    }));

const zipPad = align => liftAlign(align) (Pair);

const liftAlign3 = align => f => x => y => z => xs => ys =>
  align(tx =>
    match(tx, {
      This: ({this: [x_, y_]}) => f(x_) (y_) (z),
      That: ({that: z_}) => f(x) (y) (z_),
      These: ({this: [x_, y_], that: z_}) => f(x_) (y_) (z_)}))
        (zipPad(align) (x) (y) (xs) (ys));

const zipPad3 = align => liftAlign3(align) (Triple);

const main = zipPad3(arrAlign) ("") (0) (false);

main(
  ["foo", "bar"])
    ([2, 4, 6, 8])
      ([true, true]); // [["foo", 2, true], ["bar", 4, true], ["", 6, false], ["", 8, false]]
```
[run code](https://repl.it/repls/FocusedDeepCodeview)

Do not be intimidated by the complexity of this algorithm. It requires quite a bit of experience to understand or even write such an extendable composition. This course will hopefully help you to get there. The cardinality of `These<a, b>` is calculated by `These<a, b> ~ a + b + a * b`.

### From product types to type hierarchies

In many imperative or object oriented languages the only means to express new data structures is to combine product types. This way we can only add fields to a data structure. Because of the restriction that we can only expand an idea by adding to it, we are constrained with a top-down design, starting with the most abstract representation of a type we can imagine. This is the basis for modeling data in terms of type hierarchies. Such data models are often too inflexible to reflect the chaotic, non-hiearchical world. 

### ADTs with lazy property access

I use plain old Javascript objects to define ADTs. Javascript object properties are eagerly evaluated but we can benefit from lazy getters to create ADTs with lazy property access semantics:

```javascript
const lazyProp = (k, v) => o =>
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = v()},
    configurable: true,
    enumerable: true});

const Lazy = lazy =>
  record(Lazy, lazyProp("lazy", lazy) ({}));

const log = x => (console.log(x), x);

const main = Lazy(() => log(2 * 3));

// nothing logged so far

main.lazy + main.lazy; // logs 6 once and yields 12
//          ^^^^^^^^^ subsequent access
```
[run code](https://repl.it/repls/GlisteningPalegreenAnalyst)

`main.lazy` is only evaluated when needed and only once. All subsequent accesses resort to the initially computed result.

### Pattern matching

Functions that expect tagged unions must always consider all possible cases in order to work reliably. Pattern matching is a unification algorithm along with local bindings and special syntax that guarantees case exhaustiveness. It is one of a few techniques that cannot be accomplished in userland but needs to be implemented on the language level.

Unfortunately Javascript does not ship with pattern matching, hence we have to resort to folds, which represent the elimination rule of a type and to auxiliary functions like `match`:

```javascript
const match = (tx, o) =>
  o[tx.tag] (tx);
    
const Option = union("Option");

const None = Option("None", {});
const Some = some => Option(Some, {some});

const option = none => some => tx =>
  match(Option, tx, {
    None: _ => none,
    Some: ({some: x}) => some(x)
  });

const main = option(0) (x => x * x);

main(None); // 0
main(Some(5)); // 25
```
[run code](https://repl.it/repls/BogusFullButtons)

`match` only works with tagged unions and it does not prevent us from supplying non-exhaustive patterns. This will change as soon as we start working with Typescript.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-5.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-7.md)
