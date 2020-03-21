## Functional Data Modelling with Algebraic Data Types

The way data is modeled in functional programming is a source of confusion for many object oriented programmer, because familiar concepts like inheritance or dipendency injection are (mostly) orthogonal to the functional paradigm.

### Data and functional dependencies

Data and behavior is strictly decoupled in functional programming. What we have to deal with are data and functional dependencies:

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

#### Product types

#### Other algebraic types

#### The algebra of GADTs

* composite type
* product type (tuples/records)
* sum type (tagged union)
* product type has fields
* sum type has variants
* sums of products
* products encode hierarchies
* sums encode alternatives
* sums of products encode alternative hierarchies

* Void (0)
* Unit (1)
* Sum (a + b)
+ Prod (a * b)
* Functon (a^b)

* Sum<Void | Unit> ~ Unit (0 + 1 = 1)
* Prod<Void & Unit> ~ Void (0 * 1 = 0)

* type vs data constrcutor
* type level vs term level
* parameterized types
* type variables
* cardinality

### Pattern matching

### Javascript Encoding

### Modeling alternatives of hierarchies
