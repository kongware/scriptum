## The Vast Field of Co-/Recursion

Recursion and Corecursion are a vast field where you can easily get lost in the details. They are primitives of the functional paradigm. As a decent functional programmer you try to avoid them by relying on abstractions, because that is what we strive for: Abstractions and Generalizations.

### The structure of recursion

Recursion can be defined in terms of a base case and a recursive step. The base case is the simplest, smallest instance of the problem, that cannot be decomposed any further. The recursive step decomposes a larger instance of the problem into one or more simpler or smaller instances that can be solved by recursive calls, and then recombines the results of those subproblems to produce the solution to the original problem. A recursive implementation may have more than one base case, or more than one recursive step.

### Body and tail recursion

You can distinguish recursion by the position of the recursive step in the code. If it is the last operation within the function body, it is in tail otherwise in non-tail position. Both forms are hence referred to as tail and non-tail (or body) recursion. Body recursion depends on the implicit function call stack whereas tail recursion maintains an explicit accumulator as substitute.

As a consequence a body recursive algorithm builds its result from the way back from the base case whereas a tail recursive one builds its result on the way forward from the starting case. The following examples illustrate these meachnisms:

```Javascript
// body recursive

const fibBody = n =>
  n > 1
    ? fib(n - 1) + fib(n - 2) // recursive step
    : n; // base case

// tail recursive

const fibTail = n => {
  const go = (x, y, m) =>
    m > 1
      ? go(y, x + y, m - 1) // recursive step
      : y; // base case

  return go(0, 1, n);
};

fibBody(10); // 55
fibTail(10); // 55
```


### Natural or structural recursion

### Tail call and CPS transformation

### Indirect or mutual recursion

### Anonymous recursion

### Compiler/Interpreter optimization strategies

### From trampolines to fully-fledged evaluators

### Corecursion

### Co-/Recursion as a last resort
