## Functional Data Modelling with Algebraic Data Types

### Data dependencies

* explicit
* as opposed to function dependencies
* read after write
* the program flow is defined by the data dependencies and not by the sequence of instructions.

#### Dependency injection

### General Algebraic Data Types (GADT)

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

