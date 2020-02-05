## Reasonable and Harmful Lambda Abstractions

This chapter is about abstracting code with functions, i.e. creating function encodings. It is rather opinion-based. I was struggling with myself while writing it, because this course should not be about my opinion but about functional programming. I nevertheless decided to adhere to this chapter since it probably helps people to avoid common rookie misconceptions as I did them a couple of years ago.

### Reasons for lambda abstractions

In an imperative or multi-paradigm language there are four reasonable motives to abstract code with functions:

* Code reuse
* Avoid intermediate values
* Replace statements with expressions
* Avoid explicit lambdas
* Utilize partial application

Please note that I will not discuss the first two points, because they are rather irrelevant to the given issue.

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

const compAll = fs => x =>
  reduce(f => g => x => f(g(x))) (id) (fs) (x); 

const compAll_ = fs => x =>
  reduce(comp) (id) (fs) (x);

compAll_([inc, inc, inc, inc, inc]) (0); // 5
```
However, sometimes it is the other way around and the lack of explicit lambdas impair the readability. You have to decide as the case arises.

#### Utilize partial application

Every at least binary operator can be partially applied when it is converted to curried form. Partial application is useful when only some of the required operands are available in advance:

```Javascript
const map = f => xs =>
  xs.map(x => f(x));

map(mul(10)) ([0.1, 0.2, 0.3]); // [1, 2, 3]
```
### Harmful lambda abstractions

Usually it is a very good idea to use lambda abstractions in order to improve your code. However, like any other tool you can over- or misuse it. Not everything that can be encoded with functions should be encoded with functions. Some functionalizations tend to  obfuscate your intentions. The following guidelines may be helpful to avoid common pitfalls:

* do not encode something with functions that has a simpler representation (over-abstracting)
* only create principled abstractions that are both directed by math and types (do not  make things up)
* use principled abstractions as they are intended (do not misuse things)

#### Example of over-abstracting

Although we can encode booleans with functions, we obviously should not and use the native Boolean type instead:

```Javascript
const False = x => y => x;
const True = x => y => y;

const ifElse= b => x => y => b(x) (y);
const eq = x => y => x === y ? True : False;

const x = 1, y = 2, z = 2;

ifElse(eq(x) (y)) (“equal”) (“unequal”); // “unequal” 
ifElse(eq(y) (z)) (“equal”) (“unequal”); // “equal” 
```
#### Example of making things up

Let us define a variadic composition function in curried form that takes an arbitrary number of arguments and offers a mechanism to finally run the composition:

```Javascript
const compn = f =>
  Object.assign(g => compn(x => f(g(x))), {runCompn: f});

compn(inc) (inc) (inc) (inc) (inc) (inc).runCompn(0); // 5
```
How great is that! Well, this is an lawless abstraction, because variadic functions are incompatible with currying. Apart from that `compn` does not have a type, thus you cannot ever use it with e.g. Typescript.

#### Example of misusing things

Consider the following array fold:

```Javascript
const fold = f => init => xs =>
  xs.reduce((acc, x) => f(acc) (x), init);

const sqr = x => x * x;

fold(xs => x => [x, ....xs]) ([]) ([1, 2, 3]); // [1, 4, 9]
```
While this is technically correct it obfuscates the purpose of the program. Everyone who is familiar with array functions and skims the code would assume that some sort of reduction takes place, because the purpose of a fold is to reduce or eliminate a data structure. Since the operation above preserves the array’s structure, a simple map would have sufficed.

### Common functional combinators

The following section lists well-known functional combinators that do not depend on a particular type but are polymorphic. You can think of them as functional primitives as there are primitive types in a type system.

Please note that a successive underscore within a combinator’s name indicates a slightly different version of an existing combinator. A preceding underscore on the other hand is merely used to avoid name clashes with Javascript’s reserved words.

#### Unary combinators

`id = x => x`

`id` is is the neutral element of the function type. It is similar to `1` for multiplication, `0` for addition and `[]` for Arrays. As you need `0`/`1` for arithmetic you need `id` when working with functions.

#### Binary combinators

`_const = x => y => x`
`const_ = x => y => y`

Both constant combinators ignore one of their two arguments. It acts like a functional constant, hence the name.

#### Binary combinators with one function argument

`app = f => x => f(x)`
`app_ = x => f => f(x)`

The applicator is helpful when you need an immediately invoked function expression. It is more readable then using parentheses.

You can also use it to functionalize `if`/`switch` statements:

```Javascript
  app_([“f”, “o”, “o”].join())
    (s => {
      if (s === “foo”)
        return s + “l”;

      else if (s === “bar”)
        return “bar” + “k”;

      else
        return s;
    }); // “fool”
```
`join = f => x => f(x) (x)`

In rare scenarios there is one redundant layer of nested functions. You can get rid of it by flattening with `join`:

```Javascript
const comp = f => g => x => f(g(x));
const const_ = x => y => x;
const inc = x => x + 1;

join(comp(const_) (inc)) (2); // 3
```
`eff = f => x => (f(x), x)`

The effect combinator is also known as `tap` in the imperative world. You can use `eff` when you are only interested in the side effect of a function:

```Javascript
const comp = f => g => x => f(g(x));
const sqr = x => x * x;
const get = k => o => o[k];
const log = s => console.log(s);

eff(log)
  (comp(sqr) (get(“length”) (“foo”)); // logs/returns 9
```
`fix = f => x => f(fix(f)) (x)`

The fixed point combinator allows anonymous recursion but is not stack safe, i.e. might exhaust the call stack for long running computations:

fix (\rec n -> if n == 0 then 1 else n * rec (n-1)) 5

const fix = f => x => f(fix(f)) (x)

```Javascript
fix(rec => n =>
  n === 0
    ? 1
    : n * rec(n - 1)) (5); // 120
```
As you can see we can recursively calculate the faculty of `5` without requiring a named function.

`_let = (x, f) => f(x)`

Javascript lacks `let` expressions to create name bindings. The `_let` combinator is specific for imperative languages and mimics such bindings:
_let2(“foo”, “foo”.length,
  s => n => `${s} has ${n} letters`);

`_let` is an arity aware combinator, i.e. depending of how many name bindings you need there is a suited combinator. Usually we try to avoid arity awareness, but sometimes we have to resort to it.

`appr = (f, y) => x => f(x) (y)`

`appr` applies the right argument of a binary function, i.e. it flips the argument order. In the literature this combinator is subsumed under the term. Since `appr` applies the right argument it represents the right section:

```Javascript
const sub = x => y => x - y,
  sub2 = sub(2),
  sub2_ = appr(sub, 2);

sub2(5); // -3
sub2_(5); // 3
```
The second application yields a more intuitive result.

#### Ternary combinators with one function argument

`curry = f => x => y => f(x, y)`
`uncurry = f => (x, y) => f(x) (y)`
`flip = f => y => x => f(x) (y)`

I talked about these combinators in a previous chapter. Please look it up for more information on applying them.

#### Ternary combinators with two function arguments

`comp = f => g => x => f(g(x))`
`pipe = g => f => x => f(g(x))`

Function composition is covered in a previous chapter of this course so I am going to leave out details in this section. Please note though that `comp` implements the functor of the function type. Functors are a very fundamental structure in functional programming.

`ap = f => g => x => f(x) (g(x))`

`ap` implements the applicative functor interface of the function type. As the name implies applicatives are also functors, but more general ones. `ap` allows us to apply an n-ary function to the results of n unary functions.

The combinator is rarely used for the function type but we should take the opportunity to familiarize ourselves with the corresponding pattern, because you will frequently encounter it together with other types. Please note that the innermost call is `comp` followed by successive calls to `ap`. This applicative pattern witnesses the close relationship between functors and applicatives:

```Javascript
const ap = f => g => x => f(x) (g(x))
const comp = f => g => x => f(g(x))
const div = x => y => x / y;
const inc = x => x + 1;
const sqr = x => x * x;

const main = ap(
  ap(
    comp(x => y => z =>
      [x, y, z]) (div(9))) (inc)) (sqr);

main(3); // [3, 4, 9]
main(0); // [Infinity, 1, 0]
```

`chain = f => g => x => f(g(x)) (x)`

If we continue the chosen path we inevitably wind up with monads, which represent the most general structure of the three. Monads are implemented by the `chain` combinator. As with applicatives we can apply a n-ary function to the results of n unary functions. But in contrast to applicatives the unary function can depend on the previous value:

```Javascript
const main = chain(x =>
  chain(y =>
    chain(z => w =>
      w === 0
        ? [0, y, z]
        : [x, y, z]) (sqr)) (inc)) (div(9));

main(3); // [3, 4, 9]
main(4); // [0, 1, 0]
```
This seems to be an arbitrary property but as a matter of fact it is a rather important one. It renders monads to an effective tool to chain effects of all sorts. We will learn more about functors, applicatives and monads in later chapters in later chapters of this course.

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

const add = x => y => x + y;

const id = x => x;

const empty = [];

const foldMap = ({fold, append, empty}) => f =>
  fold(comp2nd(append) (f)) (empty);

foldComp = foldMap({fold, append: comp, empty: id});

foldComp(add) ([1, 2, 3]) (100); // 106
```
The reason why we need to compose in the second argument of `append` is that `foldMap` does not depend on a right associative fold but on a left associative one. As you may know both folds differ in the order the accumulator `acc` and the current element `x` is provided to the algebra `f`.

`compBin = f => g => x => y => f(g(x) (y))`

With `compBin` both function arguments can be a binary function:

```Javascript
const compBin = f => g => x => y => f(g(x) (y));
const add = x => y => x + y;

compBin(sqr) (add) (2) (3); // 25
```
`compOn = f => g => x => y => f(g(x)) (g(y))`

One of the main use cases of `compOn` are sorting algorithms of compound values, where the order is determined by an element of the overall value:

```Javascript
const compOn = f => g => x => y => f(g(x)) (g(y));

const sortBy = f => xs =>
  [...xs].sort((x, y) => f(x) (y));

const compare = x => y =>
  x < y ? -1
    : x > y ? 1
    : 0;

const fst = ([x, y]) => x;

sortBy(compOn(compare) (fst)) ([[2, "world"], [4, "!"], [1, "hello"]]);
// [[1, "hello"], [2, "world"], [4, "!"]]
```
#### Quaternary combinators with three function arguments

`lift = f => g => h => x => f(g(x)) (h(x))`

This is the last useful combinator in this series, since we will not look into functions with more than four arguments:

```Javascript
const lift = f => g => h => x => f(g(x)) (h(x));

const get = k => o => o[k];
const getLen = get("length");

const countVowels = s => s.match(/[aeuio]/gi).length
const div = x => y => x / y;

lift(div) (countVowels) (getLen) ("hello world!"); // 0.25
```
Please note that `lift` is just the encoding for the applicative pattern `ap(comp(div) (countVowels)) (getLen) ("hello world!")` I introduced a few paragraphs above.
