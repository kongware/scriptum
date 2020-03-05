## From Natural over Tail to Corecursion

Recursion and corecursion are a primitives of the functional paradigm and you can easily get lost in the details. As a decent functional programmer you try to abstract from them to reduce the mental load. However, sometimes there is no way around them. Hence it is good idea to make yourself acquainted with the concepts and to get an eye for when to use which technique.

### The structure of recursion

Recursion can be defined in terms of a base case and a recursive step. The base case is the simplest, smallest instance of the problem, that cannot be decomposed any further. The recursive step decomposes a larger instance of the problem into one or more simpler or smaller instances that can be solved by recursive calls, and then recombines the results of those subproblems to produce the solution to the original problem. A recursive implementation may have more than one base case, or more than one recursive step.

### Body and tail recursion

You can distinguish recursion by the position of the recursive step in the code. If it is the last operation within the function body, it is in tail otherwise in non-tail position. Both forms are hence referred to as tail and non-tail recursion. In order to avoid the negation I am going to use the term body recursion for the latter. Body recursion keeps its state in the implicit function call stack whereas tail recursion keeps it in an explicit accumulator, which serves as a substitute of the call stack.

As a consequence a body recursive algorithm builds its result from the way back from the base case whereas a tail recursive one builds its result on the way forward from the initial case. The following examples illustrate this distinction:

```javascript
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
Here we are logging at the base case. Since the body recursive Fibonacci algorithm starts its work from this very base case on the way back to the initial case, the smallest, simplest instances (`0` and `1`) of the problem are logged. The tail recursive algorithm on the other hand starts its work from the initial case. Consequently it has already finished its work when the base case is reached and only the final result is logged. Let us prove this assertion by logging at the initial case:

```javascript
const fibTail = n => {
  const go = (x, acc, m) =>
    m > 1
      ? (console.log(acc), go(acc, acc + x, m - 1))
      : log(acc);

  return go(0, 1, n);
};

fibTail(10); // logs 1, 1, 2, 3, 5, 8, 13, 21, 34
```
Since body recursion depends on the function call stack the problem size that can be handled is limited to the available stack size. In constrast to this tail recursion can share a single stack frame<sup>1</sup> throughout the whole computation, because it relies on an accumulator passed around as an argument. You can think of tail recursion as the functional equivalent of bare imperative loops, whereas body recursion requires a loop with a custom stack data structure.

Calculating the Fibonacci sequence is a problem structure that lends itself naturally to a recursive definition. Let us have a closer look at data that is inherently recursive in structure, namely the single linked list:

```javascript
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
As it turns out body recursion along with lists naturally forms a right associative fold whereas tail recursion naturally forms a left associative one. That means both versions may vary depending on the given problem. A proper functional language should allow for that and supply both recursive approaches in a stack safe manner.

<sup>1</sup>provided that the environment conducts tail call elimination

### Natural or structural recursion

If every recursive step shrinks the problem, and the base case lies at the bottom, then the recursion is guaranteed to be finite. With the previous approaches it is up to the developer to ensure that and thus to avoid infinite recursion. With natural recursion (a.k.a. structural or primitive recursion) we can free us from this obligation. It forms recursive algorithms that consume data in a way which stops.

In the previous section I stated that the Fibonacci sequence is a naturally recursive problem. It indeed is but we can still define the underlying natural numbers as a recursive type (pseudo code):

`Nat = Zero | Succ(Nat)`

This reads as follows: A natural number `Nat` can either be defined as `Zero` or as the successor of another natural number. If we replace `Zero` with `0` and `Succ(Nat)` with `1+` the underlying idea is pretty obvious. Using this type definition the natural number `3` is encoded as `Succ(Succ(Succ(Zero)))`.

This is the first time I talk about types, so let us clarify the jargon. `Nat` itself is a type whereas `Zero` and `Succ` are value constructors. While `Zero` is a nullary value constructor, because it does not take any type arguments, `Succ` is an unary constructor expecting a single type argument. A type can comprise one or several value constructors.

Value constructors represent the introduction rules of a type. Consequently we can define the elimination rule by inversing this procedure:

```javascript
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
`foldNat` is the elimination rule of the natural number type. It inverses the introduction procedure by reducing the current state by one until the base case `0` is reached.  Provided you pass a total successor function to `foldNat`, the recursion is guaranteed to terminate. By the way, it is not a coincidence that each value constructor of the natural number type reappears as a formal parameter of the fold. An elimination rule must always comprise all value constructors to be complete and valid.

Here is another example for the single linked list type (pseudo code again):

`List a = NIL | Cons(a, List a)`

Before we move on to the implementation let us have a look on the given type definition, because it differs from the previous one in two aspects. First `List a` is not just a type but a type constructor, because it requires a type argument to become a complete type. It is a composite type so to speak. Secondly `Cons` takes two type arguments and is thus a binary value constructor.

```javascript
const foldList = nil => cons => xs => {
  const go = ([head, tail]) =>
    head === undefined
      ? nil
      : cons(head) (go(tail));

  return go(xs);
}

const Nil = []
const Cons = x => xs => ([x, xs]);

const sub = x => y => x - y;

const xs = Cons(1) (Cons(2) (Cons(3) (Nil)));

foldList(0) (sub) (xs); // 2
```
Defining the elimination rule for the list type is based on the same rules as for natural numbers. It is a rather mechanical process. Almost every recursive problem or data structure can be expressed with a naturally recursive algorithm.

### Tail call and CPS transformation

Tail recursive algorithms are more efficient than body recursive ones and are sufficient for many recursive tasks. But what are the rules to transform a body recursive function into a tail recursive one and which elements are involved? Let us go through an example step by step:

```javascript
const factBody = n =>
  n === 0
    ? 1 // base case + neutral element
    : factBody(n - 1) * n; // recursive step + implicit function call stack
```
First we must identify the portion of this body recursive code that is evaluated after the recursive step: `[...] * n`. Please note that I denoted the hole in the expression with `[...]`. Next we take this expression and use it as the second argument of the recursive function. The hole is replaced with another argument, which accumulates the result: `factBody(n - 1, acc * n)`.

In order to hide the internal API we use an inner auxiliary function `go` so that `factBody` still only requires a number as an argument: `go(n - 1, acc * n)`. Usually I only use curried functions but since `go` is not visible in the pasrent scope and recursion often has a heavy workload a multi argument function is used for performance reasons.

As a last step we replace the neutral element of the base case with the accumulator `acc`, because when the base case is reached, a tail recursive algorithm has already finished its work and can just return the accumulated result:

```javascript
const factTail = n => {
  const go = (acc, m) =>
    m === 0
      ? acc // base case
      : go(m * acc, m - 1); // recursive step + explicit accumulator

    return go(1, n); // neutral element
};

factTail(5); // 120
```
As you can see the implicit function call stack is substituted by an explicit accumulator. The neutral element is passed as an argument of the initial call. It is thus no longer used within the last iteration of the recursive algorithm but in the first one.

We could just stop at this point since we have successfully completed the tail call transformation. However, there is an even more powerful encoding which we can transform into, so let us keep transforming. What happens if we defer the multiplication `m * acc` by putting it into a lambda, which itself is passed as the last argument of `go`: `go(m - 1) (acc => m * acc)`.

Now we have a bunch of disconnected function arguments, one for each iteration. In order to connect them with each other we have to apply each result of the multiplication to the previous function argument: `go(m - 1) (acc => k(m * acc))`. Here is the big picture:

```javascript
const factCont = n => {
  const go = m => k =>
    m === 0
      ? k(1) // base case + neutral element
      : go(m - 1) (acc => k(m * acc)); // recursive step + explicit accumulator

    return go(n) (x => x); 
};

factCont(5); // 120
```
Do you see the pattern? Each function invocation ends with a continuation, i.e. a function argument, which is finally called within the function body. This pattern is called continuation passing style and will be covered in deatil in a later chapter.

We have succeeded in writing three different recursive algorithms for the factorial numbers. Let us examine if the CPS version creates a computational structure that is body or tail recursive. A viable approach to do so is to visualize the nested expression each algorithm builds:

```javascript
const factBody = n =>
  n === 0
    ? 1 // base case + neutral element
    : `(${factBody(n - 1)} * ${n})`; // recursive step

const factTail = n => {
  const go = (acc, m) =>
    m === 0
      ? acc // base case
      : go((`(${m} * ${acc})`), m - 1); // recursive case

    return go(1, n); // neutral element
};

const factCont = n => {
  const go = m => k =>
    m === 0
      ? k(1) // base case + neutral element
      : go(m - 1) (acc => k(`(${acc} * ${m})`)); // recursive case

    return go(n) (x => x); 
};

factBody(5); // (((((1 * 1) * 2) * 3) * 4) * 5)
factTail(5); // (1 * (2 * (3 * (4 * (5 * 1)))))
factCont(5); // (((((1 * 1) * 2) * 3) * 4) * 5)
```
The CPS version pursues the same computation strategy as the body recursive approach. Since with CPS all continuation invocations are in tail position we can have both, efficient tail calls and a body recursive computation strategy. This is a big win!

### Indirect or mutual recursion

If function `foo` calls function `bar`, which calls function `bat`, which in turn calls `foo` again then all three involved functions are recursive, indirectly recursive to be precise. The following example is not very efficient and a bit contrived but serves the purpose to illustrate the mechanism:

```javascript
const fib1 = n => fib(n - 1);
const fib2 = n => fib(n - 2);

const fib = n =>
  n > 1
    ? fib1(n) + fib2(n)
    : n;

fib(10); // 55
```

Indirect recursion allows very elegant algorithms when working with tree data structures. We will look into such algorithms in the corresponding chapter of this course.

### Anonymous recursion

The `fix` combinator allows anonymous recursion by supplying the deferred recursive step as a function argument:

```javascript
const fix = f => x => f(fix(f)) (x);

const fib = fix(go => n =>
  n > 1
    ? go(n - 1) + go(n - 2)
    : n);

fib(10); // 55
```
While having an elegant API `fix` is not tail recursive and hence not stack safe. In the following sections we are going to see that trampolines are the better alternative for almost all cases.

### Compiler/Interpreter optimization strategies

If the recursive step of an algorithm is in tail position compilers/interpreters can conduct tail call optimization, i.e. they can share a single stack frame throughout the whole recursive computation by eliminating additional frames. This is not only much more efficient but also avoids exhausting the function call stack. Even though Ecmascript 2015 defines TCO it is not implemented yet in any major browser:

```javascript
const foldl = f => acc => ([h, t]) =>
  h === undefined
    ? acc
    : foldl(f) (f(acc) (h)) (t);
//    ^^^^^^^^^^^^^^^^^^^^^^^^^ performs TCO
```

Tail call optimization can be further generalized to tail recursion modulo cons (short for constructor). Where TCO only kicks in when the recursive step is in tail position TRMC allows the recursive step to be passed as the second argument of a binary function, as long as this function performs an associative operation:

```javascript
const foldr = f => acc => ([h, t]) =>
  h === undefined
    ? acc
    : f(h) (foldr(f) (acc) (t));
//          ^^^^^^^^^^^^^^^^^^ performs TRMC provided f is associative
```
Please note that in lazily evaluated languages like Haskell this optimization technique is called guarded recursion. Javascript does not support TRMC either.

### From trampolines to full-grown evaluators

Trampolines offer a functional interface to write pseudo-recursive algorithms, while under the hood an imperative loop does all the work. Usually trampolines merely cover tail recursive algorithms. However, we can extend the concept to full-grown evaluators that are equally powerful as tail recursion modulo cons.

An ordinary trampoline for tail recursion:

```javascript
const tailRec = f => (...args) => {
    let step = f(...args);

    while (step.tag !== Base)
      step = f(...step.args);

    return step.x;
};
```
An extended trampoline for limited body recursion:

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
```
The necessary tags to build pseudo-recursive algorithms:

```javascript
const Base = x =>
  ({tag: Base, x});


const Call = (f, step) =>
  ({tag: Call, f, step});


const Step = (...args) =>
  ({tag: Step, args});
```
#### Mimicking tail recursion

Let us encode a tail recursive list fold using a trampoline:

```javascript
fold = f => acc => xs => {
  const go = (acc_, i) =>
    i === xs.length
      ? acc
      : go(f(acc_) (xs[i]) (i + 1);

  return go([], 0);
};

fold_ = f => acc => xs =>
  tailRec((acc_, i) =>
    i === xs.length
      ? Base(acc)
      : Step(f(acc_) (xs[i]), i + 1))
          (acc, 0);
```
The same procedure for the Fibnacci sequence:

```javascript
const fibTail = n => {
  const go = (x, y, m) =>
    m > 1
      ? go(y, x + y, m - 1) // recursive step
      : y; // base case

  return go(0, 1, n);
};

fibTail_ = n =>
  tailRec((x, y, m) =>
    m > 1
      ? Step(y, x + y, m - 1)
      : Base(x))
          (1, 1, n);
```
#### Mimicking tail recursion modulo cons

Next comes the transformation of a right associative fold implemented as a body recursive algorithm:

```javascript
foldr = f => acc => xs => {
  const go = i =>
    i === xs.length
      ? acc
      : f(xs[i]) (go(i + 1));

  return go(0);
};

const foldr_ = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(f(xs[i]), Step(i + 1))) (0);
```
The same procedure for Fibonacci fails, because the underlying algorithm has two recursive steps for each operand of the addition:

```javascript
const fibBody = n =>
  n > 1
    ? fib(n - 1) + fib(n - 2) // recursive step
    : n; // base case
```
We cannot express this form of recursion using our `rec` trampoline. Like with TRMC we can only optimize if the recursive call is only in the second argument of the operation. But going beyond TRMC we can also optimize non-associative operations like subtraction or division.

#### Trampolines with short circuit semantics

It is easy to break out of imperative loops prematurely and likewise it is with recursion. A proper trampoline implementation must offer such a feature as well:

```javascript
const snoc = x => xs => (xs.push(x), xs);

const take = n => xs =>
  tailRec((acc, i) =>
    i === n
      ? Base(acc)
      : Step(snoc(xs[i]) (acc), i + 1))
          ([], 0);

take(3) ([1, 2, 3, 4, 5]); // [1, 2, 3]
```
With `rec` we can also break out of a right associative recursive operation. Please note that the following implementation is very inefficient and just serves for illustration:

```javascript
const cons = x => xs => (xs.unshift(x), xs);

const takeLast = n => xs =>
  rec(i =>
    xs.length === i ? Base([])
      : xs.length - i <= n ? Call(cons(xs[i]), Step(i + 1))
      : Call(id, Step(i + 1)))
          (0);

takeLast(3) ([1, 2, 3, 4, 5]); // [3, 4, 5]
```
#### Mimicking indirect recursion

There is actually a third trampoline implementation that covers indirect recursion, namely the trampoline monad. However, since the main purpose of the trampoline monad is to deal with monadic recursion, I will demonstrate it only in the corresponding chapter on monads of this course. Please bear with me!

### Corecursion

Corecursion is dual to recursion and an effecitive way to understand it is to highlight the differences between both concepts. While recursion means calling onself on smaller data at each iteration until the smallest possible data is reached, corecursion means calling oneself on data at each iteration that is greater than or equal to what one had before. Viewed from a different angle recursion forms algorithms that consume data in a way which stops whereas corecursion forms algorithms that produce data in a way which continues.

The same distinction can be made with the values recursion and corecursion work with. Recursion on the one hand works with data that is always finite. Corecursion on the other hand works with codata that may be infinite. This was a great deal of theory. Let the practice speak for itself:

```javascript
const Defer = thunk =>
  ({get runDefer() {return thunk()}})

const app = f => x => f(x);

const fibs = app(x_ => y_ => {
  const go = x => y =>
    Defer(() =>
      [x, go(y) (x + y)]);

  return go(x_) (y_).runDefer;
}) (1) (1);

const take = n => codata => {
  const go = ([x, tx], acc, i) =>
    i === n
      ? acc
      : go(tx.runDefer, acc.concat(x), i + 1);

  return go(codata, [], 0);
};

take(10) (fibs); // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```
`fibs` represents codata, because it is an infinite stream of natural numbers. The actual type of `fibs` is a pair tuple consisting of the current value of the stream and a thunk (wrapped in an object), which only delivers the next value when requested. This type may be unfamiliar and a bit awkward, however, it renders codata incompatible with recursive functions. This is actually a desired behavior, since a recursive function applied to codata would lead to infinite recursion. Only corecursive functions like `take` can process possibly infinite codata properly.

### Co-/Recursion as a last resort

As I have already mentioned at the beginning of this chapter recursion und corecursion are functional primitives. Functional programmers usually prefer I higher level of abstraxction to work with. Abstractions are a mixed blessing though: On the one hand they spare us a lot of details and reduce the mental load. But on the other hand you have to be familiar with these abstractions and be trained how to handle them effectively. Let us take two function from a previous section to illustrate this:

```javascript
const take = n => xs =>
  tailRec((acc, i) =>
    i === n
      ? Base(acc)
      : Step(snoc(xs[i]) (acc), i + 1))
          ([], 0);

const takeLast = n => xs =>
  rec(i =>
    xs.length === i ? Base([])
      : xs.length - i <= n ? Call(cons(xs[i]), Step(i + 1))
      : Call(id, Step(i + 1)))
          (0);
```

In order to build `take` and `takeLast` from scratch with bare recursion you have to take care of a lot of internals. Both algorithms are very different from each other because we are forced to program on a rather low level. We already have lambda abstractions in our toolset to deal with this class of recursive algorithms with premature termination semantics: `foldk` and `foldkr`. Let us apply them to see if they are able to simplify the implementation:

```javascript
const foldk = f => acc => xs =>
  tailRec((acc_, i) =>
    i === xs.length
      ? Base(acc_)
      : f(acc_) (xs[i], i).runCont(acc__ => Step(acc__, i + 1))) (acc, 0);

const foldkr = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(acc => f(xs[i]) (acc).runCont(id), Step(i + 1))) (0);

const take = n => xs =>
  foldk(
    acc => x =>
      n === acc.length
        ? Cont(_ => Base(acc))
        : Cont(k => k(acc.concat([x]))))
            ([])
              (xs);

const takeLast = n => xs =>
  foldkr(
    x => acc =>
      n === acc.length
        ? Cont(_ => Base(acc))
        : Cont(k => k([x].concat(acc))))
            ([])
              (xs);
```
It turns out that deriving `take`/`takeLast` from these folds is indeed a good idea to get rid of the details. Both algorithms resemble each other, because we program on a higher level of abstraction now. Whether the new implementations are more readable depends on your knowlegde of the used abstractions though.

Bottom line recursion and corecursion are a last resort that we sometimes need when we have to deal with a very specific problem or rely on micro optimizations for a performance critical portion of our code. Otherwise we try to avoid the low level work and appreciate the blessing of higher abstractions.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-5.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc)
