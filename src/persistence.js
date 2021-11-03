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
************************[ PERSISTENT DATA STRUCTURES ]*************************
*******************************************************************************
******************************************************************************/


/***[ Constants ]*************************************************************/


const RED = true;
const BLACK = false;


/***[ Constructors ]**********************************************************/


export const Leaf = {[Symbol.toStringTag]: "Leaf"};


const Node = (c, h, l, k, v, r) =>
  ({[Symbol.toStringTag]: "Node", c, h, l, k, v, r});


export const singleton = (k, v) =>
  Node(BLACK, 1, Leaf, k, v, Leaf);


/***[ Order (Default) ]*******************************************************/


export const cmp = (m, n) =>
  m < n ? LT : m === n ? EQ : GT;


/***[ Auxiliary Functions ]***************************************************/


const balanceL = (c, h, l, k, v, r) => {
  if (c === BLACK
    && l[TAG] === "Node"
    && l.c === RED
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


export const del = (t, k, cmp) => {
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


export const get = (t, k, cmp) => {
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


export const has = (t, k, cmp) => {
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


export const set = (t, k, v, cmp) =>
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


export const min = t => {
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


export const max = t => {
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


export const join = (t1, t2, k, v, cmp) => {
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


export const merge = (t1, t2, cmp) => {
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


export const split = (t, k, cmp) => {
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


export const union = (t1, t2, cmp) => {
  if (t2[TAG] === "Leaf")
    return t1;

  else if (t1[TAG] === "Leaf")
    return turnB_(t2);

  else {
    const [l, r] = split(t1, t2.k, cmp);
    return join(union(l, t2.l, cmp), union(r, t2.r, cmp), t2.k, t2.v, cmp);
  }
};


export const intersect = (t1, t2, cmp) => {
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


export const diff = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return Leaf;

  else if (t2[TAG] === "Leaf")
    return t1;

  else {
    const [l, r] = split(t1, t2.k, cmp);
    return merge(diff(l, t2.l, cmp), diff(r, t2.r, cmp));
  }
};
