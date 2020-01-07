## 1. Values, Expressions and Functions

This first chapter introduces important functional programming jargon and illustrates some fundamental notions of the paradigm.

### First class values

Values are the result of expressions that cannot be evaluated any further. In Javascript we can represent values of many data types in literal form:

```Javascript
“foo”
123
true
[1, 2, 3]
{foo: “bar”}
a => a
/^[A-Z]$/
```

You can pass values to and return them from functions. This trait is referred to as first class. Values are first class entities.

### First class expressions

Values are the most fundamental entity of programming but not particularly useful on their own. Fortunately we can generalize them to expressions. Generally speaking (pun intended) the process of generalization means to make things more useful, i.e. applicable in more scenarios.

```Javascript
“foo” + “bar”
123 – 1
true && false
[1, 2, 3] [0]
({foo: “bar”).foo
(a => a) (“foo”)
```

Since an expression can be reduced to a single value during evaluation, it is also a first class entity. Expressions are a great improvement compared to mere values. But we can only use them ad-hoc, that is in place and as is. Is there a way to make them less ad-hoc? Let us generalize further!

### First class functions

Imagine named expressions with holes in them and a mechanism to fill these holes when needed. Such generalized expressions would be way more flexible because their results vary by means of the provided values. I am obiously talking about functions. Since functions are just expressions with holes in them they are also first class entities.

```Javascript
const foo = hole => `expression with a ${hole} in it`;
foo("bar") // expression
```

We can call `foo` once, twice, several times or not at all. It is only evaluated when needed. This is the call-by-need evaluation strategy that purely functional programming languages like Haskell pursue as a default for every expression. Functions are inherently lazy.

Additionally we can compose functions if the types matches, that is we can create complex functions out of simpler ones and hence complex expressions out ouf simpler ones.

```Javascript
add(length("foo")) (length("bar"))
```

When functions are just first class expressions with holes in them what differentiates them from literals or other less general expressions? Nothing actually, provided you are willing to neglect the temporal aspect, namely that functions are only evaluated when needed. This is exactly how we regard functions in functional programming: They are just ordinary values and we treat them accordingly.

Ok, I oversimplified a bit. Actually there are two constraints necessary in order that functions act like classical values:

* they must return a result value no matter what arguments are provided
* they must not perform another visible effect than calculating and returning a result value

The latter constraint is referred to as purity and will be examined in a subsequent chapter of this functional programming course.

### Higher order functions

We are not done generalizing. When functions are just first class values let us pass a function to another one and see what is happening:

```Javascript
const app = f => x => f(x);
const add = x => y => x + y;
const sub = x => y => x – y;

app(add) (2) (3) // 5
app(sub) (2) (3) // -1
```

What we are doing here is a kind of dependency injection. Such functions are called higher order functions, because they expect at least one function argument. Consequently functions without a function argument are called first order functions.

Please note that a function without function arguments that returns another function is not a higher order function but a curried one. Currying will be presented in a later chapter.

You can most likely imagine how powerful higher order functions are because they are so generalized. As I have already mentioned the process of generalization means to make things more useful.

### Are statements harmful?

No, but they are like dead ends in your code, because they are decoupled from one another. Since they do not evaluate to a value you need to explicitly bind their (intermediate) results to names in order to use them in other statements. As a result you have to declare a lot of name bindings to store all these accruing intermediate values:

```Javascript
const x = 1 + 2;
const y = 2 + 3;
const z = x * y;
```

I use the term name binding instead of variable, because there is no such thing as a variable in functional programming. All we can do is bind immutable values to names. Name bindings themselves are also immtuable, i.e. you cannot reassign them. In Javascript, however, this is just a policy we need to adhere to.

Later in this course you will see that statements obstruct the functional control flow, which consists of various forms of function composition.

### Operators are functions plus associativity + precedence

Operators differ from functions that they are in infix not prefix position like functions:

```Javascript
1 + 2; // infix position
add(1) (2); // prefix position
```

Infix position avoids nesting

```Javascript
1 + 2 + 3; // infix position
add(add(1) (2)) (3); // prefix position
```

but it comes at a price: Associativity and precedence must be defined for each operator somewhere, so that the correct evaluation order can be determined.

In Javascript operators are not first class, that is to say it makes sense to complement them with their functional counterparts. Variadic functions are a way to bypass the nesting issue. I will introduce them in a later chapter of this course.

### Undefined is not a proper value

scriptum and its underlying language Javascript are dynamically typed languages. That means there is a type system that should not be ignored. With `undefined` the type system is clearly telling you that there is a type error that needs to be fixed. As a rule of thumb your code should never intentionally create and only rarely be based on `undefined` as a last resort. You shouldn‘t even consider it a proper value. `undefined` represents an error, a non-recoverable exception.

A function that returns `undefined` is less predictable and reliable as a normal function, because it is only a partial one. More on this in the next paragraph.

### Partial and total functions

The functional paradigm considers functions as mappings from domain (arguments) to codomain (result values). If every argument (or set of arguments) yields a result value we are talking about total functions. Otherwise it is a partial one:

```Javascript
const head = xs => xs[0];
head([1, 2, 3]); // 1
head([]); // undefined
```

`head` is a partial function because it returns undefined in certain cases, which indicates a type error. You should either avoid such functions or throw an error explicitly instead of silently returning `undefined`. You can render any partial function into a total one by using the `Option` type, which will be introduced in a subsequent chapter.

[next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-2.md)
