## Principled and unprincipled approaches to Lamdba Abstractions

**[EDITOR'S NOTE: THIS CHAPTER IS UNDER CONSTRUCTION]**

This chapter is about abstracting code with functions, i.e. creating function encodings. It is rather opinion-based. I have been struggling with myself to write on this opinion-based subject as this course should not be about my opinion but about functional programming. Nevertheless I decided to adhere to this chapter since it hopefully helps people to avoid frequent rookie misconceptions as I experienced them during my endeavour to learn the paradigm.

### Pros and cons

There is a great motivation for abstraction in programming, because it allows us to reduce the necessary portion of boilerplate in our code. Dropping details may be a desirable for someone who is familiar with this details. Other, less experienced developers might need this boilerplate though, in order to comprehend a computation or an algorithm.

The process of abstraction tends to continue. We can still add another level to our code. A developer who is comfortable with a certain level of abstraction might be overwhelmed with the next one. Ultimately abstraction is torn between the following mutually exclusive objectives:

* avoiding boilerplate
* keep code accessible

There is no solution to this contradiction, nor is there a common level of abstraction that could be agreed upon.

### Reasons for lambda abstractions

There is a great motivation for abstraction in programming, because it allows us to reduce the necessary portion of boilerplate in our code. If we insist on defining some specific and reasonable motives to abstract code with lambdas then there are at least six reasonable ones, assumed we are not in a purely functional setting:

* code reuse (self-explanatory)
* pass state around (see chapter _managing state_)
* share the result of expressions (see chapter _managing state_ section _let bindings_)
* Replace statements with expressions
* Avoid explicit lambdas
* Utilize partial application

We are going to take a closer look at the three last points in the following sections.

#### Replace statements with expressions

You can replace statements with an expression by simply wrapping it in a function:

```javascript
const app_ = x => f => f(x);

app_({tag: “foo”}) (({tag}) => {
  switch(tag) {
    case “foo”:
       return ...;

    case “bar”:
       return ...;

    default:
       return ...;
  }
});
```
This way statements become composable and can be passed around like data. Beyond that you do not lose beneficial properties like readability and conciseness.

#### Avoid explicit lambdas

You can render algorithms concise and more readable by avoiding explicit lambdas provided the used combinators are well-known:

```javascript
const reduce = f => init => xs =>
  xs.reduce((acc, x) => f(acc) (x));

const comp = f => g => x =>
  f(g(x));
  
const compAll = fs => x =>
  reduce(f => g => x => f(g(x))) (id) (fs) (x); 

const compAll_ = fs => x =>
  reduce(comp) (id) (fs) (x);

const inc = x => x + 1;

compAll_([inc, inc, inc, inc, inc]) (0); // 5
```
[run code](https://repl.it/repls/DisfiguredGiddyLead)

However, sometimes it is the other way around and the lack of explicit lambdas impair readability. There is no rule of thumb but you have to decide ad-hoc.

#### Utilize partial application

Every at least binary operator can be partially applied when it is converted to curried form. Partial application is useful when only some of the required operands are available upfront:

```javascript
const map = f => xs =>
  xs.map(x => f(x));
  
const mul = x => y => x * y;

map(mul(10)) ([0.1, 0.2, 0.3]); // [1, 2, 3]
```
[run code](https://repl.it/repls/ThisTrivialScans)

The capability to defer computations is one of the strong suits of the functional paradigm. Functions provide a form of explicit lazyness. We will learn more about lazy evaluation in a subsequent chapter.

### Harmful lambda abstractions

Usually it is a great idea to use lambda abstractions in order to develop your code further. However, like any other tool you can over- or misuse it. Not everything that can be encoded with functions should be encoded with functions. Some functionalizations tend to  obfuscate your intentions. The following guidelines may be helpful to avoid common pitfalls:

* do not encode something with functions that has a simpler representation
* only create principled and lawfull abstractions that are both directed by math and types

#### Over-abstraction example

In the followng example using Javascript's native Boolean type would defenitely lower the cognitive load:

```javascript
const False = x => y => x;
const True = x => y => y;

const ifElse= b => x => y =>
  b(x) (y);
  
const eq = x => y =>
  x === y
    ? True
    : False;

const x = 1, y = 2, z = 2;

ifElse(eq(x) (y))
  ("equal")
    ("unequal"); // "unequal" 
    
ifElse(eq(y) (z))
  ("equal")
    ("unequal"); // "equal" 
```
[run code](https://repl.it/repls/UnsungSnarlingLead)

Please note that a boolean function encoding is not only hard to read but also rather inefficient.

#### Lawless abstraction example

Avoiding nested function calls is a reasonable endeavour. However, if you accomplish it with the wrong tool you will eventually run into other unforeseen problems:

```javascript
const compn = f =>
  Object.assign(
    g => compn(x => f(g(x))),
    {runCompn: f});

compn(inc)
  (inc)
    (inc)
      (inc)
        (inc).runCompn(0); // 5
```
[run code](https://repl.it/repls/BruisedLightcyanDevice)

This is a nice piece of Javascript engineering. Are you able to see the long term implications of this approach though? Did you recognize, for instance, that `compn` has no type - at least not in Typescript? Does this approach work for all sorts of compositions or merely for composing pure functions?

This combinator is not a lawfull and type directed one. Unless you are a very seasoned developer you most likely cannot anticipate all consequences of using it.

### Well-known functional combinators

Funtional programming can afford a higher degree of abstraction, because the applied ones are either well-known or lawfull/principled. Greater abstraction leads to increased code reuse.

The following paragraphs include a first set of well-known functional combinators that you should familiarize yourself with. They do not depend on a particular type but are polymorphic. You can think of them as functional primitives as there exist primitives in a type system. 

Please note that a trailing underscore within a combinator's name indicates a slightly different version of an existing combinator. A prefixed underscore on the other hand is merely used to avoid name clashes with Javascript's reserved words.

#### Unary combinators

`id = x => x`

`id` is is the neutral element of the function type. It is similar to `1` for multiplication, `0` for addition or `[]` for arrays. As you need `0`/`1` for arithmetic operations you need `id` together with functions.

#### Binary combinators

`_const = x => y => x`<br/>
`const_ = x => y => y`

Both constant combinators ignore either of their two arguments. It acts like a functional constant, hence the name.

#### Binary combinators with one function argument

`app = f => x => f(x)`<br/>
`app_ = x => f => f(x)`

The applicator is helpful when you need an immediately invoked function expression. It is more readable then using the parentheses syntax.

You can also utilize it to functionalize `if`/`switch` statements:

```javascript
  const app_ = x => f => f(x);
  
  app_(["f", "o", "o"].join(""))
    (s => {
      if (s === "foo")
        return s + "l";

      else if (s === "bar")
        return "bar" + "k";

      else
        return s;
    }); // "fool"
```
[run code](https://repl.it/repls/BruisedHarmlessWrapper)

`join = f => x => f(x) (x)`

If you want to get rid of a redundant layer of nested functions you can apply `join`:

```javascript
const join = f => x => f(x) (x);
const comp = f => g => x => f(g(x));

const const_ = x => y => x;
const inc = x => x + 1;

join(comp(const_) (inc)) (2); // 3
```
[run code](https://repl.it/repls/OldfashionedPastelSdk)

`eff = f => x => (f(x), x)`

The effect combinator is also known as `tap` in the imperative world. You can use `eff` when you are only interested in the side effect of a function, not its return value:

```javascript
const eff = f => x => (f(x), x);

const _throw = e => {
  throw e;
};

const comp2nd = f => g => x => y =>
  f(x) (g(y));

const div = x => y => x / y;

const safeDiv = comp2nd(div)
  (eff(x => {
    if (x === 0)
      _throw(TypeError("div by zero"))}));

safeDiv(4) (2);
safeDiv(2) (0);
```
[run code](https://repl.it/repls/ElegantTrivialCertification)

`fix = f => x => f(fix(f)) (x)`

The fixed point combinator allows anonymous recursion, that is you can define an anonymous recursive function in place:

```javascript
const fix = f => x => f(fix(f)) (x)

fix(rec => n =>
  n === 0
    ? 1
    : n * rec(n - 1)) (5); // 120
```
[run code](https://repl.it/repls/KosherWarmheartedControlpanel)

Although `fix` is not stack safe and might exhaust the call stack it is important to understand the underlying mechanism.

`_let = f => f()`

Javascript lacks `let` expressions to create local name bindings. The `_let` combinator finds a remedy by mimicing such bindings:

```javascript
const _let = f => f();

_let((x = 2, y = x * x, z = y * y, total = x + y + z, foo = "foo") =>
  [x, y, z, total]); // [2, 4, 16, 22, foo]
```
[run code](https://repl.it/repls/MistyGrimyDesigners)

But wait, `_let` has no type. Is not that a lawless abstraction? Yes, it is. However, it is the only way I am aware of to allow local bindings that may depend on previously defined ones. Moreover, it has turned out that there is a way to type both the combinator and its applications in Typescript. More on this in one of the subsequent chapters.

`appr = (f, y) => x => f(x) (y)`

`appr` applies the right argument of a binary function, i.e. it effectively flips the argument order. In the literature this combinator is subsumed under the term sectioning, namely the right section:

```javascript
const appr = (f, y) => x => f(x) (y);

const sub = x => y => x - y,
  sub2 = sub(2),
  sub2_ = appr(sub, 2);

sub2(5); // -3
sub2_(5); // 3
```
[run code](https://repl.it/repls/SillySlateblueGreyware)

Clearly the second application yields a more intuitive result.

#### Ternary combinators with one function argument

`curry = f => x => y => f(x, y)`<br/>
`uncurry = f => (x, y) => f(x) (y)`<br/>
`flip = f => y => x => f(x) (y)`

I talked about these combinators in a previous chapter. Please look it up for more information.

#### Ternary combinators with two function arguments

`comp = f => g => x => f(g(x))`<br/>
`pipe = g => f => x => f(g(x))`

Function composition is covered in a previous chapter. Please look it up for more information.

`ap = f => g => x => f(x) (g(x))`

`ap` is a more general form of function composition. It allows us to apply an n-ary function to the results of n unary functions. Usually `ap` is not used that often since it quickly leads to nested function calls. However, I will describe a technique to bypass this behavior in a subsequent chapter. For the time being we stick with the following schematic example:

```javascript
const ap = f => g => x => f(x) (g(x));

const main = ap(
  ap(
    ap(w => x => y => z =>
      [w, x, y, z]) (inc)) (inc)) (sqr);

main(3); // [3, 4, 4, 9]
```
[run code](https://repl.it/repls/IndigoOrnateDoom)

`chain = f => g => x => f(g(x)) (x)`

`chain` does the same as `ap` but additionally allows you to choose the subsequent computation depending on a previous value:

```javascript
const chain = f => g => x => f(g(x)) (x);

const main = chain(x =>
  x === 1
    ? _ => [] // A
    : chain(y =>
        chain(z =>
          w => [w, x, y, z]) (sqr)) (inc)) (inc);

main(3); // [3, 4, 4, 9]
main(0); // []
```
[run code](https://repl.it/repls/NeighboringFrayedAnalysis)

As you can see in line `A` we can short circuit the compostion depending on `x`. This is not possible with the `ap` backed composition.

Both `comp`, `ap` and `chain` happen to be instances of the functor, applicative and monad typeclass respectively. They are fundamental idioms of functional programming and pop up throughout the paradigm. We will examine them from various angles in subsequent chapters.

#### Quaternary combinators with two function arguments

`comp2nd = f => g => x => y => f(x) (g(y))`

If we deal with binary functions it is sometimes convenient to defer a composition until we provide the second argument. In the example `comp2nd` is used to construct the famous `foldMap` combinator. It is a rather complex ad-hoc polymorphic combinator, so do not worry too much about the details:

```javascript
const comp2nd = f => g => x => y =>
  f(x) (g(y));

const fold = f => init => xs =>
  xs.reduce((acc, x) => f(acc) (x), init);

const comp = f => g => x =>
  f(g(x));

const id = x => x;
const empty = [];

const foldMap = ({fold, append, empty}) => f =>
  fold(comp2nd(append) (f)) (empty);

foldComp = foldMap({fold, append: comp, empty: id});

foldComp(add) ([1, 2, 3]) (100); // 106
```
[run code](https://repl.it/repls/CapitalRosyEntropy)

The reason why we need to compose in the second argument of `append` is that `foldMap` does not depend on a right associative fold but on a left associative one. As you may know both folds differ in the order the accumulator `acc` and the current element `x` is provided to the algebra `f`.

`compBin = f => g => x => y => f(g(x) (y))`

With `compBin` both function arguments can be a binary function:

```javascript
const compBin = f => g => x => y => f(g(x) (y));

compBin(sqr) (add) (2) (3); // 25
compBin(add) (add) (2) (3) (4); // 9
```
[run code](https://repl.it/repls/DraftySlategrayProgramminglanguage)

`compOn = f => g => x => y => f(g(x)) (g(y))`

The main use case of `compOn` is sorting algorithms of compound values where the order is determined by another element of the compound value:

```javascript
const compOn = f => g => x => y => f(g(x)) (g(y));

const sortBy = f => xs =>
  [...xs].sort((x, y) => f(x) (y));

const compare = x => y =>
  x < y ? -1
    : x > y ? 1
    : 0;

const fst = ([x, y]) => x;

sortBy(compOn(compare) (fst))
  ([[2, "world"], [4, "!"], [1, "hello"]]); // [[1, "hello"], [2, "world"], [4, "!"]]
```
[run code](https://repl.it/repls/ThankfulMoralFiles)

#### Quaternary combinators with three function arguments

`lift2 = f => g => h => x => f(g(x)) (h(x))`

This is the last useful combinator in this series, since we will not look into functions with more than four arguments:

```javascript
const lift2 = f => g => h => x => f(g(x)) (h(x)),
  lift3 = f => g => h => i => x => f(g(x)) (h(x)) (i(x));

const get = k => o => o[k];
const getLen = get("length");
const countVowels = s => s.match(/[aeuio]/gi).length

lift2(div) (countVowels) (getLen) ("hello world!"); // 0.25
```
[run code](https://repl.it/repls/TurbulentTediousImplementation)

`lift` abstracts nested `ap` calls and is hence just a convenience function. In a subsequent chapter we will introduce an alternative approach to avoid nesting.

It is an arity aware combinator, that is there is a corresponding version for each arity. Arity aware combinators are usually avoided in functional programming, since they cause a lot of code repetition.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-3.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc) | [next chapter &gt;](https://github.com/kongware/scriptum/blob/master/ch-5.md)
