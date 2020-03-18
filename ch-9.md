## Trading Stack for Heap with Trampolines

Some multi-paradigm languages like Javascript are lacking optimization techniques to allow different forms of stack safe recursion. This chapter examines the most important optimizations and demonstrates how stack safe recursion can be achieved through the trampoline approach.

### Compiler optimization strategies

If the recursive step of an algorithm is in tail position, compilers can conduct tail call optimization, i.e. they can share a single stack frame throughout the whole recursive computation and eliminate additional frames. This is not only much more efficient but also avoids exhausting the function call stack for larger recursive computations:

```javascript
const foldl = f => acc => ([h, t]) =>
  h === undefined
    ? acc
    : foldl(f) (f(acc) (h)) (t);
//    ^^^^^^^^^^^^^^^^^^^^^^^^^ tail call can share its stack frame with subsequent tail calls
```

Tail call optimization can be further generalized to tail recursion modulo cons (short for constructor). While TCO only kicks in when the recursive step is in tail position TRMC allows the recursive step to be within a value constrcutor, as long as this constrcutor performs an associative operation:

```javascript
const foldr = f => acc => ([h, t]) =>
  h === undefined
    ? acc
    : f(h) (foldr(f) (acc) (t));
//          ^^^^^^^^^^^^^^^^^^ recursive step can share its stack frame with
//                             subsequent steps provided f is associative
```
Please note that in lazily evaluated languages like Haskell TRMC is called guarded recursion and is not an optimization technique but a side effect of lazy evaluation.

### Deferred function call trees

For some recursive functions it is not sufficient to make the algorithm itself stack safe, because the resulting data structure is also stack critical:

```javascript
const compn = fs =>
  fs.reduce((f, g) => comp(f) (g), x => x);

const compn_ = fs => x =>
  fs.reduce((x, f) => f(x), x);

const comp = f => g => x => f(g(x));

const inc = x => x + 1;

const fs = Array(1e5).fill(inc);

const main = compn(fs), // stack safe
  main_ = compn_(fs); // stack-safe
  
main(0); // stack overflow
main_(0); // 100000
```
[run code](https://repl.it/repls/NoxiousVisibleLanserver)

`compn` creates a deferred nested function call tree, which may exhaust the function call stack once the missing argument is provided. In order to make it stack safe we have to deal with both the recursive algorithm and the recursive data structure it creates.

### A trampoline that mimics tail recursion

Trampolines offer a functional interface to write pseudo-recursive algorithms, while under the hood an imperative loop does all the work iteratively. Here is a possible implementation of such a trampoline that mimics tail recursive algorithms:

```javascript
const tailRec = f => (...args) => {
    let step = f(...args);

    while (step.tag !== Base)
      step = f(...step.args);

    return step.x;
};

const Base = x =>
  ({tag: Base, x});

const Step = (...args) =>
  ({tag: Step, args});

const fold = f => acc => xs =>
  tailRec((acc_, i) =>
    i === xs.length
      ? Base(acc_)
      : Step(f(acc_) (xs[i]), i + 1))
          (acc, 0);

const sub = x => y => x - y;

const xs = Array(1e5).fill(1);

fold(sub) (0) (xs); // -100000
```
[run code](https://repl.it/repls/PersonalBumpyPorts)

Another example: A stack safe Fibonacci function using `tailRec`:

```javascript
const fib = n =>
  tailRec((x, y, m) =>
    m > 1
      ? Step(y, x + y, m - 1)
      : Base(x))
          (1, 1, n);
          
fib(10); // 55
```
[run code](https://repl.it/repls/ImmediatePuzzledRegisters)

### A trampoline that mimics tail recursive modulo cons

We do not have to stop at this point. We can extend `tailRec` with an own stack structure to get a TRMC like effect:

```javascript
const rec = f => (...args) => {
  let step = f(...args);
  const stack = [];

  while (step.tag !== Base) {
    stack.push(step.f);
    step = f(...step.step.args);
  }

  let r = step.x;

  for (let i = stack.length - 1; i >= 0; i--) {
    r = stack[i] (r);
    
    if (r && r.tag === Base) {
      r = r.x;
      break;
    }
  }

  return r;
};

const Base = x =>
  ({tag: Base, x});

const Call = (f, step) =>
  ({tag: Call, f, step});

const Step = (...args) =>
  ({tag: Step, args});
```
Now we are able to implement a right associative fold:

```javascript
const foldr = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(f(xs[i]), Step(i + 1))) (0);
      
const xs = Array(1e5).fill(1);

foldr(sub) (0) (xs); // 0 (instead of -100000 for the left associative fold)
```
[run code](https://repl.it/repls/NavyblueLoneConditions)

Can we also express the Fibonacci function in its most naturally recursive form using `rec`? No, because the recursive step is in both arguments of the function:

```javascript
const fibBody = n =>
  n > 1
    ? add(fib(n - 1)) (fib(n - 2))
//        ^^^^^^^^^^   ^^^^^^^^^^ recursive steps in both arguments
    : n;
```
TRMC only works if the value of the first argument is known before the recursive step is performed. In order to make `fib` stack safe we have to manually transform it into a tail recursive accumulator-style form.

Please note that the `rec` trampoline goes beyond TRMC by allowing the value constructor to be non-associative like substraction for instance.

### A trampoline that mimics indirect or mutual recursion

First I demonstrate indirect recursion using the the classic `even`/`odd` example, because its implementation is more natural and thus easer to comprehend:

```javascript
const mutuRec = step => {
    while (step.tag !== Base)
      step = step.f(...step.args);

    return step.x;
};

const Base = x =>
  ({tag: Base, x});

const Mutu = f => (...args) =>
  ({tag: Mutu, f, args});

const even = Mutu(n =>
  n === 0
    ? Base(true)
    : odd(n - 1));

const odd = Mutu(n =>
  n === 0
    ? Base(false)
    : even(n - 1));

mutuRec(even(1e5)); // true
mutuRec(odd(1e5)); // false
```
[run code](https://repl.it/repls/WeeklyScornfulBruteforceprogramming)

As you can see the trampoline API for `mutuRec` leaked into the calling site of the code. Unfortunatelly there is no way to avoid this. However, `even(1e5)` and `odd(1e5)` are lazy evaluated, i.e. we can fully define them and enforce their evaluation later when needed.

In order to make the mutual recursive Fibonacci algorithm stack safe using a suitable trampoline we have to apply a CPS transformation first to bring all recursive steps in tail position. I omit the CPS transformation step because we will examine this technique in a later chapter of this course:

```javascript
const fib = n =>
  fibParent(n, x => Base(x));

const fibChild = Mutu((n, k) =>
  n < 1
    ? k(1)
    : fibParent(n - 1, k));

const fibParent = Mutu((n, k) =>
  n < 1
    ? k(0)
    : fibParent(n - 1, m => fibChild(n - 1, m_ => k(m + m_))));

mutuRec(fib(10)); // 55
```
[run code](https://repl.it/repls/RoughPoorButtons)

### Making deferred nested function call trees stack safe

The trampoline approach is apparently general enough to enable a variety of stack safe recursive algorithms. However, this does not apply to the `compn` function from the beginning of this chapter, which creates a deferred nested function call tree:

```javascript
const compn = fs =>
  tailRec((acc, i) => 
    i === fs.length
      ? Base(acc)
      : Step(comp(acc) (fs[i]), i + 1))
          (id, 0);
          
const inc = x => x + 1;

const id = x => x;

const fs = Array(1e5).fill(inc),
  main = compn(fs);

main(0); // stack overflow
```
[run code](https://repl.it/repls/WillingVivaciousPolyhedron)

Can we prevent the deferred function call tree from exhausting the stack? Unfortunately, we cannot without altering the original tree structure:

```javascript
const Cont = k => ({tag: "Cont", k});

const compk = f => g => x =>
  Cont(k => k(f(g(x))));
//     ^ reifies the continuation

const postRec = cont => {
  do {
    cont = cont.k(id);
  } while (cont && cont.tag === "Cont")

  return cont;
};

const fs = Array(1e5).fill(inc),
  main = compn(fs);

postRec(main(0)); // 100000
```
[run code](https://repl.it/repls/StripedFlashyProcessors)

We need to disconnect all nested layers from each other by reifying the continuation between them. Then we can use the `postRec` trampoline to call this continuation iteratively. Since we do not want to alter the original algerithm the continuation is applied to the identity function. I named the trampoline `postRec` because it takes place after the actual recursive algorithm.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-8.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc)
