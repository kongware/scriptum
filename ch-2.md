## Managing State

How does FP manage state? This is probably the second most frequently asked question<sup>1</sup> about functional programming. Before answering let us take a little detour at first, so that we are all on the same page.

<sup>1</sup>exceeded by the question “What is a Monad?”

### Defining state

State is data that changes over the runtime of a program. In imperative programming you usually get state either by reassigning a variable

```Javascript
let x = 1; // data
x = x + 1; // state
```

or by mutating a reference:

```Javascript
const o = {foo: true}; // data
o.foo = false; // state
```

### Referential Transparency also known as purity

An expression is called referentially transparent (or pure) if it can be replaced with its associated result value without changing the program's behavior. Hence a function is referentially transparent (or pure) if you can replace all its invocations with the corresponding result values without changing the program's behavior.

Please take the following two important rules into account:

* if a function declaration includes impure expressions but the effect(s) are not visible outside the function scope, calling it is still a pure expression
* if an otherwise pure function depends on an impure one, it is also impure

### Variables and reassignments

Although the term variable is used in functional programming and in math I prefer to avoid it because it regularly causes confusion: There are no variables in FP at least not those as they are understood in imperative programming. All we have at our disposal are immutable name bindings, that is you cannot reassign another value to an existing name. 

Reassignments are banned in functional programming since they would violate referential transparency:

```Javascript
let = y = 2;
const sub2 = x => x – y

sub2(2); // 0
y = 3;
sub2(2); // -1
```

The same expression within the same scope must yield the same value no matter when the runtime decides to actually evaluate it.

### References and mutations

The term referential transparency already dictates that the functional paradigm does not have 
a notion of references. References require the opposite namely referential identity, which allows certain values to be distinguished by their reference and thus by their location in memory. Such values have an identity:

```Javascript
const o = {foo: true},
  p = {foo: true};

o !== p; // true
```

This expression compares references. In a referential transparent environment `o` and `p` are indistinguishable, because there values are exactly the same. While comparing two references in Javascript is possible it is an impure operation, which should be conducted with additional safety measures only. I will introduce a purely functional way to work with reference types in a later chapter.

Without references there is no identity and thus no reasonable way to mutate values. The only alternative is to simply create new value whenever we need a modified one. So instead of a single value that changes over time we work with sequences of immutable values.

Creating new values is an expensive operation if we have to deal with complex ones. Fortunately there are purely functional data types based on persistent data structures, which rely on structural sharing. They render the copy process quite efficient no matter how complex the data structures are. Purely functional data structures are covered in a later chapter of this course.

### The function call stack

If we want to work with sequences of distinct values we need a way to bind them to names and to distribute them throughout the code. We are not allowed to rebind new values  to existing names in the same scope (or put imperatively: reassign a variable to a new value). But we work with functions after all. So let us utilize the function scope.

Whenever we need a reassignment we just call a function with the desired value as its argument. Now if you squint hard enough you can still think of immutable name bindings as variables, because the same name can hold various values provided it is declared in different scopes. From this perspective a variable is just a name binding which exists in consecutive function call stack elements.

If we know the number of reassignments upfront, we can manually nest function calls:

```Javascript
const app = f => x => f(x); // auxiliary function
const sqr = x => x * x;

const scanSqr3 = w => xs => // A
  app(x => // B
    app(y => // B
      app(z => [x, y, z]) (sqr(y))) (sqr(x))) (sqr(w)); // B

scanSqr3(2) ([]); // [4, 16, 256]
```

Otherwise we have to fall back to a recursive solution:

```Javascript
const sqr = x => x * x;
const append = x => xs => xs.concat([x]);

const scanSqr = n => x => xs => // A
  n === 0
    ? xs
    : scanSqr(n – 1) (sqr(x)) (xs.concat(sqr(x))); // C

scanSqr(5) (2) ([]); // [4, 16, 256, 65536, 4294967296]
```

### Let bindings

The above example is both contrived, hard to read and inefficient. However, it illustrates the fundamental concept of state is managed in functional programming. Here is a list of things we would like to improve:

* we leak API by defining the empty array as a formal parameters (A)
* we have to create anonymous functions for each name binding (B)
* the same expression is evaluated twice for each recursion (C)

Functional languages often ship with recursive let bindings, i.e. syntactic sugar for creating anonymous, recursive functions that implicitly invoke themselves<sup>1</sup>. Javascript does not supply such bindings<sup>2</sup>, but we can use default parameters in a creative way to accomplish a similar effect:

```Javascript
const _let = f => f();

const scanSqr3 = w =>
  _let((x = sqr(w), y = sqr(x), z = sqr(y)) =>
    [x, y, z]);

const scanSqr = n => x => xs => // (D)
  n === 0
    ? xs
    : _let((y = sqr(x)) => scanSqr(n - 1) (y) (xs.concat(y)));

scanSqr3(2); // [4, 16, 256]
scanSqr(5) (2) ([]); // [4, 16, 256, 65536, 4294967296]
```

This looks good except for (C). It requires a fixed point combinator in order to abstract from the last parameter. However, we are still working with Javascript. Let us fall back to explicit assignments and function declarations with explicit return statement:

```Javascript
const scanSqr = n => x => {
  const go = (xs, x_, n_) =>
    n_ === 0
      ? xs
      : _let((y = sqr(x_)) => go(xs.concat(y), y, n_ - 1));

  return go([], x, n);
};
```

Just in case you are interested in fixed point combinators, they will be examined in a later chapter of this course.

<sup>1</sup>This is only true for untyped languages.<br/>
<sup>2</sup>native `let` declarations are a completely different thing.

### When the call stack vanishes

Asynchronous functions lose the synchronous call stack, because when they are invoked the synchronous computations are already finished. While this is true we can easily build our own asynchronous call stack:

```Javascript
const compCont = f => g => x => k =>
  g(x) (y => f(y) (k));

const sqrCont = x => k => setTimeout(k, 0, `sqrCont(${x})`);
const incCont = x => k => setTimeout(k, 0, `incCont(${x})`);
const log = x => console.log(`log(${x})`);

const main = compCont(sqrCont) (incCont) (2);

main(log); // log(sqrCont(incCont(2))) A
```

This is advanced functional programming so I drop all the confusing details. The decisive part is that line (A) evaluates to a nested function call tree that when further evaluated creates its own function call stack where the asynchronous state is held.

If we would formalize further and add a couple of combinators we wind up with the continuation type (`Cont`) and the associated `Cont` monad. I will deal with this in another chapter of this course.

### Mimicking imperative state

This way of managing state is hard to digest for imperative programmers. Luckily we can mimic imperative state with functions:

```Javascript
const compState = f => g => h => x => s => {
  const [x_, s_] = h(x) (s);
    [x__, s__] = g(x_) (s_);
  
  return f(x__) (s__);
};

const sqr = x => x * x;

const addState = x => s => [x + s, s];
const modState = f => x => s => [x, f(s)];
const mulState = x => s => [x * s, s];

const main = compState(addState) (modState(sqr)) (mulState) (2);

main(3); // [15, 9] A
```

This is again an advanced functional idiom but the underlying idea is simple: Instead of functions that just return a value we work with functions that return an value, namely the state. In the given example we pass the value `3` as the initial state to our main computation (A). This state is first multiplied with `2` and then multiplied by itself. At last both products are added. This yields the following expression `3 * 2 + 3 * 3`, which evaluates to `15`. Since we work with “stateful” functions both values the result and the current state are returned in a pair tuple like array.

If we would formalize further and add a couple of combinators we wind up with the `State` type and the associated `State` monad. I will deal with this in another chapter of this course.
