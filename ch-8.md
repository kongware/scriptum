## From Natural Recursion to Corecursion

Recursion and corecursion are primitives of the functional paradigm and you can easily get lost in the details. As a decent functional programmer you try to abstract from them to reduce the mental load. However, sometimes there is no way around. Hence it is good idea to make yourself acquainted with the concepts and to get an eye for when to use which technique.

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
[run code](https://repl.it/repls/LimpingAromaticModule)

Here we are logging at the base case. Since the body recursive Fibonacci algorithm starts its work from this very base case on the way back to the initial case, the smallest, simplest instances (`0` and `1`) of the problem are logged. The tail recursive algorithm on the other hand starts its work from the initial case. Consequently it has already finished its work when the base case is reached and only the final result is logged. Let us prove this assertion by logging at the initial case:

```javascript
const fibTail = n => {
  const go = (x, acc, m) =>
    m > 1
      ? (log(acc), go(acc, acc + x, m - 1))
      : log(acc);

  return go(0, 1, n);
};

fibTail(10); // logs 1, 1, 2, 3, 5, 8, 13, 21, 34
```
[run code](https://repl.it/repls/PiercingLimitedOmnipage)

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

foldr(sub) (0) (xs); // (1 - (2 - (3 - 0))) = 2
foldl(sub) (0) (xs); // (((0 - 1) - 2) - 3) = -6
```
[run code](https://repl.it/repls/DimJauntyApplet)

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
[run code](https://repl.it/repls/HelplessAptLivecd)

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
[run code](https://repl.it/repls/AssuredIdealisticOffice)

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
[run code](https://repl.it/repls/FlatFloweryDifferences)

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
[run code](https://repl.it/repls/EarnestUnripeRuntimeenvironment)

The CPS version pursues the same computation strategy as the body recursive approach. Since with CPS all continuation invocations are in tail position we can have both, efficient tail calls and a body recursive computation strategy. This is a big win!

### Indirect or mutual recursion

If function `foo` calls function `bar`, which calls function `bat`, which in turn calls `foo` again then all three involved functions are recursive, indirectly recursive to be precise. The following example is not very efficient and a bit contrived but serves the purpose to illustrate the mechanism:

```javascript
const fib_ = n =>
  n < 1
    ? 1
    : fib(n - 1);

const fib = n =>
  n < 1
    ? 0
    : fib(n - 1) + fib_(n - 1);

fib(10); // 55
```
[run code](https://repl.it/repls/FlippantRedundantVisitor)

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
[run code](https://repl.it/repls/SlategrayWiryBoolean)

While having an elegant API `fix` is not tail recursive and hence not stack safe. In the following sections we are going to see that trampolines are the better alternative for almost all cases.

### Corecursion

Corecursion is dual to recursion and an effecitive way to understand it is to highlight the differences between both concepts. While recursion means calling onself on smaller data at each iteration until the smallest possible data is reached, corecursion means calling oneself on data at each iteration that is greater than or equal to what one had before.

Reducting data inevitably stops at some point when the smallest possible data is reached, hence a recursion can be considered as an algorithm that consumes data in a way that stops. Expanding data is an infinite process limited only by system resources and time, hence corecursion can be regarded as an algorithm that consumes data in a way that continues. 

This difference in behavior has implications for the data both algorithms can work with. Recursion works with finite data whereas corecursion works with possibly infinite codata. The following corecursive example illustrates this:

```javascript
const snoc = x => xs => (xs.push(x), xs);

const Nil = null;
const Cons = head => tail => ({head, get tail() {return tail()}});

const fibs = Cons(0) (() => Cons(1) (() => {
  const go = (xs, ys) =>
    Cons(xs.head + ys.head) (() => go(xs.tail, ys.tail));

  return go(fibs, fibs.tail);
}));

const take = n => xs => {
  const go = (acc, {head, tail}) =>
    head === undefined || acc.length === n
      ? acc
      : go(snoc(head) (acc), tail);

  return go([], xs);
};

take(10) (fibs); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```
[run code](https://repl.it/repls/SvelteHotpinkCarrier)

`fibs` is codata, because it is an infinite stream of natural numbers. Corecursion is pull-based, that is the algorithm only produces a single value when needed. As opposed to that recursion is push-based, that is once started it continues until the base case is reached. 

### Recursion as a last resort

As I have already mentioned at the beginning of this chapter recursion und corecursion are functional primitives. Functional programmers usually prefer I higher level of abstraxction to work with. Abstractions are a mixed blessing though: On the one hand they spare us a lot of details and reduce the mental load. But on the other hand you have to be familiar with these abstractions and be trained how to handle them effectively. Let us illustrate the issue by taking another look at the corecursive `fibs` function:

```javascript
const fibs = Cons(0) (() => Cons(1) (() => {
  const go = (xs, ys) =>
    Cons(xs.head + ys.head) (() => go(xs.tail, ys.tail));

  return go(fibs, fibs.tail);
}));
```
We can greatly simplify it by using a fold abstraction:

```javascript
const fibs = unfoldr(
  ([x, y]) => Some([x, [y, x + y]])) ([0, 1]);
```
Of course you can only comprehend this abstraction if you are familiar with `unfoldr` and unfolding in general. And applying it yourself takes even more experience. However, when you are an experienced functional programmer you will highly appreciate a certain level of abstraction, because it spares you a lot of distracting details and unnecessary boilerplate.

Bottom line recursion and corecursion are a last resort that we sometimes need when we have to deal with a very specific problem or rely on micro optimizations for a performance critical portion of our code. Otherwise we try to avoid the low level work and appreciate the blessing of higher abstractions.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-7.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-9.md)
