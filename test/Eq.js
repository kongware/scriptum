const $ = require("../index");
const assert = require("assert");

describe("eq", function() {
  describe("Array", function() {
    it("should return true", function() {
      assert.equal(
        $.eq($.Arr([1,2,3])) ($.Arr([1,2,3])),
        true
      );
    });
  });

  describe("Array", function() {
    it("should return true", function() {
      assert.equal(
        $.eq($.Arr([])) ($.Arr([])),
        true
      );
    });
  });

  describe("Array", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Arr([1,2,3])) ($.Arr([1,0,3])),
        false
      );
    });
  });

  describe("Array", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Arr([1,2,3])) ($.Arr([1,2])),
        false
      );
    });
  });

  describe("Array", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Arr([1,2,3])) ($.Arr([1,2,3,4])),
        false
      );
    });
  });

  describe("Char", function() {
    // mocha bug
  });

  describe("Char", function() {
    // mocha bug
  });

  describe("Comparator", function() {
    it("should return true", function() {
      assert.equal(
        $.eq($.EQ) ($.EQ),
        true
      );
    });
  });

  describe("Comparator", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.LT) ($.GT),
        false
      );
    });
  });

  describe("Float", function() {
    // mocha bug
  });

  describe("Float", function() {
    // mocha bug
  });

  describe("Int", function() {
    // mocha bug
  });

  describe("Int", function() {
    // mocha bug
  });

  describe("Map", function() {
    it("should return true", function() {
      assert.equal(
        $.eq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[true, 1]]))),
        true
      );
    });
  });

  describe("Map", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[true, 2]]))),
        false
      );
    });
  });

  describe("Map", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[false, 1]]))),
        false
      );
    });
  });

  describe("Map", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[true, 1], [false, 0]]))),
        false
      );
    });
  });

  describe("Null", function() {
    it("should return true", function() {
      assert.equal(
        $.eq(null) (null),
        true
      );
    });
  });

  describe("Null", function() {
    it("should return false", function() {
      assert.equal(
        $.eq(null) (2),
        false
      );
    });
  });

  describe("Number", function() {
    it("should return true", function() {
      assert.equal(
        $.eq(2) (2),
        true
      );
    });
  });

  describe("Number", function() {
    it("should return false", function() {
      assert.equal(
        $.eq(2) (3),
        false
      );
    });
  });

  describe("Record", function() {
    it("should return true", function() {
      assert.equal(
        $.eq($.Rec({foo: 2})) ($.Rec({foo: 2})),
        true
      );
    });
  });

  describe("Record", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Rec({foo: 2})) ($.Rec({foo: 3})),
        false
      );
    });
  });

  describe("Record", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Rec({foo: 2})) ($.Rec({bar: 2})),
        false
      );
    });
  });

  describe("Record", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Rec({foo: 2})) ($.Rec({foo: 2, bar: 2})),
        false
      );
    });
  });

  describe("Record", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Rec({foo: 2})) ($.Rec({})),
        false
      );
    });
  });

  describe("Set", function() {
    it("should return true", function() {
      assert.equal(
        $.eq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,2,3]))),
        true
      );
    });
  });

  describe("Set", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,0,3]))),
        false
      );
    });
  });

  describe("Set", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,2]))),
        false
      );
    });
  });

  describe("Set", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,2,3,4]))),
        false
      );
    });
  });

  describe("String", function() {
    it("should return true", function() {
      assert.equal(
        $.eq("foo") ("foo"),
        true
      );
    });
  });

  describe("String", function() {
    it("should return false", function() {
      assert.equal(
        $.eq("foo") ("bar"),
        false
      );
    });
  });

  describe("Tuple", function() {
    it("should return true", function() {
      assert.equal(
        $.eq($.Tup(2, "foo", true)) ($.Tup(2, "foo", true)),
        true
      );
    });
  });

  describe("Tuple", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Tup(2, "foo", true)) ($.Tup(2, "foo", false)),
        false
      );
    });
  });

  describe("Tuple", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Tup(2, "foo", true)) ($.Tup(2, "foo")),
        false
      );
    });
  });

  describe("Tuple", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Tup(2, "foo", true)) ($.Tup(2, "foo", true, null)),
        false
      );
    });
  });
});

/*********************************** neq *************************************/

describe("neq", function() {
  describe("Array", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Arr([1,2,3])) ($.Arr([1,0,3])),
        true
      );
    });
  });

  describe("Array", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Arr([1,2,3])) ($.Arr([1,2])),
        true
      );
    });
  });

  describe("Array", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Arr([1,2,3])) ($.Arr([1,2,3,4])),
        true
      );
    });
  });

  describe("Array", function() {
    it("should return false", function() {
      assert.equal(
        $.neq($.Arr([1,2,3])) ($.Arr([1,2,3])),
        false
      );
    });
  });

  describe("Char", function() {
    // mocha bug
  });

  describe("Char", function() {
    // mocha bug
  });

  describe("Comparator", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.LT) ($.GT),
        true
      );
    });
  });

  describe("Comparator", function() {
    it("should return false", function() {
      assert.equal(
        $.neq($.LT) ($.LT),
        false
      );
    });
  });

  describe("Float", function() {
    // mocha bug
  });

  describe("Float", function() {
    // mocha bug
  });

  describe("Int", function() {
    // mocha bug
  });

  describe("Int", function() {
    // mocha bug
  });

  describe("Map", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[true, 2]]))),
        true
      );
    });
  });

  describe("Map", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[false, 1]]))),
        true
      );
    });
  });

  describe("Map", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[true, 1], [false, 0]]))),
        true
      );
    });
  });

  describe("Map", function() {
    it("should return false", function() {
      assert.equal(
        $.neq($._Map(new Map([[true, 1]]))) ($._Map(new Map([[true, 1]]))),
        false
      );
    });
  });

  describe("Null", function() {
    it("should return true", function() {
      assert.equal(
        $.neq(null) (2),
        true
      );
    });
  });

  describe("Null", function() {
    it("should return false", function() {
      assert.equal(
        $.neq(null) (null),
        false
      );
    });
  });

  describe("Number", function() {
    it("should return true", function() {
      assert.equal(
        $.neq(2) (3),
        true
      );
    });
  });

  describe("Number", function() {
    it("should return false", function() {
      assert.equal(
        $.neq(2) (2),
        false
      );
    });
  });

  describe("Record", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Rec({foo: 2})) ($.Rec({foo: 3})),
        true
      );
    });
  });

  describe("Record", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Rec({foo: 2})) ($.Rec({bar: 2})),
        true
      );
    });
  });

  describe("Record", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Rec({foo: 2})) ($.Rec({})),
        true
      );
    });
  });

  describe("Record", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Rec({foo: 2})) ($.Rec({foo: 2, bar: 2})),
        true
      );
    });
  });

  describe("Record", function() {
    it("should return false", function() {
      assert.equal(
        $.neq($.Rec({foo: 2})) ($.Rec({foo: 2})),
        false
      );
    });
  });

  describe("Set", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,0,3]))),
        true
      );
    });
  });

  describe("Set", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,2]))),
        true
      );
    });
  });

  describe("Set", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,2,3,4]))),
        true
      );
    });
  });

  describe("Set", function() {
    it("should return false", function() {
      assert.equal(
        $.neq($._Set(new Set([1,2,3]))) ($._Set(new Set([1,2,3]))),
        false
      );
    });
  });

  describe("String", function() {
    it("should return true", function() {
      assert.equal(
        $.neq("foo") ("bar"),
        true
      );
    });
  });

  describe("String", function() {
    it("should return false", function() {
      assert.equal(
        $.neq("foo") ("foo"),
        false
      );
    });
  });

  describe("Tuple", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Tup(2, "foo", true)) ($.Tup(2, "foo", false)),
        true
      );
    });
  });

  describe("Tuple", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Tup(2, "foo", true)) ($.Tup(2, "foo")),
        true
      );
    });
  });

  describe("Tuple", function() {
    it("should return true", function() {
      assert.equal(
        $.neq($.Tup(2, "foo", true)) ($.Tup(2, "foo", true, null)),
        true
      );
    });
  });

  describe("Tuple", function() {
    it("should return false", function() {
      assert.equal(
        $.neq($.Tup(2, "foo", true)) ($.Tup(2, "foo", true)),
        false
      );
    });
  });
});
