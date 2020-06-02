## Managing State in Functional Programming

It is rather difficult to talk about something as fundamental and general as state. This chapter is the attempt to give some orientation.

### Definition of state

State is data that changes over the runtime of a program. In imperative programming you usually get state either by reassigning a variable

```javascript
let x = 1; // data
x = x + 1; // state
```
or by mutating a reference value:

```javascript
const o = {foo: true}; // data
o.foo = false; // state
```
Both actions constitute state and it is important to make such an distinction, since both variants are handled by different means in functional programming.

### Variables and reassignments

Although the term variable is used in functional programming and math I prefer to avoid it in the functional context, because it regularly causes confusion. There are no variables in FP, at least not in the manner as they are understood in imperative programming. All we have at our disposal are immutable name bindings, that is, you cannot reassign a new value to an existing name.

There is a good reason why reassignments are banned in functional programming. They would violate referential transparency and thus introduce side effects, which render equational reasoning impossible:

```javascript
let y = 2;
const sub2 = x => x – y

sub2(2); // 0
y = 3;
sub2(2); // -1
```
The same expression within the same scope must yield the same value no matter when the runtime decides to actually evaluate this expression.

### References and mutations

The functional paradigm does not have a notion of references, because every expression must be referential transparent. References require the opposite, namely referential identity, which allows certain values to be distinguished by their reference and thus by their location in memory. Reference values have an identity:

```javascript
const o = {foo: true},
  p = {foo: true};

o !== p; // true
```
The expression above compares two references. In a referential transparent environment `o` and `p` are indistinguishable, because their values are exactly the same. In Javascript, however, both reference values are different, because their references are. While comparing two references in Javascript is common, it is still an impure operation. Only use it with caution and make it as explicit as possible.

### Handling reassignments in a functional way

If we cannot reassign a variable with a new value, we need to create a new scope with the same name bound to this value. Functions span a new scope and their argument names are bound to the values the function was called with. Function application is all it takes indeed. Every time you need a reassignment just call a function with the new value as its argument. If you know the number of reassignments upfront, you can manually create nested function calls. Here is a contrived example, which nevertheless illustrates the underlying principle:

```javascript
const app = f => x => f(x);
const sqr = x => x * x;

const main = init =>
  app(([x, xs]) =>
    app(([x, xs]) =>
      app(([x, xs]) => xs)
        ([sqr(x), [...xs, sqr(x)]]))
          ([sqr(x), [...xs, sqr(x)]]))
            ([sqr(init), [init, sqr(init)]]);

main(2); // [2, 4, 16, 256]
```
[run code](https://repl.it/@scriptum/FullFruitfulMacro)

In the given example none of the nested functions has access to name bindings of their parent scopes due to name shadowing. If a nested functions needs access to a previous name binding, you can easily rename the involved arguments. `app` is just an auxiliary function to avoid immediately invoked function expressions (IIFEs).

In a more dynamic setting the number of reassignments is not known upfront, hence we need to resort to recursion:

```javascript
const arrUnfold = n => f => x =>
  n === 0
    ? []
    : [x].concat(arrUnfold(n - 1) (f) (f(x)));

const sqr = x => x * x;

const main = arrUnfold(5) (sqr); // A

main(2); // [2, 4, 16, 256, 65536]
```
[run code](https://repl.it/repls/FewEachOptimization)

Line `A` indicates that the number of iterations is dynamic.

You can think of the functional approach as shifting state caused by reassignments to the function call stack. Holding a decisive part of the application's state is actually the very purpose of the call stack in the functional paradigm. This is the logical consequence of doing almost everything with functions.

#### Local bindings

Local bindings are basically an abstraction of immediately invoked function expressions and come in handy in various situations. Instead of creating an IIFE manually we use a combinator for convenience:

```javascript
const _let = f => f();

_let((x = 2 * 2, y = x * 2, z = y * 2) =>
  [x, y, z]); // [4, 8, 16]
```
Using local bindings we can make the example form the last section more efficient, by evaluating the expression `sqr(init)` only once (line `A`):

```javascript
const _let = f => f();
const app = f => x => f(x);
const sqr = x => x * x;

const main = init =>
  _let((init_ = sqr(init)) =>
    app(([x, xs]) =>
      app(([x, xs]) =>
        app(([x, xs]) => xs)
          ([sqr(x), [...xs, sqr(x)]]))
            ([sqr(x), [...xs, sqr(x)]]))
              ([init_, [init, init_]])); // A

main(2); // [2, 4, 16, 256]
```
[run code](https://repl.it/repls/SereneShinyListener)

#### Custom call stacks

We have learned that functional programming holds a decisive part of the application state in the function call stack. However, there are two scenarios where we cannot rely on the call stack anymore:

* tail recursive algorithms
* asynchronous computations

Tail recursion leads to elimination of the function call stack. Elimination is the very goal of this optimization, which we will examine in a later chapter of this course. When the call stack vanishes we need to provide an alternative structure to store the state:

```javascript
const sum = xs => {
  const go = (acc, i) => // A
    i === xs.length
      ? acc
      : go(acc + xs[i], i + 1);

  return go(0, 0);
};

sum([1, 2, 3, 4, 5]); // 15
```
[run code](https://repl.it/repls/ButteryMeanModels)

Tail recursion is often referred to as recursion accumulator-style, because the accumulator in line `A` serves as a proxy for the call stack and temporarily holds the state of the recursive algorithm.

Asynchronous functions cannot make use of the synchronous call stack, because at the time of their invocation all synchronous computations are already completed, that is, there is no call stack anymore. Once again we need an alternative structure to hold the state of the asynchronous computation:

```javascript
const contComp = f => g => x => k =>
  g(x) (y => f(y) (k));

const contSqr = x => k => setTimeout(k, 0, `contSqr(${x})`);
const contInc = x => k => setTimeout(k, 0, `contInc(${x})`);
const log = x => console.log(`log(${x})`);

const main = contComp(contSqr) (contInc) (2); // A

// main isn't fully evaluated yet

main(log);
```
[run code](https://repl.it/repls/SurefootedUnwrittenDecimals)

The computation is encoded in continuation passing style, which usually needs some time to get familiar with. It is important to understand that line `A` evaluates to the nested function call `k => k(contSqr(contInc(2)))`. Such a function call tree requires a call stack to be evaluated. This is where the state of our asynchronous computation is hidden.

#### Threading state through compositions

Stateful functions in FP usually have the shape `x => s => [x, s]`. It can get quite laborious to thread state throughout your function compositions. Fortunately we can abstract from it by leveraging a few specialized combinators:

```javascript
const stateComp = f => g => x => s => {
  const [x_, s_] = g(x) (s);
  return f(x_) (s_);
};

const stateComp3 = f => g => h => x => s => {
  const [x_, s_] = h(x) (s),
    [x__, s__] = g(x_) (s_);

  return f(x__) (s__);
};

const stateLift = f => x => s => [f(x), s];
const stateMod = f => x => s => [x, f(x) (s)];

const id = x => x;
const _let = f => f();

const arrSnoc = x => xs =>
  (xs.push(x), xs);

const sqr = x => x * x;

const main = init =>
  _let(
    (stateSqr = stateComp(stateMod(arrSnoc)) (stateLift(sqr))) =>
      stateComp3(
        stateSqr)
          (stateSqr)
            (stateSqr)
              (init)
                ([init]));

main(2); // [256, [2, 4, 16, 256]]
```
[run code](https://repl.it/repls/DesertedAttractiveBlockchain)

This is a big improvement. If we keep formalizing this pattern and add a couple of lawful combinators, we will wind up with the state monad, which will be covered in a later chapter of this course. You do not need the state monad to create stateful compositions in functional programming, but it facilitates constructing them.

### Handling mutations in a functional way

We still have not talked about mutations. The function call stack cannot assist us with avoiding them. The obvious way in a multi-paradigm language without purely functional data types is to copy reference types before they are passed to functions. This approach is quite inefficient though, especially for large data structures. In a subsequent chapter of this course I will introduce persistent data structures, which essentially enable an extremely efficient copy mechanism.

### Handling time-varying values in a functional way

Besides reassignments and mutations there is another major need for handling application state: Values that vary over time, either discretely or continuously. This is a rather advanced and complex topic and will be discussed in the chapters on streams and functional reactive programming.

### Note on my own account

If you enjoyed this chapter please 🌟 scriptum here on Github or share it on your preferred social media platform. If you found a mistake or inaccuracy or want to propose an improvement please file an issue/feature. Thank you.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-1.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-3.md)
