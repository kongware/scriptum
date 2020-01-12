## Currying, Composition and Point-Free Style

### Functions in curried form

Currying is a rather simple approach that can be applied in a mechanical way. Instead of defining a single function with several parameters you define a series of nested functions that each expect a single argument:

```Javascript
const add = (x, y) => x + y;
const add_ = x => y => x + y;

add(2, 3); // 5
add(2) (3); // 5
```

A curried function returns another function until all arguments are provided.

### Partial application

Functions in curried form are inherently partially applicable:

```Javascript
const add = x => y => x + y;
const inc = add(1);

inc(2); // 3
```

Please note that this has little in common with partial application used in imperative programming:

```Javascript
const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);

const sum5 = (v, w, x, y, z) => v + w + x + y + z;
const main = partial(sum5, 1, 2)

main(3, 4, 5); // 15
```
[run code](https://repl.it/repls/SupportiveSizzlingLists)

`partial` is a sensible implementation of the this imperative technique. It allows to defer the evaluation of a multi argument function by calling it only with a subset of its arguments. Only with the subsequent call all remaining arguments are provided.

### Function composition and piping

Currying comes at the price of numerous additional function calls. So why it is useful? It happens to work well with function composition:

```Javascript
const comp = f => g => x => f(g(x));
const pipe = g => f => x => f(g(x));
const main = comp(inc) (sub(2));
const main2 = pipe(inc) (sub(2));

main(3); // 0
main2(3); // -2
```
[run code](https://repl.it/repls/WorldlyElegantAbilities)

With function composition you can build small, simple functions that each focus on a single task and combine them in various ways to more complex functions.

Please note that function composition evaluates from right to left. This is a property from math. `pipe` just reverses this order.

### Abstraction over arity

Since every function always expects a single argument there is no meaningful notion of arity anymore. Currying abstracts over arity and thus tremendously simplifies the functional interface. What else can we accomplish with it?

```Javascript
const comp = f => g => x => f(g(x));
const add = x => y => x + y;
const inc = x => x + 1;
const main = comp(add) (inc);
const main2 = comp(add) (add);

comp(add) (inc) (1) (2); // 4 (A)
comp(add) (add) (1) (2); // "y => x + y2" (B)
```
[run code](https://repl.it/repls/NotableButterySection)

Even though `comp` expects an unary function it can deal with the binary `add` combinator. This works as long as the binary function is passed as the first function argument (A). Let us keep composing and see if we can overcome the type error (B):

```Javascript
const comp = f => g => x => f(g(x));
const comp2 = comp(comp) (comp);
const add = x => y => x + y;
const main = comp(comp(add)) (add);
const main2 = comp2(add) (add);

main(1) (2) (3); // 6
main2(1) (2) (3); // 6
```
[run code](https://repl.it/repls/JudiciousSadAgent)

Abstraction over arity allows us to combine functions as if they were bricks. The underlying types and our creativity are the only limits!

### Composable functions

In order to spare a couple of function calls it is a viable alternative to merely curry a function in its last argument, so that it stays composable:

```Javascript
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

```Javascript
const sum = (...xs) => xs.reduce((acc, x) => acc + x, 0);
sum(1, 2, 3); // 6
sum(1, 2, 3, 4, 5); // 15
```
[run code](https://repl.it/repls/MerryAutomaticServerapplication)

Such functions are not valid in functional programming and you can neither curry nor compose them. Only use them with care.

### The curry/uncurry isomorphism

There are only two functions necessary to transform a curried function into its uncurried counterpart and vice versa:

```Javascript
const curry = f => x => y => f(x, y);
const uncurry = f => (x, y) => f(x) (y);

curry((x, y) => x + x) (2) (3); // 5
uncurry(x => y => x + x) (2, 3); // 5
```
[run code](https://repl.it/repls/AntiqueHonoredServicepack)

These combinators witness an isomorphism between functions in curried and uncurried form. As a result you you can switch back and forth between both forms. Please note that scriptum prefers curried functions.

### Why parameter order matters

When you create your own functions the argument you want to compose over should be defined as the innermost curried function. Arguments you want to partially apply your function with should be defined as the outermost curried function. If you adhere to these rules both function composition and partial application works quite naturally:

```Javascript
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

```Javascript
const sub = x => y => x – y;
const sub2 = sub(2);

sub(3) (2); // 1 (as expected)
sub2(3); // -1 (1 expected)
```
[run code](https://repl.it/repls/GiddyWheatCoins)

`sub2(3)` reads like “sub 2 from 3”, hence you would expect it to yield 1 instead of -1. Either way one use case will yield unnatural results. However, we can fix this issue by applying the well-known `flip` combinator:

```Javascript
const flip = f => y => x => f(x) (y);
const sub2 = flip(sub) (2);

sub2(3); // 1 (as expected)
```
[run code](https://repl.it/repls/RemarkableAmpleTag)

### Point-free style

Curried function applied to function composition or other higher order combinators often leads to point-free style code. Point-free means that the arguments of a function are only implicitly defined. Here is a simple example:

```Javascript
const inc = x => x + 1;

const add2 = x => inc(inc(x)), // explicit argument
  add2_ = comp(inc) (inc); // implicit argument (point-free)
```

Point-free style is rather a side effect than something we deliberately aspire to. The term already implies that we drop or abstract something, namely the arguments.

While abstractions assist us in avoiding boilerplate they tend to obfuscate code, because you can only read it if you are familiar with the applied combinators. That means you should only consider widely used abstractions and not those that some arbitrary person just made up. In functional programming common abstractions are equivalent with principled ones, i.e. abstractions that adhere to mathematical laws.

### Composition in the general sense

When people encounter a problem that is to complex to be solved at once they recursively decompose that problem into smaller sub-problems until the complexity reaches a workable level. As soon as all sub-problems are separately solved the reverse process must be conducted, i.e. all parts must be recomposed to solve the original overall problem. You can probably see now that composition is not only the essence of functional programming but of how humans solve complex problems in general. It is probably the most successful strategy mankind has ever applied.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-2.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc)
