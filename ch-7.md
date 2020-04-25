**[EDITOR'S NOTE: THIS CHAPTER IS UNDER CONSTRUCTION]**

## Linear Data Flow w/o Method Chaining

There are two ways to obtain method chaining, either by relying on the prototype system

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

While the prototype system is rather specific to Javascript and has its very own limitations, object factories are quite inefficient, especially when you have to deal with types that include larger number of attached functions. In this chapter we will therefore examine a purely functional approach to maintain a linear data flow and flat composition syntax.
