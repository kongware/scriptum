## Lazy Evaluation and WHNF in a Strictly Evaluated Setting

Lazy evaluation in the strict sense means that expressions are only evaluated

* when needed
* just enough
* once

In this chapter, however, I will use the term in a broader, less technical sense. Lazy is every mechanism that somehow suppresses the immediate evaluation of expressions.

#### Normal vs. applicative order

Applicative order is the common evaluation strategie of imperative and multi-paradigm languages. It evaluates all subexpressions passed to a function as its arguments right before the function is called.

Normal order evaluaton passes argument subexpressions to functions as they are and proceeds with their evaluation only if the resuts are actually needed within the function body. Normal order corresponds to the first bullet of the above enumeration.

```javascript
const add = x => y => x + y;

const foo = add(2 + 3) (4 * 5); // A
                ^^^^^   ^^^^^
const main = foo + 1; // B
```
With normal evaluation order both subexpressions are not evaluated but passed to `add` as is (line `A`). However, in line `B` the evaluation is forced, because the result of the addition is needed. Let us further look into the evaluation process:

```javascript
// hypothetical normal evaluation order in Javascript

foo + 1

// first add's body is inlined with the unevaluated arguments

((2 + 3) + (4 * 5)) + 1

// then the resulting expression is further reduced to normal form

(5 + 20) + 1
25 + 1
26 // normal form
```
#### Weak Head Normal Form

Lazy evaluation also means to evaluate subexpressions just enough, that is to pause evaluation as early as possible. The evaluation can be paused when an expression has been evaluated to the outermost lambda abstraction. Such an expression in WHNF may contain unevaluated subexpressions. Taking the above example the add function call is in WHNF:

```javascript
// hypothetical WHNF in Javascript

add(2 + 3) (4 * 5) // WHNF
add(2 + 3) // also WHNF

add(2 + 3) (4 * 5) + 1 // not in WHNF
```
The expression in the last line is not in WHNF, because the outermost level is not a lambda abstraction but the `+` operator with two operands. WHNF is the technical term for the second bullet of the enumeration of at the beginning of this chapter.

#### Sharing

### Lambda abstractions

### Nullary functions

### Thunks

#### Infinite recursion

#### Value recursion

#### Forcing evaluation
