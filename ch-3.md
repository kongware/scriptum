## Currying, Composition and Point-Free Style

### Functions in curried form

Currying is a simple approach that can be applied in a rather mechanical way. Instead of defining a single function with several parameters you define a series of nested functions that each expect a single parameter:

```javascript
const add = (x, y) => x + y;
const add_ = x => y => x + y;

add(2, 3); // 5
add(2) (3); // 5
```

A curried function returns another function until all arguments are provided.

### Partial application

Functions in curried form are inherently partially applicable:

```javascript
const add = x => y => x + y;
const inc = add(1);

inc(2); // 3
```

Please note that this has little in common with partial application used in imperative programming:

```javascript
const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);

const sum5 = (v, w, x, y, z) => v + w + x + y + z;
const main = partial(sum5, 1, 2)

main(3, 4, 5); // 15
```
[run code](https://repl.it/repls/SupportiveSizzlingLists)

`partial` is a sensible implementation of this imperative idiom. It allows to defer the evaluation of a multi argument function by calling it only with a subset of its arguments. The missing arguments are provided with the subsequent call. Partial application is a dynamic process whereas currying is static.

### Function composition and piping

Currying is accompanied by lots of additional function calls. So why it is useful? It happens to work well with function composition:

```javascript
const comp = f => g => x => f(g(x));
const pipe = g => f => x => f(g(x));
const main = comp(inc) (sub(2));
const main2 = pipe(inc) (sub(2));

main(3); // 0
main2(3); // -2
```
[run code](https://repl.it/repls/WorldlyElegantAbilities)

With function composition you can build small, specialized functions that each focus on a single task and combine them to more complex ones. Please note that function composition evaluates from right to left. `pipe` just reverses this order.

### Abstraction over arity

Since every curried function expects a single argument without exception there is no meaningful notion of arity anymore. Currying abstracts over arity and thus tremendously simplifies the functional interface. Let us examine a practical application:

```javascript
const comp = f => g => x => f(g(x));
const add = x => y => x + y;
const inc = x => x + 1;
const main = comp(add) (inc); (A)
const main2 = comp(add) (add); (B)

comp(add) (inc) (1) (2); // 4 
comp(add) (add) (1) (2); // "y => x + y2"
```
[run code](https://repl.it/repls/NotableButterySection)

Even though `comp` expects an unary function it can deal with the binary `add` operator. This works as long as the binary function is passed as the first function argument (A). Let us keep composing and see if we can overcome the implicit type error (B):

```javascript
const comp = f => g => x => f(g(x));
const comp2 = comp(comp) (comp);
const add = x => y => x + y;
const main = comp(comp(add)) (add);
const main2 = comp2(add) (add);

main(1) (2) (3); // 6
main2(1) (2) (3); // 6
```
[run code](https://repl.it/repls/JudiciousSadAgent)

Abstraction over arity allows us to combine curried functions in various ways and only the underlying types act limiting. This is a huge win in terms of reusability. Reusing functions is not just a nice theoretical thought anymore, but becomes the daily routine!

### Composable functions

In order to spare a couple of function calls it is a viable alternative to merely curry a function in its last argument, so that it remains composable:

```javascript
const comp = (f, g) => x => f(g(x));
const visualize = s => x => `${s}(${x})`;
const f = visualize("f");
const g = visualize("g");
const h = visualize("h");
const i = visualize("i");
const main = comp(comp(f, g), comp(h, i));

main(2); // f(g(h(i(2))))
```
[run code](https://repl.it/repls/ImperfectGlitteringLivedistro)

### Variadic functions

Variadic functions have a non-deterministic number of arguments:

```javascript
const sum = (...xs) => xs.reduce((acc, x) => acc + x, 0);
sum(1, 2, 3); // 6
sum(1, 2, 3, 4, 5); // 15
```
[run code](https://repl.it/repls/MerryAutomaticServerapplication)

Such functions are not valid in functional programming and you can neither curry nor compose them. Only use them with care.

### The curry/uncurry isomorphism

There are only two functions necessary to transform a curried function into its uncurried counterpart and vice versa:

```javascript
const curry = f => x => y => f(x, y);
const uncurry = f => (x, y) => f(x) (y);

curry((x, y) => x + x) (2) (3); // 5
uncurry(x => y => x + x) (2, 3); // 5
```
[run code](https://repl.it/repls/AntiqueHonoredServicepack)

These combinators witness an isomorphism between functions in curried and uncurried form. As a result you can switch back and forth between both forms. Please note that scriptum prefers curried functions as a default.

### Why parameter order matters

When you define your own functions the argument you want to compose over should be defined as the innermost curried function. Arguments you quite likely want to partially apply should be defined as the outermost ones. If you adhere to these rules both function composition and partial application will work quite naturally:

```javascript
const reduce = f => acc => xs =>
  xs.reduce(uncurry(f), acc);

const uncurry = f => (x, y) => f(x) (y);
const sum = reduce(add) (0); // partial application
const main = comp(sqr) (sum); // function composition

sum([1, 2, 3, 4, 5]); // 15
main([1, 2, 3]); // 36
```
[run code](https://repl.it/repls/CadetblueImprobableDatasets)

There is another issue with parameter order along with non-associative operators:

```javascript
const sub = x => y => x – y;
const sub2 = sub(2);

sub(3) (2); // 1 (as expected)
sub2(3); // -1 (1 expected)
```
[run code](https://repl.it/repls/GiddyWheatCoins)

`sub2(3)` reads like "sub 2 from 3", hence you would expect it to yield `1` instead of `-1`. Either way one use case will yield unnatural results. Fortunately we can fix this issue by applying the well-known `flip` combinator:

```javascript
const flip = f => y => x => f(x) (y);
const sub2 = flip(sub) (2);

sub2(3); // 1 (as expected)
```
[run code](https://repl.it/repls/RemarkableAmpleTag)

An alternative to `flip` is `appr`, which mimics operators in infix position:

```javascript
const appl = (x, f) => y => // left section (unnecessary) 
  f(x) (y);

const infix = (x, f, y) => x => // infix position
  f(x) (y);

const appr = (f, y) => x => // right section
  f(x) (y);

const sub2 = appr(sub, 2);

infix(3, sub, 2); // 1
sub2(3); // 1
```
[run code](https://repl.it/repls/FondNoxiousQuery)

We will learn about prefix and infix notation in a later chapter of this course.

### Point-free style

Curried functions applied to function composition or other higher order combinators often lead to point-free style code. Point-free means that the arguments of a function are only implicitly defined. Here is a simple example:

```javascript
const inc = x => x + 1;

const add2 = x => inc(inc(x)), // explicit argument
  add2_ = comp(inc) (inc); // implicit argument (point-free)
```

Point-free style is rather a side effect than something we deliberately aspire to. The term already implies that we drop or abstract something, namely the arguments.

While abstractions often assist us in avoiding boilerplate they sometimes tend to obfuscate code, because you can only read it if you are familiar with the applied combinators. That means you should only consider common abstractions and not those that arbitrary persons just made up. In functional programming common abstractions are lawful or principled, i.e. abstractions that adhere to mathematical laws or widespread functional idioms.

### Composition in a broader sense

When people encounter a problem that is to complex to be solved at once they recursively decompose that problem into smaller sub-problems until the complexity reaches a workable level. As soon as all sub-problems are separately solved the reverse process must be carried out, i.e. all sub-problems must be recomposed to solve the original overall problem. You can probably already see that composition is not only the essence of functional programming but of how humans solve complex problems in general.

This chapter was mainly about composition of pure functions. In subsequent chapters you will learn how you can compose functions that share a global configuration, write to a common log or share state. You will see how we can compose function that have a notion of failure, are asynchronous or represent the rest of the computation. Composition is not only about functions, it is about how to compose functions in various contexts.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-2.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-4.md)
