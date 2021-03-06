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
**********************************[ GLOBAL ]***********************************
*******************************************************************************
******************************************************************************/


/***[ Constants ]*************************************************************/


const PREFIX = "$_"; // avoids property name clashes

// validator related

const CHECK = true; // type validator flag

export const ADT = PREFIX + "adt";
export const ANNO = PREFIX + "anno";

const MAX_COLONS = 80; // limit length of error messages
const MAX_TUPLE = 4;

// probability of deferring computation to next micro task

const MICROTASK_TRESHOLD = 0.01;

const SAFE_SPACE = "·"; // use within type indentations
const TOP_LEVEL_SCOPE = ".0/0";
const UNWRAP = PREFIX + "unwrap"; // access to the untyped function

// lib related

// JS related

const TAG = Symbol.toStringTag;

const LT = -1;
const EQ = 0;
const GT = 1;

const NOT_FOUND = -1;


/***[ Type Dictionaries ]*****************************************************/


const adtDict = new Map(), // ADT dict (k: tcons, v: arity)
  tcDict = new Map(); // type class dict (k: tcons, v: tparam + ops)

const imperativeTypeDict = new Map([ // imperative types dict (k: tcons, v: arity)
  ["Map", 2],
  ["Set", 1],
  ["Vector", 1]]);


const imperativeIntrospection = new Map([
  ["Map", m => {
    const ts = new Map();

    for (let [k, v] of m)
      ts.set(introspectDeep(k), introspectDeep(v));

    if (ts.size === 0)
      return "Map<a, b>";

    else if (ts.size > 1)
      throw new TypeError(cat(
        "invalid Map: must be homogeneous\n",
        JSON.stringify(Array.from(m)).slice(0, MAX_COLONS),
        "\n"));

    return `Map<${Array.from(ts) [0].join(", ")}>`;
  }],

  ["Set", s => {
    const ts = new Set();

    for (let v of s)
      ts.add(introspectDeep(v));

    if (ts.size === 0)
      return "Set<a>";

    else if (ts.size > 1)
      throw new TypeError(cat(
        "invalid Set: must be homogeneous\n",
        JSON.stringify(Array.from(s)).slice(0, MAX_COLONS),
        "\n"));

    return `Set<${Array.from(ts) [0]}>`;
  }],

  ["Vector", o => {
    if (o.length === 0)
      return "Vector<a>";

    else
      return `Vector<${introspectDeep(o.data.v)}>`;
  }]]);


export const registerImperativeType = (name, arity, introspect) => {
  if (CHECK) {

    // check for name clashes with native types

    if (imperativeTypeDict.has(name))
      throw new TypeError(cat(
        "illegal imperative data type\n",
        "name collision with another imperative type found\n",
        `namely: ${name}\n`,
        `while declaring "${name}<${Array(arity).fill("").map((_, i) => i + 97).join(", ")}>"\n`));
    
    // check for name clashes with type constants

    else if (typeConstDict.has(name))
      throw new TypeError(cat(
        "illegal imperative data type\n",
        "name collision with a type constant found\n",
        `namely: ${name}\n`,
        `while declaring "${name}<${Array(arity).fill("").map((_, i) => i + 97).join(", ")}>"\n`));

    // check for name clashes with ADTs

    else if (adtDict.has(name))
      throw new TypeError(cat(
        "illegal imperative data type\n",
        "name collision with an algebraic data type found\n",
        `namely: ${name}\n`,
        `while declaring "${name}<${Array(arity).fill("").map((_, i) => i + 97).join(", ")}>"\n`));

    imperativeTypeDict.set(name, arity);
    imperativeIntrospection.set(name, introspect);
  }
};


const typeConstDict = new Set([ // Tconst register
  "Char",
  "Integer",
  "Natural"]);


export const registerTypeConst = name => {
  if (CHECK) {

    // check for name clashes with native types

    if (imperativeTypeDict.has(name))
      throw new TypeError(cat(
        "illegal imperative data type\n",
        "name collision with another imperative type found\n",
        `namely: ${name}\n`));
    
    // check for name clashes with type constants

    else if (typeConstDict.has(name))
      throw new TypeError(cat(
        "illegal imperative data type\n",
        "name collision with a type constant found\n",
        `namely: ${name}\n`));

    // check for name clashes with ADTs

    else if (adtDict.has(name))
      throw new TypeError(cat(
        "illegal imperative data type\n",
        "name collision with an algebraic data type found\n",
        `namely: ${name}\n`));

    typeConstDict.add(name);
  }
};


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
    instantiations = "\n" + Array.from(instantiations)
      .map(([k, v]) => `${k} ~ ${serializeAst(v.value)}`).join("\n");
  }

  else instantiations = "";

  return cat(
    lamIndex,
    argIndex,
    `original fun: ${funAnno}\n`,
    argAnnos,
    instantiations + "\n");
};


const ordinalNum = n => {
  switch (n) {
    case 1: return "1st";
    case 2: return "2nd";
    case 3: return "3rd";
    default: return `${n}th`;
  }
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


/***[ Char ]******************************************************************/


export const Char = s => {
  if (CHECK) {
    if (typeof s !== "string" || s.size !== 1)
      throw new TypeError(cat(
        "type mismatch\n",
        "expected: a single character String\n",
        `received: ${introspectDeep(s)}\n`,
        "while constructing a Char\n"));

    else return {
      [TAG]: "Char",
      value: s,
      valueOf: () => s,
      toString: () => s
    }
  }

  else return s;
};


/***[ Natural ]***************************************************************/


export const Nat = n => {
  if (CHECK) {
    if (typeof n !== "number" || n % 1 !== 0 || n < 0)
      throw new TypeError(cat(
        "type mismatch\n",
        "expected: a positive integer-like Number\n",
        `received: ${introspectDeep(n)}\n`,
        "while constructing a Natural\n"));

    else return {
      [TAG]: "Natural",
      value: n,
      valueOf: () => n,
      toString: () => String(n)
    }
  }

  else return n;
};


/***[ Integer ]***************************************************************/


export const Int = n => {
  if (CHECK) {
    if (typeof n !== "number" || n % 1 !== 0)
      throw new TypeError(cat(
        "type mismatch\n",
        "expected: an integer-like Number\n",
        `received: ${introspectDeep(n)}\n`,
        "while constructing an Integer\n"));

    else return {
      [TAG]: "Integer",
      value: n,
      valueOf: () => n,
      toString: () => String(n)
    }
  }

  else return n;
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


const MetaTV = (name, scope, position, iteration, body) => // a.k.a. flexible type variable
  ({[Symbol.toStringTag]: MetaTV.name, name, scope, position, iteration, body});


const RigidTV = (name, scope, position, iteration, body) => // a.k.a. skolem constant
  ({[Symbol.toStringTag]: RigidTV.name, name, scope, position, iteration, body});


/******************************************************************************
********************************[ COMBINATORS ]********************************
******************************************************************************/


const retrieveBoundTVs = scope => reduceAst((acc, ast) => {
  if (ast[TAG] === "BoundTV"
    && ast.scope === scope)
      return acc.add(ast.name);

  else return acc;
}, new Set());


// determines the arity of the passed type constructor

const determineArity = ast => {
  switch (ast[TAG]) {
    case "Fun": {
      switch (ast.body.lambdas[0] [TAG]) {
        case "Arg0": return 1;
        case "Arg1": return 2;
        case "Args": return ast.body.lambdas[0].length + 1;
        default: return 0; // Argv/Argsv are excluded
      }
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


/* If a `Forall` AST is extracted from an annotation, the bound TVs it might
contain must be retrieved, because the quantifier isn't implicit anymore. */

const adjustForall = ref => {
  const nestedScopes = new Set(),
    btvs = new Set();

  if (ref[TAG] !== "Forall")
    throw new TypeError(
      "internal error: adjustForall expects a Forall as outer element");

  else {
    const ast_ = mapAst(ast => {
      switch (ast[TAG]) {
        case "BoundTV": {
          if (ast.scope === TOP_LEVEL_SCOPE) {
            btvs.add(ast.name);
            return ast;
          }

          else if (nestedScopes.has(ast.scope))
            return ast;

          else {
            btvs.add(ast.name);

            return BoundTV(
              ast.name,
              TOP_LEVEL_SCOPE,
              ast.position,
              ast.body);
          }
        }

        case "Forall": {
          if (ast.scope !== ref.scope
            && ast.scope !== TOP_LEVEL_SCOPE)
              nestedScopes.add(ast.scope);

          return ast;
        }

        default: return ast;
      }
    }) (ref.body);

    return Forall(
      btvs,
      TOP_LEVEL_SCOPE,
      ast_);
  }
};


const hasRank = (ast, rank) => reduceAst((acc, ast_) => {
  switch (ast_[TAG]) {
    case "BoundTV":
      return ast_.scope
        .match(/\./g).length === rank || acc

    default: return acc;
  }
}, false) (ast);


const hasTV = scope => reduceAst((acc, ast) => {
  if (ast[TAG] === "BoundTV" && isParentScope(scope, ast.scope)
    || ast[TAG] === "MetaTV" && isParentScope(scope, ast.scope)
    || ast[TAG] === "RigidTV" && isParentScope(scope, ast.scope))
      return true;

  else return acc;
}, false);


// returns true if the first scope contains the second one

const isParentScope = (parent, child) => {
  const diff = child.match(/\./g).length - parent.match(/\./g).length;

  if (diff < 0)
    return false;

  else if (diff > 0)
    return child.search(parent) === 0;

  else {

    // truncate current lam/arg index

    const parent_ = parent.replace(/[^.]+$/, ""),
      child_ = child.replace(/[^.]+$/, "");

    return child_.search(parent_) === 0;
  }
};


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
            ast.iteration,
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
            ast.iteration,
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
        "internal error: unknown value constructor at mapAst");
    }
  };

  return go;
};


/* When an AST is regeneralized or extratced from a larger annotation there may
occur redundant `Forall` subterms that need to be pruned from the tree. */

const pruneForalls = ast => {
  switch (ast[TAG]) {
    case "Adt": return Adt(ast.cons, ast.body.map(pruneForalls));
    case "Arg0": return new Arg0();
    case "Arg1": return new Arg1(pruneForalls(ast[0]));
    case "Args": return Args.fromArr(ast.map(pruneForalls));
    case "Argsv": return Argsv.fromArr(ast.map(pruneForalls));
    case "Argv": return new Argv(pruneForalls(ast[0]));
    case "Arr": return Arr(pruneForalls(ast.body));
    case "BoundTV": return BoundTV(ast.name, ast.scope, ast.position, ast.body.map(pruneForalls));

    case "Forall": {
      let hasForall = false,
        hasTV = false,
        r = false;

      if (ast.body[TAG] === "Fun")
        r = true;

      else r = reduceAst((acc, ast_) => {
        switch (ast_[TAG]) {
          case "Forall": {
            hasForall = true;
            return acc;
          }

          case "MetaTV":
          case "RigitTV": {
            hasTV = true;

            return hasForall
              ? acc
              : true;
          }

          default: return acc;
        }
      }, false) (ast.body);

      return r
        ? Forall(
            ast.btvs,
            ast.scope,        
            pruneForalls(ast.body))
        : pruneForalls(ast.body);
    }

    case "Fun": return Fun(ast.body.lambdas.map(pruneForalls), pruneForalls(ast.body.result));
    case "MetaTV": return MetaTV( ast.name, ast.scope, ast.position, ast.iteration, ast.body.map(pruneForalls));
    case "Native": return Native(ast.cons, ast.body.map(pruneForalls));
    case "Nea": return Nea(pruneForalls(ast.body));
    case "Obj": return Obj(ast.cons, ast.props, ast.row, ast.body.map(({k, v}) => ({k, v: pruneForalls(v)})));
    case "Partial": return Partial;
    case "RigidTV": return RigidTV(ast.name, ast.scope, ast.position, ast.iteration, ast.body.map(pruneForalls));
    case "Tconst": return Tconst(ast.name);

    case "This": {
      if (ast.nesting === 0)
        return This(ast.nesting, {body: pruneForalls(ast.body)});

      else return ast;
    }

    case "Tup": return Tup(ast.size, ast.body.map(pruneForalls));
    
    default: throw new TypeError(
      "internal error: unknown value constructor at pruneForalls");
  }
};


/* If an sub-AST is extracted from an annotation, it might require `Forall`
either as grouping or as a quantifier. */

const quantifyAst = ast => {
  const hasForall = ast[TAG] === "Forall";

  if (hasForall && ast.btvs.size > 0)
    return Forall(
      ast.btvs,
      TOP_LEVEL_SCOPE,
      ast);

  else if (hasForall)
    return Forall(
      retrieveBoundTVs(ast.scope) (ast),
      TOP_LEVEL_SCOPE,
      ast);

  else {
    const btvs = retrieveBoundTVs(ast.scope) (ast);

    if (btvs.size > 0
      || ast[TAG] === "Fun")
        return Forall(
          btvs,
          TOP_LEVEL_SCOPE,
          ast);

    else return ast;
  }
};


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
        "internal error: unknown value constructor at reduceAst");
    }
  };

  return ast => go(init, ast);
};


/* Removes the leftmost formal parameter of a function type after a function
application. */

const remConsumedParams = (ast) => {
  if (ast.body.body.lambdas.length === 1) {
    if (ast[TAG] === "Forall")
      return ast.body.body.result;

    else if (hasTV(TOP_LEVEL_SCOPE) (ast))
      return Forall(new Set(), TOP_LEVEL_SCOPE, ast.body.body.result);

    else return ast.body.body.result;
  }

  else
    return Forall(
      ast.btvs,
      TOP_LEVEL_SCOPE,
      Fun(
        ast.body.body.lambdas.slice(1),
        ast.body.body.result));
};


/******************************************************************************
*******************************************************************************
**********************************[ PARSING ]**********************************
*******************************************************************************
******************************************************************************/


const parseAnno = anno => {
  const go = (cs, lamIx, argIx, scope, position, context, thisAnno, nesting) => {

    /* The `position` argument denotes whether a function argument is in domain
    or codomain position. If such an argument is substituted the grouping 
    parenthesis are omitted for the latter.

    The `context` argument is used to prevent both, impredicative polymorphism
    and function types without a surrounding quantifer/grouping. The former is
    only allowed on the LHS of the function type. The latter is necessary to
    keep the language syntax simple.

    The `thisAnno` and `nesting` arguments are required to handle `this*`
    annotations. The former holds the entire object annotation `this*` refers
    to and the latter prevents the parser to get stuck in an infinite loop
    while parsing `this*`. */

    /* Uses __ as an internal placeholder for not yet consumed type parameters
    of partially applied type constructors. Here are the possible forms of
    partially applied type constructors:

    Function: (=>) / (String =>) / (, =>) / (String, =>) / (,, =>) / (String,, =>)
    Array/NEArray: [] / [1]
    Tuple: [,] / [String,] / [,,] / [String,,]
    Object: {foo:} / {foo:, bar:} / {foo: String, bar:}

    Tcons: t<> / t<,> / t<String,> / t<, String> / t<,,> / t<String,,> / t<, String,>

    Native: Map / Map<String> / Map<, String>
    Adt: Either / Either<String> / Either<, String>
    
    For Natives and ADTs the type constructor arity is known, i.e. it need not
    to be maintained by the notation. */

    let rx;

    // Fun

    if (remNestings(cs).search(new RegExp("( |^)=>( |$)", "")) !== NOT_FOUND) {

      // check whether this is the initial invocation or a `Forall` context

      if (context !== "" && context.split(/\//).slice(-1) [0] !== "Forall")
        throw new SyntaxError(cat(
          "malformed type annotation\n",
          `function type must be inside a quantifier\n`,
          `but found "${cs}"\n`,
          `inside context "${context.split(/\//).slice(-1) [0]}"\n`,
          `in "${anno}"\n`));

      // take partially applied Fun constrcutors into account
      
      if (cs.search(/^=|>$/) !== NOT_FOUND)
        cs = cs.replace(/^=>/, "__ =>")
          .replace(/=>$/, "=> __");
            
      const init = splitByScheme(/ => /, 4, remNestings(cs)) (cs), // argument types
        last = init.pop(); // result type

      // checks for variadic arguments in the result

      if (last.search(/^\.\./) !== NOT_FOUND)
        throw new SyntaxError(cat(
          "malformed type annotation\n",
          `illegal variadic argument "${cs}"\n`,
          "at the result type\n",
          `in "${anno}"\n`));

      return Fun(
        init.map((ds, i) => {
          
          // no-argument

          if (ds === "()")
            return new Arg0();

          else {

            // take partially applied multi-argument lists into account

            if (ds.search(new RegExp(",(?:,|$)", "")) !== NOT_FOUND)
              ds = ds.replace(/^,/, "__,")
                .replace(/,,/g, ", __, __")
                .replace(/,$/, ", __");

            const args = splitByScheme(/, /, 2, remNestings(ds)) (ds);

            // single-argument

            if (args.length === 1) {

              // regular-argument

              if (args[0].search(/^\.\./) === NOT_FOUND)
                return new Arg1(go(args[0], i, 0, scope, "", context + "/Function", thisAnno, nesting));

              // variadic-argument

              else
                return new Argv(go(args[0].slice(2), i, 0, scope, "", context + "/Function", thisAnno, nesting));
            }

            // multi-argument

            else {
              args.forEach((arg, i) => {
                if (arg.search(/\.\./) !== NOT_FOUND && i < args.length - 1)
                  throw new SyntaxError(cat(
                    "malformed type annotation\n",
                    `illegal variadic argument "${cs}"\n`,
                    `at lambda #${lamIx + 1} argument #${i + 1}\n`,
                    `in "${anno}"\n`));
              });

              // regular multi-argument

              if (args[args.length - 1].search(/\.\./) === NOT_FOUND)
                return Args.fromArr(
                  args.map((arg, j) => go(arg, i, j, scope, "", context + "/Function", thisAnno, nesting)));

              // multi-argument with trailing variadic one

              else return Argsv.fromArr(
                args.map((arg, j) => 
                  j === args.length - 1
                    ? go(arg.slice(2), i, j, scope, "", context + "/Function", thisAnno, nesting)
                    : go(arg, i, j, scope, "", context + "/Function", thisAnno, nesting)));
            }
          }
        }),
        go(last, -1, -1, scope, "codomain", context + "/Function", thisAnno, nesting));
    }

    // ADT

    else if (Array.from(adtDict).some(([cons]) => cs.search(new RegExp(`^${cons}\\b`, "")) === 0)) {
      if (cs.search(/</) === NOT_FOUND)
        return Adt(cs, Array(adtDict.get(cs)).fill(Partial));

      else {
        rx = cs.match(new RegExp("^(?<cons>[A-Z][A-Za-z0-9]*)<(?<fields>.+)>$", ""));

        // take partially applied ADT constructors into account

        if (rx.groups.fields.search(new RegExp("^,|,,|,$", "")) !== NOT_FOUND)
          rx.groups.fields = rx.groups.fields
            .replace(/^,/, "__,")
            .replace(/,,/g, ", __, __")
            .replace(/,$/, ", __");

        const fields = splitByScheme(
          /, /, 2, remNestings(rx.groups.fields)) (rx.groups.fields);

        if (fields.length > adtDict.get(rx.groups.cons))
          throw new TypeError(cat(
            "malformed type annotation\n",
            `type constructor arity mismatch\n`,
            `defined type parameters: ${adtDict.get(rx.groups.cons)}\n`,
            `received type arguments: ${fields.length}\n`,
            `in "${anno}"\n`));

        const fields_ = fields.length < adtDict.get(rx.groups.cons)
          ? fields.concat(
              Array(adtDict.get(rx.groups.cons) - fields.length).fill("__"))
          : fields;

        return Adt(
          rx.groups.cons,
          fields_.map(field =>
            go(field, lamIx, argIx, scope, "", context + `/${rx.groups.cons}`, thisAnno, nesting)));
      }
    }

    // array like

    else if (rx = cs.match(new RegExp("^\\[(?:(?<nea>1))?(?<body>.*)\\]$", ""))) {

      // take partially applied Array/NEArray/Tuple constructors into account

      if (rx.groups.body === "")
        rx.groups.body = "__";

      else if (rx.groups.body.search(new RegExp(",(?:,|$)", "")) !== NOT_FOUND)
        rx.groups.body = rx.groups.body
          .replace(/^,/, "__,")
          .replace(/,,/g, ", __, __")
          .replace(/,$/, ", __");

      const scheme = remNestings(rx.groups.body);

      if (scheme.search(/,/) === NOT_FOUND) {

        // Arr

        if (rx.groups.nea === undefined)
          return Arr(go(rx.groups.body, lamIx, argIx, scope, "", context + "/Array", thisAnno, nesting));

        // Nea

        else
          return Nea(go(rx.groups.body, lamIx, argIx, scope, "", context + "/NEArray", thisAnno, nesting));
      }

      // Tup

      else {
        const fields = splitByScheme(/, /, 2, scheme) (rx.groups.body);

        return Tup(
          fields.length,
          fields.map(field => go(field, lamIx, argIx, scope, "", context + "/Tuple", thisAnno, nesting)));
      }
    }

    // BoundTV

    else if (rx = cs.match(new RegExp("^(?<name>[a-z][A-Za-z0-9]*)$", ""))) {
      if (rntvs.has(rx.groups.name + scope))
        return BoundTV(
          rx.groups.name, scope, position, []);

      else {
        r1tvs.add(rx.groups.name);

        return BoundTV(
          rx.groups.name, TOP_LEVEL_SCOPE, position, []);
      }
    }

    // Forall

    else if (rx = cs.match(new RegExp("^\\((?:\\^(?<quant>[^\\.]+)\\. )?(?<body>.+)\\)$", ""))) {

      /* Round parenthesis have an ambiguous lexical meaning. At the top level
      they denote an implicit quantifiers, i.e. bound variables are not listed
      exolicitly. At a nested level their meaning depends on the position within
      the surrounding type. If they are on the LHS of a function type, they
      denote a higher-rank type. Otherwise they lexically group a function
      type to distinguish them from their lexical environment. Explicit
      quantifiers carry a caret symbol followed by a list of type variable names
      bound to the distinct scope of this quantifier. */

      // lexical grouping

      if (rx.groups.quant === undefined)
        return Forall(
          new Set(),
          TOP_LEVEL_SCOPE,
          go(rx.groups.body, 0, 0, scope, "", context + "/Forall", thisAnno, nesting));

      // explicit rank-n quantifier

      else {

        // impredicative polymorphism

        if (context.replace(new RegExp("(?:/Forall)?/Function", "g"), "") !== "")
          throw new TypeError(cat(
            "malformed type annotation\n",
            "impredicative polymorphic type detected\n",
            `nested quantifiers must only occur on the LHS of "=>" but\n`,
            `${cs}\n`,
            `is defined inside context: ${context.split(/\//).slice(-1) [0]}\n`,
            `in "${anno}"\n`));

        else {
          const nestedScope = `${scope}.${lamIx}/${argIx}`,
            rntvs_ = new Set(rx.groups.quant.split(", "));

          rntvs_.forEach(rntv_ =>
            rntvs.add(rntv_ + nestedScope));

          return Forall(
            rntvs_,
            nestedScope,
            go(rx.groups.body, 0, 0, nestedScope, "", context + "/Forall", thisAnno, nesting));
        }
      }
    }

    // Native

    else if (Array.from(imperativeTypeDict).some(([cons]) => cs.search(new RegExp(`^${cons}\\b`, "")) === 0)) {
      if (cs.search(/</) === NOT_FOUND)
        return Native(cs, Array(imperativeTypeDict.get(cs)).fill(Partial));

      else {
        rx = cs.match(new RegExp("^(?<cons>[A-Z][A-Za-z0-9]*)<(?<fields>.+)>$", ""));

        // take partially applied Native constructors into account

        if (rx.groups.fields.search(new RegExp("^,|,,|,$", "")) !== NOT_FOUND)
          rx.groups.fields = rx.groups.fields
            .replace(/^,/, "__,")
            .replace(/,,/g, ", __, __")
            .replace(/,$/, ", __");

        const fields = splitByScheme(
          /, /, 2, remNestings(rx.groups.fields)) (rx.groups.fields);

        if (fields.length > imperativeTypeDict.get(rx.groups.cons))
          throw new TypeError(cat(
            "malformed type annotation\n",
            "type constructor arity mismatch\n",
            `defined type parameters: ${imperativeTypeDict.get(rx.groups.cons)}\n`,
            `received type arguments: ${fields.length}\n`,
            `in "${anno}"\n`));

        const fields_ = fields.length < imperativeTypeDict.get(rx.groups.cons)
          ? fields.concat(
              Array(imperativeTypeDict.get(rx.groups.cons) - fields.length).fill("__"))
          : fields;

        return Native(
          rx.groups.cons,
          fields_.map(field =>
            go(field, lamIx, argIx, scope, "", context + `/${rx.groups.cons}`, thisAnno, nesting)));
      }
    }

    // Obj

    else if (cs.search(new RegExp("^(?:[A-Z][A-Za-z0-9]* )?\\{"), "") !== NOT_FOUND) {
      const cons = (cs.match(new RegExp("^[A-Z][A-Za-z0-9]*\\b", "")) || [null]) [0],
        cs_ = cons === null ? cs : cs.slice(cons.length + 1);

      // take partially applied Objects constructors into account

      if (cs_.search(new RegExp(":(?=,|$)", "")) !== NOT_FOUND)
        cs_ = cs_.replace(new RegExp(":,", "g"), ": __,")
          .replace(new RegExp(":$", "g"), ": __");

      const props = splitByScheme(
        /, /, 2, remNestings(cs_.slice(1, -1))) (cs_.slice(1, -1));

      if (props[0] === "") // empty {} | Foo {}
        return Obj(cons, [], null, []);

      else if (props[0].search(new RegExp(
        "^ \\| [a-z][A-Za-z0-9]*$", "")) === 0) // empty { | row} or Foo { | row}
          return Obj(
            cons,
            [],
            RowVar(props[0].match(new RegExp("(?<= \\| )[a-z][A-Za-z0-9]*$", "")) [0]),
            []);

      else { // non-empty {foo: a} or Foo {foo: a} or {foo: a | row} or Foo {foo: a | row}
        let row = null

        if (remNestings(props[props.length - 1]).search(/ \| /) !== NOT_FOUND) {
          const [prop, row_] = splitByScheme(
            / \| /, 3, remNestings(props[props.length - 1])) (props[props.length - 1]);

          row = row_;
          props[props.length - 1] = prop;
        }

        return Obj(
          cons,
          props.map(s => s.match(new RegExp("^([a-z][a-z0-9]*):", "i"), "") [1]),
          row === null ? null : RowVar(row),
          props.map(s => ({
            k: s.match(new RegExp("^([a-z][a-z0-9]*):", "i"), "") [1],
            v: go(s.replace(new RegExp("^[a-z][a-z0-9]*: ", "i"), ""), lamIx, argIx, scope, "", context + (cons ? `/${cons}` : "/Object"), cs, nesting)
          })));
      }
    }

    // Partial

    else if (rx = cs.match(/^__$/))
      return Partial;

    // Tcons

    else if (rx = cs.match(new RegExp("^(?<name>[a-z][A-Za-z0-9]*)<(?<fields>.*)>$", ""))) {
      
      /* A type constructor represents a higher-kinded type and hence makes kind
      checking necessary. Internally they are encoded as a bound TV with a body
      including an arbitrarily number of fields. */

      // take partially applied Tcons constructors into account

      if (rx.groups.fields === "")
        rx.groups.fields = "__";

      else if (rx.groups.fields.search(new RegExp("^,|,,|,$", "")) !== NOT_FOUND)
        rx.groups.fields = rx.groups.fields
          .replace(/^,/, "__,")
          .replace(/,,/g, ", __, __")
          .replace(/,$/, ", __");

      const fields = splitByScheme(
        /, /, 2, remNestings(rx.groups.fields)) (rx.groups.fields);
      
      if (tconsArity.has(`${scope}/${rx.groups.name}`)) {
        if (tconsArity.get(`${scope}/${rx.groups.name}`) !== fields.length)
          throw new TypeError(cat(
            "malformed type annotation\n",
            "ambiguous type constructor arity\n",
            `"${rx.groups.name}" has arity ${tconsArity.get(`${scope}/${rx.groups.name}`)} and ${fields.length} respectively\n`,
            `in "${anno}"\n`));
      }

      if (rntvs.has(rx.groups.name + scope)) {
        tconsArity.set(`${scope}/${rx.groups.name}`, fields.length);

        return BoundTV(
          rx.groups.name,
          scope,
          position,
          fields.map(field =>
            go(field, lamIx, argIx, scope, "", context + "/Constructor", thisAnno, nesting)));
      }

      else {
        tconsArity.set(`${TOP_LEVEL_SCOPE}/${rx.groups.name}`, fields.length);
        r1tvs.add(rx.groups.name);

        return BoundTV(
          rx.groups.name,
          TOP_LEVEL_SCOPE,
          position,
          fields.map(field =>
            go(field, lamIx, argIx, scope, "", context + "/Constructor", thisAnno, nesting)));
      }
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
          const thisAst = go(thisAnno, lamIx, argIx, scope, "", context, thisAnno, nesting + 1);
          delete this.body;
          return this.body = thisAst;
        }
      });
    }

    // TypeError

    else
      throw new SyntaxError(cat(
        "malformed type annotation\n",
        `unexpected token "${cs}"\n`,
        anno === cs ? "" : `in "${anno}"\n`));
  };

  const tconsArity = new Map(),
    r1tvs = new Set(),
    rntvs = new Set();

  // verify annotation syntax

  verifyAnno(anno);

  // remove redundant parenthesis

  if (anno[0] === "(" && anno[anno.length - 1] === ")")
    anno = anno.slice(1, -1);

  /* Type class declarations have the form `TypeClass<t>`, which the arity of
  `t` is not apparent from. Since `t`'s arity is specified in the rest of the
  annotation, we can recover it for all occurrances in hindsight. */

  const ast = mapAst(ast_ => {
    if (ast_[TAG] === "BoundTV"
      && ast_.body.length === 0
      && tconsArity.has(`${ast_.scope}/${ast_.name}`)) {
        return BoundTV(
          ast_.name,
          ast_.scope,
          ast_.position,
          Array(tconsArity.get(`${ast_.scope}/${ast_.name}`))
            .fill(Partial));
    }

    else return ast_;
  }) (go(anno, 0, 0, TOP_LEVEL_SCOPE, "", "", null, 0));

  // wrap ast in a quantifier, if necessary

  if (r1tvs.size > 0)
    return Forall(r1tvs, TOP_LEVEL_SCOPE, ast);

  else if (ast[TAG] === "Fun")
    return Forall(new Set(), TOP_LEVEL_SCOPE, ast);

  else return ast;
};


// verifies the provied annotation against the base syntactical rules

const verifyAnno = s => {
  const topLevel = remNestings(s);

  // ensures balanced bracket nesting + wrapped function arguments

  if (topLevel.replace(/=>/g, "").search(new RegExp("[(\\[{<>}\\])]", "")) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      "bracket mismatch\n",
      `${showBracketMismatch(topLevel)}\n`,
      `in "${s}"\n`));

  // prevents redundant round parenthesis

  else if (s.search(new RegExp("\\)\\)", "")) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `redundant "()"\n`,
      `next to "${s.match(new RegExp(".{0,5}\\)\\)", "")) [0]}"\n`,
      `in "${s}"\n`));

  // prevents redundant pointed parenthesis

  else if (s.search(new RegExp("<>", "")) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `redundant "<>"\n`,
      `next to "${s.match(new RegExp(".{0,5}<>.{0,5}", "")) [0]}"\n`,
      `in "${s}"\n`));

  // prevents invalid chars

  else if (s.search(new RegExp("[^a-z0-9(){}\\[\\]<>=:,_\\| \\.\\^\\*]", "i")) !== NOT_FOUND) {
    const invalidChars = s.replace(new RegExp("[a-z(){}\\[\\]<>=:,_1\\| \\.\\^]", "gi"), "");

    throw new SyntaxError(cat(
      "malformed type annotation\n",
      "illegal characters\n",
      `namely: ${invalidChars}\n`,
      `in "${s}"\n`));
  }

  // checks for valid use of :
  
  else if (s.replace(new RegExp("\\b[a-z][a-z0-9]*:[ ,}]", "gi"), "").search(":") !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of ":"\n`,
      `in "${s}"\n`));

  // checks for invalid use of =
  
  else if (s.search(new RegExp("=(?!>)", "")) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of "=>"\n`,
      `missing trailing ">"\n`,
      `in "${s}"\n`));

  // checks for invalid use of >
  
  else if (s.search(new RegExp(" >", "")) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of ">"\n`,
      `missing preceding "="\n`,
      `in "${s}"\n`));

  // checks for valid use of =>

  else if (s.replace(new RegExp("[ (]=>[ )]", "g"), "").search("=>") !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of "=>"\n`,
      "function arrow must be surrounded by a space\n",
      `in "${s}"\n`));

  // checks for valid use of _

  else if (s.replace(new RegExp("\\b__\\b", "g"), "").search(/_/) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of "_"\n`,
      `in "${s}"\n`));

  // checks for valid use of ()

  else if (s.replace(new RegExp("\\(\\) =>", "g"), "").search(/\(\)/) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of "()"\n`,
      `in "${s}"\n`));

  // checks for valid use of 0-9

  else if (s.replace(new RegExp("\\b[a-z][a-z0-9]*\\b|\\[1", "gi"), "").search(/\d/) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of digits\n`,
      "names must not start with a digit\n",
      `in "${s}"\n`));

  // prevents redundant spaces

  else if (s.search(new RegExp("  |^ | $", "")) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `redundant " "\n`,
      `next to "${s.match(new RegExp(".{0,5}(?:  |^ | $).{0,5}", "")) [0]}"\n`,
      `in "${s}"\n`));

  // checks for valid use of *this

  else if (s.replace(/\bthis\*/g, "").search(/\*/) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of "this*"\n`,
      `in "${s}"\n`));

  // prevents explicit top-level quantifiers

  else if (s.search(/^\(\^/) !== NOT_FOUND
    && s.search(/\)$/) !== NOT_FOUND)
      throw new SyntaxError(cat(
        "malformed type annotation\n",
        "top-level type must be implicitly quantified\n",
        `but "${s.match(new RegExp("(?<=^\\()\\^[^.]+\\.", "")) [0]}" found\n`,
        `in "${s}"\n`));

  // prevents malformed explicit quantifier

  else if (s.search(new RegExp("\\(\\^[^.]* \\.", "")) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      "invalid explicit quantifier\n",
      "expected scheme: ^a, b, c.\n",
      `in "${s}"\n`));

  else if (s.replace(new RegExp("\\(\\^[a-z][^.]*\\. ", "g"), "").search(/\^/) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      "invalid explicit quantifier\n",
      "expected scheme: ^a, b, c.\n",
      `in "${s}"\n`));

  // prevents malformed variadic arguments

  else if (s.replace(new RegExp("\\.\\.\\[", "g"), "").search(/\.\./) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of ".."\n`,
      "expected form: ..[Name]\n",
      `in "${s}"\n`));

  // prevents malformed variadic arguments

  else if (s.search(/\.\.\./) !== NOT_FOUND)
    throw new SyntaxError(cat(
      "malformed type annotation\n",
      `invalid use of "..."\n`,
      "expected form: ..[Name]\n",
      `in "${s}"\n`));

  return s;
};


/***[ Combinators ]***********************************************************/


/* Since I use regular expresssions (don't judge me) to parse annotations
frequently only the current lexical level must be parsed. `remNestings` removes
nested subterms, so that they don't interfere with the current parsing process. */

const remNestings = s => {
  let cs = s, ds;

  do {
    ds = cs;
    cs = cs.replace(/=>/g, "=="); // mask function arrow
    cs = cs.replace(new RegExp("\\([^(){}\\[\\]<>]*\\)", ""), s => "_".repeat(s.length)); // Fun
    cs = cs.replace(new RegExp("(?:[A-Z][A-Za-z0-9]* )?{[^(){}\\[\\]<>]*}", ""), s => "_".repeat(s.length)); // Obj
    cs = cs.replace(new RegExp("\\[[^(){}\\[\\]<>]*\\]", ""), s => "_".repeat(s.length)); // Arr + Nea + Tup
    cs = cs.replace(new RegExp("[A-Z][A-Za-z0-9]*<[^(){}\\[\\]<>]*>", ""), s => "_".repeat(s.length)); // Adt + Native
    cs = cs.replace(new RegExp("\\b[a-z][A-Za-z0-9]*<[^(){}\\[\\]<>]*>", ""), s => "_".repeat(s.length)); // Tcons
    cs = cs.replace(/==/g, "=>"); // unmask function arrow
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

const splitByScheme = (rx, delimLen, ref) => cs => {
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
          .replace(/ ?__/g, "")
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
            .replace(/ ?__/g, "");

          return cat(
            ast.name,
            body.length ? `<${body}>` : "");
        }
      }

      case "Forall": {
        if (ast.scope === TOP_LEVEL_SCOPE)
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
                "internal error: illegal argument list");
          }
        }).join(" => ");

        const codomain = go(ast.body.result);

        return `${domain} => ${codomain}`
          .replace(/ ?__/g, "")
          .replace(/^ =>|=> $/, "=>");
      }
      
      case "Native": {
        const body = ast.body.map(go).join(", ")
          .replace(/ ?__/g, "")
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
          "internal error: unknown value constructor at serializeAst");
    }
  };

  const s = go(initialAst);

  return s[0] === "(" && s[s.length - 1] === ")"
    ? s.slice(1, -1)
    : s;
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

    case "Undefined":
      throw new TypeError(cat(
        "illegal type introspection\n",
        "namely: undefined\n",
        `runtime immediately terminated\n`));

    default: return type;
  }
};


export const introspectDeep = x => {
  const type = introspectFlat(x);

  switch (type) {
    case "Array": {
      const ts = new Set();
      x.forEach(y => ts.add(introspectDeep(y)));

      if (ts.size === 0)
        return "[a]";

      else if (ts.size > 1)
        throw new TypeError(cat(
          "invalid Array: must be homogeneous\n",
          JSON.stringify(x).slice(0, MAX_COLONS).replace("null", "Undefined"),
          "\n"));

      return `[${Array.from(ts) [0]}]`;
    }

    case "Function": {
      if (ANNO in x) {
        if (x[ANNO] [0] !== "(" || x[ANNO] [x[ANNO].length - 1] !== ")")
          return `(${x[ANNO]})`;

        else return x[ANNO];
      }
     
      else return type; // Funtion type constant
    }

    case "NEArray": {
      const ts = new Set();
      x.forEach(y => ts.add(introspectDeep(y)));

      if (ts.size === 0
        || ts.size === 1 && ts.has("Undefined"))
          throw new TypeError(cat(
            "invalid NEArray\n",
            "must contain at least a single element\n"));

      else if (ts.size > 1)
        throw new TypeError(cat(
          "invalid NEArray\n",
          "must be homogeneous\n"));

      return `[1${Array.from(ts) [0]}]`;
    } 

    case "Tuple": {
      const ts = [];
      x.forEach(y => ts.push(introspectDeep(y)));
      return `[${Array.from(ts).join(", ")}]`;
    }

    case "Undefined":
      throw new TypeError(cat(
        "illegal type introspection\n",
        "namely: undefined\n",
        `runtime immediately terminated\n`));

    default: {

      // object-based type constant

      if (typeConstDict.has(type))
        return type;

      // imperative type

      else if (imperativeTypeDict.has(type))
        return imperativeIntrospection.get(type) (x);

      // Thunk

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
              ts.set(k, introspectDeep(x[k]));

            return `${cons}{${Array.from(ts).map(([k, v]) => k + ": " + v).join(", ")}}`;
        }
      }

      // primitive Tconst

      else return type;
    }
  }
};


/******************************************************************************
*******************************************************************************
****************************[ ALGEBRAIC DATA TYPE ]****************************
*******************************************************************************
******************************************************************************/


/* `type` is used for declaring Scott encoded ADTs with several constructors
using CPS, because it entails pattern matching including exhaustiveness checks. */

export const type = adtAnno => {

  // bypass the type validator

  if (CHECK === false)
    return k => ({run: k});

  // run the type validator

  else {
    
    // strip newlines and indentations

    adtAnno = adtAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
      .replace(new RegExp(SAFE_SPACE, "g"), " ");

    // parse the type wrapper

    const [domain, wrapperAnno] = splitByScheme(
      / => /, 4, remNestings(adtAnno)) (adtAnno);

    // ensures top-level function type

    if (domain === undefined)
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "Scott encoding expects a top-level function type\n",
        `while declaring "${adtAnno}"\n`));

    // verify valid domain

    else if (domain.search(new RegExp("^\\(\\^[a-z][A-Za-z0-9]*\\.", "")) === NOT_FOUND)
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "Scott encoding expects a rank-2 function type as its argument\n",
        `while declaring "${adtAnno}"\n`));

    // verify valid codomain

    else if (wrapperAnno.search(new RegExp("^[A-Z][A-Za-z0-9]*(?:<.*>)?$", "")) === NOT_FOUND)
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "Scott encoding expects a type constructor\n",
        "in its codomain\n",
        `but "${wrapperAnno}" received\n`,
        `while declaring "${adtAnno}"\n`));

    // determine name and arity of the type wrapper

    const tcons = wrapperAnno.match(/[^<]+/) [0];

    const arity = splitByScheme(
      /, /, 2, remNestings(wrapperAnno.replace(new RegExp("^[^<]+<|>$", "g"), "")))
        (wrapperAnno.replace(new RegExp("^[^<]+<|>$", ""), "g")).length;

    // check for name clashes with previously registered ADTs

    if (adtDict.has(tcons))
      throw new TypeError(cat(
        "illegal algebraic data type\n",
        "name collision with another ADT found\n",
        `namely: ${tcons}\n`,
        `while declaring "${adtAnno}"\n`));

    // check for name clashes with native types

    else if (imperativeTypeDict.has(tcons))
      throw new TypeError(cat(
        "illegal algebraic data type\n",
        "name collision with an imperative type found\n",
        `namely: ${tcons}\n`,
        `while declaring "${adtAnno}"\n`));

    // check for name clashes with type constants

    else if (typeConstDict.has(tcons))
      throw new TypeError(cat(
        "illegal algebraic data type\n",
        "name collision with a type constant found\n",
        `namely: ${tcons}\n`,
        `while declaring "${adtAnno}"\n`));

    // register ADT as name-arity pair

    else adtDict.set(tcons, arity);

    // parse ADT and wrapper AST and extract the continuation AST

    const adtAst = parseAnno(adtAnno),
      contAst = adjustForall(adtAst.body.body.lambdas[0] [0]),
      wrapperAst = parseAnno(wrapperAnno);

    // ensure valid domain

    if (!hasRank(adtAst.body.body.lambdas[0] [0], 2))
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "Scott encoding expects a rank-2 function type\n",
        "in its domain\n",
        `but "${serializeAst(adtAst.body.body.lambdas[0] [0])}" received\n`,
        `while declaring "${adtAnno}"\n`));

    // serialize continuation AST

    const contAnno = serializeAst(contAst);

    /* Verify that all rank-1 type variables of the domain occur in the codomain
    of the value constructor:

    (^r. (a => r) => (b => r) => r) => Either<a, b>
          ^           ^                       ^^^^
    ((a => r) => r => Cont<a, r>)
      ^    ^     ^         ^^^^ */

    const rank1Dom = Array.from(reduceAst((rank1, ast) => {
      if (ast[TAG] === "BoundTV") {
        if (ast.scope === TOP_LEVEL_SCOPE)
          return rank1.add(ast.name);

        else return rank1;
      }

      else return rank1;
    }, new Set()) (adtAst.body.body.lambdas[0] [0]));

    const rank1Co = Array.from(reduceAst((rank1, ast) => {
      if (ast[TAG] === "BoundTV") {
        if (ast.scope === TOP_LEVEL_SCOPE)
          return rank1.add(ast.name);

        else return rank1;
      }

      else return rank1;
    }, new Set()) (wrapperAst));

    const outOfScope = rank1Dom.filter(btv => !rank1Co.includes(btv))
      .concat(rank1Co.filter(btv => !rank1Dom.includes(btv)));

    if (outOfScope.length > 0)
        throw new TypeError(cat(
          "illegal algebraic data type declaration\n",
          "type parameter(s) not in scope\n",
          `namely: ${outOfScope.join(", ")}\n`,
          `while declaring "${adtAnno}"\n`));

    // return the ADT value constructor

    return Object.assign(k => { // untyped Scott encoded continuations
      
      // check if untyped

      if (ANNO in k)
        throw new TypeError(cat(
          "invalid algebraic data type usage\n",
          "untyped Scott encoded continuation expected\n",
          `but "${k[ANNO]}" received\n`,
          `while applying "${adtAnno}"\n`));

      // return the ADT

      else return {
        [TAG]: tcons,
        [ADT]: wrapperAnno,
        run: fun(k, contAnno)
      };
    }, {[ANNO]: adtAnno});
  }
};


/* `type1` is used to declare single constructor ADTs. Such ADTs don't need
pattern matching and thus no higher-rank types. We can drop the CPS encoding
to gain simplified types. */

export const type1 = adtAnno => {

  // bypass the type validator

  if (CHECK === false)
    return k => ({run: k});

  // run the type validator

  else {
    
    // strip newlines and indentations

    adtAnno = adtAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
      .replace(new RegExp(SAFE_SPACE, "g"), " ");

    // parse the type wrapper

    const wrapperAnno = splitByScheme(
      / => /, 4, remNestings(adtAnno)) (adtAnno) [1];

    // ensures top-level function type

    if (wrapperAnno === undefined)
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "single constructor ADT expects a top-level function type\n",
        `while declaring "${adtAnno}"\n`));

    // ensure valid codomain

    else if (wrapperAnno.search(new RegExp("^[A-Z][A-Za-z0-9]*(?:<.*>)?$", "")) === NOT_FOUND)
      throw new TypeError(cat(
        "invalid algebraic data type declaration\n",
        "single constructor ADT expects a type constructor\n",
        "in its codomain\n",
        `but "${wrapperAnno}" received\n`,
        `while declaring "${adtAnno}"\n`));

    // determine name and arity of the type wrapper

    const tcons = wrapperAnno.match(/[^<]+/) [0];

    const arity = wrapperAnno !== tcons
      ? splitByScheme(
          /, /, 2, remNestings(wrapperAnno.replace(new RegExp("^[^<]+<|>$", "g"), "")))
            (wrapperAnno.replace(new RegExp("^[^<]+<|>$", ""), "g")).length
      : 0;

    // check for name clashes with previously registered ADTs

    if (adtDict.has(tcons))
      throw new TypeError(cat(
        "illegal algebraic data type\n",
        "name collision with another ADT found\n",
        `namely: ${tcons}\n`,
        `while declaring "${adtAnno}"\n`));

    // check for name clashes with native types

    else if (imperativeTypeDict.has(tcons))
      throw new TypeError(cat(
        "illegal algebraic data type\n",
        "name collision with an imperative type found\n",
        `namely: ${tcons}\n`,
        `while declaring "${adtAnno}"\n`));

    // check for name clashes with type constants

    else if (typeConstDict.has(tcons))
      throw new TypeError(cat(
        "illegal algebraic data type\n",
        "name collision with a type constant found\n",
        `namely: ${tcons}\n`,
        `while declaring "${adtAnno}"\n`));

    // register ADT as name-arity pair

    else adtDict.set(tcons, arity);

    // parse ADT and wrapper AST and extract the original AST

    const adtAst = parseAnno(adtAnno);

    let domainAst;

    if (adtAst.body.body.lambdas[0] [0] [TAG] === "Forall")
        domainAst = adjustForall(adtAst.body.body.lambdas[0] [0]);

    else if (hasTV(TOP_LEVEL_SCOPE) (adtAst.body.body.lambdas[0] [0]))
      domainAst = Forall(
        retrieveBoundTVs(TOP_LEVEL_SCOPE) (adtAst.body.body.lambdas[0] [0]),
        TOP_LEVEL_SCOPE,
        adtAst.body.body.lambdas[0] [0]);
    
    else domainAst = adtAst.body.body.lambdas[0] [0];
      
    const wrapperAst = parseAnno(wrapperAnno);

    // serialize original AST

    const domainAnno = serializeAst(domainAst);

    /* Verify that all rank-1 type variables of the domain occur in the codomain
    of the value constructor:

    (^r. (a => r) => (b => r) => r) => Either<a, b>
          ^           ^                       ^^^^
    ((a => r) => r => Cont<a, r>)
      ^    ^     ^         ^^^^ */

    const rank1Dom = Array.from(reduceAst((rank1, ast) => {
      if (ast[TAG] === "BoundTV") {
        if (ast.scope === TOP_LEVEL_SCOPE)
          return rank1.add(ast.name);

        else return rank1;
      }

      else return rank1;
    }, new Set()) (adtAst.body.body.lambdas[0] [0]));

    const rank1Co = Array.from(reduceAst((rank1, ast) => {
      if (ast[TAG] === "BoundTV") {
        if (ast.scope === TOP_LEVEL_SCOPE)
          return rank1.add(ast.name);

        else return rank1;
      }

      else return rank1;
    }, new Set()) (wrapperAst));

    const outOfScope = rank1Dom.filter(btv => !rank1Co.includes(btv))
      .concat(rank1Co.filter(btv => !rank1Dom.includes(btv)));

    if (outOfScope.length > 0)
        throw new TypeError(cat(
          "illegal algebraic data type declaration\n",
          "type parameter(s) not in scope\n",
          `namely: ${outOfScope.join(", ")}\n`,
          `while declaring "${adtAnno}"\n`));

    // return the ADT value constructor

    return Object.assign(x => {
      const argAnno = introspectDeep(x);

      const instantiations = unifyTypes(
        domainAst,
        parseAnno(argAnno),
        0,
        0,
        0,
        0,
        new Map(),
        domainAnno,
        argAnno,
        adtAnno,
        []);

      const wrapperAnno_ = serializeAst(
        regeneralize(
          pruneForalls(
            substitute(
              specializeLHS(
                TOP_LEVEL_SCOPE, 0, 1) (wrapperAst).ast,
                instantiations))));

      // return the ADT

      return {
        [TAG]: tcons,
        [ADT]: wrapperAnno_,
        run: x
      };
    }, {[ANNO]: adtAnno});
  }
};


/******************************************************************************
********************************[ TYPE CLASS ]*********************************
******************************************************************************/


/* Declare type classes purely at the value level. They are encoded as dicts
including the operations of the respective type class. They resemble ADTs
quite a lot, hence the also rely on ADTs. */

export const typeClass = tcAnno => {

  // bypass the type validator

  if (CHECK === false)
    return (...os) => o => {
      o = Object.assign({}, o); // clone
      os.forEach(p => o = Object.assign(o, p));
      return o;
    }

  // run the type validator

  else {
    
    // strip newlines and indentations

    tcAnno = tcAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
      .replace(new RegExp(SAFE_SPACE, "g"), " ");

    // determine type class components

    const tcCompos = splitByScheme(
      / => /, 4, remNestings(tcAnno)) (tcAnno);

    // determine superclass dependencies

    const superClasses = [];

    if (tcCompos.length < 2)
      throw new TypeError(cat(
        "invalid type class declaration\n",
        "value-level type classes expect a top-level function type\n",
        "where the codomain contains the type dictionary\n",
        "and the codomain contains the type wrapper\n",
        `while declaring "${tcAnno}"\n`));

    else if (tcCompos.length > 3)
      throw new TypeError(cat(
        "invalid type class declaration\n",
        "malformed type class dependencies\n",
        "superclasses must be listed\n",
        "in a single multi-argument parameter\n",
        `while declaring "${tcAnno}"\n`));

    else if (tcCompos.length === 3) {

      // validate superclasses dependencies

      if (tcCompos[0].search(new RegExp(
        "^(?:[A-Z][A-Za-z0-9]*<[a-z][A-Za-z0-9]*>, )*[A-Z][A-Za-z0-9]*<[a-z][A-Za-z0-9]*>$", "")) === NOT_FOUND)
          throw new TypeError(cat(
            "invalid type class declaration\n",
            "malformed type class dependencies\n",
            "comma separated list of superclasses expected\n",
            `but "${tcCompos[0]}" received\n`,
            `while declaring "${tcAnno}"\n`));

      // parse superclass dependencies and retrieve their components

      tcCompos[0].split(", ")
        .forEach((superClass, i) => {
          const tcons = superClass.replace(/<.+>$/, ""),
            tparamTo = superClass.split(/</) [1].slice(0, -1);

          if (!tcDict.has(tcons))
            throw new TypeError(cat(
              "invalid type class declaration\n",
              "malformed type class dependencies\n",
              "list of declared type classes expected\n",
              `but unknown "${tcons}" received\n`,
              `while declaring "${tcAnno}"\n`));

          else {

            // retrieve superclass components from global type class dictionary

            const {tparam, tdictAnno} = tcDict.get(tcons);

            /* Store type constructor, the type parameter and the dictionary
            annotation. The type parameter is stored in two versions: The first
            one represents the type parameter used in the original type class
            annotation. The second one is the type parameter used in the super
            class dependency. If both differ, they must be unified before being
            added to the current type class. */

            superClasses[i] = {
              tcons,
              tparamFrom: tparam,
              tparamTo,
              tdictAnno
            };
          }
        });
    }

    const tcOffset = tcCompos.length === 3 ? 1 : 0;

    // verify type wrapper

    const wrapperAnno = tcCompos[1 + tcOffset];

    if (wrapperAnno.search(new RegExp("^[A-Z][A-Za-z0-9]*<.*>$", "")) === NOT_FOUND)
      throw new TypeError(cat(
        "invalid type class declaration\n",
        "value-level type class expects a type constructor\n",
        "parameterized by exaclty one type parameter\n",
        "in its codomain\n",
        `but "${wrapperAnno}" received\n`,
        `while declaring "${tcAnno}"\n`));

    // determine name and arity of the type wrapper

    const tcons = wrapperAnno.replace(/<[^>]+>$/, ""),
      tparam = wrapperAnno.match(/<([^>]+)>$/) [1];

    // check for name clashes with previously registered ADTs

    if (adtDict.has(tcons))
      throw new TypeError(cat(
        "illegal type class\n",
        "name collision with an algebraic data type found\n",
        `namely: ${tcons}\n`,
        `while declaring "${tcAnno}"\n`));

    // check for name clashes with native types

    else if (imperativeTypeDict.has(tcons))
      throw new TypeError(cat(
        "illegal type class\n",
        "name collision with an imperative type found\n",
        `namely: ${tcons}\n`,
        `while declaring "${tcAnno}"\n`));

    // check for name clashes with type constants

    else if (typeConstDict.has(tcons))
      throw new TypeError(cat(
        "illegal type class\n",
        "name collision with a type constant found\n",
        `namely: ${tcons}\n`,
        `while declaring "${tcAnno}"\n`));

    // register type class as name-arity pair

    else
      adtDict.set(tcons, 1);

    // parse type class and type dict

    const tcAst = parseAnno(tcAnno),
      tdictAst = adjustForall(tcAst.body.body.lambdas[0 + tcOffset] [0]),
      wrapperAst = parseAnno(wrapperAnno),
      reservedOps = new Set(tdictAst.body.body.map(({k}) => k));

    // recover arity of the type constructor

    wrapperAst.body.body[0].body.push(Partial);

    // verify type dict

    if (!("body" in tdictAst) || tdictAst.body[TAG] !== "Obj")
      throw new TypeError(cat(
        "invalid type class declaration\n",
        "value-level encoding expects a type dictionary\n",
        `but "${serializeAst(tcAst.body.body.lambdas[0] [0])}" received\n`,
        `while declaring "${tcAnno}"\n`));

    /* Verify that all rank-1 type variables of the domain occur in the codomain
    of the function type:

    (^a, b. {of: (a => m<a>), chain: (m<a> => (a => m<a>) => m<b>)}) => Monad<m>
                       ^              ^             ^        ^                ^

    ({empty: m, append: (m => m => m)}) => Monoid<m>
             ^           ^    ^    ^              ^ */

    const rank1Dom = Array.from(reduceAst((rank1, ast) => {
      if (ast[TAG] === "BoundTV") {
        if (ast.scope === TOP_LEVEL_SCOPE)
          return rank1.add(ast.name);

        else return rank1;
      }

      else return rank1;
    }, new Set()) (tcAst.body.body.lambdas[0] [0]));

    const rank1CoDom = Array.from(reduceAst((rank1, ast) => {
      if (ast[TAG] === "BoundTV") {
        if (ast.scope === TOP_LEVEL_SCOPE)
          return rank1.add(ast.name);

        else return rank1;
      }

      else return rank1;
    }, new Set()) (wrapperAst));

    const outOfScope = rank1Dom.filter(btv => !rank1CoDom.includes(btv))
      .concat(rank1CoDom.filter(btv => !rank1Dom.includes(btv)));

    if (outOfScope.length > 0)
        throw new TypeError(cat(
          "illegal type class declaration\n",
          "type parameter(s) not in scope\n",
          `namely: ${outOfScope.join(", ")}\n`,
          `while declaring "${tcAnno}"\n`));

    // extend current type dict by superclass operations

    superClasses.forEach(({tcons: tcons_, tparamFrom, tparamTo, tdictAnno}) => {
      let tdictAst_ = parseAnno(tdictAnno);

      // alpha renaming of the type class type parameter

      if (tparamFrom !== tparamTo) {

        // retrieve used rank-1 TV names

        const btvs_ = retrieveBoundTVs(TOP_LEVEL_SCOPE) (tdictAst_);

        // resolve name ambiguities

        let name = tparamTo;

        if (btvs_.has(name)) {
          let charCode = 97;

          do {
            name = String.fromCharCode(charCode++)
          } while (btvs_.has(name));
        }

        // alpha renaming

        tdictAst_ = mapAst(ast => {
          if (ast[TAG] === "BoundTV"
            && ast.scope === TOP_LEVEL_SCOPE
            && ast.name === tparamFrom) {
              ast.name = name;
              return ast;
          }

          else if (ast[TAG] === "Forall"
            && ast.scope === TOP_LEVEL_SCOPE
            && ast.btvs.has(tparamFrom)) {
              ast.btvs.delete(tparamFrom);
              ast.btvs.add(name);
              return ast;
          }

          else return ast;
        }) (tdictAst_);
      }

      // attach superclass operations to current dict

      let btvs = new Set();

      tdictAst_.body.body.forEach(({k, v}) => {

        btvs = new Set([...btvs, ...retrieveBoundTVs(TOP_LEVEL_SCOPE) (v)]);

        /* Check that a superclass doesn't override properties of the current
        type class. Superclasses might share properties, though. */

        if (reservedOps.has(k))
          throw new TypeError(cat(
            "illegal type class declaration\n",
            "subclass tries to override a property of one of its superclasses\n",
            `namely: ${k}\n`,
            `while declaring "${tcAnno}"\n`));

        else {

          // attach operation to current type dict

          tdictAst.body.body.push({k, v});
        }
      });

      // adjust the outer quantifier

      tdictAst.btvs = btvs;
    });

    // register current type dictionary

    tcDict.set(tcons, {tparam, tdictAnno: serializeAst(tdictAst)});

    /* Return a function that excepts zero, one or several super dictionaries
    and unifies the operations of the current type dictionary and the super
    optional dictionaries with these of the resolved type class:
    `{specialicedTypeDict} => {unifiedTypedDict}` */

    return (...superDicts) => Object.assign(dict => {
      dict = Object.assign({}, dict); // clone

      // add super dictionary properties to the current one

      superDicts.forEach((superDict, i) => {

        // ensure superclass dict is an ADT

        if (!(ADT in superDict)
          || Object.keys(superDict).length === 0)
            throw new TypeError(cat(
              "illegal type class instance\n",
              "expects typed dictionaries as superclasses\n",
              `but received: ${introspectDeep(superDict)}\n`,
              `as the ${ordinalNum(i + 1)} passed argument\n`,
              `while applying "${tcAnno}"\n`));

        else {
          Object.entries(superDict).forEach(([k, v]) => {

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
          superDict[TAG],
          {value: superDict, configurable: true, writable: true});
      });

      // collect properties each from the type class and the passed dictionaries

      const typeLevelProps = tdictAst.body.body.reduce((acc, {k, v}) =>
        acc.set(k, v[TAG] === "Forall" ? adjustForall(v) : quantifyAst(v)), new Map());

      const valueLevelProps = Object.keys(dict);

      // ensure the property number at type and value level match

      if (typeLevelProps.size !== valueLevelProps.length)
        throw new TypeError(cat(
          "illegal type class instance\n",
          "exhaustiveness check failed\n",
          `expected: ${Array.from(typeLevelProps)
            .map(([k, v]) => k)
            .join(", ")}\n`,
          `received: ${valueLevelProps.join(", ")}\n`,
          `while applying "${tcAnno}"\n`));

      else {
        let instantiations = new Map();

        // unify type class and type dictionary

        valueLevelProps.forEach(k => {

          // exhaustiveness check

          if (!typeLevelProps.has(k))
            throw new TypeError(cat(
              "illegal type class instance\n",
              "exhaustiveness check failed\n",
              `expected: ${Array.from(typeLevelProps)
                .map(([k, v]) => k)
                .join(", ")}\n`,
              `received: ${Array.from(valueLevelProps)
                .join(", ")}\n`,
              `while applying "${tcAnno}"\n`));

          // type the current function property

          instantiations = unifyTypes(
            typeLevelProps.get(k),
            typeof dict[k] === "function"
              ? parseAnno(dict[k] [ANNO])
              : parseAnno(introspectDeep(dict[k])),
            0,
            0,
            0,
            0,
            instantiations,
            serializeAst(typeLevelProps.get(k)),
            dict[k] [ANNO],
            tcAnno,
            []);
        });

        // update the type wrapper

        const wrapperAnno_ = serializeAst(
          regeneralize(
            pruneForalls(
              substitute(
                specializeLHS(
                  TOP_LEVEL_SCOPE, 0, 1) (wrapperAst).ast,
                  instantiations))));

        dict[ADT] = wrapperAnno_;
        dict[TAG] = tcons;
        return dict;
      }
    }, {[ANNO]: tcAnno});
  }
};


/******************************************************************************
*******************************************************************************
******************************[ TYPE VALIDATION ]******************************
*******************************************************************************
******************************************************************************/


/* The type checker only considers applications, not definition. It only
attempts to unify the formal parameter of a function type with a provided
argument type, but it does not infer types from given terms. */

export const fun = (f, funAnno) => {
  const go = (g, lamIndex, funAst, funAnno) => Object.assign((...args) => {
    
    let instantiations = new Map(),
      tvid = 0; // id to create unique type variable names

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

    // introspect arguments recursively
    
    const argAnnos = args.map(arg => introspectDeep(arg)),
      argAsts = argAnnos.map(parseAnno);

    // resolve name clashes

    if (argAnnos.length > 1) {
      const nameMap = new Map();
      let charCode = 97;

      const nameSets = argAnnos.map((argAnno, i) => {
        const argAst = argAsts[i];

        if (argAst[TAG] === "Forall"
          && argAst.btvs.size > 0)
            return argAst.btvs;

        else return new Set();
      });

      const {nameMappings} = nameSets.slice(1).reduce(({consumedNames, nameMappings}, nameSet, i) => {
        nameSet.forEach(name => {
          if (consumedNames.has(name)) {
            let name_;

            do {
              name_ = String.fromCharCode(charCode++)
            } while (consumedNames.has(name_));

            consumedNames.add(name_);
            nameMappings.set(`${i + 1}/${name}`, name_);
            return {consumedNames, nameMappings};
          }

          else {
            consumedNames.add(name);
            return {consumedNames, nameMappings};
          }
        });

        return {consumedNames, nameMappings};
      }, {consumedNames: new Set(nameSets[0]), nameMappings: new Map()});

      argAsts.slice(1).forEach((argAst, i) => {
        argAsts[i + 1] = mapAst(ast => {
          if (ast[TAG] === "Forall"
            && ast.scope === TOP_LEVEL_SCOPE
            && ast.btvs.size > 0) {
              ast.btvs.forEach(btv => {
                if (nameMappings.has(`${i + 1}/${btv}`)) {
                  ast.btvs.delete(btv);
                  ast.btvs.add(nameMappings.get(`${i + 1}/${btv}`));
                }
              });

              return ast;
          }

          else if (ast[TAG] === "BoundTV"
            && ast.scope === TOP_LEVEL_SCOPE
            && nameMappings.has(`${i + 1}/${ast.name}`)) {
              ast.name = nameMappings.get(`${i + 1}/${ast.name}`);
              return ast;
          }

          else return ast;
        }) (argAst);

        argAnnos[i + 1] = serializeAst(argAsts[i + 1]);
      });
    }

    // check arity

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
    this process bount TVs are instantiated with fresh meta TVs. As opposed to
    subsequent dequantifications there is no alpha renaming taking place. This
    ensures that the unified annotation only deviates as little as possible
    from the original user-defined one. */
    
    ({ast: funAst, tvid} = specializeLHS(funAst.scope, 0, "") (funAst));

    /* Attempt to type validate the application of `fun` with `arg` by unifying
    `fun`'s first formal parameter with `arg`. Since this is a higher-rank type
    validator, subsumption is necessary in order to unify deeply nested
    quantifiers. The subsumption judgement for type application has the form
    `arg <: param` (`arg` is at least as polymorphic as `param`). The order
    flips for each nesting due to the usual co- and contravariant phenomena of
    the function type. */

    instantiations = argAnnos.reduce(
      (instantiations, argAnno, argIndex) =>
        unifyTypes(
          funAst.body.body.lambdas[0] [TAG] === "Arg0"
            ? Tconst("Undefined")
            : funAst.body.body.lambdas[0] [argIndex],
          parseAnno(argAnno),
          lamIndex,
          argIndex,
          1,
          tvid,
          instantiations,
          funAst.body.body.lambdas[0] [TAG] === "Arg0"
            ? "Undefined"
            : serializeAst(funAst.body.body.lambdas[0] [argIndex]),
          argAnno,
          funAnno,
          argAnnos), instantiations);

    /* Since type equality is transitive, the type validator takes it into
    account:

    `a ~ b`
    `a ~ c`
    `b ~ c` */

    const transProp = new Map();

    instantiations.forEach(({key: keyAst, value: valueAst}, keyAnno) => {
      const valueAnno = serializeAst(valueAst);

      // skip transitivity check for `Partial` types

      if (keyAst[TAG] === "Partial"
        || valueAst[TAG] === "Partial") return null;
     
      else if (transProp.has(valueAnno)) {
        const targetAst = transProp.get(valueAnno);

        instantiations.set(serializeAst(keyAst), {
          key: keyAst,
          value: targetAst,
          substitutor: ast => ast[TAG] === keyAst[TAG]
            && ast.name === keyAst.name
              ? targetAst
              : ast});
      }

      else transProp.set(valueAnno, keyAst);
    });

    /* TVs must not occur within a composite type they are meant to be
    instantiated with, because this would yield an infinite type. This rule
    also applies if such an occurrence is only indirectly, established by
    another instantiation. */

    const occurrences = new Set();

    instantiations.forEach(({key: keyAst, value: valueAst}) => {
      const lhs = reduceAst((acc, ast) => {
        switch (ast[TAG]) {
          case "BoundTV":
          case "MetaTV":
          case "RigidTV":
            return acc.concat(ast.name);

          default: return acc;
        }
      }, []) (keyAst);

      const rhs = reduceAst((acc, ast) => {
        switch (ast[TAG]) {
          case "BoundTV":
          case "MetaTV":
          case "RigidTV":
            return acc.concat(ast.name);

          default: return acc;
        }
      }, []) (valueAst);

      lhs.reduce((acc, x) => rhs.reduce(
        (acc_, y) => acc.add(`${x}/${y}`), acc), occurrences);
    });

    occurrences.forEach(occurrence => {
      const [lhs, rhs] = occurrence.split(/\//);

      if (occurrences.has(`${rhs}/${lhs}`)) {
        if (rhs === lhs)
          throw new TypeError(cat(
            "occurs check failed\n",
            `"${lhs}" occurs during instantiation\n`,
            "on the LHS and RHS respecitvely\n",
            "and thus yields an infinite type\n",
            "while unifying\n",
            extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));

        else throw new TypeError(cat(
          "occurs check failed\n",
          `"${lhs}" and "${rhs}" occur during instantiation\n`,
          "on the LHS and RHS respecitvely\n",
          "and thus yield an infinite type\n",
          "while unifying\n",
          extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));
      }
    });

    /* After unification the consumed type parameter must be stripped off and
    all relevant instantiations must be substituted in the remaining type.
    Regeneralizing restores the bound TVs, provided there are still some left. */

    const unifiedAst =
      regeneralize(
        pruneForalls(
          substitute(
            remConsumedParams(funAst),
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

    // ensure that applications on the term level never returns `undefined`

    if (r === undefined)
      throw new TypeError(cat(
        "illegal result type\n",
        "namely: undefined\n",
        `runtime immediately terminated\n`,
        extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));

    // take algebraic data types and type classes into account

    else if (r && typeof r === "object" && ADT in r) {

      // type class

      if (tcDict.has(r[TAG])) {
        const wrapperAst = parseAnno(r[ADT]);

        const instantiations_ = unifyTypes(
          wrapperAst,
          unifiedAst,
          0,
          0,
          0,
          0,
          new Map(),
          r[ADT],
          serializeAst(unifiedAst),
          funAnno,
          []);

        const wrapperAnno = serializeAst(
          regeneralize(
            pruneForalls(
              substitute(
                specializeLHS(
                  TOP_LEVEL_SCOPE, 0, 1) (wrapperAst).ast,
                  instantiations_))));

        r[ADT] = wrapperAnno;
      }

      // algebraic data type

      else {

        // parse the annotations of the ADT components

        const wrapperAst = parseAnno(r[ADT]),
          domainAst = r.run && r.run[ANNO]
            ? parseAnno(r.run[ANNO])
            : parseAnno(introspectDeep(r.run));

        // unify the wrapper with the unified AST

        const instantiations_ = unifyTypes(
          wrapperAst,
          unifiedAst,
          0,
          0,
          0,
          0,
          new Map(),
          r[ADT],
          serializeAst(unifiedAst),
          funAnno,
          []);

        // update the domain annotation

        const domainAnno = serializeAst(
          regeneralize(
            pruneForalls(
              substitute(
                specializeLHS(
                  TOP_LEVEL_SCOPE, 0, 1) (domainAst).ast,
                  instantiations_))));

        // update the wrapper annotation

        const wrapperAnno = serializeAst(
          regeneralize(
            pruneForalls(
              substitute(
                specializeLHS(
                  TOP_LEVEL_SCOPE, 0, 1) (wrapperAst).ast,
                  instantiations_))));

        // type the Scott encoded ADT domain and the wrapper

        if (domainAst[TAG] === "Forall"
          && domainAst.body[TAG] === "Fun")
            r.run = fun(r.run[UNWRAP], domainAnno);

        r[ADT] = wrapperAnno;
      }

      return r;
    }

    /* If the resulting AST is a function type or a function type constant, the
    type validator is still in process of collecting more arguments. Please note
    that due to return type abstraction a function may collect more arguments
    than was initially specified. */

    if (unifiedAst[TAG] === "Forall"
      && unifiedAst.body[TAG] === "Fun") {
        if (introspectFlat(r) === "Function")
          return Object.assign(
            go(r, lamIndex + 1, unifiedAst, serializeAst(unifiedAst)),
            {[UNWRAP]: r});

        else
          throw new TypeError(cat(
            `result type mismatch in parameter #${lamIndex + 1}\n`,
            `expected: ${serializeAst(unifiedAst)}\n`,
            `received: ${introspectFlat(r)}\n`,
            extendErrMsg(lamIndex, null, funAnno, argAnnos, instantiations)));
    }

    // result type unification

    else {
      const resultAnno = introspectDeep(r);

      unifyTypes(
        unifiedAst,
        parseAnno(resultAnno),
        0,
        0,
        0,
        tvid,
        instantiations,
        serializeAst(funAst.body.body.result),
        resultAnno,
        funAnno,
        argAnnos);

      // return the untyped final result

      return r;
    }
  }, {[ANNO]: serializeAst(funAst)}); // attach dynamic type annotation

  /********************
   * MAIN ENTRY POINT *
   ********************/

  // bypass type validator

  if (CHECK === false) return f;

  // throw an error on untyped function

  else if (funAnno === undefined)
    throw new TypeError(cat(
      "missing type annotation\n",
      "type validator expects an untyped lambda\n",
      "along with an associated annotation\n"));

  // run the validator

  else {

    // strip newlines and indentations

    funAnno = funAnno.replace(new RegExp("[ \\t]*\\r\\n[ \\t]*|[ \\t]*\\n[ \\t]*", "g"), "")
      .replace(new RegExp(SAFE_SPACE, "g"), " ");

    // ensure a top-level function type

    if (remNestings(funAnno[0] === "(" && funAnno[funAnno.length - 1] === ")"
      ? funAnno.slice(1, -1)
      : funAnno).search(/ => /) === NOT_FOUND) {
        throw new TypeError(cat(
          "top-level type must be a function\n",
          "received the following type though:\n",
          `${funAnno}\n`));
    }

    else {

      // parse the main function annotation

      const funAst = parseAnno(funAnno);

      // return the typed function

      return Object.assign(
        go(f, 0, funAst, funAnno),
        {get [UNWRAP] () {return f}});
    }
  }
};


/******************************************************************************
**************************[ UNIFICATION/SUBSUMPTION ]**************************
******************************************************************************/


const unifyTypes = (paramAst, argAst, lamIndex, argIndex, iteration, tvid, instantiations, paramAnno, argAnno, funAnno, argAnnos) => {

  /* Unifies two possibly higher-kinded types using subsumption. Interestingly,
  we don't need kinds and kind unification respecitvely but can solely rely on
  arities and abstraction over arities in case of generic type constructors. */

  /* Subsumption is required to instantiate bound TVs within deeply nested
  quantifiers. It comes along with the usual covariance subtype order in the
  codomain but also with contravariance order in the domain. For variance
  to kick in both the LHS and RHS must be function types. */

  /* Although strictly speaking subsumption is only necessary to look into
  explicit forall quantifiers, this algorithm also uses it for regular,
  rank-1 function types. */

  /* The subsumption judgement defines the scope that emerges by applying a
  function to an argument type. It has the form `arg <: param`, which reads
  "arg is at least as polymorphic as param". `param` is just the first formal
  parameter of the function type. */

  /* If fun and arg include function parameter and arguments respectively, the
  subsumption judgement flips for each evaluation of parameters/arguments. This
  is due to the contravariant property of the function domain. */

  if (iteration % 2 === 0) {
    if (paramAst[TAG] === "Forall" && paramAst.btvs.size > 0)
      ({ast: paramAst, tvid} = specializeLHS(paramAst.scope, iteration, tvid + 1) (paramAst));

    if (argAst[TAG] === "Forall" && argAst.btvs.size > 0)
      ({ast: argAst, tvid} = specializeRHS(argAst.scope, iteration, tvid + 1) (argAst));
  }

  else {
    if (argAst[TAG] === "Forall" && argAst.btvs.size > 0)
      ({ast: argAst, tvid} = specializeLHS(argAst.scope, iteration, tvid + 1) (argAst));

    if (paramAst[TAG] === "Forall" && paramAst.btvs.size > 0)
      ({ast: paramAst, tvid} = specializeRHS(paramAst.scope, iteration, tvid + 1) (paramAst));
  }

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

  /* Substitution should go from arg to param type whenever possible. This way
  the unified type has as little deviations as possible from fun's original
  annotation.  However, this only works for instantiations of two meta or two
  rigid TVs. If both meta and rigid TVs are involved, the latter must always be
  substituted by the former. */

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
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
          }
        }

        case "BoundTV": // Adt<a, b> ~ bound c
          throw new TypeError(
            "internal error: unexpected bound type variable");

        case "Forall": // Adt<a, b> ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {// Adt<a, b> ~ u<c> | u<c, d>
          if (argAst.body.length === 0) // Adt<a, b> ~ c
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

          else if (argAst.body.length <= paramAst.body.length) { // Adt<a, b> ~ u<c> | u<c, d>
            instantiations = instantiate( // Adt | Adt<a> ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.iteration,
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
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
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

        case "Partial": // Adt<a, b> ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

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
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "BoundTV": // [a] ~ bound b
          throw new TypeError(
            "internal error: unexpected bound type variable");

        case "Forall": // [a] ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
        
        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) // [a] ~ b
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

          else if (argAst.body.length === 1) { // [a] ~ u<b>
            instantiations = instantiate( // u ~ []
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.iteration,
                [Partial]),
              Arr(Partial),
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? Arr(refAst.body[0])
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

            return unifyTypes(
              paramAst.body,
              argAst.body[0],
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
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

        case "Partial": // [a] ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

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
        "internal error: unexpected bound type variable");

    case "Forall": {
      switch (argAst[TAG]) {
        case "Forall": // forall ~ forall
          return unifyTypes(
            paramAst.body,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
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
            iteration,
            tvid,
            instantiations,
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
            "internal error: unexpected bound type variable");

        case "Forall": // (a => b) ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
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
          sequence or the actual result. */

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
            
            case "Arg1": // single argument
            case "Argv": { // variadic argument
              instantiations = unifyTypes(
                paramAst.body.lambdas[0] [0],
                argAst.body.lambdas[0] [0],
                lamIndex,
                argIndex,
                iteration + 1,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);

              break;
            }
            
            case "Args": // multi argument
            case "Argsv": { // multi argument with a trailing variadic argument
              instantiations = paramAst.body.lambdas[0].reduce((acc, arg, i) =>
                unifyTypes(
                  paramAst.body.lambdas[0] [i],
                  argAst.body.lambdas[0] [i],
                  lamIndex,
                  argIndex,
                  iteration + 1,
                  tvid,
                  instantiations,
                  paramAnno,
                  argAnno,
                  funAnno,
                  argAnnos), instantiations);

              break;
            }

            default:
              throw new TypeError(
                "internal error: unknown argument list constructor");
          }

          // covariant subsumption

          if (paramAst.body.lambdas.length === 1) {
            if (argAst.body.lambdas.length === 1) { // (a => b) ~ (c => d)
              let paramResult, argResult;

              if (!isTV(paramAst.body.result) && isTV(argAst.body.result)) {
                argResult = paramAst.body.result;
                paramResult = argAst.body.result;
              }

              else {
                paramResult = paramAst.body.result;
                argResult = argAst.body.result;
              }

              return unifyTypes(
                paramResult,
                argResult,
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
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
                iteration,
                tvid,
                instantiations,
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
                iteration,
                tvid,
                instantiations,
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
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }
          }
        }

        case "MetaTV":
        case "RigidTV": { // zyx
          if (argAst.body.length === 0) // (a => b) ~ c
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => {
                if (refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name)
                    return refAst.position === "codomain"
                      ? Codomain(...toAst.body.lambdas, toAst.body.result)
                      : Forall(new Set(), TOP_LEVEL_SCOPE, toAst);

                else return refAst;
              },
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

          else {
            const arityDiff = determineArity(paramAst) - argAst.body.length;

            if (arityDiff === 0) { // (() => b) ~ u<c> | (a => b) ~ u<c, d> | (a, b => c) ~ u<d, e, f>

              // unify domain

              switch (paramAst.body.lambdas[0] [TAG]) {
                case "Arg0": {
                  instantiations = instantiate( // (=>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      argAst.iteration,
                      [Partial]),
                    Fun([new Arg0()], Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            TOP_LEVEL_SCOPE,
                            Fun([
                              new Arg0()],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.iteration,
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[0])));
                      }
                      
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  break;
                }

                case "Arg1": {
                  instantiations = instantiate( // (=>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      argAst.iteration,
                      [Partial, Partial]),
                    Fun([new Arg1(Partial)], Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            TOP_LEVEL_SCOPE,
                            Fun([
                              new Arg1(refAst.body[0])],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.iteration,
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[1])));
                      }
                      
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  instantiations = unifyTypes(
                    paramAst.body.lambdas[0] [0],
                    argAst.body[0],
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  break;
                }

                case "Args": {
                  instantiations = instantiate( // (=>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      argAst.iteration,
                      Array(argAst.body.length).fill(Partial)),
                    Fun([
                      Args.fromArr(Array(paramAst.body.lambdas[0].length).fill(Partial))],
                      Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            TOP_LEVEL_SCOPE,
                            Fun([
                              Args.fromArr(refAst.body.slice(0, -1))],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.iteration,
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[refAst.body.length - 1])));
                      }
                      
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  instantiations = paramAst.body.lambdas[0].reduce((acc, ast, i) =>
                    unifyTypes(
                      ast,
                      argAst.body[i],
                      lamIndex,
                      argIndex,
                      iteration,
                      tvid,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), instantiations);

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
                  "internal error: unexpected thunk");

                case "Arg1": {
                  instantiations = instantiate( // (a => ) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      argAst.iteration,
                      [Partial]),
                    Fun([paramAst.body.lambdas[0]], Partial),
                    (refAst, fromAst, toAst) => {
                      if (refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name) {
                          return Forall(
                            new Set(),
                            TOP_LEVEL_SCOPE,
                            Fun([
                              toAst.body.lambdas[0]],
                              mapAst(refAst_ => {
                                if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                  return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                    refAst_.name,
                                    refAst_.scope,
                                    "codomain",
                                    refAst_.iteration,
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[0])));
                      }
                       
                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  break;
                }

                case "Args": {
                  instantiations = instantiate( // (a, b =>) ~ u
                    (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      argAst.name,
                      argAst.scope,
                      argAst.position,
                      argAst.iteration,
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
                            TOP_LEVEL_SCOPE,
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
                                    refAst_.iteration,
                                    refAst_.body);
                                
                                else return refAst_;
                              }) (refAst.body[refAst.body.length - 1])));
                      }

                      else return refAst;
                    },
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  instantiations = paramAst.body.lambdas[0]
                    .slice(arityDiff)
                    .reduce((acc, ast, i) =>
                      unifyTypes(
                        ast,
                        argAst.body[i],
                        lamIndex,
                        argIndex,
                        iteration,
                        tvid,
                        instantiations,
                        paramAnno,
                        argAnno,
                        funAnno,
                        argAnnos), instantiations);

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
                iteration,
                tvid,
                instantiations,
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
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }
          }
        }

        case "Partial": // (a => b) ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

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
            "internal error: unexpected bound type variable");

        case "Forall":
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
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
              return instantiations;

            else return instantiate( // a ~ b
              paramAst,
              argAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
          }

          else if (paramAst.body.length === 0) { // a ~ u<b>
            return instantiate(
              paramAst,
              argAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
          }

          else if (argAst.body.length === 0) { // t<a> ~ b
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
          }

          const arityDiff = paramAst.body.length - argAst.body.length;
          
          if (arityDiff === 0) { // t<a, b> ~ u<c, d>
            if (paramAst.name === argAst.name) { // t ~ t
              // noop
            }

            else { // t ~ u
              instantiations = instantiate(
                (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                  paramAst.name,
                  paramAst.scope,
                  paramAst.position,
                  paramAst.iteration,
                  Array(paramAst.body.length).fill(Partial)),
                (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                  argAst.name,
                  argAst.scope,
                  argAst.position,
                  argAst.iteration,
                  Array(argAst.body.length).fill(Partial)),
                (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                  && refAst.name === fromAst.name
                    ? (toAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                        toAst.name,
                        toAst.scope,
                        toAst.position,
                        toAst.iteration,
                        refAst.body)
                    : refAst,
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }

            return paramAst.body.reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
          }
          
          else if (arityDiff < 0) { // t<a, b> ~ u<c, d, e, f>
            const fields = argAst.body.slice(arityDiff);

            instantiations = instantiate( // t ~ u<c, d>
              (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                paramAst.name,
                paramAst.scope,
                paramAst.position,
                paramAst.iteration,
                Array(paramAst.body.length).fill(Partial)),
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.iteration,
                argAst.body.slice(0, argAst.body.length - paramAst.body.length)
                  .concat(Array(paramAst.body.length).fill(Partial))),
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? (toAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      toAst.name,
                      toAst.scope,
                      toAst.position,
                      toAst.iteration,
                      refAst.body.slice(arityDiff))
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

            return fields.reduce((acc, field, i) =>
              unifyTypes(
                paramAst.body[i],
                field,
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
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

        case "Partial": // a | t<a> ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        default: { // xyz
          if (paramAst.body.length === 0) { // a ~ composite type
            if (argAst[TAG] === "Fun") { // a ~ (b => c)
              return instantiate(
                paramAst,
                argAst,
                (refAst, fromAst, toAst) => {
                  if (refAst[TAG] === fromAst[TAG]
                    && refAst.name === fromAst.name)
                      return refAst.position === "codomain"
                        ? Codomain(...toAst.body.lambdas, toAst.body.result)
                        : Forall(new Set(), TOP_LEVEL_SCOPE, toAst);
                  
                  else return refAst;
                },
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos);
            }

            else return instantiate( // a ~ composite type
              paramAst,
              argAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
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
                  if (paramAst.body.length === 0) // a ~ Adt<b, c>
                    return instantiate(
                      paramAst,
                      argAst,
                      (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                        && refAst.name === fromAst.name
                          ? toAst
                          : refAst,
                      lamIndex,
                      argIndex,
                      iteration,
                      tvid,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos);

                  else if (paramAst.body.length <= argArity) { // t<a> | t<a, b> ~ Adt<c, d>
                    instantiations = instantiate( // t ~ Adt | Adt<b>
                      (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                        paramAst.name,
                        paramAst.scope,
                        paramAst.position,
                        paramAst.iteration,
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
                      iteration,
                      tvid,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos);

                    return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                      unifyTypes(
                        field,
                        paramAst.body[i],
                        lamIndex,
                        argIndex,
                        iteration,
                        tvid,
                        instantiations,
                        paramAnno,
                        argAnno,
                        funAnno,
                        argAnnos), instantiations);
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
                  instantiations = instantiate( // t ~ [] | [1]
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      paramAst.iteration,
                      [Partial]),
                    (argAst[TAG] === "Arr" ? Arr : Nea) (Partial),
                    (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                      && refAst.name === fromAst.name
                        ? (toAst[TAG] === "Arr" ? Arr : Nea) (refAst.body[0])
                        : refAst,
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  return unifyTypes(
                    paramAst.body[0],
                    argAst.body,
                    lamIndex,
                    argIndex,
                    iteration,
                    tvid,
                    instantiations,
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
                        instantiations = instantiate( // t ~ (=>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            paramAst.iteration,
                            [Partial]),
                          Fun([new Arg0()], Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  TOP_LEVEL_SCOPE, Fun([
                                    new Arg0()],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.iteration,
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[0])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          iteration,
                          tvid,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);

                        break;
                      }

                      case "Arg1": {
                        instantiations = instantiate( // t ~ (=>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            paramAst.iteration,
                            [Partial, Partial]),
                          Fun([new Arg1(Partial)], Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  TOP_LEVEL_SCOPE,
                                  Fun([
                                    new Arg1(refAst.body[0])],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.iteration,
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[1])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          iteration,
                          tvid,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);

                        instantiations = unifyTypes(
                          paramAst.body[0],
                          argAst.body.lambdas[0] [0],
                          lamIndex,
                          argIndex,
                          iteration,
                          tvid,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);

                        break;
                      }

                      case "Args": {
                        instantiations = instantiate( // t ~ (=>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            paramAst.iteration,
                            Array(paramAst.body.length).fill(Partial)),
                          Fun([
                            Args.fromArr(Array(argAst.body.lambdas[0].length).fill(Partial))],
                            Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  TOP_LEVEL_SCOPE,
                                  Fun([
                                    Args.fromArr(refAst.body.slice(0, -1))],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.iteration,
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[refAst.body.length - 1])));
                            }
                            
                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          iteration,
                          tvid,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);

                        instantiations = argAst.body.lambdas[0].reduce((acc, ast, i) =>
                          unifyTypes(
                            paramAst.body[i],
                            ast,
                            lamIndex,
                            argIndex,
                            iteration,
                            tvid,
                            instantiations,
                            paramAnno,
                            argAnno,
                            funAnno,
                            argAnnos), instantiations);

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
                        "internal error: unexpected thunk");

                      case "Arg1": {
                        instantiations = instantiate( // t ~ (b => )
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            paramAst.iteration,
                            [Partial]),
                          Fun([argAst.body.lambdas[0]], Partial),
                          (refAst, fromAst, toAst) => {
                            if (refAst[TAG] === fromAst[TAG]
                              && refAst.name === fromAst.name) {
                                return Forall(
                                  new Set(),
                                  TOP_LEVEL_SCOPE,
                                  Fun([
                                    toAst.body.lambdas[0]],
                                    mapAst(refAst_ => {
                                      if (refAst_[TAG] === "MetaTV" || refAst_[TAG] === "RigidTV")
                                        return (refAst_[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                                          refAst_.name,
                                          refAst_.scope,
                                          "codomain",
                                          refAst_.iteration,
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[0])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          iteration,
                          tvid,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);

                        break;
                      }

                      case "Args": {
                        instantiations = instantiate( // t ~ (b, c =>)
                          (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                            paramAst.name,
                            paramAst.scope,
                            paramAst.position,
                            paramAst.iteration,
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
                                  TOP_LEVEL_SCOPE,
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
                                          refAst_.iteration,
                                          refAst_.body);
                                      
                                      else return refAst_;
                                    }) (refAst.body[refAst.body.length - 1])));
                            }

                            else return refAst;
                          },
                          lamIndex,
                          argIndex,
                          iteration,
                          tvid,
                          instantiations,
                          paramAnno,
                          argAnno,
                          funAnno,
                          argAnnos);

                        instantiations = argAst.body.lambdas[0]
                          .slice(arityDiff)
                          .reduce((acc, ast, i) =>
                            unifyTypes(
                              paramAst.body[i],
                              ast,
                              lamIndex,
                              argIndex,
                              iteration,
                              tvid,
                              instantiations,
                              paramAnno,
                              argAnno,
                              funAnno,
                              argAnnos), instantiations);

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
                      iteration,
                      tvid,
                      instantiations,
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
                      iteration,
                      tvid,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos);
                  }
                }

                case "Native": { // t<a> | t<a, b> ~ Set<c, d>
                  instantiations = instantiate( // t ~ Set | Set<c>
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      paramAst.iteration,
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
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                    unifyTypes(
                      paramAst.body[i],
                      field,
                      lamIndex,
                      argIndex,
                      iteration,
                      tvid,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), instantiations);
                }

                case "Obj": { // t<a> | t<a, b> ~ {foo: b, bar: c}
                  instantiations = instantiate( // t ~ {foo:, bar:} | {foo: b, bar:}
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      paramAst.iteration,
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
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                    unifyTypes(
                      paramAst.body[i],
                      field.v,
                      lamIndex,
                      argIndex,
                      iteration,
                      tvid,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), instantiations);
                }

                case "Tup": { // t<a> | t<a, b> ~ [c, d] | [c, d, e]
                  instantiations = instantiate( // t ~ [,] | [c,]
                    (paramAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                      paramAst.name,
                      paramAst.scope,
                      paramAst.position,
                      paramAst.iteration,
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
                    iteration,
                    tvid,
                    instantiations,
                    paramAnno,
                    argAnno,
                    funAnno,
                    argAnnos);

                  return argAst.body.slice(argArity - paramAst.body.length).reduce((acc, field, i) =>
                    unifyTypes(
                      paramAst.body[i],
                      field,
                      lamIndex,
                      argIndex,
                      iteration,
                      tvid,
                      instantiations,
                      paramAnno,
                      argAnno,
                      funAnno,
                      argAnnos), instantiations);
                }

                default:
                  throw new TypeError(
                    "internal error: unknown value constructor at unifyTypes");
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
            "internal error: unexpected bound type variable");

        case "Forall": // Map<a, b> ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) // Map<a, b> ~ c
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

          else if (argAst.body.length <= paramAst.body.length) { // Map<a, b> ~ u<c> | u<c, d>
            instantiations = instantiate( // Map | Map<a> ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.iteration,
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
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
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
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
          }
        }

        case "Partial": // Map<a, b> ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

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
            "internal error: unexpected bound type variable");

        case "Forall": // [1a] ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": { // [1a] ~ b
          if (argAst.body.length === 0) // [1a] ~ b
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

          else if (argAst.body.length === 1) { // [1a] ~ u<b>
            instantiations = instantiate( // [1] ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.iteration,
                [Partial]),
              Nea(Partial),
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? Nea(refAst.body[0])
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

            return unifyTypes(
              paramAst.body,
              argAst.body[0],
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
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
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
        
        case "Partial": // [1a] ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

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
            "internal error: unexpected bound type variable");

        case "Forall": // {foo: a, bar: b} ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) // {foo: a, bar: b} ~ c
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

          else if (argAst.body.length <= paramAst.body.length) { // {foo: a, bar: b} ~ u<c> | u<c, d>
            instantiations = instantiate( // {foo:, bar:} | {foo: a, bar:} ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.iteration,
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
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i].v,
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
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

            instantiations = paramAst.body.reduce((acc, {k, v}, i) => {
              return unifyTypes(
                v,
                argMap.get(k),
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos)
            }, instantiations);

            return instantiate(
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
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);
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
                  iteration,
                  tvid,
                  instantiations,
                  paramAnno,
                  argAnno,
                  funAnno,
                  argAnnos)
            }, instantiations);
          }
        }
        
        case "Partial": // {foo: a, bar: b} ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "This": { // {foo: a, bar: b} ~ this*
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
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
        case "Partial": return instantiations; // __ ~ __

        case "Tconst": // __ ~ U
          return instantiate(
            paramAst,
            argAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

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
            "internal error: unexpected bound type variable");

        case "Forall": // T ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) // T ~ b
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

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

        case "Partial": // T ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "Tconst": { // T ~ U
          if (paramAst.name === argAst.name)
            return instantiations;

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
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);
        }

        case "This": // this* ~ this*
          return instantiations;

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
            "internal error: unexpected bound type variable");

        case "Forall": // [a, b] ~ forall
          return unifyTypes(
            paramAst,
            argAst.body,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

        case "MetaTV":
        case "RigidTV": {
          if (argAst.body.length === 0) // [a, b] ~ c
            return instantiate(
              argAst,
              paramAst,
              (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
                && refAst.name === fromAst.name
                  ? toAst
                  : refAst,
              lamIndex,
              argIndex,
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

          else if (argAst.body.length <= paramAst.body.length) { // [a, b] ~ u<c> | u<c, d>
            instantiations = instantiate( // [,] | [a,] ~ u
              (argAst[TAG] === "MetaTV" ? MetaTV : RigidTV) (
                argAst.name,
                argAst.scope,
                argAst.position,
                argAst.iteration,
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
              iteration,
              tvid,
              instantiations,
              paramAnno,
              argAnno,
              funAnno,
              argAnnos);

            return paramAst.body.slice(paramAst.body.length - argAst.body.length).reduce((acc, field, i) =>
              unifyTypes(
                field,
                argAst.body[i],
                lamIndex,
                argIndex,
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
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

        case "Partial": // [a, b] ~ __
          return instantiate(
            argAst,
            paramAst,
            (refAst, fromAst, toAst) => refAst[TAG] === fromAst[TAG]
              && refAst.name === fromAst.name
                ? toAst
                : refAst,
            lamIndex,
            argIndex,
            iteration,
            tvid,
            instantiations,
            paramAnno,
            argAnno,
            funAnno,
            argAnnos);

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
                iteration,
                tvid,
                instantiations,
                paramAnno,
                argAnno,
                funAnno,
                argAnnos), instantiations);
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
      "internal error: unknown type");
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


const instantiate = (key, value, substitutor, lamIndex, argIndex, iteration, tvid, instantiations, paramAnno, argAnno, funAnno, argAnnos) => {

  // skip instantiation checks for row variables

  if (key[TAG] === "RowVar")
    return instantiations.set(serializeAst(key), {key, value, substitutor});

  /* Rigid TVs which are nested on the LHS of a function type must only be
  instantiated with themselves or with meta TVs of the same scope. The latter
  holds if the meta TV is introduced at the same time or later during the
  unificiation process.*/

  if (key[TAG] === "RigidTV" && key.scope.split(".").length > 2) { // RTV ~ ?
    if (value[TAG] === "MetaTV" && key.iteration > value.iteration) // RTV ~ MTV
      throw new TypeError(cat(
        `cannot instantiate rigid "${key.name}" with "${value.name}"\n`,
        `"${key.name}" would escape its scope\n`,
        "while unifying\n",
        `${paramAnno}\n`,
        `${argAnno}\n`,
        extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

    else if (value[TAG] === "RigidTV" && key.name !== value.name) // RTV ~ RTV
      throw new TypeError(cat(
        `cannot instantiate rigid "${key.name}" with rigid "${value.name}"\n`,
        `"${key.name}" can only be instantiated with itself or a meta type variable in scope\n`,
        "while unifying\n",
        `${paramAnno}\n`,
        `${argAnno}\n`,
        extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

    else if (value[TAG] !== "MetaTV" && value[TAG] !== "RigidTV") // RTV ~ composite type
      throw new TypeError(cat(
        `cannot instantiate rigid "${key.name}" with "${serializeAst(value)}"\n`,
        `"${key.name}" can only be instantiated with itself or a meta type variable in scope\n`,
        "while unifying\n",
        `${paramAnno}\n`,
        `${argAnno}\n`,
        extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
  }

  else { // MTV ~ ?
    if (value[TAG] === "RigidTV"
      && value.scope.split(".").length > 2
      && key.iteration < value.iteration) // MTV ~ RTV
        throw new TypeError(cat(
          `cannot instantiate "${key.name}" with rigid "${value.name}"\n`,
          `"${value.name}" would escape its scope\n`,
          "while unifying\n",
          `${paramAnno}\n`,
          `${argAnno}\n`,
          extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));

    reduceAst((acc, value_) => { // MTV ~ composite type including possible RTVs
      if (value_[TAG] === "RigidTV"
        && value_.scope.split(".").length > 2
        && key.iteration < value_.iteration)
          throw new TypeError(cat(
            `cannot instantiate "${key.name}" with rigid "${value_.name}"\n`,
            `contained in "${serializeAst(value)}"\n`,
            `"${value_.name}" would escape its scope\n`,
            "while unifying\n",
            `${paramAnno}\n`,
            `${argAnno}\n`,
            extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
    }, null) (value);
  }

  /* If the meta TV is already instantiated with a composite type, both
  instantiations must unify. */

  if (instantiations.has(key.name)) {
    try {
      return unifyTypes(
        instantiations.get(key.name).value,
        value,
        lamIndex,
        argIndex,
        iteration,
        tvid,
        instantiations,
        paramAnno,
        argAnno,
        funAnno,
        argAnnos);
    }

    catch(_) {
      throw new TypeError(cat(
        "cannot instantiate\n",
        `"${key.name}" with "${serializeAst(value)}"\n`,
        "because the former is already instantiated with\n",
        `"${serializeAst(instantiations.get(key.name).value)}"\n`,
        "while unifying\n",
        `${paramAnno}\n`,
        `${argAnno}\n`,
        extendErrMsg(lamIndex, argIndex, funAnno, argAnnos, instantiations)));
    }
  }

  return instantiations.set(serializeAst(key), {key, value, substitutor});
};


/******************************************************************************
*******************************************************************************
*******************************[ SUBSTITUTION ]********************************
*******************************************************************************
******************************************************************************/


// substitute type variables with their instantiated, specific types

const substitute = (ast, instantiations) => {
  let anno = serializeAst(ast), anno_;

  /* Iteratively performs substitution until the result type doesn't deviate
  from the original annotation anymore. */

  do {
    let codomainRefs = [];
    anno_ = anno;

    instantiations.forEach(({key, value, substitutor}) => {
      ast = mapAst(ast_ => {
        ast_ = substitutor(ast_, key, value);

        /* Function substitutes in codomain position should be transparent to
        the caller and thus must be dealt with within the loop. */

        if (ast_[TAG] === "Codomain") {

          /* After the function type is reduced in the course of the application
          the result can be a bare Codomain type, which must be reconverted to
          its original function type. */

          ast_ = Fun(
            ast_.body.slice(0, -1),
            ast_.body[ast_.body.length - 1]);

          return ast_;
        }

        else if (ast_[TAG] === "Fun") {

          /* Collect reference of Codomain types within the AST in order to
          transform them afterwards. Since this alters the shape of the AST,
          the transformation must take place after the tree is traversed. */

          if (ast_.body.result[TAG] === "Codomain")
            codomainRefs.push(ast_);

          return ast_;
        }

        else return ast_;
      }) (ast);

      /* Merges substitution functions in codomain position with its surrounding
      function. */

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
rigid ones by giving them a new unique name without altering their scopes (alpha
renaming). This effectively removes the affected quantifier. Specialization is
only possible with the outermost quantifier. In order to do it with nested
quantifiers subsumption is necessary. Whether bound TVs become meta or rigid
depends on the side of the equation they are located in during subsumption. */

const specialize = Cons => (scope, iteration, tvid) => {
  const alphaRenamings = new Map(),
    uniqNames = new Set();
  
  let charCode = 97; // ASCII a

  const mapAst_ = mapAst(ast => {
    if (ast[TAG] === "Forall") {

      // replace quantifier with mere grouping

      if (ast.scope === scope)
        return Forall(new Set(), ast.scope, ast.body);

      // leave higher-rank quantifier untouched

      else return ast;
    }

    else if (ast[TAG] === "BoundTV") {

      // current scope is a parent of the reference scope

      if (isParentScope(ast.scope, scope)) {

        // truncate current lam/arg index
        
        const scope_ = ast.scope.replace(/[^.]+$/, "");

        let name;
        
        // original name is already alpha-renamed

        if (alphaRenamings.has(`${scope_}/${ast.name}`))
          name = alphaRenamings.get(`${scope_}/${ast.name}`);

        else {

          // remove trailing digits
          
          name = ast.name.replace(/\d+$/, "");

          // name collision

          if (uniqNames.has(name + tvid)) {

            // determine next unused letter

            do {
              if (charCode > 122)
                throw new TypeError(
                  "internal error: type variable name upper bound exceeded");

              else name = String.fromCharCode(charCode++);
            } while (uniqNames.has(name + tvid));

            name += tvid;
            alphaRenamings.set(`${scope_}/${ast.name}`, name);
            uniqNames.add(name);
          }

          // no name collision

          else {
            name += tvid;
            alphaRenamings.set(`${scope_}/${ast.name}`, name);
            uniqNames.add(name);
          }
        }

        return Cons(
          name, ast.scope, ast.position, iteration, ast.body);
      }

      // current scope is not connected with the reference scope

      else return ast;
    }

    // neither `Scope` nor `BoundTV`

    else return ast;
  });

  return ast => ({ast: mapAst_(ast), tvid: tvid === "" ? 0 : tvid});
};


const specializeLHS = specialize(MetaTV);


const specializeRHS = specialize(RigidTV);


// reverse the specialization process

const regeneralize = ast => {
  const alphaRenamings = new Map(),
    uniqNames = new Set();

  let charCode = 97;

  ast = mapAst(ast_ => {
    switch (ast_[TAG]) {
      case  "MetaTV":
      case "RigidTV": {

        // original name is already restored

        if (alphaRenamings.has(ast_.name))
          return BoundTV(
            alphaRenamings.get(ast_.name), ast_.scope, ast_.position, ast_.body);

        // remove trailing digits

        let name = ast_.name.replace(/\d+$/, "");

        // name collision

        if (uniqNames.has(name)) {

          // find next unused letter

          do {
            if (charCode > 122)
              throw new TypeError(
                "internal error: type variable name upper bound exceeded");

            name = String.fromCharCode(charCode++);
          } while (uniqNames.has(name));
        }

        alphaRenamings.set(ast_.name, name);
        uniqNames.add(name);

        return BoundTV(
          name, ast_.scope, ast_.position, ast_.body);
      }

      default: return ast_;
    }
  }) (ast);

  if (uniqNames.size > 0)
    return Forall(
      uniqNames,
      TOP_LEVEL_SCOPE,
      ast[TAG] === "Forall" ? ast.body : ast);

  else return ast;
};


/******************************************************************************
*******************************************************************************
************************[ PERSISTENT DATA STRUCTURES ]*************************
*******************************************************************************
******************************************************************************/


/* scriptum comprises a balanced tree implementation based on a left-leaning
red/black tree, which is itself untyped to gain flexibility for some use cases.
It is strongly encouraged to fully type the persistent data structures based
upon it, so that type saftey is not hampered. */


/***[ Constants ]*************************************************************/


const RED = true;
const BLACK = false;


/***[ Constructors ]**********************************************************/


const Leaf = {[Symbol.toStringTag]: "Leaf"};


const Node = (c, h, l, k, v, r) =>
  ({[Symbol.toStringTag]: "Node", c, h, l, k, v, r});


const singleton = (k, v) =>
  Node(BLACK, 1, Leaf, k, v, Leaf);


/***[ Auxiliary Functions ]***************************************************/


const balanceL = (c, h, l, k, v, r) => {
  if (c === BLACK
    && l[TAG] === "Node"
    && l.c ===RED
    && l.l[TAG] === "Node"
    && l.l.c === RED)
      return Node(
        RED, h + 1, turnB(l.l), l.k, l.v, Node(BLACK, h, l.r, k, v, r));

  else return Node(c, h, l, k, v, r);
};


const balanceR = (c, h, l, k, v, r) => {
  if (c === BLACK
    && l[TAG] === "Node"
    && r[TAG] === "Node"
    && l.c === RED
    && r.c === RED)
      return Node(
        RED, h + 1, turnB(l), k, v, turnB(r));

  else if (r[TAG] === "Node"
    && r.c === RED)
      return Node(
        c, h, Node(RED, r.h, l, k, v, r.l), r.k, r.v, r.r);

  else return Node(c, h, l, k, v, r);
};


const isBLB = t =>
  t[TAG] === "Node"
    && t.c === BLACK
    && (t.l[TAG] === "Leaf" || t.l.c === BLACK)
      ? true : false;


const isBLR = t =>
  t[TAG] === "Node"
    && t.c === BLACK
    && t.l[TAG] === "Node"
    && t.l.c === RED
      ? true : false;


const rotateR = t => {
  if (t[TAG] === "Node"
    && t.l[TAG] === "Node"
    && t.l.c === RED)
      return balanceR(
        t.c, t.h, t.l.l, t.l.k, t.l.v, delMax_(Node(RED, t.h, t.l.r, t.k, t.v, t.r)));

  else throw new TypeError("unexpected branch");
};


const turnR = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new TypeError("leaves cannot turn color");

  else return Node(
    RED, h, l, k, v, r);
};


const turnB = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new TypeError("leaves cannot turn color");

  else return Node(
    BLACK, h, l, k, v, r);
};


const turnB_ = t => {
  switch (t[TAG]) {
    case "Leaf": return Leaf;
    case "Node": return Node(BLACK, t.h, t.l, t.k, t.v, t.r);
    default: throw new TypeError("invalid value constructor");
  }
}


/***[ Deletion ]**************************************************************/


const del = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return Leaf;
    
    case "Node": {
      const t_ = del_(turnR(t), k, cmp);

      switch (t_[TAG]) {
        case "Leaf": return Leaf;
        case "Node": return turnB(t_);
        default: throw new TypeError("invalid value constructor");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


const del_ = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return Leaf;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return delLT(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        case EQ: return delEQ(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        case GT: return delGT(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


const delLT = (k, c, h, l, k_, v_, r, cmp) => {
  if (c === RED
    && isBLB(l)
    && isBLR(r))
      return Node(
        RED,
        h,
        Node(BLACK, r.h, del_(turnR(l), k, cmp), k_, v_, r.l.l),
        r.l.k,
        r.l.v,
        Node(BLACK, r.h, r.l.r, r.k, r.v, r.r));

  else if (c === RED
    && isBLB(l))
      return balanceR(
        BLACK, h - 1, del_(tunrR(l), k, cmp), k_, v_, turnR(r));

  else return Node(c, h, del_(l, k, cmp), k_, v_, r);
};


const delEQ = (k, c, h, l, k_, v_, r, cmp) => {
  if (c === RED
    && l[TAG] === "Leaf"
    && r[TAG] === "Leaf")
      return Leaf;

  else if (l[TAG] === "Node"
    && l.c === RED)
      return balanceR(
        c, h, l.l, l.k, l.v, del_(Node(RED, h, l.r, k_, v_, r), k, cmp));

  else if (c === RED
    && isBLB(r)
    && isBLR(l))
      return balanceR(
        RED,
        h,
        turnB(l.l),
        l.k,
        l.v,
        balanceR(BLACK, l.h, l.r, ...min(r), delMin_(turnR(r))));

  else if (c === RED
    && isBLB(r))
      return balanceR(BLACK, h - 1, turnR(l), ...min(r), delMin_(turnR(r)));

  else if (c === RED
    && r[TAG] === "Node"
    && r.c === BLACK)
      return Node(
        RED, h, l, ...min(r), Node(BLACK, r.h, delMin_(r.l), r.k, r.v, r.r));

  else throw new TypeError("unexpected branch");
};


const delGT = (k, c, h, l, k_, v_, r, cmp) => {
  if (l[TAG] === "Node"
    && l.c === RED)
      return balanceR(
        c, h, l.l, l.k, l.v, del_(Node(RED, h, l.r, k_, v_, r)), k, cmp);

  else if (c === RED
    && isBLB(r)
    && isBLR(l))
      return Node(
        RED,
        h,
        turnB(l.l),
        l.k,
        l.v,
        balanceR(BLACK, l.h, l.r, k_, v_, del_(turnR(r), k, cmp)));

  else if (c === RED
    && isBLB(r))
      return balanceR(
        BLACK, h - 1, turnR(l), k_, v_, del_(turnR(r), k, cmp));

  else if (c === RED)
    return Node(RED, h, l, k_, v_, del_(r, k, cmp));

  else throw new TypeError("unexpected branch");
};


/***[ Getter ]****************************************************************/


const get = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return null;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return get(t.l, k, cmp);
        case EQ: return t.v;
        case GT: return get(t.r, k, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


const has = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return false;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return has(t.l, k, cmp);
        case EQ: return true;
        case GT: return has(t.r, k, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


/***[ Setter ]****************************************************************/


const set = (t, k, v, cmp) =>
  turnB(set_(t, k, v, cmp));


const set_ = (t, k, v, cmp) => {
  switch (t[TAG]) {
    case "Leaf":
      return Node(RED, 1, Leaf, k, v, Leaf);

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return balanceL(
          t.c, t.h, set_(t.l, k, v, cmp), t.k, t.v, t.r);

        case EQ: return Node(t.c, t.h, t.l, k, v, t.r);

        case GT: return balanceR(
          t.c, t.h, t.l, t.k, t.v, set_(t.r, k, v, cmp));

        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


/***[ Minimum/Maximum ]*******************************************************/


const min = t => {
  if (t[TAG] === "Node"
    && t.l[TAG] === "Leaf")
      return [t.k, t.v];

  else if (t[TAG] === "Node")
    return min(t.l);

  else throw new TypeError("unexpected Leaf");
};


const delMin = t =>{
  switch (t[TAG]) {
    case "Leaf": return Leaf;

    case "Node": {
      const t_ = delMin_(turnR(t));

      switch (t_[TAG]) {
        case "Leaf": return Leaf;
        case "Node": return turnB(t_);
        default: throw new TypeError("invalid value constructor");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


const delMin_ = t => {
  if (t[TAG] === "Node"
    && t.c === RED
    && t.l[TAG] === "Leaf"
    && t.r[TAG] === "Leaf")
      return Leaf;

  else if (t[TAG] === "Node"
    && t.c === RED)
      return Node(RED, t.h, delMin_(t.l), t.k, t.v, t.r);

  else if (t[TAG] === "Node"
    && isBLB(t.l)
    && isBLR(t.r))
      return delMin__(t);

  else if (t[TAG] === "Node"
    && isBLB((t.l)))
      return balanceR(
        BLACK, t.h - 1, delMin_(turnR(t.l)), t.k, t.v, turnR(t.r));

  else if (t[TAG] === "Node"
    && t.l[TAG] === "Node"
    && t.l.c === BLACK)
      return Node(
        RED, t.h, Node(BLACK, t.l.h, delMin_(t.l.l), t.l.k, t.l.v, t.l.r), t.k, t.v, t.r);

  else throw new TypeError("unexpected branch");
};


const delMin__ = t => {
  if(t[TAG] === "Node"
    && t.c === RED
    && t.r[TAG] === "Node"
    && t.r.c === BLACK
    && t.r.l[TAG] === "Node"
    && t.r.l.c === RED)
      return Node(
        RED,
        t.h,
        Node(BLACK, t.r.h, delMin_(turnR(t.l)), t.k, t.v, t.r.l.l),
        t.r.l.k,
        t.r.l.v,
        Node( BLACK, t.r.h, t.r.l.r, t.r.k, t.r.v, t.r.r));

  else throw new TypeError("unexpected branch");
};


const max = t => {
  if (t[TAG] === "Node"
    && t.r[TAG] === "Leaf")
      return [t.k, t.v];

  else if (t[TAG] === "Node")
    return max(t.r);

  else throw new TypeError("unexpected Leaf");
};


const delMax = t => {
  switch (t[TAG]) {
    case "Leaf": return Leaf;

    case "Node": {
      const t_ = delMax_(turnR(t));

      switch (t_[TAG]) {
        case "Leaf": return Leaf;
        case "Node": return turnB(t_);
        default: TypeError("invalid value constructor");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


const delMax_ = t => {
  if (t[TAG] === "Node"
    && t.c === RED
    && t.l[TAG] === "Leaf"
    && t.r[TAG] === "Leaf")
      return Leaf;

  else if (t[TAG] === "Node"
    && t.c === RED
    && t.l[TAG] === "Node"
    && t.l.c === RED)
      return rotateR(t);

  else if (t[TAG] === "Node"
    && t.c === RED
    && isBLB(t.r)
    && isBLR(t.l))
      return delMax__(t);

  else if (t[TAG] === "Node"
    && t.c === RED
    && isBLB(t.r))
      return balanceR(
        BLACK, t.h - 1, turnR(t.l), t.k, t.v, delMax_(turnR(t.r)));

  else if (t[TAG] === "Node"
    && t.c === RED)
      return Node(RED, t.h, t.l, t.k, t.v, rotateR(t.r));

  else throw new TypeError("unexpected branch");
};


const delMax__ = t => {
  if (t[TAG] === "Node"
    && t.c === RED
    && t.l[TAG] === "Node"
    && t.l.c === BLACK
    && t.l.l[TAG] === "Node"
    && t.l.l.c === RED)
      return Node(
        RED, t.h, turnB(t.l.l), t.l.k, t.l.v, balanceR(BLACK, t.l.h, t.l.r, t.k, t.v, delMax_(turnR(t.r))));

  else throw new TypeError("unexpected branch");
};


/***[ Set Operations ]********************************************************/


const join = (t1, t2, k, v, cmp) => {
  if (t1[TAG] === "Leaf")
    return set(t2, k, v, cmp);

  else if (t2[TAG] === "Leaf")
    return set(t1, k, v, cmp);

  else {
    switch (cmp(t1.h, t2.h)) {
      case LT: return turnB(joinLT(t1, t2, k, v, t1.h, cmp));
      case EQ: return Node(BLACK, t1.h + 1, t1, k, v, t2);
      case GT: return turnB(joinGT(t1, t2, k, v, t2.h, cmp));
      default: throw new TypeError("invalid comparator");
    }
  }
};


const joinLT = (t1, t2, k, v, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return Node(RED, t2.h + 1, t1, k, v, t2);

  else if (t2[TAG] === "Node")
    return balanceL(t2.c, t2.h, joinLT(t1, t2.l, k, v, h1, cmp), t2.k, t2.v, t2.r);

  else throw new TypeError("unexpected leaf");
};


const joinGT = (t1, t2, k, v, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return Node(RED, t1.h + 1, t1, k, v, t2);

  else if (t1[TAG] === "Node")
    return balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, joinGT(t1.r, t2, k, v, h2, cmp));

  else throw new TypeError("unexpected leaf");
};


const merge = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return t2;

  else if (t2[TAG] === "Leaf")
    return t1;

  else {
    switch (cmp(t1.h, t2.h)) {
      case LT: return turnB(mergeLT(t1, t2, t1.h, cmp));
      case EQ: return turnB(mergeEQ(t1, t2, cmp));
      case GT: return turnB(mergeGT(t1, t2, t2.h, cmp));
      default: throw new TypeError("invalid comparator");
    }
  }
};


const mergeLT = (t1, t2, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return mergeEQ(t1, t2, cmp);

  else if (t2[TAG] === "Node")
    return balanceL(t2.c, t2.h, mergeLT(t1, t2.l, h1, cmp), t2.k, t2.v, t2.r);

  else throw new TypeError("unexpected leaf");
};


const mergeEQ = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf"
    && t2[TAG] === "Leaf")
      return Leaf;

  else if (t1[TAG] === "Node") {
    const t2_ = delMin(t2),
      [k, v] = min(t2);

    if (t1.h === t2_.h)
      return Node(RED, t1.h + 1, t1, k, v, t2_);

    else if (t1.l[TAG] === "Node"
      && t1.l.c === RED)
        return Node(
          RED, t1.h + 1, turnB(t1.l), t1.k, t1.v, Node(BLACK, t1.h, t1.r, k, v, t2_));

    else return Node(
      BLACK, t1.h, turnR(t1), k, v, t2_);
  }

  else throw new TypeError("unexpected branch");
};


const mergeGT = (t1, t2, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return mergeEQ(t1, t2, cmp);

  else if (t1[TAG] === "Node")
    return balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, mergeGT(t1.r, t2, h2, cmp));

  else throw new TypeError("unexpected leaf");
};


const split = (t, k, cmp) => {
  if (t[TAG] === "Leaf")
    return [Leaf, Leaf];

  else {
    switch (cmp(k, t.k)) {
      case LT: {
        const [lt, gt] = split(t.l, k, cmp);
        return [lt, join(gt, t.r, t.k, t.v, cmp)];
      }

      case EQ: return [turnB_(t.l), t.r];

      case GT: {
        const [lt, gt] = split(t.r, k, cmp);
        return [join(t.l, lt, t.k, t.v, cmp), gt];
      }

      default: throw new TypeError("invalid comparator");
    }
  }
};


const union = (t1, t2, cmp) => {
  if (t2[TAG] === "Leaf")
    return t1;

  else if (t1[TAG] === "Leaf")
    return turnB_(t2);

  else {
    const [l, r] = split(t1, t2.k, cmp);
    return join(union(l, t2.l, cmp), union(r, t2.r, cmp), t2.k, t2.v, cmp);
  }
};


const intersect = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return Leaf;

  else if (t2[TAG] === "Leaf")
    return Leaf;

  else {
    const [l, r] = split(t1, t2.k, cmp);

    if (has(t1, t2.k, cmp))
      return join(
        intersect(l, t2.l, cmp), intersect(r, t2.r, cmp), t2.k, t2.v, cmp);

    else return merge(
      intersect(l, t2.l, cmp), intersect(r, t2.r, cmp), cmp);
  }
};


const diff = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return Leaf;

  else if (t2[TAG] === "Leaf")
    return t1;

  else {
    const [l, r] = split(t1, t2.k, cmp);
    return merge(diff(l, t2.l, cmp), diff(r, t2.r, cmp));
  }
};


/******************************************************************************
*******************************************************************************
***************************[ SAFE IN-PLACE UPDATES ]***************************
*******************************************************************************
******************************************************************************/


/* `Mutable` is an imperative data type that allows in-place updates by encap-
sulating the mutable data inside its data structure. Such mutations can be con-
sidered safe, because `Mutable` prevents you from sharing the effect. The type
enables first class in-place upades but is not composable. */


export const Mutable = fun(
  clone => ref => {
    const anno = CHECK ? introspectDeep(ref) : "";

    return _let({}, ref).in(fun((o, ref) => {
      let mutated = false;

      o.consume = thunk(() => {
        if (mutated) {
          delete o.update;

          o.update = _ => {
            throw new TypeError(
              "illegal in-place update of consumed data structure");
          };
        }

        return ref;
      }, `() => ${anno}`);

      o.update = fun(k => {
        if (!mutated) {
          ref = clone(ref); // copy once on first write
          mutated = true;
        }

        k(ref); // use the effect but discard the result
        return o;
      }, `(${anno} => ${anno}) => Mutable {consume: ${anno}, update: ((${anno} => ${anno}) => this*)}`);

      return (o[TAG] = "Mutable", o);
    }, `{}, ${anno} => Mutable {consume: ${anno}, update: ((${anno} => ${anno}) => this*)}`));
  },
  "(t<a> => t<a>) => t<a> => Mutable {consume: t<a>, update: ((t<a> => t<a>) => this*)}");


/******************************************************************************
*******************************************************************************
******************************[ LAZY EVALUATION ]******************************
*******************************************************************************
******************************************************************************/


/* Thunks are arbitrary unevaluated expressions that are evaluated when needed.
As opposed to Javascript thunks like `() => expr` scriptum uses implicit thunks,
i.e. you don't have to care whether they are evaluated or not. Thunks enable
proper lazy evaluation in Javascript. Thunks are untyped but you are strongly
encouraged to only use typed lambdas inside. */


/***[ Constants ]*************************************************************/


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/***[ API ]*******************************************************************/


// strictly evaluate a thunk non-recursively

export const strict = x =>
  x && x[THUNK] ? x[EVAL] : x;


// creates an annotated thunk

export const thunk = (thunk, anno) => {
  if (CHECK) {
    if (anno)
      return new Proxy(thunk, new ThunkProxy(anno));

    else throw new TypeError(
      "missing type annotation");
  }

  else return new Proxy(thunk, new ThunkProxy());
  };


/***[ Implementation ]********************************************************/


class ThunkProxy {
  constructor(anno) {
    this.memo = NULL

    if (CHECK) {

      // thunks are opaque types

      if (anno.search(/\(\) => /) === 0)
        this[ANNO] = anno.replace(/\(\) => /, "");

      else throw new TypeError(cat(
        "thunk expected\n",
        `but "${anno}" received`));
    }
  }

  apply(g, that, args) {

    // evaluate thunk only once

    if (this.memo === NULL)
      this.memo = g();

    return this.memo(...args);
  }

  get(g, k) {

    // prevent evaluation
    
    if (k === THUNK)
      return true;

    // prevent evaluation

    else if (k === ANNO)
      return this[ANNO];

    // prevent evaluation

    else if (k === Symbol.toStringTag)
      return "Function";

    // evaluate thunk but only once

    else if (this.memo === NULL)
      this.memo = g();

    // return the once evaluated result

    if (k === EVAL)
      return this.memo;

    // enforce array spreading
    
    else if (k === Symbol.isConcatSpreadable
      && Array.isArray(this.memo))
        return true;

    // forward valueOf

    else if (k === "valueOf")
      return () => this.memo.valueOf();

    // forward toString

    else if (k === "toString")
      return () => this.memo.toString();

    // method binding

    if (typeof this.memo[k] === "function")
      return this.memo[k].bind(this.memo);

    else return this.memo[k];
  }

  getOwnPropertyDescriptor(g, k) {

    // evaluate thunk only once

    if (this.memo === NULL)
      this.memo = g();

    return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  has(g, k) {

    // prevent evaluation

    if (k === THUNK)
      return true;

    // prevent evaluation

    else if (CHECK && k === ANNO)
      return true;

    // evaluate thunk but only once

    else if (this.memo === NULL)
      this.memo = g();

    if(this.memo
      && (typeof this.memo === "object" || typeof this.memo === "function")
      && k in this.memo)
        return true;

    else return false;
  }

  ownKeys(g) {

    // prevent evaluation

    if (this.memo === NULL)
      this.memo = g();

    return Object.keys(this.memo);
  }
}


/******************************************************************************
*******************************************************************************
****************************[ STACK SAFETY (SYNC) ]****************************
*******************************************************************************
******************************************************************************/


/* Trampolines themselves are untyped to provide additional flexibility in some
use cases without hampering type safety. They ensure that the provided function
argument is typed, though. */

/* Please note that using direct recursion is not the recommanded approach. For
every appropriate type there is an associated fold, which should be used
instead. Folds are an abstraction, whereas recursion is a primitive. */


/******************************************************************************
*****************************[ STRICT RECURSION ]******************************
******************************************************************************/


/* `strictRec` enforec the evaluation of huge nested implicit thunks in a stack-
safe manner. */

export const strictRec = x => {
  while (x && x[THUNK])
    x = x[EVAL];

  return x;
};


/******************************************************************************
*****************************[ MONADIC RECURSION ]*****************************
******************************************************************************/


/* Monad recursion enables stack-safe monadic recursive functions. The downside
is that you can only compose this stack safety with other effects if the
trampoline monad is the outermost one in the transformer. */

export const MonadRec = {}; // namespace


MonadRec.loop = o => { // trampoline
  while (o.tag === "Iterate")
    o = o.f(o.x);

  return o.tag === "Return"
    ? o.x
    : _throw(new TypeError("invalid trampoline tag"));
};


/***[ Applicative ]***********************************************************/


MonadRec.ap = tf => tx =>
  MonadRec.chain(tf) (f =>
    MonadRec.chain(tx) (x =>
      MonadRec.of(f(x))));


// MonadRec.of @Derived


/***[ Functor ]***************************************************************/


MonadRec.map = f => tx =>
  MonadRec.chain(tx) (x => MonadRed.of(f(x)));


/***[ Monad ]*****************************************************************/


MonadRec.chain = mx => fm =>
  mx.tag === "Iterate" ? Iterate(mx.x) (y => MonadRec.chain(mx.f(y)) (fm))
    : mx.tag === "Return" ? fm(mx.x)
    : _throw(new TypeError("invalid trampoline tag"));


/***[ Tags ]******************************************************************/


MonadRec.iterate = x => f => {
  if (CHECK && !(ANNO in f))
    throw new TypeError(cat(
      "typed lambda expected\n",
      `but "${f.toString()}" received\n`));

  else {tag: "Iterate", f, x};
}


MonadRec.return = x =>
  ({tag: "Return", x});


/***[ Derived ]***************************************************************/


MonadRec.of = MonadRec.return;


/******************************************************************************
******************************[ TAIL RECURSION ]*******************************
******************************************************************************/


/* ES6 ships with tail call optimization but no major browser vendor has
implemented them yet and probably never will. Therefore we need a trampoline
to eliminate the tail call. */

export const TailRec = {}; // namespace


TailRec.loop = f => {
  if (CHECK && !(ANNO in f))
    throw new TypeError(cat(
      "typed lambda expected\n",
      `but "${f.toString()}" received\n`));

  else return x => {
    let o = f(x);

    while (o.tag === "Iterate")
      o = f(o.x);

    return o.tag === "Return"
      ? o.x
      : _throw(new TypeError("invalid trampoline tag"));
  };
};


/***[ Tags ]******************************************************************/


TailRec.iterate = x => ({tag: "Iterate", x});


TailRec.return = x => ({tag: "Return", x});


/******************************************************************************
*******************************************************************************
***************************[ STACK SAFETY (ASYNC) ]****************************
*******************************************************************************
******************************************************************************/


// see @LIB/Serial


// see @LIB/Parallel


/******************************************************************************
*******************************************************************************
************************************[ LIB ]************************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
**************************[ CROSS-CUTTING CONCERNS ]***************************
******************************************************************************/


export const lazyProp = (o, prop, f) =>
  Object.defineProperty(
    o,
    prop, {
      get: f,
      configurable: true,
      enumerable: true
    });


/******************************************************************************
*******************************[ TYPE CLASSES ]********************************
******************************************************************************/


/* Only type classes with a single type parameter are supported. Superclass
dependencies are listed in alphabetical order. Type class properties must be
unique across classes, due to subclass/superclass relations. */


/***[ Bounded ]***************************************************************/


export const Bounded = typeClass(`({
  bottom: a,·
  top: a
}) => Bounded<a>`);


/***[ Category ]**************************************************************/


export const Category = typeClass(`(^a, b, c. {
  comp: (t<b, c> => t<a, b> => t<a, c>),·
  id: t<a, a>
}) => Category<t>`);


/***[ Clonable ]**************************************************************/


export const Clonable = typeClass(`(^a. {
  clone: (t<a> => t<a>)
}) => Clonable<t>`);


/***[ Contravaraint ]*********************************************************/


export const Contravaraint = typeClass(`(^a, b. {
  cmap: ((b => a) => f<a> => f<b>)
}) => Contravaraint<f>`);


/***[ Enum ]******************************************************************/


let Enum = Option => typeClass(`({
  succ: (a => Option<a>),·
  pred: (a => Option<a>),·
  succeeds: (a => a => Boolean),·
  fromEnum: (a => Option<Number>),·
  toEnum: (Number => Option<a>)
}) => Enum<a>`);


/***[ Foldable ]**************************************************************/


let Foldable = Monoid => typeClass(`(^m, a, b. {
  foldl: ((b => a => b) => b => t<a> => b),·
  foldr: ((a => b => b) => b => t<a> => b)
}) => Foldable<t>`);


/***[ Functor ]***************************************************************/


export const Functor = typeClass(`(^a, b. {
  map: ((a => b) => f<a> => f<b>)
}) => Functor<f>`);


/***[ Functor :: Apply ]******************************************************/


export const Apply = typeClass(`Functor<f> => (^a, b. {
  apply: (f<(a => b)> => f<a> => f<b>)
}) => Apply<f>`);


/***[ Functor :: Apply :: Applicative ]***************************************/


export const Applicative = typeClass(`Apply<f> => (^a. {
  of: (a => f<a>)
}) => Applicative<f>`);


/***[ Functor :: Apply :: Chain ]*********************************************/


export const Chain = typeClass(`Apply<m> => (^a, b. {
  chain: (m<a> => (a => m<b>) => m<b>)
}) => Chain<m>`);


/***[ Chain :: Monad ]********************************************************/


export const Monad = typeClass(
  `Applicative<m>, Chain<m> => ({}) => Monad<m>`);


/***[ Chain :: Monad :: MonadPlus ]*******************************************/


let MonadPlus = Alternative => typeClass(
  `Alternative<m>, Monad<m> => ({}) => MonadPlus<m>`);


/***[ Functor :: Alt ]********************************************************/


export const Alt = typeClass(`Functor<f> => (^a. {
  alt: (f<a> => f<a> => f<a>)
}) => Alt<f>`);


/***[ Functor :: Alt :: Plus ]************************************************/


export const Plus = typeClass(`Alt<f> => (^a. {
  zero: f<a>
}) => Plus<f>`);


/***[ Functor :: Alt :: Plus :: Alternative ]*********************************/


export const Alternative = typeClass(
  `Applicative<a>, Plus<a> => ({}) => Alternative<a>`);


/***[ Functor :: Extend ]*****************************************************/


export const Extend = typeClass(`Functor<w> => (^a, b. {
  extend: ((w<a> => b) => w<a> => w<b>)
}) => Extend<w>`);


/***[ Functor :: Extend :: Comonad ]******************************************/


export const Comonad = typeClass(`Extend<w> => (^a. {
  extract: (w<a> => a)
}) => Comonad<w>`);


/***[ Functor :: Filterable ]*************************************************/


let Filterable = (Option, Either) => typeClass(`Functor<f> => (^a, b, l, r. {
  filter: ((a => Booelan) => f<a> => f<a>),·
  filterMap: ((a => Option<b>) => f<a> => f<b>),·
  partition: ((a => Boolean) => f<a> => {false: f<a>, true: f<a>}),·
  partitionMap: ((a => Either<l, r>) => f<a> => {left: f<l>, right: f<r>})
}) => Filterable<f>`);


/***[ Semigroup ]*************************************************************/


export const Semigroup = typeClass(`({
  append: (a => a => a)
}) => Semigroup<a>`);


/***[ Semigroup :: Monoid ]***************************************************/


export const Monoid = typeClass(`Semigroup<a> => ({
  empty: a
}) => Monoid<a>`);


/***[ Setoid ]****************************************************************/


export const Setoid = typeClass(`({
  eq: (a => a => Boolean),·
  neq: (a => a => Boolean)
}) => Setoid<a>`);


/***[ Setoid :: Order ]*******************************************************/


export const Order = typeClass(`Setoid<a> => ({
  compare: (a => a => Comparator),·
  lt: (a => a => Boolean),·
  lte: (a => a => Boolean),·
  gt: (a => a => Boolean),·
  gte: (a => a => Boolean),·
  min: (a => a => a),·
  max: (a => a => a)
}) => Order<a>`);


/***[ Traversable ]***********************************************************/


let Traversable = Foldable => typeClass(`Foldable<t>, Functor<t>, Applicative<f> => (^a, b, f. {
  mapA: ((a => f<b>) => t<a> => f<t<b>>),·
  seqA: (t<f<a>> => f<t<a>>)
}) => Traversable<t>`);


/***[ Dependent ]*************************************************************/


Foldable = Foldable(Monoid);
export {Foldable};


MonadPlus = MonadPlus(Alternative);
export {MonadPlus};


Traversable = Traversable(Foldable);
export {Traversable};


/******************************************************************************
***********************[ AD-HOC POLYMORPHIC FUNCTIONS ]************************
******************************************************************************/


export const appEff1 = fun(
  Apply => tx => ty =>
    Apply.apply(Apply.map(_const) (tx)) (ty),
  "Apply<f> => f<a> => f<b> => f<a>");


export const appEff2 = fun(
  Apply => tx => ty =>
    Apply.apply(mapEff(Apply.Functor) (id) (tx)) (ty),
  "Apply<f> => f<a> => f<b> => f<b>");


// based on an eager left-associative fold

export const foldMap = fun(
  ({foldl}, {append, empty}) => f => foldl(comp2nd(append) (f)) (empty),
  "Foldable<t>, Monoid<m> => (a => m) => t<a> => m");


// based on a lazy right-associative fold

export const foldMap_ = fun(
  ({foldr}, {append, empty}) => f => foldr(comp(append) (f)) (empty),
  "Foldable<t>, Monoid<m> => (a => m) => t<a> => m");


export const mapEff = fun(
  Functor => x => Functor.map(fun(_ => x, "a => b")),
  "Functor<f> => a => f<b> => f<a>");


/******************************************************************************
*********************************[ FUNCTION ]**********************************
******************************************************************************/


export const F = {}; // namespace


/***[ Applicator ]************************************************************/


export const app = fun(
  f => x => f(x),
  "(a => b) => a => b");


export const app_ = fun(
  x => f => f(x),
  "a => (a => b) => b");


// partially apply right argument

export const appr = fun(
  (f, y) => x => f(x) (y),
  "(a => b => c), b => a => c");


export const flip = fun(
  f => y => x => f(x) (y),
  "(a => b => c) => b => a => c");


export const infix = fun(
  (x, f, y) => f(x) (y),
  "a, (a => b => c), b => c");


export const infix2 = fun(
  (x, f, y, g, z) => g(f(x) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d => e");


export const infix2_ = fun(
  (x, f, y, g, z) => g(x) (f(y) (z)),
  "a, (a => b => c), b, (c => d => e), d => e");


export const infix3 = fun(
  (w, f, x, g, y, h, z) => h(g(f(w) (x)) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f => g");


export const infix3_ = fun(
  (w, f, x, g, y, h, z) => h(w) (g(x) (f(y) (z))),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f => g");


export const infix4 = fun(
  (v, f, w, g, x, h, y, i, z) => i(h(g(f(v) (w)) (x)) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h => i");


export const infix4_ = fun(
  (v, f, w, g, x, h, y, i, z) => i(v) (h(w) (g(x) (f(y) (z)))),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h => i");


export const infix5 = fun(
  (u, f, v, g, w, h, x, i, y, j, z) => j(i(h(g(f(u) (v)) (w)) (x)) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j => k");


export const infix5_ = fun(
  (u, f, v, g, w, h, x, i, y, j, z) => j(u) (i(v) (h(w) (g(x) (f(y) (z))))),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j => k");


export const infix6 = fun(
  (t, f, u, g, v, h, w, i, x, j, y, k, z) => k(j(i(h(g(f(t) (u)) (v)) (w)) (x)) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l => m");


export const infix6_ = fun(
  (t, f, u, g, v, h, w, i, x, j, y, k, z) => k(t) (j(u) (i(v) (h(w) (g(x) (f(y) (z)))))),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l => m");


export const infix7 = fun(
  (s, f, t, g, u, h, v, i, w, j, x, k, y, l, z) => l(k(j(i(h(g(f(s) (t)) (u)) (v)) (w)) (x)) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n => o");


export const infix7_ = fun(
  (s, f, t, g, u, h, v, i, w, j, x, k, y, l, z) => l(s) (k(t) (j(u) (i(v) (h(w) (g(x) (f(y) (z))))))),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n => o");


export const infix8 = fun(
  (r, f, s, g, t, h, u, i, v, j, w, k, x, l, y, m, z) => m(l(k(j(i(h(g(f(r) (s)) (t)) (u)) (v)) (w)) (x)) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p => q");


export const infix8_ = fun(
  (r, f, s, g, t, h, u, i, v, j, w, k, x, l, y, m, z) => m(r) (l(s) (k(t) (j(u) (i(v) (h(w) (g(x) (f(y) (z)))))))),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p => q");


export const infix9 = fun(
  (q, f, r, g, s, h, t, i, u, j, v, k, w, l, x, m, y, n, z) => n(m(l(k(j(i(h(g(f(q) (r)) (s)) (t)) (u)) (v)) (w)) (x)) (y)) (z),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p, (q => r => s), r => s");


export const infix9_ = fun(
  (q, f, r, g, s, h, t, i, u, j, v, k, w, l, x, m, y, n, z) => n(q) (m(r) (l(s) (k(t) (j(u) (i(v) (h(w) (g(x) (f(y) (z))))))))),
  "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p, (q => r => s), r => s");


// mimic overloaded infix operations (left associative)

export const infixn = (...args) => {
  switch (args.length) {
    case 5: return fun(
      args[3] (args[1] (args[0]) (args[2])) (args[4]),
      "a, (a => b => c), b, (c => d => e), d => e");

    case 7: return fun(
      args[5] (args[3] (args[1] (args[0]) (args[2])) (args[4])) (args[6]),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f => g");

    case 9: return fun(
      args[7] (args[5] (args[3] (args[1] (args[0]) (args[2])) (args[4])) (args[6])) (args[8]),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h => i");

    case 11: return fun(
      args[9] (args[7] (args[5] (args[3] (args[1] (args[0]) (args[2])) (args[4])) (args[6])) (args[8])) (args[10]),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j => k");

    case 13: return fun(
      args[11] (args[9] (args[7] (args[5] (args[3] (args[1] (args[0]) (args[2])) (args[4])) (args[6])) (args[8])) (args[10])) (args[12]),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l => m");

    case 15: return fun(
      args[13] (args[11] (args[9] (args[7] (args[5] (args[3] (args[1] (args[0]) (args[2])) (args[4])) (args[6])) (args[8])) (args[10])) (args[12])) (args[14]),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n => o");

    case 17: return fun(
      args[15] (args[13] (args[11] (args[9] (args[7] (args[5] (args[3] (args[1] (args[0]) (args[2])) (args[4])) (args[6])) (args[8])) (args[10])) (args[12])) (args[14])) (args[16]),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p => q");

    case 19: return fun(
      args[17] (args[15] (args[13] (args[11] (args[9] (args[7] (args[5] (args[3] (args[1] (args[0]) (args[2])) (args[4])) (args[6])) (args[8])) (args[10])) (args[12])) (args[14])) (args[16])) (args[18]),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p, (q => r => s), r => s");
  }
};


// mimic overloaded infix operations (right associative)

export const infixn_ = (...args) => {
  switch (args.length) {
    case 5: return fun(
      args[3] (args[0]) (args[1] (args[2]) (args[4])),
      "a, (a => b => c), b, (c => d => e), d => e");

    case 7: return fun(
      args[5] (args[0]) (args[3] (args[2]) (args[1] (args[4]) (args[6]))),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f => g");

    case 9: return fun(
      args[7] (args[0]) (args[5] (args[2]) (args[3] (args[4]) (args[1] (args[6]) (args[8])))),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h => i");

    case 11: return fun(
      args[9] (args[0]) (args[7] (args[2]) (args[5] (args[4]) (args[3] (args[6]) (args[1] (args[8]) (args[10]))))),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j => k");

    case 13: return fun(
      args[11] (args[0]) (args[9] (args[2]) (args[7] (args[4]) (args[5] (args[6]) (args[3] (args[8]) (args[1] (args[10]) (args[12])))))),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l => m");

    case 15: return fun(
      args[13] (args[0]) (args[11] (args[2]) (args[9] (args[4]) (args[7] (args[6]) (args[5] (args[8]) (args[3] (args[10]) (args[1] (args[12]) (args[14]))))))),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n => o");

    case 17: return fun(
      args[15] (args[0]) (args[13] (args[2]) (args[11] (args[4]) (args[9] (args[6]) (args[7] (args[8]) (args[5] (args[10]) (args[3] (args[12]) (args[1] (args[14]) (args[16])))))))),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p => q");

    case 19: return fun(
      args[17] (args[0]) (args[15] (args[2]) (args[13] (args[4]) (args[11] (args[6]) (args[9] (args[8]) (args[7] (args[10]) (args[5] (args[12]) (args[3] (args[14]) (args[1] (args[16]) (args[18]))))))))),
      "a, (a => b => c), b, (c => d => e), d, (e => f => g), f, (g => h => i), h, (i => j => k), j, (k => l => m), l, (m => n => o), n, (o => p => q), p, (q => r => s), r => s");
  }
};


/***[ Anonymous Recursion ]***************************************************/


export const fix = fun(
  f => x => f(fix(f)) (x),
  "((a => b) => a => b) => a => b");


export const fix_ = fun(
  f => f(thunk(() => fix_(f), "() => a => a")),
  "(a => a) => a");


/***[ Category ]**************************************************************/


export const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");


export const comp3 = fun(
  f => g => h => x => f(g(h(x))),
  "(c => d) => (b => c) => (a => b) => a => d");


export const comp4 = fun(
  f => g => h => i => x => f(g(h(i(x)))),
  "(d => e) => (c => d) => (b => c) => (a => b) => a => e");


export const comp5 = fun(
  f => g => h => i => j => x => f(g(h(i(j(x))))),
  "(e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => f");


export const comp6 = fun(
  f => g => h => i => j => k => x => f(g(h(i(j(k(x)))))),
  "(f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => g");


export const comp7 = fun(
  f => g => h => i => j => k => l => x => f(g(h(i(j(k(l(x))))))),
  "(g => h) => (f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => h");


export const comp8 = fun(
  f => g => h => i => j => k => l => m => x => f(g(h(i(j(k(l(m(x)))))))),
  "(h => i) => (g => h) => (f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => i");


export const comp9 = fun(
  f => g => h => i => j => k => l => m => n => x => f(g(h(i(j(k(l(m(n(x))))))))),
  "(i => j) => (h => i) => (g => h) => (f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => j");


// mimic overloaded composition function

export const compn = (...fs) => x => {
  switch (fs.length) {
    case 2: return fun(
      fs[0] (fs[1] (x)),
      "(b => c) => (a => b) => a => c");

    case 3: return fun(
      fs[0] (fs[1] (fs[2] (x))),
      "(c => d) => (b => c) => (a => b) => a => d");

    case 4: return fun(
      fs[0] (fs[1] (fs[2] (fs[3] (x)))),
      "(d => e) => (c => d) => (b => c) => (a => b) => a => e");

    case 5: return fun(
      fs[0] (fs[1] (fs[2] (fs[3] (fs[4] (x))))),
      "(e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => f");

    case 6: return fun(
      fs[0] (fs[1] (fs[2] (fs[3] (fs[4] (fs[5] (x)))))),
      "(f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => g");

    case 7: return fun(
      fs[0] (fs[1] (fs[2] (fs[3] (fs[4] (fs[5] (fs[6] (x))))))),
      "(g => h) => (f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => h");

    case 8: return fun(
      fs[0] (fs[1] (fs[2] (fs[3] (fs[4] (fs[5] (fs[6] (fs[7] (x)))))))),
      "(h => i) => (g => h) => (f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => i");

    case 9: return fun(
      fs[0] (fs[1] (fs[2] (fs[3] (fs[4] (fs[5] (fs[6] (fs[7] (fs[8] (x))))))))),
      "(i => j) => (h => i) => (g => h) => (f => g) => (e => f) => (d => e) => (c => d) => (b => c) => (a => b) => a => j");
  }
};


export const id = fun(x => x, "a => a");


/***[ Composition ]***********************************************************/


// compose in the second argument

export const comp2nd = fun(
  f => g => x => y => f(x) (g(y)),
  "(a => b => c) => (d => b) => a => d => c");


// compose a binary function

export const compBin = fun(
  f => g => x => y => f(g(x) (y)),
  "(a => b) => (c => d => a) => c => d => b");


// transform two inputs and combine the results

export const compOn = fun(
  f => g => x => y => f(g(x)) (g(y)),
  "(b => b => c) => (a => b) => a => a => c");


/***[ Conditional Operator ]**************************************************/


/* While Javascript's conditional operator is a first class expression it is
not lazy. `cond` defers evaluation, because it is a curried function and
furthermore is lazy in its first argument, i.e. we can pass an expensive
computation and only have to evaluate it if all arguments are provided. */

export const cond = fun(
  x => y => thunk => strict(thunk) ? x : y,
  "a => a => b => a");


/***[ Constant ]**************************************************************/


export const _const = fun(
  x => _ => x,
  "a => discard => a");


/***[ Currying ]**************************************************************/


export const curry = fun(
  f => x => y => f(x, y),
  "(a, b => c) => a => b => c");


export const curry3 = fun(
  f => x => y => z => f(x, y, z),
  "(a, b, c => d) => a => b => c => d");


export const curry4 = fun(
  f => w => x => y => z => f(w, x, y, z),
  "(a, b, c, d => e) => a => b => c => d => e");


export const curry5 = fun(
  f => v => w => x => y => z => f(v, w, x, y, z),
  "(a, b, c, d, e => f) => a => b => c => d => e => f");


export const curry6 = fun(
  f => u => v => w => x => y => z => f(u, v, w, x, y, z),
  "(a, b, c, d, e, f => g) => a => b => c => d => e => f => g");


export const uncurry = fun(
  f => (x, y) => f(x) (y),
  "(a => b => c) => a, b => c");


export const uncurry3 = fun(
  f => (x, y, z) => f(x) (y) (z),
  "(a => b => c => d) => a, b, c => d");


export const uncurry4 = fun(
  f => (w, x, y, z) => f(w) (x) (y) (z),
  "(a => b => c => d => e) => a, b, c, d => e");


export const uncurry5 = fun(
  f => (v, w, x, y, z) => f(v) (w) (x) (y) (z),
  "(a => b => c => d => e => f) => a, b, c, d, e => f");


export const uncurry6 = fun(
  f => (u, v, w, x, y, z) => f(u) (v) (w) (x) (y) (z),
  "(a => b => c => d => e => f => g) => a, b, c, d, e, f => g");


/***[ Debugging ]*************************************************************/


export const debug = f => (...args) => {
  debugger;
  return f(...args);
};


export const debugIf = p => f => (...args) => {
  if (p(...args)) debugger;
  return f(...args);
};


export const log = (...args) =>
  (console.log(...args), args[0]);


export const taggedLog = tag => (...args) =>
  (console.log(tag, ...args), args[0]);


export const trace = x =>
  (x => console.log(JSON.stringify(x) || x.toString()), x);


/***[ Equality ]**************************************************************/


export const eq = fun(
  x => y => x === y,
  "a => a => Boolean");


export const neq = fun(
  x => y => x !== y,
  "a => a => Boolean");


/***[ Impure ]****************************************************************/


export const eff = fun(
  f => x => (f(x), x),
  "(a => discard) => a => a");


export const _throw = e => {
  throw e;
};


export const throwOn = fun(
  p => e => msg => x => {
    if (p(x))
      throw new e(msg);
    
    else return x;
  },
  "(a => Boolean) => Function => String => a => discard");


/***[ Local Bindings ]********************************************************/


/* `_let` needs to be untyped, because it relies on an heterogenuous array
holding the arguments. It ensures that the passed function argument is typed,
though. */

export const _let = (...args) => {
  return {in: f => {
    if (CHECK && !(ANNO in f))
      throw new TypeError(cat(
        "typed lambda expected\n",
        `but "${f.toString()}" received\n`));

    else return f(...args);
  }};
};


/***[ Logical Operators ]*****************************************************/


export const and = fun(
  x => y => !!(x && y),
  "a => a => Boolean");


export const andf = fun(
  f => x => y => !!(f(x) && f(y)),
  "(a => b) => a => a => Boolean");


export const imply = fun(
  x => y => !!(!x || y),
  "a => a => Boolean");


export const not = fun(
  x => !x,
  "a => Boolean");


export const notf = fun(
  f => x => !f(x),
  "(a => b) => a => Boolean");


export const or = fun(
  x => y => !!(x || y),
  "a => a => Boolean");


export const orf = fun(
  f => x => y => !!(f(x) || f(y)),
  "(a => b) => a => a => Boolean");


export const xor = fun(
  x => y => !!(!x ^ !y),
  "a => a => Boolean");


/***[ Monoid ]****************************************************************/


lazyProp(F, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = fun(
    Monoid_ => Monoid(F.Semigroup(Monoid_.Semigroup)) ({
      empty: F.empty(Monoid_)
    }),
    "Monoid<b> => Monoid<(a => b)>");
});


F.empty = fun(
  ({empty}) => _ => empty,
  "Monoid<b> => a => b");


/***[ Partial Application ]***************************************************/


export const partial = (f, ...args) => (..._args) => {
  if (CHECK && !(ANNO in f))
    throw new TypeError(cat(
      "typed lambda expected\n",
      `but "${f.toString()}" received\n`));

  else return f(...args, ..._args);
};


/***[ Relational Operators ]**************************************************/


export const gt = fun(
  x => y => x > y,
  "a => a => Boolean");


export const gte = fun(
  x => y => x >= y,
  "a => a => Boolean");


export const lt = fun(
  x => y => x < y,
  "a => a => Boolean");



export const lte = fun(
  x => y => x <= y,
  "a => a => Boolean");


/***[ Semigroup ]*************************************************************/


lazyProp(F, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = fun(
    Semigroup_ => Semigroup() ({
      append: F.append(Semigroup_)
    }),
    "Semigroup<b> => Semigroup<(a => b)>");
});


F.append = fun(
  ({append}) => f => g => x => append(f(x)) (g(x)),
  "Semigroup<b> => (a => b) => (a => b) => a => b");


/***[ Short Circuiting ]******************************************************/


export const and_ = fun(
  x => y => x && y,
  "a => a => a");


export const andf_ = fun(
  f => x => y => f(x) && f(y),
  "(a => b) => a => a => b");


export const or_ = fun(
  x => y => x || y,
  "a => a => a");


export const orf_ = fun(
  f => x => y => f(x) || f(y),
  "(a => b) => a => a => b");


/******************************************************************************
*****************************[ FUNCTION >> ENDO ]******************************
******************************************************************************/


export const Endo = type1("(a => a) => Endo<a>");


Endo.run = fun(
  tx => x => tx.run(x),
  "Endo<a> => a => a");


/***[ Monoid ]****************************************************************/


lazyProp(Endo, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid(Endo.Semigroup) ({
    empty: Endo.empty
  });
});


// Endo<a>

Endo.empty = Endo(id);


/***[ Semigroup ]*************************************************************/


lazyProp(Endo, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: Endo.append
  });
});


Endo.append = fun(
  f => g => Endo(fun(
    x => f.run(g.run(x)),
    "a => a")),
  "Endo<a> => Endo<a> => Endo<a>");


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/* Array is designed as a mutable data type and treated as such. Use immutable
`List` for an efficient `cons` operation. Use immutable `DList` for efficient
`append` and `snoc` operations. Use `Vector` for efficient lookups or set and
modify operations. */


export const A = {}; // namespace


/***[ Apply ]****************************************************************/


lazyProp(A, "Apply", function() {
  delete this.Apply;
  
  return this.Apply = Apply(A.Functor) ({
    apply: A.apply
  });
});


A.apply = fun(
  fs => xs =>
    A.foldl(fun(
      acc => f => A.append(acc) (A.map(f) (xs)),
      "[b] => (a => b) => [b]")) ([]) (fs),
  "[(a => b)] => [a] => [b]");


/***[ Applicative ]***********************************************************/


lazyProp(A, "Applicative", function() {
  delete this.Applicative;
  
  return this.Applicative = Applicative(A.Apply) ({
    of: A.of
  });
});


A.of = fun(x => [x], "a => [a]");


/***[ Chain ]*****************************************************************/


lazyProp(A, "Chain", function() {
  delete this.Chain;
  
  return this.Chain = Chain(A.Apply) ({
    chain: A.chain
  });
});


A.chain = fun(
  xs => fm => xs.flatMap(x => fm(x)),
  "[a] => (a => [b]) => [b]");


/***[ Clonable ]**************************************************************/


A.clone = fun(
  xs => xs.concat(),
  "[a] => [a]");


/***[ Construction ]**********************************************************/


A.push = fun(
  x => xs => (xs.push(x), xs),
  "a => [a] => [a]");


/***[ Foldable ]**************************************************************/


/* The left associative fold for arrays is implemented as a loop to ensure
stack safety. */

A.foldl = fun(
  f => init => xs => {
    let acc = init;

    for (let i = 0; i < xs.length; i++)
      acc = f(acc) (xs[i]);

    return acc;
  },
  "(b => a => b) => b => [a] => b");


/* The left associative fold based on local continuations allows for short
circuiting of imperative array processing. */

lazyProp(A, "foldk", function() {
  delete this.foldk;
  
  return this.foldk = fun(
    f => init => xs => {
      let acc = init;

      for (let i = 0; i < xs.length; i++)
        acc = f(acc) (xs[i]).run(id);

      return acc;
    },
    "(b => a => Cont<b, b>) => b => [a] => b");
});


/* The right associative fold for arrays is implemented as a loop and thus has
eager semantics, because arrays are an imperative data type, which is
incompatible with laziness. */

A.foldr = fun(
  f => init => xs => {
    let acc = init;

    for (let i = xs.length - 1; i >= 0; i--)
      acc = f(xs[i]) (acc);

    return acc;
  },
  "(a => b => b) => b => [a] => b");


/***[ Functor ]***************************************************************/


lazyProp(A, "Functor", function() {
  delete this.Functor;
  
  return this.Functor = Functor() ({
    map: A.map
  });
});


A.map = fun(
  f => xs => xs.map(x => f(x)),
  "(a => b) => [a] => [b]");


/***[ Looping ]***************************************************************/


A.forEach = fun(
  f => xs => (xs.forEach((x, i) => xs[i] = f(x)), xs),
  "(a => b) => [a] => [b]");


/***[ Monad ]*****************************************************************/


lazyProp(A, "Monad", function() {
  delete this.Monad;
  return this.Monad = Monad(A.Applicative, A.Chain) ({});
});


/***[ Monoid ]****************************************************************/


lazyProp(A, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid(A.Semigroup) ({
    empty: A.empty
  });
});


// [a]

A.empty = [];


/***[ Semigroup ]*************************************************************/


lazyProp(A, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: A.append
  });
});


A.append = fun(
  xs => ys => (xs.push.apply(xs, ys), xs),
  "[a] => [a] => [a]");


/* There is an additional `prepend` operation on the `Array` type, because the
latter is mutable and thus this operation is frequently needed along with the
`Mutable` type. */

A.prepend = fun(
  ys => xs => (xs.push.apply(xs, ys), xs),
  "[a] => [a] => [a]");


/******************************************************************************
**********************************[ BOOLEAN ]**********************************
******************************************************************************/


export const Bool = {}; // namespace


/***[ Bounded ]***************************************************************/


lazyProp(Bool, "Bounded", function() {
  delete this.Bounded;
  
  return this.Bounded = Bounded() ({
    min: Bool.minBound,
    max: Bool.maxBound
  });
});


Bool.minBound = false;


Bool.maxBound = true;


/***[ Equality ]**************************************************************/


Bool.eq = fun(
  x => y => x === y,
  "Boolean => Boolean => Boolean");


Bool.neq = fun(
  x => y => x !== y,
  "Boolean => Boolean => Boolean");


/***[ Logical Operators ]*****************************************************/


Bool.and = fun(
  x => y => x && y,
  "Boolean => Boolean => Boolean");


Bool.imply = fun(
  x => y => !x || y,
  "Boolean => Boolean => Boolean");


Bool.not = fun(
  x => !x,
  "Boolean => Boolean");


Bool.or = fun(
  x => y => x || y,
  "Boolean => Boolean => Boolean");


Bool.xor = fun(
  x => y => x !== y,
  "Boolean => Boolean => Boolean");


/***[ Relational Operators ]**************************************************/


Bool.gt = fun(
  x => y => x > y,
  "Boolean => Boolean => Boolean");


Bool.gte = fun(
  x => y => x >= y,
  "Boolean => Boolean => Boolean");


Bool.lt = fun(
  x => y => x < y,
  "Boolean => Boolean => Boolean");



Bool.lte = fun(
  x => y => x <= y,
  "Boolean => Boolean => Boolean");


/******************************************************************************
******************************[ BOOLEAN :: ALL ]*******************************
******************************************************************************/


// constructor + namespace

export const All = type1("Boolean => All");


/***[ Monoid ]****************************************************************/


lazyProp(All, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid() ({
    empty: All.empty
  });
});


All.empty = true;


/***[ Semigroup ]*************************************************************/


lazyProp(All, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: All.append
  });
});


All.append = fun(
  tx => ty => All(tx.run && ty.run),
  "All => All => All");


/******************************************************************************
******************************[ BOOLEAN :: ANY ]*******************************
******************************************************************************/


// constructor + namespace

export const Any = type1("Boolean => Any");


/***[ Monoid ]****************************************************************/


lazyProp(Any, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid() ({
    empty: Any.empty
  });
});


Any.empty = false;


/***[ Semigroup ]*************************************************************/


lazyProp(Any, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: Any.append
  });
});


Any.append = fun(
  tx => ty => Any(tx.run || ty.run),
  "Any => Any => Any");


/******************************************************************************
********************************[ COMPARATOR ]*********************************
******************************************************************************/


/* `Comparator` is compatible with Javascript's sorting protocoll. */


// type constructor + namespace

export const Comparator = type(
  "(^r. {lt: r, eq: r, gt: r} => r) => Comparator");


// value constructors

Comparator.LT = Object.assign(Comparator(({lt}) => lt), {valueOf: () => -1});


Comparator.EQ = Object.assign(Comparator(({eq}) => eq), {valueOf: () => 0});


Comparator.GT = Object.assign(Comparator(({gt}) => gt), {valueOf: () => 1});


/***[ Monoid ]****************************************************************/


lazyProp(Comparator, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid(Comparator.Semigroup) ({
    empty: Comparator.empty
  });
});


// Comparator

Comparator.empty = Comparator.EQ;


/***[ Semigroup ]*************************************************************/


lazyProp(Comparator, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: Comparator.append
  });
});


Comparator.append = fun(
  tx => ty =>
    tx.run({
      lt: tx,
      eq: ty,
      gt: tx
    }),
  "Comparator => Comparator => Comparator");


/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


/* `Cont` is the pure version of `Serial`, i.e. there is no micro task deferring.
It facilitates continuation passing style and can be used with both synchronous
and asynchronous computations. Please be aware that `Cont` is not stack-safe for
large nested function call trees. */

export const Cont = type1("((a => r) => r) => Cont<r, a>");


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


export const Either = type(
  "(^r. {left: (a => r), right: (b => r)} => r) => Either<a, b>");


Either.Left = fun(
  x => Either(left => right => left(x)),
  "a => Either<a, b>");


Either.Right = fun(
  x => Either(left => right => right(x)),
  "b => Either<a, b>");


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


export const List = type(
  "(^r. {nil: r, cons: (a => List<a> => r)} => r) => List<a>");


List.Cons = fun(
  x => xs => List(({cons}) => cons(x) (xs)),
  "a => List<a> => List<a>");


List.Nil = List(({nil}) => nil);


/***[ Foldable ]**************************************************************/


lazyProp(List, "Foldable", function() {
  delete this.Foldable;
  
  return this.Foldable = Foldable() ({
    foldl: List.foldl,
    foldr: List.foldr
  });
});


List.foldl = fun(
  f => function go(acc) {
    return xs => xs.run({
      nil: acc,
      cons: fun(
        x => ys => go(f(acc) (x)) (ys),
        "a => List<a> => b")
    });
  },
  "(b => a => b) => b => List<a> => b");


List.foldMap = fun(
  Monoid => foldMap(List.Foldable, Monoid),
  "Monoid<m> => (a => m) => List<a> => m");


List.foldMap_ = fun(
  Monoid => foldMap_(List.Foldable, Monoid),
  "Monoid<m> => (a => m) => List<a> => m");


List.foldr = fun(
  f => acc => function go(xs) {
    return xs.run({
      nil: acc,
      cons: fun(
        x => ys => f(x) (thunk(() => go(ys), "() => b")),
        "a => List<a> => b")
    });
  },
  "(a => b => b) => b => List<a> => b");


/***[ Monoid ]****************************************************************/


lazyProp(List, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid(List.Semigroup) ({
    empty: List.empty
  });
});


List.empty = List.Nil;


/***[ Semigroup ]*************************************************************/


lazyProp(List, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: List.append
  });
});


List.append = fun(
  xs => ys => function go(acc) {
    return acc.run({
      nil: ys,
      cons: fun(
        x => zs => List.Cons(x)
          (thunk(() => go(zs), "() => List<a>")),
        "a => List<a> => List<a>")
    });
  } (xs),
  "List<a> => List<a> => List<a>");


/******************************************************************************
*******************************[ LIST :: DLIST ]*******************************
******************************************************************************/


// like a regular list but with efficient concat/snoc operations

export const DList = type1(
  "(List<a> => List<a>) => DList<a>");


DList.run = fun(
  f => f.run,
  "DList<a> => List<a> => List<a>");


/***[ Construction ]**********************************************************/


// a => DList<a> => DList<a>

DList.cons = x => xs =>
  DList(comp(List.Cons(x)) (DList.run(xs)));


// a => DList<a> => DList<a>

DList.snoc = x => xs =>
  DList(comp(DList.run(xs)) (List.Cons(x)));


// a => DList<a>

DList.singleton = comp(DList) (List.Cons);


/***[ Conversion ]************************************************************/


// List<a> => DList<a>

DList.fromList = comp(DList) (List.append);


// DList<a> => List<a>

DList.toList = comp(app_(List.Nil)) (DList.run);


/***[ Monoid ]****************************************************************/


lazyProp(DList, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid(DList.Semigroup) ({
    empty: DList.empty
  });
});


DList.empty = DList(id);


/***[ Semigroup ]*************************************************************/


lazyProp(DList, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: DList.append
  });
});


DList.append = fun(
  xs => ys => DList(comp(xs.run) (ys.run)),
  "DList<a> => DList<a> => DList<a>");


/******************************************************************************
**********************************[ NUMBER ]***********************************
******************************************************************************/


export const Num = {}; // namespace


/***[ Arithmetic Operators ]**************************************************/


export const add = fun(
  x => y => x + y,
  "Number => Number => Number");


export const div = fun(
  x => y => x / y,
  "Number => Number => Number");


export const exp = fun(
  base => exp => base ** exp,
  "Number => Number => Number");


export const dec = fun(
  x => x - 1,
  "Number => Number");


export const inc = fun(
  x => x + 1,
  "Number => Number");


export const mod = fun(
  x => y => x % y,
  "Number => Number => Number");


export const mul = fun(
  x => y => x * y,
  "Number => Number => Number");


export const neg = fun(
  x => -x,
  "Number => Number");


export const sub = fun(
  x => y => x - y,
  "Number => Number => Number");


/***[ Bitwise Operators ]*****************************************************/


export const bitAnd = fun(
  x => y => x & y,
  "Number => Number => Number");


export const bitNot = fun(
  x => ~x,
  "Number => Number");


export const bitOr = fun(
  x => y => x | y,
  "Number => Number => Number");


export const bitXor = fun(
  x => y => x ^ y,
  "Number => Number => Number");


/******************************************************************************
******************************[ NUMBER :: PROD ]*******************************
******************************************************************************/


// constructor + namespace

export const Prod = type1("Number => Prod");


/***[ Monoid ]****************************************************************/


lazyProp(Prod, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid(Prod.Semigroup) ({
    empty: Prod.empty
  });
});


Prod.empty = Prod(1);


/***[ Semigroup ]*************************************************************/


lazyProp(Prod, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: Prod.append
  });
});


Prod.append = fun(
  tx => ty => Prod(tx.run * ty.run),
  "Prod => Prod => Prod");


/******************************************************************************
*******************************[ NUMBER :: SUM ]*******************************
******************************************************************************/


// constructor + namespace

export const Sum = type1("Number => Sum");


/***[ Monoid ]****************************************************************/


lazyProp(Sum, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = Monoid(Sum.Semigroup) ({
    empty: Sum.empty
  });
});


Sum.empty = Sum(0);


/***[ Semigroup ]*************************************************************/


lazyProp(Sum, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = Semigroup() ({
    append: Sum.append
  });
});


Sum.append = fun(
  tx => ty => Sum(tx.run + ty.run),
  "Sum => Sum => Sum");


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


/* Implicitly provides an empty object along with a reference on it to enable
local mutations on it. `this` itself is untyped but ensures that the passed
lambda is. */

export const thisify = f => {
  if (CHECK && !(ANNO in f))
    throw new TypeError(cat(
      "typed lambda expected\n",
      `but "${f.toString()}" received\n`));

  else return f({});
};


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


// type of expressions that may not yield a result

export const Option = type("(^r. {none: r, some: (a => r)} => r) => Option<a>");


Option.Some = fun(
  x => Option(({some}) => some(x)),
  "a => Option<a>");


// Option<a>

Option.None = Option(({none}) => none);


/***[ Monoid ]****************************************************************/


lazyProp(Option, "Monoid", function() {
  delete this.Monoid;
  
  return this.Monoid = fun(
    Semigroup => Monoid(Option.Semigroup(Semigroup)) ({
      empty: Option.empty
    }),
    "Semigroup<a> => Monoid<Option<a>>");
});


// Option<a>

Option.empty = Option.None;


/***[ Semigroup ]*************************************************************/


lazyProp(Option, "Semigroup", function() {
  delete this.Semigroup;
  
  return this.Semigroup = fun(
    Semigroup_ => Semigroup() ({
      append: Option.append(Semigroup_)
    }),
    "Semigroup<a> => Semigroup<Option<a>>");
});


Option.append = fun(
  ({append}) => tx => ty =>
    tx.run({
      none: ty,
      some: fun(
        x => ty.run({
          none: tx,
          some: fun(
            y => Option.Some(append(x) (y)),
            "a => Option<a>")
        }),
        "a => Option<a>")
    }),
    "Semigroup<a> => Option<a> => Option<a> => Option<a>");


/******************************************************************************
*********************************[ PARALLEL ]**********************************
******************************************************************************/


/* Like `Serial` but is executed in parallel. Please note that `Parallel`
doesn't implement monad, because they require order. */

export const Parallel = type1("((a => r) => r) => Parallel<r, a>");


/******************************************************************************
**********************************[ SERIAL ]***********************************
******************************************************************************/


/* `Serial` provides stack-safe asynchronous computations, which are executed
serially. It creates a lazy CPS composition that itself is either executed
synchronuously within the same micro task or asynchronously in a subsequent one.
The actual behavior depends on a PRNG and cannot be determined upfront. You can
pass both synchronous and asynchronous functions to the CPS composition. */

export const Serial = type1("((a => r) => r) => Serial<r, a>");


/******************************************************************************
**********************************[ VECTOR ]***********************************
******************************************************************************/


// internal constructor

const Vector_ = (data, length, offset) => ({
  [TAG]: "Vector",
  data,
  length,
  offset
})


// public constructor and namespace

export const Vector = Vector_(Leaf, 0, 0);


/***[ Accessors ]*************************************************************/


Vector.get = fun(
  i => v =>
    get(v.data, i + v.offset, Vector.compare),
  "Number => Vector<a> => a");


/***[ Construction ]**********************************************************/


// consing at the beginning of a `Vector`

Vector.cons = fun(
  x => v => {
    const offset = v.length === 0 ? 0 : v.offset - 1,
      data = set(v.data, offset, x, Vector.compare);

    return Vector_(data, v.length + 1, offset);
  },
  "a => Vector<a> => Vector<a>");


// consing at the end of a `Vector`

Vector.snoc = fun(
  x => v => {
    const data = set(v.data, v.length + v.offset, x, Vector.compare);
    return Vector_(data, v.length + 1, v.offset);
  },
  "a => Vector<a> => Vector<a>");


/***[ Order ]*****************************************************************/


Vector.compare = fun(
  (m, n) => m < n ? LT : m === n ? EQ : GT,
  "Number, Number => Number");


/***[ Searching ]*************************************************************/


Vector.elem = fun(
  i => v =>
    has(v.data, i + v.offset, Vector.compare),
  "Number => Vector<a> => Boolean");


/******************************************************************************
*********************************[ DEPENDENT ]*********************************
******************************************************************************/


Enum = Enum(Option);
export {Enum};


Filterable = Filterable(Option, Either);
export {Filterable};
