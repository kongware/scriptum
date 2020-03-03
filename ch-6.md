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

### Natural or structural recursion

### Tail call and CPS transformation

### Indirect or mutual recursion

### Anonymous recursion

### Compiler/Interpreter optimization strategies

### From trampolines to fully-fledged evaluators

### Corecursion

### Co-/Recursion as a last resort
