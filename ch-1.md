## 1. Values, Expressions and Functions

This first chapter introduces important functional programming jargon and illustrates some fundamental notions of the paradigm.

### First class values

Values are the result of expressions that cannot be evaluated any further. In Javascript we can represent values of many data types in literal form:

```javascript
"foo"
123
true
[1, 2, 3]
{foo: "bar"}
a => a
/^[A-Z]$/
```

You can pass values to and return them from functions. This trait is referred to as first class. Values are first class entities.

### First class expressions

Values are the most fundamental entity of programming but not particularly useful on their own. Fortunately we can generalize them to expressions. Generally speaking (pun intended) the process of generalization means to make things more useful, i.e. applicable to a wide range of scenarios.

```javascript
"foo" + "bar"
123 – 1
true && false
[1, 2, 3] [0]
({foo: "bar").foo
(a => a) ("foo")
```

Since an expression can be reduced to a single value during evaluation, it is also a first class entity. Expressions are a great improvement compared to mere values. But we can only use them ad-hoc, that is in place and as is. Is there a way to make them less ad-hoc? Let us generalize further!

### First class functions

Imagine named expressions with holes in them and a mechanism to fill these holes when needed. Such generalized expressions would be way more flexible because their results vary by means of the provided values. I am obviously talking about functions. Since functions are just expressions with holes in them they are also first class entities.

```javascript
const foo = hole => `expression with a ${hole} in it`;
foo("bar") // expression
```

We can call `foo` once, twice, several times or not at all. It is only evaluated when needed. This is the call-by-need evaluation strategy that purely functional programming languages like Haskell pursue as a default for every computation. Functions are inherently lazy.

Additionally we can compose functions if the types matches, that is we can create complex functions out of simpler ones and hence complex expressions out ouf simpler ones.

```javascript
add(length("foo")) (length("bar"))
```

When functions are just first class expressions with holes in them what differentiates them from, say, literals or other expressions? Apart from the fact that they are more general nothing actually. This is exactly how we regard functions in functional programming: They are just ordinary values and we treat them accordingly.

Admittedly, I oversimplified a bit. Actually there are three constraints necessary in order that functions are able to act like ordinary values:

* they must return a result value no matter what arguments are provided
* they must return the same result value for the same arguments
* they must not perform another visible effect than creating and returning a result value

The first constrain renders function deterministic. The latter is referred to as purity and will be described in a subsequent chapter of this functional programming course.

### Higher order functions

We are not done generalizing. If functions are just first class values let us pass a function to another one and see what is happening:

```javascript
const app = f => x => f(x);
const add = x => y => x + y;
const sub = x => y => x – y;

app(add) (2) (3) // 5
app(sub) (2) (3) // -1
```

What we are doing here is a kind of dependency injection. Such functions are called higher order functions, because they expect at least one function argument. Consequently functions without a function argument are called first order functions.

Please note that a function without function arguments that returns another function is not a higher order function but a curried one. We will deal with currying in a later chapter of this course..

You can most likely imagine how powerful higher order functions are, since they are so generalized. As I have already mentioned the process of generalization means to make things more useful.

### Are statements harmful?

No, but they are like dead ends in your code, because they are decoupled from one another. Since they do not evaluate to a value you need to explicitly bind their (intermediate) results to names in order to use them in other statements. As a result you have to declare a lot of name bindings to store all these accruing intermediate values:

```javascript
const x = 1 + 2;
const y = 2 + 3;
const z = x * y;
```

I use the term name binding instead of variable, because there is no such thing as a variable in functional programming. All we can do is bind immutable values to names. Name bindings themselves are also immtuable, i.e. you cannot reassign them. In Javascript, however, this is just a policy we need to adhere to.

Later in this course you will see that statements obstruct the functional control flow, which consists of various forms of function composition.

### Operators are functions + associativity + precedence

Operators usually differ from functions in their fixity. They are used in infix position whereas functions are written in prefix notation:

```javascript
1 + 2; // infix position
add(1) (2); // prefix position
```

Infix position avoids nesting

```javascript
1 + 2 + 3; // flat
add(add(1) (2)) (3); // nested
```

but it comes at a price: Associativity and precedence must be defined for each operator somewhere, so that the correct evaluation order can be determined.

In Javascript operators are not first class, that is to say it makes sense to complement them with their functional counterparts. Later in this course I will introduce special applicators that replace nested function calls with a comprehensable linear data flow.

### Undefined is not a proper value

scriptum and its underlying language Javascript are dynamically typed languages. That means there is a type system that should not be ignored. With `undefined` the type system is clearly telling you that there is a type error that needs to be fixed. As a rule of thumb your code should never intentionally create and only rarely be based on `undefined` as a last resort. You should not even consider it a proper value. `undefined` represents an error, a non-recoverable exception.

### Partial and total functions

The functional paradigm considers functions as mappings from domain (arguments) to codomain (result values). If every argument (or set of arguments) yields a result value we are talking about total functions. Otherwise it is a partial one:

```javascript
const head = xs => xs[0];
head([1, 2, 3]); // 1
head([]); // undefined
```

`head` is a partial function because it returns undefined in certain cases, which indicates a type error. You should either avoid such functions or throw an error explicitly instead of silently returning `undefined`. Partial functions are per se less predictable and reliable as total functions.

You can render any partial function into a total one by using the `Option` type. `Option` is one of the most common functional types. It will be covered in a later chapter.

[TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-2.md)
