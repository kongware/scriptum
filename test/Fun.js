const $ = require("../index");
const assert = require("assert");

describe("apply", function() {
  it("should return 3", function() {
    const inc = n => n + 1;

    assert.equal(
      $.apply(inc) (2),
      3
    );
  });
});

describe("co", function() {
  it("should return true", function() {
    assert.equal(
      $.co(true) (false),
      true
    );
  });
});

describe("co2", function() {
  it("should return false", function() {
    assert.equal(
      $.co2(true) (false),
      false
    );
  });
});

describe("comp2", function() {
  it("should return 6", function() {
    const add = m => n => m + n,
      inc = n => n + 1;

    assert.equal(
      $.comp2(inc) (add) (2) (3),
      6
    );
  });
});

describe("compBoth", function() {
  it("should return 6", function() {
    const add = m => n => m + n,
      inc = n => n + 1;

    assert.equal(
      $.compBoth(add) (inc) (inc) (2),
      6
    );
  });
});

describe("compn", function() {
  it("should return 5", function() {
    const inc = n => n + 1;

    assert.equal(
      $.compn(inc, inc, inc) (2),
      5
    );
  });
});

describe("cond", function() {
  it("should return foo", function() {
    const sub = m => n => m - n,
      inc = n => n + 1;

    assert.equal(
      $.cond("foo") ("bar") (2 === 2),
      "foo"
    );
  });
});


describe("contra", function() {
  it("should return true", function() {
    const eq = x => y => x === y,
      get = k => o => o[k],
      o = {foo: 2};

    assert.equal(
      $.contra(get("foo")) (eq(2)) (o),
      true
    );
  });
});


describe("cont", function() {
  it("should return 3", function() {
    const inc = n => n + 1;

    assert.equal(
      $.cont(2) (inc),
      3
    );
  });
});

describe("curry", function() {
  it("should return -1", function() {
    const sub = (m, n) => m - n;

    assert.equal(
      $.curry(sub) (2) (3),
      -1
    );
  });
});

describe("curry3", function() {
  it("should return 10", function() {
    const reduce = (f, acc, xs) => xs.reduce(f, acc),
      add = (m, n) => m + n;

    assert.equal(
      $.curry3(reduce) (add) (0) ([1,2,3,4]),
      10
    );
  });
});

describe("fix", function() {
  it("should return 256", function() {
    const pow = $.fix(
      rec => acc => (base, exp) => 
        exp === 0 
          ? acc
          : rec(base * acc) (base, exp - 1)) (1);

    assert.equal(
      pow(2, 8),
      256
    );
  });
});

describe("flip", function() {
  it("should return 1", function() {
    const sub = m => n => m - n;

    assert.equal(
      $.flip(sub) (2) (3),
      1
    );
  });
});

describe("id", function() {
  it("should return 2", function() {
    assert.equal(
      $.id(2),
      2
    );
  });
});

describe("infix", function() {
  it("should return 1", function() {
    const sub = m => n => m - n;

    assert.equal(
      $.infix(3, sub, 2),
      1
    );
  });
});

describe("join", function() {
  it("should return 4", function() {
    const add = m => n => m + n;

    assert.equal(
      $.join(add) (2),
      4
    );
  });
});

describe("omega", function() {
  it("should return 256", function() {
    const pow = $.omega(
      rec => acc => (base, exp) => 
        exp === 0 
          ? acc
          : rec(rec) (base * acc) (base, exp - 1)) (1);

    assert.equal(
      pow(2, 8),
      256
    );
  });
});

describe("on", function() {
  it("should return 4", function() {
    const infix = (x, f, y) => f(x) (y),
      add = m => n => m + n,
      get = k => o => o[k],
      o = {foo: 2};

    assert.equal(
      infix(add, $.on, get("foo")) (o) (o),
      4
    );
  });
});

describe("partial", function() {
  it("should return 11", function() {
    const reduce = (f, acc, xs) => xs.reduce(f, acc),
      comp = f => g => x => f(g(x)),
      add = (m, n) => m + n,
      inc = n => n + 1;

    assert.equal(
      comp(inc) ($.partial(reduce, add, 0)) ([1,2,3,4]),
      11
    );
  });
});

describe("pipe", function() {
  it("should return 5", function() {
    const inc = n => n + 1;

    assert.equal(
      $.pipe(inc, inc, inc) (2),
      5
    );
  });
});

describe("rotl", function() {
  it("should return bar", function() {
    const cond = b => x => y => b ? x : y;

    assert.equal(
      $.rotl(cond) ("foo") ("bar") (false),
      "bar"
    );
  });
});

describe("rotr", function() {
  it("should return bar", function() {
    const cond = x => y => b => b ? x : y;

    assert.equal(
      $.rotr(cond) (false) ("foo") ("bar"),
      "bar"
    );
  });
});

describe("swap", function() {
  it("should return 1", function() {
    const sub = (m, n) => m - n;

    assert.equal(
      $.swap(sub) (2, 3),
      1
    );
  });
});

describe("tap", function() {
  it("should return 2", function() {
    assert.equal(
      $.tap(console.log) (2),
      2
    );
  });
});

describe("uncurry", function() {
  it("should return -1", function() {
    const sub = m => n => m - n;

    assert.equal(
      $.uncurry(sub) (2, 3),
      -1
    );
  });
});

describe("uncurry3", function() {
  it("should return 10", function() {
    const reduce = f => acc => xs => xs.reduce(f, acc),
      add = (m, n) => m + n;

    assert.equal(
      $.uncurry3(reduce) (add, 0, [1,2,3,4]),
      10
    );
  });
});

describe("loop", function() {
  describe("recur", function() {
    it("should return 55", function() {
      const fib = n_ =>
        $.loop((x = 0, y = 1, n = n_) =>
          n < 2
            ? y
            : $.recur(y, x + y, n - 1));

      assert.equal(
        fib(10),
        55
      );
    });
  });
});