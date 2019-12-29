## Statements, expressions and functions as values

### Expressions

Purely functional programming only consists of expressions. An expression is a first class code unit that can be evaluated to a single value according to its particular rules of precedence. Expressions can be passed to and be returned by functions like any other ordinary value.

```Javascript
mul(1 + 2) (2 + 3);
```

* expressions evaluate to a single value
* expressions are first class, i.e. can be passed around like values

### Are statements harmful?

No, but they are like dead ends in your code, because they are decoupled from one another. Since they don't evaluate to a value you need to explicitly bind their (intermediate) results to names in order to use them in other statements. As a result you have to declare a lot of name bindings to store all these accruing intermediate values.

```Javascript
const x = 1 + 2;
const y = 2 + 3;
const z = x * y;
```

I use the term name binding instead of variable, because there is no such thing as variables in functional programming. All we can do is bind immutable values to names. Name bindings themselves are also immtuable, i.e. you cannot reassign them.

Later in this course you will see that statements obstruct the functional control flow, which consists of various forms of function composition.

### Functions are expressions are values

Let‘s distinguish two important types of expressions that seem to have no relation to each other at all:

* literals
* functions

A literal (e.g. `"foo"`, `123`, `true`, `[1, 2, 3]`) is usually the representation of a fixed value<sup>1</sup> and is immediately evaluated as such. A function (e.g. `a => a`) is also evaluated to a fixed value when all its arguments are provided. You can already see that both expressions resemble each other. As a matter of fact in functional programming functions are regarded as ordinary values with the sole exception that they are lazily evaluated. You can picture them as expressions with a hole in it that needs to be filled to yield a final value.

There are two additional function constrains in order that they behave like ordinary values. First they always have to return a value no matter what arguments are passed. Second they have to be pure. We will examine the latter in a subsequent lesson.

* functions are just lazy evaluated expressions and hence are first class values
* functions always have to return a value

<sup>1</sup>`a => a` happens to be a literal of the function type, however, the exception proves the rule.

### Undefined is not a proper value

scriptum and its underlying language Javascript are dynamically typed languages. That means there is a type system that should not be ignored. With `undefined` the type system is clearly telling you that there is a type error that needs to be fixed. As a rule of thumb your code should neither rely on `undefined` nor use it in any way. You shouldn‘t even consider it a proper value. It is an error, a non-recoverable exception.

Consequently a function that returns `undefined` isn‘t a function in the sense of functional programming.
