/*
                                88                                                    
                                ""              ,d                                    
                                                88                                    
,adPPYba,  ,adPPYba, 8b,dPPYba, 88 8b,dPPYba, MM88MMM 88       88 88,dPYba,,adPYba,   
I8[    "" a8"     "" 88P'   "Y8 88 88P'    "8a  88    88       88 88P'   "88"    "8a  
 `"Y8ba,  8b         88         88 88       d8  88    88       88 88      88      88  
aa    ]8I "8a,   ,aa 88         88 88b,   ,a8"  88,   "8a,   ,a88 88      88      88  
`"YbbdP"'  `"Ybbd8"' 88         88 88`YbbdP"'   "Y888  `"YbbdP'Y8 88      88      88  
                                   88                                                 
                                   88                                                 
*/


/******************************************************************************
*******************************************************************************
*******************************[ DEPENDENCIES ]********************************
*******************************************************************************
******************************************************************************/


import {THUNK} from "./lazyness.js";


/******************************************************************************
*******************************************************************************
**********************************[ GLOBAL ]***********************************
*******************************************************************************
******************************************************************************/


/***[ Constants ]*************************************************************/


export const PREFIX = "$_"; // avoids property name clashes

// validator related

export const CHECK = true; // type validator flag

export const ADT = PREFIX + "adt";
export const ANNO = PREFIX + "anno";

const MAX_COLONS = 80; // limit length of error messages
const MAX_TUPLE = 4;

// treshold of deferring computation to next micro task

const MICROTASK_TRESHOLD = 0.01;

const SAFE_SPACE = "·"; // use within type indentations

// lib related

// JS related

const TAG = Symbol.toStringTag;

const LT = -1;
const EQ = 0;
const GT = 1;

const NOT_FOUND = -1;

const letterA = 97;


/***[ Combinators ]***********************************************************/


const cat = (...lines) => lines.join("");


const extendErrMsg = (lamIndex, argIndex, funAnno, argAnnos, instantiations) => {
  if (lamIndex === null)
    lamIndex = "";

  else
    lamIndex = `in lambda #${lamIndex + 1}\n`;

  if (argIndex === null)
    argIndex = "";

  else
    argIndex = `in argument #${argIndex + 1}\n`;

  if (argAnnos === null)
      argAnnos = "";

  else if (argAnnos.length === 0)
    argAnnos = "original arg: ()\n";

  else
    argAnnos = `original arg: ${argAnnos.join(", ")}\n`;

  if (instantiations.size > 0) {
    const instantiations_ = [];

    instantiations.forEach((v, k) => {
      v.forEach((v_) => {
        instantiations_.push([k, serializeAst(v_.value)]);
      });
    });

    instantiations = "\n" + instantiations_.map(
      ([k, v]) => `${k} ~ ${v}`).join("\n");
  }

  else instantiations = "";

  return cat(
    lamIndex,
    argIndex,
    `original fun: ${funAnno}\n`,
    argAnnos,
    instantiations + "\n");
};


const setNestedMap = (k, k_, v) => m => {
  if (!m.has(k))
    m.set(k, new Map());

  if (!m.get(k).has(k_))
    m.get(k).set(k_, v);

  return m;
};


/******************************************************************************
*******************************************************************************
*********************************[ SUBTYPES ]**********************************
*******************************************************************************
******************************************************************************/


/***[ Argument Types ]********************************************************/


// nullary functions (no arguments)

class Arg0 extends Array {
  constructor() {super(0)}

  get [Symbol.toStringTag] () {
    return "Arg0";
  }
}


// unary functions

class Arg1 extends Array {
  constructor(x) {
    super(1);
    this[0] = x;
  }

  get [Symbol.toStringTag] () {
    return "Arg1";
  }
}


// variadic functions (dynamic argument length)

class Argv extends Array {
  constructor(x) {
    super(1);
    this[0] = x;
  }

  get [Symbol.toStringTag] () {
    return "Argv";
  }
}


// n-ary functions (multi-agrument)

class Args extends Array {
  constructor(n) {
    super(n);
  }

  get [Symbol.toStringTag] () {
    return "Args";
  }

  static fromArr(xs) {
    const ys = new Args(xs.length).fill(null);
    xs.forEach((x, i) => ys[i] = x);
    return ys;
  }
}


// n-ary functions (multi-agrument) with a variadic one as last argument

class Argsv extends Array {
  constructor(n) {
    super(n);
  }

  get [Symbol.toStringTag] () {
    return "Argsv";
  }

  static fromArr(xs) {
    const ys = new Argsv(xs.length).fill(null);
    xs.forEach((x, i) => ys[i] = x);
    return ys;
  }
}


/***[ Kinds ]*****************************************************************/


class HigherKind extends Array {
  constructor(len) {
    super(len);
    
    for (let i = 0; i < len; i++)
      this[i] = null;
  }

  get [Symbol.toStringTag] () {
    return "HigherKind";
  }
}


class Kind extends Array {
  constructor(s) {
    super(1);
    this[0] = s;
  }

  get [Symbol.toStringTag] () {
    return "Kind";
  }
}


class KindArg {
  constructor(x) {
    this.kind = x;
  }

  get [Symbol.toStringTag] () {
    return "KindArg";
  }
}


/***[ Char ]******************************************************************/


export const Char = s => {
  if (CHECK) {
    if (typeof s !== "string" || s.size !== 1)
      throw new TypeError(cat(
        "type mismatch\n",
        "expected: a single character String\n",
        `received: ${introspectDeep({charCode: letterA}) (s)}\n`,
        "while constructing a Char\n"));
  }

  return {
    [TAG]: "Char",
    value: s,
    valueOf: () => s,
    toString: () => s
  }
};


/***[ Natural ]***************************************************************/


export const Nat = n => {
  if (CHECK) {
    if (typeof n !== "number" || n % 1 !== 0 || n < 0)
      throw new TypeError(cat(
        "type mismatch\n",
        "expected: a positive integer-like Number\n",
        `received: ${introspectDeep({charCode: letterA}) (n)}\n`,
        "while constructing a Natural\n"));
  }

  return {
    [TAG]: "Natural",
    value: n,
    valueOf: () => n,
    toString: () => String(n)
  };
};


/***[ Integer ]***************************************************************/


export const Int = n => {
  if (CHECK) {
    if (typeof n !== "number" || n % 1 !== 0)
      throw new TypeError(cat(
        "type mismatch\n",
        "expected: an integer-like Number\n",
        `received: ${introspectDeep({charCode: letterA}) (n)}\n`,
        "while constructing an Integer\n"));
  }

  return {
    [TAG]: "Integer",
    value: n,
    valueOf: () => n,
    toString: () => String(n)
  }
};


/***[ Non-Empty Array ]*******************************************************/


/* The constructor allows creating empty non-empty arrays, because otherwise we
could not use the built-in Array methods. */

export class NEArray extends Array {
  constructor(n) {
    super(n);
  }

  get [Symbol.toStringTag] () {
    return "NEArray";
  }

  static fromArr(xs) {
    const ys = new NEArray(xs.length);
    xs.forEach((x, i) => ys[i] = x);
    return ys;
  }

  static fromRest(...xs) {
    const ys = new NEArray(xs.length);
    xs.forEach((x, i) => ys[i] = x);
    return ys;
  }
}


/***[ Tuple ]*****************************************************************/


/* There is a superordinate tuple constructor for all tuple types only limited
by the lower and upper bound. Each tuple type carries a size property to
determine the specific tuple type. Tuple values are subtypes of arrays but are
sealed. */

export class Tuple extends Array {
  constructor(...args) {
    if (args.length < 2)
      throw new TypeError(cat(
        "invalid Tuple\n",
        "must contain at least 2 fields\n",
        JSON.stringify(args).slice(0, MAX_COLONS),
        "\n"));

    else if (args.length > MAX_TUPLE)
      throw new TypeError(cat(
        "invalid Tuple\n",
        `must contain at most ${MAX_TUPLE} fields\n`,
        JSON.stringify(args).slice(0, MAX_COLONS),
        "\n"));

    else {
      super(args.length);

      args.forEach((arg, i) => {
        this[i] = arg;
      });

      Object.seal(this);
    }
  }

  get [Symbol.toStringTag] () {
    return "Tuple";
  }
}


/******************************************************************************
*******************************************************************************
********************************[ TYPE DICTS ]*********************************
*******************************************************************************
******************************************************************************/


const adtDict = new Map(), // ADT dict Map(tcons => {arity, kind})
  tcDict = new Map(); // type class dict Map(tcons => {arity, kind})


const nativeDict = new Map([ // native type dict Map(tcons => {arity, kind})
  ["Map", {arity: 2, kind: new HigherKind(3).fill(new Kind("*"))}],
  ["Set", {arity: 1, kind: new HigherKind(2).fill(new Kind("*"))}],
  ["Vector", {arity: 1, kind: new HigherKind(2).fill(new Kind("*"))}]]);


const nativeIntrospection = new Map([
  ["Map", (m, state, introspectDeep_) => {
    const ts = new Map();

    for (let [k, v] of m)
      ts.set(introspectDeep_(k), introspectDeep_(v));

    if (ts.size === 0)
      return `Map<${String.fromCharCode(state.charCode++)}, ${String.fromCharCode(state.charCode++)}>`;

    else if (ts.size > 1) {
      const tk = [],
        tv = [];

      ts.forEach((v, k) => {
        if (k.search(new RegExp("[a-z][a-zA-Z0-9]*", "")) === NOT_FOUND)
          tk.push(k);

        if (v.search(new RegExp("[a-z][a-zA-Z0-9]*", "")) === NOT_FOUND)
          tv.push(v);
      })

      if (tk.length > 1)
        throw new TypeError(cat(
          "invalid Map\n",
          "must contain homogeneous keys and values\n",
          "but the following keys received:",
          `${tk.join(", ")}\n`));

      else if (tv.length > 1)
        throw new TypeError(cat(
          "invalid Map\n",
          "must contain homogeneous keys and values\n",
          "but the following values received:",
          `${tv.join(", ")}\n`));

      else return `Map<${tk[0]}, ${tv[0]}>`;
    }

    else return `Map<${Array.from(ts) [0].join(", ")}>`;
  }],

  ["Set", (s, state, introspectDeep_) => {
    const ts = new Set();

    for (let v of s)
      ts.add(introspectDeep_(v));

    if (ts.size === 0)
      return `Set<${String.fromCharCode(state.charCode++)}>`;

    else if (ts.size > 1) {
      const ts_ = []

      ts.forEach(t => {
        if (t.search(new RegExp("[a-z][a-zA-Z0-9]*", "")) === NOT_FOUND)
          ts_.push(t);
      })

      if (ts_.length > 1)
        throw new TypeError(cat(
          "invalid Set\n",
          "must contain homogeneous keys\n",
          "but the following values received:",
          `${ts_.join(", ")}\n`));

      else return `Set<${ts_[0]}>`;
    }

    else return `Set<${Array.from(ts) [0]}>`;
  }],

  ["Vector", (o, state, introspectDeep_) => {
    if (o.length === 0)
      return "Vector<a>";

    else
      return `Vector<${introspectDeep_(o.data.v)}>`;
  }]]);


const monoDict = new Set([ // Tconst register
  "Char",
  "Integer",
  "Natural"]);


/******************************************************************************
*******************************************************************************
************************************[ AST ]************************************
*******************************************************************************
******************************************************************************/


// algebraic data types

const Adt = (cons, body) =>
  ({[Symbol.toStringTag]: Adt.name, cons, body});


const Arr = body =>
  ({[Symbol.toStringTag]: Arr.name, body});


/* During substitution it matters in which position a function argument is
supposed to be substituted. If it is in a codomain position, i.e. in the result
type of a function, the function argument is substituted without additional
parenthesis, whereas in domain position parenthesis are required. `Codomain` is
a constructor that internally denotes a substitution in codomain position. */

const Codomain = (...body) =>
  ({[Symbol.toStringTag]: Codomain.name, body});


/* `Forall` is lexically characterized by round parenthesis. Its usage is
ambiguous. On the one hand it denotes top-level or nested quantifiers and on
the other hand it groups function subterms of a given annotation. In the
latter case the quantifiers has no bound type variables. */

const Forall = (btvs, scope, body) =>
  ({[Symbol.toStringTag]: Forall.name, btvs, scope, body});


const Fun = (lambdas, result) =>
  ({[Symbol.toStringTag]: Fun.name, body: {lambdas, result}});


// Javascript's native exotic object types (e.g. Map, Set)

const Native = (cons, body) =>
  ({[Symbol.toStringTag]: Native.name, cons, body});


// non-empty array

const Nea = body =>
  ({[Symbol.toStringTag]: Nea.name, body});


// Objects implicitly create a self reference to enable method chaining.

const Obj = (cons, props, row, body) => {
  const o = {[Symbol.toStringTag]: Obj.name, cons, props, row, body};
  o.this = o;
  return o;
}


/* `Partial` is used to denote not consumed type parameters of a
partially applied type constructor. */

const Partial = ({[Symbol.toStringTag]: "Partial"});


// `RowType` and `RowVar` encode row polymorphism 

const RowType = body =>
  ({[Symbol.toStringTag]: RowType.name, body});


const RowVar = name =>
  ({[Symbol.toStringTag]: RowVar.name, name});


// `Obj` self refecrence to allow method chaining

const This = (nesting, o) => {
  o[TAG] = This.name;
  o.nesting = nesting;
  return o;
};


// tuples

const Tup = (size, body) =>
  ({[Symbol.toStringTag]: Tup.name, size, body});


// type constant

const Tconst = name =>
  ({[Symbol.toStringTag]: Tconst.name, name});


/***[ Type Variables ]********************************************************/


const BoundTV = (name, scope, position, body) =>
  ({[Symbol.toStringTag]: BoundTV.name, name, scope, position, body});


const MetaTV = (name, scope, position, body) => // a.k.a. flexible type variable
  ({[Symbol.toStringTag]: MetaTV.name, name, scope, position, body});


const RigidTV = (name, scope, position, body) => // a.k.a. skolem constant
  ({[Symbol.toStringTag]: RigidTV.name, name, scope, position, body});


/******************************************************************************
********************************[ COMBINATORS ]********************************
******************************************************************************/


// get the arity of the type constructor argument

const determineArity = ast => {
  switch (ast[TAG]) {
    case "Fun": {
      return ast.body.lambdas.reduce((acc, args) => {
        switch (args[TAG]) {
          case "Arg0": return acc;
          case "Arg1": return acc + 1;

          case "Args":
          case "Argsv":
          case "Argv": return acc + args.length;

          default: throw new TypeError(
            "internal error: argument list constructor expected @determineArity");
        }
      }, 1);
    }

    default: {
      if ("body" in ast) {
        if ("length" in ast.body)
          return ast.body.length;

        else
          return 1;
      }

      else
        return 0;
    }
  }
};


const extractAst = ast => {
  if (ast[TAG] === "Forall")
    ast = ast.body;

  const [r1tvs, rntvs] = reduceAst(([r1tvs_, rntvs_], ast_) => {
    if (ast_[TAG] === "Forall") {
      if (ast_.scope === "") // synthactic grouping
        return [r1tvs_, rntvs_];

      else { // quantifier
        for (const btv of ast_.btvs)
          rntvs_.add(`${ast_.scope}:${btv}`);

        return [r1tvs_, rntvs_];
      }
    }

    else if (isTV(ast_))
      return [r1tvs_.set(`${ast_.scope}:${ast_.name}`, ast_.name), rntvs_];

    else return [r1tvs_, rntvs_];
  }, [new Map(), new Set()]) (ast);

  if (r1tvs.size > 0) {
    const r1tvs_ = new Map([...r1tvs].filter(([k, v]) => !rntvs.has(k)));

    const ast__ = mapAst(ast_ => {
      if (isTV(ast_)
        && r1tvs_.has(`${ast_.scope}:${ast_.name}`)) {
          ast_.scope = ".";
          return ast_;
      }

      else return ast_;
    }) (ast);

    return Forall(
      [...r1tvs_].reduce((acc, [k, v]) => acc.add(v), new Set()),
      ".",
      ast__);
  }

  else if (ast[TAG] === "Fun")
    return Forall(new Set(), "", ast);

  else return ast;
};


const getRank = scope =>
  scope.split(/\./).length - 1;


/* Determine whether the first scope is a parent or the same as the second one. */

const isParentScope = (parentScope, childScope) =>
  childScope.split(/\./).length >= parentScope.split(/\./).length
    && childScope.search(parentScope) === 0;


const isTV = ast => {
  switch (ast[TAG]) {
    case "BoundTV":
    case "MetaTV":
    case "RigidTV": return true;
    default: return false;
  }
};


const mapAst = f => {
  const go = ast => {
    switch (ast[TAG]) {
      case "Adt": return f(
        Adt(
          ast.cons,
          ast.body.map(go)));

      case "Arg0": return new Arg0();
      case "Arg1": return new Arg1(go(ast[0]));
      case "Args": return Args.fromArr(ast.map(go));
      case "Argsv": return Argsv.fromArr(ast.map(go));
      case "Argv": return new Argv(go(ast[0]));
      case "Arr": return f(Arr(go(ast.body)));

      case "BoundTV":
        return f(
          BoundTV(
            ast.name,
            ast.scope,
            ast.position,
            ast.body.map(go)));

      case "Forall":
        return f(
          Forall(
            ast.btvs,
            ast.scope,        
            go(ast.body)));

      case "Fun":
        return f(
          Fun(
            ast.body.lambdas.map(go),
            go(ast.body.result)));
      
      case "MetaTV":
        return f(
          MetaTV(
            ast.name,
            ast.scope,
            ast.position,
            ast.body.map(go)));

      case "Native": return f(
        Native(
          ast.cons,
          ast.body.map(go)));

      case "Nea": return f(Nea(go(ast.body)));
      
      case "Obj": return f(
        Obj(
          ast.cons,
          ast.props,
          ast.row,
          ast.body.map(({k, v}) => ({k, v: go(v)}))));

      case "Partial": return f(Partial);

      case "RigidTV":
        return f(
          RigidTV(
            ast.name,
            ast.scope,
            ast.position,
            ast.body.map(go)));

      case "Tconst": return f(Tconst(ast.name));
      
      case "This": {
        if (ast.nesting === 0)
          return f(This(ast.nesting, {body: go(ast.body)}));

        else return ast;
      }

      case "Tup": return f(Tup(
        ast.size,
        ast.body.map(go)));

      default: throw new TypeError(
        "internal error: unknown value constructor @mapAst");
    }
  };

  return go;
};


/* If a subtree of an AST is extratced it might contain redundant `Forall`
elements, which need to be deleted. Instead of traversing the tree and
conducting the necessary transfomrations we just recreate the AST. */

const recreateAst = ast =>
  parseAnno(new Map()) (serializeAst(ast))


const reduceAst = (f, init) => {
  const go = (acc, ast) => {
    switch (ast[TAG]) {
      case "Adt": return f(ast.body.reduce((acc_, field) =>
        go(acc_, field), acc), ast);

      case "Arg0": return acc;
      
      case "Arg1":
      case "Argv": return go(acc, ast[0]);
      
      case "Args":
      case "Argsv": return ast.reduce(
        (acc_, arg) => go(acc_, arg), acc);
      
      case "Arr": return f(go(acc, ast.body), ast);
      
      case "BoundTV":
        return ast.body.length === 0
          ? f(acc, ast)
          : f(ast.body.reduce(
              (acc_, field) => go(acc_, field), acc), ast);
      
      case "Forall": return f(go(acc, ast.body), ast);
      
      case "Fun": {
        acc = ast.body.lambdas.reduce((acc_, lambda) =>
          go(acc_, lambda), acc);

        return f(go(acc, ast.body.result), ast);
      }
      
      case "MetaTV":
        return ast.body.length === 0
          ? f(acc, ast)
          : f(ast.body.reduce(
              (acc_, field) => go(acc_, field), acc), ast);

      case "Native": return f(ast.body.reduce((acc_, field) =>
        go(acc_, field), acc), ast);

      case "Nea": return f(go(acc, ast.body), ast);
      
      case "Obj": return f(ast.body.reduce((acc_, {k, v}) =>
        go(acc_, v), acc), ast);

      case "Partial": return f(acc, ast);
      
      case "RowType": return f(ast.body.reduce((acc_, {k, v}) =>
        go(acc_, v), acc), ast);

      case "RowVar": return f(acc, ast);

      case "RigidTV":
        return ast.body.length === 0
          ? f(acc, ast)
          : f(ast.body.reduce(
              (acc_, field) => go(acc_, field), acc), ast);
      
      case "Tconst": return f(acc, ast);

      case "This": {
        if (ast.nesting === 0)
          return f(go(acc, ast.body), ast);

        else return acc;
      }
      
      case "Tup": return f(ast.body.reduce((acc_, field) =>
        go(acc_, field), acc), ast);

      default: throw new TypeError(
        "internal error: unknown value constructor @reduceAst");
    }
  };

  return ast => go(init, ast);
};


/* Removes the leftmost formal parameter of a function type after it was applied
to an argument type. */

const remParams = ast => {

  // the function returns the result value

  if (ast.body.body.lambdas.length === 1)
    return ast.body.body.result;

  // the function returns another one expecting more arguments

  else
    return Forall(
      new Set(),
      ".",
      Fun(
        ast.body.body.lambdas.slice(1),
        ast.body.body.result));
};


// remove the optional top-level quantifier of a function type

const remQuant = anno => {
  if (anno === "()")
    return anno;

  else if (anno[0] !== "(" || anno[anno.length - 1] !== ")")
    return anno;

  else
    return anno.replace(new RegExp("^\\((?:\\^[^.]+\\. )?", ""), "")
      .replace(/\)$/, "");
};


/******************************************************************************
*******************************************************************************
*******************************[ KIND CHECKING ]*******************************
*******************************************************************************
******************************************************************************/


const inferHigherOrderKinds = kindMap => ast => {
  let kindParams, kindArgs, loop = false;

  switch (ast[TAG]) {
    case "Adt": {
      kindParams = adtDict.has(ast.cons)
        ? adtDict.get(ast.cons).kind
        : tcDict.get(ast.cons).kind;

      kindArgs = ast.body.reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        const [kindArg, loop_] = inferHigherOrderKind(kindMap, false) (ast_);
        loop = loop || loop_;
        return acc.concat(kindArg);
      }, []);

      break;
    }

    case "Arr":
    case "Nea": {
      kindParams = inferFirstOrderKind(ast);

      kindArgs = [ast.body].reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        const [kindArg, loop_] = inferHigherOrderKind(kindMap, false) (ast_);
        loop = loop || loop_;
        return acc.concat(kindArg);
      }, []);

      break;
    }

    case "BoundTV": {
      kindParams = kindMap.has(`${ast.scope}:${ast.name}`)
        ? kindMap.get(`${ast.scope}:${ast.name}`)
        : inferFirstOrderKind(ast);

      kindArgs = ast.body.reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        const [kindArg, loop_] = inferHigherOrderKind(kindMap, false) (ast_);
        loop = loop || loop_;
        return acc.concat(kindArg);
      }, []);

      break;
    }

    case "Fun": {
      kindParams = inferFirstOrderKind(ast);

      kindArgs = ast.body.lambdas.reduce((acc, args) => {
        return args.reduce((acc_, ast_) => {
          if (ast_[TAG] === "Forall")
            ast_ = ast_.body;

          const [kindArg, loop_] = inferHigherOrderKind(kindMap, false) (ast_);
          loop = loop || loop_;
          return acc_.concat(kindArg);
        }, acc)
      }, []);

      kindArgs = [ast.body.result].reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        const [kindArg, loop_] = inferHigherOrderKind(kindMap, loop) (ast_);
        loop = loop || loop_;
        return acc.concat(kindArg);
      }, kindArgs);

      break;
    }

    case "Native": {
      kindParams = nativeDict.get(ast.cons).kind;

      kindArgs = ast.body.reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        const [kindArg, loop_] = inferHigherOrderKind(kindMap, false) (ast_);
        loop = loop || loop_;
        return acc.concat(kindArg);
      }, []);

      break;
    }

    case "Obj": {
      kindParams = inferFirstOrderKind(ast);

      kindArgs = ast.body.reduce((acc, {k, v}) => {
        if (v[TAG] === "Forall")
          v = v.body;

        const [kindArg, loop_] = inferHigherOrderKind(kindMap, false) (v);
        loop = loop || loop_;
        return acc.concat(kindArg);
      }, []);

      break;
    }

    case "Tconst":
      return [kindMap, loop];

    case "Tup": {
      kindParams = inferFirstOrderKind(ast);

      kindArgs = ast.body.reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        const [kindArg, loop_] = inferHigherOrderKind(kindMap, false) (ast_);
        loop = loop || loop_;
        return acc.concat(kindArg);
      }, []);

      break;
    }

    default: throw new TypeError(
      "internal error: value constructor expected @inferHigherOrderKinds");
  }

  if (kindArgs.length === 0) {
    if (kindParams.length === 1
      && kindParams.join("") === "*")
        return [kindMap, loop];

    else throw new TypeError(cat(
      `kind mismatch for "${serializeAst(ast)}"\n`,
      `expected: ${serializeKind(0) (kindParams)}\n`,
      `received: ${serializeKinds(kindArgs)}\n`));
  }

  else {
    kindArgs = kindArgs.map(({kind}) => kind);

    /*kindArgs = kindArgs.length > 1
      ? new HigherKind(kindArgs.length)
          .fill(null)
          .map((_, i) => kindArgs[i].kind)
      : kindArgs[0].kind;*/

    if (compareKinds(serializeKind(0) (kindParams)) (serializeKinds(kindArgs)) === "gt"
      && kindParams.length - kindArgs.length === 1
      && kindParams[kindParams.length - 1].join("") === "*")
        return [kindMap, loop];

    else throw new TypeError(cat(
      `kind mismatch for "${serializeAst(ast)}"\n`,
      `expected: ${serializeKind(0) (kindParams)}\n`,
      `received: ${serializeKinds(kindArgs)}\n`));
  }
};


const inferHigherOrderKind = (kindMap, loop) => ast => {
  let kindParams, kindArgs;

  switch (ast[TAG]) {
    case "Adt":
    case "Arr":
    case "BoundTV":
    case "Native":
    case "Nea":
    case "Tup": {
      kindParams = ast[TAG] === "BoundTV"
        ? kindMap.get(`${ast.scope}:${ast.name}`)
        : inferFirstOrderKind(ast);

      if (Array.isArray(ast.body)
        && ast.body.length === 0)
          return [new KindArg(kindParams), loop];

      kindArgs = (Array.isArray(ast.body) ? ast.body : [ast.body]).reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        switch (ast_[TAG]) {
          case "Adt":
          case "Arr":
          case "Fun":
          case "Nea":
          case "Native":
          case "Obj":
          case "Tup": {
            const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (ast_);
            loop = loop_;
            return acc.concat(kindArgs_);
          }

          case "BoundTV": {
            if (ast_.body.length === 0) {
              const kindArg_ = kindMap.get(`${ast_.scope}:${ast_.name}`);
              return acc.concat(new KindArg(kindArg_));
            }

            else {
              const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (ast_);
              loop = loop_;
              return acc.concat(kindArgs_);
            }
          }

          case "Partial": return acc;

          case "This":
          case "Tconst": return acc.concat(new KindArg(new Kind("*")));

          default: throw new TypeError(
            "internal error: unknown value constructor @inferHigherOrderKind");
        }
      }, []);

      break;
    }

    case "Fun": {
      kindParams = inferFirstOrderKind(ast);

      kindArgs = ast.body.lambdas.reduce((acc, args) => {
        return args.reduce((acc_, ast_) => {
          if (ast_[TAG] === "Forall")
            ast_ = ast_.body;

          switch (ast_[TAG]) {
            case "Adt":
            case "Arr":
            case "Fun":
            case "Nea":
            case "Native":
            case "Obj":
            case "Tup": {
              const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (ast_);
              loop = loop_;
              return acc_.concat(kindArgs_);
            }

            case "BoundTV": {
              if (ast_.body.length === 0) {
                const kindArg_ = kindMap.get(`${ast_.scope}:${ast_.name}`);
                return acc_.concat(new KindArg(kindArg_));
              }

              else {
                const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (ast_);
                loop = loop_;
                return acc_.concat(kindArgs_);
              }
            }

            case "Partial": return acc_;

            case "This":
            case "Tconst": return acc_.concat(new KindArg(new Kind("*")));

            default: throw new TypeError(
              "internal error: unknown value constructor @inferHigherOrderKind");
          }
        }, acc);
      }, []);

      kindArgs = [ast.body.result].reduce((acc, ast_) => {
        if (ast_[TAG] === "Forall")
          ast_ = ast_.body;

        switch (ast_[TAG]) {
          case "Adt":
          case "Arr":
          case "Fun":
          case "Nea":
          case "Native":
          case "Obj":
          case "Tup": {
            const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (ast_);
            loop = loop_;
            return acc.concat(kindArgs_);
          }

          case "BoundTV": {
            if (ast_.body.length === 0) {
              const kindArg_ = kindMap.get(`${ast_.scope}:${ast_.name}`);
              return acc.concat(new KindArg(kindArg_));
            }

            else {
              const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (ast_);
              loop = loop_;
              return acc.concat(kindArgs_);
            }
          }

          case "Partial": return acc;

          case "This":
          case "Tconst": return acc.concat(new KindArg(new Kind("*")));

          default: throw new TypeError(
            "internal error: unknown value constructor @inferHigherOrderKind");
        }
      }, kindArgs);

      break;
    }

    case "Obj": {
      kindParams = inferFirstOrderKind(ast);

      kindArgs = ast.body.reduce((acc, {k, v}) => {
        if (v[TAG] === "Forall")
          v = v.body;

        switch (v[TAG]) {
          case "Adt":
          case "Arr":
          case "Fun":
          case "Nea":
          case "Native":
          case "Obj":
          case "Tup": {
            const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (v);
            loop = loop_;
            return acc.concat(kindArgs_);
          }

          case "BoundTV": {
            if (v.body.length === 0) {
              const kindArg_ = kindMap.get(`${v.scope}:${v.name}`);
              return acc.concat(new KindArg(kindArg_));
            }

            else {
              const [kindArgs_, loop_] = inferHigherOrderKind(kindMap, loop) (v);
              loop = loop_;
              return acc.concat(kindArgs_);
            }
          }

          case "Partial": return acc;

          case "This":
          case "Tconst": return acc.concat(new KindArg(new Kind("*")));

          default: throw new TypeError(
            "internal error: unknown value constructor @inferHigherOrderKind");
        }
      }, []);

      break;
    }

    case "Tconst":
      return [new KindArg(new Kind("*")), loop];

    default: throw new TypeError(
      "internal error: unknown value constructor @inferHigherOrderKind");
  }

  kindArgs.forEach(({kind: kindArg}, i) => {
    switch (compareKinds(serializeKind(0) (kindParams[i])) (serializeKind(0) (kindArg))) {
      case "eq": {
        break;
      }

      case "lt": {
        if (ast[TAG] === "BoundTV") {
          if (i in ast.body && ast.body[i] [TAG] !== "BoundTV")
            throw new TypeError(cat(
              `kind mismatch for "${serializeAst(ast)}"\n`,
              `expected: ${serializeKind(0) (kindParams[i])}\n`,
              `received: ${serializeKind(0) (kindArg)}\n`,
              `while kind checking "${serializeKind(0) (kindParams)}"\n`));

          else {
              kindMap.set(
                `${ast.scope}:${ast.name}`,
                adjustKind(kindArg, i)
                  (kindMap.get(`${ast.scope}:${ast.name}`)));

              loop = true;
              break;
          }
        }

        else if (ast[TAG] === "Adt"
          && kindParams[i] [0] === "") {
            if (adtDict.has(ast.cons)) {
              const o = adtDict.get(ast.cons);
              o.kind[i] = kindArg;
              adtDict.set(ast.cons, o);
            }

            else if (tcDict.has(ast.cons)) {
              const o = tcDict.get(ast.cons);
              o.kind[i] = kindArg;
              tcDict.set(ast.cons, o);
            }

            else throw new TypeError(
              "internal error: unknown ADT @inferHigherOrderKind");

            loop = true;
            break;
        }

        else throw new TypeError(cat(
          `kind mismatch for "${serializeAst(ast)}"\n`,
          `expected: ${serializeKind(0) (kindParams[i])}\n`,
          `received: ${serializeKind(0) (kindArg)}\n`,
          `while kind checking "${serializeKind(0) (kindParams)}"\n`));
      }

      case "gt": {
        if (ast[TAG] === "BoundTV"
          && ast.body[i] [TAG] === "BoundTV") {
            kindMap.set(
              `${ast.body[i].scope}:${ast.body[i].name}`,
              adjustKind(kindParams[i], i)
                (kindMap.get(`${ast.body[i].scope}:${ast.body[i].name}`)));

            loop = true;
            break;
        }

        else if (ast[TAG] === "Adt"
          && ast.body[i] [TAG] === "BoundTV") {
            kindMap.set(
              `${ast.body[i].scope}:${ast.body[i].name}`,
              adjustKind(kindParams[i], i)
                (kindMap.get(`${ast.body[i].scope}:${ast.body[i].name}`)));

            loop = true;
            break;
        }

        else throw new TypeError(cat(
          `kind mismatch for "${serializeAst(ast)}"\n`,
          `expected: ${serializeKind(0) (kindParams[i])}\n`,
          `received: ${serializeKind(0) (kindArg)}\n`,
          `while kind checking "${serializeKind(0) (kindParams)}"\n`));
      }

      case "neq": throw new TypeError(cat(
        `kind mismatch for "${serializeAst(ast)}"\n`,
        `expected: ${serializeKind(0) (kindParams[i])}\n`,
        `received: ${serializeKind(0) (kindArg)}\n`,
        `while kind checking "${serializeKind(0) (kindParams)}"\n`));

      default: throw new TypeError(
        "internal error: unknown constructor @inferHigherOrderKind");
    }
  });

  if (kindArgs.length === 0)
    return [[new KindArg(kindParams)], loop];

  else {
    const kindParams_ = kindParams.slice(kindArgs.length);

    return kindParams_.length === 1
      && kindParams_[TAG] === "HigherKind"
        ? [[new KindArg(kindParams_[0])], loop]
        : [[new KindArg(kindParams_)], loop]
  }
};

const adjustKind = (kindNew, i) => kind => {
  if (kind.length === 1)
    kind = kindNew;
  
  else if (i === kind.length - 1)
    kind = kind.slice(0, -1).concat(kindNew);

  else kind[i] = kindNew.concat();

  return kind;
};


const alignArities = kindMap => mapAst(ast => {
  if (ast[TAG] === "BoundTV") {
    const nominalArity = kindMap.get(`${ast.scope}:${ast.name}`).length - 1,
      actualArity = ast.body.length;

    if (nominalArity !== actualArity)
      ast.body = Object.assign(
        Array(nominalArity).fill(Partial), ast.body);

    return ast;
  }

  else return ast;
});


const compareKinds = kindParamStr => kindArgStr => {
  if (kindParamStr.length < kindArgStr.length) {
    if (kindArgStr.search(new RegExp(kindParamStr.replace(/[*?()]/g, "\\$&"))) === 0)
      return "lt";

    else return "neq";
  }

  else if (kindParamStr.length > kindArgStr.length) {
    if (kindParamStr.search(new RegExp(kindArgStr.replace(/[*?()]/g, "\\$&"))) === 0)
      return "gt";

    else return "neq";
  }

  else if (kindParamStr === kindArgStr)
    return "eq";

  else return "neq";
};


const inferFirstOrderKind = ast => {
  switch (ast[TAG]) {
    case "Adt": {
      if (adtDict.has(ast.cons))
        return adtDict.get(ast.cons).kind;

      else if (tcDict.has(ast.cons))
        return tcDict.get(ast.cons).kind;

      else if (nativeDict.has(ast.cons))
        return nativeDict.get(ast.cons).kind;

      else throw new TypeError(
        "internal error: missing ADT/TC entry @inferFirstOrderKind");
    }

    case "Arr":
    case "BoundTV":
    case "Fun":
    case "Nea":
    case "Obj":
    case "Tup":
    case "Tconst": {
      const arity = determineArity(ast);

      if (arity === 0)
        return new Kind("*");

      else
        return new HigherKind(arity + 1).fill(new Kind("*"));
    }

    case "Native":
      return nativeDict.get(ast.cons).kind;

    default: throw new TypeError(
      `internal error: unknown value constructor @inferFirstOrderKind`);
  }
};


const inferFirstOrderKinds = init => ast => {
  if (ast[TAG] === "Adt" || ast[TAG] === "Native") {
    const kind = adtDict.has(ast.cons) ? adtDict.get(ast.cons).kind
      : tcDict.has(ast.cons) ? tcDict.get(ast.cons).kind
      : nativeDict.get(ast.cons).kind;

    const kindMap = kind.slice(0, -1).reduce((acc, kind_, i) => {
      const ast_ = ast.body[i];

      if (ast_[TAG] === "BoundTV")
        acc.set(`${ast_.scope}:${ast_.name}`, kind_);

      return acc;
    }, init);

    return kindMap;
  }

  return reduceAst((acc, ast_) => {
    if (ast_[TAG] === "BoundTV") {
      if (acc.has(`${ast_.scope}:${ast_.name}`)) {
        if (ast_.body.length > acc.get(`${ast_.scope}:${ast_.name}`).length - 1)
          return acc.set(`${ast_.scope}:${ast_.name}`, new HigherKind(ast_.body.length + 1).fill(new Kind("*")));

        else return acc;
      }

      else {
        if (ast_.body.length === 0)
          return acc.set(`${ast_.scope}:${ast_.name}`, new Kind("*"));

        else
          return acc.set(`${ast_.scope}:${ast_.name}`, new HigherKind(ast_.body.length + 1).fill(new Kind("*")));
      }
    }

    else return acc;
  }, init) (ast);
};


/*const serializeKind = kind => {
  return kind.map((kind_, i) => {
    if (kind_.length === 0)
      return kind_;

    else if (kind_.length === 1)
      return kind_[0];

    else {
      if (i === kind.length - 1)
        return serializeKind(kind_);

      else
        return `(${serializeKind(kind_)})`;
    }
  }).join(" -> ");
};*/


const serializeKinds = ks => {
  return ks.map(kind =>
    serializeKind(1) (kind)).join(" -> ");
};


const serializeKind = level => kind => {
  switch (kind[TAG]) {
    case "HigherKind": {
      if (level === 0)
        return `${kind.map(kind_ => serializeKind(level + 1) (kind_)).join(" -> ")}`;
      
      else
        return `(${kind.map(kind_ => serializeKind(level + 1) (kind_)).join(" -> ")})`;
    }
    
    case "Kind": {
      if (kind.length === 0) return "";
      else return kind[0];
    }

    default: throw new TypeError(
      "internal error: kind constructor expected @serializeKind");
  }
};


/******************************************************************************
*******************************************************************************
**********************************[ PARSING ]**********************************
*******************************************************************************
******************************************************************************/


const parseAnno = kindMap => anno => {
  const go = (cs, lamIndex, argIndex, scope, position, context, thisAnno, nesting) => {

    /* The `position` argument denotes whether a function argument is in domain
    or codomain position. Depending on this value a function type is wrapped in
    parenthesis (domain) or not (codomain) during substitution.

    The `context` argument is used to prevent both, impredicative polymorphism
    and function types without a surrounding quantifer/boundaries. The former is
    only allowed on the LHS of the function type. The latter is necessary to
    keep the language syntax simple.

    The `thisAnno` and `nesting` arguments are required to handle `this*`
    annotations. The former holds the entire object annotation `this*` refers
    to and the latter prevents the parser to get stuck in an infinite loop
    while parsing `this*`. */

    /* Annotation might contain type constructors whose type parameters are not
    fully specified, i.e. not fully applied. This is only possible for these
    type constructors that are themselves passed as a type parameter to another
    type constructor. During the parse process all arities can be eventually
    restored and missing type parameters are denoted as `__` in the resulting
    ASTs.

    Partially applied type constructors are recognized during kind checking.
    Tuples require a special syntax in this regard to avoid ambiguities. Objects
    cannot be partially applied, because they don't have a fix property order.
    The following examples list partially applied type constructors:

    ADT: Either / Either<foo> / Either<foo, bar>
    Array/NEArray: [] / [1] / [foo] / [1foo]
    binary Function: (=>) / (foo =>) / (foo, bar =>) / (foo, bar => baz)
    Native: Map / Map<foo> / Map<foo, bar>
    Object: /
    binary polymorphic type cons: t / t<foo> / t<foo, bar>
    pair Tuple: [,] / [foo,] / [foo, bar] but not [, bar] */

    const simplifiedType = remNestings(cs);
    let rx;

    // Fun

    if (simplifiedType.search(new RegExp("( |^)=>( |$)", "")) !== NOT_FOUND) {

      /* Every function type must be wrapped in parenthesis except for top-level
      functions, because at the top-level parenthesis are implicit. */

      if (context !== "" && context.split(/\//).slice(-1) [0] !== "Forall")
        throw new TypeError(cat(
          "malformed type annotation\n",
          `function type must be wrapped in "()"\n`,
          `but found "${cs}"\n`,
          `inside context "${context.split(/\//).slice(-1) [0]}"\n`,
          `in "${anno}"\n`));

      // check for invalid partially applied constructors
      
      else if (cs.search(/^=>./) !== NOT_FOUND) 
        throw new TypeError(cat(
          "malformed type annotation\n",
          "invalid partially applied type constructor\n",
          "partial application goes from right to left\n",
          `but "${cs}" received\n`,
          `in "${anno}"\n`));

      // check if the type constructor is not yet applied

      else if (cs.search(/^=>$/) !== NOT_FOUND)
        return Fun([Partial], Partial);

      // consider partially applied Function

      else if (cs.search(/^=|>$/) !== NOT_FOUND)
        cs = cs.replace(/^=>/, "__ =>")
          .replace(/=>$/, "=> __");
            
      // split argument type(s) from result type

      const init = splitByPattern(/ => /, 4, remNestings(cs)) (cs),
        last = init.pop();

      // checks for variadic arguments in the result

      if (last.search(/^\.\./) !== NOT_FOUND)
        throw new TypeError(cat(
          "malformed type annotation\n",
          `illegal variadic syntax "${cs}"\n`,
          "at the result type\n",
          `in "${anno}"\n`));

      // create the AST element

      return Fun(

        // map over the arguments

        init.map((ds, i) => {
          
          // no-argument

          if (ds === "()")
            return new Arg0();

          else {

            // simplify syntax by removing nested structures

            const args = splitByPattern(/, /, 2, remNestings(ds)) (ds);

            // single parameter

            if (args.length === 1) {

              // normal parameter

              if (args[0].search(/^\.\./) === NOT_FOUND)
                return new Arg1(go(args[0], i, 0, scope, "domain", context + "/Function", thisAnno, nesting));

              // variadic parameter

              else
                return new Argv(go(args[0].slice(2), i, 0, scope, "domain", context + "/Function", thisAnno, nesting));
            }

            // multi parameter

            else {

              // rule out invalid variadic parameters

              args.forEach((arg, i) => {
                if (arg.search(/\.\./) !== NOT_FOUND && i < args.length - 1)
                  throw new TypeError(cat(
                    "malformed type annotation\n",
                    `illegal variadic argument "${cs}"\n`,
                    `at lambda #${lamIndex + 1} argument #${i + 1}\n`,
                    `in "${anno}"\n`));
              });

              // regular multi parameter

              if (args[args.length - 1].search(/\.\./) === NOT_FOUND)
                return Args.fromArr(
                  args.map((arg, j) => go(arg, i, j, scope, "domain", context + "/Function", thisAnno, nesting)));

              // multi parameter with trailing variadic one

              else return Argsv.fromArr(
                args.map((arg, j) => 
                  j === args.length - 1
                    ? go(arg.slice(2), i, j, scope, "domain", context + "/Function", thisAnno, nesting)
                    : go(arg, i, j, scope, "domain", context + "/Function", thisAnno, nesting)));
            }
          }
        }),

        // parse the result type

        go(last, -1, -1, scope, "codomain", context + "/Function", thisAnno, nesting));
    }

    // ADT/TC

    else if (adtDict.has((cs.match(new RegExp("^[A-Z][a-zA-Z0-9]*", "")) || [""]) [0])
      || tcDict.has((cs.match(new RegExp("^[A-Z][a-zA-Z0-9]*", "")) || [""]) [0])) {

        const dictRef = adtDict.has(cs.match(new RegExp("^[A-Z][a-zA-Z0-9]*", "")) [0])
          ? adtDict : tcDict;

        /* Check if the ADT is not yet applied or has no type parameters at all.
        Since ADT type constructor arity is hold in a map, we can restore it in
        place. */

        if (cs.search(/</) === NOT_FOUND)
          return Adt(cs, Array(dictRef.get(cs).arity).fill(Partial));

        else {

          // parse the type constructor components

          rx = cs.match(new RegExp("^(?<cons>[A-Z][A-Za-z0-9]*)<(?<fields>.+)>$", ""));

          // split type parameters

          let fields = splitByPattern(
            /, /, 2, remNestings(rx.groups.fields)) (rx.groups.fields);

          // check if parameter number corresponds with the stored arity

          if (fields.length > dictRef.get(rx.groups.cons).arity)
            throw new TypeError(cat(
              "malformed type annotation\n",
              `type constructor arity mismatch\n`,
              `defined type parameters: ${dictRef.get(rx.groups.cons).arity}\n`,
              `received type arguments: ${fields.length}\n`,
              `in "${anno}"\n`));

          // consider partially applied ADT

          else if (dictRef.get(rx.groups.cons).arity > fields.length)
            fields = Object.assign([],
              Array(dictRef.get(rx.groups.cons).arity).fill("__"),
              fields);

          // create the AST element

          return Adt(
            rx.groups.cons,
            fields.map(field =>
              go(field, lamIndex, argIndex, scope, "", context + `/${rx.groups.cons}`, thisAnno, nesting)));
        }
    }

    // array like

    else if (rx = cs.match(new RegExp("^\\[(?:(?<nea>1))?(?<body>.*)\\]$", ""))) {

      // simplify type

      const scheme = remNestings(rx.groups.body);

      // determine more specific type

      if (scheme.search(/,/) === NOT_FOUND) {

        // consider partially applied Array/NEArray

        if (rx.groups.body === "")
          rx.groups.body = "__";

        // Arr

        if (rx.groups.nea === undefined)
          return Arr(go(rx.groups.body, lamIndex, argIndex, scope, "", context + "/Array", thisAnno, nesting));

        // Nea

        else
          return Nea(go(rx.groups.body, lamIndex, argIndex, scope, "", context + "/NEArray", thisAnno, nesting));
      }

      // Tup

      else {

        // split type parameters

        const fields = splitByPattern(/, /, 2, scheme) (rx.groups.body);

        // consider partially applied ADT

        if (rx.groups.body.search(new RegExp(",(?:,|$)", "")) !== NOT_FOUND)
          rx.groups.body = rx.groups.body
            .replace(/^,/, "__,")
            .replace(/,,/g, ", __, __")
            .replace(/,$/, ", __");

        // create AST element

        return Tup(
          fields.length,
          fields.map(field => go(field, lamIndex, argIndex, scope, "", context + "/Tuple", thisAnno, nesting)));
      }
    }

    // BoundTV

    else if (rx = cs.match(new RegExp("^(?<name>[a-z][A-Za-z0-9]*)$", ""))) {
      let selectedScope = "";

      /* Since scriptum supports higher-rank types we must decuce the scope of
      each TV from its synthactic position within the annotation. Each TV must
      be bound to the nearest scope whose quantifier lists a TV of the same name. */

      for (const locator of rntvs) {
        const [scope_, name] = locator.split(/:/);

        if (name === rx.groups.name
          && isParentScope(scope_, scope)
          && scope_.length > selectedScope.length)
            selectedScope = scope_;
      }

      // fall back to top-level scope

      if (selectedScope === "") {
        selectedScope = ".";

        // register rank-1 TV

        r1tvs.add(rx.groups.name);
      }

      // create the bound TV

      return BoundTV(
        rx.groups.name, selectedScope, position, []);
    }

    // Forall

    else if (rx = cs.match(new RegExp("^\\((?:\\^(?<quant>[^\\.]+)\\. )?(?<body>.+)\\)$", ""))) {

      /* `Forall` elements are created by the parser as soon as the parsing
      process comes across round parenthesis, which have an ambiguous synthactic
      meaning. On the one hand they are used to denote nested, higher-rank
      quantifiers on the left side of a function type. On the other hand they
      are used as synthactic boundaries of the function type. Every function
      type except top-level ones require explicit parenthesis to simply parsing.
      `Forall` elements used as synthactic boundaries don't span their own scope
      and thus don't list any TVs or a specific scope.

      Scope is spanned by a `Forall` AST element. Each TV within this scope that
      is listed in the respective field of the `Forall` quantifier is bound to
      it. The rank of a scope is denoted as `.`. Its position in the parent scope
      is displayed by two digits separated by a slash. The first digit represents
      the index of a (curried) function sequence. The second one represents the
      index of a parameter list. The latter is necessary, because scriptum
      supports multi-argument functions. Here is an example:

      (^f, a. (^r.      (^b.        (b =>   a) => f<     b> =>      r) =>  r) => Coyoneda<f, a>)
        |  |    |         |          |      |     |      |          |      |              |  |
        ^  ^  ^^^^^   ^^^^^^^^^  ^^^^^^^^^  ^     ^  ^^^^^^^^^    ^^^^^  ^^^^^            ^  ^
        .  .  .0/0.   .0/0.0/0.  .0/0.0/0.  .     .  .0/0.0/0.    .0/0.  .0/0.            .  .
      
      */

      // synthactic boundaries of the function type

      if (rx.groups.quant === undefined)
        return Forall(
          new Set(), // empty
          "", // empty
          go(rx.groups.body, 0, 0, scope, "", context + "/Forall", thisAnno, nesting));

      // explicit rank-n quantifier

      else {

        // impredicative polymorphism

        if (context.replace(new RegExp("(?:/Forall)?/Function", "g"), "") !== "")
          throw new TypeError(cat(
            "malformed type annotation\n",
            `higher-rank quantifiers must only occur on the LHS of "=>"\n`,
            `but "${cs}" received\n`,
            "impredicative types are not yet supported\n",
            `inside context: ${context.split(/\//).slice(-1) [0]}\n`,
            `in "${anno}"\n`));

        else {
          const newScope = `${scope}${lamIndex}/${argIndex}.`,
            rntvs_ = new Set(rx.groups.quant.split(", "));

          rntvs_.forEach(rntv_ =>
            rntvs.add(`${newScope}:${rntv_}`));

          return Forall(
            rntvs_,
            newScope,
            go(rx.groups.body, 0, 0, newScope, "", context + "/Forall", thisAnno, nesting));
        }
      }
    }

    // Native

    else if (nativeDict.has((cs.match(new RegExp("^[A-Z][a-zA-Z0-9]*", "")) || [""]) [0])) {

      /* Check if the native type is not yet applied or has no type parameters
      at all. Since native type constructor arity is hold in a map, we can
      restore it in place. */

      if (cs.search(/</) === NOT_FOUND)
        return Native(cs, Array(nativeDict.get(cs).arity).fill(Partial));

      else {

        // parse the type constructor components

        rx = cs.match(new RegExp("^(?<cons>[A-Z][A-Za-z0-9]*)<(?<fields>.+)>$", ""));

        // split type parameters

        let fields = splitByPattern(
          /, /, 2, remNestings(rx.groups.fields)) (rx.groups.fields);

        // check if parameter number corresponds with the stored arity

        if (fields.length > nativeDict.get(rx.groups.cons).arity)
          throw new TypeError(cat(
            "malformed type annotation\n",
            "type constructor arity mismatch\n",
            `expected type parameters: ${nativeDict.get(rx.groups.cons).arity}\n`,
            `received type arguments: ${fields.length}\n`,
            `in "${anno}"\n`));

        // consider partially applied ADT

        else if (nativeDict.get(rx.groups.cons).arity > fields.length)
          fields = Object.assign([],
            Array(nativeDict.get(rx.groups.cons).arity).fill("__"),
            fields);

        // create the AST element

        return Native(
          rx.groups.cons,
          fields.map(field =>
            go(field, lamIndex, argIndex, scope, "", context + `/${rx.groups.cons}`, thisAnno, nesting)));
      }
    }

    // Obj

    else if (cs.search(new RegExp("^(?:[A-Z][A-Za-z0-9]* )?\\{"), "") !== NOT_FOUND) {

      // parse the optional constructor

      const cons = (cs.match(new RegExp("^[A-Z][A-Za-z0-9]*\\b", "")) || [null]) [0],
        ds = cons === null ? cs : cs.slice(cons.length + 1);

      // split properties

      const props = splitByPattern(
        /, /, 2, remNestings(ds.slice(1, -1))) (ds.slice(1, -1));

      // is it an empty object?

      if (props[0] === "") // empty {} | Foo {}
        return Obj(cons, [], null, []);

      // or an empty object with row variable?

      else if (props[0].search(new RegExp("^ \\| [a-z][A-Za-z0-9]*$", "")) === 0) // empty { | row} or Foo { | row}
        return Obj(
          cons,
          [],
          RowVar(props[0].match(new RegExp("(?<= \\| )[a-z][A-Za-z0-9]*$", "")) [0]),
          []);

      // or a regular object including fixed properties

      else {

        // initialize optional row variable

        let row = null

        // does it include a row variable?

        if (remNestings(props[props.length - 1]).search(/ \| /) !== NOT_FOUND) {

          // split row variable

          const [prop, row_] = splitByPattern(
            / \| /, 3, remNestings(props[props.length - 1])) (props[props.length - 1]);

          row = row_;
          props[props.length - 1] = prop;
        }

        // create AST element

        return Obj(
          cons,
          props.map(s => s.match(new RegExp("^([a-z][a-z0-9]*):", "i"), "") [1]),
          row === null ? null : RowVar(row),
          props.map(s => ({
            k: s.match(new RegExp("^([a-z][a-z0-9]*):", "i"), "") [1],
            v: go(s.replace(new RegExp("^[a-z][a-z0-9]*: ", "i"), ""), lamIndex, argIndex, scope, "", context + (cons ? `/${cons}` : "/Object"), cs, nesting)
          })));
      }
    }

    // Partial

    else if (rx = cs.match(/^__$/))
      return Partial;

    // Tcons (polymorphic type constructor)

    else if (rx = cs.match(new RegExp("^(?<name>[a-z][A-Za-z0-9]*)<(?<fields>.*)>$", ""))) {
      
      // split type parameters

      const fields = splitByPattern(
        /, /, 2, remNestings(rx.groups.fields)) (rx.groups.fields);
      
      let selectedScope = "";

      /* Since scriptum supports higher-rank types we must resolve the scope of
      each type constructor from its synthactic position within the annotation. */

      for (const locator of rntvs) {
        const [scope_, name] = locator.split(/:/);

        if (name === rx.groups.name
          && isParentScope(scope_, scope)
          && scope_.length > selectedScope.length)
            selectedScope = scope_;
      }

      // fall back to top-level scope

      if (selectedScope === "") {
        selectedScope = ".";

        // register rank-1 TV

        r1tvs.add(rx.groups.name);
      }

      // create the higher-kinded bound TV

      return BoundTV(
        rx.groups.name,
        selectedScope,
        position,
        fields.map(field =>
          go(field, lamIndex, argIndex, scope, "", context + "/polyTypeCons", thisAnno, nesting)));
    }

    // Tconst

    else if (rx = cs.match(new RegExp("^[A-Z][A-Za-z0-9]*$")))
      return Tconst(cs);

    // this*

    else if (rx = cs.search(/this\*/) !== NOT_FOUND) {
      if (thisAnno === null)
        throw new TypeError(cat(
          "malformed type annotation\n",
          `"this*" must refer to an object but no one in scope\n`,
          anno === cs ? "" : `in "${anno}"\n`));

      return This(nesting, {
        get body() {
          const thisAst = go(thisAnno, lamIndex, argIndex, scope, "", context, thisAnno, nesting + 1);
          delete this.body;
          return this.body = thisAst;
        }
      });
    }

    // TypeError

    else
      throw new TypeError(cat(
        "malformed type annotation\n",
        `unexpected token "${cs}"\n`,
        anno === cs ? "" : `in "${anno}"\n`));
  };

  const r1tvs = new Set(),
    rntvs = new Set();

  // verify basic syntax rules of passed annotation

  verifyAnno(anno);

  // remove optional top-level parenthesis

  anno = remQuant(anno);

  // parse the annotation

  const ast = go(anno, 0, 0, ".", "", "", null, 0);

  /* During kind checking all partially applied type constructors are
  determined, no matter if they are mono- or polymorphic. The correct arity of
  every type constructor is restored as per their kinds. */

  let loop = false;

  kindMap = inferFirstOrderKinds(kindMap) (ast);

  do {
    if (ast[TAG] === "Forall") ast = ast.body;
    ([kindMap, loop] = inferHigherOrderKinds(kindMap) (ast));
  } while (loop)

  const finalAst = alignArities(kindMap) (ast);

  // if the AST includes type variables we need a quantifier

  if (r1tvs.size > 0)
    return Forall(r1tvs, ".", finalAst);

  /* If the topmost level of the AST is a function type, we need synthactic,
  boundaries using round parenthesis. For the sake of simplicity we use the
  empty `Forall` element without bound TVs and scope. Please recall that
  function types always needs to be surrounded by round parenthesis to keep
  the syntax simple. */

  else if (finalAst[TAG] === "Fun")
    return Forall(new Set(), ".", finalAst);

  else return finalAst;
};


// verifies the provided annotation using basic synthactic rules

const verifyAnno = s => {
  const scheme = remNestings(s);

  // prevent invalid chars

  if (s.search(new RegExp("[^a-z0-9(){}\\[\\]<>=:,\\| \\.\\^\\*]", "i")) !== NOT_FOUND) {
    const invalidChars = s.replace(new RegExp("[a-z(){}\\[\\]<>=:,1\\| \\.\\^]", "gi"), "");

    throw new TypeError(cat(
      "malformed type annotation\n",
      "illegal characters\n",
      `namely: ${invalidChars}\n`,
      `in "${s}"\n`));
  }

  // rule out Haskell style function types

  else if (s.search(/->/) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `"=>" denotes function types\n`,
      `but Haskell's "->" received\n`,
      `in "${s}"\n`));

  // ensure balanced bracket nesting

  else if (scheme.replace(/=>/g, "").search(new RegExp("[(\\[{<>}\\])]", "")) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      "bracket mismatch\n",
      `${showBracketMismatch(scheme)}\n`,
      `in "${s}"\n`));

  // prevent redundant round parenthesis

  else if (s.search(/\)\)/) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `redundant "(..)"\n`,
      `next to "${s.match(new RegExp(".{0,5}\\)\\)", "")) [0]}"\n`,
      `in "${s}"\n`));

  // prevent redundant pointed parenthesis

  else if (s.search(/<>/) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `redundant "<>"\n`,
      `next to "${s.match(new RegExp(".{0,5}<>.{0,5}", "")) [0]}"\n`,
      `in "${s}"\n`));

  // check for valid use of =>

  else if (s.replace(new RegExp("(?: |\\()=>( |\\))", "g"), "").search("=>") !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "=>"\n`,
      "allowed synthactic forms:\n",
      "(foo => bar)\n",
      "(foo =>)\n",
      "(=>)\n",
      `in "${s}"\n`));

  // check for invalid use of =
  
  else if (s.search(new RegExp("=(?!>)", "")) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "="\n`,
      `must only be used in "=>"\n`,
      `in "${s}"\n`));

  // check for invalid use of ,
  
  else if (s.replace(new RegExp(",+\\]", "g"), "").search(new RegExp(",[^ ]|\\[,", "")) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of ","\n`,
      "must only be used to enumerate types\n",
      "in the form of: foo, bar, baz\n",
      `in "${s}"\n`));

  // check for invalid use of ^
  
  else if (s.search(new RegExp("(?<!\\()\\^[a-z]", "")) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "^"\n`,
      "must only be used in quantifiers:\n",
      "(^foo. foo => bar)\n",
      `in "${s}"\n`));

  // check for valid use of .

  else if (s.replace(new RegExp("[a-zA-Z0-9]\\. |\\.\\.\\[", "g"), "").search(/\./) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "."\n`,
      "must only be used in quantifiers:\n",
      "(^foo. foo => bar)\n",
      `in "${s}"\n`));

  // check for invalid use of <
  
  else if (s.search(new RegExp("(?<![a-zA-Z0-9])<", "")) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "<"\n`,
      "must only be used in type constructors:\n",
      "foo<bar>\n",
      `in "${s}"\n`));

  // check for valid use of :
  
  else if (s.replace(new RegExp("\\b[a-z][a-z0-9]*: ", "gi"), "").search(":") !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of ":"\n`,
      "must only be used in objects:\n",
      "{foo: bar}\n",
      `in "${s}"\n`));

  // check for valid use of |

  else if (s.replace(new RegExp(/ \| [a-z]/g), "").search(/\|/) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "|"\n`,
      "must only be used in objects to separate the row variable:\n",
      "{foo: bar | row}\n",
      `in "${s}"\n`));

  // check for valid use of ()

  else if (s.replace(new RegExp("\\(\\) =>", "g"), "").search(/\(\)/) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "()"\n`,
      "must only be used for thunks:\n",
      "() => foo\n",
      `in "${s}"\n`));

  // check for valid use of 0-9

  else if (s.replace(new RegExp("\\b[a-z][a-z0-9]*\\b|\\[1", "gi"), "").search(/\d/) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      "invalid use of digits\n",
      "names must not start with a digit\n",
      `in "${s}"\n`));

  // prevent redundant spaces

  else if (s.search(new RegExp("  |^ | $", "")) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `redundant " "\n`,
      `next to "${s.match(new RegExp(".{0,5}(?:  |^ | $).{0,5}", "")) [0]}"\n`,
      `in "${s}"\n`));

  // check for valid use of *this

  else if (s.replace(new RegExp("\\bthis\\*", "g"), "").search(/\*/) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "*"\n`,
      "must only be used to denote self referencing:\n",
      "{foo: (bar => this*)}\n",
      `in "${s}"\n`));

  // prevent explicit top-level quantifiers

  else if (s.search(/^\(\^/) !== NOT_FOUND
    && s.search(/\)$/) !== NOT_FOUND)
      throw new TypeError(cat(
        "malformed type annotation\n",
        "top-level type must be implicitly quantified\n",
        `but "${s.match(new RegExp("(?<=^\\()\\^[^.]+\\.", "")) [0]}" received\n`,
        `in "${s}"\n`));

  // prevent malformed variadic arguments

  else if (s.replace(new RegExp("\\.\\.\\[", "g"), "").search(/\.\./) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of ".."\n`,
      "must only be used in variadic arguments:\n",
      "..[Foo]\n",
      `in "${s}"\n`));

  // prevent malformed variadic arguments

  else if (s.search(/\.\.\./) !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `invalid use of "..."\n`,
      "variadic arguments expect only two dots:\n",
      "..[Foo]\n",
      `in "${s}"\n`));

  // check for valid use of " "

  else if (s.replace(/ => /g, "")
    .replace(/ =>/g, "")
    .replace(/, /g, "")
    .replace(/: /g, "")
    .replace(/ \| /g, "")
    .replace(new RegExp("[a-z0-9]\\. ", "gi"), "")
    .replace(new RegExp("[a-z0-9] \\{", "gi"), "")
    .search(" ") !== NOT_FOUND)
    throw new TypeError(cat(
      "malformed type annotation\n",
      `unexpected use of " "\n`,
      `in "${s}"\n`));

  return s;
};


/***[ Combinators ]***********************************************************/


/* Remove nested pairs of parenthesis to simplify parsing through regular
expressions. This is the reason why functions must always be nested in round
parenthesis, even though the syntax doesn't require them to be unambiguous. */

const remNestings = cs => {
  let ds;

  do {
    ds = cs;
    cs = cs.replace(/=>/g, "=="); // mask function arrows
    cs = cs.replace(new RegExp("\\([^(){}\\[\\]<>]*\\)", ""), s => "_".repeat(s.length)); // Fun
    cs = cs.replace(new RegExp("(?:[A-Z][A-Za-z0-9]* )?{[^(){}\\[\\]<>]*}", ""), s => "_".repeat(s.length)); // Obj
    cs = cs.replace(new RegExp("\\[[^(){}\\[\\]<>]*\\]", ""), s => "_".repeat(s.length)); // Arr + Nea + Tup
    cs = cs.replace(new RegExp("[A-Z][A-Za-z0-9]*<[^(){}\\[\\]<>]*>", ""), s => "_".repeat(s.length)); // Adt + Native
    cs = cs.replace(new RegExp("\\b[a-z][A-Za-z0-9]*<[^(){}\\[\\]<>]*>", ""), s => "_".repeat(s.length)); // Tcons
    cs = cs.replace(/==/g, "=>"); // unmask function arrows
  } while (ds !== cs);

  return cs;
};


const showBracketMismatch = s => {
  if ((s.match(/\{|\}/g) || []).length % 2 !== 0)
    return `missing/redundant: "{" or "}"`;

  else if ((s.replace(/=>/g, "").match(/<|>/g) || []).length % 2 !== 0)
    return `missing/redundant: "<" or ">"`;

  else if ((s.match(/\(|\)/g) || []).length % 2 !== 0)
    return `missing/redundant: "(" or ")"`;

  else if ((s.match(/\[|\]/g) || []).length % 2 !== 0)
    return `missing/redundant: "[" or "]"`;

  else return `missing "()" around function argument`;
};


/* Take one level of an annotation and splits it at each position where a
subterm is found. */

const splitByPattern = (rx, delimLen, ref) => cs => {
  const xs = ref.split(rx), ys = [];
  let len = 0;

  xs.forEach((s, i) => {
    ys.push(cs.slice(len, len + s.length));
    len = len + delimLen + s.length;
  });

  return ys;
};


/******************************************************************************
*******************************************************************************
*******************************[ SERIALIZATION ]*******************************
*******************************************************************************
******************************************************************************/


// opposite of `parseAnno`

const serializeAst = initialAst => {
  const go = ast => {
    switch (ast[TAG]) {
      case "Adt": {
        const body = ast.body.map(go).join(", ")
          .replace(/(?:, )?__/g, "")
          .replace(/,+$/, "");

        return cat(
          ast.cons,
          body === ""
            ? ""
            : `<${body}>`);
      }

      case "Arr": return ast.body[TAG] === "Partial"
        ? `[]`
        : `[${go(ast.body)}]`;
      
      case "BoundTV":
      case "MetaTV":
      case "RigidTV": {

        if (ast.body.length === 0)
          return ast.name;

        // Tcons (higher-kinded)

        else  {
          const body = ast.body.map(go).join(", ")
            .replace(/(?:, )?__/g, "");

          return cat(
            ast.name,
            body.length ? `<${body}>` : "");
        }
      }

      case "Forall": {
        if (ast.scope === "." || ast.scope === "")
          return cat(
            "(",
            go(ast.body),
            ")");

        else return cat(
          "(^",
          Array.from(ast.btvs).join(", "),
          ". ",
          go(ast.body),
          ")");
      }

      case "Fun": {
        const domain = ast.body.lambdas.map(args => {
          switch (args[TAG]) {
            case "Arg0": return "()";
            case "Arg1": return go(args[0]);
            case "Args": return args.map(go).join(", ");
            
            case "Argsv": return args.map((arg, i) =>
              i === args.length - 1
                ? `..${go(arg)}`
                : go(arg))
                  .join(", ");
            
            case "Argv": return `..${go(args[0])}`;

            default:
              throw new TypeError(
                "internal error: argument list expected @serializeAst");
          }
        }).join(" => ");

        const codomain = go(ast.body.result);

        return `${domain} => ${codomain}`
          .replace(/ ?__/g, "")
          .replace(/^ =>|=> $/, "=>");
      }
      
      case "Native": {
        const body = ast.body.map(go).join(", ")
          .replace(/(?:, )?__/g, "")
          .replace(/,+$/, "");

        return cat(
          ast.cons,
          body === ""
            ? ""
            : `<${body}>`);
      }

      case "Nea": return ast.body[TAG] === "Partial"
        ? `[1]`
        : `[1${go(ast.body)}]`;

      case "Obj": {
        const props = ast.body.map(({k, v}) =>
          v[TAG] === "Partial"
            ? {k} : {k, v});

        const row = ast.row === null ? ""
          : ast.row[TAG] === "RowVar" ? " | " + ast.row.name
          : ", " + ast.row.body.map(({k, v}) =>
              `${k}: ${go(v)}`).join(", ");

        return cat(
          ast.cons === null ? "" : `${ast.cons} `,
          "{",
          props.map(({k, v}) =>
            v === undefined
              ? `${k}:`
              : `${k}: ${go(v)}`).join(", "),
          row,
          "}");
      }

      case "Partial": return "__";
      
      case "RowType": return ast.body.map(
        ({k, v}) => `${k}: ${go(v)}`).join(", ");
      
      case "RowVar": return ast.name;
      case "This": return "this*";

      case "Tup": {
        const body = ast.body.map(go).join(", ")
          .replace(/ ?__/g, "");

        return cat(`[${body}]`);
      }

      case "Tconst": return ast.name;

      default:
        throw new TypeError(
          "internal error: unknown value constructor @serializeAst");
    }
  };

  // remove optional top-level parenthesis

  return remQuant(go(initialAst));
};


/******************************************************************************
*******************************************************************************
*******************************[ INTROSPECTION ]*******************************
*******************************************************************************
******************************************************************************/


export const introspectFlat = x => {
  const type = Object.prototype.toString.call(x).slice(8, -1);

  switch (type) {
    case "Date": {
      if (x.getTime() === Number.NaN)
        return "Undefined";

      else return type;
    }

    case "Number": {
      if (x === Number.NaN)
        return "Undefined";

      else if (x === Number.POSITIVE_INFINITY || x === Number.NEGATIVE_INFINITY)
        return "Undefined";

      else if (x < Number.MIN_SAFE_INTEGER || x > Number.MAX_SAFE_INTEGER)
        return "Undefined";

      else return type;
    }

    case "Object": {
      if (Symbol.toStringTag in x && x[Symbol.toStringTag] !== "Object")
        return x[Symbol.toStringTag];

      else if ("constructor" in x && x.constructor.name !== "Object")
        return x.constructor.name;

      else return type;
    }

    /* `Undefined` usually immediately leads to runtime termination unless it
    is a function argument, because nullary functions implicitly pass
    `Undefined`. */

    case "Undefined":
      throw new TypeError(cat(
        "illegal type introspection\n",
        "namely: undefined\n",
        `runtime immediately terminated\n`));

    default: return type;
  }
};


/* `introspectDeep` is an imperative stateful function. It creates a closure
that holds some state and can pass this closure to other functions to share
this state. The type validator relies on vanilla Javascript and thus needs to
fall back to elusive side effects every now and then. */

export const introspectDeep = state => {
  const go = x => {

    // retrieve the native Javascript type

    const type = introspectFlat(x);

    // inspect the value recursively

    switch (type) {
      case "Array": {
        const ts = new Set();
        x.forEach(y => ts.add(go(y)));

        if (ts.size === 0)
          return `[${String.fromCharCode(state.charCode++)}]`;

        else if (ts.size > 1)
          throw new TypeError(cat(
            "invalid Array\n",
            "must contain homogeneous elements\n",
            `but elements of type "${Array.from(ts).join(", ")}" received`,
            "\n"));

        else return `[${Array.from(ts) [0]}]`;
      }

      case "Function": {

        /* Functions are an opaque value, therefore they need an explicit user
        defined type annotation. The top-level quantifier is implicit but can
        still be provided by the user. Both forms must be taken into account. */

        if (ANNO in x) {
          if (x[ANNO] [0] !== "(" || x[ANNO] [x[ANNO].length - 1] !== ")")
            return `(${x[ANNO]})`;

          else return x[ANNO];
        }

        /* If a function is untyped, the introspection returns a native Javascript
        `Function` constant. This behavior gives rise to type holes or untyped
        sections in the type validator. If this is a feature or a design mistake
        isn't clear yet. */

        else return type;
      }

      case "NEArray": {
        const ts = new Set();
        x.forEach(y => ts.add(go(y)));

        if (ts.size === 0
          || ts.size === 1 && ts.has("Undefined"))
            throw new TypeError(cat(
              "invalid NEArray\n",
              "must contain at least a single element\n"));

        else if (ts.size > 1)
          throw new TypeError(cat(
            "invalid NEArray\n",
            "must contain homogeneous elements\n",
            `but elements of type "${Array.from(ts).join(", ")}" received`,
            "\n"));

        else return `[1${Array.from(ts) [0]}]`;
      } 

      case "Tuple": {
        const ts = [];
        x.forEach(y => ts.push(go(y)));
        return `[${Array.from(ts).join(", ")}]`;
      }

      /* `Undefined` usually immediately leads to runtime termination unless it
      is a function argument, because nullary functions implicitly pass
      `Undefined`. */

      case "Undefined":
        throw new TypeError(cat(
          `value of type "Undefined" received\n`,
          "runtime immediately terminated\n"));

      default: {

        // object-based type constant (e.g. `Integer` or `Char`)

        if (monoDict.has(type))
          return type;

        /* Native types are imperative Javascript types, i.e. they are not
        algebraic. They comprise both built-in and custom types. It must be
        defined for every native type how introspection works. Since such
        introspection might introduce further TVs, it must be stateful as well. */

        else if (nativeDict.has(type))
          return nativeIntrospection.get(type) (x, state, go);

        // Thunk (lookup doesn't trigger thunk evaluation)

        else if (x !== null && x[THUNK])
          return x[ANNO];

        // ADT or Object

        else if (x !== null && typeof x === "object" || typeof x === "function") {

          // ADT

          if (ADT in x) return x[ADT];

          // Object

          else {
              const ts = new Map();

              const cons = TAG in x
                ? `${x[TAG]} ` : "";

              for (let k in x)
                ts.set(k, go(x[k]));

              return `${cons}{${Array.from(ts).map(([k, v]) => k + ": " + v).join(", ")}}`;
          }
        }

        // Tconst

        else return type;
      }
    }
  };

  // remove optional top-level parenthesis

  return y => {
    const r = go(y);

    if (r[0] === "(" && r[r.length - 1] === ")")
      return r.slice(1, -1);

    else return r;
  };
};


/******************************************************************************
*******************************************************************************
****************************[ ALGEBRAIC DATA TYPE ]****************************
*******************************************************************************
******************************************************************************/


/* `type` is used for declaring general ADTs including several value constructors.
Type dictionaries based on Javascript objects are used to allow an exhaustiveness
check and to facilitate pattern matching. */

export const type = adtAnno => {

  // bypass the type validator

  if (CHECK === false)
    return o => ({run: o});

  // strip newlines and indentations

  adtAnno = adtAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
    .replace(new RegExp(SAFE_SPACE, "g"), " ");

  // ensures top-level function type

  if (remNestings(adtAnno).search(/ => /) === NOT_FOUND)
    throw new TypeError(cat(
      "invalid algebraic data type declaration\n",
      "top-level type must be a function\n",
      `while declaring "${adtAnno}"\n`));

  // separate domain from codomain

  const [domainAnno, codomainAnno] = splitByPattern(
    / => /, 4, remNestings(adtAnno)) (adtAnno);

  // determine name of the codomain

  const tcons = codomainAnno.match(/[^<]+/) [0];

  // verify codomain

  if (tcons.search(new RegExp("^[A-Z][A-Z-a-z0-9]*", "")) === NOT_FOUND)
    throw new TypeError(cat(
      "invalid algebraic data type declaration\n",
      "RHS of the top-level function type must be a type constructor\n",
      `but "${codomainAnno}" received\n`,
      `while declaring "${adtAnno}"\n`));

  // determine arity of the codomain

  const arity = codomainAnno !== tcons
    ? splitByPattern(
        /, /, 2, remNestings(codomainAnno.replace(new RegExp("^[^<]+<|>$", "g"), "")))
          (codomainAnno.replace(new RegExp("^[^<]+<|>$", ""), "g")).length
    : 0;

  // check for name clashes with existing ADTs

  if (adtDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with another ADT found\n",
      `namely: ${tcons}\n`,
      `while declaring "${adtAnno}"\n`));

  // check for name clashes with existing TCs

  else if (tcDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with a type class found\n",
      `namely: ${tcons}\n`,
      `while declaring "${tcAnno}"\n`));

  // check for name clashes with existing native types

  else if (nativeDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with a native type found\n",
      `namely: ${tcons}\n`,
      `while declaring "${adtAnno}"\n`));

  // check for name clashes with existing type constants

  else if (monoDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with a type constant found\n",
      `namely: ${tcons}\n`,
      `while declaring "${adtAnno}"\n`));

  // pre-register ADT using a default kind

  else {
    const kind = arity === 0
      ? new Kind("*")

      : new HigherKind(arity)
          .fill(new Kind("")) // unknown kind
          .concat([new Kind("*")]);

    adtDict.set(tcons, {arity, kind});
  }

  // parse ADT

  let adtAst = parseAnno(new Map()) (adtAnno);

  // verify the domain is a rank-2 function argument

  if (adtAst.body.body.lambdas[0] [0] [TAG] !== "Forall"
    || adtAst.body.body.lambdas[0] [0].btvs.size === 0)
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "LHS of the top-level function type must be\n",
        "a rank-1 function type argument\n",
        `but "${domainAnno}" received\n`,
        `while declaring "${adtAnno}"\n`));

  /* Verify the function argument expects a type dictionary with at least one
  property. */

  else if (adtAst.body.body.lambdas[0] [0].body.body.lambdas[0] [0] [TAG] !== "Obj"
    || adtAst.body.body.lambdas[0] [0].body.body.lambdas[0] [0].props.length === 0)
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "LHS of the top-level function type must be\n",
        "a rank-1 function type argument\n",
        "expecting a type dictionary with at least one property\n",
        `but "${domainAnno}" received\n`,
        `while declaring "${adtAnno}"\n`));

  /* Verify that all rank-1 TVs in the domain occur in the codomain of the
  value constructor:

  (^r. {left: (a => r), right: (b => r)} => Either<a, b>
               ^                ^                  ^^^^
  (^r. {none: r, some: (a => r)} => Option<a>
                        ^                  ^ */

  // collect all rank-1 TVs in the domain

  const tvsDomain = reduceAst((acc, ast) => {
    if (isTV(ast) && ast.scope === ".") {
      acc.add(ast.name);
      return acc;
    }

    else return acc;
  }, new Set()) (adtAst.body.body.lambdas[0] [0]);

  // collect all rank-1 TVs in the codomain

  const tvsCodomain = reduceAst((acc, ast) => {
    if (isTV(ast) && ast.scope === ".") {
      acc.add(ast.name);
      return acc;
    }

    else return acc;
  }, new Set()) (adtAst.body.body.result);

  // lookup possible differences

  tvsDomain.forEach((v, k) => {
    if (!tvsCodomain.has(k))
      throw new TypeError(cat(
        "illegal algebraic data type declaration\n",
        `type parameter "${k}" only occurs on the RHS\n`,
        "existential types are not yet supported\n",
        `while declaring "${adtAnno}"\n`));
  });

  // create the continuation type

  const domainAst = extractAst(adtAst.body.body.lambdas[0] [0]);

  /***********************
   * ALGEBRAIC DATA TYPE *
   ***********************/

  // data constructor

  const dataCons = k => { // k is the continuation containing a type dictionary

    // ensure untyped continuation argument

    if (typeof k !== "function")
      throw new TypeError(cat(
        "algebraic data type error\n",
        "invalid value constructor argument\n",
        "expected: function\n",
        `received: ${introspectDeep(k)}\n`,
        `while applying "${adtAnno}"\n`));

    else if (ANNO in k)
      throw new TypeError(cat(
        "algebraic data type error\n",
        "invalid value constructor argument\n",
        "expected: untyped function\n",
        `received: ${k[ANNO]}\n`,
        `while applying "${adtAnno}"\n`));

    // set the domain annotation

    k[ANNO] = serializeAst(domainAst);

    // return the ADT

    return {
      [TAG]: tcons,
      [ADT]: codomainAnno,
      run: k
    };
  };

  // set the annotation and return the data constructor

  dataCons[ANNO] = adtAnno;
  return dataCons;
};


/* `type1` declares ordinary ADTs without type refinements and with only one
value constructor. Hence neither pattern matching nor exhaustiveness checking
is required. */

export const type1 = adtAnno => {

  // bypass the type validator

  if (CHECK === false)
    return x => ({run: x});

  // strip newlines and indentations

  adtAnno = adtAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
    .replace(new RegExp(SAFE_SPACE, "g"), " ");

  // verify top-level function type

  if (remNestings(adtAnno).search(/ => /) === NOT_FOUND)
    throw new TypeError(cat(
      "invalid algebraic data type declaration\n",
      "top-level type must be a function\n",
      `while declaring "${adtAnno}"\n`));

  // separate domain from codomain

  const [domainAnno, codomainAnno] = splitByPattern(
    / => /, 4, remNestings(adtAnno)) (adtAnno);

  // determine name of the codomain

  const tcons = codomainAnno.match(/[^<]+/) [0];

  // verify codomain

  if (tcons.search(new RegExp("^[A-Z][A-Z-a-z0-9]*", "")) === NOT_FOUND)
    throw new TypeError(cat(
      "invalid algebraic data type declaration\n",
      "RHS of the top-level function type must be a type constructor\n",
      `but "${codomainAnno}" received\n`,
      `while declaring "${adtAnno}"\n`));

  // determine arity of the codomain

  const arity = codomainAnno !== tcons
    ? splitByPattern(
        /, /, 2, remNestings(codomainAnno.replace(new RegExp("^[^<]+<|>$", "g"), "")))
          (codomainAnno.replace(new RegExp("^[^<]+<|>$", ""), "g")).length
    : 0;

  // check for name clashes with existing ADTs

  if (adtDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with another ADT found\n",
      `namely: ${tcons}\n`,
      `while declaring "${adtAnno}"\n`));

  // check for name clashes with existing TCs

  else if (tcDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with a type class found\n",
      `namely: ${tcons}\n`,
      `while declaring "${tcAnno}"\n`));

  // check for name clashes with existing native types

  else if (nativeDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with a native type found\n",
      `namely: ${tcons}\n`,
      `while declaring "${adtAnno}"\n`));

  // check for name clashes with existing type constants

  else if (monoDict.has(tcons))
    throw new TypeError(cat(
      "illegal algebraic data type declaration\n",
      "name collision with a type constant found\n",
      `namely: ${tcons}\n`,
      `while declaring "${adtAnno}"\n`));

  // pre-register ADT using a default kind

  else {
    const kind = arity === 0
      ? new Kind("*")

      : new HigherKind(arity)
          .fill(new Kind("")) // unknown kind
          .concat([new Kind("*")]);

    adtDict.set(tcons, {arity, kind});
  }

  // parse ADT

  let adtAst = parseAnno(new Map()) (adtAnno);

  /* Verify that all rank-1 TVs of the domain occur in the codomain of the
  value constructor:

  ((a => r) => r => Cont<a, r>)
    ^    ^     ^         ^^^^ */

  // collect all rank-1 TVs within the domain

  const tvsDomain = reduceAst((acc, ast) => {
    if (isTV(ast) && ast.scope === ".") {
      acc.add(ast.name);
      return acc;
    }

    else return acc;
  }, new Set()) (adtAst.body.body.lambdas[0] [0]);

  // collect all rank-1 TVs within the codomain

  const tvsCodomain = reduceAst((acc, ast) => {
    if (isTV(ast) && ast.scope === ".") {
      acc.add(ast.name);
      return acc;
    }

    else return acc;
  }, new Set()) (adtAst.body.body.result);

  // lookup possible differences

  tvsDomain.forEach((v, k) => {
    if (!tvsCodomain.has(k))
      throw new TypeError(cat(
        "illegal algebraic data type declaration\n",
        `type parameter "${k}" only occurs on the RHS\n`,
        "existential types are not yet supported\n",
        `while declaring "${adtAnno}"\n`));
  });

  /***********************
   * ALGEBRAIC DATA TYPE *
   ***********************/

  // data constructor

  const dataCons = x => {

    let tvid = 0,
      instantiations = new Map(),
      aliases = new Map(),
      intros = [];

    // determine the type of the passed argument

    const argAnno = introspectDeep({charCode: letterA}) (x),
      argAst = parseAnno(new Map()) (argAnno);

    // dequantify ADT AST considering TV introductions

    let intro;

    ({ast: adtAst, intro} = specializeLHS(new Map(), ".") (adtAst));

    if (intro.size > 0) intros.push(intro);

    // unify the function type application

    ({tvid, instantiations, aliases, intros} = unifyTypes(
      adtAst.body.body.lambdas[0] [0],
      argAst,
      0,
      0,
      {tvid, instantiations, aliases, intros},
      domainAnno,
      argAnno,
      adtAnno,
      [argAnno]));

    // disclose transitive relations

    ({tvid, instantiations, aliases, intros} = uncoverTransRel(
      {tvid, instantiations, aliases, intros}, null, null, adtAnno, [argAnno]));

    // remove contradictory instantiations

    instantiations = remConflictingAliases(instantiations);

    // conduct occurs check

    instantiations.forEach(m => {
      m.forEach(({key: keyAst, value: valueAst}) =>
        occursCheck(keyAst, valueAst, instantiations, aliases, new Set(), null, null, adtAnno, [argAnno]));
    });

    // substitute ADT AST without removing the type parameter

    adtAst = 
      substitute(
        adtAst,
        instantiations);

    /* If the argument of the data constructor is a function, then update
    its annotation with the substituted one. */

    let x_ = x;

    if (x && x[ANNO]) {
      x_ = x.bind({}); // clone function object

      x_[ANNO] = serializeAst(
        prettyPrint(
          extractAst(adtAst.body.body.lambdas[0] [0])));
    }

    // update the codomain annotation with the substituted one

    const codomainAnno_ = serializeAst(
      prettyPrint(
        extractAst(adtAst.body.body.result)));

    // return the ADT

    return {
      [TAG]: tcons,
      [ADT]: codomainAnno_,
      run: x_
    };
  };

  // set the annotation and return the data constructor

  dataCons[ANNO] = adtAnno;
  return dataCons;
};


/******************************************************************************
********************************[ TYPE CLASS ]*********************************
******************************************************************************/


/* Declare type classes purely at the value level. They are encoded as dicts
including the operations of the respective type class. They resemble ADTs
quite a lot, hence the also rely on ADTs. */

export const typeClass = tcAnno => {

  // bypass the type validator

  if (CHECK === false) {
    return (...os) => o => {
      o = Object.assign({}, o); // clone
      os.forEach(p => o = Object.assign(o, p));
      return o;
    }
  }

  // strip newlines and indentations

  tcAnno = tcAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
    .replace(new RegExp(SAFE_SPACE, "g"), " ");

  // determine TC components

  const tcCompos = splitByPattern(
    / => /, 4, remNestings(tcAnno)) (tcAnno);

  // determine TC constaints

  const constraints = [];

  // verify top-level function type

  if (tcCompos.length === 1)
    throw new TypeError(cat(
      "invalid type class declaration\n",
      "top-level type must be a function\n",
      `while declaring "${tcAnno}"\n`));

  // verify constraints are passed as multi-parameter

  else if (tcCompos.length > 3)
    throw new TypeError(cat(
      "invalid type class declaration\n",
      "malformed constraints\n",
      "constraints must be passed as a single multi-parameter argument\n",
      `while declaring "${tcAnno}"\n`));

  else if (tcCompos.length === 3) {

    // validate constraints

    if (tcCompos[0].search(new RegExp(
      "^(?:[A-Z][A-Za-z0-9]*<[a-z][A-Za-z0-9]*>, )*[A-Z][A-Za-z0-9]*<[a-z][A-Za-z0-9]*>$", "")) === NOT_FOUND)
        throw new TypeError(cat(
          "invalid type class declaration\n",
          "malformed constraints\n",
          "comma separated constraint list expected\n",
          `but "${tcCompos[0]}" received\n`,
          `while declaring "${tcAnno}"\n`));

    // parse constraints and retrieve their components

    tcCompos[0].split(", ").forEach((constraint, i) => {
      const tcons = constraint.replace(/<.+>$/, ""),
        tparamTo = constraint.split(/</) [1].slice(0, -1);

      if (!tcDict.has(tcons))
        throw new TypeError(cat(
          "invalid type class declaration\n",
          "malformed constraints\n",
          "list of existing type class constraints expected\n",
          `but unknown "${tcons}" received\n`,
          `while declaring "${tcAnno}"\n`));

      else {

        // retrieve components of the constraining TC from global TC dictionary

        const {tparam: tparamFrom, tcAnno, arity, kind} = tcDict.get(tcons);

        /* Store the type constructor, type parameter and the dictionary
        annotation. There are actually two type parameters involved: The first
        one represents the type parameter used in the current type class
        declaration. The second one is used in the constraining type class. If
        both differ, they must be unified before being added to the current TC. */

        constraints[i] = {
          tcons,
          tparamFrom,
          tparamTo,
          tcAnno
        };
      }
    });
  }

  // verify codomain

  const codomainAnno = tcCompos[1 + (tcCompos.length === 3 ? 1 : 0)];

  if (codomainAnno.search(new RegExp("^[A-Z][A-Za-z0-9]*<.*>$", "")) === NOT_FOUND)
    throw new TypeError(cat(
      "invalid type class declaration\n",
      "type constructor parameterized by a single type parameter\n",
      "expected in the codomain\n",
      `but "${codomainAnno}" received\n`,
      `while declaring "${tcAnno}"\n`));

  // determine name and arity of the codomain

  const tcons = codomainAnno.replace(/<[^>]+>$/, ""),
    tparam = codomainAnno.match(/<([^>]+)>$/) [1];

  // check for name clashes with existing TCs

  if (tcDict.has(tcons))
    throw new TypeError(cat(
      "illegal type class declaration\n",
      "name collision with another type class found\n",
      `namely: ${tcons}\n`,
      `while declaring "${tcAnno}"\n`));

  // check for name clashes with existing ADTs

  else if (adtDict.has(tcons))
    throw new TypeError(cat(
      "illegal type class declaration\n",
      "name collision with an algebraic data type found\n",
      `namely: ${tcons}\n`,
      `while declaring "${tcAnno}"\n`));

  // check for name clashes with existing native types

  else if (nativeDict.has(tcons))
    throw new TypeError(cat(
      "illegal type class declaration\n",
      "name collision with a native type found\n",
      `namely: ${tcons}\n`,
      `while declaring "${tcAnno}"\n`));

  // check for name clashes with existing type constants

  else if (monoDict.has(tcons))
    throw new TypeError(cat(
      "illegal type class declaration\n",
      "name collision with a type constant found\n",
      `namely: ${tcons}\n`,
      `while declaring "${tcAnno}"\n`));

  // infer the arity

  const arity = splitByPattern(
    /, /, 2, remNestings(codomainAnno.replace(new RegExp("^[^<]+<|>$", "g"), "")))
      (codomainAnno.replace(new RegExp("^[^<]+<|>$", ""), "g")).length;

  // either derive kind from arity or from possible constraints

  const kind = constraints.length === 0
    ? new HigherKind(1)
        .fill(new Kind("")) // unknown kind
        .concat([new Kind("*")])

    : new HigherKind(1)
        .fill(tcDict.get(constraints[0].tcons).kind[0]) // derived from first constraint
        .concat([new Kind("*")]);

  // pre-register the type class using a placeholder for tcAnno

  tcDict.set(
    tcons, {
      tparam,
      tcAnno: "Undefined", // placeholder
      arity,
      kind
    });

  // preset the type class type parameter provided there are constraints

  const kindMap = constraints.length === 0
    ? new Map()
    : new Map([
        [`.:${constraints[0].tparamFrom}`, tcDict.get(constraints[0].tcons).kind[0]],
        [`.:${constraints[0].tparamTo}`, tcDict.get(constraints[0].tcons).kind[0]]
      ]);

  // remove the optional constraints and parse TC annotation

  let tcAst = tcCompos.length === 3
    ? parseAnno(kindMap) (tcAnno.replace(/^.*? => /, ""))
    : parseAnno(kindMap) (tcAnno);

  // create AST references for convenience

  const domainAst = tcAst.body.body.lambdas[0] [0],
    codomainAst = tcAst.body.body.result;

  /* The type dictionary on the ast level is an `Obj` element optionally wrapped
  in a `Forall`, which depends on the occurrence of higher-rank TVs in the TC
  annotation. We create another reference to abstract form this optionally
  `Forall` element. */

  const tdictAst = domainAst[TAG] === "Forall"
    ? domainAst.body
    : domainAst;

  // get the properies of the current TC type dictionary

  const reservedProps = new Set(tdictAst.props);

  /* TCs can have types without higher-rank TVs, but we can at least verify
  that the parameter of the top-level function type is a type dictionray
  containing any number of operations/values. */

  if ((domainAst[TAG] !== "Obj" && domainAst[TAG] !== "Forall")
    || domainAst[TAG] === "Forall" && domainAst.body[TAG] !== "Obj")
      throw new TypeError(cat(
        "invalid type class declaration\n",
        "function type parameter must be a type dictionary\n",
        "containg any number of operations/values\n",
        `but "${tcCompos[0 + tcOffset]}" received\n`,
        `while declaring "${tcAnno}"\n`));

  /* Verify that all rank-1 type variables occur in the codomain of the
  function type:

  (^a, b. {of: (a => m<a>), chain: (m<a> => (a => m<a>) => m<b>)}) => Monad<m>
                     ^              ^             ^        ^                ^

  ({empty: m, append: (m => m => m)}) => Monoid<m>
           ^           ^    ^    ^              ^ */

  // collect all rank-1 TVs in the domain

  const tvsDomain = reduceAst((acc, ast) => {
    if (isTV(ast) && ast.scope === ".") {
      acc.add(ast.name);
      return acc;
    }

    else return acc;
  }, new Set()) (domainAst);

  // collect all rank-1 TVs in the codomain

  const tvsCodomain = reduceAst((acc, ast) => {
    if (isTV(ast) && ast.scope === ".") {
      acc.add(ast.name);
      return acc;
    }

    else return acc;
  }, new Set()) (codomainAst);

  // lookup possbile differences

  tvsDomain.forEach((v, k) => {
    if (!tvsCodomain.has(k))
      throw new TypeError(cat(
        "illegal algebraic data type declaration\n",
        `type parameter "${k}" only occurs on the RHS\n`,
        "existential types are not yet supported\n",
        `while declaring "${tcAnno}"\n`));
  });

  // extend current type dictionary by operations/values of its constraints

  constraints.forEach(({tcons: tcons_, tparamFrom, tparamTo, tcAnno: tcAnno_}) => {

    // preset the type class constraint type parameter

    const kindMap = new Map([
      [`.:${tparamFrom}`, tcDict.get(tcons_).kind[0]],
      [`.:${tparamTo}`, tcDict.get(tcons_).kind[0]]
    ]);

    // parse the TC annotation of the constraint

    let tcAst_ = parseAnno(kindMap) (tcAnno_);

    /* If the type parameter name of the current TC and its constraint differ,
    it is adjusted by alpha renaming. */

    if (tparamFrom !== tparamTo) {

      // adjust type parameter name

      tcAst_.body.body.lambdas[0] [0] = mapAst(ast => {
        if (ast[TAG] === "BoundTV"
          && ast.scope === "."
          && ast.name === tparamFrom) {
            ast.name = tparamTo;
            return ast;
        }

        else if (ast[TAG] === "Forall"
          && ast.scope === "."
          && ast.btvs.has(tparamFrom)) {
            ast.btvs.delete(tparamFrom);
            ast.btvs.add(tparamTo);
            return ast;
        }

        else return ast;
      }) (tcAst_.body.body.lambdas[0] [0]);
    }

    // create AST reference for convenience
    
    const domainAst_ = tcAst_.body.body.lambdas[tcAst_.body.body.lambdas.length - 1] [0];

    const tdictAst_ = domainAst_[TAG] === "Forall"
      ? domainAst_.body
      : domainAst_;

    // add operations/values

    let btvs = new Set();

    tdictAst_.body.forEach(({k, v}) => {

      // rule out operation/value name collision

      if (reservedProps.has(k))
        throw new TypeError(cat(
          "illegal type class declaration\n",
          "subclass tries to override a property of one of its superclasses\n",
          `namely: ${k}\n`,
          `while declaring "${tcAnno}"\n`));

      // collect rank-2 bound TVs

      btvs = reduceAst((acc, ast) => {
        if (ast[TAG] === "BoundTV"
          && getRank(ast.scope) === 2) {
            return acc.add(ast.name)
        }

        else return acc;
      }, btvs) (v);

      // add operations/values to current type dictionary

      tdictAst.body.push({k, v});
      tdictAst.props.push(k);
    });

    // add an optional quantifier

    if (btvs.size > 0) {
      if (domainAst[TAG] === "Forall")
        domainAst.btvs = new Set([...domainAst.btvs, ...btvs]);

      else
        tcAst.body.body.lambdas[0] [0] = Forall(
          btvs,
          ".0/0.",
          domainAst);
    }
  });

  /* Register the type class using a default annotation. Since scriptum doesn't
  support multi-parameter TCs for the time being, we can just set arity and kind
  to its default values. */

  const o = tcDict.get(tcons);
  o.tcAnno = tcAnno;
  tcDict.set(tcons, o);

  /**************
   * TYPE CLASS *
   **************/

  /* Return a function that excepts zero, one or several super dictionaries
  and unifies the operations of the current type dictionary and the super
  optional dictionaries with these of the resolved type class:
  `{specialicedTypeDict} => {unifiedTypedDict}` */

  const r = (...dicts) => Object.assign(dict => {
    let tvid = 0,
      instantiations = new Map(),
      intros = [],
      aliases = new Map();
    
    // clone the main object

    dict = Object.assign({}, dict);

    // add constraining dictionaries

    dicts.forEach((dict_, i) => {

      // ensure type dictionary arguments

      if (dict_[ADT] === undefined
        && introspectFlat(dict_) !== "Object")
          throw new TypeError(cat(
            "illegal type class instance\n",
            "expect type class arguments as constraints\n",
            `but "${introspectDeep({charCode: letterA}) (dict_)}" received\n`,
            `while applying "${tcAnno}"\n`));

      else {
        Object.entries(dict_).forEach(([k, v]) => {

          // skip identical properties from different superclasses

          if (k in dict) return null;

          // skip symbolic properties

          else if (k === ANNO || k === ADT || k === TAG) return null;
  
          // add property to new type class

          else dict[k] = v;
        });
      }

      /* Make each super dictionary available via a non-enumerable property
      of the current type dictionary. */

      Object.defineProperty(
        dict,
        dict_[TAG],
        {value: dict_, configurable: true, writable: true});
    });

    // dequantify TC AST considering TV introductions

    let intro;

    ({ast: tcAst, intro} = specializeLHS(new Map(), ".") (tcAst));

    if (intro.size > 0) intros.push(intro);

    // collect type level properties without losing rank-2 qunatifiers

    let typeLevelProps;

    if (tcAst.body.body.lambdas[0] [0] [TAG] === "Forall") {
      typeLevelProps = tcAst.body.body.lambdas[0] [0].body.body
        .reduce((acc, {k, v}) => {
          const forall = Object.assign(
            {}, tcAst.body.body.lambdas[0] [0]); // clone `Forall`

          forall.body = v[TAG] === "Forall"
            ? v.body : v;

          return acc.set(k, forall);
        }, new Map());
    }

    else {
      typeLevelProps = tcAst.body.body.lambdas[0] [0].body
        .reduce((acc, {k, v}) => acc.set(k, v), new Map())
    }

    // retrieve term level properties

    const termLevelProps_ = Object.keys(dict),
      termLevelProps = new Set(termLevelProps_);;

    // ensure the property number at type and term level match

    if (typeLevelProps.size !== termLevelProps.size)
      throw new TypeError(cat(
        "illegal type class instance\n",
        "exhaustiveness check failed\n",
        `expected: ${tdictAst.props.join(", ")}\n`,
        `received: ${termLevelProps_.join(", ")}\n`,
        `while applying "${tcAnno}"\n`));

    // traverse term level properties and unify them with the type level

    termLevelProps.forEach(k => {

      // exhaustiveness check

      if (!typeLevelProps.has(k))
        throw new TypeError(cat(
          "illegal type class instance\n",
          "exhaustiveness check failed\n",
          `expected: ${tdictAst.props.join(", ")}\n`,
          `received: ${termLevelProps_.join(", ")}\n`,
          `while applying "${tcAnno}"\n`));

      // type the current function property

      ({tvid, instantiations, aliases, intros} = unifyTypes(
        typeLevelProps.get(k),
        typeof dict[k] === "function"
          ? parseAnno(new Map()) (dict[k] [ANNO])
          : parseAnno(new Map()) (introspectDeep({charCode: letterA}) (dict[k])),
        0,
        0,
        {tvid, instantiations, aliases, intros},
        serializeAst(typeLevelProps.get(k)),
        dict[k] [ANNO],
        tcAnno,
        []));
    });

    /* Update the TC annotation using substitution without removing the type
    parameter. */

    let unifiedAst = prettyPrint(
      recreateAst(
        substitute(
          tcAst,
          instantiations)));

    // collect unified type level properties without losing rank-2 qunatifiers

    let typeLevelProps_;

    if (unifiedAst.body.body.lambdas[0] [0] [TAG] === "Forall") {
      typeLevelProps_ = unifiedAst.body.body.lambdas[0] [0].body.body
        .reduce((acc, {k, v}) => {
          const forall = Object.assign(
            {}, unifiedAst.body.body.lambdas[0] [0]); // clone `Forall`

          forall.body = v[TAG] === "Forall"
            ? v.body : v;

          return acc.set(k, forall);
        }, new Map());
    }

    else {
      typeLevelProps_ = unifiedAst.body.body.lambdas[0] [0].body
        .reduce((acc, {k, v}) => acc.set(k, v), new Map())
    }

    /* Annotate properties of the term level type dictionary using the
    corresponing portions unified TC annotation. */

    termLevelProps.forEach(k => {
      if (typeof dict[k] === "function")
        dict[k] [ANNO] = serializeAst(typeLevelProps_.get(k));
    });

    dict[ADT] = serializeAst(unifiedAst.body.body.result);
    dict[TAG] = tcons;
    return dict;
  }, {[ANNO]: tcAnno});

  // provide no constraining type dictionaries if the type level says so

  return tcCompos.length === 2
    ? r() : r;
};


/******************************************************************************
*******************************************************************************
******************************[ TYPE VALIDATION ]******************************
*******************************************************************************
******************************************************************************/


/* `fun` is one of the major operations of the type validator API. It only
conducts type validation of applications, not definition. It only attempts to
unify the formal parameter of a function type with a provided argument type,
but it does not infer types from given terms. */

export const fun = (f, funAnno) => {
  const go = (g, lamIndex, funAst, funAnno) => {
    const getArgs = (...args) => {

      // create unique numbers for alpha renaming

      let tvid = 0;

      /* Unification generates instantiations, which are later applied to type
      annotations using substitution. Instantiations are mappings from TV to
      TV/Type, where Type is a composite type that might include other TVs. The
      LHS of the mapping might be instantiated with several TVs/Types, which
      all have to unify with one another. `instantiations` is a data structure
      of following form:

      Map("foo" => Map("Bar<baz, bat>" => {keyAst, valueAst, substitutor}))
            |                |                           |
      ^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      key/source type  value/target type            object type

      It maps a key/source type to a value/target type. The keys of both the
      outer and inner maps are used to guarnatee unique mappings. The resulting
      object contains all the information necessary for substituting from the
      key/source to the value/target type. The key/source type has to be a type
      variable, because only type variables can be instantiated. */

      let instantiations = new Map();

      /* We must keep track of type aliases to be able to implement reliable
      occurs and escape checks:

      given:
      a ~ b
      a ~ c

      aliases due to commutativity and transitivity of type equality:
      b ~ a
      c ~ a
      b ~ c
      c ~ b */

      let aliases = new Map(); // Map("key" => Map("key ~ value", [key, value]))

      /* We must keep track which type variables are introduced in which
      subsumption judgement to decide if higher-rank type variables may be
      instantiated with such of lower rank.

      subsumption judgement:
      {left: (a => s), right: (b => s)} => s <: (^r. {left: (a0 => r), right: (b0 => r)} => r)

      introduced type variables:
      [a, b, s, r]

      type aliases:
      a ~ a0
      b ~ b0

      remove type aliases:
      [s, r]

      The rank-2 type variable `r` must only be instantiated with the rank-1
      type variable `s` */

      let intros = []; // [Map("a0" => a0, "b0" => b0), Map("a1" => a1, "b1" => b1, "r1" => r1)]

      // take variadic arguments into account

      switch (funAst.body.body.lambdas[0] [TAG]) {
        case "Argv": {
          args = [args];
          break;
        }

        case "Argsv": {
          args = args
            .slice(0, funAst.body.body.lambdas[0].length - 1)
            .concat([args.slice(funAst.body.body.lambdas[0].length - 1)]);

          break;
        }
      }

      /* Recursively introspect the argument type. Since `introspectDeep` is
      stateful in its `charCode` argument, a reference of the partially applied
      function must be kept for successive use. */

      const introspectDeep_ = introspectDeep({charCode: letterA}),
        argAnnos = args.map(arg => introspectDeep_(arg));

      // parse main function annotation

      const argAsts = argAnnos.map(parseAnno(new Map()));

      // check function arity (multi-argument/variadic functions are supported)

      if (funAst.body.body.lambdas[0].length !== args.length) {
        if (funAst.body.body.lambdas[0] [TAG] === "Argv"
          || funAst.body.body.lambdas[0] [TAG] === "Argsv")
            throw new TypeError(cat(
              "arity mismatch\n",
              `expected: at least ${funAst.body.body.lambdas[0].length - 1} argument(s)\n`,
              `received: ${args.length - 1} argument(s)\n`,
              extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));
        
        else throw new TypeError(cat(
          "arity mismatch\n",
          `expected: ${funAst.body.body.lambdas[0].length} argument(s)\n`,
          `received: ${args.length} argument(s)\n`,
          extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));
      }

      /* Prior to unification the function type has to be dequantified. During
      this process bound TVs are instantiated with fresh meta TVs. As opposed to
      subsequent dequantifications there is no alpha renaming taking place. This
      ensures that the unified annotation only deviates as little as possible
      from the original user-defined one. */
      
      let intro;

      ({ast: funAst, intro} = specializeLHS(new Map(), funAst.scope) (funAst));

      if (intro.size > 0) intros.push(intro);

      /* Attempt to type validate the application of `fun` with `arg` by
      unifying `fun`'s first formal parameter with `arg`. Since this is a
      higher-rank type validator, subsumption is necessary in order to unify
      deeply nested quantifiers. The subsumption judgement for type application
      reads `arg <: param`, where `<:` denotes the is-at-least-as-polymorphic-as
      relation. The judgement order flips for each nested function argument due
      to the usual co- and contravariant phenomena of the function type. */

      ({tvid, instantiations, aliases, intros} = argAnnos.reduce(
        (acc, argAnno, argIndex) =>
          unifyTypes(
            funAst.body.body.lambdas[0] [TAG] === "Arg0"
              ? Tconst("Undefined")
              : funAst.body.body.lambdas[0] [argIndex],
            parseAnno(new Map()) (argAnno),
            lamIndex,
            argIndex,
            {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
            funAst.body.body.lambdas[0] [TAG] === "Arg0"
              ? "Undefined"
              : serializeAst(funAst.body.body.lambdas[0] [argIndex]),
            argAnno,
            funAnno,
            argAnnos), {tvid, instantiations, aliases, intros}));

      // disclose transitive relations

      ({tvid, instantiations, aliases, intros} = uncoverTransRel(
        {tvid, instantiations, aliases, intros}, lamIndex, null, funAnno, argAnnos));

      // remove interfering type aliases

      instantiations = remConflictingAliases(instantiations);

      // conduct occurs check

      instantiations.forEach(m => {
        m.forEach(({key: keyAst, value: valueAst}) =>
          occursCheck(keyAst, valueAst, instantiations, aliases, new Set(), lamIndex, null, funAnno, argAnnos));
      });

      /* After unification of the application the consumed type parameter must
      be removed from the AST and all instantiations must be substituted within
      the remaining subtree. Since the extracted subtree can include redundant
      `Forall` elements the entire subtree must be recreated. The type
      parameter(s) is/are removed before the substitution, because this spares
      some work. There might be several parameters due to scriptum's support of
      multi argument functions. */

      let unifiedAst = prettyPrint(
        recreateAst(
          substitute(
            remParams(funAst),
            instantiations)));

      // take variadic arguments into account

      switch (funAst.body.body.lambdas[0] [TAG]) {
        case "Argv": {
          args = args[0];
          break;
        }

        case "Argsv": {
          args = args.slice(0, -1).concat(args[args.length - 1]);
          break;
        }
      }

      // actually apply `fun` with `arg` on the term level

      let r = g(...args);

      // rule out `undefined` as return value

      if (r === undefined)
        throw new TypeError(cat(
          `illegal "undefined" result type\n`,
          "after applying the given function term to its argument(s)\n",
          `runtime immediately terminated\n`,
          extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));

      /* If the result value is a function the type validator cannot determine
      its type, because functions are opaque values. However, if the unified
      type is also a function type we can assume at this point that both types
      match. */

      else if (introspectFlat(r) === "Function") {

          // check whether the unified type is a function type as well

          if (unifiedAst[TAG] === "Forall"
            && unifiedAst.body[TAG] === "Fun")
              return go(r, lamIndex + 1, unifiedAst, serializeAst(unifiedAst));

          else
            throw new TypeError(cat(
              `result type mismatch in parameter #${lamIndex + 1}\n`,
              `expected: ${serializeAst(unifiedAst)}\n`,
              `received: ${introspectFlat(r)}\n`,
              extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));
      }

      // check whether the result is an ADT or TC

      else if (r && r[ADT]) {

        const tcons = r[ADT].match(new RegExp("^[A-Z][a-zA-Z0-9]*", "")) [0];

        // check whether the result is an ADT
        
        if (adtDict.has(tcons)) {
          
          // parse domain and codomain

          let domainAst = r.run[ANNO]
            ? parseAnno(new Map()) (r.run[ANNO])
            : parseAnno(new Map()) (introspectDeep_(r));
          
          let codomainAst = parseAnno(new Map()) (r[ADT]);

          // dequantify ADT AST considering TV introductions

          let intro;

          ({ast: unifiedAst, intro} = specializeLHS(new Map(), ".") (unifiedAst));

          if (intro.size > 0) intros.push(intro);

          // unify the function type application

          ({tvid, instantiations, aliases, intros} = unifyTypes(
            unifiedAst,
            codomainAst,
            0,
            0,
            {tvid, instantiations, aliases, intros},
            serializeAst(unifiedAst),
            r[ADT],
            funAnno,
            argAnnos));

          // disclose transitive relations

          ({tvid, instantiations, aliases, intros} = uncoverTransRel(
            {tvid, instantiations, aliases, intros}, null, null, funAnno, argAnnos));

          // remove contradictory instantiations

          instantiations = remConflictingAliases(instantiations);

          // conduct occurs check

          instantiations.forEach(m => {
            m.forEach(({key: keyAst, value: valueAst}) =>
              occursCheck(keyAst, valueAst, instantiations, aliases, new Set(), null, null, funAnno, argAnnos));
          });

          // dequantify domain/codomain

          ({ast: domainAst} = specializeLHS(new Map(), ".") (domainAst));
          ({ast: codomainAst} = specializeLHS(new Map(), ".") (codomainAst));

          // adjust domain according to the unified type using subsumption

          const domainAnno = serializeAst(
            prettyPrint(
              recreateAst(
                substitute(
                  domainAst,
                  instantiations))));

          // adjust codomain according to the unified type using subsumption

          const codomainAnno = serializeAst(
            prettyPrint(
              recreateAst(
                substitute(
                  codomainAst,
                  instantiations))));

          // update the ADT annotations

          if (r.run[ANNO])
            r.run[ANNO] = domainAnno;
          
          r[ADT] = codomainAnno;

          return r;
        }

        // no special treatment for TCs

        else if (tcDict.has(tcons))
          return r;

        else
          throw TypeError("internal error: ADT or TC expected @fun");
      }

      // unify the unified type with the actual term level result

      else {
        
        // introspect the value yielded at the term level

        const resultAnno = introspectDeep_(r);

        // dequantify the unified AST prior to unification

        ({ast: unifiedAst} = specializeLHS(new Map(), unifiedAst.scope) (unifiedAst));

        /* Attempt to unify type and term level to prove that the yielded value
        at the term level has the expected type, hence this unification process
        is completely decoupled from previous turns and possible new
        instantiations, aliases and introductions are discarded. */

        unifyTypes(
          unifiedAst,
          parseAnno(new Map()) (resultAnno),
          0,
          0,
          {tvid: 0, instantiations: new Map(), aliases: new Map(), intros: []},
          serializeAst(funAst.body.body.result),
          resultAnno,
          funAnno,
          argAnnos);

        return r;
      }
    };

    // attach current type annotation to term level function object

    getArgs[ANNO] = serializeAst(funAst);
    
    // return the typed function that awaits further arguments

    return getArgs;
  };

  /********************
   * MAIN ENTRY POINT *
   ********************/

  // bypass type validator

  if (CHECK === false) return f;

  // throw an error on untyped function

  else if (funAnno === undefined)
    throw new TypeError(cat(
      "missing type annotation\n",
      "scriptum only allows type annotated lambdas\n",
      "but an untyped lambda received\n"));

  // run the validator

  else {

    /* scriptum supports indentations and newlines to render type annotations
    more readable. These optional characters must be removed before type
    validation. */

    funAnno = funAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
      .replace(new RegExp(SAFE_SPACE, "g"), " ");

    /* The `fun` operation can only type lambdas, i.e. the top-level type must
    be a function type. */

    if (remNestings(remQuant(funAnno)).search(/ => /) === NOT_FOUND)
      throw new TypeError(cat(
        "top-level type must be a function\n",
        `but ${funAnno} received\n`));

    else {

      // parse the main function annotation

      const funAst = parseAnno(new Map()) (funAnno);

      // return the typed function

      return go(f, 0, funAst, funAnno);
    }
  }
};


/* Check for all instantiations of the form `TV => TV` whether there are
interfering mappings like

a => b1
b1 => a

and delete mappings from older to newer entries. */

const remConflictingAliases = instantiations => {
  instantiations.forEach(m => {
    const xs = Array.from(m);

    for (let i = 0; i < xs.length; i++) {
      const [, {key, value}] = xs[i];

      if (isTV(value)
        && instantiations.has(value.name)) {
          if (instantiations.get(value.name).has(`${value.name} ~ ${key.name}`)) {
            instantiations.get(value.name).delete(`${value.name} ~ ${key.name}`);

            if (instantiations.get(value.name).size === 0)
              instantiations.delete(value.name);
          }
      }
    }
  });

  return instantiations;
};


/* A TV or one of its type aliases on the LHS of an instantiation must not
occur within a composite type on the RHS, because this would introduce an
infinite definition. Infinite types lead to non-termination during
substitution and thus must be rejected by the type validator. */

const occursCheck = (keyAst, valueAst, instantiations, aliases, history, lamIndex, argIndex, funAnno, argAnnos) => {

  // return early if valueAst isn't a composite type

  if (!isTV(valueAst)
    && valueAst[TAG] !== "RowVar"
    && valueAst[TAG] !== "Tconst") {

      // throw an error if keyAst occurs in valueAst

      mapAst(ast => {
        if (isTV(ast)
          && ast.name === keyAst.name) {
            if (aliases.has(keyAst.name))
              throw new TypeError(cat(
                "occurs check failed\n",
                `"${keyAst.name}" or one of its aliases\n`,
                "occurs on the LHS and RHS of the type annotation\n",
                "cannot construct the resulting infinite type\n",
                extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

            else
              throw new TypeError(cat(
                "occurs check failed\n",
                `"${keyAst.name}" occurs on the LHS and RHS of the type annotation\n`,
                "cannot construct the resulting infinite type\n",
                extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
        }
        
        else return ast;
      }) (valueAst);

      // check alias occurrences if any

      if (aliases.has(keyAst.name)
        && !history.has(keyAst.name)) {
      
        // recursively check whether one of its aliases occurs in valueAst
        
        aliases.get(keyAst.name).forEach(([, aliasAst]) =>
          occursCheck(aliasAst, valueAst, instantiations, aliases, history.add(aliasAst.name), lamIndex, argIndex, funAnno, argAnnos));
      }
  }
};


/* Disclose transitive relations between TVs:

a ~ b
a ~ c

yields the type equality by transitivity

b ~ c */

const uncoverTransRel = ({tvid, instantiations, aliases, intros}, lamIndex, argIndex, funAnno, argAnnos) => {
  instantiations.forEach((m, keyAnno) => {
    const xs = Array.from(m);

    if (xs.length > 1) {
      for (let i = 1; i < xs.length; i++) {
        const [, {value: valueAst}] = xs[i];

        ({tvid, instantiations, aliases, intros} = unifyTypes(
          xs[0] [1].value,
          valueAst,
          lamIndex,
          argIndex,
          {tvid, instantiations, aliases, intros},
          keyAnno,
          serializeAst(valueAst),
          funAnno,
          argAnnos));
      }
    }
  });

  return {tvid, instantiations, aliases, intros};
};


/******************************************************************************
**************************[ UNIFICATION/SUBSUMPTION ]**************************
******************************************************************************/


const unifyTypes = (paramAst, argAst, lamIndex, argIndex, state, paramAnno, argAnno, funAnno, argAnnos) => {

  /* In order to determine if a function application `f(x)` is well typed in a
  language with higher-order functions and higher-rank types we must determine
  whether the type of `x` is a subtype of `f`'s type parameter, i.e. can safely
  be used in a context where the type of `f`'s' parameter is expected. Please
  note that in functional programming instead of "is a subtype of" we rather
  use the term "is at least as polymorphic as" relating to parametricity.

  Higher-rank types or impredicative types are only valid on the LHS of the
  function type. The function type is contravariant in its argument type and
  covariant in its result type. Contravariance flips the order of types whereas
  covariance maintains it.

  First-order:

  A => B <: C => D if
  B <: D (covariance)
  C <: A (contravariance)

  Higher-order:

  (A => B) => C <: (D => E) => F if
  C <: F (covariance)
  D => E <: A => B (contravariance) if
  E <: B
  A <: D

  The "<:" symbol denotes the "is a subtype of"/"is at least as polymorphic as"
  relation. For nested function types the variance rules must be applied several
  times leading to a somewhat confusing distribution of contra- and covariance.
  The less formal subsumption rule of function application reads as follows:

  The function application `f(x)` is type safe if `x <: p` holds.

  In the above judgement `x` is an argument type and `p` is `f`'s type parameter. */

  // destructure state

  let {tvid, instantiations, aliases, intros} = state;

  /* In order to conduct an escape check we need to determine which meta TVs a
  rigid TV is allowed to be instantiated with. All meta TVs that are introduced
  within the same subsumption judgement and that are not aliases of TVs of
  earlier introductions are legit instantiations. */

  let intro = new Map();

  /* Higher-rank TVs only exist in their scope and must not escape it. As the
  caller of a higher-rank function type you cannot pick a specific type for its
  higher-rank TVs and you cannot use this TVs outside the function's scope.
  The unification algorithm used in scriptum distinguish between meta and rigid
  TVs to address these issues. A rigid TV denotes a higher-rank one, which was
  located on the RHS of the subsumption judgement during instantiation. */

  if (argAst[TAG] === "Forall" && argAst.btvs.size > 0)
    ({ast: argAst, intro} = specializeLHS(intro, argAst.scope, ++tvid) (argAst));

  if (paramAst[TAG] === "Forall" && paramAst.btvs.size > 0)
    ({ast: paramAst, intro} = specializeRHS(intro, paramAst.scope, ++tvid) (paramAst));

  // make TV introduction persitent across function calls

  if (intro.size > 0) intros.push(intro);

  /* TVs can represent higher-kinded types, therefore their arity must be
  unified as well. If we assume that type constructors are generative and
  injective, the following instantiation rules apply:
  
  ~ = type equality
  !~ = type inequality

  f<a> ~ g<b, c, d>
  f<a, b, c> ~ g<d>
  F<a> !~ g<b, c, d>
  F<a, b, c> ~ g<d>
  f<a> ~ G<b, c, d>
  f<a, b, c> !~ G<d>
  F<a> !~ G<b, c, d>
  F<a, b, c> !~ G<d> */

  // the mother of all conditionals

  switch (paramAst[TAG]) {
    case "Adt": {
      switch (argAst[TAG]) {
        case "Adt": {// Adt<a, b> ~ Adt<c, d>
          if (paramAst.cons !== argAst.cons) {
            throw new TypeError(cat(
              "type constructor mismatch\n",
              `expected: ${paramAst.cons}\n`,
              `received: ${argAst.cons}\n`,
              "while unifying\n",
              `${paramAnno}\n`,
              `${argAnno}\n`,
              extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
          }

          else {
            return paramAst.body.reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }
        }

        case "BoundTV": // Adt<a, b> ~ bound c
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // Adt<a, b> ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {// Adt<a, b> ~ u<c> | u<c, d>
          if (argAst.body.length === 0) { // Adt<a, b> ~ c
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (argAst.body.length <= paramAst.body.length) { // Adt<a, b> ~ u<c> | u<c, d>
            ({instantiations, aliases} = instantiate( // Adt | Adt<a> ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                Array(argAst.body.length).fill(Partial)),
              paramAst.body.length === argAst.body.length
                ? Adt(paramAst.cons, Array(paramAst.body.length).fill(Partial))
                : Adt(
                    paramAst.cons,
                    paramAst.body.slice(0, paramAst.body.length - argAst.body.length)
                      .concat(Array(argAst.body.length).fill(Partial))),
              (refAst, fromAst, toAst) => {
                if (refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name)
                    return refAst.body.length === toAst.body.length
                      ? Adt(toAst.cons, refAst.body)
                      : Adt(
                          toAst.cons,
                          toAst.body.slice(0, toAst.body.length - refAst.body.length)
                            .concat(refAst.body));

                else return refAst
              },
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }

          else // Adt<a, b> ~ u<c, d, e>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        case "Partial": { // Adt<a, b> ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        default: // Adt<a, b> ~ composite type except Adt<a, b>
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "Arr": {
      switch (argAst[TAG]) {
        case "Arr": // [a] ~ [b]
          return unifyTypes(
            paramAst.body,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "BoundTV": // [a] ~ bound b
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // [a] ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
        
        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) { // [a] ~ b
            ({instantiations, aliases} = instantiate(
                argAst,
                paramAst,
                (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name
                    ? toAst
                    : refAst,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (argAst.body.length === 1) { // [a] ~ u<b>
            ({instantiations, aliases} = instantiate( // u ~ []
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                [Partial]),
              Arr(Partial),
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? Arr(refAst.body[0])
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return unifyTypes(
              paramAst.body,
              argAst.body[0],
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
          }

          else // [a] ~ u<b, c>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        case "Partial": { // [a] ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        default: // [a] ~ composite type except [b]
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "BoundTV":
      throw new TypeError(
        "internal error: unexpected bound type variable @unifyTypes");

    case "Forall": {
      switch (argAst[TAG]) {
        case "Forall": // forall ~ forall
          return unifyTypes(
            paramAst.body,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        default: // forall ~ any type except forall
          return unifyTypes(
            paramAst.body,
            argAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }      
    }

    case "Fun": {
      switch (argAst[TAG]) {
        case "BoundTV": // (a => b) ~ bound c
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // (a => b) ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "Fun": { // (a => b) ~ (c => d)

          /* The function type is contravariant in its argument and covariant in
          its result type. For the application of function composition with
          itself this means:

          comp :: (b => c) => (a => b) => a => c
          goal: comp(comp)
          
          (b1 => c1) => (a1 => b1) => a1 => c1 <: b => c
          b <: b1 => c1 // contravariant 
          (a1 => b1) => a1 => c1 <: c // covariant

          The result type can either by the remainder of the curried function
          sequence or the final result. */

          // contravariant subsumption

          if (paramAst.body.lambdas[0] [TAG] !== argAst.body.lambdas[0] [TAG]
            || paramAst.body.lambdas[0].length !== argAst.body.lambdas[0].length)
              throw new TypeError(cat(
                "arity mismatch\n",
                "cannot match argument list\n",
                `expected: ("${paramAst.body.lambdas.map(serializeAst).join(", ")}")\n`,
                `received: ("${argAst.body.lambdas.map(serializeAst).join(", ")}")\n`,
                "while unifying\n",
                `${paramAnno}\n`,
                `${argAnno}\n`,
                extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

          switch (paramAst.body.lambdas[0] [TAG]) {
            case "Arg0": break; // thunk
            
            /* Since the function type is contravariant in its argument type
            the subsumption judgement `arg <: param` is flipped by passing the
            argument AST first and then the parameter one. */

            case "Arg1": // single argument
            case "Argv": { // variadic argument
              ({tvid, instantiations, aliases, intros} = unifyTypes(
                argAst.body.lambdas[0] [0],
                paramAst.body.lambdas[0] [0],
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos));

              break;
            }
            
            /* Since the function type is contravariant in its argument type
            the subsumption judgement `arg <: param` is flipped by passing the
            argument AST first and then the parameter one. */

            case "Args": // multi argument
            case "Argsv": { // multi argument with a trailing variadic argument
              ({tvid, instantiations, aliases, intros} = paramAst.body.lambdas[0].reduce((acc, arg, i) =>
                unifyTypes(
                  argAst.body.lambdas[0] [i],
                  paramAst.body.lambdas[0] [i],
                  lamIndex,
                  argIndex,
                  {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                  paramAnno,
                  argAnno,
                  funAnno,
                  argAnnos), {tvid, instantiations, aliases, intros}));

              break;
            }

            default:
              throw new TypeError(
                "internal error: unknown argument list constructor @unifyTypes");
          }

          // covariant subsumption

          if (paramAst.body.lambdas.length === 1) {
            if (argAst.body.lambdas.length === 1) { // (a => b) ~ (c => d)
              return unifyTypes(
                paramAst.body.result,
                argAst.body.result,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }

            else { // (a => b) ~ (c => d => e)
              const argAst_ = Fun(
                argAst.body.lambdas.slice(1),
                argAst.body.result);

              return unifyTypes(
                paramAst.body.result,
                argAst_,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }
          }

          else {
            if (argAst.body.lambdas.length === 1) { // (a => b => c) ~ (d => e)
              const paramAst_ = Fun(
                paramAst.body.lambdas.slice(1),
                paramAst.body.result);

              return unifyTypes(
                paramAst_,
                argAst.body.result,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }

            else { // (a => b => c) ~ (d => e => f)
              const paramAst_ = Fun(
                paramAst.body.lambdas.slice(1),
                paramAst.body.result);

              const argAst_ = Fun(
                argAst.body.lambdas.slice(1),
                argAst.body.result);

              return unifyTypes(
                paramAst_,
                argAst_,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }
          }
        }

        case "MetaTV":
        case "RigidTV": { // zyx
          if (argAst.body.length === 0) { // (a => b) ~ c
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => {
                if (refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name)
                    return refAst.position === "codomain"
                      ? Codomain(...toAst.body.lambdas, toAst.body.result)
                      : Forall(new Set(), ".", toAst);

                else return refAst;
              },
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else {
            const arityDiff = determineArity(paramAst) - argAst.body.length;

            if (arityDiff === 0) { // (() => b) ~ u<c> | (a => b) ~ u<c, d> | (a, b => c) ~ u<d, e, f>

              // unify domain

              switch (paramAst.body.lambdas[0] [TAG]) {
                case "Arg0": {
                  ({instantiations, aliases} = instantiate( // (=>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      [Partial]),
                    Fun([new Arg0()], Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            ".",
                            Fun([
                              new Arg0()],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[0])));
                      }
                      
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  break;
                }

                case "Arg1": {
                  ({instantiations, aliases} = instantiate( // (=>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      [Partial, Partial]),
                    Fun([new Arg1(Partial)], Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            ".",
                            Fun([
                              new Arg1(refAst.body[0])],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[1])));
                      }
                      
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  ({tvid, instantiations, aliases, intros} = unifyTypes(
                    paramAst.body.lambdas[0] [0],
                    argAst.body[0],
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  break;
                }

                case "Args": {
                  ({instantiations, aliases} = instantiate( // (=>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      Array(argAst.body.length).fill(Partial)),
                    Fun([
                      Args.fromArr(Array(paramAst.body.lambdas[0].length).fill(Partial))],
                      Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            ".",
                            Fun([
                              Args.fromArr(refAst.body.slice(0, -1))],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[refAst.body.length - 1])));
                      }
                      
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  ({tvid, instantiations, aliases, intros} = paramAst.body.lambdas[0].reduce((acc, ast, i) =>
                    unifyTypes(
                      ast,
                      argAst.body[i],
                      lamIndex,
                      argIndex,
                      {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), {tvid, instantiations, aliases, intros}));

                  break;
                }

                default: // Argv/Argsv are excluded
                  unificationError(
                    serializeAst(paramAst),
                    serializeAst(argAst),
                    lamIndex,
                    argIndex,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);
              }
            }

            else if (arityDiff < 0) // (() => b) ~ u<c, d> | (a => b) ~ u<c, d, e> | (a, b => c) ~ u<d, e, f, g>
              unificationError(
                serializeAst(paramAst),
                serializeAst(argAst),
                lamIndex,
                argIndex,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);

            else { // (a => b) ~ u<c> | (a, b => c) ~ u<d, e>

              // unify domain
              
              switch (paramAst.body.lambdas[0] [TAG]) {
                case "Arg0": throw new TypeError(
                  "internal error: unexpected thunk @unifyTypes");

                case "Arg1": {
                  ({instantiations, aliases} = instantiate( // (a => ) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      [Partial]),
                    Fun([paramAst.body.lambdas[0]], Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            ".",
                            Fun([
                              toAst.body.lambdas[0]],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[0])));
                      }
                       
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  break;
                }

                case "Args": {
                  ({instantiations, aliases} = instantiate( // (a, b =>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      Array(argAst.body.length).fill(Partial)),
                    Fun([
                      paramAst.body.lambdas[0]
                        .slice(0, arityDiff)
                        .concat(Array(argAst.body.length - 1).fill(Partial))],
                      Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            ".",
                            Fun([
                              toAst.body.lambdas[0]
                                .slice(0, arityDiff)
                                .concat(Args.fromArr(refAst.body.slice(0, -1)))],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[refAst.body.length - 1])));
                      }

                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  ({tvid, instantiations, aliases, intros} = paramAst.body.lambdas[0]
                    .slice(arityDiff)
                    .reduce((acc, ast, i) =>
                      unifyTypes(
                        ast,
                        argAst.body[i],
                        lamIndex,
                        argIndex,
                        {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                        paramAnno,
                        argAnno,
                        funAnno,
                        argAnnos), {tvid, instantiations, aliases, intros}));

                  break;
                }

                default: // Argv/Argsv are excluded
                  unificationError(
                    serializeAst(paramAst),
                    serializeAst(argAst),
                    lamIndex,
                    argIndex,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);
              }
            }

            // unify codomain

            if (paramAst.body.lambdas.length === 1) {
              return unifyTypes(
                paramAst.body.result,
                argAst.body[argAst.body.length - 1],
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }

            else {
              const paramAst_ = Fun(
                paramAst.body.lambdas.slice(1),
                paramAst.body.result);

              return unifyTypes(
                paramAst_,
                argAst.body[argAst.body.length - 1],
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }
          }
        }

        case "Partial": { // (a => b) ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        default: // (a => b) ~ composite type except (c => d)
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "MetaTV":
    case "RigidTV": {
      switch (argAst[TAG]) {
        case "BoundTV": // a ~ bound b
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall":
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": { // xyz

          /* Generic type constructors can abstract over arity, hence the latter
          has to be taken into account. */

          if (paramAst.body.length === 0 && argAst.body.length === 0) { // a ~ b
            if (paramAst.name === argAst.name) // a ~ a
              return {tvid, instantiations, aliases, intros};

            else {
              ({instantiations, aliases} = instantiate( // a ~ b
                paramAst,
                argAst,
                (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name
                    ? toAst
                    : refAst,
                  lamIndex,
                  argIndex,
                  {tvid, instantiations, aliases, intros},
                  paramAnno,
                  argAnno,
                  funAnno,
                  argAnnos));

              return {tvid, instantiations, aliases, intros};
            }
          }

          else if (paramAst.body.length === 0) { // a ~ u<b>
            ({instantiations, aliases} = instantiate(
              paramAst,
              argAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (argAst.body.length === 0) { // t<a> ~ b
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          const arityDiff = paramAst.body.length - argAst.body.length;
          
          if (arityDiff === 0) { // t<a, b> ~ u<c, d>
            if (paramAst.name === argAst.name) { // t ~ t
              // noop
            }

            else { // t ~ u
              ({instantiations, aliases} = instantiate(
                (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                  paramAst.name,
                  paramAst.scope,
                  paramAst.position,
                  Array(paramAst.body.length).fill(Partial)),
                (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                  argAst.name,
                  argAst.scope,
                  argAst.position,
                  Array(argAst.body.length).fill(Partial)),
                (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name
                    ? (toAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                        toAst.name,
                        toAst.scope,
                        toAst.position,
                        refAst.body)
                    : refAst,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos));
            }

            return paramAst.body.reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }
          
          else if (arityDiff < 0) { // t<a, b> ~ u<c, d, e, f>
            const fields = argAst.body.slice(arityDiff);

            ({instantiations, aliases} = instantiate( // t ~ u<c, d>
              (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                paramAst.name,
                paramAst.scope,
                paramAst.position,
                Array(paramAst.body.length).fill(Partial)),
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.body.slice(0, argAst.body.length - paramAst.body.length)
                  .concat(Array(paramAst.body.length).fill(Partial))),
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? (toAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      toAst.name,
                      toAst.scope,
                      toAst.position,
                      refAst.body.slice(arityDiff))
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return fields.reduce((acc, field, i) =>
              unifyTypes(
                paramAst.body[i],
                field,
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }

          else if (arityDiff > 0) { // t<a, b, c, d> ~ u<e, f>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
          }
        }

        case "Partial": { // a | t<a> ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        default: { // xyz
          if (paramAst.body.length === 0) { // a ~ composite type
            if (argAst[TAG] === "Fun") { // a ~ (b => c)
              ({instantiations, aliases} = instantiate(
                paramAst,
                argAst,
                (refAst, fromAst, toAst) => {
                  if (refAst[TAG] === fromAst[TAG]
                    && refAst.name === fromAst.name)
                      return refAst.position === "codomain"
                        ? Codomain(...toAst.body.lambdas, toAst.body.result)
                        : Forall(new Set(), ".", toAst);
                  
                  else return refAst;
                },
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos));

              return {tvid, instantiations, aliases, intros};
            }

            else {
              ({instantiations, aliases} = instantiate( // a ~ composite type
                paramAst,
                argAst,
                (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name
                    ? toAst
                    : refAst,
                lamIndex,
                argIndex,
                {tvid, instantiations, aliases, intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos));

              return {tvid, instantiations, aliases, intros};
            }
          }

          else {
            const argArity = determineArity(argAst);
            
            if (paramAst.body.length > argArity)
              throw new TypeError(cat(
                "type constructor arity mismatch\n",
                `expected: ${serializeAst(paramAst)}\n`,
                `received: ${serializeAst(argAst)}\n`,
                "while unifying\n",
                `${paramAnno}\n`,
                `${argAnno}\n`,
                extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

            else {
              switch (argAst[TAG]) {
                case "Adt": { // t<a> | t<a, b> ~ Adt<c, d>
                  if (paramAst.body.length === 0) { // a ~ Adt<b, c>
                    ({instantiations, aliases} = instantiate(
                      paramAst,
                      argAst,
                      (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name
                          ? toAst
                          : refAst,
                      lamIndex,
                      argIndex,
                      {tvid, instantiations, aliases, intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos));

                    return {tvid, instantiations, aliases, intros};
                  }

                  else if (paramAst.body.length <= argArity) { // t<a> | t<a, b> ~ Adt<c, d>
                    ({instantiations, aliases} = instantiate( // t ~ Adt | Adt<b>
                      (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                        paramAst.name,
                        paramAst.scope,
                        paramAst.position,
                        Array(paramAst.body.length).fill(Partial)),
                      argArity === paramAst.body.length
                        ? Adt(argAst.cons, Array(argArity).fill(Partial))
                        : Adt(
                            argAst.cons,
                            argAst.body.slice(0, argArity - paramAst.body.length)
                              .concat(Array(paramAst.body.length).fill(Partial))),
                      (refAst, fromAst, toAst) => {
                        if (refAst[TAG] === fromAst[TAG]
                          && refAst.name === fromAst.name) {
                            if (refAst.body.length === 0)
                              return toAst;

                            else if (refAst.body.length < toAst.body.length)
                              return Adt(
                                toAst.cons,
                                toAst.body.slice(0, -refAst.body.length)
                                  .concat(refAst.body));

                            else return Adt(
                              toAst.cons,
                              refAst.body);
                        }

                        else return refAst;
                      },
                      lamIndex,
                      argIndex,
                      {tvid, instantiations, aliases, intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos));

                    return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                      unifyTypes(
                        paramAst.body[i],
                        field,
                        lamIndex,
                        argIndex,
                        {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                        paramAnno,
                        argAnno,
                        funAnno,
                        argAnnos), {tvid, instantiations, aliases, intros});
                  }

                  else // t<a, b, c> ~ Adt<d, e>
                    unificationError(
                      serializeAst(argAst),
                      serializeAst(paramAst),
                      lamIndex,
                      argIndex,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos);
                }

                case "Arr":
                case "Nea": { // t<a> ~ [b] | [1b]
                  ({instantiations, aliases} = instantiate( // t ~ [] | [1]
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      [Partial]),
                    (argAst[TAG] === "Arr" ? Arr : Nea) (Partial),
                    (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                      && refAst.name === fromAst.name
                        ? (toAst[TAG] === "Arr" ? Arr : Nea) (refAst.body[0])
                        : refAst,
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  return unifyTypes(
                    paramAst.body[0],
                    argAst.body,
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);
                }

                case "Fun": { // zyx
                  const arityDiff = argArity - paramAst.body.length;

                  if (arityDiff === 0) { // t<a> ~ (() => b) | t<a, b> ~ (c => d) | t<a, b, c> ~ (d, e => f)

                    // unify domain
            
                    switch (argAst.body.lambdas[0] [TAG]) {
                      case "Arg0": {
                        ({instantiations, aliases} = instantiate( // t ~ (=>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            [Partial]),
                          Fun([new Arg0()], Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  ".",
                                  Fun(
                                    [new Arg0()],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[0])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          {tvid, instantiations, aliases, intros},
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos));

                        break;
                      }

                      case "Arg1": {
                        ({instantiations, aliases} = instantiate( // t ~ (=>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            [Partial, Partial]),
                          Fun([new Arg1(Partial)], Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  ".",
                                  Fun(
                                    [new Arg1(refAst.body[0])],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[1])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          {tvid, instantiations, aliases, intros},
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos));

                        ({tvid, instantiations, aliases, intros} = unifyTypes(
                          paramAst.body[0],
                          argAst.body.lambdas[0] [0],
                          lamIndex,
                          argIndex,
                          {tvid, instantiations, aliases, intros},
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos));

                        break;
                      }

                      case "Args": {
                        ({instantiations, aliases} = instantiate( // t ~ (=>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            Array(paramAst.body.length).fill(Partial)),
                          Fun([
                            Args.fromArr(Array(argAst.body.lambdas[0].length).fill(Partial))],
                            Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  ".",
                                  Fun(
                                    [Args.fromArr(refAst.body.slice(0, -1))],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[refAst.body.length - 1])));
                            }
                            
                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          {tvid, instantiations, aliases, intros},
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos));

                        ({tvid, instantiations, aliases, intros} = argAst.body.lambdas[0].reduce((acc, ast, i) =>
                          unifyTypes(
                            paramAst.body[i],
                            ast,
                            lamIndex,
                            argIndex,
                            {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                            paramAnno,
                            argAnno,
                            funAnno,
                            argAnnos), {tvid, instantiations, aliases, intros}));

                        break;
                      }

                      default: // Argv/Argsv are excluded
                        unificationError(
                          serializeAst(paramAst),
                          serializeAst(argAst),
                          lamIndex,
                          argIndex,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);
                    }
                  }

                  else if (arityDiff < 0) // t<a, b> ~ (() => c) | t<a, b, c> ~ (d => e) | t<a, b, c, d> ~ (e, f => g)
                    unificationError(
                      serializeAst(paramAst),
                      serializeAst(argAst),
                      lamIndex,
                      argIndex,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos);

                  else { // t<a> ~ (b => c) | t<a, b> ~ (c, d => e)

                    // unify domain
            
                    switch (argAst.body.lambdas[0] [TAG]) {
                      case "Arg0": throw new TypeError(
                        "internal error: unexpected thunk @unifyTypes");

                      case "Arg1": {
                        ({instantiations, aliases} = instantiate( // t ~ (b => )
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            [Partial]),
                          Fun([argAst.body.lambdas[0]], Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  ".",
                                  Fun(
                                    [toAst.body.lambdas[0]],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[0])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          {tvid, instantiations, aliases, intros},
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos));

                        break;
                      }

                      case "Args": {
                        ({instantiations, aliases} = instantiate( // t ~ (b, c =>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            Array(paramAst.body.length).fill(Partial)),
                          Fun([
                            argAst.body.lambdas[0]
                              .slice(0, arityDiff)
                              .concat(Array(paramAst.body.length - 1).fill(Partial))],
                            Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  ".",
                                  Fun(
                                    [toAst.body.lambdas[0]
                                      .slice(0, arityDiff)
                                      .concat(Args.fromArr(refAst.body.slice(0, -1)))],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[refAst.body.length - 1])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          {tvid, instantiations, aliases, intros},
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos));

                        ({tvid, instantiations, aliases, intros} = argAst.body.lambdas[0]
                          .slice(arityDiff)
                          .reduce((acc, ast, i) =>
                            unifyTypes(
                              paramAst.body[i],
                              ast,
                              lamIndex,
                              argIndex,
                              {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                              paramAnno,
                              argAnno,
                              funAnno,
                              argAnnos), {tvid, instantiations, aliases, intros}));

                        break;
                      }

                      default: // Argv/Argsv are excluded
                        unificationError(
                          serializeAst(paramAst),
                          serializeAst(argAst),
                          lamIndex,
                          argIndex,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);
                    }
                  }

                  // unify codomain

                  if (argAst.body.lambdas.length === 1) {
                    return unifyTypes(
                      paramAst.body[paramAst.body.length - 1],
                      argAst.body.result,
                      lamIndex,
                      argIndex,
                      {tvid, instantiations, aliases, intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos);
                  }

                  else {
                    const argAst_ = Fun(
                      argAst.body.lambdas.slice(1),
                      argAst.body.result);

                    return unifyTypes(
                      paramAst.body[paramAst.body.length - 1],
                      argAst_,
                      lamIndex,
                      argIndex,
                      {tvid, instantiations, aliases, intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos);
                  }
                }

                case "Native": { // t<a> | t<a, b> ~ Set<c, d>
                  ({instantiations, aliases} = instantiate( // t ~ Set | Set<c>
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      Array(paramAst.body.length).fill(Partial)),
                    argArity === paramAst.body.length
                      ? Native(argAst.cons, Array(argArity).fill(Partial))
                      : Native(
                          argAst.cons,
                          argAst.body.slice(0, argArity - paramAst.body.length)
                            .concat(Array(paramAst.body.length).fill(Partial))),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name)
                          return refAst.body.length === toAst.body.length
                            ? Native(toAst.cons, refAst.body)
                            : Native(
                                toAst.cons,
                                toAst.body.slice(0, toAst.body.length - refAst.body.length)
                                  .concat(refAst.body));
                        
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                    unifyTypes(
                      paramAst.body[i],
                      field,
                      lamIndex,
                      argIndex,
                      {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), {tvid, instantiations, aliases, intros});
                }

                case "Obj": { // t<a> | t<a, b> ~ {foo: b, bar: c}
                  ({instantiations, aliases} = instantiate( // t ~ {foo:, bar:} | {foo: b, bar:}
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      Array(paramAst.body.length).fill(Partial)),
                    argArity === paramAst.body.length
                      ? Obj(
                          argAst.cons,
                          argAst.props,
                          argAst.row,
                          Array(argArity)
                            .fill(Partial)
                            .map((field, i) => ({k: argAst.props[i], v: field})))
                      : Obj(
                          argAst.cons,
                          argAst.props,
                          argAst.row,
                          argAst.body.slice(0, argArity - paramAst.body.length)
                            .concat(Array(paramAst.body.length)
                              .fill(Partial)
                              .map((field, i) => ({k: argAst.props[i], v: field})))),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          if (refAst.body.length === toAst.body.length)
                            return Obj(
                              toAst.cons,
                              toAst.props,
                              toAst.row,
                              refAst.body.map((field, i) =>
                                ({k: toAst.props[i], v: field})));

                           else return Obj(
                              toAst.cons,
                              toAst.props,
                              toAst.row,
                              toAst.body.slice(0, toAst.body.length - refAst.body.length)
                                .concat(refAst.body.map((field, i) =>
                                  ({k: toAst.props[i + toAst.body.length - refAst.body.length], v: field}))));
                        }
                        
                        else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                    unifyTypes(
                      paramAst.body[i],
                      field.v,
                      lamIndex,
                      argIndex,
                      {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), {tvid, instantiations, aliases, intros});
                }

                case "Tup": { // t<a> | t<a, b> ~ [c, d] | [c, d, e]
                  ({instantiations, aliases} = instantiate( // t ~ [,] | [c,]
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      Array(paramAst.body.length).fill(Partial)),
                    argArity === paramAst.body.length
                      ? Tup(argArity, Array(argArity).fill(Partial))
                      : Tup(
                          argArity,
                          argAst.body.slice(0, argArity - paramAst.body.length)
                            .concat(Array(paramAst.body.length).fill(Partial))),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name)
                          return refAst.body.length === toAst.body.length
                            ? Tup(toAst.body.length, refAst.body)
                            : Tup(
                                toAst.body.length,
                                toAst.body.slice(0, toAst.body.length - refAst.body.length)
                                  .concat(refAst.body));
                      
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    {tvid, instantiations, aliases, intros},
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos));

                  return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                    unifyTypes(
                      paramAst.body[i],
                      field,
                      lamIndex,
                      argIndex,
                      {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), {tvid, instantiations, aliases, intros});
                }

                default:
                  throw new TypeError(
                    "internal error: unknown value constructor @unifyTypes");
              }
            }
          }
        }
      }
    }

    case "Native": {
      switch (argAst[TAG]) {
        case "BoundTV": // Map<a, b> ~ bound c
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // Map<a, b> ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) { // Map<a, b> ~ c
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (argAst.body.length <= paramAst.body.length) { // Map<a, b> ~ u<c> | u<c, d>
            ({instantiations, aliases} = instantiate( // Map | Map<a> ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                Array(argAst.body.length).fill(Partial)),
              paramAst.body.length === argAst.body.length
                ? Native(paramAst.cons, Array(paramAst.body.length).fill(Partial))
                : Native(
                    paramAst.cons,
                    paramAst.body.slice(0, paramAst.body.length - argAst.body.length)
                      .concat(Array(argAst.body.length).fill(Partial))),
              (refAst, fromAst, toAst) => {
                if (refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name)
                    return refAst.body.length === toAst.body.length
                      ? Native(toAst.cons, refAst.body)
                      : Native(
                          toAst.cons,
                          toAst.body.slice(0, toAst.body.length - refAst.body.length)
                            .concat(refAst.body));

                else return refAst;
              },
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }

          else // Map<a, b> ~ u<c, d, e>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        case "Native": { // Map<a, b> ~ Set<c, d>
          if (paramAst.cons !== argAst.cons) {
            throw new TypeError(cat(
              "type constructor mismatch\n",
              `expected: ${paramAst.cons}\n`,
              `received: ${argAst.cons}\n`,
              "while unifying\n",
              `${paramAnno}\n`,
              `${argAnno}\n`,
              extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
          }

          else {
            return paramAst.body.reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }
        }

        case "Partial": { // Map<a, b> ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        default: // Map<a, b> ~ composite type except U<b>
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "Nea": {
      switch (argAst[TAG]) {
        case "BoundTV": // [1a] ~ bound b
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // [1a] ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": { // [1a] ~ b
          if (argAst.body.length === 0) { // [1a] ~ b
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (argAst.body.length === 1) { // [1a] ~ u<b>
            ({instantiations, aliases} = instantiate( // [1] ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                [Partial]),
              Nea(Partial),
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? Nea(refAst.body[0])
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return unifyTypes(
              paramAst.body,
              argAst.body[0],
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
          }

          else // [1a] ~ u<b, c>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        case "Nea": // [1a] ~ [1b]
          return unifyTypes(
            paramAst.body,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
        
        case "Partial": { // [1a] ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        default: // [1a] ~ composite type except [1b]
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "Obj": {
      switch (argAst[TAG]) {
        case "BoundTV": // {foo: a, bar: b} ~ bound c
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // {foo: a, bar: b} ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) { // {foo: a, bar: b} ~ c
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (argAst.body.length <= paramAst.body.length) { // {foo: a, bar: b} ~ u<c> | u<c, d>
            ({instantiations, aliases} = instantiate( // {foo:, bar:} | {foo: a, bar:} ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                Array(argAst.body.length).fill(Partial)),
              paramAst.body.length === argAst.body.length
                ? Obj(
                    paramAst.cons,
                    paramAst.props,
                    paramAst.row,
                    Array(paramAst.body.length)
                      .fill(Partial)
                      .map((field, i) => ({k: paramAst.props[i], v: field})))
                : Obj(
                    paramAst.cons,
                    paramAst.props,
                    paramAst.row,
                    paramAst.body.slice(0, paramAst.body.length - argAst.body.length)
                      .concat(Array(argAst.body.length)
                        .fill(Partial)
                        .map((field, i) => ({k: paramAst.props[i], v: field})))),
              (refAst, fromAst, toAst) => {
                if (refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name) {
                    if (refAst.body.length === toAst.body.length)
                      return Obj(
                        toAst.cons,
                        toAst.props,
                        toAst.row,
                        refAst.body.map((field, i) =>
                          ({k: toAst.props[i], v: field})));

                    else return Obj(
                      toAst.cons,
                      toAst.props,
                      toAst.row,
                      toAst.body.slice(0, toAst.body.length - refAst.body.length)
                        .concat(refAst.body.map((field, i) =>
                          ({k: toAst.props[i + toAst.body.length - refAst.body.length], v: field}))));
                }

                else return refAst;
              },
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i].v,
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }

          else // {foo: a, bar: b} ~ u<c, d, e>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        case "Obj": { // {foo: a, bar: b} ~ {foo: c, bar: d}

          /* Objects are treated as an unordered map of key-value pairs. */

          // {foo: a, bar: b | x} ~ {foo: c | y} -- FAILS (arg row is ignored)
          // {foo: a | x} ~ {foo: c, bar: d | y} -- OK with x ~ bar: d (y remain unresolved)
          // {foo: a, bar: b | x} ~ {foo: c, bar: d | y} -- OK with x ~ "" (y remain unresolved)

          // {foo: a, bar: b | x} ~ {foo: c} -- FAILS
          // {foo: a | x} ~ {foo: c, bar: d} -- OK with x ~ bar: d
          // {foo: a, bar: b | x} ~ {foo: c, bar: d} -- OK with x ~ ""

          // {foo: a, bar: b} ~ {foo: c | y} -- FAILS (arg row is ignored)
          // {foo: a} ~ {foo: c, bar: d | y} -- FAILS
          // {foo: a, bar: b} ~ {foo: c, bar: d | y} -- OK (arg row is ignored)

          if ((paramAst.cons !== null || argAst.cons !== null)
            && paramAst.cons !== argAst.cons) {
              throw new TypeError(cat(
                "type constructor mismatch\n",
                `expected: ${paramAst.cons}\n`,
                `received: ${argAst.cons}\n`,
                "while unifying\n",
                `${paramAnno}\n`,
                `${argAnno}\n`,
                extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
          }

          else if (paramAst.row !== null) { // {foo: a | x} ~ {foo: b, bar: c}
            const paramMap = new Map([
              ...paramAst.body.map(({k, v}) => [k, v])]);

            const argMap = new Map([
              ...argAst.body.map(({k, v}) => [k, v])]);

            const diffMap = argAst.body.reduce((acc, {k, v}) =>
              paramMap.has(k)
                ? acc : acc.set(k, v), new Map());

            const rowType = [];

            diffMap.forEach((v, k) => {
              rowType.push({k, v});
            });

            paramMap.forEach((v, k) => {
              if (!argMap.has(k))
                throw new TypeError(cat(
                  "structural type mismatch\n",
                  `required property "${k}" is missing\n`,
                  "while unifying\n",
                  `${paramAnno}\n`,
                  `${argAnno}\n`,
                  extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
            });

            ({tvid, instantiations, aliases, intros} = paramAst.body.reduce((acc, {k, v}, i) => {
              return unifyTypes(
                v,
                argMap.get(k),
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos)
            }, {tvid, instantiations, aliases, intros}));

            ({instantiations, aliases} = instantiate(
              paramAst.row,
              RowType(rowType),
              (refAst, fromAst, toAst) => {
                if (refAst[TAG] === "Obj"
                && refAst.row !== null
                && refAst.row.name === fromAst.name
                && fromAst[TAG] === "RowVar") {
                  return Obj(
                    refAst.cons,
                    refAst.props.concat(
                      toAst.body.map(({k, v}) => k)),
                    argAst.row,
                    refAst.body.concat(toAst.body))
                }
                
                else return refAst;
              },
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (paramAst.body.length !== argAst.body.length) { // {foo: a, bar: b} ~ {foo: c} | {foo: c, bar: d, baz: e}
            throw new TypeError(cat(
              "structural type mismatch\n",
              `expected: ${serializeAst(paramAst)}\n`,
              `received: ${serializeAst(argAst)}\n`,
              "while unifying\n",
              `${paramAnno}\n`,
              `${argAnno}\n`,
              extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
          }

          else { // {foo: a, bar: b} ~ {foo: c, bar: d}
            const argMap = new Map([
              ...argAst.body.map(({k, v}) => [k, v])]);

            return paramAst.body.reduce((acc, {k, v}, i) => {
              if (!argMap.has(k))
                throw new TypeError(cat(
                  "structural type mismatch\n",
                  `expected property: ${k}\n`,
                  `received property: ${argAst.body[i].k}\n`,
                  "while unifying\n",
                  `${paramAnno}\n`,
                  `${argAnno}\n`,
                  extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

              else
                return unifyTypes(
                  v,
                  argMap.get(k),
                  lamIndex,
                  argIndex,
                  {tvid, instantiations, aliases, intros},
                  paramAnno,
                  argAnno,
                  funAnno,
                  argAnnos)
            }, instantiations);
          }
        }
        
        case "Partial": { // {foo: a, bar: b} ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        case "This": { // {foo: a, bar: b} ~ this*
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
        }

        default: // {foo: a, bar: b} ~ composite type except {}
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "Partial": {
      switch (argAst[TAG]) {
        case "Partial":
          return {tvid, instantiations, aliases, intros}; // __ ~ __

        case "Tconst": { // __ ~ U
          ({instantiations, aliases} = instantiate(
            paramAst,
            argAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        default: // __ ~ any other type expect Partial
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "Tconst": {
      switch (argAst[TAG]) {
        case "BoundTV": // T ~ bound b
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // T ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) { // T ~ b
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else // T ~ u<b>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        case "Partial": { // T ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        case "Tconst": { // T ~ U
          if (paramAst.name === argAst.name)
            return {tvid, instantiations, aliases, intros};

          else
            unificationError(
              paramAst.name,
              argAst.name,
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        default: // T ~ composite type except U
          unificationError(
            paramAst.name,
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "This": {
      switch (argAst[TAG]) {
        case "Obj": { // this* ~ {foo: b, bar: c}
          return unifyTypes(
            paramAst.body,
            argAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
        }

        case "This": // this* ~ this*
          return {tvid, instantiations, aliases, intros};

        default:
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    case "Tup": {
      switch (argAst[TAG]) {
        case "BoundTV": // [a, b] ~ bound c
          throw new TypeError(
            "internal error: unexpected bound type variable @unifyTypes");

        case "Forall": // [a, b] ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) { // [a, b] ~ c
            ({instantiations, aliases} = instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return {tvid, instantiations, aliases, intros};
          }

          else if (argAst.body.length <= paramAst.body.length) { // [a, b] ~ u<c> | u<c, d>
            ({instantiations, aliases} = instantiate( // [,] | [a,] ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                Array(argAst.body.length).fill(Partial)),
              paramAst.body.length === argAst.body.length
                ? Tup(paramAst.body.length, Array(paramAst.body.length).fill(Partial))
                : Tup(
                    paramAst.body.length,
                    paramAst.body.slice(0, paramAst.body.length - argAst.body.length)
                      .concat(Array(argAst.body.length).fill(Partial))),
              (refAst, fromAst, toAst) => {
                if (refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name)
                    return refAst.body.length === toAst.body.length
                      ? Tup(toAst.body.length, refAst.body)
                      : Tup(
                          toAst.body.length,
                          toAst.body.slice(0, toAst.body.length - refAst.body.length)
                            .concat(refAst.body));

                else return refAst;
              },
              lamIndex,
              argIndex,
              {tvid, instantiations, aliases, intros},
              paramAnno,
              argAnno,
              funAnno,
              argAnnos));

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
          }

          else // [a, b] ~ u<c, d, e>
            unificationError(
              serializeAst(paramAst),
              serializeAst(argAst),
              lamIndex,
              argIndex,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
        }

        case "Partial": { // [a, b] ~ __
          ({instantiations, aliases} = instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            {tvid, instantiations, aliases, intros},
            paramAnno,
            argAnno,
            funAnno,
            argAnnos));

          return {tvid, instantiations, aliases, intros};
        }

        case "Tup": { // [a, b] ~ [c, d]
          if (paramAst.body.length !== argAst.body.length)
            throw new TypeError(cat(
              "Tuple mismatch\n",
              `expected: ${serializeAst(paramAst)}\n`,
              `received: ${serializeAst(argAst)}\n`,
              "while unifying\n",
              `${paramAnno}\n`,
              `${argAnno}\n`,
              extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

          else
            return paramAst.body.reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                {tvid: acc.tvid, instantiations: acc.instantiations, aliases: acc.aliases, intros: acc.intros},
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), {tvid, instantiations, aliases, intros});
        }

        default: // [a, b] ~ composite type except [c, d]
          unificationError(
            serializeAst(paramAst),
            serializeAst(argAst),
            lamIndex,
            argIndex,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
      }
    }

    default: throw new TypeError(
      "internal error: unknown type @unifyTypes");
  }
};


/***[ Combinators ]***********************************************************/


const unificationError = (paramAnno_, argAnno_, lamIndex, argIndex, instantiations, paramAnno, argAnno, funAnno, argAnnos) => {
  throw new TypeError(cat(
    "type mismatch\n",
    "cannot unify the following types:\n",
    `${paramAnno_}\n`,
    `${argAnno_}\n`,
    paramAnno !== paramAnno_ && argAnno !== argAnno_
      ? cat(
        "while unifying\n",
        `${paramAnno}\n`,
        `${argAnno}\n`)
      : "",
    extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
};


/******************************************************************************
*******************************************************************************
*******************************[ INSTANTIATION ]*******************************
*******************************************************************************
******************************************************************************/


/* Rigid TVs that are on the LHS of a nested function type must only be
instantiated with themselves or with meta TVs within the same scope. The latter
holds, if the meta TV is introduced within the same scope or later during
unification. */

const instantiate = (key, value, substitutor, lamIndex, argIndex, state, paramAnno, argAnno, funAnno, argAnnos) => {

  // destructure state

  let {tvid, instantiations, aliases, intros} = state;

  // skip scope check for row variables

  if (key[TAG] === "RowVar")
    return setNestedMap(
      key.name, `${key.name} ~ ${serializeAst(value)}`, {key, value, substitutor})
        (instantiations);

  // ensure that key is a TV

  else if (isTV(key)) {
    if (isTV(value)) {
      const [keyAlpha, keyDigit = "0"] = key.name.split(/(?<!\d)(?=\d)/),
        [valueAlpha, valueDigit = "0"] = value.name.split(/(?<!\d)(?=\d)/);

      if (keyAlpha === valueAlpha
        && keyDigit < valueDigit) {

          /* Always maintain a descending order from keys to values of TV names
          provided the non-digit part of both is the same. */

          [key, value] = [value, key];
      }

      // store aliases due to commutativity of type equality

      if (aliases.has(key.name))
        aliases.get(key.name).set(`${key.name} ~ ${value.name}`, [key, value]);

      else
        aliases.set(key.name, new Map([[`${key.name} ~ ${value.name}`, [key, value]]]));

      if (aliases.has(value.name))
        aliases.get(value.name).set(`${value.name} ~ ${key.name}`, [value, key]);

      else
        aliases.set(value.name, new Map([[`${value.name} ~ ${key.name}`, [value, key]]]));
    }
  }

  else if ((isTV(value)))
    [key, value] = [value, key]; // swap values

  else throw new TypeError(cat(
    `can only instantiate type variables with another type\n`,
    `but "${serializeAst(key)}" received\n`,
    "while unifying\n",
    `${paramAnno}\n`,
    `${argAnno}\n`,
    extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

  // rigid TV ~ ?

  if (key[TAG] === "RigidTV") {

    // rigid TV ~ meta TV

    if (value[TAG] === "MetaTV")
      escapeCheck(key, value, instantiations, intros, aliases, new Set(), null, null, paramAnno, argAnno, funAnno, argAnnos);

    // rigid TV ~ rigid TV

    else if (value[TAG] === "RigidTV")
      escapeCheck(key, value, instantiations, intros, aliases, new Set(), null, null, paramAnno, argAnno, funAnno, argAnnos);

    // rigid TV ~ composite type

    else if (!isTV(value))
      throw new TypeError(cat(
        `cannot instantiate rigid type variable "${key.name}"\n`,
        `with "${serializeAst(value)}"\n`,
        "rigid type variables can only be instantiated with themselves\n",
        "or with meta type variables within the same scope\n",
        "while unifying\n",
        `${paramAnno}\n`,
        `${argAnno}\n`,
        extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
  }

  // meta TV ~ ?

  else {

    // meta TV ~ rigid TV

    if (value[TAG] === "RigidTV")
      escapeCheck(value, key, instantiations, intros, aliases, new Set(), null, null, paramAnno, argAnno, funAnno, argAnnos);

    // meta TV ~ meta TV is skipped, because there are no restrictions

    // meta TV ~ composite type possibly containing rigid TVs

    reduceAst((acc, value_) => {
      if (value_[TAG] === "RigidTV")
        escapeCheck(value_, key, instantiations, intros, aliases, new Set(), null, null, paramAnno, argAnno, funAnno, argAnnos);

      else return acc;
    }, null) (value);
  }

  /* Check if the current TV already has an instantiation and if any, try to
  unify both. If the unification with the first entry succeeds, the process can
  be terminated prematurely, because other possible entries are guaranteed to
  pass unification as well. Any new instantiations or aliases, which may occur
  during unification, are discarded. The `try`/`catch` block is required to
  improve error messaging. */

  if (instantiations.has(key.name)
    && instantiations.get(key.name).size > 0) {
      try {
        unifyTypes(
          Array.from(instantiations.get(key.name)) [0] [1].value,
          value,
          lamIndex,
          argIndex,
          {tvid, instantiations: new Map(), aliases, intros: []},
          paramAnno,
          argAnno,
          funAnno,
          argAnnos);
      }

      catch (e) {
        throw new TypeError(cat(
          `cannot instantiate "${key.name}" with "${serializeAst(value)}"\n`,
          `because "${key.name}" is already instantiated with `,
          `"${serializeAst(Array.from(instantiations.get(key.name)) [0] [1].value)}"\n`,
          "while unifying\n",
          `${paramAnno}\n`,
          `${argAnno}\n`,
          extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));        
      }
  }

  instantiations = setNestedMap(
    key.name, `${key.name} ~ ${serializeAst(value)}`, {key, value, substitutor})
      (instantiations);

  return {instantiations, aliases};
};


const escapeCheck = (rigid, meta, instantiations, intros, aliases, history, lamIndex, argIndex, paramAnno, argAnno, funAnno, argAnnos) => {

  let iterRigid = null, iterMeta = null;

  // traverse the introduction list

  for (let i = 0; i < intros.length; i ++) {
    const m = intros[i];

    // persist the index if rigid TV is a member of the current introduction

    if (m.has(rigid.name))
      iterRigid = i;

    // persist the index if meta TV is a member of the current introduction

    if (m.has(meta.name))
      iterMeta = i;
  }

  if ((iterRigid === null && iterMeta === null)
    || (iterRigid === null && iterMeta !== null)
    || (iterRigid !== null && iterMeta === null))
      throw new TypeError(
        "internal error: one or both involved TVs are not member of any introduction @escapeCheck");

  // rigid TV was introduced later than meta TV

  else if (iterRigid > iterMeta)
    throw new TypeError(cat(
      "escape check failed\n",
      `cannot instantiate "${rigid.name}" with "${meta.name}"\n`,
      "because the latter is bound by a parent scope of the former\n",
      `"${rigid.name}" would escape its scope\n`,
      "while unifying\n",
      `${paramAnno}\n`,
      `${argAnno}\n`,
      extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

  // rigid TV was introduced earlier or at the same time as TV

  else {

    // check whether meta TV has aliases

    if (aliases.has(meta.name)
      && !history.has(meta.name)) {

        // recursively conduct an escape check on each alias

        aliases.get(meta.name).forEach(([, alias]) =>
          escapeCheck(rigid, alias, instantiations, intros, aliases, history.add(alias.name), lamIndex, argIndex, paramAnno, argAnno, funAnno, argAnnos));
    }
  }
};


/******************************************************************************
*******************************************************************************
*******************************[ SUBSTITUTION ]********************************
*******************************************************************************
******************************************************************************/


/* Substitute type variables for their instantiated types. The following
substitutions are legal:

meta TV ~ Type
meta TV ~ meta TV
meta TV ~ rigit TV
rigit TV ~ mete TV
rigit TV ~ rigid TV */

const substitute = (ast, instantiations) => {
  let anno = serializeAst(ast), anno_;

  /* Iteratively performs substitution until the result type doesn't deviate
  from the original annotation anymore. */

  do {
    let codomainRefs = [];
    anno_ = anno;

    instantiations.forEach(m => {

      // only the first entry must be taken into account

      const [, {key, value, substitutor}] = Array.from(m) [0];

      // check whether the key isn't a TV

      if (!isTV(key))
       throw new TypeError(
         "internal error: only type variables can be substituted @substitute");

      /* If both key and value of the substitution are TVs and the former is in
      codomain position, then the latter must also be in codomain position, so
      that the possible substitution with a function type omit the parenthesis. */

      else if (isTV(value)
        && key.position === "codomain"
        && value.position === "")
          value.position = key.position;

      // substitute each matching element of the AST

      ast = mapAst(ast_ => {

        // each AST element class decides how substitution works in its context

        ast_ = substitutor(ast_, key, value);

        /* If the mapping process runs into a `Codomain` AST element, it must
        convert it back into a regular `Fun`, because `Codomain` only denotes a
        placeholder that has already served its purpose at this point. In other
        words: `Codomain` must not leak into the caller's side. */

        if (ast_[TAG] === "Codomain") {
          ast_ = Fun(
            ast_.body.slice(0, -1),
            ast_.body[ast_.body.length - 1]);

          return ast_;
        }

        else if (ast_[TAG] === "Fun") {

          /* An `Codmain` AST element with `Fun` as its immediate parent must
          be referenced, so that it can be merged with its parent element
          afterwards. The merging is deferred and thus seperated from the
          mapping, because it changes the shape of the mapped AST in place. */

          if (ast_.body.result[TAG] === "Codomain")
            codomainRefs.push(ast_);

          return ast_;
        }

        else return ast_;
      }) (ast);

      /* Merge functions that substituted a TV in codomain position with its
      surrounding function to avoid redundant parenthesis. */

      codomainRefs.forEach(ref => {
        ref.body.lambdas.push(...ref.body.result.body.slice(0, -1));
        ref.body.result = ref.body.result.body[ref.body.result.body.length - 1];
      });

      codomainRefs = [];
    });

    anno = serializeAst(ast);
  } while (anno !== anno_);

  return ast;
};


/******************************************************************************
*******************************************************************************
**********************[ SPECIALIZATION/REGENERALIZATION ]**********************
*******************************************************************************
******************************************************************************/


/* Specialization is the process of instantiating bound TVs with fresh meta or
rigid TVs by giving them a fresh unique name without altering their scopes
(alpha renaming). Specialization only affects the top-level quantifier. Nested
quantifiers can be accessed using subsumption. scriptum only allows nested
quantifiers and thus impredicative polymorphism at the LHS of function types.
Whether bound TVs are meta- or skolem-ized depends on the side of the
subsumption judgement they are located in:

The function application `f(x)` is type safe if `x <: p` holds.

In the above judgment `<:` denotes "is subtype of"/"is at least as polymorphic as",
`x` is an argument type and `p` is f's type parameter. All top-level bound TVs on
the LHS are meta-ized and on the RHS are skolem-ized. */

const specialize = Cons => (intro, scope, tvid = "") => ast => {
  const alphaRenamings = new Map(),
    uniqueNames = new Set();
  
  let charCode = letterA;

  return {
    ast: mapAst(ast_ => {
      if (ast_[TAG] === "Forall") {

        /* Replace the `Forall` quantifier with an `Forall` function type boundary,
        i.e. one without bound TVs and scope. */

        if (scope === ast_.scope)
          return Forall(new Set(), ".", ast_.body);

        // ignore all other `Forall` elements

        else return ast_;
      }

      else if (ast_[TAG] === "BoundTV") {

        // TV scope matches the sought scope

        if (scope === ast_.scope) {

          let name;
          
          // original name is already alpha-renamed

          if (alphaRenamings.has(`${scope}/${ast_.name}`))
            name = alphaRenamings.get(`${scope}/${ast_.name}`);

          else {

            // remove possible trailing digits
            
            name = ast_.name.replace(/\d+$/, "");

            // name collision

            if (uniqueNames.has(name + tvid)) {

              // determine next unused letter

              do {
                if (charCode > 122)
                  throw new TypeError(
                    "internal error: type variable name upper bound exceeded @specialize");

                else name = String.fromCharCode(charCode++);
              } while (uniqueNames.has(name + tvid));

              name += tvid;
              alphaRenamings.set(`${scope}/${ast_.name}`, name);
              uniqueNames.add(name);
            }

            // no name collision

            else {
              name += tvid;
              alphaRenamings.set(`${scope}/${ast_.name}`, name);
              uniqueNames.add(name);
            }
          }

          const r = Cons(
            name, ast_.scope, ast_.position, ast_.body);

          // store introduction of TV

          intro.set(r.name, r);
          
          return r;
        }

        // TV scope doesn't match the sought scope

        else return ast_;
      }

      // neither `Scope` nor `BoundTV`

      else return ast_;
    }) (ast),
    intro};
};


const specializeLHS = specialize(MetaTV);


const specializeRHS = specialize(RigidTV);


// remove alpha renamings

const prettyPrint = ast => {
  const alphaRenamings = new Map(),
    uniqueNames = new Set();

  let charCode = letterA;

  return mapAst(ast_ => {
    switch (ast_[TAG]) {
      case "BoundTV": {

        // original name is already restored

        if (alphaRenamings.has(`${ast_.scope}:${ast_.name}`))
          return BoundTV(
            alphaRenamings.get(`${ast_.scope}:${ast_.name}`), ast_.scope, ast_.position, ast_.body);

        // remove trailing digits

        let name = ast_.name.replace(/\d+$/, "");

        // name collision

        if (uniqueNames.has(name)) {

          // find next unused letter

          do {
            if (charCode > 122)
              throw new TypeError(
                "internal error: type variable name upper bound exceeded @prettyPrint");

            name = String.fromCharCode(charCode++);
          } while (uniqueNames.has(name));
        }

        alphaRenamings.set(`${ast_.scope}:${ast_.name}`, name);
        uniqueNames.add(name);

        return BoundTV(
          name, ast_.scope, ast_.position, ast_.body);
      }

      case "Forall": {

        // adapt bound TV names listed at the quantifier to the new names

        const btvs = new Set();

        ast_.btvs.forEach((btv) => {
          btvs.add(alphaRenamings.get(`${ast_.scope}:${btv}`));
        });

        return Forall(
          btvs,
          ast_.scope,
          ast_.body)
      }

      default: return ast_;
    }
  }) (ast);
};
