const $ = require('../scriptum');
const assert = require('assert');

describe('apply', function() {
  it('should return 3', function() {
    const inc = n => n + 1;

    assert.equal(
      $.apply(inc) (2),
      3
    );
  });
});

describe('co', function() {
  it('should return true', function() {
    assert.equal(
      $.co(true) (false),
      true
    );
  });
});

describe('co2', function() {
  it('should return false', function() {
    assert.equal(
      $.co2(true) (false),
      false
    );
  });
});

describe('comp2', function() {
  it('should return 6', function() {
    const add = m => n => m + n,
      inc = n => n + 1;

    assert.equal(
      $.comp2(inc) (add) (2) (3),
      6
    );
  });
});
