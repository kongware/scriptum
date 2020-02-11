## Reasonable and Harmful Lambda Abstractions

This chapter is about abstracting code with functions, i.e. creating function encodings. It is rather opinion-based. I was struggling with myself while writing it as this course should not be about my opinion but about functional programming. Nevertheless I decided to adhere to this chapter since it hopefully helps people to avoid frequent rookie misconceptions as I experienced them myself a couple of years ago.

### Reasons for lambda abstractions

In an imperative or multi-paradigm language there are three reasonable motives among others to abstract code with functions:

* Replace statements with expressions
* Avoid explicit lambdas
* Utilize partial application

#### Replace statements with expressions

You can replace statements with an expression by simply wrapping it in a function:

```Javascript
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

```Javascript
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

However, sometimes it is the other way around and the lack of explicit lambdas impair the readability. You have to decide as the case arises. Functional programming does not free you from thinking.

#### Utilize partial application

Every at least binary operator can be partially applied when it is converted to curried form. Partial application is useful when only some of the required operands are available in advance:

```Javascript
const map = f => xs =>
  xs.map(x => f(x));
  
const mul = x => y => x * y;

map(mul(10)) ([0.1, 0.2, 0.3]); // [1, 2, 3]
```
[run code](https://repl.it/repls/ThisTrivialScans)

The capability to defer computations is one of the strong suits of the functional paradigm. This is a form of explicit lazyness. We will learn more about lazy evaluation in a subsequent chapter.

### Harmful lambda abstractions

Usually it is a very great idea to use lambda abstractions in order to develop your code further. However, like any other tool you can over- or misuse it. Not everything that can be encoded with functions should be encoded with functions. Some functionalizations tend to  obfuscate your intentions. The following guidelines may be helpful to avoid common pitfalls:

* do not encode something with functions that has a simpler representation
* only create principled and lawfull abstractions that are both directed by math and types

#### Over-abstraction example

In the followng example using Javascript's native Boolean type would defenitely lower the cognitive load:

```Javascript
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

Please note that a boolean function encoding is not only hard to read but also rather inefficiently.

#### Lawless abstraction example

Avoiding nested function calls is a reasonable endeavour. However, if you accomplish it with the wrong tool you will eventually run into other unforeseen problems:

```Javascript
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

This combinator is not a lawfull and type directed one. Unless you are a very seasoned developer you most likely cannot anticipate the consequences of using it.

### Well-known functional combinators

The following paragraphs include well-known functional combinators that you should familiarize yourself with. They do not depend on a particular type but are polymorphic. You can think of them as functional primitives as there exist primitives in a type system. 

Please note that a successive underscore within a combinator's name indicates a slightly different version of an existing combinator. A preceding underscore on the other hand is merely used to avoid name clashes with Javascript's reserved words.

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

The applicator is helpful when you need an immediately invoked function expression. It is more readable then using syntax with parentheses.

You can also utilize it to functionalize `if`/`switch` statements:

```Javascript
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

```Javascript
const join = f => x => f(x) (x);
const comp = f => g => x => f(g(x));

const const_ = x => y => x;
const inc = x => x + 1;

join(comp(const_) (inc)) (2); // 3
```
[run code](https://repl.it/repls/OldfashionedPastelSdk)

`eff = f => x => (f(x), x)`

The effect combinator is also known as `tap` in the imperative world. You can use `eff` when you are only interested in the side effect of a function, not its return value:

```Javascript
const eff = f => x => (f(x), x);
const comp = f => g => x => f(g(x));

const sqr = x => x * x;
const get = k => o => o[k];
const log = s => console.log(s);

comp(sqr)
  (s => eff(log) (get("length") (s)))
    ("foo"); // logs 3 + returns 9 
```
[run code](https://repl.it/repls/ElegantTrivialCertification)

`fix = f => x => f(fix(f)) (x)`

The fixed point combinator allows anonymous recursion, that is you can define an anonymous recursive function in place:

```Javascript
const fix = f => x => f(fix(f)) (x)

fix(rec => n =>
  n === 0
    ? 1
    : n * rec(n - 1)) (5); // 120
```
[run code](https://repl.it/repls/KosherWarmheartedControlpanel)

Although `fix` is not stack safe and might exhaust the call stack it is important to understand the underlying mechanism.

`_let = f => f()`

Javascript lacks `let` expressions to create local name bindings. The `_let` combinator finds remedy by mimicing such bindings:

```Javascript
const _let = f => f();

_let((x = 2, y = x * x, z = y * y, total = x + y + z, foo = "foo") =>
  [x, y, z, total]); // [2, 4, 16, 22, foo]
```
[run code](https://repl.it/repls/MistyGrimyDesigners)

But wait, `_let` has no type. Is not it a lawless abstraction? Yes, it is. However, it is the only way I am aware of to allow local bindings that may depend on previously defined ones. Moreover, it has turned out that there is a way to type both the combinator and its applications in Typescript. More on this in one of the subsequent chapters.

`appr = (f, y) => x => f(x) (y)`

`appr` applies the right argument of a binary function, i.e. it effectively flips the argument order. In the literature this combinator is subsumed under the term sectioning, namely the right section:

```Javascript
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

Function composition is covered in a previous chapter of this course. Please look it up for more information.

`ap = f => g => x => f(x) (g(x))`

`ap` is a more general form of function composition. It allows us to apply an n-ary function to the results of n unary functions. Usually it is not used on its own but together with other combinators as we are going to see in a subsequent chapter. For the time being here is a schematic application:

```Javascript
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

```Javascript
const chain = f => g => x => f(g(x)) (x);

const main = chain(x =>
  chain(y =>
    chain(z =>
      z === 0
        ? _ => []
        : w => [w, x, y, z]) (sqr)) (inc)) (inc);

main(3); // [3, 4, 4, 9]
main(0); // []
```
[run code](https://repl.it/repls/NeighboringFrayedAnalysis)

Having such a choice seems to be a merely subordinate property. In later chapters of this course you will learn that `chain` and its counterparts for other data types are an extremely general and powerful tool. They are also known as monads.

#### Quaternary combinators with two function arguments

`comp2nd = f => g => x => y => f(x) (g(y))`

If we deal with binary functions it is sometimes convenient to defer a composition until we provide the second argument. In the example `comp2nd` is used to construct the famous `foldMap` combinator. It is a rather complex ad-hoc polymorphic combinator, so do not worry too much about the details:

```Javascript
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

```Javascript
const compBin = f => g => x => y => f(g(x) (y));

compBin(sqr) (add) (2) (3); // 25
compBin(add) (add) (2) (3) (4); // 9
```
[run code](https://repl.it/repls/DraftySlategrayProgramminglanguage)

`compOn = f => g => x => y => f(g(x)) (g(y))`

The main use case of `compOn` is sorting algorithms of compound values where the order is determined by an element of the compound value:

```Javascript
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

```Javascript
const lift2 = f => g => h => x => f(g(x)) (h(x)),
  lift3 = f => g => h => i => x => f(g(x)) (h(x)) (i(x));

const get = k => o => o[k];
const getLen = get("length");
const countVowels = s => s.match(/[aeuio]/gi).length

lift2(div) (countVowels) (getLen) ("hello world!"); // 0.25
```
[run code](https://repl.it/repls/TurbulentTediousImplementation)

`lift` abstracts nested `ap` calls and is hence just a convenience function. In a subsequent chapter we will introduce an alternative approach to avoid nesting.

`lift` is an arity aware combinator, that is there is a corresponding version for each arity. Arity aware combinators are usually avoided in functional programming, since they cause a lot of code repetition.

[&lt; prev chapter](https://github.com/kongware/scriptum/blob/master/ch-3.md) | [TOC](https://github.com/kongware/scriptum#functional-programming-course-toc)
