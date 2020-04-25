**[EDITOR'S NOTE: THIS CHAPTER IS UNDER CONSTRUCTION]**

## Linear Data Flow w/o Method Chaining

There are two ways to obtain method chaining in Javascript, either by relying on the prototype system

```javascript
class List {
  constructor(head, tail) { /* method body */ }
  map(f) { /* method body */ }
}

const tx = new List(1, new List(2, new List(3, null)));

// List {head: 4, tail: List {head: 9, tail: List {head: 16, tail: null}}}
tx.map(x => x + 1)
  .map(x => x * x);
```
[run code](https://repl.it/repls/CheapTurquoiseUnit)

or by utilizing plain old Javascript object factories

```javascript
const List = head => tail => ({
  head,
  tail,
  map: f => { /* function body */ }
});

const tx = List(1) (List(2) (List(3) (null)));

// List {head: 4, tail: List {head: 9, tail: List {head: 16, tail: null}}}
tx.map(x => x + 1)
  .map(x => x * x);
```
[run code](https://repl.it/repls/RegalTriflingFactor)

While the prototype system is rather specific to Javascript and has its very own limitations, object factories are quite inefficient, especially when you have to deal with types that contain larger number of attached functions. In this chapter we will therefore examine a purely functional approach to maintain a linear data flow and flat composition syntax.

### Prefix notation

Functions are written in prefix notation in Javascript, i.e. the name comes first and then the arguments. Prefix notation leads to nested functions calls, which resemble Lisp's s-expressions:

```Javascript
const sub = x => y => x - y;

sub(
  sub(
    sub(
      sub(1) (2)) (3)) (4)) (5); // -13
```
We can avoid nesting by using natve operators instead, which are written in infix notation:

```Javascript
1 - 2 - 3 - 4 - 5; // -13
```
Operators affect the evaluation order through their predefined precedence and associativity. Subtraction for instance has a higher precedence than multiplication

```Javascript
1 + 2 * 3;   // 7 (predefined precedence)
(1 + 2) * 3; // 9 (enforced precedence)
```
and is left-associative

```Javascript
1 - 2 - 3 - 4 - 5;         // -13 (predefined associativity)
(1 - (2 - (3 - (4 - 5)))); // 3 (enforced right associativity)
```
Unfortunately, we cannot define custom infix operators in Javascript. All we can do is define functional counterparts of the built-in operators and use them in prefix position.

### Avoid nesting with functorial applicators

There are two ways to call a sequence of binary functions:

```javascript
f(g(x) (y)) (z); // left-associative ((x ? y) ? z)
f(x) (g(y) (z)); // right-associative (x ? (y ? z))
```
### Avoid nesting with kleisli applicators
