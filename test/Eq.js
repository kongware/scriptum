const $ = require("../index");
const assert = require("assert");

describe("eq", function() {
  describe("Char", function() {
    it("should return true", function() {
      assert.equal(
        $.Char("a").valueOf() === $.Char("a").valueOf(),
        true
      );
    });
  });

  describe("Char", function() {
    it("should return false", function() {
      assert.equal(
        $.eq($.Char("a")) ($.Char("b")),
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
});

describe("neq", function() {
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
});
