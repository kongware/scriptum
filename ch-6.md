## The Vast Field of Recursion + Corecursion

Recursion is a vast field where you can easily get lost in the details. It is a primitive of the functional paradigm. As a decent functional programmer you try to abstract from it to reduce the mental load. However, sometimes there is no way around recursion hence it is good to make yourself acquianted with the concept. Corecursion is a type of operation that is dual to recursion and you should get an eye for it when to use which. 

### The structure of recursion

Recursion can be defined in terms of a base case and a recursive step. The base case is the simplest, smallest instance of the problem, that cannot be decomposed any further. The recursive step decomposes a larger instance of the problem into one or more simpler or smaller instances that can be solved by recursive calls, and then recombines the results of those subproblems to produce the solution to the original problem. A recursive implementation may have more than one base case, or more than one recursive step.

### Body and tail recursion

You can distinguish recursion by the position of the recursive step in the code. If it is the last operation within the function body, it is in tail otherwise in non-tail position. Both forms are hence referred to as tail and non-tail (or body) recursion. Body recursion keeps its state in the implicit function call stack whereas tail recursion keeps it in an explicit accumulator, which substitutes the call stack.

As a consequence a body recursive algorithm builds its result from the way back from the base case whereas a tail recursive one builds its result on the way forward from the starting case. The following examples illustrate these meachnisms:

```Javascript
const log = x => (console.log(x), x);

// body recursive

const fibBody = n =>
  n > 1
    ? fibBody(n - 1) + fibBody(n - 2) // recursive step + implicit function call stack
    : log(n); // base case

// tail recursive

const fibTail = n => {
  const go = (x, acc, m) =>
    m > 1
      ? go(acc, acc + x, m - 1) // recursive step + explicit accumulator
      : log(acc); // base case

  return go(0, 1, n);
};

fibBody(10); // logs 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0
fibTail(10); // logs 55
```
We are logging at the base case. Since the body recursive Fibonacci algorithm starts its work from here on the way back to the initial case, the smallest, simplest instances of the problem are logged. The tail recursive algorithm on the other hand starts its work from the initial case, consequently it has already finished its work when the base case is reached. Let us prove this assertion by logging at the initial case:

```Javascript
const fibTail = n => {
  const go = (x, acc, m) =>
    m > 1
      ? (console.log(acc), go(acc, acc + x, m - 1))
      : log(acc);

  return go(0, 1, n);
};

fibTail(10); // 1, 1, 2, 3, 5, 8, 13, 21, 34
```
Since body recursion depends on the function call stack the problem size that can be handled is limited according to the available stack size. In constrast to this tail recursion can share a single stack frame throughout the whole computation, provided that the environment conducts tail call elimination. You can think of tail recursion as the functional equivalent of bare imperative loops, whereas body recursion requires a loop with a custom stack data structure.

Calculating the Fibonacci sequence is a problem structure that lends itself naturally to a recursive definition. Let us have a closer look at data that is inherently recursive in structure, namely the single linked list:

```Javascript
// body recursive

const foldr = f => acc => ([h, t]) =>
  h === undefined
    ? acc
    : f(h) (foldr(f) (acc) (t));

// tail recursive

const foldl = f => acc => ([h, t]) =>
  h === undefined
    ? acc
    : foldl(f) (f(acc) (h)) (t);

const sub = x => y => x - y;

const xs = [1, [2, [3, []]]];

foldr(sub) (xs); // (1 - (2 - (3 - 0))) = 2
foldl(sub) (xs); // (((0 - 1) - 2) - 3) = -6
```
As it turns out body recursion along with lists naturally forms a right associative fold whereas tail recursion naturally forms a left associative one. That means both versions vary depending on the problem. A proper functional language should allow for that and supply both recursive approaches in a stack safe manner.

### Natural or structural recursion

If every recursive step shrinks the problem, and the base case lies at the bottom, then the recursion is guaranteed to be finite. With the previous approaches it is up to the developer to ensure that and thus to avoid infinite recursion. With natural recursion (a.k.a. structural or primitive recursion) we can free us from this obligation.

In the previous section I stated that the Fibonacci sequence is a naturally recursive problem. It indeed is but we can still define the underlying natural numbers as a recursive type (pseudo code):

`Nat = Zero | Succ(Nat)`

This reads as follows: A natural number `Nat` can either be defined as `Zero` or as the successor of another natural number. If we replace `Zero` with `0` and `Succ(Nat)` with `1+` the underlying idea is pretty obvious. Using this type definition the natural number `3` is encoded as `Succ(Succ(Succ(Zero)))`.

This is the first time I talk about types, so let us clarify the jargon. `Nat` itself is a type whereas `Zero` and `Succ` are value constructors. While `Zero` is a nullary value constructor, because it does not take any type arguments, `Succ` is an unary constructor expecting a single type argument. A type can comprise one or several value constructors.

Value constructors represent the introduction rules of a type. Consequently we can define the elimination rule by inversing this procedure:

```Javascript
const foldNat = zero => succ => n => {
  const go = m =>
    m <= 0
      ? zero
      : succ(go(m - 1));

  return go(n)
};

const comp = f => g => x => f(g(x));
const fst = ([x, y]) => x;

const fib = comp(fst)
  (foldNat([0, 1])
    (([x, y]) => [y, x + y]));

fib(10); // 55
```
`foldNat` is the elimination rule of the natural number type. It inverses the introduction procedure by reducing the current state by one until the base case `0` is reached.  Provided you pass a total successor function to `foldNat`, the recursion is guaranteed to terminate. By the way, it is not a coincidence that each value constructor of the natural number type reappears as a formal parameter of the fold. An elimination rule must always comprise all value constrcutors to be valid.

### Tail call and CPS transformation

### Indirect or mutual recursion

### Anonymous recursion

### Compiler/Interpreter optimization strategies

### From trampolines to fully-fledged evaluators

### Corecursion

### Co-/Recursion as a last resort
