## Lazy Evaluation and WHNF in a Strictly Evaluated Setting

Lazy evaluation in the strict sense means that expressions are only evaluated

* when needed
* at the leftmost, outermost level
* once

In this chapter, however, I will use the term in a broader, less technical sense. Lazy is every mechanism that somehow suppresses the immediate evaluation of expressions.

#### Normal vs. applicative order

Applicative order is the common evaluation strategie of imperative and multi-paradigm languages. It evaluates all subexpressions passed to a function as its arguments right before the function is called.

Normal order evaluaton passes argument subexpressions to functions as they are and proceeds with their evaluation only if the resuts are actually needed within the function body. Normal order corresponds to the first bullet of the above enumeration.

#### Weak Head Normal Form

Lazy evaluation also means to evaluate subexpressions just enough, that is to pause evaluation as early as possible. The evaluation can be paused when an expression has been evaluated to the outermost constructor or lambda abstraction. Such an expression in WHNF may contain unevaluated subexpressions.

#### Sharing

### Lambda abstractions

### Nullary functions

### Thunks

#### Infinite recursion

#### Value recursion

#### Forcing evaluation
