## Linear Data Flow and Flat Composition Syntax

**[EDITOR'S NOTE: THIS CHAPTER IS UNDER CONSTRUCTION]**

There are two ways to obtain method chaining in Javascript, either by relying on the [prototype system](https://repl.it/repls/CheapTurquoiseUnit) or by utilizing plain old Javascript [object factories](https://repl.it/repls/RegalTriflingFactor).

While the former is specific to Javascript and is rather limited, object factories are quite inefficient, especially when you have to deal with types that are assoicated with a larger number of functions. In this chapter we will therefore examine a purely functional approach to maintain a linear data flow and flat composition syntax.

### Prefix notation and S-expressions

Functions are written in prefix notation in Javascript, i.e. the name comes first and is followed by the argument list. Prefix notation leads to nested functions calls, which resemble Lisp's S-expressions:

```Javascript
const sub = x => y => x - y;

sub(
  sub(
    sub(
      sub(1) (2)) (3)) (4)) (5); // -13
```
We can avoid nested syntax by using native operators instead, which are written in infix position:

```Javascript
1 - 2 - 3 - 4 - 5; // -13
```
The evaluation order of expressions with infix operators is determined by their precedence and associativity. Subtraction, for instance, has a higher precedence than multiplication

```Javascript
1 + 2 * 3;   // 7 (predefined precedence)
(1 + 2) * 3; // 9 (enforced precedence)
```
and is left-associative

```Javascript
1 - 2 - 3 - 4 - 5;         // -13 (left-associative by default)
(1 - (2 - (3 - (4 - 5)))); // 3 (right-associative by parentheses)
```
Unfortunately, we cannot define custom infix operators in Javascript. All we have left is to mimic operators with custom functions and use them in prefix position. Are we stuck with nested S-expressions as soon as we rely on functions?

### Abstract from nesting with function composition

Since function application is not associative, there are two ways to compose binary functions:

```javascript
f(g(x) (y)) (z); // left-associative ((x ? y) ? z)
f(x) (g(y) (z)); // right-associative (x ? (y ? z))
```
We can encode both patterns with function composition, partial application and arity aware combinators:

```javascript
const comp4 = f => g => h => i => x =>
  f(g(h(i(x))));

const pipe4 = i => h => g => f => x =>
  f(g(h(i(x))));

const sub = x => y => x - y;
const sub_ = y => x => x - y;

comp4(sub(1)) (sub(2)) (sub(3)) (sub(4)) (5); // (1 - (2 - (3 - (4 - 5))))
comp4(sub_(5)) (sub_(4)) (sub_(3)) (sub_(2)) (1); // 1 - 2 - 3 - 4 - 5

pipe4(sub_(2)) (sub_(3)) (sub_(4)) (sub_(5)) (1); // 1 - 2 - 3 - 4 - 5
```
[run code](https://repl.it/repls/CapitalSociableUser)

When we compose binary functions we need to partially apply them and pass the missing argument to the resulting composition. The missing argument is the rightmost one of the computation, consequently function composition is inherently right-associative. It computes the rightmost operands and applies the result to its predecessor.

When we want to retrieve a left-associative computation we need to reverse the operand order and apply an operator with flipped arguments. If you want to get away with the normal operand order you can utilize the reverse function composition operator `pipe` alternatively. Keep in mind though that with reverse composition you need to pass the leftmost operand, because left-accosiative computation starts from the left and makes its way to the right.

Please note that I denote functions with flipped arguments with a trailing underscore in their name to spare the noise of the `flip` combinator.

### Why relying on arity-aware combinators in the first place?

We could easily build a variadic compostion function that fits all cases:

```javascript
const comp = f => g => x => f(g(x));
const id = x => x;

const sub = x => y => x - y;
const sub_ = y => x => x - y;
const repeat = s => n => s.repeat(n);

const compn = fs =>
  fs.reduce((f, g) => comp(f) (g), id);

const fs = [repeat("x"), sub(1), sub(2), sub(3), sub(4)]; // "xxx"

compn(fs) (5);
```
[run code](https://repl.it/repls/HurtfulSandybrownWorkspace)

But what type would `fs` have? If we typed it as an array `A[]`, all functions would have to share the same type, `(_: number) => number` for instance. If we typed it as a tuple `[A, B]` we would have to define all possible tuple sizes. Knowing this simple arity aware composition functions seem to be the lesser of two evils.

### Prospect of applicative and monadic compositions

TODO

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-6.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-8.md)
