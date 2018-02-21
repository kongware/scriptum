/******************************************************************************
*******************************************************************************
*******************************[ DEPENDENCIES ]********************************
*******************************************************************************
******************************************************************************/


// none


/******************************************************************************
*******************************************************************************
*********************************[ DEBUGGING ]*********************************
*******************************************************************************
******************************************************************************/


// augment a curried function sequence
// untyped
export const aug = (name, f, log = []) => {
  const aux = x => {
    const argT = typeCheck(ArgTypeError)
      (t => tErr => fromTo => `${name} received argument\n\n`
      + `${t}\n`
      + (fromTo.length === 0 ? "\n" : `${underline(fromTo)}\n\n`)
      + `arguments must not be or include elements of type ${tErr}\n`) (x);

    const r = f(x),
      name_ = r && r.name || name;

    const retT = typeCheck(ReturnTypeError)
      (t => tErr => fromTo => `${name_} returned`
      + `${t}\n`
      + (fromTo.length === 0 ? "\n" : `${underline(fromTo)}\n\n`)
      + `return values must not be or include elements of type ${tErr}\n`) (r);

    if (typeof r === "function") {
      const aux_ = aug(name_, r, log.concat(`${name}(${argT})`));
      Object.defineProperties(aux_, {name: {value: name_}});
      return aux_;
    }

    else return r;
  };

  const ts = {name: introspect(name), f: getTypeTag(f), log: introspect(log)};

  if (ts.name !== "String") throw new ArgTypeError(
    "aug expects\n\n"
    + "String, Function, [String]\n"
    + `${underline([0, 6])}\n\n`
    + `${ts.name} received\n`
  );

  else if (ts.f !== "Function") throw new ArgTypeError(
    "aug expects\n\n"
    + "String, Function, [String]\n"
    + `${underline([8, 16])}\n\n`
    + `${ts.f} received\n`
  );

  else if (ts.log !== "[String]" && ts.log !== "[]") throw new ArgTypeError(
    "aug expects\n\n"
    + "String, Function, [String]\n"
    + `${underline([16, 26])}\n\n`
    + `${ts.log} received\n`
  );

  Object.defineProperties(aux, {name: {value: name}, log: {value: log}});
  return aux;
};


// typeCheck
// untyped
const typeCheck = Cons => f => x => {
  const t = introspect(x),
    undef = t.search(/\bUndefined\b/),
    nan = t.search(/\bNaN\b/);

  if (undef !== -1) {
    throw new Cons(f(t) ("Undefined") ([undef, undef + 9]));
  }

  else if (nan !== -1) {
    throw new Cons(f(t) ("NaN") ([nan, nan + 3]));
  }

  else return t;
};


// getTypeTag
// a -> String
export const getTypeTag = x => {
  const tag = Object.prototype.toString.call(x);
  return tag.slice(tag.lastIndexOf(" ") + 1, -1);
};


// introspect
// a -> String
const introspect = x => {
  switch (typeof x) {
    case "boolean": return "Boolean";
    case "function": return `λ${x.name}`;

    case "number": {
      if (Number.isNaN(x)) return "NaN";
      else if (!Number.isFinite(x)) return "Infinity";
      else return "Number";
    }

    case "object": {
      const tag = getTypeTag(x);

      switch (tag) {
        case "Array": return introspectArr(x);
        case "Map": return introspectMap(x);
        case "Null": return tag;
        case "Set": return introspectSet(x);
        default: return introspectObj(x) (tag);
      }
    }

    case "string": return "String";
    case "symbol": return "Symbol";
    case "undefined": return "Undefined";
  }
};


// introspect Array
// Array -> String
const introspectArr = xs => {
  if (xs.length <= 8) {
    const [s, ts] = xs.reduce(([s, ts], x) => {
      x = introspect(x);
      return [s.add(x), ts.concat(x)];
    }, [new Set(), []]);

    if (s.size === 1) return `[${Array.from(s) [0]}]`;
    else return `[${ts.join(", ")}]`;
  }

  else {
    const s = xs.reduce((s, x) => {
      x = introspect(x);
      return s.add(x);
    }, new Set());

    if (s.size === 1) return `[${Array.from(s) [0]}]`;
    else return "[?]";
  }
};


// introspect Map
// Map -> String
const introspectMap = m => {
  const s = new Set();

  m.forEach((v, k) => {
    v = introspect(v);
    s.add(`${k}, ${v}`);
  });

  if (m.size === 1) return `Map<${Array.from(s) [0]}>`;
  else return `Map<?>`;
};


// introspect Object
// Object -> String
const introspectObj = o => tag => {
  if (tag === "Object") {
    const ks = Object.keys(o);

    if (keys.length <= 16) {
      const [s, ts] = ks.reduce(([s, ts], k) => {
        const v = introspect(o[k]);
        return [s.add(`${k}: ${v}`), ts.concat(`${k}: ${v}`)];
      }, [new Set(), []]);

      if (s.size === 1) return `{String: ${Array.from(s) [0].split(": ") [1]}}`;
      else return `{${ts.join(", ")}}`;
    }

    else {
      const s = ks.reduce((s, k) => {
        const v = introspect(o[k]);
        return s.add(`${k}: ${v}`);
      }, new Set());

      if (s.size === 1) return `{String: ${Array.from(s) [0].split(": ") [1]}}`;
      else return "{?}";
    }
  }

  else return tag;
};


// introspect Set
// Set -> String
const introspectSet = s => {
  const s_ = new Set();

  s.forEach(k => {
    k = introspect(k);
    s_.add(k);
  });

  if (s_.size === 1) return `Set<${Array.from(s_) [0]}>`;
  else return `Set<?>`;
};


// ArgTypeError
// String -> ArgTypeError
class ArgTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArgTypeError);
  }
};


// ReturnTypeError
// String -> ReturnTypeError
class ReturnTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ReturnTypeError);
  }
};


// underline
// [Number] -> String
const underline = ([n, m]) =>
  Array(n + 1).join(" ") + Array(m - n + 1).join("^");