/******************************************************************************
*******************************************************************************
*******************************[ DEPENDENCIES ]********************************
*******************************************************************************
******************************************************************************/


// none


/******************************************************************************
*******************************************************************************
*********************************[ TYPECLASS ]*********************************
*******************************************************************************
******************************************************************************/


const classes = new Map();


const instances = new Map();


export const tclass = (_class, ...ops) => {
  if (classes.has(_class)) throw new TypeClassError(
    `${_class} already exists\n`
    + "typeclasses must not be overriden\n"
  );

  else classes.set(_class, ops);
};


export const subInstance = (..._super) => (_class, tag) => dict => {
  instances.set(
    `${_class} ${tag}`,
    Object.assign(dict,
      _super.reduce((acc, s) => Object.assign(acc,
        instances.get(`${s} ${tag}`)
      ), {})
    )
  );

  return createAccessors(_class);
};


export const instance = subInstance();


const createAccessors = _class => {
  const o = tag => instances.get(`${_class} ${tag}`);

  if (classes.has(_class)) {
    return classes.get(_class).reduce((acc, op) => {
      if (op in acc) return acc;

      else {
        return Object.assign(acc,
          {[op]: tag => instances.get(`${_class} ${tag}`) [op]}
        )
      }
    }, o);
  }

  else  throw new TypeClassError(
    `${_class} doesn't exist\n`
    + "typeclasses must be defined in the global repository\n"
  );
};


// TypeClassError
// String -> ArgTypeError
class TypeClassError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, TypeClassError);
  }
};