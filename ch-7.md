## Linear Data Flow with Infix Applicators

In this chapter we will examine an alternative manner to maintain a linear data flow and flat syntax while composing and combining functions extensively.

### From prefix functions to nesting

Nesting occurs as soon as you compose several functions where the result of a function is fed to another:

```Javascript
const sub = x => y => x - y;
sub(sub(sub(1) (2)) (3)) (4); // -8
```
The reason for the nesting lies in the fixity of functions. They are written in prefix notation. Usually we avoid this behavior with operators, which appear in infix position:

```Javascript
1 - 2 - 3 - 4; // -8
```
In order to control the evaluation order operators have a specific precedence and are either left or right associative. Subtraction for instance has a higher precedence than multiplication

```Javascript
1 + 2 * 3; // 7 (implicit precedence)
1 + (2 * 3); // 7 (explicit precedence)
(1 + 2) * 3; // 9 (explicit precedence)
```
and is left associative

```Javascript
1 - 2 - 3 - 4; // -8 (implicitly left associative)
(((1 - 2) - 3) - 4); // -8 (explicit left associative)
(1 - (2 - (3 - 4))); // -2 (explicit right associative)
```
Unfortunately, we cannot define custom infix operators in Javascript. All we can do is define new functions that mimic such operators.

### Avoid nesting with infix applicators

When we want to mimic operators with functions we need to find a way to enable infix notation with a terse syntax. We can utilize Javascript’s multi-argument functions in a creative way to visualize a linear data flow:

```Javascript
const infix3 = (w, f, x, g, y, h, z) =>
  h(g(f(w) (x)) (y)) (z);

const sub = x => y => x - y;

infix3(1,
  sub, 2,
  sub, 3,
  sub, 4); // -8
  
// or alternatively

infix3(1, sub, 2,
          sub, 3,
          sub, 4); // -8
```
[run code](https://repl.it/repls/AmbitiousSaneGuiltware)

Functions themselves are left associative, but we can trivially define a right associative infix applicator:

```Javascript
const infixr3 = (w, f, x, g, y, h, z) =>
  f(w) (g(x) (h(y) (z)));

infixr3(1,
  sub, 2,
  sub, 3,
  sub, 4); // -2
```
[run code](https://repl.it/repls/PunctualUncomfortableModulus)

A new approach is only worth exploring if it is sufficiently generic, i.e. applicable to a wide range of tasks. Let us examine if `infix3` can be applied to higher order functions:

```Javascript
const infix3 = (w, f, x, g, y, h, z) =>
  h(g(f(w) (x)) (y)) (z);

const comp = f => g => x => f(g(x));
const pipe = g => f => x => f(g(x));

const inc = x => x + 1;
const sqr = x => x * x;

infix3(inc,
  comp, inc,
  comp, inc,
  comp, sqr) (3); // 12

infix3(inc,
  pipe, inc,
  pipe, inc,
  pipe, sqr) (3); // 36
```
[run code](https://repl.it/repls/FuchsiaDangerousAnimatronics)

What about higher order functions with function arguments expecting more than one argument? Let us express applicative and monadic computations:

```Javascript
const infix3 = (w, f, x, g, y, h, z) =>
  h(g(f(w) (x)) (y)) (z);

const ap = f => g => x => f(x) (g(x));
const chain = f => g => x => f(g(x)) (x);

const mainA = infix3(w => x => y => z => [w, x, y, z],
  ap, inc,
  ap, inc,
  ap, sqr);

const mainM = infix3(w => x =>
  x === 1
    ? _ => _ => [] // A
    : y => z => [w, x, y, z],
  chain, inc,
  chain, inc,
  chain, sqr);

mainA(3); // [3, 4, 4, 9]

mainM(3); // [11, 10, 9, 3]
mainM(0); // []
```
[run code](https://repl.it/repls/VivaciousCommonCone)

The applicative example works as expected. However, the monadic one raises two issues. First it yields `[11, 10, 9, 3]` instead of the expected `[3, 4, 4, 9]`. The result seems to represent the intermediate values of the composition in reverse order. Second, we cannot short circuit the computation (line `A`), but have to use the entire computational structure. As you may remember the ability to choose the next computation depending on a previous values is the special property of monads. This seems to be the first limitation of the applicator approach. 

### A monadic infix applicator

Monads are a fundamental idiom of the functional paradigm. Without supporting them the applicator approach is worthless. Monadic computations consist of explicit lambdas and closures and have the ability to short circuit the computation at every level:

```Javascript
const chain = f => g => x => f(g(x)) (x);

const main = chain(x =>
  x === 1
    ? _ => [] // short circuiting
    : chain(y =>
        chain(z =>
          w => [w, x, y, z]) (sqr)) (inc)) (inc);

main(3); // [3, 4, 4, 9]
main(0); // []
```
[run code](https://repl.it/repls/ZealousGrayMolecule)

 Let us see if we can implement a corresponding applicator:

```Javascript
const infixM3 = (λ, f, x, g, y, h, z) =>
  f(x_ =>
    λ(x_, α => g(y_ =>
      α(y_, β => h(z_ =>
        β(z_, id)) (z))) (y))) (x);

const chain = f => g => x => f(g(x)) (x);
const id = x => x;

const main = infixM3((x, k) =>
  x === 1
    ? _ => [] // short circuiting
    : k((y, k) => k((z, k) => k(w => [w,x,y,z]))),
  chain, inc,
  chain, inc,
  chain, sqr);

main(3); // [3, 4, 4, 9]
main(0); // []
```
[run code](https://repl.it/repls/FirstAlarmingProblems)

Finally it works as expected, but the implementation comes at a price. We have to rely on local continuations, which add a certain noise to the nested lambda functions and we are still stuck in nesting. However, the structure of the nested lambdas is quite mechanical: Each lambda layer receives a pair of arguments consisting of the bound value and the continuation. It can then either apply the continuation or discard it, which shorts circuits the whole computation. I still believe we have made progress in terms of readability:

```Javascript
// explicit chaining

chain(x =>
  x === 1
    ? _ => []
    : chain(y =>
        chain(z =>
          w => [w, x, y, z]) (sqr)) (inc)) (inc);

// abstracted chaining

infixM3((x, k) =>
  x === 1
    ? _ => []
    : k((y, k) => k((z, k) => k(w => [w,x,y,z]))),
  chain, inc,
  chain, inc,
  chain, sqr);
```

It turns out that our applicator approach is quite expressive. We can apply it to various operator like functions with a linear syntax and they still behave like expected. We successfully abstracted from the nested function call trees. Since infix accumulators are just multi-argument functions we can also compose them, provided they are curried in their last argument.

Unfortunately, this approach requires arity aware combinators. There is no way to bypass it. Along with the right associate versions we end up with a bunch of slightly different combinators. Abstracting from nested function call trees is still worth the effort.

### Why not just method chaining?

There are three alternatives to achieve a linear data flow in Javascript.

#### Depending on the prototype system

This course is about functional programming applied to all sorts of multi-paradigm languages, hence I will not depend on constructs as specific to Javascript as the prototype system.

#### Object factory

Another approach would be to create plain old Javascript objects with all necessary methods for the desired operations through factories. While this ad-hoc approach seems nice for small projects it does not scale well in my opinion. It is rather inefficient to recreate dozens of methods for each and every created object.

#### Identity based applicator

Here is a more efficient approach that utilizes an augmented `Identity` functor to create a linear data flow through mehtod chaining:

```Javascript
const App = x =>
  ({runApp: x, map: f => App(f(x)), app: y => App(x(y))});

const ap = f => g => x => f(x) (g(x));

App(w => x => y => z => [w, x, y, z])
  .map(ap)
  .app(inc)
  .map(ap)
  .app(inc)
  .map(ap)
  .app(sqr).runApp(3); // [3, 4, 4, 9]
```
[run code](https://repl.it/repls/HandyOutlyingBlogware)

I do not see the advantage of the `Identity` functor method chaining compared to purely functional applicators. Besides this solution lacks the short circuiting mechanism monadic operations require.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-6.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-8.md)
