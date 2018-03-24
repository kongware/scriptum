const $ = require("../index");
const assert = require("assert");

describe("notp", function() {
  it("should return false", function() {
    const eq = x => y => x === y;

    assert.equal(
      $.notp(eq(2)) (2),
      false
    );
  });
});

