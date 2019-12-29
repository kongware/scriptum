## Values, Expressions and Functions

### First class values

Values are the simplest possible expression. In Javascript we can represent values of many data types in literal form:

```Javascript
“foo”
123
true
[1, 2, 3]
{foo: “bar”}
a => a
```

You can pass values to and return them from functions. This trait is referred to as first class. Values are first class entities.

### First class expressions

Values are the most fundamental entity of programming but not particularly useful on their own. Fortunately we can generalize them to expressions. Generally speaking (pun intended) the process of generalization means to make things more useful, i.e. they gain a broader field of application.

```Javascript
“foo” + “bar”
123 – 1
true && false
[1, 2, 3] [0]
({foo: “bar”).foo
(a => a) (“foo”)
```

Since an expression can be reduced to a single value during evaluation, it is also a first class entity and it is composable. The latter means you can combine simple expressions to construct more complex ones.

```Javascript
(a => a) (“foo” + “bar”)
```

Expressions are a great improvement compared to mere values. But we can use them only ad-hoc, that is in place as is. Is there a way to make them less ad-hoc? Let us generalize further!

### First class functions

Imagine named expressions with holes in them and a mechanism to fill these holes when needed. Such generalized expressions would be way more flexible because their behavior would depend on the provided values.

Since functions are just expressions with holes they are also first class:

```Javascript
const foo = a => a.toUpperCase();
foo(“bar”);
```

We can call foo once, twice, several times or not at all. It is only evaluated when needed. This resembles the call-by-need evaluation strategy of functional programming languages like Haskell. Functions are inherently lazy evaluated.

When functions are just first class expressions with holes in them what differentiates them from literals or other simpler expressions? Nothing actually, if you are willing to neglect the temporal aspect, namely that they are only evaluated when needed. This is exactly how we regard functions in functional programming: They are just ordinary values and we treat them accordingly.

Ok, I oversimplified a bit. Actually there are two constraints necessary in order that functions behave like normal values:

functions must return a result value no matter what arguments are provided
functions must not perform another visible effect than returning a result value

The latter constraint is referred to as pure functions and will be examined in a subsequent lesson of this functional programming course.

### Higher order functions

We are not done generalizing. When functions are just first class values let us pass a function to another one and see what is happening.

```Javascript
const foo = f => x => f(x);
const add = x => y => x + y;
const sub = x => y => x – y;

foo(add) (2) (3) // 5
foo(sub) (2) (3) // -1
```

What we are doing here is a kind of dependency injection and such functions are called higher order functions, because they except at least one function argument. Consequently functions without a function argument are called first order functions.

Please note that a function without function arguments that returns another function is not a higher order function but a curried one. Currying will be presented in a later lesson.

You can most likely imagine how powerful higher order functions are because they are so generalized. As I have already mentioned the process of generalization means to make things more useful.

### Are statements harmful?

No, but they are like dead ends in your code, because they are decoupled from one another. Since they don't evaluate to a value you need to explicitly bind their (intermediate) results to names in order to use them in other statements. As a result you have to declare a lot of name bindings to store all these accruing intermediate values.

```Javascript
const x = 1 + 2;
const y = 2 + 3;
const z = x * y;
```

I use the term name binding instead of variable, because there is no such thing as variables in functional programming. All we can do is bind immutable values to names. Name bindings themselves are also immtuable, i.e. you cannot reassign them. In Javascript, however, this is just a policy we need to adhere to.

Later in this course you will see that statements obstruct the functional control flow, which consists of various forms of function composition.

### Undefined is not a proper value

scriptum and its underlying language Javascript are dynamically typed languages. That means there is a type system that should not be ignored. With `undefined` the type system is clearly telling you that there is a type error that needs to be fixed. As a rule of thumb your code should neither rely on `undefined` nor create it. You shouldn‘t even consider it a proper value. It represents an error, a non-recoverable exception.

Consequently a function that returns `undefined` isn‘t a proper function in the sense of functional programming.
